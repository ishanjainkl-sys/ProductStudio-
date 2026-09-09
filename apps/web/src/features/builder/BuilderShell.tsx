"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  rectIntersection,
  type DragEndEvent,
  type CollisionDetection,
} from "@dnd-kit/core";
import type { PageDocument, ThemeTokens } from "@productstudio/shared-types";
import { BREAKPOINT_WIDTHS } from "@productstudio/shared-types";
import { api, ApiClientError } from "@/lib/api-client";
import { useBuilderStore } from "./state/builder-store";
import { ArrowLeft, Sparkles, Undo2, Redo2, Monitor, Tablet, Smartphone, Settings, ArrowUpRight } from "lucide-react";
import { Canvas } from "./canvas/Canvas";
import { ZoomControls } from "./ZoomControls";
import { ComponentLibraryPanel } from "./component-library-panel/ComponentLibraryPanel";
import { PagesPanel } from "./component-library-panel/PagesPanel";
import { PropertiesPanel } from "./properties-panel/PropertiesPanel";
import { AIAssistantModal } from "./AIAssistantModal";

const collisionDetection: CollisionDetection = (args) => {
  const activeType = args.active.data.current?.type;
  if (activeType === "library-item") return closestCenter(args);
  return rectIntersection(args);
};

export function BuilderShell({
  projectId,
  pageId,
}: {
  projectId: string;
  pageId: string;
}) {
  const router = useRouter();
  const hydrate = useBuilderStore((s) => s.hydrate);
  const page = useBuilderStore((s) => s.page);
  const projectName = useBuilderStore((s) => s.projectName);
  const saveStatus = useBuilderStore((s) => s.saveStatus);
  const lastSavedAt = useBuilderStore((s) => s.lastSavedAt);
  const activeBreakpoint = useBuilderStore((s) => s.activeBreakpoint);
  const setBreakpoint = useBuilderStore((s) => s.setBreakpoint);
  const leftTab = useBuilderStore((s) => s.leftTab);
  const setLeftTab = useBuilderStore((s) => s.setLeftTab);
  const undo = useBuilderStore((s) => s.undo);
  const redo = useBuilderStore((s) => s.redo);
  const save = useBuilderStore((s) => s.save);
  const undoStack = useBuilderStore((s) => s.undoStack);
  const redoStack = useBuilderStore((s) => s.redoStack);
  const insertFromLibrary = useBuilderStore((s) => s.insertFromLibrary);
  const move = useBuilderStore((s) => s.move);
  const removeSelected = useBuilderStore((s) => s.removeSelected);
  const duplicateSelected = useBuilderStore((s) => s.duplicateSelected);
  const copySelected = useBuilderStore((s) => s.copySelected);
  const pasteCopied = useBuilderStore((s) => s.pasteCopied);
  const [ready, setReady] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [project, pageRes, theme] = await Promise.all([
          api.get<{ id: string; name: string }>(`/api/projects/${projectId}`),
          api.get<{
            contentJson: PageDocument;
            version: number;
          }>(`/api/pages/${pageId}`),
          api.get<{ tokens: ThemeTokens }>(`/api/projects/${projectId}/theme`),
        ]);
        if (cancelled) return;
        hydrate({
          page: pageRes.contentJson,
          projectId,
          projectName: project.name,
          theme: theme.tokens,
          version: pageRes.version,
        });
        setReady(true);
      } catch (err) {
        if (err instanceof ApiClientError && err.status === 401) {
          router.replace(`/login?next=/projects/${projectId}/pages/${pageId}`);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [projectId, pageId, hydrate, router]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if (meta && (e.key === "Z" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
      if (meta && e.key === "s") {
        e.preventDefault();
        void save(true);
      }
      if (meta && e.key === "d") {
        e.preventDefault();
        duplicateSelected();
      }
      if (meta && e.key === "c") {
        const tag = (e.target as HTMLElement).tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        e.preventDefault();
        copySelected();

        // Also write to system clipboard if page is selected
        const state = useBuilderStore.getState();
        if (state.selectedNodeId === "page" || state.selectedNodeId === state.page?.root.id) {
          if (state.page) {
            const payload = {
              type: "productstudio/page",
              version: 1,
              page: state.page,
            };
            void navigator.clipboard.writeText(JSON.stringify(payload));
          }
        }
      }
      if (meta && e.key === "v") {
        const tag = (e.target as HTMLElement).tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        e.preventDefault();
        void pasteCopied();
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        const tag = (e.target as HTMLElement).tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        e.preventDefault();
        removeSelected();
      }
    }

    function onPageDuplicated(e: Event) {
      const customEvent = e as CustomEvent;
      const { newPageId, projectId } = customEvent.detail;
      if (newPageId && projectId) {
        void useBuilderStore.getState().switchPage(newPageId);
        setLeftTab("pages");
      }
    }

    window.addEventListener("keydown", onKey);
    window.addEventListener("ps-page-duplicated", onPageDuplicated);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("ps-page-duplicated", onPageDuplicated);
    };
  }, [undo, redo, save, duplicateSelected, copySelected, pasteCopied, removeSelected, router, setLeftTab]);

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || !page) return;
    const activeData = active.data.current;
    const overData = over.data.current;

    let parentId = page.root.id;
    if (overData?.type === "drop-container" && overData.acceptsChildren) {
      parentId = overData.nodeId as string;
    } else if (typeof over.id === "string" && over.id.startsWith("drop:")) {
      parentId = over.id.replace("drop:", "");
    }

    const index = page.root.children?.length ?? 0;

    if (activeData?.type === "library-item") {
      insertFromLibrary(activeData.componentType as string, parentId, index);
      return;
    }
    if (activeData?.type === "canvas-node") {
      move(activeData.nodeId as string, parentId, index);
    }
  }

  async function doExport(format: "html" | "react") {
    const result = await api.post<{ downloadUrl: string }>(`/api/pages/${pageId}/export`, {
      format,
    });
    window.location.href = result.downloadUrl;
    setExportOpen(false);
  }

  if (!ready || !page) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-neutral-500">
        Loading builder…
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={collisionDetection} onDragEnd={onDragEnd}>
      <div className="flex h-screen w-full overflow-hidden flex-col bg-[#F9F9F9] dark:bg-[#111111] text-foreground font-sans tracking-[-0.01em]">
        <header className="relative z-50 flex h-[38px] items-center justify-between border-b border-neutral-200 dark:border-white/5 bg-[#F9F9F9] px-3 dark:bg-[#111111]">
          {/* LEFT: Dashboard, Title, Save Status */}
          <div className="flex flex-1 items-center gap-3">
            <button
              className="flex h-8 items-center gap-1.5 rounded-md px-2 text-[13px] font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white"
              onClick={() => router.push("/dashboard")}
              title="Back to Dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden lg:inline">Dashboard</span>
            </button>

            <div className="h-4 w-[1px] bg-neutral-200 dark:bg-neutral-800" />

            <div className="flex items-center gap-3 px-1">
              <strong className="max-w-[150px] truncate text-[14px] font-bold text-foreground sm:max-w-[200px]">
                {projectName}
              </strong>
            </div>
          </div>

          {/* CENTER: AI, Undo, Redo, Zoom, Responsive */}
          <div className="flex flex-1 justify-center items-center gap-2">
            <button
              className="flex h-8 items-center gap-1.5 rounded-md border border-indigo-500/20 bg-indigo-50 px-2.5 text-[13px] font-medium text-indigo-600 transition-all hover:bg-indigo-100 hover:text-indigo-700 dark:border-indigo-400/20 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20 dark:hover:text-indigo-300"
              onClick={() => setAiOpen(true)}
            >
              <Sparkles className="h-4 w-4 shrink-0" />
              <span className="hidden leading-none md:inline font-semibold">AI</span>
            </button>

            <div className="h-4 w-[1px] bg-neutral-200 dark:bg-neutral-800 hidden md:block" />

            <div className="hidden md:flex items-center gap-0.5">
              <button
                className="flex h-8 w-8 items-center justify-center rounded-[4px] text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-foreground dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
                onClick={undo}
                disabled={!undoStack.length}
                title="Undo (Cmd+Z)"
              >
                <Undo2 className="h-[15px] w-[15px]" />
              </button>
              <button
                className="flex h-8 w-8 items-center justify-center rounded-[4px] text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-foreground dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
                onClick={redo}
                disabled={!redoStack.length}
                title="Redo (Cmd+Shift+Z)"
              >
                <Redo2 className="h-[15px] w-[15px]" />
              </button>
            </div>

            <div className="hidden md:flex items-center">
              <button
                className="flex h-8 px-2.5 items-center justify-center rounded-[4px] text-[13px] font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-foreground dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white disabled:opacity-50"
                onClick={() => void save(true)}
                disabled={saveStatus === "saving"}
                title="Save (Cmd+S)"
              >
                Save
              </button>
            </div>

            <div className="h-4 w-[1px] bg-neutral-200 dark:bg-neutral-800 hidden md:block" />

            <div className="hidden sm:block">
              <ZoomControls />
            </div>

            <div className="hidden md:flex rounded-md border border-neutral-200/80 p-0.5 bg-white shadow-sm dark:border-neutral-800/80 dark:bg-[#111111]">
              {(["desktop", "tablet", "mobile"] as const).map((bp) => {
                const icons = { desktop: Monitor, tablet: Tablet, mobile: Smartphone };
                const Icon = icons[bp];
                return (
                  <button
                    key={bp}
                    onClick={() => setBreakpoint(bp)}
                    className={`flex h-7 w-8 items-center justify-center rounded-[4px] transition-colors ${activeBreakpoint === bp ? "bg-neutral-100 text-foreground dark:bg-white/10 dark:text-white shadow-sm bg-neutral-100" : "text-neutral-500 hover:text-foreground dark:text-neutral-400 dark:hover:text-neutral-200"}`}
                    title={`${bp.charAt(0).toUpperCase() + bp.slice(1)} (${BREAKPOINT_WIDTHS[bp]}px)`}
                  >
                    <Icon className="h-[14px] w-[14px]" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT: Export, Settings */}
          <div className="flex flex-1 items-center justify-end gap-2">
            <a
              className="flex h-8 items-center justify-center rounded-[4px] text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 w-8 dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white"
              href={`/projects/${projectId}/settings`}
              title="Project Settings"
            >
              <Settings className="h-4 w-4" />
            </a>

            <button
              className="flex h-8 items-center gap-1.5 rounded-md bg-primary-600 px-3 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-primary-700 active:scale-95"
              onClick={() => setExportOpen(true)}
            >
              <ArrowUpRight className="h-[15px] w-[15px]" strokeWidth={2.5} />
              <span>Export</span>
            </button>
          </div>
        </header>

        <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
          <aside className="flex w-[220px] flex-col border-r border-neutral-200 dark:border-white/5 bg-[#F9F9F9] dark:bg-[#2C2C2C]">
            <div className="flex border-b border-neutral-100 dark:border-white/5">
              <button
                className={`flex-1 py-2 text-[11px] font-medium transition-colors ${leftTab === "components" ? "border-b-2 border-primary-500 text-primary-600 dark:text-primary-400" : "text-neutral-500 dark:text-neutral-400 hover:text-foreground"}`}
                onClick={() => setLeftTab("components")}
              >
                Components
              </button>
              <button
                className={`flex-1 py-2 text-[11px] font-medium transition-colors ${leftTab === "pages" ? "border-b-2 border-primary-500 text-primary-600 dark:text-primary-400" : "text-neutral-500 dark:text-neutral-400 hover:text-foreground"}`}
                onClick={() => setLeftTab("pages")}
              >
                Pages
              </button>
            </div>
            {leftTab === "components" ? (
              <ComponentLibraryPanel />
            ) : (
              <PagesPanel projectId={projectId} />
            )}
          </aside>

          <Canvas />

          <aside className="w-[240px] border-l border-neutral-200 dark:border-white/5 bg-[#F9F9F9] dark:bg-[#2C2C2C]">
            <PropertiesPanel />
          </aside>
        </div>
      </div>

      <DragOverlay>
        <div className="rounded bg-primary-600 px-3 py-2 text-xs font-medium text-white shadow-lg">Component</div>
      </DragOverlay>

      {exportOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-80 rounded-xl bg-white dark:bg-[#111] p-6 shadow-2xl border border-neutral-200 dark:border-white/10">
            <h2 className="font-semibold text-foreground">Export page</h2>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Choose an export format.</p>
            <div className="mt-4 flex flex-col gap-2">
              <button
                className="rounded-md bg-primary-600 hover:bg-primary-700 transition-colors px-3 py-2 text-sm font-medium text-white shadow-sm"
                onClick={() => void doExport("html")}
              >
                Static HTML
              </button>
              <button
                className="rounded-md bg-neutral-900 dark:bg-white dark:text-black dark:hover:bg-neutral-200 hover:bg-neutral-800 transition-colors px-3 py-2 text-sm font-medium text-white shadow-sm"
                onClick={() => void doExport("react")}
              >
                React (TSX)
              </button>
              <button className="text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-foreground transition-colors mt-1" onClick={() => setExportOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <AIAssistantModal
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        projectId={projectId}
        pageId={pageId}
      />
    </DndContext>
  );
}
