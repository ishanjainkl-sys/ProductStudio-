import type { ComponentNode } from "@productstudio/shared-types";
import { generateId } from "@productstudio/shared-types";
import { componentRegistry } from "./registry.js";

export function instantiateComponent(type: string): ComponentNode {
  const def = componentRegistry.get(type);
  return {
    id: generateId("nd"),
    type,
    props: structuredClone(def.defaultProps) as Record<string, unknown>,
    responsiveProps: {},
    ...(def.acceptsChildren ? { children: [] } : {}),
  };
}
