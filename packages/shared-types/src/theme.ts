export interface ThemeTokens {
  color: {
    primary: { "50": string; "500": string; "900": string };
    neutral: { "0": string; "100": string; "500": string; "900": string };
    success: string;
    warning: string;
    danger: string;
  };
  typography: {
    fontFamily: { base: string; mono: string };
    scale: {
      xs: number;
      sm: number;
      base: number;
      lg: number;
      xl: number;
      "2xl": number;
      "3xl": number;
    };
    weight: {
      regular: number;
      medium: number;
      semibold: number;
      bold: number;
    };
  };
  spacing: Record<"0" | "1" | "2" | "3" | "4" | "6" | "8" | "12" | "16", number>;
  radius: { sm: number; md: number; lg: number; full: number };
  shadow: { sm: string; md: string; lg: string };
}

/** Token reference: { "$token": "color.primary.500" } */
export interface TokenRef {
  $token: string;
}

export function isTokenRef(value: unknown): value is TokenRef {
  return (
    typeof value === "object" &&
    value !== null &&
    "$token" in value &&
    typeof (value as TokenRef).$token === "string"
  );
}

export const DEFAULT_THEME_TOKENS: ThemeTokens = {
  color: {
    primary: { "50": "#eef4ff", "500": "#3b6ff0", "900": "#0f1f4d" },
    neutral: { "0": "#ffffff", "100": "#f5f6f8", "500": "#6b7280", "900": "#111318" },
    success: "#1c9d5d",
    warning: "#c78a1f",
    danger: "#d33a3a",
  },
  typography: {
    fontFamily: { base: "Inter, sans-serif", mono: "JetBrains Mono, monospace" },
    scale: { xs: 12, sm: 14, base: 16, lg: 18, xl: 22, "2xl": 28, "3xl": 36 },
    weight: { regular: 400, medium: 500, semibold: 600, bold: 700 },
  },
  spacing: { "0": 0, "1": 4, "2": 8, "3": 12, "4": 16, "6": 24, "8": 32, "12": 48, "16": 64 },
  radius: { sm: 4, md: 8, lg: 16, full: 9999 },
  shadow: {
    sm: "0 1px 2px rgba(0,0,0,0.06)",
    md: "0 4px 8px rgba(0,0,0,0.08)",
    lg: "0 12px 24px rgba(0,0,0,0.12)",
  },
};
