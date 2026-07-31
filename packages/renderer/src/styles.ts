import type { ComponentDefinition } from "@productstudio/component-sdk";
import type { ComponentNode } from "@productstudio/shared-types";
import type { CSSProperties } from "react";

export function nodeClassName(nodeId: string): string {
  return `ps-${nodeId.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}

export function propsToInlineStyle(
  def: ComponentDefinition,
  props: Record<string, unknown>,
): CSSProperties {
  if (!def.styleMap) return {};
  const css: Record<string, string> = {};
  for (const [key, mapper] of Object.entries(def.styleMap)) {
    if (!mapper) continue;
    const value = props[key];
    if (value === undefined || value === null) continue;
    Object.assign(css, mapper(value as never));
  }
  // Convert kebab-case CSS to React camelCase
  const style: CSSProperties = {};
  for (const [k, v] of Object.entries(css)) {
    const camel = k.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    (style as Record<string, string>)[camel] = v;
  }
  return style;
}

export function collectAssetIds(node: ComponentNode): string[] {
  const ids: string[] = [];
  const walk = (value: unknown) => {
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (value && typeof value === "object") {
      const obj = value as Record<string, unknown>;
      if (obj.$ref === "asset" && typeof obj.id === "string") {
        ids.push(obj.id);
      }
      for (const v of Object.values(obj)) walk(v);
    }
  };
  walk(node.props);
  walk(node.responsiveProps);
  for (const child of node.children ?? []) {
    ids.push(...collectAssetIds(child));
  }
  return [...new Set(ids)];
}
