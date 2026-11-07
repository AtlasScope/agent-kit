import type { Category, Priority, Stage, VendorReportedStatus, WorkOrderStatus } from '../types';

export const TODAY = '2026-11-06';

export function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })}`;
}

export function formatMoney(amount: number | null): string {
  if (amount === null) return '—';
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

export function ageInDays(iso: string, today = TODAY): number {
  const ms = new Date(`${today}T12:00:00`).getTime() - new Date(iso).getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

export const STAGE_LABEL: Record<Stage, string> = {
  reported: 'Reported',
  triaged: 'Triaged',
  scheduled: 'Vendor scheduled',
  in_progress: 'Work in progress',
  completed: 'Work complete',
  invoiced: 'Invoiced',
  closed: 'Closed',
};

export const STAGE_ORDER: Stage[] = [
  'reported',
  'triaged',
  'scheduled',
  'in_progress',
  'completed',
  'invoiced',
  'closed',
];

export const PRIORITY_LABEL: Record<Priority, string> = {
  emergency: 'Emergency',
  urgent: 'Urgent',
  routine: 'Routine',
};

export const CATEGORY_LABEL: Record<Category, string> = {
  plumbing: 'Plumbing',
  electrical: 'Electrical',
  hvac: 'Heating / cooling',
  appliance: 'Appliance',
  pest: 'Pest control',
  locks: 'Locks / doors',
  general: 'General repair',
};

export const WO_STATUS_LABEL: Record<WorkOrderStatus, string> = {
  unassigned: 'Unassigned',
  awaiting_approval: 'Awaiting spend approval',
  assigned: 'Vendor assigned',
  scheduled: 'Scheduled',
  on_site: 'On site',
  done: 'Done',
};

export const VENDOR_STATUS_LABEL: Record<VendorReportedStatus, string> = {
  queued: 'Queued for portal',
  accepted: 'Accepted by vendor',
  en_route: 'En route',
  on_site: 'On site',
  completed: 'Reported complete',
  needs_return: 'Needs return visit',
};
