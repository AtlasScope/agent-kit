export interface NavItem {
  key: string;
  label: string;
  path: string;
  match?: string[];
  badge?: "exceptions";
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const SIDEBAR_GROUPS: NavGroup[] = [
  {
    label: "Operations",
    items: [
      { key: "overview", label: "Overview", path: "/overview" },
      { key: "shipments", label: "Shipments", path: "/shipments" },
      { key: "exceptions", label: "Exceptions", path: "/exceptions", badge: "exceptions" },
      { key: "carriers", label: "Carriers", path: "/carriers" },
      { key: "locations", label: "Locations", path: "/locations" },
    ],
  },
  {
    label: "Network",
    items: [
      { key: "partners", label: "Partners", path: "/partners" },
      { key: "rate-cards", label: "Rate cards", path: "/rate-cards" },
    ],
  },
  {
    label: "Finance",
    items: [{ key: "invoices", label: "Invoices", path: "/invoices" }],
  },
  {
    label: "Analytics",
    items: [
      { key: "insights", label: "Insights", path: "/insights" },
      { key: "dashboards", label: "Dashboards", path: "/dashboards", match: ["/dashboards", "/reports"] },
      { key: "reports", label: "Reports", path: "/reports" },
    ],
  },
  {
    label: "Workspace settings",
    items: [
      { key: "settings-general", label: "General", path: "/settings/general" },
      { key: "settings-members", label: "Members", path: "/settings/members" },
      { key: "settings-alerts", label: "Alerts", path: "/settings/alerts" },
      { key: "settings-integrations", label: "Integrations", path: "/settings/integrations" },
      { key: "settings-lanes", label: "Lanes", path: "/settings/lanes" },
    ],
  },
];

export const MOBILE_NAV: NavItem[] = [
  { key: "overview", label: "Overview", path: "/overview" },
  { key: "shipments", label: "Shipments", path: "/shipments" },
  { key: "carriers", label: "Carriers", path: "/carriers" },
  { key: "locations", label: "Locations", path: "/locations" },
  { key: "partners", label: "Partners", path: "/partners" },
  { key: "invoices", label: "Invoices", path: "/invoices" },
  { key: "insights", label: "Insights", path: "/insights" },
  { key: "dashboards", label: "Dashboards", path: "/dashboards" },
  { key: "reports", label: "Reports", path: "/reports" },
  { key: "settings-general", label: "Settings", path: "/settings/general" },
];

export function activeSidebarKey(pathname: string, workspace: string): string | undefined {
  const rest = pathname.replace(`/w/${workspace}`, "") || "/";
  for (const group of SIDEBAR_GROUPS) {
    for (const item of group.items) {
      const prefixes = item.match ?? [item.path];
      if (prefixes.some((p) => rest === p || rest.startsWith(p + "/"))) return item.key;
    }
  }
  return undefined;
}

export type RailSection = "workspaces" | "inbox" | "operations" | "insights" | "org" | "account";

export interface RailItem {
  key: RailSection;
  label: string;
  short: string;
  href: (workspace: string) => string;
}

export const RAIL_ITEMS: RailItem[] = [
  { key: "workspaces", label: "Workspaces", short: "WS", href: () => "/workspaces" },
  { key: "inbox", label: "Inbox", short: "IN", href: () => "/inbox" },
  { key: "operations", label: "Operations", short: "OP", href: (w) => `/w/${w}/overview` },
  { key: "insights", label: "Insights", short: "IQ", href: (w) => `/w/${w}/insights` },
  { key: "org", label: "Organization", short: "OR", href: () => "/org" },
  { key: "account", label: "Account", short: "ME", href: () => "/account/profile" },
];

export function railSectionFor(pathname: string): RailSection {
  if (pathname.startsWith("/inbox")) return "inbox";
  if (pathname.startsWith("/org")) return "org";
  if (pathname.startsWith("/account")) return "account";
  if (pathname.startsWith("/workspaces")) return "workspaces";
  const sub = pathname.split("/")[3];
  if (sub === "insights" || sub === "dashboards" || sub === "reports") return "insights";
  return "operations";
}

const LABELS: Record<string, string> = {
  w: "Workspaces",
  org: "Organization",
  account: "Account",
  overview: "Overview",
  shipments: "Shipments",
  exceptions: "Exceptions",
  carriers: "Carriers",
  partners: "Partners",
  locations: "Locations",
  invoices: "Invoices",
  insights: "Insights",
  dashboards: "Dashboards",
  reports: "Reports",
  scheduled: "Scheduled",
  settings: "Settings",
  general: "General",
  members: "Members",
  alerts: "Alerts",
  integrations: "Integrations",
  lanes: "Lanes",
  tracking: "Tracking",
  documents: "Documents",
  charges: "Charges",
  activity: "Activity",
  performance: "Performance",
  "on-time": "On-time",
  new: "New shipment",
  profile: "Profile",
  notifications: "Notifications",
  security: "Security",
  preferences: "Preferences",
  "api-tokens": "API tokens",
  billing: "Billing",
  sso: "Single sign-on",
  "audit-log": "Audit log",
  workspaces: "Workspaces",
};

export interface Crumb {
  label: string;
  href: string;
}

export function crumbsFor(pathname: string, names: Record<string, string> = {}): Crumb[] {
  const parts = pathname.split("/").filter(Boolean);
  const crumbs: Crumb[] = [];
  let acc = "";
  for (const part of parts) {
    acc += "/" + part;
    crumbs.push({ label: names[part] ?? LABELS[part] ?? decodeURIComponent(part), href: acc });
  }
  return crumbs;
}
