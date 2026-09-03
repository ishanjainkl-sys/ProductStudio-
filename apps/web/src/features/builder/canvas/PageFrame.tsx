"use client";

import React, { useRef, useState, useEffect } from "react";
import { PageRenderer } from "@productstudio/renderer";
import { BREAKPOINT_WIDTHS, type Breakpoint, type PageDocument, type ThemeTokens } from "@productstudio/shared-types";
import { Selectable } from "./Selectable";
import { useBuilderStore } from "../state/builder-store";

const HANDLES = [
    { id: "top-left", cursor: "nwse-resize", style: { top: -4, left: -4 } },
    { id: "top-center", cursor: "ns-resize", style: { top: -4, left: "50%", transform: "translateX(-50%)" } },
    { id: "top-right", cursor: "nesw-resize", style: { top: -4, right: -4 } },
    { id: "middle-left", cursor: "ew-resize", style: { top: "50%", left: -4, transform: "translateY(-50%)" } },
    { id: "middle-right", cursor: "ew-resize", style: { top: "50%", right: -4, transform: "translateY(-50%)" } },
    { id: "bottom-left", cursor: "nesw-resize", style: { bottom: -4, left: -4 } },
    { id: "bottom-center", cursor: "ns-resize", style: { bottom: -4, left: "50%", transform: "translateX(-50%)" } },
    { id: "bottom-right", cursor: "nwse-resize", style: { bottom: -4, right: -4 } },
];

