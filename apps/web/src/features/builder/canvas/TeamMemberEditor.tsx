"use client";

import { useEffect, useState } from "react";
import { useBuilderStore } from "../state/builder-store";
import { Check, Image as ImageIcon, X } from "lucide-react";

export function TeamMemberEditor() {
    const [editing, setEditing] = useState<{ nodeId: string; index: number } | null>(null);
    const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

    const page = useBuilderStore((s) => s.page);
    const updateProps = useBuilderStore((s) => s.updateProps);
    const activeBreakpoint = useBuilderStore((s) => s.activeBreakpoint);
    const zoom = useBuilderStore((s) => s.zoom);

    useEffect(() => {
        const handleEdit = (e: CustomEvent) => {
            if (e.detail) {
                setEditing({ nodeId: e.detail.nodeId, index: e.detail.index });
            } else {
                setEditing(null);
            }
        };

        window.addEventListener("ps-edit-team-member", handleEdit as EventListener);
        return () => window.removeEventListener("ps-edit-team-member", handleEdit as EventListener);
    }, []);

    useEffect(() => {
        if (!editing) {
            setPosition(null);
            return;
        }

        // Position the editor near the element
        const updatePosition = () => {
            const container = document.getElementById("canvas-viewport");
            const element = document.querySelector(`[data-ps-node="${editing.nodeId}"] [data-ps-member-index="${editing.index}"]`);
            if (container && element) {
                const containerRect = container.getBoundingClientRect();
                const elementRect = element.getBoundingClientRect();

                setPosition({
                    top: elementRect.top - containerRect.top + elementRect.height * 0.5 + 40,
                    left: elementRect.left - containerRect.left + elementRect.width * 0.5,
                });
            }
        };

        updatePosition();
        // Update on wheel or scroll might be tricky but we can rely on state changes
    }, [editing, zoom, page]);

    if (!editing || !position || !page) return null;

    // Find the node
    const node = findNodeLocal(page.root, editing.nodeId);
    if (!node || node.type !== "business.team-grid") return null;

    // Find the members block 
    // It handles responsive props but for team grid, members are only stored at root props usually, 
    // or fallbacks to default. We can simplify by just getting current members.

    const nodeProps = node.props || {};
    let members = (nodeProps.members as any[]) || [
        { name: "Alex Chen", role: "CEO" },
        { name: "Sam Rivera", role: "CTO" },
        { name: "Jordan Lee", role: "Design Lead" },
    ]; // from default

    if (nodeProps?.[activeBreakpoint]?.members) {
        members = nodeProps[activeBreakpoint].members;
    }

    const member = members[editing.index];
    if (!member) return null;

    const handleUpdate = (field: string, value: string) => {
        const nextMembers = [...members];
        nextMembers[editing.index] = { ...member, [field]: value };
        updateProps(editing.nodeId, { members: nextMembers });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Convert file to object URL for immediate display, but ideally we'd upload as an asset
        // Because we just want simple editing, base64 data URL is also okay for small pictures,
        // Or just object URL - though URL.createObjectURL won't persist across saves 
        // Usually product studio has a media API.
        const reader = new FileReader();
        reader.onloadend = () => {
            handleUpdate('imageUrl', reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    return (
        <div
            className="absolute z-50 rounded-[8px] bg-white dark:bg-[#111] border border-neutral-200 dark:border-white/10 shadow-xl p-3 w-[260px] -translate-x-1/2 flex flex-col gap-4 transition-all"
            style={{
                top: position.top,
                left: position.left,
            }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
        >
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-white/5">
                <h3 className="text-[12px] font-semibold text-foreground">Edit Team Member</h3>
                <button
                    onClick={() => setEditing(null)}
                    className="text-neutral-400 hover:text-foreground transition-colors"
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            </div>

            <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">Profile Picture</label>
                    <div className="flex items-center gap-2">
                        {member.imageUrl ? (
                            <img src={member.imageUrl} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-[#1a1a1a] flex items-center justify-center shrink-0">
                                <ImageIcon className="w-4 h-4 text-neutral-400" />
                            </div>
                        )}
                        <label className="h-8 flex-1 cursor-pointer bg-neutral-50 dark:bg-[#1a1a1a] hover:bg-neutral-100 dark:hover:bg-[#222] transition flex items-center justify-center rounded-[4px] text-[11px] font-medium text-foreground border border-neutral-200 dark:border-white/10">
                            Upload Image
                            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
                        </label>
                    </div>
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-semibold text-foreground">Name</label>
                    <input
                        type="text"
                        value={member.name}
                        onChange={(e) => handleUpdate('name', e.target.value)}
                        className="h-8 w-full rounded-[4px] border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[12px] text-foreground transition-colors focus:border-primary-500 focus:bg-white focus:outline-none dark:border-white/10 dark:bg-[#1a1a1a] dark:focus:bg-[#111]"
                    />
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-semibold text-foreground">Position</label>
                    <input
                        type="text"
                        value={member.role}
                        onChange={(e) => handleUpdate('role', e.target.value)}
                        className="h-8 w-full rounded-[4px] border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[12px] text-foreground transition-colors focus:border-primary-500 focus:bg-white focus:outline-none dark:border-white/10 dark:bg-[#1a1a1a] dark:focus:bg-[#111]"
                    />
                </div>
            </div>
        </div>
    );
}

function findNodeLocal(root: any, id: string): any {
    if (root.id === id) return root;
    for (const c of root.children ?? []) {
        const f = findNodeLocal(c, id);
        if (f) return f;
    }
    return null;
}
