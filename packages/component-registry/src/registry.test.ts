import { describe, expect, it } from "vitest";
import { componentRegistry } from "./registry.js";
import { registerBuiltins } from "./register-builtins.js";
import { instantiateComponent } from "./instantiate.js";

describe("component-registry", () => {
  registerBuiltins();

  it("registers components across all categories", () => {
    const cats = new Set(componentRegistry.list().map((d) => d.category));
    expect(cats.has("basic")).toBe(true);
    expect(cats.has("layout")).toBe(true);
    expect(cats.has("marketing")).toBe(true);
    expect(cats.has("business")).toBe(true);
    expect(cats.has("navigation")).toBe(true);
    expect(cats.has("forms")).toBe(true);
    expect(cats.has("utility")).toBe(true);
  });

  it("instantiates with default props and children for containers", () => {
    const section = instantiateComponent("layout.section");
    expect(section.children).toEqual([]);
    expect(section.type).toBe("layout.section");

    const text = instantiateComponent("basic.text");
    expect(text.children).toBeUndefined();
  });

  it("enforces nesting rules", () => {
    expect(componentRegistry.canDrop("layout.section", "marketing.hero")).toBe(true);
    expect(componentRegistry.canDrop("basic.text", "marketing.hero")).toBe(false);
  });
});
