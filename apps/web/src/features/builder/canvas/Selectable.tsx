"use client";

import type { ReactElement, ReactNode } from "react";
import type { ComponentNode } from "@productstudio/shared-types";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { useBuilderStore } from "../state/builder-store";
import { componentRegistry } from "@productstudio/component-registry";

export function Selectable({
  node,
  children,
}: {
  node: ComponentNode;
  children: ReactElement;
}): ReactNode {
  const selectedNodeId = useBuilderStore((s) => s.selectedNodeId);
  const hoveredNodeId = useBuilderStore((s) => s.hoveredNodeId);
  const selectNode = useBuilderStore((s) => s.selectNode);
  const setHovered = useBuilderStore((s) => s.setHovered);
  const def = componentRegistry.get(node.type);

  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
    id: `canvas:${node.id}`,
    data: { type: "canvas-node", nodeId: node.id },
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `drop:${node.id}`,
    data: { type: "drop-container", nodeId: node.id, acceptsChildren: def.acceptsChildren },
    disabled: !def.acceptsChildren,
  });

  const selected = selectedNodeId === node.id;
  const hovered = hoveredNodeId === node.id && !selected;

  return (
    <div
      ref={(el) => {
        setDragRef(el);
        setDropRef(el);
      }}
      {...listeners}
      {...attributes}
      data-ps-node={node.id}
      data-ps-accepts={def.acceptsChildren ? "true" : "false"}
      onClick={(e) => {
        e.stopPropagation();
        selectNode(node.id);
        const article = (e.target as HTMLElement).closest('[data-ps-member-index]');
        if (article) {
          const index = parseInt(article.getAttribute('data-ps-member-index')!, 10);
          window.dispatchEvent(new CustomEvent('ps-edit-team-member', { detail: { nodeId: node.id, index } }));
        } else {
          window.dispatchEvent(new CustomEvent('ps-edit-team-member', { detail: null }));
        }
      }}
      onMouseEnter={(e) => {
        e.stopPropagation();
        setHovered(node.id);
      }}
      onMouseLeave={() => setHovered(null)}
      className={`relative ${def.type === "basic.button" || def.type === "forms.submit" ? "inline-block" : ""}`}
      style={{
        outline: selected
          ? "2px solid #3b6ff0"
          : hovered
            ? "2px solid rgba(59,111,240,0.4)"
            : isOver
              ? "2px dashed #3b6ff0"
              : undefined,
        outlineOffset: 2,
        opacity: isDragging ? 0.5 : 1,
        cursor: "default",
      }}
    >
      {(selected || hovered) && (
        <span className="absolute -top-5 left-0 z-10 rounded bg-primary-500 px-1.5 py-0.5 text-[10px] font-medium text-white">
          {def.displayName}
        </span>
      )}
      {children}
    </div>
  );
}
