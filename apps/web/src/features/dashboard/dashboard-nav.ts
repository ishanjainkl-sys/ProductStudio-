export type DashboardNavIcon = "projects" | "templates";

export interface DashboardNavItem {
  href: string;
  label: string;
  description: string;
  icon: DashboardNavIcon;
  exact?: boolean;
}

export const dashboardNavItems: DashboardNavItem[] = [
  {
    href: "/dashboard",
    label: "Projects",
    description: "All your websites",
    icon: "projects",
    exact: true,
  },
  {
    href: "/dashboard/templates",
    label: "Templates",
    description: "Reusable starting points",
    icon: "templates",
  },
];
