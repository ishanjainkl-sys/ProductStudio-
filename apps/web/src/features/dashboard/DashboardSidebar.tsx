"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Settings, LogOut, Home, LayoutGrid, LayoutTemplate, Box, Plus } from "lucide-react";
import { dashboardNavItems, type DashboardNavIcon } from "./dashboard-nav";
import { useCreateProject } from "./CreateProjectContext";
import { api } from "@/lib/api-client";
import { PublicLogo } from "@/components/public/PublicLogo";

function NavIcon({ icon, active }: { icon: DashboardNavIcon; active: boolean }) {
  const className = active ? "text-blue-600 dark:text-[#3B82F6]" : "text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors";

  if (icon === "projects") {
    return (
      <LayoutGrid className={`h-[16px] w-[16px] ${className}`} strokeWidth={1.5} aria-hidden="true" />
    );
  }

  if (icon === "templates") {
    return (
      <LayoutTemplate className={`h-[16px] w-[16px] ${className}`} strokeWidth={1.5} aria-hidden="true" />
    );
  }

  return (
    <Box className={`h-[16px] w-[16px] ${className}`} strokeWidth={1.5} aria-hidden="true" />
  );
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-0.5" aria-label="Dashboard">
      {dashboardNavItems.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`group flex items-center gap-2.5 rounded-md px-3 py-1.5 transition-all ${active
              ? "bg-blue-50 dark:bg-[#3B82F6]/10 text-blue-600 dark:text-[#3B82F6] font-medium"
              : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-white/5 dark:hover:text-neutral-100"
              }`}
          >
            <NavIcon icon={item.icon} active={active} />
            <span className="min-w-0 flex-1">
              <span className={`block text-[13px] tracking-[-0.01em] ${active ? "font-medium" : "font-normal group-hover:text-neutral-900 dark:group-hover:text-neutral-100"}`}>
                {item.label}
              </span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

export function DashboardSidebar({
  onNavigate,
  className = "",
}: {
  onNavigate?: () => void;
  className?: string;
}) {
  const router = useRouter();
  const { triggerCreate } = useCreateProject();



  async function handleLogout() {
    await api.post("/api/auth/logout");
    router.replace("/login");
  }

  return (
    <aside
      className={`sticky top-0 flex h-screen w-[220px] shrink-0 flex-col border-r-0 bg-transparent transition-colors ${className}`}
    >
      <div className="flex h-[74px] shrink-0 items-center px-5">
        <PublicLogo />
      </div>

      <div className="px-4 py-5 pb-2">
        <p className="ps-kicker text-[10px] uppercase tracking-wider text-blue-600 dark:text-blue-500 font-bold mb-3 pl-1">Workspace</p>
        <button
          type="button"
          onClick={() => {
            triggerCreate();
            onNavigate?.();
          }}
          className="group flex w-full items-center justify-center gap-2 rounded-md bg-white border border-neutral-200 dark:border-transparent px-4 py-1.5 text-[13px] font-medium text-black shadow-sm transition-all hover:bg-neutral-100 active:scale-95"
        >
          <Plus className="h-[14px] w-[14px] opacity-80" strokeWidth={2.5} />
          New project
        </button>
      </div>

      <div className="px-4 py-2 overflow-y-auto flex-1">
        <SidebarNav onNavigate={onNavigate} />
      </div>

      <div className="px-4 py-4 space-y-0.5">
        <Link
          href="/"
          onClick={onNavigate}
          className="group flex items-center gap-2.5 rounded-md px-3 py-1.5 text-[13px] font-normal text-neutral-500 transition-all hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-900/50 dark:hover:text-neutral-100"
        >
          <Home className="h-[16px] w-[16px] text-neutral-400 transition-colors group-hover:text-neutral-600 dark:text-neutral-500 dark:group-hover:text-neutral-400" strokeWidth={1.5} />
          Back to home
        </Link>
        <Link
          href="/dashboard/account"
          onClick={onNavigate}
          className="group flex items-center gap-2.5 rounded-md px-3 py-1.5 text-[13px] font-normal text-neutral-500 transition-all hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-900/50 dark:hover:text-neutral-100"
        >
          <Settings className="h-[16px] w-[16px] text-neutral-400 transition-colors group-hover:text-neutral-600 dark:text-neutral-500 dark:group-hover:text-neutral-400" strokeWidth={1.5} />
          Settings
        </Link>
        <button
          type="button"
          onClick={() => void handleLogout()}
          className="group flex w-full items-center gap-2.5 rounded-md px-3 py-1.5 text-[13px] font-normal text-neutral-500 transition-all hover:bg-red-50 hover:text-danger dark:text-neutral-400 dark:hover:bg-red-950/30 dark:hover:text-red-400"
        >
          <LogOut className="h-[16px] w-[16px] text-neutral-400 transition-colors group-hover:text-danger dark:text-neutral-500 dark:group-hover:text-red-400" strokeWidth={1.5} />
          Logout
        </button>
      </div>
    </aside>
  );
}

export function DashboardMobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="flex gap-1 overflow-x-auto border-b border-neutral-200 dark:border-neutral-800 bg-card px-3 py-2 lg:hidden transition-colors"
      aria-label="Dashboard"
    >
      {dashboardNavItems.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold transition-colors ${active ? "bg-primary-50 text-primary-700 ring-1 ring-primary-100 dark:bg-primary-900/40 dark:text-primary-400 dark:ring-primary-900" : "text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
              }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
