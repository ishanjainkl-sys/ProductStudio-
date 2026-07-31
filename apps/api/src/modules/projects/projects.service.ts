import { generateId, DEFAULT_THEME_TOKENS } from "@productstudio/shared-types";
import type { CreateProjectInput, UpdateProjectInput } from "@productstudio/shared-schemas";
import { createEmptyPageDocument, cloneDocumentWithNewIds, slugify } from "@productstudio/json-engine";
import type { PageDocument } from "@productstudio/shared-types";
import { prisma } from "../../db/prisma.js";
import { ForbiddenError, NotFoundError, ValidationError } from "../../lib/errors.js";

async function assertOwnedProject(projectId: string, userId: string, includeDeleted = false) {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      ownerId: userId,
      ...(includeDeleted ? {} : { deletedAt: null }),
    },
  });
  if (!project) throw new NotFoundError("Project not found");
  return project;
}

export async function listProjects(
  userId: string,
  opts: { page: number; pageSize: number; query: string },
) {
  const where = {
    ownerId: userId,
    deletedAt: null,
    ...(opts.query
      ? { name: { contains: opts.query, mode: "insensitive" as const } }
      : {}),
  };
  const [total, items] = await Promise.all([
    prisma.project.count({ where }),
    prisma.project.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (opts.page - 1) * opts.pageSize,
      take: opts.pageSize,
    }),
  ]);
  return {
    data: items.map((p) => ({
      id: p.id,
      name: p.name,
      ownerId: p.ownerId,
      templateVersionId: p.templateVersionId,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      deletedAt: p.deletedAt?.toISOString() ?? null,
      saveStatus: "saved" as const,
    })),
    page: opts.page,
    pageSize: opts.pageSize,
    total,
  };
}

export async function listRecentlyDeleted(userId: string) {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60_000);
  const items = await prisma.project.findMany({
    where: {
      ownerId: userId,
      deletedAt: { gte: since },
    },
    orderBy: { deletedAt: "desc" },
  });
  return items.map((p) => ({
    id: p.id,
    name: p.name,
    ownerId: p.ownerId,
    templateVersionId: p.templateVersionId,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    deletedAt: p.deletedAt?.toISOString() ?? null,
  }));
}

async function initializeProjectDefaults(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  input: {
    projectId: string;
    ownerId: string;
    name: string;
    description?: string | null;
    templateVersionId?: string | null;
  },
) {
  const project = await tx.project.create({
    data: {
      id: input.projectId,
      name: input.name,
      description: input.description ?? null,
      ownerId: input.ownerId,
      templateVersionId: input.templateVersionId ?? null,
    },
  });

  await tx.theme.create({
    data: {
      id: generateId("thm"),
      projectId: project.id,
      tokensJson: DEFAULT_THEME_TOKENS,
    },
  });

  return project;
}

export async function createBlankProject(ownerId: string, input: Extract<CreateProjectInput, { source: "blank" }>) {
  const existing = await prisma.project.findFirst({
    where: { ownerId, name: input.name, deletedAt: null },
  });
  if (existing) throw new ValidationError("Project name must be unique per owner");

  const projectId = generateId("prj");
  const pageId = generateId("pg");

  const result = await prisma.$transaction(async (tx) => {
    const project = await initializeProjectDefaults(tx, {
      projectId,
      ownerId,
      name: input.name,
      description: input.description,
    });

    const content = createEmptyPageDocument({
      pageId,
      projectId,
      name: "Home",
      slug: "/",
      createdBy: ownerId,
    });

    const page = await tx.page.create({
      data: {
        id: pageId,
        projectId,
        name: "Home",
        slug: "/",
        isHome: true,
        sortOrder: 0,
        contentJson: content,
        seoTitle: "Home",
        seoDescription: "",
        version: 1,
      },
    });

    return { project, page, content };
  });

  return {
    project: {
      id: result.project.id,
      name: result.project.name,
      ownerId: result.project.ownerId,
      templateVersionId: null,
      createdAt: result.project.createdAt.toISOString(),
      updatedAt: result.project.updatedAt.toISOString(),
      deletedAt: null,
    },
    page: {
      id: result.page.id,
      projectId: result.page.projectId,
      name: result.page.name,
      slug: result.page.slug,
      isHome: result.page.isHome,
      version: result.page.version,
    },
  };
}

