import type { IdPrefix } from "./ids.js";

/** Prefixed UUID — works in Node and modern browsers. */
export function generateId(prefix: IdPrefix): string {
  return `${prefix}_${crypto.randomUUID()}`;
}
