import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex w-full rounded-2xl border border-neutral-200/80 bg-neutral-50/30 px-5 py-3 text-[14px] text-neutral-900 shadow-[0_2px_4px_rgb(0,0,0,0.02)] transition-all outline-none file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-400 hover:border-neutral-300 focus:border-primary-500 focus:bg-white focus:ring-[3px] focus:ring-primary-500/15 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-[#1A1A1A] dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:hover:border-neutral-700 dark:focus:border-primary-500 dark:focus:bg-[#141414]",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