export function PageFrame({
    zoom,
    page,
    theme,
    breakpoint,
}: {
    zoom: number;
    page: PageDocument;
    theme: ThemeTokens;
    breakpoint: Breakpoint;
}) {
    const selectedNodeId = useBuilderStore((s) => s.selectedNodeId);
    const selectNode = useBuilderStore((s) => s.selectNode);
    const updatePageDimensions = useBuilderStore((s) => s.updatePageDimensions);
    const setCanvasView = useBuilderStore((s) => s.setCanvasView);
    const canvasOffsetX = useBuilderStore((s) => s.offsetX);
    const canvasOffsetY = useBuilderStore((s) => s.offsetY);

    const initialWidth = page.metadata?.dimensions?.[breakpoint]?.width ?? BREAKPOINT_WIDTHS[breakpoint];
    const initialHeight = page.metadata?.dimensions?.[breakpoint]?.height ?? 800;

    const [localDims, setLocalDims] = useState<{ width: number; height: number; x: number; y: number } | null>(null);

    // We use refs so we don't have to bind state to the pointermove listener
    const localDimsRef = useRef(localDims);
    localDimsRef.current = localDims;

    useEffect(() => {
        setLocalDims(null);
    }, [initialWidth, initialHeight, breakpoint]);

    const width = localDims?.width ?? initialWidth;
    const height = localDims?.height ?? initialHeight;
    const isSelected = selectedNodeId === "page";

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, handlePos: string) => {
        e.stopPropagation();
        e.preventDefault();

        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = localDims?.width ?? initialWidth;
        const startHeight = localDims?.height ?? initialHeight;
        const startOffsetX = canvasOffsetX;
        const startOffsetY = canvasOffsetY;

        let newWidth = startWidth;
        let newHeight = startHeight;
        let newOffsetX = startOffsetX;
        let newOffsetY = startOffsetY;

        const onMove = (me: PointerEvent) => {
            const dx = (me.clientX - startX) / zoom;
            const dy = (me.clientY - startY) / zoom;

            newWidth = startWidth;
            newHeight = startHeight;
            newOffsetX = startOffsetX;
            newOffsetY = startOffsetY;

            if (handlePos.includes("right")) {
                newWidth = Math.min(Math.max(320, startWidth + dx), 10000);
            }
            if (handlePos.includes("left")) {
                const potentialWidth = startWidth - dx;
                newWidth = Math.min(Math.max(320, potentialWidth), 10000);
                // adjust offsetX so right edge stays fixed
                const diff = startWidth - newWidth;
                newOffsetX = startOffsetX + (diff * zoom);
            }

            if (handlePos.includes("bottom")) {
                newHeight = Math.min(Math.max(240, startHeight + dy), 10000);
            }
            if (handlePos.includes("top")) {
                const potentialHeight = startHeight - dy;
                newHeight = Math.min(Math.max(240, potentialHeight), 10000);
                const diff = startHeight - newHeight;
                newOffsetY = startOffsetY + (diff * zoom);
            }

            setLocalDims({ width: newWidth, height: newHeight, x: newOffsetX, y: newOffsetY });
            if (handlePos.includes("left") || handlePos.includes("top")) {
                setCanvasView(zoom, newOffsetX, newOffsetY);
            }
        };

        const onUp = () => {
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
            if (localDimsRef.current) {
                updatePageDimensions(breakpoint, localDimsRef.current.width, localDimsRef.current.height);
            }
            setLocalDims(null);
        };

        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
    };

    return (
        <div
            onClick={(e) => {
                // Only select the page if they click exactly on the outer container or spacer, // but `Selectable` stops propagation. 
                // PageRenderer has a root which we'll have wrapped in Selectable. Wait, PageRenderer renders `page.root` directly.
                selectNode("page");
            }}
            className="bg-white shadow-md relative"
            style={{
                width: `${width}px`,
                height: `${height}px`,
                minHeight: `${height}px`,
            }}
        >
            <div style={{ width: "100%", height: "100%", overflow: "hidden", position: "relative" }}>
                <div
                    style={{
                        width: `${BREAKPOINT_WIDTHS[breakpoint]}px`,
                        minHeight: "100%",
                        position: "relative",
                    }}
                >
                    <PageRenderer
                        document={page}
                        breakpoint={breakpoint}
                        isEditing
                        theme={theme}
                        wrapNode={(node, element) => {
                            if (node.id === page.root.id) {
                                return <Selectable node={node}>{element}</Selectable>;
                            }
                            return <Selectable node={node}>{element}</Selectable>;
                        }}
                    />
                </div>
            </div>

            {isSelected && (
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ border: `${2 / zoom}px solid #3b82f6`, margin: `${-2 / zoom}px` }}
                >
                    {HANDLES.map((h) => {
                        const handleSize = 10 / zoom;
                        const offset = `-${handleSize / 2}px`;

                        const positionStyles: any = {};
                        if (h.id.includes("top")) positionStyles.top = offset;
                        if (h.id.includes("bottom")) positionStyles.bottom = offset;
                        if (h.id.includes("left")) positionStyles.left = offset;
                        if (h.id.includes("right")) positionStyles.right = offset;

                        if (h.id === "top-center" || h.id === "bottom-center") {
                            positionStyles.left = "50%";
                            positionStyles.transform = "translateX(-50%)";
                        } else if (h.id.includes("middle")) {
                            positionStyles.top = "50%";
                            positionStyles.transform = "translateY(-50%)";
                        }

                        return (
                            <div
                                key={h.id}
                                className="absolute bg-white rounded-[2px]"
                                style={{
                                    width: `${handleSize}px`,
                                    height: `${handleSize}px`,
                                    border: `${1.5 / zoom}px solid #3b82f6`,
                                    pointerEvents: "auto",
                                    cursor: h.cursor,
                                    ...positionStyles
                                }}
                                onPointerDown={(e) => handlePointerDown(e, h.id)}
                            />
                        );
                    })}
                    {localDims && (
                        <div
                            className="absolute left-1/2 -translate-x-1/2 rounded bg-neutral-900 px-2 py-1 flex items-center justify-center font-medium text-white shadow-md pointer-events-none"
                            style={{
                                bottom: `${-40 / Math.max(0.5, zoom)}px`,
                                fontSize: `${12 / Math.max(0.25, zoom)}px`, // zoom compensation
                                transform: `translateX(-50%) scale(${Math.min(1, 1 / zoom)})`
                            }}
                        >
                            {Math.round(localDims.width)} &times; {Math.round(localDims.height)}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
