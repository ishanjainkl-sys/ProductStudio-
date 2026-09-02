"use client";

import { useEffect } from "react";

export function GlobalZoomManager() {
    useEffect(() => {
        // Prevent native browser zooming (Ctrl + wheel / pinch) globally
        const preventNativeZoom = (e: WheelEvent) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
            }
        };
        const preventNativeGesture = (e: Event) => {
            e.preventDefault();
        };

        window.addEventListener("wheel", preventNativeZoom, { passive: false });
        window.addEventListener("gesturestart", preventNativeGesture, { passive: false });
        window.addEventListener("gesturechange", preventNativeGesture, { passive: false });

        return () => {
            window.removeEventListener("wheel", preventNativeZoom);
            window.removeEventListener("gesturestart", preventNativeGesture);
            window.removeEventListener("gesturechange", preventNativeGesture);
        };
    }, []);

    return null;
}
