"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiClientError } from "@/lib/api-client";
import type { ProjectSummary } from "@productstudio/shared-types";

interface ListResponse {
  data: ProjectSummary[];
  page: number;
  pageSize: number;
  total: number;
}

export function DashboardView() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [source, setSource] = useState<"blank" | "template">("blank");
  const [name, setName] = useState("");
  const [templates, setTemplates] = useState<
    { id: string; name: string; latestVersionId: string | null }[]
  >([]);
  const [templateVersionId, setTemplateVersionId] = useState("");

  const load = useCallback(async (q = "") => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<ListResponse>(
        `/api/projects?page=1&pageSize=50&query=${encodeURIComponent(q)}`,
      );
      setProjects(res.data);
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 401) {
        router.replace("/login?next=/dashboard");
        return;
      }
      setError("Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const t = setTimeout(() => void load(query), 300);
    return () => clearTimeout(t);
  }, [query, load]);

  async function openModal() {
    setModalOpen(true);
    setName("");
    setSource("blank");
    try {
      const list = await api.get<
        { id: string; name: string; latestVersionId: string | null }[]
      >("/api/templates");
      setTemplates(list);
      if (list[0]?.latestVersionId) setTemplateVersionId(list[0].latestVersionId);
    } catch {
      setTemplates([]);
    }
  }

  async function createProject() {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const body =
        source === "blank"
          ? { source: "blank" as const, name: name.trim() }
          : {
              source: "template" as const,
              name: name.trim(),
              templateVersionId,
            };
      const result = await api.post<{
        project: { id: string };
        page: { id: string };
      }>("/api/projects", body);
      router.push(`/projects/${result.project.id}/pages/${result.page.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setCreating(false);
    }
  }

  async function deleteProject(p: ProjectSummary) {
    const confirmed = window.prompt(`Type "${p.name}" to delete this project`);
    if (confirmed !== p.name) return;
    await api.delete(`/api/projects/${p.id}`);
    await load(query);
  }

  async function logout() {
    await api.post("/api/auth/logout");
    router.replace("/login");
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-neutral-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs font-semibold tracking-wide text-primary-500">PRODUCTSTUDIO</p>
            <h1 className="text-xl font-bold">Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => void openModal()}
              className="rounded-md bg-primary-500 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-900"
            >
              New Project
            </button>
            <button
              onClick={() => void logout()}
              className="rounded-md px-3 py-2 text-sm text-neutral-500 hover:bg-neutral-100"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects…"
            className="w-full max-w-md rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-primary-500"
          />
        </div>

        {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}
        {loading ? <p className="text-sm text-neutral-500">Loading…</p> : null}

        {!loading && projects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-12 text-center">
            <h2 className="text-lg font-semibold">Create your first project</h2>
            <p className="mt-2 text-sm text-neutral-500">
              Start blank or from a template — you&apos;ll be in the builder in seconds.
            </p>
            <button
              onClick={() => void openModal()}
              className="mt-6 rounded-md bg-primary-500 px-4 py-2 text-sm font-semibold text-white"
            >
              New Project
            </button>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <li
                key={p.id}
                className="rounded-xl border border-neutral-100 bg-white p-5 shadow-sm transition hover:border-primary-500/40"
              >
                <button
                  className="w-full text-left"
                  onClick={async () => {
                    const pages = await api.get<{ id: string; isHome: boolean }[]>(
                      `/api/projects/${p.id}/pages`,
                    );
                    const home = pages.find((x) => x.isHome) ?? pages[0];
                    if (home) router.push(`/projects/${p.id}/pages/${home.id}`);
                  }}
                >
                  <h2 className="font-semibold text-neutral-900">{p.name}</h2>
                  <p className="mt-2 text-xs text-neutral-500">
                    Updated {new Date(p.updatedAt).toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs text-emerald-600">Saved</p>
                </button>
                <div className="mt-4 flex gap-2">
                  <button
                    className="text-xs text-neutral-500 hover:text-red-600"
                    onClick={() => void deleteProject(p)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold">New Project</h2>
            <div className="mt-4 flex gap-2">
              <button
                className={`rounded-md px-3 py-1.5 text-sm ${source === "blank" ? "bg-primary-500 text-white" : "bg-neutral-100"}`}
                onClick={() => setSource("blank")}
              >
                Blank
              </button>
              <button
                className={`rounded-md px-3 py-1.5 text-sm ${source === "template" ? "bg-primary-500 text-white" : "bg-neutral-100"}`}
                onClick={() => setSource("template")}
              >
                From Template
              </button>
            </div>
            <label className="mt-4 block text-sm font-medium">
              Name
              <input
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={120}
              />
            </label>
            {source === "template" ? (
              <label className="mt-3 block text-sm font-medium">
                Template
                <select
                  className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                  value={templateVersionId}
                  onChange={(e) => setTemplateVersionId(e.target.value)}
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.latestVersionId ?? ""}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <div className="mt-6 flex justify-end gap-2">
              <button
                className="rounded-md px-3 py-2 text-sm text-neutral-500"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </button>
              <button
                disabled={creating || !name.trim()}
                className="rounded-md bg-primary-500 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                onClick={() => void createProject()}
              >
                {creating ? "Creating…" : "Create"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
