import type { ShipmentStatus } from "./data";

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const num = new Intl.NumberFormat("en-US");

export function money(n: number): string {
  return usd.format(n);
}

export function count(n: number): string {
  return num.format(n);
}

export function kg(n: number): string {
  return `${num.format(n)} kg`;
}

export function shortDate(iso: string): string {
  const d = new Date(iso + "T12:00:00Z");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

export const STATUS_LABEL: Record<ShipmentStatus, string> = {
  booked: "Booked",
  in_transit: "In transit",
  at_customs: "At customs",
  delayed: "Delayed",
  exception: "Exception",
  delivered: "Delivered",
};

export function statusTone(s: string): "neutral" | "good" | "warn" | "bad" | "info" {
  switch (s) {
    case "delivered":
    case "paid":
    case "approved":
    case "resolved":
      return "good";
    case "delayed":
    case "at_customs":
    case "pending":
    case "investigating":
    case "medium":
      return "warn";
    case "exception":
    case "disputed":
    case "high":
    case "open":
      return "bad";
    case "in_transit":
    case "booked":
      return "info";
    default:
      return "neutral";
  }
}
