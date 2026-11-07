export type WorkspaceSlug = "acme" | "northwind" | "harbor";

export interface Workspace {
  slug: WorkspaceSlug;
  name: string;
  region: string;
  timezone: string;
  plan: "Growth" | "Enterprise";
  color: string;
}

export type ShipmentStatus =
  | "booked"
  | "in_transit"
  | "at_customs"
  | "delayed"
  | "exception"
  | "delivered";

export type Mode = "FTL" | "LTL" | "Ocean" | "Air" | "Rail";

export interface Shipment {
  id: string;
  workspace: WorkspaceSlug;
  reference: string;
  customer: string;
  origin: string;
  destination: string;
  carrierId: string;
  mode: Mode;
  status: ShipmentStatus;
  pickupDate: string;
  etaDate: string;
  weightKg: number;
  pieces: number;
  valueUsd: number;
  shareCode: string;
  proNumber: string;
}

export interface Carrier {
  id: string;
  name: string;
  scac: string;
  modes: Mode[];
  onTimePct: number;
  claimsRate: number;
  workspaces: WorkspaceSlug[];
  contact: string;
  hq: string;
}

export type ExceptionType =
  | "Late pickup"
  | "Missed appointment"
  | "Damaged freight"
  | "Customs hold"
  | "Address issue"
  | "Temperature excursion";

export interface ShipmentException {
  id: string;
  shipmentId: string;
  workspace: WorkspaceSlug;
  type: ExceptionType;
  severity: "low" | "medium" | "high";
  openedAt: string;
  owner: string;
  status: "open" | "investigating" | "resolved";
  summary: string;
}

export interface Invoice {
  id: string;
  workspace: WorkspaceSlug;
  carrierId: string;
  shipmentIds: string[];
  issuedAt: string;
  dueAt: string;
  amountUsd: number;
  status: "draft" | "pending" | "approved" | "disputed" | "paid";
}

export interface Member {
  id: string;
  name: string;
  email: string;
  role: "Owner" | "Admin" | "Dispatcher" | "Finance" | "Viewer";
  workspaces: WorkspaceSlug[];
  lastActive: string;
}

export interface Notification {
  id: string;
  workspace: WorkspaceSlug;
  shipmentId: string;
  title: string;
  body: string;
  at: string;
  read: boolean;
}

export interface Dashboard {
  id: string;
  workspace: WorkspaceSlug;
  name: string;
  owner: string;
  widgets: string[];
  updatedAt: string;
}

export interface Report {
  id: string;
  workspace: WorkspaceSlug;
  name: string;
  description: string;
  cadence: "daily" | "weekly" | "monthly" | "ad hoc";
  lastRun: string;
  recipients: number;
}

export interface Location {
  id: string;
  workspace: WorkspaceSlug;
  name: string;
  kind: "Warehouse" | "Cross-dock" | "Port" | "Customer DC";
  city: string;
  dockDoors: number;
  hours: string;
}

export const workspaces: Workspace[] = [
  {
    slug: "acme",
    name: "Acme Freight Midwest",
    region: "US Midwest",
    timezone: "America/Chicago",
    plan: "Enterprise",
    color: "#2f6fed",
  },
  {
    slug: "northwind",
    name: "Northwind Logistics",
    region: "US Northeast",
    timezone: "America/New_York",
    plan: "Growth",
    color: "#0f9d76",
  },
  {
    slug: "harbor",
    name: "Harbor Line Imports",
    region: "US West Coast",
    timezone: "America/Los_Angeles",
    plan: "Enterprise",
    color: "#c2410c",
  },
];

export const DEFAULT_WORKSPACE: WorkspaceSlug = "acme";

