"use client";

import { useMemo, useState } from "react";
import { findNode } from "@productstudio/json-engine";
import { componentRegistry } from "@productstudio/component-registry";
import { pageDocumentSchema } from "@productstudio/shared-schemas";
import { useBuilderStore } from "../state/builder-store";

const TABS = ["content", "style", "layout", "responsive", "advanced"] as const;

export function PropertiesPanel() {
  const page = useBuilderStore((s) => s.page);
  const selectedNodeId = useBuilderStore((s) => s.selectedNodeId);
  const propTab = useBuilderStore((s) => s.propTab);
  const setPropTab = useBuilderStore((s) => s.setPropTab);
  const activeBreakpoint = useBuilderStore((s) => s.activeBreakpoint);
  const updateProps = useBuilderStore((s) => s.updateProps);
  const resetResponsiveProp = useBuilderStore((s) => s.resetResponsiveProp);
  const replacePageDocument = useBuilderStore((s) => s.replacePageDocument);
  const selectNode = useBuilderStore((s) => s.selectNode);

  const node = useMemo(() => {
    if (!page || !selectedNodeId) return null;
    return findNode(page.root, selectedNodeId);
  }, [page, selectedNodeId]);

  const def = node ? componentRegistry.get(node.type) : null;
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [advancedJson, setAdvancedJson] = useState("");

  if (!page || !node || !def) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-sm text-neutral-500">
        Select a component to edit its properties
      </div>
    );
  }

  const breadcrumb: { id: string; name: string }[] = [];
  const walk = (n: typeof page.root, trail: typeof breadcrumb): boolean => {
    const d = componentRegistry.get(n.type);
    const next = [...trail, { id: n.id, name: d.displayName }];
    if (n.id === node.id) {
      breadcrumb.push(...next);
      return true;
    }
    for (const c of n.children ?? []) {
      if (walk(c, next)) return true;
    }
    return false;
  };
  walk(page.root, []);

  const editingProps =
    activeBreakpoint === "desktop"
      ? node.props
      : { ...node.props, ...(node.responsiveProps[activeBreakpoint] ?? {}) };

  function renderField(key: string, value: unknown) {
    const hasOverride =
      activeBreakpoint !== "desktop" &&
      node!.responsiveProps[activeBreakpoint]?.[key] !== undefined;

    const label = (
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-medium text-neutral-700">{key}</span>
        {hasOverride ? (
          <button
            className="text-[10px] text-primary-500"
            onClick={() => resetResponsiveProp(node!.id, key)}
          >
            Reset
          </button>
        ) : null}
        {hasOverride ? (
          <span className="rounded bg-amber-100 px-1 text-[10px] text-amber-800">override</span>
        ) : null}
      </div>
    );

    if (typeof value === "boolean") {
      return (
        <label key={key} className="mb-3 block">
          {label}
          <input
            type="checkbox"
            checked={Boolean(editingProps[key])}
            onChange={(e) => updateProps(node!.id, { [key]: e.target.checked })}
          />
        </label>
      );
    }

    if (typeof value === "number") {
      return (
        <label key={key} className="mb-3 block">
          {label}
          <input
            type="number"
            className="w-full rounded border border-neutral-300 px-2 py-1 text-sm"
            value={Number(editingProps[key] ?? 0)}
            onChange={(e) => updateProps(node!.id, { [key]: Number(e.target.value) })}
          />
        </label>
      );
    }

    if (value && typeof value === "object" && "top" in (value as object)) {
      const box = (editingProps[key] ?? value) as {
        top: number;
        bottom: number;
        left: number;
        right: number;
      };
      return (
        <div key={key} className="mb-3">
          {label}
          <div className="grid grid-cols-2 gap-2">
            {(["top", "right", "bottom", "left"] as const).map((side) => (
              <label key={side} className="text-[10px] text-neutral-500">
                {side}
                <input
                  type="number"
                  className="mt-0.5 w-full rounded border border-neutral-300 px-2 py-1 text-sm"
                  value={box[side]}
                  onChange={(e) =>
                    updateProps(node!.id, {
                      [key]: { ...box, [side]: Number(e.target.value) },
                    })
                  }
                />
              </label>
            ))}
          </div>
        </div>
      );
    }

    if (Array.isArray(value)) {
      return (
        <label key={key} className="mb-3 block">
          {label}
          <textarea
            className="h-24 w-full rounded border border-neutral-300 px-2 py-1 font-mono text-xs"
            value={JSON.stringify(editingProps[key] ?? value, null, 2)}
            onChange={(e) => {
              try {
                updateProps(node!.id, { [key]: JSON.parse(e.target.value) });
              } catch {
                /* ignore while typing */
              }
            }}
          />
        </label>
      );
    }

    const str = String(editingProps[key] ?? value ?? "");
    const isColor = key.toLowerCase().includes("color") || /^#|rgb/.test(str);

    return (
      <label key={key} className="mb-3 block">
        {label}
        <div className="flex gap-2">
          {isColor ? (
            <input
              type="color"
              value={str.startsWith("#") ? str : "#000000"}
              onChange={(e) => updateProps(node!.id, { [key]: e.target.value })}
            />
          ) : null}
          <input
            className="w-full rounded border border-neutral-300 px-2 py-1 text-sm"
            value={str === "null" ? "" : str}
            onChange={(e) => updateProps(node!.id, { [key]: e.target.value })}
          />
        </div>
      </label>
    );
  }

  const contentKeys = Object.keys(def.defaultProps).filter((k) =>
    /text|label|heading|subheading|title|quote|author|href|src|alt|brand|copyright|placeholder|name|url|id|features|stats|members|links|cta/i.test(
      k,
    ),
  );
  const styleKeys = Object.keys(def.defaultProps).filter((k) =>
    /color|background|font|align|radius|variant|headingSize|thickness|width|height/i.test(k),
  );
  const layoutKeys = Object.keys(def.defaultProps).filter((k) =>
    /padding|gap|columns|direction|align|maxWidth|spacing/i.test(k),
  );

  let keys: string[] = [];
  if (propTab === "content") keys = contentKeys.length ? contentKeys : Object.keys(def.defaultProps);
  if (propTab === "style") keys = styleKeys;
  if (propTab === "layout") keys = layoutKeys;
  if (propTab === "responsive") keys = def.responsiveProps as string[];

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-neutral-100 px-3 py-2">
        <p className="text-sm font-semibold">{def.displayName}</p>
        <div className="mt-1 flex flex-wrap gap-1 text-[10px] text-neutral-500">
          {breadcrumb.map((b, i) => (
            <button key={b.id} className="hover:text-primary-500" onClick={() => selectNode(b.id)}>
              {b.name}
              {i < breadcrumb.length - 1 ? " /" : ""}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-1 overflow-x-auto border-b border-neutral-100 px-2 py-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => {
              setPropTab(t);
              if (t === "advanced") setAdvancedJson(JSON.stringify(node, null, 2));
            }}
            className={`rounded px-2 py-1 text-[11px] capitalize ${propTab === t ? "bg-primary-500 text-white" : "bg-neutral-100 text-neutral-600"}`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-auto p-3">
        {propTab === "advanced" ? (
          <div>
            <textarea
              className="h-64 w-full rounded border border-neutral-300 p-2 font-mono text-xs"
              value={advancedJson || JSON.stringify(node, null, 2)}
              onChange={(e) => setAdvancedJson(e.target.value)}
            />
            {jsonError ? <p className="mt-1 text-xs text-red-600">{jsonError}</p> : null}
            <button
              className="mt-2 rounded bg-neutral-900 px-3 py-1.5 text-xs text-white"
              onClick={() => {
                try {
                  const parsed = JSON.parse(advancedJson || JSON.stringify(node));
                  const nextRoot = replaceNode(page.root, node.id, parsed);
                  const nextDoc = { ...page, root: nextRoot };
                  pageDocumentSchema.parse(nextDoc);
                  def.propsSchema.parse(parsed.props);
                  replacePageDocument(nextDoc);
                  setJsonError(null);
                } catch (e) {
                  setJsonError(e instanceof Error ? e.message : "Invalid JSON");
                }
              }}
            >
              Apply JSON
            </button>
          </div>
        ) : (
          keys.map((key) =>
            renderField(key, (def.defaultProps as Record<string, unknown>)[key]),
          )
        )}
        {propTab === "responsive" && activeBreakpoint === "desktop" ? (
          <p className="text-xs text-neutral-500">
            Switch to Tablet or Mobile to set breakpoint overrides.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function replaceNode(
  root: import("@productstudio/shared-types").ComponentNode,
  id: string,
  next: import("@productstudio/shared-types").ComponentNode,
): import("@productstudio/shared-types").ComponentNode {
  if (root.id === id) return next;
  return {
    ...root,
    children: root.children?.map((c) => replaceNode(c, id, next)),
  };
}
