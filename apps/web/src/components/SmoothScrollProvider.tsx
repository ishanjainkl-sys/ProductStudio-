"use client";

import React, { useEffect, useRef } from "react";
import { ReactLenis } from "lenis/react";
import { usePathname } from "next/navigation";

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    // Optionally disable lenis inside the builder to ensure zero interference
    // even though stopPropagation() protects the canvas, we can just exclude it entirely
    const isBuilder = pathname?.includes("/editor") || pathname?.includes("/edit") || pathname?.startsWith("/p/") || pathname?.includes("/builder") || pathname?.startsWith("/projects/");

    if (isBuilder) {
        return <>{children}</>;
    }

    return (
        <ReactLenis root options={{ lerp: 0.1, duration: 1.2, smoothWheel: true }}>
            {children}
        </ReactLenis>
    );
}
