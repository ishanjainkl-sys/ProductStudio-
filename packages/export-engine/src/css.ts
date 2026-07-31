import type { ComponentNode, ThemeTokens } from "@productstudio/shared-types";
import { BREAKPOINT_MEDIA_QUERIES } from "@productstudio/shared-types";
import { componentRegistry } from "@productstudio/component-registry";
import { resolveAllProps } from "@productstudio/json-engine";
import { nodeClassName } from "@productstudio/renderer";

function declarationsToCss(decls: Record<string, string>): string {
  return Object.entries(decls)
    .map(([k, v]) => `${k}: ${v};`)
    .join(" ");
}

function styleDeclsForProps(
  type: string,
  props: Record<string, unknown>,
): Record<string, string> {
  const def = componentRegistry.get(type);
  if (!def.styleMap) return {};
  const css: Record<string, string> = {};
  for (const [key, mapper] of Object.entries(def.styleMap)) {
    if (!mapper) continue;
    const value = props[key];
    if (value === undefined || value === null) continue;
    Object.assign(css, mapper(value as never));
  }
  return css;
}

function emitNodeCss(node: ComponentNode, theme: ThemeTokens, lines: string[]): void {
  const def = componentRegistry.get(node.type);
  const cls = `.${nodeClassName(node.id)}`;
  const desktop = resolveAllProps(
    node,
    "desktop",
    def.defaultProps as Record<string, unknown>,
    theme,
  );
  const desktopCss = styleDeclsForProps(node.type, desktop);
  if (Object.keys(desktopCss).length) {
    lines.push(`${cls} { ${declarationsToCss(desktopCss)} }`);
  }

  for (const bp of ["tablet", "mobile"] as const) {
    if (!node.responsiveProps[bp] || !Object.keys(node.responsiveProps[bp]!).length) continue;
    const resolved = resolveAllProps(
      node,
      bp,
      def.defaultProps as Record<string, unknown>,
      theme,
    );
    // Only emit keys that are overridden at this breakpoint
    const overrideKeys = Object.keys(node.responsiveProps[bp]!);
    const patch: Record<string, unknown> = {};
    for (const key of overrideKeys) patch[key] = resolved[key];
    const css = styleDeclsForProps(node.type, patch);
    if (Object.keys(css).length) {
      lines.push(
        `@media ${BREAKPOINT_MEDIA_QUERIES[bp]} { ${cls} { ${declarationsToCss(css)} } }`,
      );
    }
  }

  for (const child of node.children ?? []) {
    emitNodeCss(child, theme, lines);
  }
}

export function themeToCssVariables(theme: ThemeTokens): string {
  return `:root {
  --ps-color-primary-50: ${theme.color.primary["50"]};
  --ps-color-primary-500: ${theme.color.primary["500"]};
  --ps-color-primary-900: ${theme.color.primary["900"]};
  --ps-color-neutral-0: ${theme.color.neutral["0"]};
  --ps-color-neutral-100: ${theme.color.neutral["100"]};
  --ps-color-neutral-500: ${theme.color.neutral["500"]};
  --ps-color-neutral-900: ${theme.color.neutral["900"]};
  --ps-font-base: ${theme.typography.fontFamily.base};
  --ps-font-mono: ${theme.typography.fontFamily.mono};
}`;
}

export function generatePageCss(root: ComponentNode, theme: ThemeTokens): string {
  const lines: string[] = [
    themeToCssVariables(theme),
    `body { margin: 0; font-family: var(--ps-font-base); color: var(--ps-color-neutral-900); }`,
  ];
  emitNodeCss(root, theme, lines);
  return lines.join("\n");
}
