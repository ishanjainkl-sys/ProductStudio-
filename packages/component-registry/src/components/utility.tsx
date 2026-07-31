import { z } from "zod";
import type { ComponentDefinition } from "@productstudio/component-sdk";

export const EmbedComponent: ComponentDefinition<{
  url: string;
  height: number;
  title: string;
}> = {
  type: "utility.embed",
  displayName: "Embed",
  category: "utility",
  icon: "embed",
  acceptsChildren: false,
  responsiveProps: ["height"],
  defaultProps: {
    url: "https://example.com",
    height: 360,
    title: "Embedded content",
  },
  propsSchema: z.object({
    url: z.string().url(),
    height: z.number().positive(),
    title: z.string(),
  }),
  styleMap: {
    height: (v) => ({ height: `${v}px` }),
  },
  render: ({ props, className, style, isEditing }) => {
    if (isEditing) {
      return (
        <div
          className={className}
          style={{
            ...style,
            background: "#f5f6f8",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#6b7280",
            border: "1px dashed #d1d5db",
          }}
        >
          Embed: {props.title}
        </div>
      );
    }
    return (
      <iframe
        className={className}
        style={{ ...style, width: "100%", border: 0 }}
        src={props.url}
        title={props.title}
      />
    );
  },
};

export const AnchorComponent: ComponentDefinition<{ id: string; label: string }> = {
  type: "utility.anchor",
  displayName: "Anchor / Scroll Target",
  category: "utility",
  icon: "anchor",
  acceptsChildren: false,
  responsiveProps: [],
  defaultProps: { id: "section", label: "Anchor" },
  propsSchema: z.object({
    id: z.string().min(1),
    label: z.string(),
  }),
  render: ({ props, className, style, isEditing }) => (
    <div
      id={props.id}
      className={className}
      style={{
        ...style,
        height: isEditing ? 24 : 0,
        overflow: "hidden",
        color: "#6b7280",
        fontSize: 12,
      }}
      aria-hidden={!isEditing}
    >
      {isEditing ? `#${props.id} — ${props.label}` : null}
    </div>
  ),
};
