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

export const TextComponent: ComponentDefinition<{
  text: string;
  color: string;
  fontSize: string;
  textAlign: string;
  padding: SpacingBox;
}> = {
  type: "basic.text",
  displayName: "Text",
  category: "basic",
  icon: "type",
  acceptsChildren: false,
  responsiveProps: ["fontSize", "textAlign", "padding", "color"],
  defaultProps: {
    text: "Edit this text",
    color: "#111318",
    fontSize: "base",
    textAlign: "left",
    padding: { top: 0, bottom: 0, left: 0, right: 0 },
  },
  propsSchema: z.object({
    text: z.string(),
    color: z.string(),
    fontSize: z.enum(["xs", "sm", "base", "lg", "xl", "2xl", "3xl"]),
    textAlign: z.enum(["left", "center", "right"]),
    padding: spacingSchema,
  }),
  styleMap: {
    color: (v) => ({ color: String(v) }),
    textAlign: (v) => ({ "text-align": String(v) }),
    padding: (v) => pad(v),
  },
  render: ({ props, className, style, breakpoint }) => {
    const sizeMap: Record<string, number> = { xs: 12, sm: 14, base: 16, lg: 18, xl: 20, "2xl": 24, "3xl": 30 };
    let fontSize = sizeMap[props.fontSize] || 16;
    if (breakpoint === "mobile") fontSize = Math.max(12, fontSize * 0.85);
    else if (breakpoint === "tablet") fontSize = Math.max(14, fontSize * 0.95);

    return (
      <p className={className} style={{ ...style, fontSize, margin: 0, wordBreak: "break-word" }}>
        {props.text}
      </p>
    );
  },
};

