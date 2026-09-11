"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { cloneDocumentWithNewIds } from "@productstudio/json-engine";
import type { PageDocument } from "@productstudio/shared-types";
import { useBuilderStore } from "../state/builder-store";

interface PageRow {
  id: string;
  name: string;
  slug: string;
  isHome: boolean;
}

export function PagesPanel({ projectId }: { projectId: string }) {
  const switchPage = useBuilderStore((s) => s.switchPage);
  const pageId = useBuilderStore((s) => s.page?.pageId);
  const [pages, setPages] = useState<PageRow[]>([]);
  const [name, setName] = useState("");
  const [renamingPageId, setRenamingPageId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, page: PageRow } | null>(null);

  useEffect(() => {
    function handleClick() {
      setContextMenu(null);
    }
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  async function handleDelete(p: PageRow) {
    if (p.isHome) {
      alert("Cannot delete the home page.");
      return;
    }
    if (!confirm(`Are you sure you want to delete the page "${p.name}"?`)) return;

    try {
      await api.delete(`/api/pages/${p.id}`);
      const newPages = await api.get<PageRow[]>(`/api/projects/${projectId}/pages`);
      setPages(newPages);
      if (p.id === pageId) {
        const homePage = newPages.find((x) => x.isHome) || newPages[0];
        if (homePage) {
          void switchPage(homePage.id);
        }
      }
    } catch (err) {
      console.error("Failed to delete page:", err);
      alert("Failed to delete page. Please try again.");
    }
  }

  async function reload() {
    const data = await api.get<PageRow[]>(`/api/projects/${projectId}/pages`);
    setPages(data);
    return data;
  }

  useEffect(() => {
    void reload();
  }, [projectId]);

  async function addPage() {
    if (!name.trim()) return;
    const created = await api.post<{ id: string }>(`/api/projects/${projectId}/pages`, {
      name: name.trim(),
    });
    setName("");
    void switchPage(created.id);
  }

  async function handleRename(p: PageRow) {
    if (renamingPageId !== p.id) return;
    const newName = renameValue.trim();
    if (!newName) {
      setRenamingPageId(null);
      return;
    }

    // Setting ID to null first prevents onBlur from triggering duplicate requests
    setRenamingPageId(null);

    if (newName !== p.name) {
      setPages(prev => prev.map(x => x.id === p.id ? { ...x, name: newName } : x));
      try {
        await api.patch(`/api/pages/${p.id}`, { name: newName });
        await reload();
      } catch (err) {
        console.error("Failed to rename page:", err);
        alert("Failed to rename page.");
        await reload();
      }
    }
  }

  async function handleCopyPage(p: PageRow) {
    try {
      const resp = await api.get<{ contentJson: PageDocument }>(`/api/pages/${p.id}`);
      const payload = {
        type: "productstudio/page",
        version: 1,
        page: resp.contentJson,
      };
      await navigator.clipboard.writeText(JSON.stringify(payload));
    } catch (err) {
      console.error("Failed to copy page:", err);
      alert("Failed to copy page.");
    }
  }

  async function handlePastePage() {
    try {
      const text = await navigator.clipboard.readText();
      let payload;
      try {
        payload = JSON.parse(text);
      } catch {
        alert("Clipboard does not contain valid data.");
        return;
      }

      if (payload?.type !== "productstudio/page" || !payload.page) {
        alert("Clipboard does not contain a valid copied page.");
        return;
      }

      const sourceDoc = payload.page as PageDocument;
      let newName = sourceDoc.name;

      if (!newName.endsWith(" Copy")) {
        newName += " Copy";
      } else {
        const match = newName.match(/ Copy (\d+)$/);
        if (match && match[1]) {
          newName = newName.replace(/ Copy \d+$/, ` Copy ${parseInt(match[1]) + 1}`);
        } else {
          newName += " 2";
        }
      }

      // Create new page
      const created = await api.post<{ id: string; version: number }>(`/api/projects/${projectId}/pages`, {
        name: newName,
      });

      // Clone document with new IDs
      const { doc } = cloneDocumentWithNewIds(sourceDoc);

      const { BREAKPOINT_WIDTHS } = await import("@productstudio/shared-types");
      const viewport = sourceDoc.metadata?.viewport || "desktop";
      const width = sourceDoc.metadata?.dimensions?.[viewport]?.width ?? BREAKPOINT_WIDTHS[viewport];

      let maxCanvasX = sourceDoc.metadata?.canvasX || 0;
      if (typeof window !== "undefined" && (window as any).__lastMaxCanvasX !== undefined) {
        maxCanvasX = Math.max(maxCanvasX, (window as any).__lastMaxCanvasX);
      }
      document.querySelectorAll("[data-canvas-x]").forEach(el => {
        const x = parseFloat(el.getAttribute("data-canvas-x") || "0");
        if (x > maxCanvasX) maxCanvasX = x;
      });
      const offsetX = maxCanvasX + width + 100;
      if (typeof window !== "undefined") (window as any).__lastMaxCanvasX = offsetX;

      const nextDoc = {
        ...doc,
        pageId: created.id,
        projectId: projectId,
        name: newName,
        metadata: {
          ...doc.metadata,
          canvasX: offsetX,
          canvasY: sourceDoc.metadata?.canvasY || 0
        }
      };

      await api.post(`/api/pages/${created.id}/save`, {
        contentJson: nextDoc,
        expectedVersion: created.version ?? 1,
      });

      await reload();

      window.dispatchEvent(new CustomEvent("ps-other-pages-changed"));
      void switchPage(created.id);
    } catch (err) {
      console.error("Paste failed:", err);
      alert("Paste failed.");
    }
  }

  return (
    <>
      <div
        className="flex h-full flex-col p-3 relative outline-none"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
          if ((e.ctrlKey || e.metaKey) && e.key === "c") {
            const activePage = pages.find(p => p.id === pageId);
            if (activePage) {
              e.preventDefault();
              e.stopPropagation();
              e.nativeEvent.stopImmediatePropagation();
              void handleCopyPage(activePage);
            }
          } else if ((e.ctrlKey || e.metaKey) && e.key === "v") {
            e.preventDefault();
            e.stopPropagation();
            e.nativeEvent.stopImmediatePropagation();
            void handlePastePage();
          }
        }}
      >
        <ul className="flex-1 space-y-1 overflow-auto">
          {pages.map((p) => (
            <li key={p.id}>
              {renamingPageId === p.id ? (
                <input
                  autoFocus
                  className="w-full rounded-md px-3 py-1.5 text-sm border border-neutral-300 focus:border-primary-500 focus:outline-none dark:bg-black/20 dark:border-white/10 dark:text-white"
                  value={renameValue}
                  onChange={e => setRenameValue(e.target.value)}
                  onBlur={() => void handleRename(p)}
                  onKeyDown={e => {
                    if (e.key === "Enter") void handleRename(p);
                    if (e.key === "Escape") setRenamingPageId(null);
                  }}
                />
              ) : (
                <button
                  className={`w-full rounded-md px-3 py-2 text-left text-sm ${p.id === pageId ? "bg-primary-50 text-primary-900" : "hover:bg-neutral-100 dark:hover:bg-white/5"}`}
                  onClick={() => void switchPage(p.id)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    let x = e.clientX;
                    let y = e.clientY;
                    const menuW = 150;
                    const menuH = 150;
                    if (x + menuW > window.innerWidth) x = window.innerWidth - menuW - 10;
                    if (y + menuH > window.innerHeight) y = Math.max(10, window.innerHeight - menuH - 10);
                    setContextMenu({ x, y, page: p });
                  }}
                >
                  {p.name}
                  {p.isHome ? <span className="ml-2 text-[10px] text-neutral-500">HOME</span> : null}
                </button>
              )}
            </li>
          ))}
        </ul>
        <div className="mt-3 space-y-2 border-t border-neutral-100 pt-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New page name"
            className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
          />
          <button
            onClick={() => void addPage()}
            className="w-full rounded-md bg-neutral-900 px-2 py-1.5 text-sm text-white"
          >
            Add page
          </button>
        </div>
      </div>

      {contextMenu && (
        <div
          className="fixed z-50 rounded-[6px] bg-[#222222] text-[#E0E0E0] shadow-2xl border border-[#333333] min-w-[150px] w-auto max-w-[250px] overflow-hidden py-1"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
          onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
        >
          <button
            className="w-full text-left rounded-[4px] px-3 py-[5px] mx-1 text-[11px] font-sans leading-tight text-white hover:bg-[#0D99FF]"
            style={{ width: "calc(100% - 8px)" }}
            onClick={() => {
              setContextMenu(null);
              void handleCopyPage(contextMenu.page);
            }}
          >
            Copy Page
          </button>
          <button
            className="w-full text-left rounded-[4px] px-3 py-[5px] mx-1 text-[11px] font-sans leading-tight text-white hover:bg-[#0D99FF]"
            style={{ width: "calc(100% - 8px)" }}
            onClick={() => {
              setContextMenu(null);
              void handlePastePage();
            }}
          >
            Paste Page
          </button>
          <button
            className="w-full text-left rounded-[4px] px-3 py-[5px] mx-1 text-[11px] font-sans leading-tight text-white hover:bg-[#0D99FF]"
            style={{ width: "calc(100% - 8px)" }}
            onClick={() => {
              setContextMenu(null);
              setRenamingPageId(contextMenu.page.id);
              setRenameValue(contextMenu.page.name);
            }}
          >
            Rename Page
          </button>
          <button
            className={`w-full text-left rounded-[4px] px-3 py-[5px] mx-1 text-[11px] font-sans leading-tight ${contextMenu.page.isHome ? "text-neutral-500 cursor-not-allowed" : "text-[#F24822] hover:bg-[#0D99FF] hover:text-white"}`}
            style={{ width: "calc(100% - 8px)" }}
            disabled={contextMenu.page.isHome}
            onClick={() => {
              setContextMenu(null);
              void handleDelete(contextMenu.page);
            }}
          >
            Delete Page
          </button>
        </div>
      )}
    </>
  );
}
