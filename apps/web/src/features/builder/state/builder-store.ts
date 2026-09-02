"use client";

import { create } from "zustand";
import type {
  Breakpoint,
  ComponentNode,
  PageDocument,
  SaveStatus,
  ThemeTokens,
} from "@productstudio/shared-types";
import { DEFAULT_THEME_TOKENS } from "@productstudio/shared-types";
import {
  deleteNode,
  duplicateNode,
  insertNode,
  moveNode,
  updateNodeProps,
  resetNodeProp,
} from "@productstudio/json-engine";
import { instantiateComponent } from "@productstudio/component-registry";
import { api, ApiClientError } from "@/lib/api-client";

const MAX_UNDO = 50;

interface BuilderStore {
  page: PageDocument | null;
  projectId: string | null;
  projectName: string;
  theme: ThemeTokens;
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
  activeBreakpoint: Breakpoint;
  undoStack: PageDocument[];
  redoStack: PageDocument[];
  saveStatus: SaveStatus;
  lastSavedAt: string | null;
  expectedVersion: number;
  leftTab: "components" | "pages";
  propTab: "content" | "style" | "layout" | "responsive" | "advanced";

  // Canvas View State
  zoom: number;
  offsetX: number;
  offsetY: number;


  hydrate: (input: {
    page: PageDocument;
    projectId: string;
    projectName: string;
    theme: ThemeTokens;
    version: number;
  }) => void;
  selectNode: (id: string | null) => void;
  setHovered: (id: string | null) => void;
  setBreakpoint: (bp: Breakpoint) => void;
  setLeftTab: (tab: "components" | "pages") => void;
  setPropTab: (tab: BuilderStore["propTab"]) => void;
  commit: (next: PageDocument) => void;
  insertFromLibrary: (componentType: string, parentId: string, index: number) => void;
  move: (nodeId: string, parentId: string, index: number) => void;
  updateProps: (nodeId: string, patch: Record<string, unknown>) => void;
  updatePageDimensions: (bp: Breakpoint, width: number, height: number) => void;
  resetResponsiveProp: (nodeId: string, key: string) => void;
  removeSelected: () => void;
  duplicateSelected: () => void;
  undo: () => void;
  redo: () => void;
  save: (manual?: boolean) => Promise<void>;
  replacePageDocument: (doc: PageDocument) => void;
  setCanvasView: (zoom: number, offsetX: number, offsetY: number) => void;
}

let autosaveTimer: ReturnType<typeof setTimeout> | null = null;
let retryTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleAutosave(get: () => BuilderStore, set: (p: Partial<BuilderStore>) => void) {
  if (autosaveTimer) clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => {
    void get().save(false);
  }, 1800);
  set({ saveStatus: "unsaved" });
}

