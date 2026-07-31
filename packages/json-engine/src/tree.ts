import type { ComponentNode, NodeId } from "@productstudio/shared-types";

export function findNode(root: ComponentNode, nodeId: NodeId): ComponentNode | null {
  if (root.id === nodeId) return root;
  for (const child of root.children ?? []) {
    const found = findNode(child, nodeId);
    if (found) return found;
  }
  return null;
}

export function findParent(
  root: ComponentNode,
  nodeId: NodeId,
): { parent: ComponentNode; index: number } | null {
  const children = root.children ?? [];
  for (let i = 0; i < children.length; i++) {
    const child = children[i]!;
    if (child.id === nodeId) return { parent: root, index: i };
    const nested = findParent(child, nodeId);
    if (nested) return nested;
  }
  return null;
}

export function cloneNode(node: ComponentNode): ComponentNode {
  return structuredClone(node);
}

export function mapTree(
  node: ComponentNode,
  fn: (n: ComponentNode) => ComponentNode,
): ComponentNode {
  const mapped = fn(node);
  if (!mapped.children) return mapped;
  return {
    ...mapped,
    children: mapped.children.map((c) => mapTree(c, fn)),
  };
}

export function collectNodeIds(node: ComponentNode): Set<string> {
  const ids = new Set<string>([node.id]);
  for (const child of node.children ?? []) {
    for (const id of collectNodeIds(child)) ids.add(id);
  }
  return ids;
}
