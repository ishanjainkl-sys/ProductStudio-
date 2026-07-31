import { describe, expect, it } from "vitest";
import { pageDocumentSchema } from "./page.js";

describe("pageDocumentSchema", () => {
  it("accepts a valid PageDocument", () => {
    const doc = {
      schemaVersion: 1,
      pageId: "pg_01",
      projectId: "prj_01",
      name: "Home",
      slug: "/",
      seo: { title: "Home" },
      theme: { overrides: {} },
      root: {
        id: "nd_root",
        type: "layout.section",
        props: {},
        responsiveProps: {},
        children: [],
      },
      metadata: {
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
        createdBy: "usr_01",
        version: 1,
      },
    };
    expect(pageDocumentSchema.safeParse(doc).success).toBe(true);
  });
});
