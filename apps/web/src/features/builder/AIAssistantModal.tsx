"use client";

import { useState } from "react";
import { useBuilderStore } from "./state/builder-store";
import { api } from "@/lib/api-client";
import type { PageDocument } from "@productstudio/shared-types";

// Import generateId to assign IDs recursively
function recurseIds(node: any) {
    if (!node.id) {
        node.id = "gen-" + Math.random().toString(36).substring(2, 9);
    }
    if (node.children) {
        for (const c of node.children) {
            recurseIds(c);
        }
    }
    return node;
}

export function AIAssistantModal({
    projectId,
    pageId,
    open,
    onClose,
}: {
    projectId: string;
    pageId: string;
    open: boolean;
    onClose: () => void;
}) {
    const [prompt, setPrompt] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const selectedNodeId = useBuilderStore((s) => s.selectedNodeId);
    const page = useBuilderStore((s) => s.page);
    const commit = useBuilderStore((s) => s.commit);

    if (!open) return null;

    async function handleGenerate() {
        if (!prompt.trim()) return;
        setLoading(true);
        setError(null);
        try {
            if (selectedNodeId) {
                // Find current component node stringified to pass to backend
                function findNode(root: any, id: string): any {
                    if (root.id === id) return root;
                    for (const c of root.children || []) {
                        const f = findNode(c, id);
                        if (f) return f;
                    }
                    return null;
                }
                const currentNode = findNode(page?.root, selectedNodeId);

                const res = await api.post<any>("/api/ai/edit", {
                    prompt,
                    projectId,
                    pageId,
                    selectedComponentId: selectedNodeId,
                    currentComponentNode: JSON.stringify(currentNode),
                });

                if (res.updates) {
                    // Deep clone and patch
                    const newPage = JSON.parse(JSON.stringify(page));
                    const nodeToUpdate = findNode(newPage.root, selectedNodeId);
                    if (nodeToUpdate) {
                        nodeToUpdate.props = { ...nodeToUpdate.props, ...res.updates };
                        commit(newPage);
                    }
                }
            } else {
                if (prompt.toLowerCase().includes("seo")) {
                    const res = await api.post<any>("/api/ai/seo", {
                        pageContentStr: JSON.stringify(page),
                    });
                    if (res) {
                        const newPage = JSON.parse(JSON.stringify(page));
                        newPage.seo = { ...newPage.seo, ...res };
                        commit(newPage);
                    }
                } else {
                    // Generate whole page structure
                    const res = await api.post<any>("/api/ai/generate", {
                        prompt,
                        projectId,
                        pageId,
                    });

                    if (res.page && res.page.components) {
                        const newPage = JSON.parse(JSON.stringify(page)) as PageDocument;
                        const newChildren = res.page.components.map(recurseIds);
                        // Assuming we replace the root's children
                        newPage.root.children = newChildren;
                        if (res.page.theme) {
                            // we could update theme here if needed
                        }
                        commit(newPage);
                    }
                }
            }
            onClose();
        } catch (err: any) {
            setError(err.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-[500px] rounded-xl bg-white dark:bg-[#111] p-6 shadow-2xl border border-neutral-200 dark:border-white/10">
                <h2 className="font-semibold text-foreground text-lg flex items-center gap-2">
                    ✨ AI Assistant
                </h2>
                <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                    {selectedNodeId ? "What would you like to change in this component?" : "What would you like to create?"}
                </p>

                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="mt-4 w-full h-32 rounded-md border border-neutral-300 dark:border-white/10 p-3 text-sm flex-1 bg-transparent dark:text-white"
                    placeholder={selectedNodeId ? "E.g. Make this hero section modern" : "E.g. Create a modern SaaS landing page..."}
                />

                {error && <div className="mt-4 text-red-500 text-sm font-medium pt-2">{error}</div>}

                <div className="mt-4 flex flex-wrap gap-2">
                    {selectedNodeId ? (
                        <>
                            <button className="text-xs bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 px-2 py-1 rounded" onClick={() => setPrompt("Make this section more modern")}>Modernize</button>
                            <button className="text-xs bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 px-2 py-1 rounded" onClick={() => setPrompt("Improve spacing and typography")}>Improve Design</button>
                        </>
                    ) : (
                        <>
                            <button className="text-xs bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 px-2 py-1 rounded" onClick={() => setPrompt("Create a modern SaaS landing page")}>SaaS Landing Page</button>
                            <button className="text-xs bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 px-2 py-1 rounded" onClick={() => setPrompt("Generate a portfolio website")}>Portfolio</button>
                            <button className="text-xs bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 px-2 py-1 rounded" onClick={() => setPrompt("Generate SEO metadata for this page")}>Generate SEO</button>
                        </>
                    )}
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        className="text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-foreground transition-colors"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        className="rounded-md bg-[#8b5cf6] hover:bg-[#7c3aed] transition-colors px-4 py-2 text-sm font-semibold text-white shadow-sm flex flex-row items-center gap-2"
                        onClick={handleGenerate}
                        disabled={loading}
                    >
                        {loading ? "Generating..." : "Generate"}
                    </button>
                </div>
            </div>
        </div>
    );
}