export const carriers: Carrier[] = [
  { id: "CR-01", name: "Prairie Line Trucking", scac: "PRLT", modes: ["FTL", "LTL"], onTimePct: 94.2, claimsRate: 0.4, workspaces: ["acme", "northwind"], contact: "dispatch@prairieline.example", hq: "Omaha, NE" },
  { id: "CR-02", name: "Bluewater Ocean Carriers", scac: "BWOC", modes: ["Ocean"], onTimePct: 81.5, claimsRate: 1.1, workspaces: ["harbor"], contact: "ops@bluewater.example", hq: "Long Beach, CA" },
  { id: "CR-03", name: "Keystone Freightways", scac: "KSFW", modes: ["LTL"], onTimePct: 89.9, claimsRate: 0.7, workspaces: ["northwind", "acme"], contact: "service@keystone.example", hq: "Harrisburg, PA" },
  { id: "CR-04", name: "Summit Air Cargo", scac: "SMAC", modes: ["Air"], onTimePct: 97.1, claimsRate: 0.2, workspaces: ["acme", "harbor", "northwind"], contact: "air@summit.example", hq: "Memphis, TN" },
  { id: "CR-05", name: "Great Lakes Rail Partners", scac: "GLRP", modes: ["Rail"], onTimePct: 86.3, claimsRate: 0.5, workspaces: ["acme"], contact: "intermodal@glrp.example", hq: "Chicago, IL" },
  { id: "CR-06", name: "Coastal Drayage Co", scac: "CSDR", modes: ["FTL"], onTimePct: 91.0, claimsRate: 0.9, workspaces: ["harbor"], contact: "dray@coastal.example", hq: "Oakland, CA" },
  { id: "CR-07", name: "Ironhorse Logistics", scac: "IRHL", modes: ["FTL", "Rail"], onTimePct: 88.4, claimsRate: 0.6, workspaces: ["acme", "northwind"], contact: "loads@ironhorse.example", hq: "Kansas City, MO" },
  { id: "CR-08", name: "Pacific Rim Forwarding", scac: "PRFW", modes: ["Ocean", "Air"], onTimePct: 84.7, claimsRate: 1.4, workspaces: ["harbor"], contact: "fwd@pacrim.example", hq: "Seattle, WA" },
  { id: "CR-09", name: "Northeast Express", scac: "NEEX", modes: ["LTL", "FTL"], onTimePct: 92.6, claimsRate: 0.3, workspaces: ["northwind"], contact: "help@neex.example", hq: "Albany, NY" },
  { id: "CR-10", name: "Redline Hotshot", scac: "RDHS", modes: ["FTL"], onTimePct: 95.8, claimsRate: 0.8, workspaces: ["acme", "harbor"], contact: "hot@redline.example", hq: "Dallas, TX" },
];

const lanesByWorkspace: Record<WorkspaceSlug, [string, string][]> = {
  acme: [
    ["Chicago, IL", "Columbus, OH"],
    ["Indianapolis, IN", "St. Louis, MO"],
    ["Milwaukee, WI", "Minneapolis, MN"],
    ["Detroit, MI", "Louisville, KY"],
    ["Des Moines, IA", "Chicago, IL"],
    ["Kansas City, MO", "Denver, CO"],
  ],
  northwind: [
    ["Newark, NJ", "Boston, MA"],
    ["Philadelphia, PA", "Pittsburgh, PA"],
    ["Hartford, CT", "Albany, NY"],
    ["Baltimore, MD", "Newark, NJ"],
    ["Buffalo, NY", "Toronto, ON"],
  ],
  harbor: [
    ["Shanghai, CN", "Long Beach, CA"],
    ["Busan, KR", "Oakland, CA"],
    ["Long Beach, CA", "Phoenix, AZ"],
    ["Yokohama, JP", "Seattle, WA"],
    ["Oakland, CA", "Reno, NV"],
    ["Ho Chi Minh City, VN", "Long Beach, CA"],
  ],
};

const customers = [
  "Brightway Appliances",
  "Lakeshore Foods",
  "Cobalt Medical Supply",
  "Fernhill Furniture",
  "Orchid Apparel",
  "Granite Building Products",
  "Juniper Electronics",
  "Tallgrass Pet Co",
  "Meadowlark Beverages",
  "Quarry Auto Parts",
];

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