export async function createProjectFromTemplate(
  ownerId: string,
  input: Extract<CreateProjectInput, { source: "template" }>,
) {
  const existing = await prisma.project.findFirst({
    where: { ownerId, name: input.name, deletedAt: null },
  });
  if (existing) throw new ValidationError("Project name must be unique per owner");

  const version = await prisma.templateVersion.findUnique({
    where: { id: input.templateVersionId },
    include: { pages: { orderBy: { sortOrder: "asc" } } },
  });
  if (!version) throw new NotFoundError("Template version not found");

  const projectId = generateId("prj");

  const result = await prisma.$transaction(async (tx) => {
    const project = await initializeProjectDefaults(tx, {
      projectId,
      ownerId,
      name: input.name,
      description: input.description,
      templateVersionId: version.id,
    });

    const pages = [];
    for (const tPage of version.pages) {
      const pageId = generateId("pg");
      const source = tPage.contentJson as unknown as PageDocument;
      const { doc } = cloneDocumentWithNewIds({
        ...source,
        pageId,
        projectId,
        name: tPage.name,
        slug: tPage.slug,
        metadata: {
          ...source.metadata,
          createdBy: ownerId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: 1,
        },
      });

      const page = await tx.page.create({
        data: {
          id: pageId,
          projectId,
          name: tPage.name,
          slug: tPage.slug,
          isHome: tPage.isHome,
          sortOrder: tPage.sortOrder,
          contentJson: doc,
          seoTitle: doc.seo.title ?? tPage.name,
          seoDescription: doc.seo.description ?? "",
          version: 1,
        },
      });
      pages.push(page);
    }

    if (pages.length === 0) {
      const pageId = generateId("pg");
      const content = createEmptyPageDocument({
        pageId,
        projectId,
        name: "Home",
        slug: "/",
        createdBy: ownerId,
      });
      pages.push(
        await tx.page.create({
          data: {
            id: pageId,
            projectId,
            name: "Home",
            slug: "/",
            isHome: true,
            sortOrder: 0,
            contentJson: content,
            version: 1,
          },
        }),
      );
    }

    return { project, pages };
  });

  return {
    project: {
      id: result.project.id,
      name: result.project.name,
      ownerId: result.project.ownerId,
      templateVersionId: result.project.templateVersionId,
      createdAt: result.project.createdAt.toISOString(),
      updatedAt: result.project.updatedAt.toISOString(),
      deletedAt: null,
    },
    page: {
      id: result.pages[0]!.id,
      projectId: result.pages[0]!.projectId,
      name: result.pages[0]!.name,
      slug: result.pages[0]!.slug,
      isHome: result.pages[0]!.isHome,
      version: result.pages[0]!.version,
    },
  };
}

export async function getProject(projectId: string, userId: string) {
  const project = await assertOwnedProject(projectId, userId);
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    ownerId: project.ownerId,
    templateVersionId: project.templateVersionId,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    deletedAt: null,
  };
}

export async function updateProject(
  projectId: string,
  userId: string,
  input: UpdateProjectInput,
) {
  await assertOwnedProject(projectId, userId);
  if (input.name) {
    const clash = await prisma.project.findFirst({
      where: {
        ownerId: userId,
        name: input.name,
        deletedAt: null,
        NOT: { id: projectId },
      },
    });
    if (clash) throw new ValidationError("Project name must be unique per owner");
  }
  const project = await prisma.project.update({
    where: { id: projectId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
    },
  });
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    ownerId: project.ownerId,
    templateVersionId: project.templateVersionId,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    deletedAt: project.deletedAt?.toISOString() ?? null,
  };
}

export async function softDeleteProject(projectId: string, userId: string) {
  await assertOwnedProject(projectId, userId);
  const now = new Date();
  await prisma.$transaction([
    prisma.project.update({ where: { id: projectId }, data: { deletedAt: now } }),
    prisma.page.updateMany({ where: { projectId }, data: { deletedAt: now } }),
    prisma.asset.updateMany({ where: { projectId }, data: { deletedAt: now } }),
  ]);
  return { ok: true };
}

export async function restoreProject(projectId: string, userId: string) {
  const project = await assertOwnedProject(projectId, userId, true);
  if (!project.deletedAt) throw new ValidationError("Project is not deleted");
  await prisma.$transaction([
    prisma.project.update({ where: { id: projectId }, data: { deletedAt: null } }),
    prisma.page.updateMany({ where: { projectId }, data: { deletedAt: null } }),
    prisma.asset.updateMany({ where: { projectId }, data: { deletedAt: null } }),
  ]);
  return getProject(projectId, userId);
}

export { assertOwnedProject, slugify };

export async function requireProjectAccess(projectId: string, userId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, deletedAt: null },
  });
  if (!project) throw new NotFoundError("Project not found");
  if (project.ownerId !== userId) throw new ForbiddenError();
  return project;
}
