import React, { useState } from "react";
import { useBuilderStore } from "../state/builder-store";
import { BREAKPOINT_WIDTHS } from "@productstudio/shared-types";
import { Link2, Unlink2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function PageProperties() {
    const page = useBuilderStore((s) => s.page);
    const activeBreakpoint = useBuilderStore((s) => s.activeBreakpoint);
    const updatePageDimensions = useBuilderStore((s) => s.updatePageDimensions);
    const [aspectLock, setAspectLock] = useState(false);

    if (!page) return null;

    const currentWidth = page.metadata?.dimensions?.[activeBreakpoint]?.width ?? BREAKPOINT_WIDTHS[activeBreakpoint];
    const currentHeight = page.metadata?.dimensions?.[activeBreakpoint]?.height ?? 800;

    const aspect = currentWidth / currentHeight;

    const handleWidthChange = (valStr: string) => {
        let w = parseInt(valStr, 10);
        if (isNaN(w)) return;
        w = Math.max(320, Math.min(10000, w));
        let h = currentHeight;
        if (aspectLock) {
            h = Math.round(w / aspect);
            h = Math.max(240, Math.min(10000, h));
        }
        updatePageDimensions(activeBreakpoint, w, h);
    };

    const handleHeightChange = (valStr: string) => {
        let h = parseInt(valStr, 10);
        if (isNaN(h)) return;
        h = Math.max(240, Math.min(10000, h));
        let w = currentWidth;
        if (aspectLock) {
            w = Math.round(h * aspect);
            w = Math.max(320, Math.min(10000, w));
        }
        updatePageDimensions(activeBreakpoint, w, h);
    };

    return (
        <div className="flex h-full flex-col bg-white dark:bg-[#111]" onWheel={(e) => e.stopPropagation()}>
            <div className="border-b border-neutral-100 dark:border-white/5 px-2 py-1.5 flex-none">
                <p className="text-[11px] font-semibold text-foreground">Page</p>
            </div>

            <div className="p-3 space-y-4">
                <div className="space-y-3">
                    <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Dimensions
                    </Label>
                    <div className="flex items-end gap-3">
                        <div className="flex-1 space-y-1.5">
                            <Label className="text-[11px] text-muted-foreground">Width</Label>
                            <Input
                                type="number"
                                className="h-7 px-2 py-0.5 text-[11px] rounded-md"
                                value={Math.round(currentWidth)}
                                onChange={(e) => handleWidthChange(e.target.value)}
                            />
                        </div>

                        <div className="flex">
                            <Button
                                variant={aspectLock ? "default" : "outline"}
                                size="icon"
                                className={`h-9 w-9 rounded-md transition-colors ${aspectLock ? "bg-primary-500 text-white hover:bg-primary-600" : ""}`}
                                onClick={() => setAspectLock(!aspectLock)}
                                title="Lock Aspect Ratio"
                            >
                                {aspectLock ? <Link2 className="h-4 w-4" /> : <Unlink2 className="h-4 w-4" />}
                            </Button>
                        </div>

                        <div className="flex-1 space-y-1.5">
                            <Label className="text-[11px] text-muted-foreground">Height</Label>
                            <Input
                                type="number"
                                className="h-7 px-2 py-0.5 text-[11px] rounded-md"
                                value={Math.round(currentHeight)}
                                onChange={(e) => handleHeightChange(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Responsive
                    </Label>
                    <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-2 py-2 text-[11px] text-foreground dark:border-white/10 dark:bg-[#1a1a1a]">
                        <span className="capitalize font-medium text-primary-600 dark:text-primary-400">{activeBreakpoint}</span> dimensions are being edited.
                    </div>
                </div>
            </div>
        </div>
    );
}
