import type { Invoice, MaintenanceRequest, Stage, Vendor, VendorJob, WorkOrder } from '../types';
import type { StoreState } from '../store/reducer';
import { STAGE_LABEL, VENDOR_STATUS_LABEL, formatDate } from './format';

export function findRequest(state: StoreState, id: string): MaintenanceRequest | undefined {
  return state.requests.find((r) => r.id === id);
}

export function findWorkOrder(state: StoreState, id: string): WorkOrder | undefined {
  return state.workOrders.find((w) => w.id === id);
}

export function findVendor(state: StoreState, id: string | null): Vendor | undefined {
  return id ? state.vendors.find((v) => v.id === id) : undefined;
}

export function vendorName(state: StoreState, id: string | null): string {
  return findVendor(state, id)?.name ?? 'Unassigned';
}

export function workOrdersForRequest(state: StoreState, requestId: string): WorkOrder[] {
  return state.workOrders.filter((w) => w.requestId === requestId);
}

export function vendorJobForWorkOrder(state: StoreState, workOrderId: string): VendorJob | undefined {
  return state.vendorJobs.find((j) => j.workOrderId === workOrderId);
}

export function invoiceForWorkOrder(state: StoreState, workOrderId: string): Invoice | undefined {
  return state.invoices.find((i) => i.workOrderId === workOrderId);
}

export function requestForWorkOrder(state: StoreState, workOrderId: string): MaintenanceRequest | undefined {
  const wo = findWorkOrder(state, workOrderId);
  return wo ? findRequest(state, wo.requestId) : undefined;
}

export function requestByToken(state: StoreState, token: string): MaintenanceRequest | undefined {
  return state.requests.find((r) => r.tenantToken === token);
}

export interface TimelineEntry {
  at: string;
  label: string;
  stage: Stage;
}

// Assembles one request's history from every system it touched.
export function timelineForRequest(state: StoreState, requestId: string): TimelineEntry[] {
  const req = findRequest(state, requestId);
  if (!req) return [];
  const entries: TimelineEntry[] = [
    { at: req.reportedAt, label: `${STAGE_LABEL.reported} by ${req.channel}`, stage: 'reported' },
  ];
  for (const wo of workOrdersForRequest(state, requestId)) {
    entries.push({ at: wo.createdAt, label: 'Repair booked with our maintenance team', stage: 'triaged' });
    if (wo.scheduledFor && wo.vendorId && wo.status !== 'awaiting_approval') {
      entries.push({
        at: `${wo.scheduledFor}T00:00:00`,
        label: `Visit on ${formatDate(wo.scheduledFor)}, ${wo.arrivalWindow ?? 'time to be confirmed'}`,
        stage: 'scheduled',
      });
    }
    const job = vendorJobForWorkOrder(state, wo.id);
    if (job && job.reportedStatus !== 'queued' && job.reportedStatus !== 'accepted') {
      entries.push({ at: job.lastSyncedAt, label: VENDOR_STATUS_LABEL[job.reportedStatus], stage: 'in_progress' });
    }
    if (job?.accepted && job.completedAt) {
      entries.push({ at: job.completedAt, label: STAGE_LABEL.completed, stage: 'completed' });
    }
  }
  return entries.sort((a, b) => a.at.localeCompare(b.at));
}
