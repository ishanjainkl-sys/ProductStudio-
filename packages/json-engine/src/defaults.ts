import {
  CURRENT_SCHEMA_VERSION,
  generateId,
  type PageDocument,
  type UserId,
  type ProjectId,
  type PageId,
} from "@productstudio/shared-types";

export function createEmptyPageDocument(input: {
  pageId: PageId;
  projectId: ProjectId;
  name: string;
  slug: string;
  createdBy: UserId;
  viewport?: "desktop" | "tablet" | "mobile";
}): PageDocument {
  const now = new Date().toISOString();
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    pageId: input.pageId,
    projectId: input.projectId,
    name: input.name,
    slug: input.slug,
    seo: {
      title: input.name,
      description: "",
      ogImageAssetId: null,
    },
    theme: { overrides: {} },
    root: {
      id: generateId("nd"),
      type: "layout.section",
      props: {
        padding: { top: 0, bottom: 0, left: 0, right: 0 },
      },
      responsiveProps: {},
      children: [],
    },
    metadata: {
      createdAt: now,
      updatedAt: now,
      createdBy: input.createdBy,
      version: 1,
      viewport: input.viewport,
      isBlank: true,
    },
  };
}

export function slugify(name: string): string {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "page";
}
