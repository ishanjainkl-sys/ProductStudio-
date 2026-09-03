"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";

interface PageRow {
  id: string;
  name: string;
  slug: string;
  isHome: boolean;
}

export function PagesPanel({ projectId, pageId }: { projectId: string; pageId: string }) {
  const router = useRouter();
  const [pages, setPages] = useState<PageRow[]>([]);
  const [name, setName] = useState("");
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
          router.push(`/projects/${projectId}/pages/${homePage.id}`);
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
    router.push(`/projects/${projectId}/pages/${created.id}`);
  }

  return (
    <>
      <div className="flex h-full flex-col p-3 relative">
        <ul className="flex-1 space-y-1 overflow-auto">
          {pages.map((p) => (
            <li key={p.id}>
              <button
                className={`w-full rounded-md px-3 py-2 text-left text-sm ${p.id === pageId ? "bg-primary-50 text-primary-900" : "hover:bg-neutral-100 dark:hover:bg-white/5"}`}
                onClick={() => router.push(`/projects/${projectId}/pages/${p.id}`)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setContextMenu({ x: e.clientX, y: e.clientY, page: p });
                }}
              >
                {p.name}
                {p.isHome ? <span className="ml-2 text-[10px] text-neutral-500">HOME</span> : null}
              </button>
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
          className="fixed z-50 rounded-md bg-white p-1 text-sm shadow-xl border border-neutral-200 dark:border-white/10 dark:bg-[#2C2C2C] min-w-[150px]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className={`w-full text-left rounded-sm px-2 py-1.5 ${contextMenu.page.isHome ? "text-neutral-400 cursor-not-allowed" : "text-red-600 hover:bg-neutral-100 dark:hover:bg-white/5"}`}
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
