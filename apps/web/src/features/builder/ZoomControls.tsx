"use client";

import { useBuilderStore } from "./state/builder-store";
import { useCallback } from "react";
import { BREAKPOINT_WIDTHS } from "@productstudio/shared-types";

export function ZoomControls() {
    const zoom = useBuilderStore((s) => s.zoom);
    const offsetX = useBuilderStore((s) => s.offsetX);
    const offsetY = useBuilderStore((s) => s.offsetY);
    const setCanvasView = useBuilderStore((s) => s.setCanvasView);
    const breakpoint = useBuilderStore((s) => s.activeBreakpoint);

    const handleZoom = useCallback((newZoom: number) => {
        newZoom = Math.min(Math.max(newZoom, 0.1), 64);
        const container = document.getElementById("canvas-viewport");
        if (!container) return;
        const rect = container.getBoundingClientRect();

        let cx = rect.width / 2;
        let cy = rect.height / 2;

        const ratio = newZoom / zoom;
        const newOffsetX = cx - (cx - offsetX) * ratio;
        const newOffsetY = cy - (cy - offsetY) * ratio;

        setCanvasView(newZoom, newOffsetX, newOffsetY);
    }, [zoom, offsetX, offsetY, setCanvasView]);

    const fitCanvas = useCallback(() => {
        const container = document.getElementById("canvas-viewport");
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const width = BREAKPOINT_WIDTHS[breakpoint];
        const height = 800; // default estimated min height
        const padding = 64;

        const scaleX = (rect.width - padding * 2) / width;
        const scaleY = (rect.height - padding * 2) / height;
        const newZoom = Math.min(Math.max(Math.min(scaleX, scaleY), 0.1), 64);

        const newOffsetX = (rect.width - width * newZoom) / 2;
        const newOffsetY = (rect.height - height * newZoom) / 2;

        setCanvasView(newZoom, newOffsetX, newOffsetY);
    }, [breakpoint, setCanvasView]);

    return (
        <div className="flex items-center rounded-md border border-neutral-200/80 bg-white p-0.5 shadow-sm dark:border-neutral-800/80 dark:bg-[#111111]">
            <button
                className="flex h-7 w-7 items-center justify-center rounded-[4px] text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-foreground dark:text-neutral-400 dark:hover:bg-white/10"
                onClick={() => handleZoom(zoom / 1.25)}
                title="Zoom Out (-)"
            >
                <div className="h-3.5 w-3.5 flex items-center justify-center font-medium leading-none mb-[2px]">&minus;</div>
            </button>
            <button
                className="flex h-7 w-[46px] select-none items-center justify-center text-[12px] font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-white/10 rounded-[4px]"
                onClick={() => handleZoom(1)}
                title="Actual Size (0)"
            >
                {Math.round(zoom * 100)}%
            </button>
            <button
                className="flex h-7 w-7 items-center justify-center rounded-[4px] text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-foreground dark:text-neutral-400 dark:hover:bg-white/10"
                onClick={() => handleZoom(zoom * 1.25)}
                title="Zoom In (+)"
            >
                <div className="h-3.5 w-3.5 flex items-center justify-center font-medium leading-none mb-[2px]">+</div>
            </button>
            <div className="mx-1 h-3.5 w-[1px] bg-neutral-200 dark:bg-neutral-800"></div>
            <button
                className="flex h-7 px-2 items-center justify-center text-[12px] font-medium text-neutral-600 transition-colors hover:text-foreground hover:bg-neutral-100 dark:hover:bg-white/10 rounded-[4px] dark:text-neutral-400"
                onClick={fitCanvas}
                title="Fit Canvas (Shift + 1)"
            >
                Fit
            </button>
        </div>
    );
}

