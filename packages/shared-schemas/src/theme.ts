import { z } from "zod";

export const themeTokensSchema = z.object({
  color: z.object({
    primary: z.object({
      "50": z.string(),
      "500": z.string(),
      "900": z.string(),
    }),
    neutral: z.object({
      "0": z.string(),
      "100": z.string(),
      "500": z.string(),
      "900": z.string(),
    }),
    success: z.string(),
    warning: z.string(),
    danger: z.string(),
  }),
  typography: z.object({
    fontFamily: z.object({
      base: z.string(),
      mono: z.string(),
    }),
    scale: z.object({
      xs: z.number().nonnegative(),
      sm: z.number().nonnegative(),
      base: z.number().nonnegative(),
      lg: z.number().nonnegative(),
      xl: z.number().nonnegative(),
      "2xl": z.number().nonnegative(),
      "3xl": z.number().nonnegative(),
    }),
    weight: z.object({
      regular: z.number().int().positive(),
      medium: z.number().int().positive(),
      semibold: z.number().int().positive(),
      bold: z.number().int().positive(),
    }),
  }),
  spacing: z.object({
    "0": z.number().nonnegative(),
    "1": z.number().nonnegative(),
    "2": z.number().nonnegative(),
    "3": z.number().nonnegative(),
    "4": z.number().nonnegative(),
    "6": z.number().nonnegative(),
    "8": z.number().nonnegative(),
    "12": z.number().nonnegative(),
    "16": z.number().nonnegative(),
  }),
  radius: z.object({
    sm: z.number().nonnegative(),
    md: z.number().nonnegative(),
    lg: z.number().nonnegative(),
    full: z.number().nonnegative(),
  }),
  shadow: z.object({
    sm: z.string(),
    md: z.string(),
    lg: z.string(),
  }),
});

export const updateThemeSchema = z.object({
  tokens: themeTokensSchema,
});
