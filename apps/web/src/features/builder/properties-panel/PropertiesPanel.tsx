"use client";

import { useMemo, useState } from "react";
import { findNode } from "@productstudio/json-engine";
import { componentRegistry } from "@productstudio/component-registry";
import { pageDocumentSchema } from "@productstudio/shared-schemas";
import { useBuilderStore } from "../state/builder-store";
import { ChevronDown, ChevronRight } from "lucide-react";
import { PageProperties } from "./PageProperties";

const TABS = ["content", "style", "layout", "responsive"] as const;

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
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    content: true,
    style: true,
    layout: true,
    responsive: true,
  });

  const toggleSection = (tab: string) => {
    setExpandedSections((prev) => ({ ...prev, [tab]: !prev[tab] }));
  };

  if (selectedNodeId === "page") {
    return <PageProperties />;
  }

  if (!page || !node || !def) {
    return (
      <div className="flex h-full items-center justify-center bg-white dark:bg-transparent p-4 text-center text-[12px] text-neutral-500 dark:text-neutral-400">
        <p>Select a component to edit its properties</p>
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
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[12px] font-semibold text-foreground">{key}</span>
        {hasOverride ? (
          <button
            className="text-[10px] text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            onClick={() => resetResponsiveProp(node!.id, key)}
          >
            Reset
          </button>
        ) : null}
        {hasOverride ? (
          <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-medium text-amber-600 dark:text-amber-400">override</span>
        ) : null}
      </div>
    );

    if (typeof value === "boolean") {
      return (
        <div key={key} className="mb-4 flex flex-col gap-1">
          {label}
          <div>
            <input
              type="checkbox"
              className="h-4 w-4 rounded-[4px] border-neutral-200 dark:border-white/5 text-primary-500 focus:ring-primary-500 focus:ring-offset-background dark:bg-[#111111]/30"
              checked={Boolean(editingProps[key])}
              onChange={(e) => updateProps(node!.id, { [key]: e.target.checked })}
            />
          </div>
        </div>
      );
    }

    if (typeof value === "number") {
      return (
        <div key={key} className="mb-4 flex flex-col gap-1">
          {label}
          <input
            type="number"
            className="h-7 w-full rounded-[4px] border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[12px] text-foreground transition-colors focus:border-[#18A0FB] focus:ring-1 focus:ring-[#18A0FB] focus:bg-white focus:outline-none dark:border-white/5 dark:bg-[#1a1a1a] dark:focus:bg-[#111]"
            value={Number(editingProps[key] ?? 0)}
            onChange={(e) => updateProps(node!.id, { [key]: Number(e.target.value) })}
          />
        </div>
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
        <div key={key} className="mb-4">
          {label}
          <div className="grid grid-cols-2 gap-x-3 gap-y-3">
            {(["top", "right", "bottom", "left"] as const).map((side) => (
              <label key={side} className="flex flex-col gap-1 text-[11px] text-neutral-500 dark:text-neutral-400 capitalize">
                {side}
                <input
                  type="number"
                  className="h-7 w-full rounded-[4px] border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[12px] text-foreground transition-colors focus:border-[#18A0FB] focus:ring-1 focus:ring-[#18A0FB] focus:bg-white focus:outline-none dark:border-white/5 dark:bg-[#1a1a1a] dark:focus:bg-[#111]"
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
      const arrValue = (editingProps[key] ?? value) as any[];
      const isObjectArray = arrValue.length > 0 && typeof arrValue[0] === 'object' && arrValue[0] !== null;

      if (isObjectArray) {
        return (
          <div key={key} className="mb-4 flex flex-col gap-1">
            {label}
            <div className="flex flex-col gap-3">
              {arrValue.map((item, idx) => (
                <div key={idx} className="rounded-[4px] border border-neutral-200 dark:border-white/5 bg-neutral-50 dark:bg-[#111111]/30 p-3 flex flex-col gap-2 relative group mt-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400">
                      Item {idx + 1}
                    </span>
                    <button
                      className="text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500 dark:hover:text-red-400"
                      onClick={() => {
                        const newArr = [...arrValue];
                        newArr.splice(idx, 1);
                        updateProps(node!.id, { [key]: newArr });
                      }}
                      title="Remove item"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                    </button>
                  </div>
                  {Object.keys(item).map((itemKey) => {
                    const isMultiline = /description|body|quote|content/i.test(itemKey);
                    return (
                      <div key={itemKey} className="flex flex-col gap-1">
                        <span className="text-[10px] text-neutral-500 tracking-wider">
                          {itemKey}
                        </span>
                        {isMultiline ? (
                          <textarea
                            className="min-h-[60px] w-full rounded-[4px] border border-neutral-200 bg-white px-2.5 py-1.5 text-[12px] leading-relaxed text-foreground transition-colors focus:border-[#18A0FB] focus:ring-1 focus:ring-[#18A0FB] focus:outline-none dark:border-white/5 dark:bg-[#1a1a1a] resize-y"
                            value={String(item[itemKey] ?? "")}
                            onChange={(e) => {
                              const newArr = [...arrValue];
                              newArr[idx] = { ...newArr[idx], [itemKey]: e.target.value };
                              updateProps(node!.id, { [key]: newArr });
                            }}
                          />
                        ) : (
                          <input
                            className="h-7 w-full rounded-[4px] border border-neutral-200 bg-white px-2.5 py-1 text-[12px] text-foreground transition-colors focus:border-[#18A0FB] focus:ring-1 focus:ring-[#18A0FB] focus:outline-none dark:border-white/5 dark:bg-[#1a1a1a]"
                            value={String(item[itemKey] ?? "")}
                            onChange={(e) => {
                              const newArr = [...arrValue];
                              newArr[idx] = { ...newArr[idx], [itemKey]: e.target.value };
                              updateProps(node!.id, { [key]: newArr });
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
              <button
                className="w-full h-7 rounded-[4px] border border-dashed border-neutral-200 dark:border-white/20 text-[11px] font-medium text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors"
                onClick={() => {
                  const newArr = [...arrValue];
                  const emptyItem: Record<string, string> = {};
                  if (arrValue.length > 0) {
                    Object.keys(arrValue[0]).forEach(k => emptyItem[k] = "");
                  } else {
                    // Fallbacks for known array property shapes if empty
                    if (key === 'features') {
                      emptyItem['title'] = "New Feature";
                      emptyItem['description'] = "Description here...";
                    }
                  }
                  newArr.push(emptyItem);
                  updateProps(node!.id, { [key]: newArr });
                }}
              >
                + Add Item
              </button>
            </div>
          </div>
        );
      }

      return (
        <div key={key} className="mb-4 flex flex-col gap-1">
          {label}
          <textarea
            className="min-h-[120px] w-full rounded-[4px] border border-neutral-200 bg-neutral-50 px-2.5 py-2 font-mono text-[11px] leading-relaxed text-foreground transition-colors focus:border-[#18A0FB] focus:ring-1 focus:ring-[#18A0FB] focus:bg-white focus:outline-none dark:border-white/5 dark:bg-[#1a1a1a] dark:focus:bg-[#111] resize-y"
            value={JSON.stringify(editingProps[key] ?? value, null, 2)}
            onChange={(e) => {
              try {
                updateProps(node!.id, { [key]: JSON.parse(e.target.value) });
              } catch {
                /* ignore while typing */
              }
            }}
          />
        </div>
      );
    }

    const str = String(editingProps[key] ?? value ?? "");
    const isColorPattern = /^#([0-9a-fA-F]{3,8})$/i.test(str) || /^rgba?\(/i.test(str) || /^hsla?\(/i.test(str);
    const isColor = key.toLowerCase().includes("color") || isColorPattern;
    const isImage = key.toLowerCase().includes("image") || key === "src";

    return (
      <div key={key} className="mb-4 flex flex-col gap-1">
        {label}
        <div className="flex gap-2 relative">
          {isColor ? (
            <div className="h-7 w-8 shrink-0 overflow-hidden rounded-[4px] border border-neutral-200 dark:border-white/5 relative">
              <input
                type="color"
                className="absolute -top-2 -left-2 h-12 w-12 cursor-pointer bg-transparent"
                value={str.startsWith("#") ? str : "#000000"}
                onChange={(e) => updateProps(node!.id, { [key]: e.target.value })}
              />
            </div>
          ) : null}
          <input
            className="h-7 flex-1 min-w-0 rounded-[4px] border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[12px] text-foreground transition-colors focus:border-[#18A0FB] focus:ring-1 focus:ring-[#18A0FB] focus:bg-white focus:outline-none dark:border-white/5 dark:bg-[#1a1a1a] dark:focus:bg-[#111]"
            value={str === "null" ? "" : str}
            onChange={(e) => updateProps(node!.id, { [key]: e.target.value })}
          />
          {isImage ? (
            <label className="flex h-7 shrink-0 items-center justify-center rounded-[4px] border border-neutral-200 bg-neutral-50 px-3 text-[11px] font-medium text-foreground cursor-pointer hover:bg-neutral-100 transition-colors dark:border-white/5 dark:bg-[#1a1a1a] dark:hover:bg-[#222]">
              Upload
              <input
                type="file"
                className="hidden"
                style={{ display: "none" }}
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onloadend = () => updateProps(node!.id, { [key]: reader.result });
                  reader.readAsDataURL(file);
                }}
              />
            </label>
          ) : null}
        </div>
      </div>
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

  return (
    <div className="flex h-full flex-col bg-white dark:bg-transparent" onWheel={(e) => e.stopPropagation()}>
      <div className="border-b border-neutral-100 dark:border-white/5 px-3 py-2.5 flex-none">
        <p className="text-[12px] font-semibold text-foreground">{def.displayName}</p>
        <div className="mt-1 flex flex-wrap gap-1 text-[10px] text-neutral-500 dark:text-neutral-400">
          {breadcrumb.map((b, i) => (
            <button key={b.id} className="hover:text-primary-500 dark:hover:text-primary-400 transition-colors" onClick={() => selectNode(b.id)}>
              {b.name}
              {i < breadcrumb.length - 1 ? " /" : ""}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain">
        {TABS.map((tab) => {
          const isExpanded = expandedSections[tab];
          let keys: string[] = [];
          if (tab === "content") keys = contentKeys.length ? contentKeys : Object.keys(def.defaultProps);
          if (tab === "style") keys = styleKeys;
          if (tab === "layout") keys = layoutKeys;
          if (tab === "responsive") keys = def.responsiveProps as string[];

          if (keys.length === 0) return null;

          return (
            <div key={tab} className="border-b border-neutral-100 dark:border-white/5">
              <button
                onClick={() => toggleSection(tab)}
                className="flex w-full items-center justify-between px-3 py-2.5 text-left transition-colors hover:bg-neutral-50 dark:hover:bg-white/5 outline-none focus-visible:bg-neutral-100 dark:focus-visible:bg-white/10"
              >
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                  {tab}
                </span>
                {isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5 text-neutral-400" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-neutral-400" />
                )}
              </button>

              {isExpanded && (
                <div className="p-3">
                  <div>
                    {keys.map((key) =>
                      renderField(key, (def.defaultProps as Record<string, unknown>)[key]),
                    )}
                    {tab === "responsive" && activeBreakpoint === "desktop" ? (
                      <div className="rounded-[4px] border border-dashed border-neutral-200 dark:border-white/5 bg-neutral-50 dark:bg-[#111111]/30 p-3 text-center">
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                          Switch to Tablet or Mobile viewport to set breakpoint overrides.
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          );
        })}
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
