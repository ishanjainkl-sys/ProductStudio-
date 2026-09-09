import { z } from "zod";
import type { ComponentDefinition } from "@productstudio/component-sdk";

export const TextInputComponent: ComponentDefinition<{
  label: string;
  placeholder: string;
  required: boolean;
  name: string;
}> = {
  type: "forms.text-input",
  displayName: "Text Input",
  category: "forms",
  icon: "input",
  acceptsChildren: false,
  responsiveProps: [],
  defaultProps: {
    label: "Email",
    placeholder: "you@company.com",
    required: true,
    name: "email",
  },
  propsSchema: z.object({
    label: z.string(),
    placeholder: z.string(),
    required: z.boolean(),
    name: z.string(),
  }),
  render: ({ props, className, style }) => (
    <label className={className} style={{ ...style, width: "100%", boxSizing: "border-box", display: "block" }}>
      <span style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
        {props.label}
        {props.required ? " *" : ""}
      </span>
      <input
        type="text"
        name={props.name}
        placeholder={props.placeholder}
        required={props.required}
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "10px 12px",
          border: "1px solid #d1d5db",
          borderRadius: 8,
        }}
      />
    </label>
  ),
};

export const FormContainerComponent: ComponentDefinition<{
  action: string;
  method: string;
}> = {
  type: "forms.container",
  displayName: "Form Container",
  category: "forms",
  icon: "form",
  acceptsChildren: true,
  responsiveProps: [],
  defaultProps: {
    action: "#",
    method: "post",
  },
  propsSchema: z.object({
    action: z.string(),
    method: z.enum(["get", "post"]),
  }),
  render: ({ props, children, className, style, isEditing }) => (
    <form
      className={className}
      style={{ ...style, width: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 16 }}
      action={isEditing ? undefined : props.action}
      method={props.method}
      onSubmit={isEditing ? (e) => e.preventDefault() : undefined}
    >
      {children}
    </form>
  ),
};

export const SubmitButtonComponent: ComponentDefinition<{ label: string }> = {
  type: "forms.submit",
  displayName: "Submit Button",
  category: "forms",
  icon: "send",
  acceptsChildren: false,
  responsiveProps: [],
  defaultProps: { label: "Submit" },
  propsSchema: z.object({ label: z.string() }),
  render: ({ props, className, style, breakpoint }) => (
    <button
      type="submit"
      className={className}
      style={{
        ...style,
        background: "#3b6ff0",
        color: "#fff",
        border: "none",
        borderRadius: 8,
        padding: breakpoint === "mobile" ? "10px 16px" : "12px 20px",
        fontSize: breakpoint === "mobile" ? 14 : 16,
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      {props.label}
    </button>
  ),
};
