"use client";

import React, { useState, useEffect, useRef } from "react";
import { PageRenderer } from "@productstudio/renderer";
import { Button } from "@/components/ui/button";

export function PreviewCard({
    homePageContent,
    themeTokens,
    onClick,
    overlayButtonText = "Open Editor",
    overlayButtonIcon,
    isOpening = false,
}: {
    homePageContent: any;
    themeTokens?: any;
    onClick: (e: React.MouseEvent) => void;
    overlayButtonText?: string;
    overlayButtonIcon?: React.ReactNode;
    isOpening?: boolean;
}) {
    const previewRef = useRef<HTMLDivElement>(null);
    const [previewScale, setPreviewScale] = useState(0.28);

    useEffect(() => {
        if (!previewRef.current) return;
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                // Calculate the scale based on the container width vs 1280 base width
                const width = entry.contentRect.width;
                if (width > 0) {
                    setPreviewScale(width / 1280);
                }
            }
        });
        observer.observe(previewRef.current);
        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={previewRef}
            className="
        group relative
        aspect-[16/9]
        w-full
        overflow-hidden
        rounded-t-[24px]
        border-b border-neutral-100
        bg-neutral-100
        dark:border-neutral-800
        dark:bg-[#0c0c0c]
        cursor-pointer
      "
            onClick={onClick}
        >
            {/* macOS window bar */}
            <div
                className="
          absolute inset-x-0 top-0 z-30
          h-7
          flex items-center gap-1.5
          px-3
          border-b border-black/5
          bg-black/5
          backdrop-blur-sm
          dark:border-white/5
          dark:bg-white/5
        "
            >
                <span className="h-2 w-2 rounded-full bg-red-400 dark:bg-red-500/80" />
                <span className="h-2 w-2 rounded-full bg-amber-400 dark:bg-amber-500/80" />
                <span className="h-2 w-2 rounded-full bg-emerald-400 dark:bg-emerald-500/80" />
            </div>

            {/* Preview viewport */}
            <div className="absolute inset-x-0 bottom-0 top-7 overflow-hidden">
                {homePageContent ? (
                    <div
                        className="
              absolute left-1/2 top-0
              pointer-events-none
              shrink-0
            "
                        style={{
                            width: 1280,
                            height: 720,
                            transformOrigin: "top center",
                            transform: `translateX(-50%) scale(${previewScale})`,
                        }}
                    >
                        <div
                            className="
                h-[720px]
                w-[1280px]
                overflow-hidden
                bg-white
                text-black
              "
                        >
                            <PageRenderer
                                document={homePageContent}
                                isEditing={false}
                                theme={themeTokens ?? undefined}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="flex h-full items-center justify-center">
                        <span className="text-sm font-medium text-neutral-400 dark:text-neutral-600">
                            Preview unavailable
                        </span>
                    </div>
                )}
            </div>

            {/* Hover overlay */}
            <div
                className="
          absolute inset-0 z-40
          flex flex-col items-center justify-center
          bg-black/50
          opacity-0
          transition-opacity duration-200
          group-hover:opacity-100
        "
            >
                <Button
                    className="
            pointer-events-none
            rounded-full
            bg-white
            text-black
            shadow-lg
            hover:bg-neutral-100
            dark:bg-primary-600
            dark:text-white
            dark:hover:bg-primary-700
          "
                    size="sm"
                >
                    {overlayButtonIcon}
                    {isOpening ? "Opening..." : overlayButtonText}
                </Button>
            </div>
        </div>
    );
}
