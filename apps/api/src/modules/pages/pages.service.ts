import { generateId, type PageDocument } from "@productstudio/shared-types";
import type { CreatePageInput, UpdatePageInput } from "@productstudio/shared-schemas";
import { pageDocumentSchema } from "@productstudio/shared-schemas";
import {
  cloneDocumentWithNewIds,
  createEmptyPageDocument,
  migratePageDocument,
  slugify,
} from "@productstudio/json-engine";
import { componentRegistry } from "@productstudio/component-registry";
import { prisma } from "../../db/prisma.js";
import {
  NotFoundError,
  UnprocessableError,
  ValidationError,
  VersionConflictError,
} from "../../lib/errors.js";
import { requireProjectAccess } from "../projects/projects.service.js";
import { syncAssetReferences } from "../assets/asset-refs.js";

async function getOwnedPage(pageId: string, userId: string) {
  const page = await prisma.page.findFirst({
    where: { id: pageId, deletedAt: null },
    include: { project: true },
  });
  if (!page || page.project.deletedAt) throw new NotFoundError("Page not found");
  if (page.project.ownerId !== userId) throw new NotFoundError("Page not found");
  return page;
}

function validateNesting(node: PageDocument["root"], parentType?: string): void {
  if (parentType && !componentRegistry.canDrop(parentType, node.type)) {
    throw new UnprocessableError(`Invalid nesting: ${node.type} inside ${parentType}`);
  }
  const def = componentRegistry.get(node.type);
  if (node.children?.length && !def.acceptsChildren) {
    throw new UnprocessableError(`Component ${node.type} does not accept children`);
  }
  for (const child of node.children ?? []) {
    validateNesting(child, node.type);
  }
}

export async function listPages(projectId: string, userId: string) {
  await requireProjectAccess(projectId, userId);
  const pages = await prisma.page.findMany({
    where: { projectId, deletedAt: null },
    orderBy: { sortOrder: "asc" },
  });
  return pages.map((p) => ({
    id: p.id,
    projectId: p.projectId,
    name: p.name,
    slug: p.slug,
    isHome: p.isHome,
    version: p.version,
    seoTitle: p.seoTitle,
    seoDescription: p.seoDescription,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));
}

export async function createPage(projectId: string, userId: string, input: CreatePageInput) {
  await requireProjectAccess(projectId, userId);
  const slug = input.slug ?? slugify(input.name);
  const clash = await prisma.page.findFirst({
    where: { projectId, slug, deletedAt: null },
  });
  if (clash) throw new ValidationError("Slug must be unique within project");

  const maxOrder = await prisma.page.aggregate({
    where: { projectId, deletedAt: null },
    _max: { sortOrder: true },
  });

  const pageId = generateId("pg");
  const content = createEmptyPageDocument({
    pageId,
    projectId,
    name: input.name,
    slug,
    createdBy: userId,
  });

  const page = await prisma.page.create({
    data: {
      id: pageId,
      projectId,
      name: input.name,
      slug,
      isHome: false,
      sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
      contentJson: content,
      seoTitle: input.name,
      version: 1,
    },
  });

  await prisma.project.update({ where: { id: projectId }, data: { updatedAt: new Date() } });

  return {
    id: page.id,
    projectId: page.projectId,
    name: page.name,
    slug: page.slug,
    isHome: page.isHome,
    version: page.version,
  };
}

export async function getPage(pageId: string, userId: string) {
  const page = await getOwnedPage(pageId, userId);
  const content = migratePageDocument(page.contentJson as unknown as PageDocument);
  return {
    id: page.id,
    projectId: page.projectId,
    name: page.name,
    slug: page.slug,
    isHome: page.isHome,
    version: page.version,
    seoTitle: page.seoTitle,
    seoDescription: page.seoDescription,
    contentJson: content,
    createdAt: page.createdAt.toISOString(),
    updatedAt: page.updatedAt.toISOString(),
  };
}

export async function updatePage(pageId: string, userId: string, input: UpdatePageInput) {
  const page = await getOwnedPage(pageId, userId);

  if (input.slug && input.slug !== page.slug) {
    const clash = await prisma.page.findFirst({
      where: { projectId: page.projectId, slug: input.slug, deletedAt: null, NOT: { id: pageId } },
    });
    if (clash) throw new ValidationError("Slug must be unique within project");
  }

  if (input.isHome === true) {
    await prisma.$transaction([
      prisma.page.updateMany({
        where: { projectId: page.projectId, isHome: true },
        data: { isHome: false },
      }),
      prisma.page.update({
        where: { id: pageId },
        data: {
          isHome: true,
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.slug !== undefined ? { slug: input.slug } : {}),
          ...(input.seoTitle !== undefined ? { seoTitle: input.seoTitle } : {}),
          ...(input.seoDescription !== undefined ? { seoDescription: input.seoDescription } : {}),
        },
      }),
    ]);
  } else {
    await prisma.page.update({
      where: { id: pageId },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.slug !== undefined ? { slug: input.slug } : {}),
        ...(input.seoTitle !== undefined ? { seoTitle: input.seoTitle } : {}),
        ...(input.seoDescription !== undefined ? { seoDescription: input.seoDescription } : {}),
        ...(input.isHome === false ? { isHome: false } : {}),
      },
    });
  }

  return getPage(pageId, userId);
}

