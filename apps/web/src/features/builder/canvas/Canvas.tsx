"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { BREAKPOINT_WIDTHS } from "@productstudio/shared-types";
import { useBuilderStore } from "../state/builder-store";
import { PageFrame } from "./PageFrame";
import { Selectable } from "./Selectable";
import { TeamMemberEditor } from "./TeamMemberEditor";

export function Canvas() {
    const page = useBuilderStore((s) => s.page);
    const theme = useBuilderStore((s) => s.theme);
    const breakpoint = useBuilderStore((s) => s.activeBreakpoint);
    const selectNode = useBuilderStore((s) => s.selectNode);
    const updateProps = useBuilderStore((s) => s.updateProps);
    const pasteCopied = useBuilderStore((s) => s.pasteCopied);
    const copySelected = useBuilderStore((s) => s.copySelected);
    const duplicateSelected = useBuilderStore((s) => s.duplicateSelected);
    const copiedNode = useBuilderStore((s) => s.copiedNode);
    const selectedNodeId = useBuilderStore((s) => s.selectedNodeId);

    const zoom = useBuilderStore((s) => s.zoom);
    const offsetX = useBuilderStore((s) => s.offsetX);
    const offsetY = useBuilderStore((s) => s.offsetY);
    const setCanvasView = useBuilderStore((s) => s.setCanvasView);

    const containerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);
    const lastMousePos = useRef({ x: 0, y: 0 });
    const isSpaceDown = useRef(false);
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);

    useEffect(() => {
        function handleClick() {
            setContextMenu(null);
        }
        window.addEventListener("click", handleClick);
        return () => window.removeEventListener("click", handleClick);
    }, []);

    // Initial centering
    useEffect(() => {
        if (!containerRef.current || offsetX !== 0 || offsetY !== 0 || zoom !== 1) return;
        const rect = containerRef.current.getBoundingClientRect();
        const w = BREAKPOINT_WIDTHS[breakpoint];
        const h = 800; // estimated default height

        const newOffsetX = (rect.width - w) / 2;
        const newOffsetY = Math.max((rect.height - h) / 2, 64);
        setCanvasView(1, newOffsetX, newOffsetY);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleZoom = useCallback((newZoom: number, cursorX?: number, cursorY?: number) => {
        newZoom = Math.min(Math.max(newZoom, 0.1), 64);
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();

        let cx = cursorX !== undefined ? cursorX : rect.width / 2;
        let cy = cursorY !== undefined ? cursorY : rect.height / 2;

        const ratio = newZoom / zoom;
        const newOffsetX = cx - (cx - offsetX) * ratio;
        const newOffsetY = cy - (cy - offsetY) * ratio;

        setCanvasView(newZoom, newOffsetX, newOffsetY);
    }, [zoom, offsetX, offsetY, setCanvasView]);

    const fitCanvas = useCallback(() => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const width = BREAKPOINT_WIDTHS[breakpoint];
        const height = 800;

        const padding = 64;

        const scaleX = (rect.width - padding * 2) / width;
        const scaleY = (rect.height - padding * 2) / height;
        const newZoom = Math.min(Math.max(Math.min(scaleX, scaleY), 0.1), 64);

        const newOffsetX = (rect.width - width * newZoom) / 2;
        const newOffsetY = (rect.height - height * newZoom) / 2;

        setCanvasView(newZoom, newOffsetX, newOffsetY);
    }, [breakpoint, setCanvasView]);

    const fitSelection = useCallback(() => {
        if (!containerRef.current) return;
        const selectedId = useBuilderStore.getState().selectedNodeId;
        if (!selectedId) {
            fitCanvas();
            return;
        }

        const el = document.querySelector(`.ps-${selectedId.replace(/[^a-zA-Z0-9_-]/g, "-")}`) as HTMLElement | null;
        if (!el) {
            fitCanvas();
            return;
        }

        const rect = containerRef.current.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();

        const currentZoom = useBuilderStore.getState().zoom;
        const width = elRect.width / currentZoom;
        const height = elRect.height / currentZoom;

        const padding = 64;
        const scaleX = (rect.width - padding * 2) / width;
        const scaleY = (rect.height - padding * 2) / height;
        const newZoom = Math.min(Math.max(Math.min(scaleX, scaleY), 0.1), 64);

        const currentOffsetX = useBuilderStore.getState().offsetX;
        const currentOffsetY = useBuilderStore.getState().offsetY;

        const elX = (elRect.left - rect.left - currentOffsetX) / currentZoom;
        const elY = (elRect.top - rect.top - currentOffsetY) / currentZoom;

        const newOffsetX = (rect.width - width * newZoom) / 2 - elX * newZoom;
        const newOffsetY = (rect.height - height * newZoom) / 2 - elY * newZoom;

        setCanvasView(newZoom, newOffsetX, newOffsetY);
    }, [fitCanvas, setCanvasView]);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement).tagName;
            const isEditingText = (document.activeElement as HTMLElement)?.isContentEditable;
            if (tag === "INPUT" || tag === "TEXTAREA" || isEditingText) return;

            if (e.code === "Space" && !isSpaceDown.current) {
                e.preventDefault();
                isSpaceDown.current = true;
                if (containerRef.current) {
                    containerRef.current.style.cursor = "grab";
                }
            } else if (e.key === "+" || e.key === "=") {
                e.preventDefault();
                handleZoom(zoom * 1.25);
            } else if (e.key === "-") {
                e.preventDefault();
                handleZoom(zoom / 1.25);
            } else if (e.key === "0") {
                e.preventDefault();
                handleZoom(1);
            } else if (e.key === "!" || (e.key === "1" && e.shiftKey)) {
                e.preventDefault();
                fitCanvas();
            } else if (e.key === "@" || (e.key === "2" && e.shiftKey)) {
                e.preventDefault();
                fitSelection();
            }
        };

        const onKeyUp = (e: KeyboardEvent) => {
            if (e.code === "Space") {
                isSpaceDown.current = false;
                if (containerRef.current && !isDragging.current) {
                    containerRef.current.style.cursor = "default";
                }
            }
        };

        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("keyup", onKeyUp);
        return () => {
            window.removeEventListener("keydown", onKeyDown);
            window.removeEventListener("keyup", onKeyUp);
        };
    }, [zoom, handleZoom, fitCanvas, fitSelection]);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const onWheel = (e: WheelEvent) => {
            const rect = el.getBoundingClientRect();
            const isInside = e.clientX >= rect.left && e.clientX <= rect.right &&
                e.clientY >= rect.top && e.clientY <= rect.bottom;
            if (!isInside) return;

            e.preventDefault();
            e.stopPropagation();

            if (e.ctrlKey || e.metaKey) {
                const zoomFactor = Math.exp(-e.deltaY * 0.001);
                const newZoom = zoom * zoomFactor;

                const rect = el.getBoundingClientRect();
                const cursorX = e.clientX - rect.left;
                const cursorY = e.clientY - rect.top;

                handleZoom(newZoom, cursorX, cursorY);
            } else {
                // Adjust pan speed based on zoom? 
                // Figma usually pans 1:1 with screen pixels
                setCanvasView(zoom, offsetX - e.deltaX, offsetY - e.deltaY);
            }
        };

        el.addEventListener("wheel", onWheel, { passive: false });

        const onGestureStart = (e: Event) => {
            // Check if pointer is over canvas. (Gestures usually originate where they started, 
            // but we can't easily check clientX on standard Event for some browsers. 
            // Better to rely on the event target being within container)
            if (el.contains(e.target as Node)) {
                e.preventDefault();
                e.stopPropagation();
            }
        };
        const onGestureChange = (e: Event) => {
            if (el.contains(e.target as Node)) {
                e.preventDefault();
                e.stopPropagation();
            }
        };
        el.addEventListener("gesturestart", onGestureStart);
        el.addEventListener("gesturechange", onGestureChange);

        return () => {
            el.removeEventListener("wheel", onWheel);
            el.removeEventListener("gesturestart", onGestureStart);
            el.removeEventListener("gesturechange", onGestureChange);
        };
    }, [zoom, offsetX, offsetY, handleZoom, setCanvasView]);

    useEffect(() => {
        const handleImageUpload = (e: CustomEvent) => {
            if (e.detail?.nodeId && e.detail?.src) {
                updateProps(e.detail.nodeId, { src: e.detail.src });
            }
        };
        window.addEventListener("ps-upload-image", handleImageUpload as EventListener);
        return () => window.removeEventListener("ps-upload-image", handleImageUpload as EventListener);
    }, [updateProps]);

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (e.button === 1 || isSpaceDown.current) {
            e.preventDefault();
            isDragging.current = true;
            lastMousePos.current = { x: e.clientX, y: e.clientY };
            if (containerRef.current) {
                containerRef.current.style.cursor = "grabbing";
                containerRef.current.setPointerCapture(e.pointerId);
            }
        }
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (isDragging.current) {
            const dx = e.clientX - lastMousePos.current.x;
            const dy = e.clientY - lastMousePos.current.y;
            lastMousePos.current = { x: e.clientX, y: e.clientY };
            setCanvasView(zoom, offsetX + dx, offsetY + dy);
        }
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        if (isDragging.current) {
            isDragging.current = false;
            if (containerRef.current) {
                containerRef.current.style.cursor = isSpaceDown.current ? "grab" : "default";
                containerRef.current.releasePointerCapture(e.pointerId);
            }
        }
    };

    if (!page) {
        return <div className="flex flex-1 items-center justify-center text-sm text-neutral-500">Loading canvas…</div>;
    }

    const width = BREAKPOINT_WIDTHS[breakpoint];

    return (
        <div
            ref={containerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="flex-1 min-w-0 min-h-0 overflow-hidden relative select-none"
            style={{
                touchAction: "none",
                backgroundPosition: `${offsetX}px ${offsetY}px`,
                backgroundImage: "linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)",
                backgroundSize: `${16 * zoom}px ${16 * zoom}px`,
                backgroundColor: "var(--tw-bg-opacity, #f5f5f5)"
            }}
            onClick={(e) => {
                if (!isDragging.current && e.target === containerRef.current) {
                    selectNode('page');
                }
            }}
            onContextMenu={(e) => {
                e.preventDefault();
                setContextMenu({ x: e.clientX, y: e.clientY });
            }}
            id="canvas-viewport"
        >
            <div
                style={{
                    transform: `translate(${offsetX}px, ${offsetY}px) scale(${zoom})`,
                    transformOrigin: "0 0",
                    position: "absolute",
                    top: 0,
                    left: 0,
                }}
            >
                <PageFrame zoom={zoom} page={page} theme={theme} breakpoint={breakpoint} />
            </div>

            <TeamMemberEditor />

            {contextMenu && (
                <div
                    className="fixed z-50 rounded-md bg-white p-1 text-sm shadow-xl border border-neutral-200 dark:border-white/10 dark:bg-[#2C2C2C] min-w-[150px]"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={(e) => e.stopPropagation()}
                    onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
                >
                    <button
                        className={`w-full text-left rounded-sm px-2 py-1.5 ${!selectedNodeId || selectedNodeId === "page" ? "text-neutral-400 cursor-not-allowed" : "text-foreground hover:bg-neutral-100 dark:hover:bg-white/5"}`}
                        disabled={!selectedNodeId || selectedNodeId === "page"}
                        onClick={() => {
                            setContextMenu(null);
                            copySelected();
                        }}
                    >
                        Copy
                    </button>
                    <button
                        className={`w-full text-left rounded-sm px-2 py-1.5 ${!selectedNodeId || selectedNodeId === "page" ? "text-neutral-400 cursor-not-allowed" : "text-foreground hover:bg-neutral-100 dark:hover:bg-white/5"}`}
                        disabled={!selectedNodeId || selectedNodeId === "page"}
                        onClick={() => {
                            setContextMenu(null);
                            duplicateSelected();
                        }}
                    >
                        Duplicate
                    </button>
                    <button
                        className={`w-full text-left rounded-sm px-2 py-1.5 ${!copiedNode || !copiedNode.objects.length ? "text-neutral-400 cursor-not-allowed" : "text-foreground hover:bg-neutral-100 dark:hover:bg-white/5"}`}
                        disabled={!copiedNode || !copiedNode.objects.length}
                        onClick={() => {
                            setContextMenu(null);
                            void pasteCopied();
                        }}
                    >
                        Paste
                    </button>
                </div>
            )}
        </div>
    );
}
