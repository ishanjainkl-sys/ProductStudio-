import type {
  Breakpoint,
  ComponentNode,
  ThemeTokens,
} from "@productstudio/shared-types";
import { isTokenRef } from "@productstudio/shared-types";

/**
 * Prop resolution: breakpoint cascade selects a raw value, then token refs are
 * dereferenced. Theme is not a fallback tier below defaultProps.
 */
export function resolveProp(
  node: ComponentNode,
  key: string,
  breakpoint: Breakpoint,
  defaultProps: Record<string, unknown>,
  theme: ThemeTokens,
): unknown {
  const cascade: Breakpoint[] =
    breakpoint === "mobile"
      ? ["mobile", "tablet", "desktop"]
      : breakpoint === "tablet"
        ? ["tablet", "desktop"]
        : ["desktop"];

  let raw: unknown = undefined;
  for (const bp of cascade) {
    if (bp === "desktop") {
      if (node.props[key] !== undefined) {
        raw = node.props[key];
        break;
      }
    } else {
      const value = node.responsiveProps[bp]?.[key];
      if (value !== undefined) {
        raw = value;
        break;
      }
    }
  }

  if (raw === undefined) {
    raw = defaultProps[key];
  }

  if (isTokenRef(raw)) {
    return resolveToken(theme, raw.$token) ?? defaultProps[key];
  }

  return raw;
}

export function resolveToken(theme: ThemeTokens, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = theme;
  for (const part of parts) {
    if (current === null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

export function resolveAllProps(
  node: ComponentNode,
  breakpoint: Breakpoint,
  defaultProps: Record<string, unknown>,
  theme: ThemeTokens,
): Record<string, unknown> {
  const keys = new Set([
    ...Object.keys(defaultProps),
    ...Object.keys(node.props),
    ...Object.keys(node.responsiveProps.tablet ?? {}),
    ...Object.keys(node.responsiveProps.mobile ?? {}),
  ]);
  const resolved: Record<string, unknown> = {};
  for (const key of keys) {
    resolved[key] = resolveProp(node, key, breakpoint, defaultProps, theme);
  }
  return resolved;
}
