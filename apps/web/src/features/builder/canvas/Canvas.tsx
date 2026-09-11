"use client";

import { useRef, useEffect, useCallback, useState, useLayoutEffect } from "react";
import { BREAKPOINT_WIDTHS } from "@productstudio/shared-types";
import { useBuilderStore } from "../state/builder-store";
import { PageFrame } from "./PageFrame";
import { Selectable } from "./Selectable";
import { TeamMemberEditor } from "./TeamMemberEditor";
import { findNode } from "@productstudio/json-engine";

function ContextMenuItem({ label, shortcut, disabled, hasSubmenu, onClick, className = "" }: { label: string, shortcut?: string, hasSubmenu?: boolean, disabled?: boolean, onClick: () => void, className?: string }) {
    return (
        <button
            className={`group w-full flex items-center justify-between rounded-[3px] px-2 py-[3px] mx-1 text-left text-[11px] font-sans leading-tight ${disabled ? "text-[#808080] cursor-default" : `text-[#e0e0e0] hover:bg-[#0D99FF] hover:text-white ${className}`}`}
            style={{ width: "calc(100% - 8px)" }}
            disabled={disabled}
            onClick={onClick}
        >
            <span className="flex-1">{label}</span>
            {shortcut && !hasSubmenu && <span className={disabled ? "text-[#555555] ml-4" : "text-[#808080] group-hover:text-white ml-4"}>{shortcut}</span>}
            {hasSubmenu && (
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className={disabled ? "text-[#555555]" : "text-[#808080] group-hover:text-white"}>
                    <path d="M4 2L8.5 6L4 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            )}
        </button>
    );
}

function FigmaMenuScroller({ children, maxHeight }: { children: React.ReactNode, maxHeight: number }) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollUp, setCanScrollUp] = useState(false);
    const [canScrollDown, setCanScrollDown] = useState(false);

    // Check scroll boundaries
    const checkScroll = useCallback(() => {
        if (!scrollRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        setCanScrollUp(scrollTop > 0);
        setCanScrollDown(Math.ceil(scrollTop + clientHeight) < scrollHeight);
    }, []);

    // Initial check and native scroll listening
    useEffect(() => {
        checkScroll();
        const scroller = scrollRef.current;
        if (scroller) {
            const observer = new ResizeObserver(checkScroll);
            observer.observe(scroller);
            scroller.addEventListener("scroll", checkScroll);
            return () => {
                observer.disconnect();
                scroller.removeEventListener("scroll", checkScroll);
            };
        }
    }, [checkScroll, children]);

    // Continuous scroll animation logic
    const scrollInterval = useRef<ReturnType<typeof setInterval> | null>(null);
    const startScroll = (direction: 'up' | 'down') => {
        if (scrollInterval.current) clearInterval(scrollInterval.current);
        scrollInterval.current = setInterval(() => {
            if (scrollRef.current) {
                scrollRef.current.scrollBy({ top: direction === 'up' ? -10 : 10 });
            }
        }, 16);
    };
    const stopScroll = () => {
        if (scrollInterval.current) clearInterval(scrollInterval.current);
        scrollInterval.current = null;
    };

    return (
        <div className="relative w-full h-full flex flex-col pointer-events-auto overflow-hidden no-canvas-scroll">
            {canScrollUp && (
                <div
                    className="absolute top-0 left-0 w-full h-6 bg-gradient-to-b from-[#222222] via-[#222222]/90 to-transparent z-10 flex items-start justify-center cursor-default text-[#808080] hover:text-[#e0e0e0]"
                    onMouseEnter={() => startScroll('up')}
                    onMouseLeave={stopScroll}
                    onClick={(e) => e.stopPropagation()}
                >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="mt-1">
                        <path d="M2 8L6 3.5L10 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
            )}

            <div
                ref={scrollRef}
                className="flex-1 w-full overflow-y-scroll flex flex-col gap-0.5"
                style={{
                    maxHeight,
                    scrollbarWidth: 'none',  // Firefox
                    msOverflowStyle: 'none'  // IE
                }}
            >
                {/* Webkit hide scrollbar */}
                <style>{`
                    .flex-1::-webkit-scrollbar { display: none; }
                `}</style>
                <div className="flex flex-col gap-0.5 p-1.5 pb-0">
                    {children}
                </div>
            </div>

            {canScrollDown && (
                <div
                    className="absolute bottom-0 left-0 w-full h-6 bg-gradient-to-t from-[#222222] via-[#222222]/90 to-transparent z-10 flex items-end justify-center cursor-default text-[#808080] hover:text-[#e0e0e0]"
                    onMouseEnter={() => startScroll('down')}
                    onMouseLeave={stopScroll}
                    onClick={(e) => e.stopPropagation()}
                >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="mb-1">
                        <path d="M2 4L6 8.5L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
            )}
        </div>
    );
}

export function Canvas() {
    const switchPage = useBuilderStore((s) => s.switchPage);
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
    const removeSelected = useBuilderStore((s) => s.removeSelected);
    const bringToFront = useBuilderStore((s) => s.bringToFront);
    const sendToBack = useBuilderStore((s) => s.sendToBack);
    const groupSelection = useBuilderStore((s) => s.groupSelection);
    const ungroupSelection = useBuilderStore((s) => s.ungroupSelection);
    const pasteToReplace = useBuilderStore((s) => s.pasteToReplace);



    const activeNodeRef = selectedNodeId && selectedNodeId !== "page" && page ? findNode(page.root, selectedNodeId) : null;
    const isHidden = activeNodeRef?.props?._hidden === true;
    const isLocked = activeNodeRef?.props?._locked === true;

    const zoom = useBuilderStore((s) => s.zoom);
    const offsetX = useBuilderStore((s) => s.offsetX);
    const offsetY = useBuilderStore((s) => s.offsetY);
    const setCanvasView = useBuilderStore((s) => s.setCanvasView);

    const containerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);
    const lastMousePos = useRef({ x: 0, y: 0 });
    const isSpaceDown = useRef(false);
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);
    const [otherPages, setOtherPages] = useState<import("@productstudio/shared-types").PageDocument[]>([]);
    const prevPageRef = useRef(page);

    useLayoutEffect(() => {
        if (prevPageRef.current && page && prevPageRef.current.pageId !== page.pageId) {
            setOtherPages(prev => {
                const newOthers = prev.filter(p => p.pageId !== page.pageId);
                if (!newOthers.some(p => p.pageId === prevPageRef.current!.pageId)) {
                    newOthers.push(prevPageRef.current!);
                }
                return newOthers;
            });
        }
        prevPageRef.current = page;
    }, [page]);

    useEffect(() => {
        let active = true;
        async function fetchOtherPages() {
            if (!page) return;
            try {
                const { api } = await import("@/lib/api-client");
                const list = await api.get<{ id: string }[]>(`/api/projects/${page.projectId}/pages`);
                const others = list.filter((p) => p.id !== page.pageId);
                const results = await Promise.all(
                    others.map((p) => api.get<{ contentJson: import("@productstudio/shared-types").PageDocument }>(`/api/pages/${p.id}`))
                );
                if (active) {
                    setOtherPages(results.map(r => r.contentJson));
                }
            } catch (err) {
                console.error("Failed to load other pages for canvas", err);
            }
        }

        fetchOtherPages();

        const listener = () => fetchOtherPages();
        window.addEventListener("ps-other-pages-changed", listener);

        return () => {
            active = false;
            window.removeEventListener("ps-other-pages-changed", listener);
        };
    }, [page?.pageId, page?.projectId]);

    useEffect(() => {
        function handleClick() {
            setContextMenu(null);
        }
        function handleCustomContextMenu(e: CustomEvent) {
            if (e.detail && e.detail.x !== undefined && e.detail.y !== undefined) {
                let x = e.detail.x;
                let y = e.detail.y;
                const menuW = 240;
                const menuH = 600; // approximate height
                if (x + menuW > window.innerWidth) x = window.innerWidth - menuW - 10;
                if (y + menuH > window.innerHeight) y = Math.max(10, window.innerHeight - menuH - 10);
                setContextMenu({ x, y });
            }
        }
        window.addEventListener("click", handleClick);
        window.addEventListener("ps-context-menu", handleCustomContextMenu as EventListener);
        return () => {
            window.removeEventListener("click", handleClick);
            window.removeEventListener("ps-context-menu", handleCustomContextMenu as EventListener);
        };
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
    }, [zoom, handleZoom, fitCanvas, fitSelection, copySelected, pasteCopied, duplicateSelected]);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const onWheel = (e: WheelEvent) => {
            // Do not pan/zoom if hovering over UI elements that handle their own scroll
            if ((e.target as Element).closest('.no-canvas-scroll')) {
                return;
            }

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
                let x = e.clientX;
                let y = e.clientY;
                const menuW = 240;
                const menuH = 600;
                if (x + menuW > window.innerWidth) x = window.innerWidth - menuW - 10;
                if (y + menuH > window.innerHeight) y = Math.max(10, window.innerHeight - menuH - 10);
                setContextMenu({ x, y });
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
                {/* Active page */}
                <div data-canvas-x={page.metadata?.canvasX || 0} key={page.pageId} style={{ position: "absolute", left: page.metadata?.canvasX || 0, top: page.metadata?.canvasY || 0 }}>
                    <PageFrame zoom={zoom} page={page} theme={theme} breakpoint={breakpoint} />
                </div>

                {/* Other pages */}
                {otherPages.filter(op => op.pageId !== page.pageId).map((op) => (
                    <div
                        data-canvas-x={op.metadata?.canvasX || 0}
                        key={op.pageId}
                        style={{
                            position: "absolute",
                            left: op.metadata?.canvasX || 0,
                            top: op.metadata?.canvasY || 0,
                            opacity: 0.6,
                            transition: "opacity 0.2s"
                        }}
                        className="hover:opacity-100 cursor-pointer"
                        onPointerDown={(e) => {
                            if (isSpaceDown.current) return;
                            e.stopPropagation();
                            void switchPage(op.pageId);
                        }}
                    >
                        <div className="pointer-events-none">
                            <PageFrame zoom={zoom} page={op} theme={theme} breakpoint={op.metadata?.viewport || "desktop"} />
                        </div>
                    </div>
                ))}
            </div>

            <TeamMemberEditor />

            {contextMenu && (
                <div
                    className="fixed z-50 rounded-[6px] bg-[#222222] text-[#E0E0E0] shadow-2xl border border-[#333333] min-w-[180px] w-auto max-w-[260px] overflow-hidden py-1"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={(e) => e.stopPropagation()}
                    onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
                >
                    <FigmaMenuScroller maxHeight={typeof window !== 'undefined' ? Math.min(window.innerHeight - 20, 420) : 420}>
                        <ContextMenuItem label="Copy" shortcut="Ctrl+C" disabled={!selectedNodeId || selectedNodeId === "page"} onClick={() => { setContextMenu(null); copySelected(); }} />
                        <ContextMenuItem label="Paste here" disabled={!copiedNode || !copiedNode.objects.length} onClick={() => { setContextMenu(null); void pasteCopied(); }} />
                        <ContextMenuItem label="Paste to replace" shortcut="Ctrl+Shift+R" disabled={!copiedNode || !copiedNode.objects.length || !selectedNodeId || selectedNodeId === "page"} onClick={() => { setContextMenu(null); void pasteToReplace(); }} />
                        <ContextMenuItem label="Copy/Paste as" hasSubmenu disabled={true} onClick={() => { }} />
                        <ContextMenuItem label="Send to Figma Make" disabled={true} onClick={() => { }} />
                        <ContextMenuItem label="Add motion" hasSubmenu disabled={true} onClick={() => { }} />

                        <div className="h-px bg-[#333333] my-[4px] mx-0 shrink-0" />

                        <ContextMenuItem label="Move to page" hasSubmenu disabled={true} onClick={() => { }} />
                        <ContextMenuItem label="Bring to front" shortcut="]" disabled={!selectedNodeId || selectedNodeId === "page"} onClick={() => { setContextMenu(null); bringToFront(); }} />
                        <ContextMenuItem label="Send to back" shortcut="[" disabled={!selectedNodeId || selectedNodeId === "page"} onClick={() => { setContextMenu(null); sendToBack(); }} />

                        <div className="h-px bg-[#333333] my-[4px] mx-0 shrink-0" />

                        <ContextMenuItem label="Convert to section" disabled={true} onClick={() => { }} />
                        <ContextMenuItem label="Group selection" shortcut="Ctrl+G" disabled={!selectedNodeId || selectedNodeId === "page"} onClick={() => { setContextMenu(null); groupSelection(); }} />
                        <ContextMenuItem label="Frame selection" shortcut="Ctrl+Alt+G" disabled={!selectedNodeId || selectedNodeId === "page"} onClick={() => { setContextMenu(null); groupSelection(); }} />
                        <ContextMenuItem label="Ungroup" shortcut="Ctrl+Backspace" disabled={!selectedNodeId || selectedNodeId === "page"} onClick={() => { setContextMenu(null); ungroupSelection(); }} />
                        <ContextMenuItem label="Flatten" shortcut="Alt+Shift+F" disabled={true} onClick={() => { }} />
                        <ContextMenuItem label="Outline stroke" shortcut="Ctrl+Alt+O" disabled={true} onClick={() => { }} />
                        <ContextMenuItem label="Set as thumbnail" disabled={true} onClick={() => { }} />
                        <ContextMenuItem label="Use as mask" shortcut="Ctrl+Alt+M" disabled={true} onClick={() => { }} />

                        <div className="h-px bg-[#333333] my-[4px] mx-0 shrink-0" />

                        <ContextMenuItem label="Add auto layout" shortcut="Shift+A" disabled={!selectedNodeId || selectedNodeId === "page"} onClick={() => { setContextMenu(null); groupSelection(); }} />
                        <ContextMenuItem label="More layout options" hasSubmenu disabled={true} onClick={() => { }} />
                        <ContextMenuItem label="Create component" shortcut="Ctrl+Alt+K" disabled={true} onClick={() => { }} />
                        <ContextMenuItem label="Plugins" hasSubmenu disabled={true} onClick={() => { }} />
                        <ContextMenuItem label="Widgets" hasSubmenu disabled={true} onClick={() => { }} />

                        <div className="h-px bg-[#333333] my-[4px] mx-0 shrink-0" />

                        <ContextMenuItem label="Show/Hide" shortcut="Ctrl+Shift+H" disabled={!selectedNodeId || selectedNodeId === "page"} onClick={() => { setContextMenu(null); updateProps(selectedNodeId!, { _hidden: !isHidden }); }} />
                        <ContextMenuItem label="Lock/Unlock" shortcut="Ctrl+Shift+L" disabled={!selectedNodeId || selectedNodeId === "page"} onClick={() => { setContextMenu(null); updateProps(selectedNodeId!, { _locked: !isLocked }); }} />

                        <div className="h-px bg-[#333333] my-[4px] mx-0 shrink-0" />

                        <ContextMenuItem label="Flip horizontal" shortcut="Shift+H" disabled={!selectedNodeId || selectedNodeId === "page"} onClick={() => { setContextMenu(null); updateProps(selectedNodeId!, { _flipX: !(activeNodeRef?.props?._flipX === true) }); }} />
                        <ContextMenuItem label="Flip vertical" shortcut="Shift+V" disabled={!selectedNodeId || selectedNodeId === "page"} onClick={() => { setContextMenu(null); updateProps(selectedNodeId!, { _flipY: !(activeNodeRef?.props?._flipY === true) }); }} />
                    </FigmaMenuScroller>
                </div>
            )}
        </div>
    );
}
