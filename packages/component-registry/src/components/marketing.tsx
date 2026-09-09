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

export interface HeroProps {
  heading: string;
  subheading: string;
  ctaLabel: string;
  ctaHref: string;
  backgroundImage: string | null;
  textAlign: "left" | "center" | "right";
  padding: SpacingBox;
  headingSize: "xl" | "2xl" | "3xl";
}

export const HeroComponent: ComponentDefinition<HeroProps> = {
  type: "marketing.hero",
  displayName: "Hero",
  category: "marketing",
  icon: "layout-hero",
  acceptsChildren: false,
  responsiveProps: ["padding", "textAlign", "backgroundImage", "headingSize"],
  defaultProps: {
    heading: "Build faster with ProductStudio",
    subheading: "A component-first website builder for modern teams.",
    ctaLabel: "Get Started",
    ctaHref: "#",
    backgroundImage: null,
    textAlign: "center",
    padding: { top: 96, bottom: 96, left: 24, right: 24 },
    headingSize: "3xl",
  },
  propsSchema: z.object({
    heading: z.string(),
    subheading: z.string(),
    ctaLabel: z.string(),
    ctaHref: z.string(),
    backgroundImage: z.union([z.string(), z.null()]),
    textAlign: z.enum(["left", "center", "right"]),
    padding: spacingSchema,
    headingSize: z.enum(["xl", "2xl", "3xl"]),
  }),
  styleMap: {
    padding: (v) => pad(v),
    textAlign: (v) => ({ "text-align": v }),
    backgroundImage: (v): Record<string, string> =>
      v
        ? { "background-image": `url(${v})`, "background-size": "cover" }
        : { "background-image": "none", "background-size": "auto" },
  },
  render: ({ props, className, style, isEditing, breakpoint }) => {
    const sizeMap = { xl: 22, "2xl": 28, "3xl": 36 } as const;
    let titleSize = sizeMap[props.headingSize] as number;
    let responsiveStyle: any = {};
    if (breakpoint === "mobile") {
      titleSize = Math.min(titleSize, 28);
      if (props.padding.top === 96) responsiveStyle.paddingTop = "48px";
      if (props.padding.bottom === 96) responsiveStyle.paddingBottom = "48px";
    }

    return (
      <section
        className={className}
        style={{
          ...style,
          ...responsiveStyle,
          width: "100%",
          boxSizing: "border-box",
          backgroundColor: props.backgroundImage ? undefined : "#0f1f4d",
          color: "#ffffff",
          overflow: "hidden",
        }}
      >
        <h1 style={{ fontSize: titleSize, margin: "0 0 16px", fontWeight: 700, lineHeight: 1.2, wordBreak: "break-word" }}>
          {props.heading}
        </h1>
        <p style={{ fontSize: breakpoint === "mobile" ? 16 : 18, margin: "0 0 24px", opacity: 0.9, lineHeight: 1.5 }}>{props.subheading}</p>
        <a
          href={isEditing ? undefined : props.ctaHref}
          onClick={isEditing ? (e) => e.preventDefault() : undefined}
          style={{
            display: "inline-block",
            background: "#3b6ff0",
            color: "#fff",
            padding: "12px 20px",
            borderRadius: 8,
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          {props.ctaLabel}
        </a>
      </section>
    );
  },
};

export const CtaBannerComponent: ComponentDefinition<{
  heading: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  backgroundColor: string;
  padding: SpacingBox;
}> = {
  type: "marketing.cta-banner",
  displayName: "CTA Banner",
  category: "marketing",
  icon: "megaphone",
  acceptsChildren: false,
  responsiveProps: ["padding"],
  defaultProps: {
    heading: "Ready to ship?",
    body: "Start building with ProductStudio today.",
    ctaLabel: "Start free",
    ctaHref: "#",
    backgroundColor: "#eef4ff",
    padding: { top: 48, bottom: 48, left: 24, right: 24 },
  },
  propsSchema: z.object({
    heading: z.string(),
    body: z.string(),
    ctaLabel: z.string(),
    ctaHref: z.string(),
    backgroundColor: z.string(),
    padding: spacingSchema,
  }),
  styleMap: {
    padding: (v) => pad(v),
    backgroundColor: (v) => ({ "background-color": String(v) }),
  },
  render: ({ props, className, style, isEditing, breakpoint }) => {
    let responsiveStyle: any = {};
    if (breakpoint === "mobile") {
      if (props.padding.top === 48) responsiveStyle.paddingTop = "32px";
      if (props.padding.bottom === 48) responsiveStyle.paddingBottom = "32px";
    }
    return (
      <aside className={className} style={{ ...style, ...responsiveStyle, width: "100%", boxSizing: "border-box", textAlign: "center", overflow: "hidden" }}>
        <h2 style={{ margin: "0 0 8px", fontSize: breakpoint === "mobile" ? 24 : 32, fontWeight: 700, lineHeight: 1.2, wordBreak: "break-word" }}>{props.heading}</h2>
        <p style={{ margin: "0 0 16px", color: "#6b7280", fontSize: breakpoint === "mobile" ? 16 : 18, lineHeight: 1.5 }}>{props.body}</p>
        <a
          href={isEditing ? undefined : props.ctaHref}
          onClick={isEditing ? (e) => e.preventDefault() : undefined}
          style={{
            display: "inline-block",
            background: "#3b6ff0",
            color: "#fff",
            padding: "10px 18px",
            borderRadius: 8,
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          {props.ctaLabel}
        </a>
      </aside>
    );
  },
};

export const TestimonialComponent: ComponentDefinition<{
  quote: string;
  author: string;
  role: string;
  padding: SpacingBox;
}> = {
  type: "marketing.testimonial",
  displayName: "Testimonial",
  category: "marketing",
  icon: "quote",
  acceptsChildren: false,
  responsiveProps: ["padding"],
  defaultProps: {
    quote: "ProductStudio cut our launch time in half.",
    author: "Priya Sharma",
    role: "Head of Design",
    padding: { top: 32, bottom: 32, left: 24, right: 24 },
  },
  propsSchema: z.object({
    quote: z.string(),
    author: z.string(),
    role: z.string(),
    padding: spacingSchema,
  }),
  styleMap: { padding: (v) => pad(v) },
  render: ({ props, className, style, breakpoint }) => {
    let responsiveStyle: any = {};
    if (breakpoint === "mobile") {
      if (props.padding.top === 32) responsiveStyle.paddingTop = "16px";
      if (props.padding.bottom === 32) responsiveStyle.paddingBottom = "16px";
    }
    return (
      <blockquote className={className} style={{ ...style, ...responsiveStyle, width: "100%", boxSizing: "border-box", margin: 0, borderLeft: "4px solid #3b6ff0", overflow: "hidden" }}>
        <p style={{ fontSize: breakpoint === "mobile" ? 16 : 18, margin: "0 0 12px", lineHeight: 1.5, fontStyle: "italic" }}>&ldquo;{props.quote}&rdquo;</p>
        <footer style={{ color: "#6b7280", fontSize: breakpoint === "mobile" ? 12 : 14 }}>
          <strong style={{ color: "#111318" }}>{props.author}</strong> — {props.role}
        </footer>
      </blockquote>
    );
  },
};

export const FeatureGridComponent: ComponentDefinition<{
  title: string;
  features: { title: string; description: string }[];
  columns: number;
  padding: SpacingBox;
}> = {
  type: "marketing.feature-grid",
  displayName: "Feature Grid",
  category: "marketing",
  icon: "features",
  acceptsChildren: false,
  responsiveProps: ["columns", "padding"],
  defaultProps: {
    title: "Why ProductStudio",
    features: [
      { title: "Component first", description: "Governed building blocks." },
      { title: "JSON driven", description: "One source of truth." },
      { title: "Export ready", description: "Clean HTML and React." },
    ],
    columns: 3,
    padding: { top: 48, bottom: 48, left: 24, right: 24 },
  },
  propsSchema: z.object({
    title: z.string(),
    features: z.array(z.object({ title: z.string(), description: z.string() })),
    columns: z.number().int().min(1).max(4),
    padding: spacingSchema,
  }),
  styleMap: { padding: (v) => pad(v) },
  render: ({ props, className, style, breakpoint }) => {
    let responsiveStyle: any = {};
    if (breakpoint === "mobile") {
      if (props.padding.top === 48) responsiveStyle.paddingTop = "32px";
      if (props.padding.bottom === 48) responsiveStyle.paddingBottom = "32px";
    }
    return (
      <section className={className} style={{ ...style, ...responsiveStyle, width: "100%", boxSizing: "border-box", color: "#111318", overflow: "hidden" }}>
        <h2 style={{ margin: "0 0 24px", color: "#111318", fontSize: breakpoint === "mobile" ? 24 : 32, fontWeight: 700, lineHeight: 1.2 }}>{props.title}</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: breakpoint === "mobile" ? "1fr" : breakpoint === "tablet" ? `repeat(${Math.min(props.columns, 2)}, minmax(0, 1fr))` : `repeat(${props.columns}, minmax(0, 1fr))`,
            gap: breakpoint === "mobile" ? 16 : 24,
          }}
        >
          {props.features.map((f) => (
            <article key={f.title}>
              <h3 style={{ margin: "0 0 8px", color: "#111318" }}>{f.title}</h3>
              <p style={{ margin: 0, color: "#4b5563" }}>{f.description}</p>
            </article>
          ))}
        </div>
      </section>
    );
  },
};
