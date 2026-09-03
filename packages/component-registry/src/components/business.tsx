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

export const StatsCounterComponent: ComponentDefinition<{
  stats: { value: string; label: string }[];
  padding: SpacingBox;
}> = {
  type: "business.stats",
  displayName: "Stats Counter",
  category: "business",
  icon: "chart",
  acceptsChildren: false,
  responsiveProps: ["padding"],
  defaultProps: {
    stats: [
      { value: "10x", label: "Faster launches" },
      { value: "99%", label: "Uptime" },
      { value: "50+", label: "Components" },
    ],
    padding: { top: 40, bottom: 40, left: 24, right: 24 },
  },
  propsSchema: z.object({
    stats: z.array(z.object({ value: z.string(), label: z.string() })),
    padding: spacingSchema,
  }),
  styleMap: { padding: (v) => pad(v) },
  render: ({ props, className, style, breakpoint }) => (
    <div
      className={className}
      style={{
        ...style,
        width: "100%",
        boxSizing: "border-box",
        display: "grid",
        gridTemplateColumns: breakpoint === "mobile" ? "1fr" : `repeat(${props.stats.length}, 1fr)`,
        gap: 16,
        textAlign: "center",
      }}
    >
      {props.stats.map((s) => (
        <div key={s.label}>
          <div style={{ fontSize: 32, fontWeight: 700, color: "#3b6ff0" }}>{s.value}</div>
          <div style={{ color: "#6b7280" }}>{s.label}</div>
        </div>
      ))}
    </div>
  ),
};

export const TeamGridComponent: ComponentDefinition<{
  members: { name: string; role: string; imageUrl?: string }[];
  padding: SpacingBox;
}> = {
  type: "business.team-grid",
  displayName: "Team Grid",
  category: "business",
  icon: "users",
  acceptsChildren: false,
  responsiveProps: ["padding"],
  defaultProps: {
    members: [
      { name: "Alex Chen", role: "CEO" },
      { name: "Sam Rivera", role: "CTO" },
      { name: "Jordan Lee", role: "Design Lead" },
    ],
    padding: { top: 32, bottom: 32, left: 24, right: 24 },
  },
  propsSchema: z.object({
    members: z.array(z.object({ name: z.string(), role: z.string(), imageUrl: z.string().optional() })),
    padding: spacingSchema,
  }),
  styleMap: { padding: (v) => pad(v) },
  render: ({ props, className, style, isEditing, breakpoint }) => (
    <div
      className={className}
      style={{
        ...style,
        width: "100%",
        boxSizing: "border-box",
        display: "grid",
        gridTemplateColumns: breakpoint === "mobile" ? "1fr" : "repeat(3, 1fr)",
        gap: 24,
      }}
    >
      {props.members.map((m, i) => (
        <article key={m.name + i} style={{ textAlign: "center", cursor: isEditing ? 'pointer' : 'default' }} data-ps-member-index={i}>
          {m.imageUrl ? (
            <img
              src={m.imageUrl.startsWith("ast_") ? `/api/assets/${m.imageUrl}` : m.imageUrl}
              alt={m.name}
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                objectFit: "cover",
                margin: "0 auto 12px",
              }}
            />
          ) : (
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "#eef4ff",
                margin: "0 auto 12px",
              }}
              aria-hidden
            />
          )}
          <h3 style={{ margin: "0 0 4px", color: "#111827", fontSize: "16px", fontWeight: "600" }}>{m.name}</h3>
          <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>{m.role}</p>
        </article>
      ))}
    </div>
  ),
};