export const HeadingComponent: ComponentDefinition<{
  text: string;
  level: number;
  color: string;
  textAlign: string;
  padding: SpacingBox;
}> = {
  type: "basic.heading",
  displayName: "Heading",
  category: "basic",
  icon: "heading",
  acceptsChildren: false,
  responsiveProps: ["textAlign", "padding", "color"],
  defaultProps: {
    text: "Heading",
    level: 2,
    color: "#111318",
    textAlign: "left",
    padding: { top: 0, bottom: 8, left: 0, right: 0 },
  },
  propsSchema: z.object({
    text: z.string(),
    level: z.number().int().min(1).max(6),
    color: z.string(),
    textAlign: z.enum(["left", "center", "right"]),
    padding: spacingSchema,
  }),
  styleMap: {
    color: (v) => ({ color: String(v) }),
    textAlign: (v) => ({ "text-align": String(v) }),
    padding: (v) => pad(v),
  },
  render: ({ props, className, style, breakpoint }) => {
    const levelSizeMap: Record<number, number> = { 1: 40, 2: 32, 3: 28, 4: 24, 5: 20, 6: 16 };
    let fontSize = levelSizeMap[props.level] || 32;
    if (breakpoint === "mobile") fontSize = Math.max(18, Math.floor(fontSize * 0.75));
    else if (breakpoint === "tablet") fontSize = Math.max(20, Math.floor(fontSize * 0.85));

    const Tag = `h${props.level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
    return (
      <Tag className={className} style={{ ...style, fontSize, lineHeight: 1.2, margin: 0, wordBreak: "break-word" }}>
        {props.text}
      </Tag>
    );
  },
};

export const ButtonComponent: ComponentDefinition<{
  label: string;
  href: string;
  variant: string;
  padding: SpacingBox;
}> = {
  type: "basic.button",
  displayName: "Button",
  category: "basic",
  icon: "button",
  acceptsChildren: false,
  responsiveProps: ["padding"],
  defaultProps: {
    label: "Click me",
    href: "#",
    variant: "primary",
    padding: { top: 12, bottom: 12, left: 20, right: 20 },
  },
  propsSchema: z.object({
    label: z.string(),
    href: z.string(),
    variant: z.enum(["primary", "secondary", "ghost"]),
    padding: spacingSchema,
  }),
  styleMap: {
    padding: (v) => pad(v),
  },
  render: ({ props, className, style, isEditing, breakpoint }) => {
    const bg =
      props.variant === "primary"
        ? "#3b6ff0"
        : props.variant === "secondary"
          ? "#f5f6f8"
          : "transparent";
    const color = props.variant === "primary" ? "#ffffff" : "#111318";
    return (
      <a
        href={isEditing ? undefined : props.href}
        className={className}
        draggable={isEditing ? false : undefined}
        style={{
          ...style,
          display: "inline-block",
          background: bg,
          color,
          borderRadius: 8,
          textDecoration: "none",
          fontWeight: 600,
          fontSize: breakpoint === "mobile" ? 14 : 16,
          textAlign: "center",
        }}
        onClick={isEditing ? (e) => e.preventDefault() : undefined}
      >
        {props.label}
      </a>
    );
  },
};

export const ImageComponent: ComponentDefinition<{
  src: string | null;
  alt: string;
  width: string;
  borderRadius: number;
}> = {
  type: "basic.image",
  displayName: "Image",
  category: "basic",
  icon: "image",
  acceptsChildren: false,
  responsiveProps: ["width"],
  defaultProps: {
    src: null,
    alt: "Image",
    width: "100%",
    borderRadius: 8,
  },
  propsSchema: z.object({
    src: z.union([z.string(), z.null()]),
    alt: z.string(),
    width: z.string(),
    borderRadius: z.number(),
  }),
  styleMap: {
    width: (v) => ({ width: String(v) }),
    borderRadius: (v) => ({ "border-radius": `${v}px` }),
  },
  render: ({ props, className, style, isEditing, nodeId }) => {
    if (!props.src) {
      if (isEditing) {
        return (
          <label
            className={className}
            style={{
              ...style,
              background: "#f5f6f8",
              minHeight: 160,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#6b7280",
              cursor: "pointer",
            }}
            role="button"
            aria-label={props.alt}
          >
            Image placeholder
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onloadend = () => {
                  window.dispatchEvent(
                    new CustomEvent("ps-upload-image", {
                      detail: { nodeId, src: reader.result },
                    })
                  );
                };
                reader.readAsDataURL(file);
              }}
            />
          </label>
        );
      }

      return (
        <div
          className={className}
          style={{
            ...style,
            background: "#f5f6f8",
            minHeight: 160,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#6b7280",
          }}
          role="img"
          aria-label={props.alt}
        >
          Image placeholder
        </div>
      );
    }
    if (isEditing) {
      return (
        <label className={className} style={{ ...style, cursor: "pointer", display: "inline-block" }}>
          <img src={props.src} alt={props.alt} draggable={false} style={{ width: "100%", height: "100%", borderRadius: "inherit", display: "block" }} />
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onloadend = () => {
                window.dispatchEvent(
                  new CustomEvent("ps-upload-image", {
                    detail: { nodeId, src: reader.result },
                  })
                );
              };
              reader.readAsDataURL(file);
            }}
          />
        </label>
      );
    }

    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img className={className} style={style} src={props.src} alt={props.alt} />
    );
  },
};

export const DividerComponent: ComponentDefinition<{ color: string; thickness: number }> = {
  type: "basic.divider",
  displayName: "Divider",
  category: "basic",
  icon: "minus",
  acceptsChildren: false,
  responsiveProps: [],
  defaultProps: { color: "#e5e7eb", thickness: 1 },
  propsSchema: z.object({
    color: z.string(),
    thickness: z.number().positive(),
  }),
  styleMap: {
    color: (v) => ({ "border-color": String(v) }),
    thickness: (v) => ({ "border-top-width": `${v}px` }),
  },
  render: ({ className, style }) => (
    <hr
      className={className}
      style={{ ...style, border: "none", borderTopStyle: "solid", margin: "16px 0" }}
    />
  ),
};