export async function savePage(
  pageId: string,
  userId: string,
  contentJson: PageDocument,
  expectedVersion: number,
) {
  const page = await getOwnedPage(pageId, userId);
  if (page.version !== expectedVersion) {
    throw new VersionConflictError(page.version);
  }

  const parsed = pageDocumentSchema.parse(contentJson);
  validateNesting(parsed.root as PageDocument["root"]);

  const nextVersion = page.version + 1;
  const savedAt = new Date();
  const nextDoc: PageDocument = {
    ...(parsed as PageDocument),
    pageId: page.id,
    projectId: page.projectId,
    metadata: {
      ...(parsed as PageDocument).metadata,
      version: nextVersion,
      updatedAt: savedAt.toISOString(),
    },
  };

  await prisma.$transaction(async (tx) => {
    await tx.page.update({
      where: { id: pageId },
      data: {
        contentJson: nextDoc,
        version: nextVersion,
        updatedAt: savedAt,
        seoTitle: nextDoc.seo.title ?? page.seoTitle,
        seoDescription: nextDoc.seo.description ?? page.seoDescription,
      },
    });
    await tx.project.update({
      where: { id: page.projectId },
      data: { updatedAt: savedAt },
    });
    await syncAssetReferences(tx, pageId, nextDoc);
  });

  return {
    pageId,
    version: nextVersion,
    savedAt: savedAt.toISOString(),
  };
}

export async function duplicatePage(pageId: string, userId: string) {
  const page = await getOwnedPage(pageId, userId);
  const source = migratePageDocument(page.contentJson as unknown as PageDocument);
  const newId = generateId("pg");
  const baseSlug = `${page.slug === "/" ? "home" : page.slug}-copy`;
  let slug = baseSlug;
  let i = 2;
  while (
    await prisma.page.findFirst({
      where: { projectId: page.projectId, slug, deletedAt: null },
    })
  ) {
    slug = `${baseSlug}-${i++}`;
  }

  const { doc } = cloneDocumentWithNewIds({
    ...source,
    pageId: newId,
    name: `${page.name} Copy`,
    slug,
    metadata: {
      ...source.metadata,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: userId,
    },
  });

  const maxOrder = await prisma.page.aggregate({
    where: { projectId: page.projectId, deletedAt: null },
    _max: { sortOrder: true },
  });

  const created = await prisma.page.create({
    data: {
      id: newId,
      projectId: page.projectId,
      name: `${page.name} Copy`,
      slug,
      isHome: false,
      sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
      contentJson: doc,
      seoTitle: doc.seo.title ?? `${page.name} Copy`,
      seoDescription: doc.seo.description ?? "",
      version: 1,
    },
  });

  await syncAssetReferences(prisma, newId, doc);

  return {
    id: created.id,
    projectId: created.projectId,
    name: created.name,
    slug: created.slug,
    isHome: created.isHome,
    version: created.version,
  };
}

export async function deletePage(pageId: string, userId: string) {
  const page = await getOwnedPage(pageId, userId);
  const count = await prisma.page.count({
    where: { projectId: page.projectId, deletedAt: null },
  });
  if (count <= 1) {
    throw new ValidationError("A project must always have at least one page");
  }
  if (page.isHome) {
    throw new ValidationError("Designate a new home page before deleting the current home page");
  }
  await prisma.page.update({
    where: { id: pageId },
    data: { deletedAt: new Date() },
  });
  return { ok: true };
}

export async function reorderPages(
  projectId: string,
  userId: string,
  pageIds: string[],
) {
  await requireProjectAccess(projectId, userId);
  await prisma.$transaction(
    pageIds.map((id, index) =>
      prisma.page.updateMany({
        where: { id, projectId, deletedAt: null },
        data: { sortOrder: index },
      }),
    ),
  );
  return listPages(projectId, userId);
}
