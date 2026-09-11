import { generateId, type PageDocument } from "@productstudio/shared-types";
import type { CreateTemplateInput } from "@productstudio/shared-schemas";
import { prisma } from "../../db/prisma.js";
import { NotFoundError } from "../../lib/errors.js";
import { requireProjectAccess } from "../projects/projects.service.js";

export async function listTemplates() {
  const templates = await prisma.template.findMany({
    include: {
      versions: {
        orderBy: { versionNumber: "desc" },
        take: 1,
        include: {
          pages: {
            where: { isHome: true },
            select: { contentJson: true }
          }
        }
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return templates.map((t) => ({
    id: t.id,
    name: t.name,
    category: t.category,
    description: t.description,
    latestVersionId: t.versions[0]?.id ?? null,
    latestVersionNumber: t.versions[0]?.versionNumber ?? null,
    homePageContent: t.versions[0]?.pages?.[0]?.contentJson ?? null,
    createdAt: t.createdAt.toISOString(),
  }));
}

export async function listVersions(templateId: string) {
  const template = await prisma.template.findUnique({ where: { id: templateId } });
  if (!template) throw new NotFoundError("Template not found");
  const versions = await prisma.templateVersion.findMany({
    where: { templateId },
    orderBy: { versionNumber: "desc" },
  });
  return versions.map((v) => ({
    id: v.id,
    templateId: v.templateId,
    versionNumber: v.versionNumber,
    createdAt: v.createdAt.toISOString(),
  }));
}

export async function createTemplateFromProject(
  projectId: string,
  userId: string,
  meta: CreateTemplateInput,
) {
  await requireProjectAccess(projectId, userId);
  const pages = await prisma.page.findMany({
    where: { projectId, deletedAt: null },
    orderBy: { sortOrder: "asc" },
  });

  return prisma.$transaction(async (tx) => {
    const template = await tx.template.create({
      data: {
        id: generateId("tpl"),
        name: meta.name,
        category: meta.category ?? null,
        description: meta.description ?? null,
      },
    });

    const version = await tx.templateVersion.create({
      data: {
        id: generateId("tvr"),
        templateId: template.id,
        versionNumber: 1,
      },
    });

    for (const page of pages) {
      await tx.templatePage.create({
        data: {
          id: generateId("tpg"),
          templateVersionId: version.id,
          name: page.name,
          slug: page.slug,
          isHome: page.isHome,
          sortOrder: page.sortOrder,
          contentJson: structuredClone(page.contentJson) as object,
        },
      });
    }

    return {
      id: template.id,
      name: template.name,
      category: template.category,
      description: template.description,
      versionId: version.id,
      versionNumber: 1,
    };
  });
}

export async function publishNewTemplateVersion(templateId: string, projectId: string, userId: string) {
  await requireProjectAccess(projectId, userId);
  const latest = await prisma.templateVersion.findFirst({
    where: { templateId },
    orderBy: { versionNumber: "desc" },
  });
  if (!latest) throw new NotFoundError("Template not found");

  const pages = await prisma.page.findMany({
    where: { projectId, deletedAt: null },
    orderBy: { sortOrder: "asc" },
  });

  return prisma.$transaction(async (tx) => {
    const version = await tx.templateVersion.create({
      data: {
        id: generateId("tvr"),
        templateId,
        versionNumber: latest.versionNumber + 1,
      },
    });
    for (const page of pages) {
      await tx.templatePage.create({
        data: {
          id: generateId("tpg"),
          templateVersionId: version.id,
          name: page.name,
          slug: page.slug,
          isHome: page.isHome,
          sortOrder: page.sortOrder,
          contentJson: structuredClone(page.contentJson as unknown as PageDocument) as object,
        },
      });
    }
    return {
      id: version.id,
      templateId,
      versionNumber: version.versionNumber,
    };
  });
}
