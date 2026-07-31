import { describe, expect, it } from "vitest";
import type { PageDocument } from "@productstudio/shared-types";
import { htmlExportTarget } from "./targets.js";

function doc(): PageDocument {
  return {
    schemaVersion: 1,
    pageId: "pg_1",
    projectId: "prj_1",
    name: "Home",
    slug: "/",
    seo: { title: "Home" },
    theme: { overrides: {} },
    root: {
      id: "nd_root",
      type: "layout.section",
      props: { padding: { top: 0, bottom: 0, left: 0, right: 0 }, backgroundColor: "#fff", maxWidth: 1200 },
      responsiveProps: {},
      children: [
        {
          id: "nd_hero",
          type: "marketing.hero",
          props: {
            heading: "Hello",
            subheading: "World",
            ctaLabel: "Go",
            ctaHref: "#",
            backgroundImage: null,
            textAlign: "center",
            padding: { top: 96, bottom: 96, left: 24, right: 24 },
            headingSize: "3xl",
          },
          responsiveProps: { mobile: { textAlign: "left" } },
        },
      ],
    },
    metadata: {
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
      createdBy: "usr_1",
      version: 1,
    },
  };
}

describe("export-engine", () => {
  it("produces deterministic HTML export", async () => {
    const a = await htmlExportTarget.generate(doc(), {});
    const b = await htmlExportTarget.generate(doc(), {});
    expect(a.files.map((f) => f.path)).toEqual(b.files.map((f) => f.path));
    expect(a.files[0]!.content).toEqual(b.files[0]!.content);
    expect(String(a.files[0]!.content)).toContain("Hello");
    expect(String(a.files.find((f) => f.path.endsWith(".css"))!.content)).toContain(
      "@media (max-width: 640px)",
    );
  });
});