export const useBuilderStore = create<BuilderStore>((set, get) => ({
  page: null,
  projectId: null,
  projectName: "",
  theme: DEFAULT_THEME_TOKENS,
  selectedNodeId: null,
  hoveredNodeId: null,
  activeBreakpoint: "desktop",
  undoStack: [],
  redoStack: [],
  saveStatus: "saved",
  lastSavedAt: null,
  expectedVersion: 1,
  leftTab: "components",
  propTab: "content",
  zoom: 1,
  offsetX: 0,
  offsetY: 0,

  hydrate: ({ page, projectId, projectName, theme, version }) => {
    set({
      page,
      projectId,
      projectName,
      theme,
      expectedVersion: version,
      activeBreakpoint: (page.metadata?.viewport as Breakpoint) || "desktop",
      selectedNodeId: null,
      undoStack: [],
      redoStack: [],
      saveStatus: "saved",
      lastSavedAt: page.metadata.updatedAt,
    });
  },

  selectNode: (id) => set({ selectedNodeId: id }),
  setHovered: (id) => set({ hoveredNodeId: id }),
  setBreakpoint: (bp) => set({ activeBreakpoint: bp }),
  setLeftTab: (tab) => set({ leftTab: tab }),
  setPropTab: (tab) => set({ propTab: tab }),
  setCanvasView: (zoom, offsetX, offsetY) => set({ zoom, offsetX, offsetY }),

  commit: (next) => {
    const { page, undoStack } = get();
    if (!page) return;
    set({
      page: next,
      undoStack: [...undoStack, page].slice(-MAX_UNDO),
      redoStack: [],
    });
    scheduleAutosave(get, set);
  },

  insertFromLibrary: (componentType, parentId, index) => {
    const { page, commit } = get();
    if (!page) return;
    const node = instantiateComponent(componentType);
    commit(insertNode(page, parentId, index, node));
    set({ selectedNodeId: node.id });
  },

  move: (nodeId, parentId, index) => {
    const { page, commit } = get();
    if (!page) return;
    try {
      commit(moveNode(page, nodeId, parentId, index));
    } catch {
      /* invalid move */
    }
  },

  updateProps: (nodeId, patch) => {
    const { page, activeBreakpoint, commit } = get();
    if (!page) return;
    commit(updateNodeProps(page, nodeId, activeBreakpoint, patch));
  },

  updatePageDimensions: (bp, width, height) => {
    const { page, commit } = get();
    if (!page) return;
    const currentDims = page.metadata.dimensions || {};
    commit({
      ...page,
      metadata: {
        ...page.metadata,
        dimensions: {
          ...currentDims,
          [bp]: { width, height },
        },
      },
    });
  },

  resetResponsiveProp: (nodeId, key) => {
    const { page, activeBreakpoint, commit } = get();
    if (!page || activeBreakpoint === "desktop") return;
    commit(resetNodeProp(page, nodeId, activeBreakpoint, key));
  },

  removeSelected: () => {
    const { page, selectedNodeId, commit } = get();
    if (!page || !selectedNodeId || selectedNodeId === page.root.id) return;
    const node = findNodeLocal(page.root, selectedNodeId);
    if (node?.children?.length) {
      if (!window.confirm("Delete this container and all children?")) return;
    }
    commit(deleteNode(page, selectedNodeId));
    set({ selectedNodeId: null });
  },

  duplicateSelected: () => {
    const { page, selectedNodeId, commit } = get();
    if (!page || !selectedNodeId || selectedNodeId === page.root.id) return;
    commit(duplicateNode(page, selectedNodeId));
  },

  undo: () => {
    const { page, undoStack, redoStack } = get();
    if (!page || !undoStack.length) return;
    const prev = undoStack[undoStack.length - 1]!;
    set({
      page: prev,
      undoStack: undoStack.slice(0, -1),
      redoStack: [...redoStack, page],
    });
    scheduleAutosave(get, set);
  },

  redo: () => {
    const { page, undoStack, redoStack } = get();
    if (!page || !redoStack.length) return;
    const next = redoStack[redoStack.length - 1]!;
    set({
      page: next,
      redoStack: redoStack.slice(0, -1),
      undoStack: [...undoStack, page],
    });
    scheduleAutosave(get, set);
  },

  replacePageDocument: (doc) => {
    get().commit(doc);
  },

  save: async (manual = false) => {
    const { page, expectedVersion, saveStatus } = get();
    if (!page) return;
    if (autosaveTimer) {
      clearTimeout(autosaveTimer);
      autosaveTimer = null;
    }
    if (saveStatus === "saving" && !manual) return;

    set({ saveStatus: "saving" });
    try {
      const result = await api.post<{ pageId: string; version: number; savedAt: string }>(
        `/api/pages/${page.pageId}/save`,
        { contentJson: page, expectedVersion },
      );
      set({
        saveStatus: "saved",
        lastSavedAt: result.savedAt,
        expectedVersion: result.version,
        page: {
          ...page,
          metadata: { ...page.metadata, version: result.version, updatedAt: result.savedAt },
        },
      });
    } catch (err) {
      if (err instanceof ApiClientError && err.code === "VERSION_CONFLICT") {
        set({ saveStatus: "error" });
        window.alert(
          "This page was modified elsewhere. Reload the page to get the latest version.",
        );
        return;
      }
      set({ saveStatus: "error" });
      if (retryTimer) clearTimeout(retryTimer);
      retryTimer = setTimeout(() => {
        void get().save(false);
      }, 3000);
    }
  },
}));

function findNodeLocal(root: ComponentNode, id: string): ComponentNode | null {
  if (root.id === id) return root;
  for (const c of root.children ?? []) {
    const f = findNodeLocal(c, id);
    if (f) return f;
  }
  return null;
}
