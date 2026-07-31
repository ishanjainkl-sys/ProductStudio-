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
import { Canvas } from "./canvas/Canvas";
import { ComponentLibraryPanel } from "./component-library-panel/ComponentLibraryPanel";
import { PagesPanel } from "./component-library-panel/PagesPanel";
import { PropertiesPanel } from "./properties-panel/PropertiesPanel";

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
  const insertFromLibrary = useBuilderStore((s) => s.insertFromLibrary);
  const move = useBuilderStore((s) => s.move);
  const removeSelected = useBuilderStore((s) => s.removeSelected);
  const duplicateSelected = useBuilderStore((s) => s.duplicateSelected);
  const [ready, setReady] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

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
      if (e.key === "Delete" || e.key === "Backspace") {
        const tag = (e.target as HTMLElement).tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        e.preventDefault();
        removeSelected();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo, save, duplicateSelected, removeSelected]);

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

  const saveLabel =
    saveStatus === "saving"
      ? "Saving…"
      : saveStatus === "unsaved"
        ? "Unsaved changes"
        : saveStatus === "error"
          ? "Save failed — retrying"
          : lastSavedAt
            ? `Saved at ${new Date(lastSavedAt).toLocaleTimeString()}`
            : "Saved";

  if (!ready || !page) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-neutral-500">
        Loading builder…
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={collisionDetection} onDragEnd={onDragEnd}>
      <div className="flex h-screen flex-col bg-neutral-100">
        <header className="flex h-12 items-center gap-4 border-b border-neutral-200 bg-white px-4">
          <button
            className="text-xs text-neutral-500 hover:text-neutral-900"
            onClick={() => router.push("/dashboard")}
          >
            ← Dashboard
          </button>
          <strong className="text-sm">{projectName}</strong>
          <span
            className={`text-xs ${
              saveStatus === "saved"
                ? "text-emerald-600"
                : saveStatus === "unsaved"
                  ? "text-amber-600"
                  : saveStatus === "error"
                    ? "text-red-600"
                    : "text-neutral-500"
            }`}
          >
            {saveStatus === "saved" ? "✓ " : saveStatus === "unsaved" ? "● " : ""}
            {saveLabel}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button className="rounded px-2 py-1 text-xs hover:bg-neutral-100" onClick={undo}>
              Undo
            </button>
            <button className="rounded px-2 py-1 text-xs hover:bg-neutral-100" onClick={redo}>
              Redo
            </button>
            <button
              className="rounded px-2 py-1 text-xs hover:bg-neutral-100"
              onClick={() => void save(true)}
            >
              Save
            </button>
            <div className="flex rounded-md border border-neutral-200 p-0.5">
              {(["desktop", "tablet", "mobile"] as const).map((bp) => (
                <button
                  key={bp}
                  onClick={() => setBreakpoint(bp)}
                  className={`rounded px-2 py-1 text-xs capitalize ${activeBreakpoint === bp ? "bg-primary-500 text-white" : ""}`}
                  title={`${BREAKPOINT_WIDTHS[bp]}px`}
                >
                  {bp}
                </button>
              ))}
            </div>
            <button
              className="rounded-md bg-primary-500 px-3 py-1.5 text-xs font-semibold text-white"
              onClick={() => setExportOpen(true)}
            >
              Export
            </button>
            <a
              className="rounded px-2 py-1 text-xs hover:bg-neutral-100"
              href={`/projects/${projectId}/settings`}
            >
              Settings
            </a>
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          <aside className="flex w-64 flex-col border-r border-neutral-200 bg-white">
            <div className="flex border-b border-neutral-100">
              <button
                className={`flex-1 py-2 text-xs font-medium ${leftTab === "components" ? "border-b-2 border-primary-500 text-primary-900" : "text-neutral-500"}`}
                onClick={() => setLeftTab("components")}
              >
                Components
              </button>
              <button
                className={`flex-1 py-2 text-xs font-medium ${leftTab === "pages" ? "border-b-2 border-primary-500 text-primary-900" : "text-neutral-500"}`}
                onClick={() => setLeftTab("pages")}
              >
                Pages
              </button>
            </div>
            {leftTab === "components" ? (
              <ComponentLibraryPanel />
            ) : (
              <PagesPanel projectId={projectId} pageId={pageId} />
            )}
          </aside>

          <Canvas />

          <aside className="w-80 border-l border-neutral-200 bg-white">
            <PropertiesPanel />
          </aside>
        </div>
      </div>

      <DragOverlay>
        <div className="rounded bg-primary-500 px-3 py-2 text-xs text-white shadow">Component</div>
      </DragOverlay>

      {exportOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-80 rounded-xl bg-white p-6 shadow-lg">
            <h2 className="font-semibold">Export page</h2>
            <p className="mt-1 text-sm text-neutral-500">Choose an export format.</p>
            <div className="mt-4 flex flex-col gap-2">
              <button
                className="rounded-md bg-primary-500 px-3 py-2 text-sm text-white"
                onClick={() => void doExport("html")}
              >
                Static HTML
              </button>
              <button
                className="rounded-md bg-neutral-900 px-3 py-2 text-sm text-white"
                onClick={() => void doExport("react")}
              >
                React (TSX)
              </button>
              <button className="text-sm text-neutral-500" onClick={() => setExportOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </DndContext>
  );
}
