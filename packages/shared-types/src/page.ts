import type { Breakpoint } from "./breakpoints.js";
import type { AssetId, NodeId, PageId, ProjectId, UserId } from "./ids.js";

/** Asset reference: { "$ref": "asset", "id": "..." } */
export interface AssetRef {
  $ref: "asset";
  id: AssetId;
}

/** Node reference: { "$ref": "node", "id": "..." } */
export interface NodeRef {
  $ref: "node";
  id: NodeId;
}

export function isAssetRef(value: unknown): value is AssetRef {
  return (
    typeof value === "object" &&
    value !== null &&
    "$ref" in value &&
    (value as AssetRef).$ref === "asset" &&
    typeof (value as AssetRef).id === "string"
  );
}

export function isNodeRef(value: unknown): value is NodeRef {
  return (
    typeof value === "object" &&
    value !== null &&
    "$ref" in value &&
    (value as NodeRef).$ref === "node" &&
    typeof (value as NodeRef).id === "string"
  );
}

export interface SpacingBox {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface ComponentNode {
  id: NodeId;
  type: string;
  props: Record<string, unknown>;
  responsiveProps: {
    tablet?: Record<string, unknown>;
    mobile?: Record<string, unknown>;
  };
  /** Present when the component accepts children; omitted for leaf nodes. */
  children?: ComponentNode[];
  /** Reserved for V2+ dynamic data binding (schema present in V1). */
  dataBinding?: Record<string, unknown> | null;
}

export interface PageSeo {
  title?: string;
  description?: string;
  ogImageAssetId?: AssetId | null;
}

export interface PageDocument {
  schemaVersion: number;
  pageId: PageId;
  projectId: ProjectId;
  name: string;
  slug: string;
  seo: PageSeo;
  theme: { overrides: Record<string, unknown> };
  root: ComponentNode;
  metadata: {
    createdAt: string;
    updatedAt: string;
    createdBy: UserId;
    version: number;
    viewport?: "desktop" | "tablet" | "mobile";
    isBlank?: boolean;
    dimensions?: Partial<Record<Breakpoint, { width: number; height: number }>>;
  };
}

export type SaveStatus = "saved" | "saving" | "unsaved" | "error";

export interface BuilderState {
  page: PageDocument;
  selectedNodeId: NodeId | null;
  activeBreakpoint: Breakpoint;
  undoStack: PageDocument[];
  redoStack: PageDocument[];
  saveStatus: SaveStatus;
  lastSavedAt: string | null;
}

export const CURRENT_SCHEMA_VERSION = 1;
