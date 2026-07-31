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
    <div className="flex h-full flex-col p-3">
      <ul className="flex-1 space-y-1 overflow-auto">
        {pages.map((p) => (
          <li key={p.id}>
            <button
              className={`w-full rounded-md px-3 py-2 text-left text-sm ${p.id === pageId ? "bg-primary-50 text-primary-900" : "hover:bg-neutral-100"}`}
              onClick={() => router.push(`/projects/${projectId}/pages/${p.id}`)}
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
  );
}
