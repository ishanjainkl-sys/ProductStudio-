import { z } from "zod";
import type { ComponentDefinition } from "@productstudio/component-sdk";

export const NavbarComponent: ComponentDefinition<{
  brand: string;
  links: { label: string; href: string }[];
  backgroundColor: string;
}> = {
  type: "navigation.navbar",
  displayName: "Navbar",
  category: "navigation",
  icon: "menu",
  acceptsChildren: false,
  responsiveProps: [],
  defaultProps: {
    brand: "ProductStudio",
    links: [
      { label: "Product", href: "#product" },
      { label: "Pricing", href: "#pricing" },
      { label: "Docs", href: "#docs" },
    ],
    backgroundColor: "#ffffff",
  },
  propsSchema: z.object({
    brand: z.string(),
    links: z.array(z.object({ label: z.string(), href: z.string() })),
    backgroundColor: z.string(),
  }),
  styleMap: {
    backgroundColor: (v) => ({ "background-color": String(v) }),
  },
  render: ({ props, className, style, isEditing }) => (
    <nav
      className={className}
      style={{
        ...style,
        width: "100%",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 24px",
        borderBottom: "1px solid #e5e7eb",
      }}
      aria-label="Primary"
    >
      <strong>{props.brand}</strong>
      <ul style={{ display: "flex", gap: 20, listStyle: "none", margin: 0, padding: 0 }}>
        {props.links.map((l) => (
          <li key={l.label}>
            <a
              href={isEditing ? undefined : l.href}
              onClick={isEditing ? (e) => e.preventDefault() : undefined}
              style={{ color: "#111318", textDecoration: "none" }}
            >
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  ),
};

export const FooterComponent: ComponentDefinition<{
  copyright: string;
  links: { label: string; href: string }[];
}> = {
  type: "navigation.footer",
  displayName: "Footer",
  category: "navigation",
  icon: "footer",
  acceptsChildren: false,
  responsiveProps: [],
  defaultProps: {
    copyright: "© 2026 ProductStudio",
    links: [
      { label: "Privacy", href: "#privacy" },
      { label: "Terms", href: "#terms" },
    ],
  },
  propsSchema: z.object({
    copyright: z.string(),
    links: z.array(z.object({ label: z.string(), href: z.string() })),
  }),
  render: ({ props, className, style, isEditing }) => (
    <footer
      className={className}
      style={{
        ...style,
        width: "100%",
        boxSizing: "border-box",
        padding: "32px 24px",
        borderTop: "1px solid #e5e7eb",
        display: "flex",
        justifyContent: "space-between",
        color: "#6b7280",
        fontSize: 14,
      }}
    >
      <span>{props.copyright}</span>
      <ul style={{ display: "flex", gap: 16, listStyle: "none", margin: 0, padding: 0 }}>
        {props.links.map((l) => (
          <li key={l.label}>
            <a
              href={isEditing ? undefined : l.href}
              onClick={isEditing ? (e) => e.preventDefault() : undefined}
              style={{ color: "inherit" }}
            >
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </footer>
  ),
};
