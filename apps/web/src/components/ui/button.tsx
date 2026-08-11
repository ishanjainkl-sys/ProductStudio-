"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "",
  {
    variants: {
      variant: {
        default: "ps-button-primary",
        destructive: "ps-button-destructive",
        outline: "ps-button-secondary",
        secondary: "ps-button-secondary",
        ghost: "ps-button-ghost",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "",
        sm: "!h-9 !rounded-lg !px-4 !text-[13px] !py-0",
        lg: "!h-12 !rounded-2xl !px-8 !text-[15px] !py-0",
        icon: "!h-10 !w-10 !px-0 !py-0 flex items-center justify-center rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
