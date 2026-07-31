/** Prefixed IDs for log readability (spec §32.1). Stored as strings. */
export type IdPrefix =
  | "usr"
  | "prj"
  | "pg"
  | "nd"
  | "ast"
  | "ref"
  | "tpl"
  | "tvr"
  | "tpg"
  | "thm"
  | "rtk";

export type UserId = string;
export type ProjectId = string;
export type PageId = string;
export type NodeId = string;
export type AssetId = string;
export type TemplateId = string;
export type TemplateVersionId = string;
export type ThemeId = string;
