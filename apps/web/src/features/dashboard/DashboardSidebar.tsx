"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Settings, LogOut, Home } from "lucide-react";
import { dashboardNavItems, type DashboardNavIcon } from "./dashboard-nav";
import { useCreateProject } from "./CreateProjectContext";
import { api } from "@/lib/api-client";
import { PublicLogo } from "@/components/public/PublicLogo";

function NavIcon({ icon, active }: { icon: DashboardNavIcon; active: boolean }) {
  const className = active ? "text-foreground" : "text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors";

  if (icon === "projects") {
    return (
      <svg className={`h-[18px] w-[18px] ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
        <rect x="13" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
        <rect x="3" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
        <rect x="13" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
      </svg>
    );
  }

  if (icon === "templates") {
    return (
      <svg className={`h-[18px] w-[18px] ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v13A1.5 1.5 0 0 1 18.5 20h-13A1.5 1.5 0 0 1 4 18.5v-13Z" stroke="currentColor" strokeWidth="1.7" />
        <path d="M8 4v16M16 4v16M4 9h16M4 15h16" stroke="currentColor" strokeWidth="1.7" />
      </svg>
    );
  }

  return (
    <svg className={`h-[18px] w-[18px] ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M5.5 19.5c0-3.038 2.91-5.5 6.5-5.5s6.5 2.462 6.5 5.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1" aria-label="Dashboard">
      {dashboardNavItems.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`group flex items-center gap-3 rounded-[12px] px-3 py-2.5 transition-all ${active
              ? "bg-primary-50/80 text-primary-900 font-bold dark:bg-primary-900/10 dark:text-primary-400"
              : "text-neutral-500 font-semibold hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-[#1A1A1A] dark:hover:text-neutral-100"
              }`}
          >
            <NavIcon icon={item.icon} active={active} />
            <span className="min-w-0 flex-1">
              <span className={`block text-[14px] tracking-[-0.01em] ${active ? "font-bold text-primary-900 dark:text-primary-400" : "font-semibold group-hover:text-neutral-900 dark:group-hover:text-neutral-100"}`}>
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
      className={`sticky top-0 flex h-screen w-[260px] shrink-0 flex-col border-r border-neutral-200/80 bg-white dark:border-neutral-800/80 dark:bg-neutral-900 transition-colors ${className}`}
    >
      <div className="flex h-[74px] shrink-0 items-center px-5 border-b border-neutral-200/50 dark:border-neutral-800/50">
        <PublicLogo />
      </div>

      <div className="px-4 py-5 pb-2">
        <p className="ps-kicker text-[11px] uppercase tracking-widest text-muted-foreground font-bold mb-3 pl-1">Workspace</p>
        <button
          type="button"
          onClick={() => {
            triggerCreate();
            onNavigate?.();
          }}
          className="group flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-[13px] font-bold text-white shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition-all hover:bg-neutral-800 active:scale-95 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          <svg className="h-[14px] w-[14px] opacity-80 transition-transform group-hover:rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New project
        </button>
      </div>

      <div className="px-4 py-2 overflow-y-auto flex-1">
        <SidebarNav onNavigate={onNavigate} />
      </div>

      <div className="border-t border-neutral-200/50 dark:border-neutral-800/50 px-4 py-4 space-y-0.5">
        <Link
          href="/"
          onClick={onNavigate}
          className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium text-neutral-500 transition-all hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-900/50 dark:hover:text-neutral-100"
        >
          <Home className="h-[16px] w-[16px] text-neutral-400 transition-colors group-hover:text-neutral-600 dark:text-neutral-500 dark:group-hover:text-neutral-400" />
          Back to home
        </Link>
        <Link
          href="/dashboard/account"
          onClick={onNavigate}
          className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium text-neutral-500 transition-all hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-900/50 dark:hover:text-neutral-100"
        >
          <Settings className="h-[16px] w-[16px] text-neutral-400 transition-colors group-hover:text-neutral-600 dark:text-neutral-500 dark:group-hover:text-neutral-400" />
          Settings
        </Link>
        <button
          type="button"
          onClick={() => void handleLogout()}
          className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium text-neutral-500 transition-all hover:bg-red-50 hover:text-danger dark:text-neutral-400 dark:hover:bg-red-950/30 dark:hover:text-red-400"
        >
          <LogOut className="h-[16px] w-[16px] text-neutral-400 transition-colors group-hover:text-danger dark:text-neutral-500 dark:group-hover:text-red-400" />
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
