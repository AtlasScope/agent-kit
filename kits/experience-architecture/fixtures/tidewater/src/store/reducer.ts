import * as seed from '../data/seed';
import type {
  Category,
  Invoice,
  MaintenanceRequest,
  Priority,
  SpendApproval,
  Stage,
  TenantMessage,
  Vendor,
  VendorJob,
  WorkOrder,
} from '../types';
import { needsSpendApproval } from '../lib/permissions';
import { nextId } from '../lib/ids';
import { TODAY } from '../lib/format';

export interface StoreState {
  requests: MaintenanceRequest[];
  workOrders: WorkOrder[];
  vendorJobs: VendorJob[];
  invoices: Invoice[];
  tenantMessages: TenantMessage[];
  vendors: Vendor[];
  spendApprovals: SpendApproval[];
  lastPortalSync: string;
}

export const initialState: StoreState = {
  requests: seed.requests,
  workOrders: seed.workOrders,
  vendorJobs: seed.vendorJobs,
  invoices: seed.invoices,
  tenantMessages: seed.tenantMessages,
  vendors: seed.vendors,
  spendApprovals: seed.spendApprovals,
  lastPortalSync: seed.LAST_PORTAL_SYNC,
};

export type Action =
  | { type: 'triage'; requestId: string; category: Category; priority: Priority }
  | { type: 'createWorkOrder'; workOrder: WorkOrder }
  | { type: 'assignVendor'; workOrderId: string; vendorId: string; quoteAmount: number; requestedBy: string }
  | { type: 'scheduleVisit'; workOrderId: string; date: string; window: string }
  | { type: 'decideApproval'; workOrderId: string; approve: boolean; decidedBy: string }
  | { type: 'sendTenantMessage'; message: TenantMessage }
  | { type: 'acceptCompletion'; jobId: string }
  | { type: 'exportInvoices'; invoiceIds: string[] };

function now(): string {
  return `${TODAY}T${new Date().toTimeString().slice(0, 8)}`;
}

function setStage(requests: MaintenanceRequest[], requestId: string | undefined, stage: Stage) {
  return requests.map((r) => (r.id === requestId ? { ...r, stage } : r));
}

function patchWorkOrder(list: WorkOrder[], id: string, patch: Partial<WorkOrder>) {
  return list.map((w) => (w.id === id ? { ...w, ...patch } : w));
}

function requestIdFor(state: StoreState, workOrderId: string): string | undefined {
  return state.workOrders.find((w) => w.id === workOrderId)?.requestId;
}

export function reducer(state: StoreState, action: Action): StoreState {
  switch (action.type) {
    case 'triage':
      return {
        ...state,
        requests: state.requests.map((r) =>
          r.id === action.requestId
            ? { ...r, category: action.category, priority: action.priority, stage: 'triaged' }
            : r,
        ),
      };

    case 'createWorkOrder':
      return { ...state, workOrders: [...state.workOrders, action.workOrder] };

    case 'assignVendor': {
      const gated = needsSpendApproval(action.quoteAmount);
      const workOrders = patchWorkOrder(state.workOrders, action.workOrderId, {
        vendorId: action.vendorId,
        quoteAmount: action.quoteAmount,
        status: gated ? 'awaiting_approval' : 'assigned',
      });
      const spendApprovals = gated
        ? [
            ...state.spendApprovals.filter((a) => a.workOrderId !== action.workOrderId),
            {
              workOrderId: action.workOrderId,
              amount: action.quoteAmount,
              requestedBy: action.requestedBy,
              requestedAt: now(),
              status: 'pending' as const,
              decidedBy: null,
              decidedAt: null,
            },
          ]
        : state.spendApprovals;
      return { ...state, workOrders, spendApprovals };
    }

    case 'scheduleVisit': {
      const wo = state.workOrders.find((w) => w.id === action.workOrderId);
      if (!wo || !wo.vendorId) return state;
      const workOrders = patchWorkOrder(state.workOrders, wo.id, {
        scheduledFor: action.date,
        arrivalWindow: action.window,
        status: 'scheduled',
      });
      const hasJob = state.vendorJobs.some((j) => j.workOrderId === wo.id);
      const vendorJobs = hasJob
        ? state.vendorJobs
        : [
            ...state.vendorJobs,
            {
              id: nextId('VJ', state.vendorJobs.map((j) => j.id)),
              workOrderId: wo.id,
              vendorId: wo.vendorId,
              reportedStatus: 'queued' as const,
              lastSyncedAt: state.lastPortalSync,
              completionNote: null,
              completedAt: null,
              photoCount: 0,
              accepted: false,
            },
          ];
      return { ...state, workOrders, vendorJobs, requests: setStage(state.requests, wo.requestId, 'scheduled') };
    }

    case 'decideApproval': {
      const spendApprovals = state.spendApprovals.map((a) =>
        a.workOrderId === action.workOrderId
          ? { ...a, status: action.approve ? ('approved' as const) : ('declined' as const), decidedBy: action.decidedBy, decidedAt: now() }
          : a,
      );
      const workOrders = patchWorkOrder(state.workOrders, action.workOrderId, {
        status: action.approve ? 'assigned' : 'unassigned',
        ...(action.approve ? {} : { vendorId: null, quoteAmount: null }),
      });
      return { ...state, spendApprovals, workOrders };
    }

    case 'sendTenantMessage':
      return { ...state, tenantMessages: [...state.tenantMessages, action.message] };

    case 'acceptCompletion': {
      const job = state.vendorJobs.find((j) => j.id === action.jobId);
      if (!job) return state;
      const vendorJobs = state.vendorJobs.map((j) =>
        j.id === job.id ? { ...j, accepted: true, completedAt: j.completedAt ?? now() } : j,
      );
      const invoices = state.invoices.map((i) =>
        i.workOrderId === job.workOrderId && i.status === 'awaiting_completion' ? { ...i, status: 'ready' as const } : i,
      );
      return {
        ...state,
        vendorJobs,
        invoices,
        workOrders: patchWorkOrder(state.workOrders, job.workOrderId, { status: 'done' }),
        requests: setStage(state.requests, requestIdFor(state, job.workOrderId), 'completed'),
      };
    }

    case 'exportInvoices': {
      const at = now();
      const exported = new Set(action.invoiceIds);
      let requests = state.requests;
      for (const inv of state.invoices) {
        if (exported.has(inv.id)) requests = setStage(requests, requestIdFor(state, inv.workOrderId), 'invoiced');
      }
      return {
        ...state,
        requests,
        invoices: state.invoices.map((i) => (exported.has(i.id) ? { ...i, status: 'exported', exportedAt: at } : i)),
      };
    }

    default:
      return state;
  }
}
