import { z } from "zod";
import type { ComponentDefinition } from "@productstudio/component-sdk";
import type { SpacingBox } from "@productstudio/shared-types";

const spacingSchema = z.object({
  top: z.number(),
  bottom: z.number(),
  left: z.number(),
  right: z.number(),
});

function pad(p: SpacingBox): Record<string, string> {
  return {
    "padding-top": `${p.top}px`,
    "padding-bottom": `${p.bottom}px`,
    "padding-left": `${p.left}px`,
    "padding-right": `${p.right}px`,
  };
}

export const SectionComponent: ComponentDefinition<{
  padding: SpacingBox;
  backgroundColor: string;
  maxWidth: number;
}> = {
  type: "layout.section",
  displayName: "Section",
  category: "layout",
  icon: "layout",
  acceptsChildren: true,
  responsiveProps: ["padding", "backgroundColor"],
  defaultProps: {
    padding: { top: 48, bottom: 48, left: 24, right: 24 },
    backgroundColor: "#ffffff",
    maxWidth: 1200,
  },
  propsSchema: z.object({
    padding: spacingSchema,
    backgroundColor: z.string(),
    maxWidth: z.number().positive(),
  }),
  styleMap: {
    padding: (v) => pad(v),
    backgroundColor: (v) => ({ "background-color": String(v) }),
  },
  render: ({ props, children, className, style, breakpoint }) => {
    const defaultVal = 48;
    const isDefaultPadding = props.padding.top === defaultVal && props.padding.bottom === defaultVal;
    let responsiveStyle: any = {};
    if (isDefaultPadding && breakpoint === "mobile") {
      responsiveStyle.paddingTop = "32px";
      responsiveStyle.paddingBottom = "32px";
    }

    return (
      <section className={className} style={{ ...style, ...responsiveStyle, width: "100%", boxSizing: "border-box", overflow: "hidden" }}>
        <div style={{ maxWidth: props.maxWidth, margin: "0 auto" }}>{children}</div>
      </section>
    );
  },
};

export const ContainerComponent: ComponentDefinition<{
  padding: SpacingBox;
  backgroundColor: string;
}> = {
  type: "layout.container",
  displayName: "Container",
  category: "layout",
  icon: "box",
  acceptsChildren: true,
  responsiveProps: ["padding", "backgroundColor"],
  defaultProps: {
    padding: { top: 16, bottom: 16, left: 16, right: 16 },
    backgroundColor: "transparent",
  },
  propsSchema: z.object({
    padding: spacingSchema,
    backgroundColor: z.string(),
  }),
  styleMap: {
    padding: (v) => pad(v),
    backgroundColor: (v) => ({ "background-color": String(v) }),
  },
  render: ({ children, className, style }) => (
    <div className={className} style={{ ...style, width: "100%", boxSizing: "border-box" }}>
      {children}
    </div>
  ),
};

export const StackComponent: ComponentDefinition<{
  gap: number;
  direction: string;
  align: string;
  padding: SpacingBox;
}> = {
  type: "layout.stack",
  displayName: "Stack",
  category: "layout",
  icon: "rows",
  acceptsChildren: true,
  responsiveProps: ["gap", "direction", "padding"],
  defaultProps: {
    gap: 16,
    direction: "column",
    align: "stretch",
    padding: { top: 0, bottom: 0, left: 0, right: 0 },
  },
  propsSchema: z.object({
    gap: z.number().nonnegative(),
    direction: z.enum(["column", "row"]),
    align: z.enum(["stretch", "flex-start", "center", "flex-end"]),
    padding: spacingSchema,
  }),
  styleMap: {
    gap: (v) => ({ gap: `${v}px` }),
    direction: (v) => ({ "flex-direction": String(v) }),
    align: (v) => ({ "align-items": String(v) }),
    padding: (v) => pad(v),
  },
  render: ({ props, children, className, style, breakpoint }) => {
    let styleOverride: any = {};
    if (breakpoint === "mobile" && props.gap > 8) {
      styleOverride.gap = `${Math.min(props.gap, 12)}px`;
    } else if (breakpoint === "tablet" && props.gap > 12) {
      styleOverride.gap = `${Math.min(props.gap, 16)}px`;
    }
    if (breakpoint === "mobile" && props.direction === "row") {
      styleOverride.flexDirection = "column";
    }
    return (
      <div className={className} style={{ ...style, ...styleOverride, width: "100%", boxSizing: "border-box", display: "flex", overflow: "hidden", flexWrap: "wrap" }}>
        {children}
      </div>
    );
  },
};

export const GridComponent: ComponentDefinition<{
  columns: number;
  gap: number;
  padding: SpacingBox;
}> = {
  type: "layout.grid",
  displayName: "Grid",
  category: "layout",
  icon: "grid",
  acceptsChildren: true,
  responsiveProps: ["columns", "gap", "padding"],
  defaultProps: {
    columns: 3,
    gap: 24,
    padding: { top: 0, bottom: 0, left: 0, right: 0 },
  },
  propsSchema: z.object({
    columns: z.number().int().min(1).max(12),
    gap: z.number().nonnegative(),
    padding: spacingSchema,
  }),
  styleMap: {
    columns: (v) => ({
      display: "grid",
      "grid-template-columns": `repeat(${v}, minmax(0, 1fr))`,
    }),
    gap: (v) => ({ gap: `${v}px` }),
    padding: (v) => pad(v),
  },
  render: ({ props, children, className, style, breakpoint }) => {
    let cols = props.columns;
    let styleOverride: any = {};
    if (breakpoint === "mobile") {
      cols = Math.min(cols, 1);
      if (props.gap > 12) styleOverride.gap = `${Math.min(props.gap, 16)}px`;
    }
    else if (breakpoint === "tablet") {
      cols = Math.min(cols, 2);
    }

    return (
      <div
        className={className}
        style={{
          ...style,
          ...styleOverride,
          width: "100%",
          boxSizing: "border-box",
          display: "grid",
          overflow: "hidden",
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        }}
      >
        {children}
      </div>
    );
  },
};

export const SpacerComponent: ComponentDefinition<{ height: number }> = {
  type: "layout.spacer",
  displayName: "Spacer",
  category: "layout",
  icon: "spacer",
  acceptsChildren: false,
  responsiveProps: ["height"],
  defaultProps: { height: 32 },
  propsSchema: z.object({ height: z.number().nonnegative() }),
  styleMap: {
    height: (v) => ({ height: `${v}px` }),
  },
  render: ({ className, style }) => (
    <div className={className} style={style} aria-hidden="true" />
  ),
};
