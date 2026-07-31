import type { ReactElement, ReactNode } from "react";
import type { Breakpoint, ComponentNode, PageDocument, ThemeTokens } from "@productstudio/shared-types";
import { DEFAULT_THEME_TOKENS, isAssetRef } from "@productstudio/shared-types";
import { componentRegistry } from "@productstudio/component-registry";
import { resolveAllProps } from "@productstudio/json-engine";
import { nodeClassName, propsToInlineStyle } from "./styles.js";

export interface PageRendererProps {
  document: PageDocument;
  breakpoint?: Breakpoint;
  isEditing?: boolean;
  theme?: ThemeTokens;
  /** Resolve asset IDs / AssetRef to concrete URLs. */
  resolveAssetUrl?: (assetId: string) => string | null;
  /** Optional wrapper for editing mode (selection chrome). */
  wrapNode?: (node: ComponentNode, element: ReactElement) => ReactNode;
}

function resolveImageProps(
  props: Record<string, unknown>,
  resolveAssetUrl?: (assetId: string) => string | null,
): Record<string, unknown> {
  if (!resolveAssetUrl) return props;
  const next = { ...props };
  for (const [key, value] of Object.entries(next)) {
    if (isAssetRef(value)) {
      next[key] = resolveAssetUrl(value.id);
    } else if (typeof value === "string" && value.startsWith("ast_")) {
      next[key] = resolveAssetUrl(value) ?? value;
    }
  }
  return next;
}

function RenderNode({
  node,
  breakpoint,
  isEditing,
  theme,
  resolveAssetUrl,
  wrapNode,
}: {
  node: ComponentNode;
  breakpoint: Breakpoint;
  isEditing: boolean;
  theme: ThemeTokens;
  resolveAssetUrl?: (assetId: string) => string | null;
  wrapNode?: PageRendererProps["wrapNode"];
}): ReactNode {
  const def = componentRegistry.get(node.type);
  const resolved = resolveImageProps(
    resolveAllProps(node, breakpoint, def.defaultProps as Record<string, unknown>, theme),
    resolveAssetUrl,
  );
  const className = nodeClassName(node.id);
  const style = propsToInlineStyle(def, resolved);
  const children = (node.children ?? []).map((child) => (
    <RenderNode
      key={child.id}
      node={child}
      breakpoint={breakpoint}
      isEditing={isEditing}
      theme={theme}
      resolveAssetUrl={resolveAssetUrl}
      wrapNode={wrapNode}
    />
  ));

  const Render = def.render;
  const element = (
    <Render
      props={resolved as never}
      breakpoint={breakpoint}
      isEditing={isEditing}
      nodeId={node.id}
      className={className}
      style={style}
    >
      {children.length ? children : undefined}
    </Render>
  );

  if (wrapNode) return wrapNode(node, element);
  return element;
}

export function PageRenderer({
  document,
  breakpoint = "desktop",
  isEditing = false,
  theme = DEFAULT_THEME_TOKENS,
  resolveAssetUrl,
  wrapNode,
}: PageRendererProps): ReactElement {
  return (
    <div data-ps-page={document.pageId} data-ps-breakpoint={breakpoint}>
      <RenderNode
        node={document.root}
        breakpoint={breakpoint}
        isEditing={isEditing}
        theme={theme}
        resolveAssetUrl={resolveAssetUrl}
        wrapNode={wrapNode}
      />
    </div>
  );
}