function addDays(base: string, days: number): string {
  const d = new Date(base + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const statuses: ShipmentStatus[] = [
  "in_transit",
  "in_transit",
  "delivered",
  "booked",
  "delayed",
  "at_customs",
  "exception",
  "delivered",
  "in_transit",
];

function buildShipments(): Shipment[] {
  const rand = seeded(42);
  const out: Shipment[] = [];
  const order: WorkspaceSlug[] = ["acme", "northwind", "harbor"];
  for (let i = 0; i < 78; i++) {
    const workspace = order[i % 3];
    const lanes = lanesByWorkspace[workspace];
    const [origin, destination] = lanes[Math.floor(rand() * lanes.length)];
    const pool = carriers.filter((c) => c.workspaces.includes(workspace));
    const carrier = pool[Math.floor(rand() * pool.length)];
    let status = statuses[Math.floor(rand() * statuses.length)];
    if (status === "at_customs" && workspace !== "harbor") status = "in_transit";
    const pickupDate = addDays("2026-10-01", Math.floor(rand() * 34));
    const transit = carrier.modes.includes("Ocean") ? 18 + Math.floor(rand() * 10) : 1 + Math.floor(rand() * 5);
    const id = `SHP-${1001 + i}`;
    out.push({
      id,
      workspace,
      reference: `PO-${(48000 + Math.floor(rand() * 9000)).toString()}`,
      customer: customers[Math.floor(rand() * customers.length)],
      origin,
      destination,
      carrierId: carrier.id,
      mode: carrier.modes[Math.floor(rand() * carrier.modes.length)],
      status,
      pickupDate,
      etaDate: addDays(pickupDate, transit),
      weightKg: 400 + Math.floor(rand() * 18000),
      pieces: 1 + Math.floor(rand() * 26),
      valueUsd: 2000 + Math.floor(rand() * 140000),
      shareCode: `s${(i * 7919 + 1301).toString(36)}`,
      proNumber: `${carrier.scac}${(700000 + Math.floor(rand() * 299999)).toString()}`,
    });
  }
  return out;
}

export const shipments: Shipment[] = buildShipments();

const exceptionTypes: ExceptionType[] = [
  "Late pickup",
  "Missed appointment",
  "Damaged freight",
  "Customs hold",
  "Address issue",
  "Temperature excursion",
];

const owners = ["Dana Ruiz", "Marcus Lee", "Priya Natarajan", "Tom Becker", "Aisha Grant", "Unassigned"];

function buildExceptions(): ShipmentException[] {
  const rand = seeded(7);
  const out: ShipmentException[] = [];
  let n = 301;
  for (const s of shipments) {
    if (s.status !== "delayed" && s.status !== "exception" && s.status !== "at_customs") continue;
    const count = s.status === "exception" ? 2 : 1;
    for (let k = 0; k < count; k++) {
      let type = exceptionTypes[Math.floor(rand() * exceptionTypes.length)];
      if (s.status === "at_customs") type = "Customs hold";
      const severity = (["low", "medium", "high"] as const)[Math.floor(rand() * 3)];
      out.push({
        id: `EX-${n++}`,
        shipmentId: s.id,
        workspace: s.workspace,
        type,
        severity,
        openedAt: addDays(s.pickupDate, 1 + k),
        owner: owners[Math.floor(rand() * owners.length)],
        status: k === 1 ? "investigating" : rand() > 0.8 ? "resolved" : "open",
        summary: `${type} reported on ${s.id} (${s.origin} to ${s.destination}).`,
      });
    }
  }
  return out;
}

export const exceptions: ShipmentException[] = buildExceptions();

function buildInvoices(): Invoice[] {
  const rand = seeded(99);
  const out: Invoice[] = [];
  const invStatuses: Invoice["status"][] = ["pending", "approved", "paid", "disputed", "paid", "draft", "approved"];
  for (let i = 0; i < 66; i++) {
    const s = shipments[i % shipments.length];
    const extra = shipments[(i * 5 + 3) % shipments.length];
    const ids = extra.workspace === s.workspace && extra.id !== s.id ? [s.id, extra.id] : [s.id];
    const issuedAt = addDays(s.pickupDate, 3 + Math.floor(rand() * 6));
    out.push({
      id: `INV-26-${(5100 + i).toString()}`,
      workspace: s.workspace,
      carrierId: s.carrierId,
      shipmentIds: ids,
      issuedAt,
      dueAt: addDays(issuedAt, 30),
      amountUsd: Math.round((800 + rand() * 14000) * 100) / 100,
      status: invStatuses[Math.floor(rand() * invStatuses.length)],
    });
  }
  return out;
}

export const invoices: Invoice[] = buildInvoices();

export const members: Member[] = [
  { id: "u-dana", name: "Dana Ruiz", email: "dana@meridian-demo.example", role: "Owner", workspaces: ["acme", "northwind", "harbor"], lastActive: "2026-11-05" },
  { id: "u-marcus", name: "Marcus Lee", email: "marcus@meridian-demo.example", role: "Dispatcher", workspaces: ["acme"], lastActive: "2026-11-05" },
  { id: "u-priya", name: "Priya Natarajan", email: "priya@meridian-demo.example", role: "Admin", workspaces: ["northwind", "harbor"], lastActive: "2026-11-04" },
  { id: "u-tom", name: "Tom Becker", email: "tom@meridian-demo.example", role: "Dispatcher", workspaces: ["acme", "northwind"], lastActive: "2026-11-02" },
  { id: "u-aisha", name: "Aisha Grant", email: "aisha@meridian-demo.example", role: "Finance", workspaces: ["acme", "northwind", "harbor"], lastActive: "2026-11-05" },
  { id: "u-kenji", name: "Kenji Watanabe", email: "kenji@meridian-demo.example", role: "Dispatcher", workspaces: ["harbor"], lastActive: "2026-10-30" },
  { id: "u-sofia", name: "Sofia Marin", email: "sofia@meridian-demo.example", role: "Viewer", workspaces: ["harbor"], lastActive: "2026-10-21" },
  { id: "u-oliver", name: "Oliver Brandt", email: "oliver@meridian-demo.example", role: "Finance", workspaces: ["acme"], lastActive: "2026-11-01" },
  { id: "u-renee", name: "Renee Okafor", email: "renee@meridian-demo.example", role: "Admin", workspaces: ["acme"], lastActive: "2026-11-03" },
  { id: "u-sam", name: "Sam Whitfield", email: "sam@meridian-demo.example", role: "Viewer", workspaces: ["northwind"], lastActive: "2026-09-28" },
];

export const CURRENT_USER = members[0];

function buildNotifications(): Notification[] {
  const picks = exceptions.slice(0, 14);
  return picks.map((e, i) => ({
    id: `N-${900 + i}`,
    workspace: e.workspace,
    shipmentId: e.shipmentId,
    title: `${e.type}: ${e.shipmentId}`,
    body: e.summary,
    at: e.openedAt,
    read: i % 4 === 3,
  }));
}

export const notifications: Notification[] = buildNotifications();

export const dashboards: Dashboard[] = workspaces.flatMap((w, wi) => [
  { id: `db-${w.slug}-ops`, workspace: w.slug, name: "Daily operations", owner: "Dana Ruiz", widgets: ["On-time %", "Shipments by status", "Open exceptions", "Lane volume"], updatedAt: `2026-11-0${wi + 2}` },
  { id: `db-${w.slug}-carriers`, workspace: w.slug, name: "Carrier performance", owner: "Priya Natarajan", widgets: ["On-time % by carrier", "Claims rate", "Tender acceptance"], updatedAt: `2026-10-2${wi + 4}` },
  { id: `db-${w.slug}-spend`, workspace: w.slug, name: "Freight spend", owner: "Aisha Grant", widgets: ["Spend by carrier", "Disputed invoices", "Cost per kg"], updatedAt: `2026-10-1${wi + 1}` },
  { id: `db-${w.slug}-lanes`, workspace: w.slug, name: "Lane health", owner: "Marcus Lee", widgets: ["Lane volume", "On-time % by lane", "Transit days"], updatedAt: `2026-10-0${wi + 5}` },
]);

export const reports: Report[] = workspaces.flatMap((w) => [
  { id: `rp-${w.slug}-otd`, workspace: w.slug, name: "On-time delivery", description: "Delivered shipments compared with promised ETA, by carrier and lane.", cadence: "weekly", lastRun: "2026-11-03", recipients: 6 },
  { id: `rp-${w.slug}-exc`, workspace: w.slug, name: "Exception aging", description: "Open exceptions grouped by owner and age bucket.", cadence: "daily", lastRun: "2026-11-05", recipients: 4 },
  { id: `rp-${w.slug}-spend`, workspace: w.slug, name: "Carrier spend", description: "Approved and paid invoice totals by carrier.", cadence: "monthly", lastRun: "2026-11-01", recipients: 3 },
  { id: `rp-${w.slug}-lanes`, workspace: w.slug, name: "Lane volume", description: "Shipment counts and weight per lane.", cadence: "weekly", lastRun: "2026-11-03", recipients: 5 },
  { id: `rp-${w.slug}-claims`, workspace: w.slug, name: "Claims summary", description: "Damage and loss claims by carrier.", cadence: "monthly", lastRun: "2026-10-31", recipients: 2 },
  { id: `rp-${w.slug}-dwell`, workspace: w.slug, name: "Dock dwell time", description: "Average time trailers spend at each location.", cadence: "ad hoc", lastRun: "2026-10-18", recipients: 1 },
]);

export const locations: Location[] = [
  { id: "LOC-11", workspace: "acme", name: "Joliet Cross-dock", kind: "Cross-dock", city: "Joliet, IL", dockDoors: 48, hours: "24/7" },
  { id: "LOC-12", workspace: "acme", name: "Columbus DC", kind: "Customer DC", city: "Columbus, OH", dockDoors: 22, hours: "06:00-22:00" },
  { id: "LOC-13", workspace: "acme", name: "Indy Warehouse 3", kind: "Warehouse", city: "Indianapolis, IN", dockDoors: 18, hours: "05:00-23:00" },
  { id: "LOC-21", workspace: "northwind", name: "Port Newark Yard", kind: "Port", city: "Newark, NJ", dockDoors: 30, hours: "24/7" },
  { id: "LOC-22", workspace: "northwind", name: "Worcester Warehouse", kind: "Warehouse", city: "Worcester, MA", dockDoors: 14, hours: "07:00-19:00" },
  { id: "LOC-31", workspace: "harbor", name: "Long Beach Terminal C", kind: "Port", city: "Long Beach, CA", dockDoors: 60, hours: "24/7" },
  { id: "LOC-32", workspace: "harbor", name: "Ontario Transload", kind: "Cross-dock", city: "Ontario, CA", dockDoors: 36, hours: "04:00-24:00" },
  { id: "LOC-33", workspace: "harbor", name: "Reno Fulfillment", kind: "Customer DC", city: "Reno, NV", dockDoors: 20, hours: "06:00-20:00" },
];

export function getWorkspace(slug: string): Workspace | undefined {
  return workspaces.find((w) => w.slug === slug);
}

export function getCarrier(id: string): Carrier | undefined {
  return carriers.find((c) => c.id === id);
}

export function shipmentsFor(workspace: string): Shipment[] {
  return shipments.filter((s) => s.workspace === workspace);
}

export function getShipment(workspace: string, id: string): Shipment | undefined {
  return shipments.find((s) => s.id === id && s.workspace === workspace);
}

export function findShipmentAnywhere(idOrRef: string): Shipment | undefined {
  const key = idOrRef.toUpperCase();
  return shipments.find(
    (s) => s.id === key || s.reference === key || s.proNumber === key,
  );
}

export function exceptionsFor(workspace: string): ShipmentException[] {
  return exceptions.filter((e) => e.workspace === workspace);
}

export function invoicesFor(workspace: string): Invoice[] {
  return invoices.filter((i) => i.workspace === workspace);
}

export function carriersFor(workspace: string): Carrier[] {
  return carriers.filter((c) => c.workspaces.includes(workspace as WorkspaceSlug));
}

export function lanesFor(workspace: string): { lane: string; count: number; onTime: number; weight: number }[] {
  const map = new Map<string, { count: number; late: number; weight: number }>();
  for (const s of shipmentsFor(workspace)) {
    const key = `${s.origin} → ${s.destination}`;
    const cur = map.get(key) ?? { count: 0, late: 0, weight: 0 };
    cur.count += 1;
    cur.weight += s.weightKg;
    if (s.status === "delayed" || s.status === "exception") cur.late += 1;
    map.set(key, cur);
  }
  return [...map.entries()]
    .map(([lane, v]) => ({
      lane,
      count: v.count,
      weight: v.weight,
      onTime: Math.round(((v.count - v.late) / v.count) * 1000) / 10,
    }))
    .sort((a, b) => b.count - a.count);
}

export function trackingEvents(s: Shipment): { at: string; label: string; place: string }[] {
  const ev = [
    { at: s.pickupDate, label: "Tendered to carrier", place: s.origin },
    { at: s.pickupDate, label: "Picked up", place: s.origin },
  ];
  if (s.status === "booked") return ev.slice(0, 1);
  ev.push({ at: s.pickupDate, label: "Departed origin facility", place: s.origin });
  if (s.status === "at_customs") ev.push({ at: s.etaDate, label: "Held by customs", place: s.destination });
  if (s.status === "delayed") ev.push({ at: s.etaDate, label: "Delay reported by carrier", place: "In transit" });
  if (s.status === "exception") ev.push({ at: s.etaDate, label: "Exception logged", place: "In transit" });
  if (s.status === "delivered") {
    ev.push({ at: s.etaDate, label: "Out for delivery", place: s.destination });
    ev.push({ at: s.etaDate, label: "Delivered, POD received", place: s.destination });
  }
  return ev;
}

export function chargesFor(s: Shipment): { label: string; amount: number }[] {
  const base = Math.round(s.weightKg * 0.42 * 100) / 100;
  const rows = [
    { label: "Linehaul", amount: base },
    { label: "Fuel surcharge", amount: Math.round(base * 0.18 * 100) / 100 },
  ];
  if (s.mode === "Ocean") rows.push({ label: "Terminal handling", amount: 640 });
  if (s.status === "delayed" || s.status === "exception") rows.push({ label: "Detention", amount: 225 });
  if (s.pieces > 15) rows.push({ label: "Liftgate", amount: 95 });
  return rows;
}

export function documentsFor(s: Shipment): { name: string; kind: string; uploadedAt: string }[] {
  const docs = [
    { name: `BOL-${s.id}.pdf`, kind: "Bill of lading", uploadedAt: s.pickupDate },
    { name: `RateCon-${s.reference}.pdf`, kind: "Rate confirmation", uploadedAt: s.pickupDate },
  ];
  if (s.mode === "Ocean") docs.push({ name: `CI-${s.reference}.pdf`, kind: "Commercial invoice", uploadedAt: s.pickupDate });
  if (s.status === "delivered") docs.push({ name: `POD-${s.id}.jpg`, kind: "Proof of delivery", uploadedAt: s.etaDate });
  return docs;
}
