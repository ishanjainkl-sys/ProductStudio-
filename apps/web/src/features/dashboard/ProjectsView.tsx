"use client";

import React, { useCallback, useEffect, useState, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCreateProject } from "./CreateProjectContext";
import { api, ApiClientError } from "@/lib/api-client";
import { PreviewCard } from "./PreviewCard";
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
import { Plus, Search, X, MoreVertical, Monitor, Tablet, Smartphone } from "lucide-react";
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
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
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
  const [sortBy, setSortBy] = useState<"newest" | "updatedDesc" | "nameAsc" | "nameDesc">("updatedDesc");

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
    setViewport("desktop");
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
    void load();
  }, [load]);

  const filteredProjects = useMemo(() => {
    let result = projects.filter((p) =>
      p.name.toLowerCase().includes(query.toLowerCase())
    );

    result.sort((a, b) => {
      if (sortBy === "updatedDesc") return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      if (sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === "nameAsc") return a.name.localeCompare(b.name);
      if (sortBy === "nameDesc") return b.name.localeCompare(a.name);
      return 0;
    });

    return result;
  }, [projects, query, sortBy]);

  async function createProject() {
    if (!name.trim()) return;
    if (source === "template" && !templateVersionId) return;
    setCreating(true);
    setCreateError(null);
    try {
      const body =
        source === "blank"
          ? { source: "blank" as const, name: name.trim(), viewport }
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
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-[16px] font-semibold text-foreground">
              Projects
            </h1>
          </div>
          <Button onClick={() => void openModal()} size="sm" className="shrink-0 w-full sm:w-auto h-7 px-3 rounded-md bg-blue-600 hover:bg-blue-700 text-white shadow-none transition-transform active:scale-95 text-[12px] font-medium">
            <Plus className="mr-1.5 h-3.5 w-3.5" strokeWidth={2} />
            New Project
          </Button>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 pb-5">
          <div className="flex-1 w-full sm:w-auto flex items-center gap-3">
            <div className="relative w-full sm:w-[240px]">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" strokeWidth={2} />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-8 pr-8 rounded-md h-7 text-[12px] border-neutral-200/80 bg-white dark:bg-[#1A1A1A] dark:border-[#2C2C2C] shadow-none focus-visible:ring-1 focus-visible:ring-blue-500/50"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                >
                  <X className="h-3 w-3" strokeWidth={2} />
                </button>
              )}
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="h-7 w-full sm:w-auto overflow-hidden rounded-md border border-neutral-200/80 bg-white px-2.5 text-[12px] font-medium text-foreground shadow-none outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 dark:bg-[#1A1A1A] dark:border-[#2C2C2C]"
            >
              <option value="updatedDesc">Recently Updated</option>
              <option value="newest">Recently Created</option>
              <option value="nameAsc">Name A-Z</option>
              <option value="nameDesc">Name Z-A</option>
            </select>
          </div>
        </div>

        {error ? <p className="mb-5 rounded-xl border border-red-200/50 bg-red-50/50 px-4 py-3 text-sm text-danger dark:border-red-900/30 dark:bg-red-950/20">{error}</p> : null}
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((item) => <Card key={item} className="h-64 animate-pulse shadow-sm" />)}
          </div>
        ) : null}

        {!loading && projects.length === 0 ? (
          <Card className="mx-auto flex min-h-[400px] max-w-2xl flex-col items-center justify-center p-12 text-center border-dashed border-neutral-200 shadow-none dark:border-neutral-800">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 text-primary-600  dark:text-primary-400">
              <Plus className="h-8 w-8" strokeWidth={1.5} />
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

        {!loading && filteredProjects.length > 0 ? (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {filteredProjects.map((p, index) => (
              <motion.li
                key={p.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.05 }}
                className="group relative flex flex-col justify-between overflow-hidden rounded-lg border border-neutral-200/60 bg-white shadow-sm transition-all duration-300 hover:shadow-[0_12px_24px_rgb(0,0,0,0.06)] dark:border-[#2C2C2C] dark:bg-[#1E1E1E] hover:-translate-y-1"
              >
                {/* Advanced Aspect Ratio Preview */}
                <PreviewCard
                  homePageContent={(p as any).homePageContent}
                  themeTokens={(p as any).themeTokens}
                  isOpening={openingProjectId === p.id}
                  onClick={async (e) => {
                    e.stopPropagation();
                    setOpeningProjectId(p.id);
                    try {
                      const pages = await api.get<{ id: string; isHome: boolean }[]>(`/api/projects/${p.id}/pages`);
                      const home = pages.find((x) => x.isHome) ?? pages[0];
                      if (home) router.push(`/projects/${p.id}/pages/${home.id}`);
                    } catch { setOpeningProjectId(null); }
                  }}
                />

                <div className="flex flex-col flex-1 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="inline-flex items-center rounded-md border border-neutral-200 bg-neutral-100/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-500 dark:border-neutral-800 dark:bg-neutral-800/50 dark:text-neutral-400">
                          Web App
                        </span>
                      </div>
                      <h2 className="text-[13px] font-medium tracking-tight text-foreground transition-colors group-hover:text-blue-500 truncate mt-1">
                        {p.name}
                      </h2>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Options"
                          className="h-8 w-8 -mr-2 -mt-1 text-neutral-400 hover:text-neutral-900 bg-transparent transition-colors dark:hover:text-white"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[180px]">
                        <DropdownMenuItem className="text-danger focus:text-danger dark:text-red-400 dark:focus:text-red-400" onClick={(e: any) => { e.stopPropagation(); requestDeleteProject(p) }}>
                          Delete Project
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mt-auto pt-4 flex items-center justify-between">
                    <p className="text-[12px] font-normal text-muted-foreground">
                      Updated {new Date(p.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                    <div className="flex items-center gap-1.5 text-[12px] font-medium text-emerald-600 dark:text-emerald-500">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                      Saved
                    </div>
                  </div>
                </div>
              </motion.li>
            ))}
          </ul>
        ) : null}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{source === "template" ? "Create from template" : "Create a new project"}</DialogTitle>
            <DialogDescription>{source === "template" ? "Set up your project details." : "Choose your starting screen size"}</DialogDescription>
          </DialogHeader>

          {source === "blank" ? (
            <div className="mt-5 mb-2">
              <div className="grid grid-cols-3 gap-3 mb-6">
                <button className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${viewport === 'desktop' ? 'border-primary-500 bg-primary-50 text-primary-900 ring-2 ring-primary-500/20 dark:bg-primary-500/10 dark:text-primary-100' : 'border-neutral-200 text-neutral-600 hover:border-neutral-300 dark:border-neutral-800 dark:text-neutral-400 dark:hover:border-neutral-700'}`} onClick={() => setViewport("desktop")}>
                  <Monitor className="h-6 w-6 mb-2" />
                  <span className="text-[13px] font-medium">Desktop</span>
                </button>
                <button className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${viewport === 'tablet' ? 'border-primary-500 bg-primary-50 text-primary-900 ring-2 ring-primary-500/20 dark:bg-primary-500/10 dark:text-primary-100' : 'border-neutral-200 text-neutral-600 hover:border-neutral-300 dark:border-neutral-800 dark:text-neutral-400 dark:hover:border-neutral-700'}`} onClick={() => setViewport("tablet")}>
                  <Tablet className="h-6 w-6 mb-2" />
                  <span className="text-[13px] font-medium">Tablet</span>
                </button>
                <button className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${viewport === 'mobile' ? 'border-primary-500 bg-primary-50 text-primary-900 ring-2 ring-primary-500/20 dark:bg-primary-500/10 dark:text-primary-100' : 'border-neutral-200 text-neutral-600 hover:border-neutral-300 dark:border-neutral-800 dark:text-neutral-400 dark:hover:border-neutral-700'}`} onClick={() => setViewport("mobile")}>
                  <Smartphone className="h-6 w-6 mb-2" />
                  <span className="text-[13px] font-medium">Mobile</span>
                </button>
              </div>

              <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800 bg-neutral-50 dark:bg-[#111] flex flex-col items-start text-left mb-6">
                <strong className="block text-[14px] text-foreground font-semibold">Blank project</strong>
                <span className="mt-1 block text-[13px] text-neutral-500 dark:text-neutral-400">Start with an empty canvas</span>
              </div>
            </div>
          ) : null}
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
