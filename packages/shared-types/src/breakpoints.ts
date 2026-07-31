export const BREAKPOINTS = ["desktop", "tablet", "mobile"] as const;
export type Breakpoint = (typeof BREAKPOINTS)[number];

export const BREAKPOINT_WIDTHS: Record<Breakpoint, number> = {
  desktop: 1440,
  tablet: 834,
  mobile: 390,
};

export const BREAKPOINT_MEDIA_QUERIES: Record<"tablet" | "mobile", string> = {
  tablet: "(max-width: 1024px)",
  mobile: "(max-width: 640px)",
};
