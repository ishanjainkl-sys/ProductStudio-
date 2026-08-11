import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight } from "./icons";
import { PublicLogo } from "./PublicLogo";

const navLinks = [
  { href: "/#product", label: "Product" },
  { href: "/#features", label: "Features" },
  { href: "/#showcase", label: "Showcase" },
  { href: "/#pricing", label: "Pricing" },
] as const;

function PublicAuthActions() {
  return (
    <>
      <Link
        href="/login"
        className="rounded-full px-3 py-2 text-[13px] font-semibold text-[#4a4742] dark:text-neutral-400 transition-colors hover:text-[#171717] dark:hover:text-white sm:px-4"
      >
        Log in
      </Link>
      <Link
        href="/register"
        className="group flex items-center gap-1.5 rounded-full bg-[#181716] dark:bg-primary-600 px-4 py-2.5 text-[12px] font-semibold text-white shadow-[0_4px_14px_rgba(24,23,22,0.18)] dark:shadow-none transition-transform hover:-translate-y-0.5 sm:px-5"
      >
        Sign up{" "}
        <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </Link>
    </>
  );
}

function MarketingNav() {
  return (
    <nav
      className="hidden items-center gap-8 text-[13px] font-medium text-[#605d58] dark:text-neutral-400 md:flex"
      aria-label="Main navigation"
    >
      {navLinks.map(({ href, label }) => (
        <Link key={href} href={href} className="transition-colors hover:text-[#171717] dark:hover:text-white">
          {label}
        </Link>
      ))}
    </nav>
  );
}

export function PublicNavbar({
  actions,
  variant = "marketing",
}: {
  actions?: ReactNode;
  variant?: "marketing" | "app";
}) {
  const actionSlot = actions ?? <PublicAuthActions />;

  if (variant === "app") {
    return (
      <header className="sticky top-0 z-50 border-b border-neutral-200/80 bg-white/90 backdrop-blur-xl dark:border-neutral-800/80 dark:bg-[#111111]/90">
        <div className="mx-auto flex h-[74px] max-w-[1240px] items-center justify-between gap-4 px-5 lg:px-8">
          <PublicLogo />
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">{actionSlot}</div>
        </div>
      </header>
    );
  }

  return (
    <header className="relative z-50 mx-auto grid h-[74px] max-w-[1240px] grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 lg:px-8">
      <PublicLogo />
      <MarketingNav />
      <div className="flex items-center justify-end gap-2 sm:gap-3">{actionSlot}</div>
    </header>
  );
}
