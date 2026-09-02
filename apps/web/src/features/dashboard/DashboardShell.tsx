"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Menu, LogOut, Settings, Plus } from "lucide-react";
import { MotionReveal } from "@/components/motion";

import { api } from "@/lib/api-client";
import { PublicLogo } from "@/components/public/PublicLogo";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateProjectProvider, useCreateProject } from "./CreateProjectContext";
import { DashboardMobileNav, DashboardSidebar } from "./DashboardSidebar";

const DEFAULT_AVATAR = "https://img.magnific.com/free-vector/blue-circle-with-white-user_78370-4707.jpg?semt=ais_test_b&w=740&q=80";

function UserAccountDropdown() {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string; name?: string; firstName?: string; lastName?: string; profilePictureUrl?: string; role: string } | null>(null);

  useEffect(() => {
    const handleProfileUpdate = (e: CustomEvent) => {
      if (e.detail?.user) {
        setUser(prev => prev ? { ...prev, ...e.detail.user } : e.detail.user);
      }
    };
    window.addEventListener("ps-profile-updated", handleProfileUpdate as EventListener);
    return () => window.removeEventListener("ps-profile-updated", handleProfileUpdate as EventListener);
  }, []);

  useEffect(() => {
    api.get<{ user: { email: string; name?: string; firstName?: string; lastName?: string; profilePictureUrl?: string; role: string } }>("/api/auth/me")
      .then((data) => setUser(data.user))
      .catch(() => { });
  }, []);

  async function logout() {
    await api.post("/api/auth/logout");
    router.replace("/login");
  }

  if (!user) {
    return (
      <div className="flex h-9 w-9 animate-pulse items-center justify-center rounded-full bg-neutral-200" />
    );
  }

  const initial = user.firstName ? user.firstName.charAt(0).toUpperCase() : (user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase());

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex h-9 w-9 items-center justify-center rounded-full transition-all hover:scale-105 hover:shadow focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:ring-offset-1">
          <Avatar className="h-full w-full border-2 border-white shadow-sm">
            <AvatarImage src={user.profilePictureUrl || DEFAULT_AVATAR} alt={user.name || "User Avatar"} className="object-cover" />
            <AvatarFallback className="bg-[linear-gradient(135deg,#4F46E5,#9333EA)] text-[15px] font-bold text-white select-none">
              {initial}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1.5">
            {user.name && (
              <p className="text-sm font-medium leading-none text-foreground">{user.name}</p>
            )}
            <p className={user.name ? "text-xs leading-none text-neutral-500" : "text-sm font-medium leading-none text-foreground"}>
              {user.email}
            </p>
            <p className="text-xs leading-none text-neutral-500 capitalize">{user.role}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/dashboard/account")} className="cursor-pointer">
          <Settings className="mr-2 h-4 w-4 text-neutral-500" />
          <span>Account Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => void logout()} className="cursor-pointer text-danger focus:bg-red-50 focus:text-danger">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DashboardHeaderActions() {
  const router = useRouter();
  const { triggerCreate } = useCreateProject();

  return (
    <div className="flex items-center gap-2 sm:gap-4">
      <Button
        type="button"
        onClick={() => triggerCreate()}
        className="rounded-md bg-blue-600 px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-blue-700 sm:px-5 lg:hidden"
      >
        <Plus className="h-4 w-4 mr-1.5 inline-block" />
        New project
      </Button>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => router.push("/dashboard/account")}
          className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
          aria-label="Settings"
        >
          <Settings className="h-[18px] w-[18px]" />
        </button>
        <UserAccountDropdown />
      </div>
    </div>
  );
}

function DashboardShellInner({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-neutral-50 dark:bg-[#111111] text-foreground transition-colors">
      <DashboardSidebar className="hidden lg:flex" />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Desktop Header */}
        <header className="sticky top-0 z-50 hidden h-[74px] items-center justify-end bg-transparent px-8 lg:flex transition-colors">
          <DashboardHeaderActions />
        </header>

        {/* Mobile Header */}
        <header className="sticky top-0 z-50 flex h-[74px] items-center justify-between border-b border-border/40 bg-background/90 px-5 backdrop-blur-xl lg:hidden transition-colors">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </Button>
            <PublicLogo />
          </div>
          <DashboardHeaderActions />
        </header>

        <DashboardMobileNav />

        <MotionReveal className="flex-1 px-5 py-8 sm:px-8 sm:py-10">
          <main>{children}</main>
        </MotionReveal>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[220px] max-w-[85vw] p-0 [&>button]:hidden">
          <DashboardSidebar className="relative top-0 flex h-full w-full border-0" onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <CreateProjectProvider>
      <DashboardShellInner>{children}</DashboardShellInner>
    </CreateProjectProvider>
  );
}
