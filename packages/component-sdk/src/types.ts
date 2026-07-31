import type { Breakpoint } from "@productstudio/shared-types";
import type { ZodTypeAny } from "zod";
import type { ComponentType, CSSProperties, ReactNode } from "react";

export const COMPONENT_CATEGORIES = [
  "basic",
  "layout",
  "marketing",
  "business",
  "navigation",
  "forms",
  "utility",
] as const;

export type ComponentCategory = (typeof COMPONENT_CATEGORIES)[number];

export type PropsSchema<TProps> = ZodTypeAny & { _output: TProps };

export interface ComponentRenderProps<TProps> {
  props: TProps;
  children?: ReactNode;
  breakpoint: Breakpoint;
  isEditing: boolean;
  nodeId: string;
  className?: string;
  style?: CSSProperties;
}

export interface ComponentDefinition<TProps = Record<string, unknown>> {
  type: string;
  displayName: string;
  category: ComponentCategory;
  icon: string;
  propsSchema: ZodTypeAny;
  responsiveProps: (keyof TProps & string)[];
  acceptsChildren: boolean;
  allowedChildren?: string[];
  defaultProps: TProps;
  /** Pure prop → CSS declarations for export and canvas styling. */
  styleMap?: {
    [K in keyof TProps]?: (value: TProps[K]) => Record<string, string>;
  };
  render: ComponentType<ComponentRenderProps<TProps>>;
}
