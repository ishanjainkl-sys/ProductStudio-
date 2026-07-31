import {
  generateId,
  type Breakpoint,
  type ComponentNode,
  type NodeId,
  type PageDocument,
} from "@productstudio/shared-types";
import { cloneNode, findNode, findParent, mapTree } from "./tree.js";

function touch(doc: PageDocument): PageDocument {
  return {
    ...doc,
    metadata: {
      ...doc.metadata,
      updatedAt: new Date().toISOString(),
    },
  };
}

function replaceRoot(doc: PageDocument, root: ComponentNode): PageDocument {
  return touch({ ...doc, root });
}

export function insertNode(
  doc: PageDocument,
  parentId: NodeId,
  index: number,
  node: ComponentNode,
): PageDocument {
  const parent = findNode(doc.root, parentId);
  if (!parent) throw new Error(`Parent not found: ${parentId}`);
  if (!parent.children) throw new Error(`Parent does not accept children: ${parentId}`);

  const root = mapTree(doc.root, (n) => {
    if (n.id !== parentId || !n.children) return n;
    const children = [...n.children];
    const clamped = Math.max(0, Math.min(index, children.length));
    children.splice(clamped, 0, cloneNode(node));
    return { ...n, children };
  });

  return replaceRoot(doc, root);
}

export function moveNode(
  doc: PageDocument,
  nodeId: NodeId,
  newParentId: NodeId,
  index: number,
): PageDocument {
  if (nodeId === doc.root.id) throw new Error("Cannot move root node");
  const location = findParent(doc.root, nodeId);
  if (!location) throw new Error(`Node not found: ${nodeId}`);
  const node = location.parent.children![location.index]!;

  // Prevent moving into own descendant
  if (findNode(node, newParentId)) {
    throw new Error("Cannot move a node into its own descendant");
  }

  let without = mapTree(doc.root, (n) => {
    if (n.id !== location.parent.id || !n.children) return n;
    return { ...n, children: n.children.filter((c) => c.id !== nodeId) };
  });

  const newParent = findNode(without, newParentId);
  if (!newParent?.children) throw new Error(`New parent invalid: ${newParentId}`);

  without = mapTree(without, (n) => {
    if (n.id !== newParentId || !n.children) return n;
    const children = [...n.children];
    const clamped = Math.max(0, Math.min(index, children.length));
    children.splice(clamped, 0, cloneNode(node));
    return { ...n, children };
  });

  return replaceRoot(doc, without);
}

export function updateNodeProps(
  doc: PageDocument,
  nodeId: NodeId,
  breakpoint: Breakpoint,
  patch: Record<string, unknown>,
): PageDocument {
  if (!findNode(doc.root, nodeId)) throw new Error(`Node not found: ${nodeId}`);

  const root = mapTree(doc.root, (n) => {
    if (n.id !== nodeId) return n;
    if (breakpoint === "desktop") {
      return { ...n, props: { ...n.props, ...patch } };
    }
    const existing = n.responsiveProps[breakpoint] ?? {};
    return {
      ...n,
      responsiveProps: {
        ...n.responsiveProps,
        [breakpoint]: { ...existing, ...patch },
      },
    };
  });

  return replaceRoot(doc, root);
}

export function resetNodeProp(
  doc: PageDocument,
  nodeId: NodeId,
  breakpoint: "tablet" | "mobile",
  key: string,
): PageDocument {
  const root = mapTree(doc.root, (n) => {
    if (n.id !== nodeId) return n;
    const bpProps = { ...(n.responsiveProps[breakpoint] ?? {}) };
    delete bpProps[key];
    return {
      ...n,
      responsiveProps: {
        ...n.responsiveProps,
        [breakpoint]: Object.keys(bpProps).length ? bpProps : undefined,
      },
    };
  });
  return replaceRoot(doc, root);
}

export function deleteNode(doc: PageDocument, nodeId: NodeId): PageDocument {
  if (nodeId === doc.root.id) throw new Error("Cannot delete root node");
  if (!findParent(doc.root, nodeId)) throw new Error(`Node not found: ${nodeId}`);

  const root = mapTree(doc.root, (n) => {
    if (!n.children) return n;
    if (!n.children.some((c) => c.id === nodeId)) return n;
    return { ...n, children: n.children.filter((c) => c.id !== nodeId) };
  });

  return replaceRoot(doc, root);
}

function regenerateIds(node: ComponentNode, idMap: Map<string, string>): ComponentNode {
  const newId = generateId("nd");
  idMap.set(node.id, newId);
  return {
    ...cloneNode(node),
    id: newId,
    children: node.children?.map((c) => regenerateIds(c, idMap)),
  };
}

function remapRefs(value: unknown, idMap: Map<string, string>): unknown {
  if (Array.isArray(value)) return value.map((v) => remapRefs(v, idMap));
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (obj.$ref === "node" && typeof obj.id === "string" && idMap.has(obj.id)) {
      return { ...obj, id: idMap.get(obj.id) };
    }
    const next: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      next[k] = remapRefs(v, idMap);
    }
    return next;
  }
  return value;
}

export function duplicateNode(doc: PageDocument, nodeId: NodeId): PageDocument {
  if (nodeId === doc.root.id) throw new Error("Cannot duplicate root node");
  const location = findParent(doc.root, nodeId);
  if (!location) throw new Error(`Node not found: ${nodeId}`);
  const source = location.parent.children![location.index]!;
  const idMap = new Map<string, string>();
  let clone = regenerateIds(source, idMap);
  clone = {
    ...clone,
    props: remapRefs(clone.props, idMap) as Record<string, unknown>,
    responsiveProps: remapRefs(clone.responsiveProps, idMap) as ComponentNode["responsiveProps"],
  };

  return insertNode(doc, location.parent.id, location.index + 1, clone);
}

export function cloneDocumentWithNewIds(doc: PageDocument): {
  doc: PageDocument;
  idMap: Map<string, string>;
} {
  const idMap = new Map<string, string>();
  let root = regenerateIds(doc.root, idMap);
  root = {
    ...root,
    props: remapRefs(root.props, idMap) as Record<string, unknown>,
    responsiveProps: remapRefs(root.responsiveProps, idMap) as ComponentNode["responsiveProps"],
    children: root.children?.map((c) => ({
      ...c,
      props: remapRefs(c.props, idMap) as Record<string, unknown>,
      responsiveProps: remapRefs(c.responsiveProps, idMap) as ComponentNode["responsiveProps"],
    })),
  };

  // Deep remap all refs in the tree
  root = mapTree(root, (n) => ({
    ...n,
    props: remapRefs(n.props, idMap) as Record<string, unknown>,
    responsiveProps: remapRefs(n.responsiveProps, idMap) as ComponentNode["responsiveProps"],
  }));

  return {
    doc: {
      ...doc,
      root,
    },
    idMap,
  };
}

export interface JsonEngine {
  insertNode: typeof insertNode;
  moveNode: typeof moveNode;
  updateNodeProps: typeof updateNodeProps;
  deleteNode: typeof deleteNode;
  duplicateNode: typeof duplicateNode;
}

export const jsonEngine: JsonEngine = {
  insertNode,
  moveNode,
  updateNodeProps,
  deleteNode,
  duplicateNode,
};
