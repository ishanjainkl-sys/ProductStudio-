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
  pasteNode,
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
  copiedNode: { objects: ComponentNode[]; sourcePageId: string; isPage?: boolean } | null;
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
  copySelected: () => void;
  pasteCopied: () => void;
  bringToFront: () => void;
  sendToBack: () => void;
  groupSelection: () => void;
  ungroupSelection: () => void;
  pasteToReplace: () => void;
  undo: () => void;
  redo: () => void;
  save: (manual?: boolean) => Promise<void>;
  replacePageDocument: (doc: PageDocument) => void;
  setCanvasView: (zoom: number, offsetX: number, offsetY: number) => void;
  switchPage: (newPageId: string) => Promise<void>;
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
  copiedNode: null,
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
  setBreakpoint: (bp) => {
    set({ activeBreakpoint: bp });
    // Reset the active page's dimensions to strictly match the requested breakpoint standard when clicked
    const { page, commit } = get();
    if (page) {
      const standardWidths: Record<string, number> = { desktop: 1440, tablet: 834, mobile: 390 };
      const currentDims = page.metadata.dimensions || {};
      const targetWidth = standardWidths[bp];
      // preserve height if it exists, or provide fallback
      const targetHeight = currentDims[bp]?.height || 800;

      commit({
        ...page,
        metadata: {
          ...page.metadata,
          dimensions: {
            ...currentDims,
            [bp]: { width: targetWidth, height: targetHeight },
          }
        }
      });
    }
  },
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
    try {
      const nextDoc = duplicateNode(page, selectedNodeId);
      commit(nextDoc);

      const parentInNext = findParentLocal(nextDoc.root, selectedNodeId);
      if (parentInNext && parentInNext.parent.children) {
        const duplicated = parentInNext.parent.children[parentInNext.index + 1];
        if (duplicated) set({ selectedNodeId: duplicated.id });
      }
    } catch (e) {
      /* ignore */
    }
  },

  bringToFront: () => {
    const { page, selectedNodeId, move } = get();
    if (!page || !selectedNodeId || selectedNodeId === page.root.id) return;
    const location = findParentLocal(page.root, selectedNodeId);
    if (!location || !location.parent.children) return;
    move(selectedNodeId, location.parent.id, location.parent.children.length - 1);
  },

  sendToBack: () => {
    const { page, selectedNodeId, move } = get();
    if (!page || !selectedNodeId || selectedNodeId === page.root.id) return;
    const location = findParentLocal(page.root, selectedNodeId);
    if (!location) return;
    move(selectedNodeId, location.parent.id, 0);
  },

  groupSelection: () => {
    const { page, selectedNodeId, commit } = get();
    if (!page || !selectedNodeId || selectedNodeId === page.root.id) return;
    const location = findParentLocal(page.root, selectedNodeId);
    if (!location || !location.parent.children) return;
    const node = location.parent.children[location.index];
    if (!node) return;

    try {
      const stack = instantiateComponent("layout.stack");
      let nextDoc = insertNode(page, location.parent.id, location.index, stack);
      nextDoc = moveNode(nextDoc, node.id, stack.id, 0);
      commit(nextDoc);
      set({ selectedNodeId: stack.id });
    } catch {
      // Ignore
    }
  },

  ungroupSelection: () => {
    const { page, selectedNodeId, commit } = get();
    if (!page || !selectedNodeId || selectedNodeId === page.root.id) return;
    const location = findParentLocal(page.root, selectedNodeId);
    if (!location) return;
    const node = location.parent.children?.[location.index];
    if (!node || !node.children || node.children.length === 0) return;

    try {
      let nextDoc = page;
      // Copy all children of the selected node and insert them right before the selected node
      const children = [...node.children];
      let insertIndex = location.index;
      for (const child of children) {
        nextDoc = moveNode(nextDoc, child.id, location.parent.id, insertIndex);
        insertIndex++;
      }
      nextDoc = deleteNode(nextDoc, selectedNodeId);
      commit(nextDoc);
      // set selected to the parent or first child? Let's just set it to the first child
      set({ selectedNodeId: children[0]?.id });
    } catch {
      // Ignore
    }
  },

  pasteToReplace: async () => {
    const { pasteCopied, selectedNodeId, removeSelected, page } = get();
    if (!selectedNodeId || !page || selectedNodeId === page.root.id) return;
    const location = findParentLocal(page.root, selectedNodeId);

    // We will select the parent temporarily so pasteCopied creates the node inside it
    if (location) {
      set({ selectedNodeId: location.parent.id });
      await pasteCopied();
      // Since pasteCopied creates duplicate/new element at the end of parent, let's remove the original.
      set({ selectedNodeId: selectedNodeId });
      removeSelected();
      // The newly pasted element will just be appended to parent, which mimics replace roughly.
    }
  },

  copySelected: () => {
    const { page, selectedNodeId } = get();
    if (!page || !selectedNodeId) return;

    if (selectedNodeId === "page" || selectedNodeId === page.root.id) {
      set({ copiedNode: { objects: [page.root], sourcePageId: page.pageId, isPage: true } });
      try {
        navigator.clipboard.writeText(
          JSON.stringify({ type: "productstudio/page", version: 1, page })
        );
      } catch { }
      return;
    }

    const node = findNodeLocal(page.root, selectedNodeId);
    if (node) {
      set({ copiedNode: { objects: [node], sourcePageId: page.pageId, isPage: false } });
      try {
        navigator.clipboard.writeText(
          JSON.stringify({ type: "productstudio/component", version: 1, component: node })
        );
      } catch { }
    }
  },

  pasteCopied: async () => {
    const { page, selectedNodeId, copiedNode, commit } = get();
    if (!page) return;

    const doDuplicatePage = async (sourceDoc: PageDocument) => {
      const { cloneDocumentWithNewIds } = await import("@productstudio/json-engine");
      const { BREAKPOINT_WIDTHS } = await import("@productstudio/shared-types");
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
      const created = await api.post<{ id: string; version: number }>(`/api/projects/${page.projectId}/pages`, { name: newName });
      const { doc } = cloneDocumentWithNewIds(sourceDoc);

      const viewport = page.metadata?.viewport || "desktop";
      const width = page.metadata?.dimensions?.[viewport]?.width ?? BREAKPOINT_WIDTHS[viewport];

      let maxCanvasX = page.metadata?.canvasX || 0;
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
        projectId: page.projectId,
        name: newName,
        metadata: {
          ...doc.metadata,
          canvasX: offsetX,
          canvasY: page.metadata?.canvasY || 0
        }
      };

      await api.post(`/api/pages/${created.id}/save`, {
        contentJson: nextDoc,
        expectedVersion: created.version ?? 1
      });

      window.dispatchEvent(new CustomEvent("ps-other-pages-changed"));
    };

    // First try to check the clipboard for a page payload
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        const payload = JSON.parse(text);
        if (payload?.type === "productstudio/page" && payload.page) {
          await doDuplicatePage(payload.page);
          return;
        }
        if (payload?.type === "productstudio/component" && payload.component) {
          // Paste component from clipboard
          const sourceNode = payload.component;
          if (sourceNode.type === "page" || sourceNode.id.includes("root")) return;

          let targetId = (selectedNodeId && selectedNodeId !== "page") ? selectedNodeId : page.root.id;
          // Validate the target exists on the current page, fallback to root if not
          if (!findNodeLocal(page.root, targetId)) {
            targetId = page.root.id;
          }

          try {
            const nextDoc = pasteNode(page, targetId, sourceNode);
            commit(nextDoc);

            const targetInNext = findNodeLocal(nextDoc.root, targetId);
            if (targetInNext) {
              if (targetInNext.children && targetInNext.children.length > 0 && targetId !== sourceNode.id) {
                const pasted = targetInNext.children[targetInNext.children.length - 1];
                if (pasted) set({ selectedNodeId: pasted.id });
              } else {
                const parentInNext = findParentLocal(nextDoc.root, targetId);
                if (parentInNext && parentInNext.parent.children) {
                  const pasted = parentInNext.parent.children[parentInNext.index + 1];
                  if (pasted) set({ selectedNodeId: pasted.id });
                }
              }
            }
          } catch (err) {
            console.error("Failed to paste node from clipboard:", err);
          }
          return;
        }
      }
    } catch {
      // ignore clipboard error and fallback to memory
    }

    if (!copiedNode) return;

    // Check if the memory payload is a page
    if (copiedNode.isPage) {
      if (copiedNode.sourcePageId === page.pageId) {
        await doDuplicatePage(page);
      } else {
        // If it's from another page but we couldn't read the clipboard, we can't get the full page cleanly without fetching.
        // Let's just fetch it!
        try {
          const res = await api.get<{ contentJson: PageDocument }>(`/api/pages/${copiedNode.sourcePageId}`);
          await doDuplicatePage(res.contentJson);
        } catch { }
      }
      return;
    }

    if (!copiedNode.objects.length) return;
    const sourceNode = copiedNode.objects[0];
    if (!sourceNode) return;

    // Prevent pasting a page root directly into another component (just in case)
    if (sourceNode.type === "page" || sourceNode.id.includes("root")) {
      return;
    }

    let targetId = (selectedNodeId && selectedNodeId !== "page") ? selectedNodeId : page.root.id;
    if (!findNodeLocal(page.root, targetId)) {
      targetId = page.root.id;
    }

    try {
      const nextDoc = pasteNode(page, targetId, sourceNode);
      commit(nextDoc);

      const targetInNext = findNodeLocal(nextDoc.root, targetId);
      if (targetInNext) {
        if (targetInNext.children && targetInNext.children.length > 0 && targetId !== sourceNode.id) {
          const pasted = targetInNext.children[targetInNext.children.length - 1];
          if (pasted) set({ selectedNodeId: pasted.id });
        } else {
          const parentInNext = findParentLocal(nextDoc.root, targetId);
          if (parentInNext && parentInNext.parent.children) {
            const pasted = parentInNext.parent.children[parentInNext.index + 1];
            if (pasted) set({ selectedNodeId: pasted.id });
          }
        }
      }
    } catch (err) {
      console.error("Failed to paste node:", err);
    }
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

  switchPage: async (newPageId: string) => {
    const { projectId, projectName, theme, saveStatus, save, hydrate } = get();
    if (!projectId) return;

    if (saveStatus !== "saved") {
      await save(true);
    }

    try {
      window.history.pushState(null, "", `/projects/${projectId}/pages/${newPageId}`);
      const pageRes = await api.get<{ contentJson: PageDocument; version: number }>(`/api/pages/${newPageId}`);
      hydrate({
        page: pageRes.contentJson,
        projectId,
        projectName,
        theme,
        version: pageRes.version,
      });
    } catch (err) {
      console.error("Failed to switch page:", err);
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

function findParentLocal(root: ComponentNode, id: string): { parent: ComponentNode; index: number } | null {
  const children = root.children ?? [];
  for (let i = 0; i < children.length; i++) {
    const child = children[i]!;
    if (child.id === id) return { parent: root, index: i };
    const nested = findParentLocal(child, id);
    if (nested) return nested;
  }
  return null;
}
