"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCreateProject } from "./CreateProjectContext";
import { api, ApiClientError } from "@/lib/api-client";
import { MotionReveal } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion } from "@/components/motion";
import { PageRenderer } from "@productstudio/renderer";
import type { ProjectSummary } from "@productstudio/shared-types";

interface ListResponse {
  data: ProjectSummary[];
  page: number;
  pageSize: number;
  total: number;
}

export function ProjectsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { registerHandler } = useCreateProject();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [source, setSource] = useState<"blank" | "template">("blank");
  const [name, setName] = useState("");
  const [templates, setTemplates] = useState<
    { id: string; name: string; description: string | null; latestVersionId: string }[]
  >([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templateVersionId, setTemplateVersionId] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  const [projectToDelete, setProjectToDelete] = useState<ProjectSummary | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [openingProjectId, setOpeningProjectId] = useState<string | null>(null);

  const selectedTemplate = templates.find((t) => t.latestVersionId === templateVersionId);

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

  const openModal = useCallback(async (options?: { source?: "blank" | "template", templateVersionId?: string, projectName?: string }) => {
    setModalOpen(true);
    setName(options?.projectName || "");
    setSource(options?.source || (options?.templateVersionId ? "template" : "blank"));
    setCreateError(null);
    setTemplateVersionId(options?.templateVersionId || "");
    setTemplatesLoading(true);
    try {
      const list = await api.get<
        {
          id: string;
          name: string;
          description: string | null;
          latestVersionId: string | null;
        }[]
      >("/api/templates");
      const usable = (Array.isArray(list) ? list : []).flatMap((t) =>
        t.latestVersionId ? [{ ...t, latestVersionId: t.latestVersionId }] : [],
      );
      setTemplates(usable);
      if (options?.templateVersionId) {
        const found = usable.find(t => t.latestVersionId === options.templateVersionId);
        if (found) setTemplateVersionId(found.latestVersionId);
      } else if (usable[0]) {
        setTemplateVersionId(usable[0].latestVersionId);
      }
    } catch {
      setTemplates([]);
      setCreateError("Could not load templates");
    } finally {
      setTemplatesLoading(false);
    }
  }, []);

  useEffect(() => {
    registerHandler((options) => void openModal(options));
    return () => registerHandler(null);
  }, [openModal, registerHandler]);

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      const templateId = searchParams.get("templateId") || undefined;
      const nameParam = searchParams.get("name") || undefined;
      void openModal({
        templateVersionId: templateId,
        projectName: nameParam,
        source: templateId ? "template" : "blank"
      });
      router.replace("/dashboard");
    }
  }, [openModal, router, searchParams]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const t = setTimeout(() => void load(query), 300);
    return () => clearTimeout(t);
  }, [query, load]);

  async function createProject() {
    if (!name.trim()) return;
    if (source === "template" && !templateVersionId) return;
    setCreating(true);
    setCreateError(null);
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
      setCreateError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setCreating(false);
    }
  }

  function requestDeleteProject(p: ProjectSummary) {
    setProjectToDelete(p);
    setDeleteConfirmName("");
    setDeleteError(null);
  }

  async function confirmDeleteProject() {
    if (!projectToDelete || deleteConfirmName !== projectToDelete.name) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await api.delete(`/api/projects/${projectToDelete.id}`);
      setProjectToDelete(null);
      await load(query);
    } catch {
      setDeleteError("Failed to delete project. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <div className="mx-auto max-w-[1280px]">
        <MotionReveal className="mb-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
              Projects
            </h1>
            <p className="mt-2 text-[15px] text-muted-foreground">
              Manage your active websites and web applications.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-[320px]">
              <svg className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="11" cy="11" r="7" strokeWidth="2" />
                <path strokeLinecap="round" strokeWidth="2" d="M16.5 16.5L20 20" />
              </svg>
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search projects..."
                className="pl-[38px] pr-10"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <Button onClick={() => void openModal()} size="lg" className="shrink-0 w-full sm:w-auto">
              <svg className="mr-1.5 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              New Project
            </Button>
          </div>
        </MotionReveal>

        {error ? <p className="mb-5 rounded-xl border border-red-200/50 bg-red-50/50 px-4 py-3 text-sm text-danger dark:border-red-900/30 dark:bg-red-950/20">{error}</p> : null}
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => <Card key={item} className="h-64 animate-pulse shadow-sm" />)}
          </div>
        ) : null}

        {!loading && projects.length === 0 ? (
          <Card className="mx-auto flex min-h-[400px] max-w-2xl flex-col items-center justify-center p-12 text-center border-dashed border-neutral-200 shadow-none dark:border-neutral-800">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 text-primary-600  dark:text-primary-400">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h2 className="mt-6 text-xl font-bold tracking-tight text-foreground">Create your first project</h2>
            <p className="mt-2 max-w-sm text-[14px] text-muted-foreground">
              Start from scratch or use a predefined template to kick off your new website instantly.
            </p>
            <Button onClick={() => void openModal()} size="lg" className="mt-8">
              New project
            </Button>
          </Card>
        ) : null}

        {!loading && projects.length > 0 ? (
          <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {projects.map((p, index) => (
              <motion.li
                key={p.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.05 }}
                className="group relative flex flex-col justify-between overflow-hidden rounded-[16px] border border-border/60 bg-card shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-black/[0.04]  dark:hover:border-neutral-700"
              >
                {/* Advanced Aspect Ratio Preview */}
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-neutral-50 border-b border-neutral-100 dark:border-neutral-800 dark:bg-card dark:border-neutral-800/80 rounded-t-[16px]">
                  {(p as any).homePageContent ? (
                    <div className="absolute inset-0 flex items-start justify-center pointer-events-none transition-transform duration-500 will-change-transform">
                      <div className="w-[1280px] h-[720px] origin-top scale-[0.28] sm:scale-[0.32] md:scale-[0.38] lg:scale-[0.32] xl:scale-[0.27] 2xl:scale-[0.31] shrink-0 bg-card">
                        <PageRenderer document={(p as any).homePageContent} isEditing={false} theme={(p as any).themeTokens ?? undefined} />
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-start justify-center transition-transform duration-500 will-change-transform p-3 pt-6">
                      <div className="relative h-full w-[85%] overflow-hidden rounded-t-[10px] border border-neutral-200/80 bg-white p-3 shadow-sm dark:border-neutral-700/60 dark:bg-card">
                        <div className="mb-2.5 flex items-center gap-1.5 opacity-40">
                          <i className="h-1.5 w-1.5 rounded-full bg-neutral-400 dark:bg-neutral-500" />
                          <i className="h-1.5 w-1.5 rounded-full bg-neutral-400 dark:bg-neutral-500" />
                          <i className="h-1.5 w-1.5 rounded-full bg-neutral-400 dark:bg-neutral-500" />
                        </div>
                        <div className="space-y-1.5">
                          <div className="h-1.5 w-1/3 rounded-full bg-neutral-200 dark:bg-neutral-700" />
                          <div className="h-1.5 w-3/4 rounded-full bg-secondary" />
                          <div className="h-1.5 w-1/2 rounded-full bg-secondary" />
                        </div>
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-transparent to-transparent dark:from-[#1C1C1E]/90" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col flex-1 p-4">
                  <div className="flex items-center justify-between gap-3 leading-none">
                    <h2 className="text-[16px] font-bold tracking-tight text-foreground group-hover:text-primary-600  dark:group-hover:text-primary-400 truncate">
                      {p.name}
                    </h2>
                    <span className="shrink-0 rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-bold text-muted-foreground dark:bg-neutral-800 ">v1</span>
                  </div>

                  <div className="mt-2.5 flex flex-col gap-1.5">
                    <p className="text-[13px] font-medium text-muted-foreground leading-none">
                      Updated {new Date(p.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                    <div className="flex items-center gap-1.5 text-[13px] font-medium text-emerald-600 dark:text-emerald-500 leading-none">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      All changes saved
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="flex items-center gap-2.5 px-4 pb-4 pt-1">
                  <Button
                    onClick={async (e) => {
                      e.stopPropagation();
                      setOpeningProjectId(p.id);
                      try {
                        const pages = await api.get<{ id: string; isHome: boolean }[]>(
                          `/api/projects/${p.id}/pages`,
                        );
                        const home = pages.find((x) => x.isHome) ?? pages[0];
                        if (home) router.push(`/projects/${p.id}/pages/${home.id}`);
                      } catch {
                        setOpeningProjectId(null);
                      }
                    }}
                    disabled={openingProjectId === p.id}
                    className="group/editbtn relative flex-1 h-9 items-center justify-center overflow-hidden rounded-lg bg-neutral-900 px-4 text-[13px] font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition-all focus-visible:ring-2 focus-visible:ring-primary-500 hover:bg-neutral-800 active:scale-95 dark:bg-[#27272A] dark:text-white dark:hover:bg-[#3F3F46]"
                  >
                    {openingProjectId === p.id ? (
                      <svg className="mr-2 h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="mr-2 h-3.5 w-3.5 opacity-80 transition-opacity group-hover/editbtn:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    )}
                    {openingProjectId === p.id ? "Opening..." : "Edit Project"}
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Options"
                        className="h-9 w-9 shrink-0 rounded-lg bg-neutral-100 text-muted-foreground opacity-90 transition-all hover:bg-neutral-200 hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-neutral-500 active:scale-95 dark:bg-[#27272A]  dark:hover:bg-[#3F3F46] dark:hover:text-white"
                      >
                        <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[180px]">
                      <DropdownMenuItem
                        onClick={async (e: any) => {
                          e.stopPropagation();
                          setOpeningProjectId(p.id);
                          try {
                            const pages = await api.get<{ id: string; isHome: boolean }[]>(
                              `/api/projects/${p.id}/pages`,
                            );
                            const home = pages.find((x) => x.isHome) ?? pages[0];
                            if (home) router.push(`/projects/${p.id}/pages/${home.id}`);
                          } catch {
                            setOpeningProjectId(null);
                          }
                        }}
                      >
                        Open Editor
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-danger focus:text-danger dark:text-red-400 dark:focus:text-red-400"
                        onClick={(e: any) => {
                          e.stopPropagation();
                          requestDeleteProject(p)
                        }}
                      >
                        Delete Project
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </motion.li>
            ))}
          </ul>
        ) : null}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <p className="ps-kicker">Create</p>
            <DialogTitle>New project</DialogTitle>
            <DialogDescription>Choose a starting point for your website.</DialogDescription>
          </DialogHeader>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              className={`rounded-xl border p-4 text-left ${source === "blank" ? "border-primary-500 bg-primary-50 ring-2 ring-primary-500/10" : "border-neutral-200 hover:border-neutral-300"}`}
              onClick={() => setSource("blank")}
            >
              <span className={`mb-3 grid h-9 w-9 place-items-center rounded-lg text-lg ${source === "blank" ? "bg-primary-500 text-white" : "bg-neutral-100 text-neutral-500"}`}>+</span>
              <strong className="block text-sm">Blank project</strong>
              <span className="mt-1 block text-xs text-neutral-500">Start from a clean canvas</span>
            </button>
            <button
              className={`rounded-xl border p-4 text-left ${source === "template" ? "border-primary-500 bg-primary-50 ring-2 ring-primary-500/10" : "border-neutral-200 hover:border-neutral-300"}`}
              onClick={() => setSource("template")}
            >
              <span className={`mb-3 grid h-9 w-9 place-items-center rounded-lg text-base ${source === "template" ? "bg-primary-500 text-white" : "bg-neutral-100 text-neutral-500"}`}>▦</span>
              <strong className="block text-sm">From template</strong>
              <span className="mt-1 block text-xs text-neutral-500">Use a proven foundation</span>
            </button>
          </div>
          <label className="mt-5 block">
            <Label htmlFor="project-name">Project name</Label>
            <Input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={120}
              placeholder="e.g. Acme marketing site"
              autoFocus
              className="mt-1.5"
            />
          </label>
          {source === "template" ? (
            <div className="mt-4">
              <label className="ps-label" htmlFor="template-select">
                Template
              </label>
              {templatesLoading ? (
                <p className="mt-1 text-sm text-neutral-500">Loading templates…</p>
              ) : templates.length === 0 ? (
                <p className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-3 text-xs leading-5 text-neutral-500">
                  No templates available yet. Create a project, then use “Save as template” from
                  its settings to reuse it here.
                </p>
              ) : (
                <>
                  <select
                    id="template-select"
                    className="ps-select"
                    value={templateVersionId}
                    onChange={(e) => setTemplateVersionId(e.target.value)}
                  >
                    {templates.map((t) => (
                      <option key={t.id} value={t.latestVersionId}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  {selectedTemplate?.description ? (
                    <p className="mt-1 text-xs text-neutral-500">
                      {selectedTemplate.description}
                    </p>
                  ) : null}
                </>
              )}
            </div>
          ) : null}
          {createError ? <p className="mt-3 text-sm text-danger">{createError}</p> : null}
          <DialogFooter className="mt-7 gap-2 sm:justify-end">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={creating || !name.trim() || (source === "template" && !templateVersionId)}
              onClick={() => void createProject()}
            >
              {creating ? "Creating…" : "Create project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!projectToDelete} onOpenChange={(open) => !open && setProjectToDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this project? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <Label htmlFor="delete-confirm-name" className="text-sm text-foreground">
              Type <strong className="select-all font-bold text-foreground">{projectToDelete?.name}</strong> to confirm.
            </Label>
            <Input
              id="delete-confirm-name"
              value={deleteConfirmName}
              onChange={(e) => setDeleteConfirmName(e.target.value)}
              placeholder={projectToDelete?.name}
              className="mt-2"
              autoFocus
            />
          </div>
          {deleteError ? <p className="mt-3 text-sm font-medium text-danger">{deleteError}</p> : null}
          <DialogFooter className="mt-6 gap-2 sm:justify-end">
            <Button variant="ghost" onClick={() => setProjectToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="bg-danger text-white hover:bg-danger/90"
              disabled={isDeleting || deleteConfirmName !== projectToDelete?.name}
              onClick={() => void confirmDeleteProject()}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
