import { describe, expect, it } from "vitest";
import type { PageDocument } from "@productstudio/shared-types";
import { insertNode, deleteNode, updateNodeProps, moveNode } from "./mutations.js";

function baseDoc(): PageDocument {
  return {
    schemaVersion: 1,
    pageId: "pg_1",
    projectId: "prj_1",
    name: "Home",
    slug: "/",
    seo: {},
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
      createdBy: "usr_1",
      version: 1,
    },
  };
}

describe("json-engine mutations", () => {
  it("inserts, updates, moves, and deletes immutably", () => {
    const doc = baseDoc();
    const child = {
      id: "nd_a",
      type: "basic.text",
      props: { text: "Hello" },
      responsiveProps: {},
    };

    const withChild = insertNode(doc, "nd_root", 0, child);
    expect(doc.root.children).toEqual([]);
    expect(withChild.root.children).toHaveLength(1);

    const updated = updateNodeProps(withChild, "nd_a", "desktop", { text: "Hi" });
    expect(updated.root.children![0]!.props.text).toBe("Hi");
    expect(withChild.root.children![0]!.props.text).toBe("Hello");

    const second = {
      id: "nd_b",
      type: "basic.text",
      props: { text: "B" },
      responsiveProps: {},
    };
    const two = insertNode(updated, "nd_root", 1, second);
    const moved = moveNode(two, "nd_b", "nd_root", 0);
    expect(moved.root.children![0]!.id).toBe("nd_b");

    const deleted = deleteNode(moved, "nd_a");
    expect(deleted.root.children).toHaveLength(1);
    expect(deleted.root.children![0]!.id).toBe("nd_b");
  });
});
