// Shared record shapes. Each upstream system keeps its own id scheme:
//   REQ-  requests      (call centre / tenant portal intake)
//   WO-   work orders   (dispatch)
//   VJ-   vendor jobs   (vendor portal, synced nightly)
//   INV-  invoices      (accounts payable export)

export type Stage =
  | 'reported'
  | 'triaged'
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'invoiced'
  | 'closed';

export type Priority = 'emergency' | 'urgent' | 'routine';

export type Category =
  | 'plumbing'
  | 'electrical'
  | 'hvac'
  | 'appliance'
  | 'pest'
  | 'locks'
  | 'general';

export type Channel = 'phone' | 'portal' | 'email';

export interface MaintenanceRequest {
  id: string;
  reportedAt: string;
  channel: Channel;
  building: string;
  unit: string;
  tenantName: string;
  tenantPhone: string;
  summary: string;
  details: string;
  category: Category | null;
  priority: Priority | null;
  stage: Stage;
  coordinator: string;
  followUpBy: string | null;
  tenantToken: string;
  permissionToEnter: boolean;
}

export type WorkOrderStatus =
  | 'unassigned'
  | 'awaiting_approval'
  | 'assigned'
  | 'scheduled'
  | 'on_site'
  | 'done';

export interface WorkOrder {
  id: string;
  requestId: string;
  createdAt: string;
  trade: Category;
  vendorId: string | null;
  quoteAmount: number | null;
  scheduledFor: string | null;
  arrivalWindow: string | null;
  accessNotes: string;
  status: WorkOrderStatus;
}

export type VendorReportedStatus =
  | 'queued'
  | 'accepted'
  | 'en_route'
  | 'on_site'
  | 'completed'
  | 'needs_return';

export interface VendorJob {
  id: string;
  workOrderId: string;
  vendorId: string;
  reportedStatus: VendorReportedStatus;
  lastSyncedAt: string;
  completionNote: string | null;
  completedAt: string | null;
  photoCount: number;
  accepted: boolean;
}

export type InvoiceStatus = 'awaiting_completion' | 'ready' | 'exported';

export interface Invoice {
  id: string;
  workOrderId: string;
  vendorId: string;
  amount: number;
  receivedAt: string;
  glCode: string;
  status: InvoiceStatus;
  exportedAt: string | null;
}

export interface TenantMessage {
  id: string;
  requestId: string;
  sentAt: string;
  channel: 'sms' | 'email';
  body: string;
  sentBy: string;
}

export interface Vendor {
  id: string;
  name: string;
  trades: Category[];
  phone: string;
  onPortal: boolean;
}

export type ApprovalStatus = 'pending' | 'approved' | 'declined';

export interface SpendApproval {
  workOrderId: string;
  amount: number;
  requestedBy: string;
  requestedAt: string;
  status: ApprovalStatus;
  decidedBy: string | null;
  decidedAt: string | null;
}

export type Role = 'coordinator' | 'supervisor';

export interface StaffUser {
  name: string;
  role: Role;
}
