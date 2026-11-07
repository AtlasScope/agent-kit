import type {
  Invoice,
  MaintenanceRequest,
  SpendApproval,
  StaffUser,
  TenantMessage,
  Vendor,
  VendorJob,
  WorkOrder,
} from '../types';

// Snapshot of a typical Friday morning across the four buildings in the
// east portfolio. Kept in memory; nothing here is written back anywhere.

export const STAFF: StaffUser[] = [
  { name: 'Priya Nair', role: 'coordinator' },
  { name: 'Marcus Bell', role: 'coordinator' },
  { name: 'Dana Okafor', role: 'coordinator' },
  { name: 'Luis Herrera', role: 'coordinator' },
  { name: 'Joan Whitcombe', role: 'supervisor' },
];

export const BUILDINGS = [
  'Harbor View',
  'Linden Court',
  'Marlowe Flats',
  'Seagrass Terrace',
] as const;

export const vendors: Vendor[] = [
  { id: 'V-01', name: 'Brightline Plumbing', trades: ['plumbing'], phone: '555-0141', onPortal: true },
  { id: 'V-02', name: 'Corvo Electric', trades: ['electrical'], phone: '555-0177', onPortal: true },
  { id: 'V-03', name: 'Northgate HVAC', trades: ['hvac'], phone: '555-0119', onPortal: true },
  { id: 'V-04', name: 'Apex Appliance Repair', trades: ['appliance'], phone: '555-0103', onPortal: false },
  { id: 'V-05', name: 'Keystone Lock & Key', trades: ['locks'], phone: '555-0160', onPortal: false },
  { id: 'V-06', name: 'ClearPath Pest', trades: ['pest'], phone: '555-0182', onPortal: true },
  { id: 'V-07', name: 'Halvorsen Handyman', trades: ['general', 'appliance', 'locks'], phone: '555-0125', onPortal: true },
];

export const requests: MaintenanceRequest[] = [
  {
    id: 'REQ-1031', reportedAt: '2026-10-27T08:12:00', channel: 'phone',
    building: 'Harbor View', unit: '4B', tenantName: 'Alma Reyes', tenantPhone: '555-2231',
    summary: 'Kitchen sink leaking under cabinet',
    details: 'Water pooling under the sink, cabinet floor is soft. Tenant has a bucket under it.',
    category: 'plumbing', priority: 'urgent', stage: 'closed', coordinator: 'Priya Nair',
    followUpBy: null, tenantToken: 't-hv4b-q81m', permissionToEnter: true,
  },
  {
    id: 'REQ-1033', reportedAt: '2026-10-28T14:40:00', channel: 'portal',
    building: 'Linden Court', unit: '12', tenantName: 'Owen Pratt', tenantPhone: '555-2290',
    summary: 'Bedroom outlet sparks when used',
    details: 'Left outlet by the window sparked when a lamp was plugged in. Tenant stopped using it.',
    category: 'electrical', priority: 'urgent', stage: 'invoiced', coordinator: 'Marcus Bell',
    followUpBy: null, tenantToken: 't-lc12-z0p4', permissionToEnter: true,
  },
  {
    id: 'REQ-1035', reportedAt: '2026-10-30T09:05:00', channel: 'phone',
    building: 'Marlowe Flats', unit: '3A', tenantName: 'Grace Lindqvist', tenantPhone: '555-2318',
    summary: 'Dishwasher not draining',
    details: 'Standing water after every cycle. Tried cleaning the filter.',
    category: 'appliance', priority: 'routine', stage: 'in_progress', coordinator: 'Priya Nair',
    followUpBy: '2026-11-06', tenantToken: 't-mf3a-77xc', permissionToEnter: true,
  },
  {
    id: 'REQ-1036', reportedAt: '2026-10-31T17:22:00', channel: 'email',
    building: 'Seagrass Terrace', unit: '7C', tenantName: 'Hamid Sadeghi', tenantPhone: '555-2344',
    summary: 'Heat not coming on',
    details: 'Thermostat set to 70, radiators cold. Started after the boiler service last week.',
    category: 'hvac', priority: 'urgent', stage: 'in_progress', coordinator: 'Dana Okafor',
    followUpBy: '2026-11-06', tenantToken: 't-st7c-k2r9', permissionToEnter: false,
  },
  {
    id: 'REQ-1038', reportedAt: '2026-11-02T07:48:00', channel: 'phone',
    building: 'Harbor View', unit: '9F', tenantName: 'Ruth Abernathy', tenantPhone: '555-2367',
    summary: 'Front door lock sticking',
    details: 'Key turns only halfway. Tenant worried about being locked out.',
    category: 'locks', priority: 'routine', stage: 'scheduled', coordinator: 'Priya Nair',
    followUpBy: '2026-11-07', tenantToken: 't-hv9f-1d6e', permissionToEnter: true,
  },
  {
    id: 'REQ-1039', reportedAt: '2026-11-02T11:15:00', channel: 'portal',
    building: 'Linden Court', unit: '5', tenantName: 'Tomasz Wierzbicki', tenantPhone: '555-2381',
    summary: 'Mice in pantry',
    details: 'Droppings in the pantry and under the stove. Neighbour in 6 says the same.',
    category: 'pest', priority: 'routine', stage: 'scheduled', coordinator: 'Luis Herrera',
    followUpBy: '2026-11-10', tenantToken: 't-lc05-w3b8', permissionToEnter: true,
  },
  {
    id: 'REQ-1040', reportedAt: '2026-11-03T06:30:00', channel: 'phone',
    building: 'Marlowe Flats', unit: '1D', tenantName: 'Beatriz Couto', tenantPhone: '555-2402',
    summary: 'Water heater leaking, no hot water',
    details: 'Tank leaking at base, no hot water since last night. Two kids in unit.',
    category: 'plumbing', priority: 'emergency', stage: 'triaged', coordinator: 'Priya Nair',
    followUpBy: '2026-11-06', tenantToken: 't-mf1d-9qa2', permissionToEnter: true,
  },
  {
    id: 'REQ-1041', reportedAt: '2026-11-03T13:02:00', channel: 'portal',
    building: 'Seagrass Terrace', unit: '2A', tenantName: 'Ken Matsuda', tenantPhone: '555-2415',
    summary: 'Bathroom fan loud and rattling',
    details: 'Fan makes a grinding noise for the first minute, then rattles.',
    category: 'general', priority: 'routine', stage: 'in_progress', coordinator: 'Marcus Bell',
    followUpBy: '2026-11-12', tenantToken: 't-st2a-5mvn', permissionToEnter: true,
  },
  {
    id: 'REQ-1042', reportedAt: '2026-11-04T08:55:00', channel: 'phone',
    building: 'Harbor View', unit: '2C', tenantName: 'Nadia Volkova', tenantPhone: '555-2433',
    summary: 'Ceiling stain spreading in bathroom',
    details: 'Brown stain on bathroom ceiling, larger since Monday. Unit 3C above was vacant until last week.',
    category: 'plumbing', priority: 'urgent', stage: 'triaged', coordinator: 'Priya Nair',
    followUpBy: '2026-11-06', tenantToken: 't-hv2c-p8s1', permissionToEnter: false,
  },
  {
    id: 'REQ-1043', reportedAt: '2026-11-05T10:20:00', channel: 'email',
    building: 'Linden Court', unit: '9', tenantName: 'Samir Haddad', tenantPhone: '555-2450',
    summary: 'AC unit dripping onto balcony below',
    details: 'Downstairs neighbour complained. Unit still cools.',
    category: 'hvac', priority: null, stage: 'reported', coordinator: 'Luis Herrera',
    followUpBy: '2026-11-06', tenantToken: 't-lc09-r4jd', permissionToEnter: true,
  },
  {
    id: 'REQ-1044', reportedAt: '2026-11-05T16:47:00', channel: 'portal',
    building: 'Marlowe Flats', unit: '6B', tenantName: 'Ifeoma Eze', tenantPhone: '555-2468',
    summary: 'Hallway light fixture flickering',
    details: 'Flickers constantly, sometimes goes out for a few minutes.',
    category: null, priority: null, stage: 'reported', coordinator: 'Dana Okafor',
    followUpBy: '2026-11-06', tenantToken: 't-mf6b-c7ue', permissionToEnter: true,
  },
  {
    id: 'REQ-1045', reportedAt: '2026-11-06T07:10:00', channel: 'phone',
    building: 'Seagrass Terrace', unit: '10A', tenantName: 'Petra Halloran', tenantPhone: '555-2479',
    summary: 'Toilet running constantly',
    details: 'Runs all night. Jiggling the handle does not stop it.',
    category: null, priority: null, stage: 'reported', coordinator: 'Priya Nair',
    followUpBy: '2026-11-06', tenantToken: 't-st10a-h2ky', permissionToEnter: true,
  },
  {
    id: 'REQ-1046', reportedAt: '2026-11-06T07:52:00', channel: 'phone',
    building: 'Harbor View', unit: '6A', tenantName: 'Desmond Clarke', tenantPhone: '555-2490',
    summary: 'Oven will not heat',
    details: 'Burner works, oven stays cold. Tenant hosting family on Sunday.',
    category: 'appliance', priority: 'routine', stage: 'triaged', coordinator: 'Marcus Bell',
    followUpBy: '2026-11-07', tenantToken: 't-hv6a-n5wq', permissionToEnter: true,
  },
];

export const workOrders: WorkOrder[] = [
  { id: 'WO-3291', requestId: 'REQ-1031', createdAt: '2026-10-27T09:00:00', trade: 'plumbing', vendorId: 'V-01', quoteAmount: 340, scheduledFor: '2026-10-28', arrivalWindow: '8-12', accessNotes: 'Super has key.', status: 'done' },
  { id: 'WO-3294', requestId: 'REQ-1033', createdAt: '2026-10-28T15:10:00', trade: 'electrical', vendorId: 'V-02', quoteAmount: 280, scheduledFor: '2026-10-29', arrivalWindow: '12-4', accessNotes: '', status: 'done' },
  { id: 'WO-3298', requestId: 'REQ-1035', createdAt: '2026-10-30T10:00:00', trade: 'appliance', vendorId: 'V-04', quoteAmount: 195, scheduledFor: '2026-11-04', arrivalWindow: '8-12', accessNotes: 'Dog in unit, friendly.', status: 'done' },
  { id: 'WO-3301', requestId: 'REQ-1036', createdAt: '2026-11-01T09:30:00', trade: 'hvac', vendorId: 'V-03', quoteAmount: 2150, scheduledFor: '2026-11-05', arrivalWindow: '8-12', accessNotes: 'Tenant must be home. Boiler room code with super.', status: 'on_site' },
  { id: 'WO-3304', requestId: 'REQ-1038', createdAt: '2026-11-02T09:00:00', trade: 'locks', vendorId: 'V-05', quoteAmount: 120, scheduledFor: '2026-11-07', arrivalWindow: '12-4', accessNotes: '', status: 'scheduled' },
  { id: 'WO-3305', requestId: 'REQ-1039', createdAt: '2026-11-02T12:00:00', trade: 'pest', vendorId: 'V-06', quoteAmount: 260, scheduledFor: '2026-11-10', arrivalWindow: '8-12', accessNotes: 'Also treat unit 6 same visit.', status: 'scheduled' },
  { id: 'WO-3307', requestId: 'REQ-1042', createdAt: '2026-11-04T09:40:00', trade: 'plumbing', vendorId: 'V-01', quoteAmount: 1850, scheduledFor: '2026-11-06', arrivalWindow: '12-4', accessNotes: 'Need access to 3C as well; leasing office has keys.', status: 'awaiting_approval' },
  { id: 'WO-3308', requestId: 'REQ-1041', createdAt: '2026-11-04T10:15:00', trade: 'general', vendorId: 'V-07', quoteAmount: 165, scheduledFor: '2026-11-05', arrivalWindow: '12-4', accessNotes: '', status: 'on_site' },
  { id: 'WO-3310', requestId: 'REQ-1040', createdAt: '2026-11-03T07:05:00', trade: 'plumbing', vendorId: null, quoteAmount: null, scheduledFor: null, arrivalWindow: null, accessNotes: 'Emergency. Tenant home all day.', status: 'unassigned' },
];

export const vendorJobs: VendorJob[] = [
  { id: 'VJ-88104', workOrderId: 'WO-3291', vendorId: 'V-01', reportedStatus: 'completed', lastSyncedAt: '2026-10-29T05:00:00', completionNote: 'Replaced P-trap and supply line. Cabinet floor needs carpentry, not in scope.', completedAt: '2026-10-28T11:20:00', photoCount: 3, accepted: true },
  { id: 'VJ-88107', workOrderId: 'WO-3294', vendorId: 'V-02', reportedStatus: 'completed', lastSyncedAt: '2026-10-30T05:00:00', completionNote: 'Replaced outlet and backbox, tested circuit.', completedAt: '2026-10-29T14:05:00', photoCount: 2, accepted: true },
  { id: 'VJ-88110', workOrderId: 'WO-3298', vendorId: 'V-04', reportedStatus: 'completed', lastSyncedAt: '2026-11-05T05:00:00', completionNote: 'Cleared drain hose clog, replaced pump filter.', completedAt: '2026-11-04T10:40:00', photoCount: 1, accepted: false },
  { id: 'VJ-88111', workOrderId: 'WO-3301', vendorId: 'V-03', reportedStatus: 'needs_return', lastSyncedAt: '2026-11-06T05:00:00', completionNote: 'Zone valve failed. Part ordered, return visit Monday.', completedAt: null, photoCount: 4, accepted: false },
  { id: 'VJ-88112', workOrderId: 'WO-3304', vendorId: 'V-05', reportedStatus: 'accepted', lastSyncedAt: '2026-11-06T05:00:00', completionNote: null, completedAt: null, photoCount: 0, accepted: false },
  { id: 'VJ-88113', workOrderId: 'WO-3305', vendorId: 'V-06', reportedStatus: 'accepted', lastSyncedAt: '2026-11-06T05:00:00', completionNote: null, completedAt: null, photoCount: 0, accepted: false },
  { id: 'VJ-88115', workOrderId: 'WO-3308', vendorId: 'V-07', reportedStatus: 'on_site', lastSyncedAt: '2026-11-06T05:00:00', completionNote: null, completedAt: null, photoCount: 0, accepted: false },
];

export const invoices: Invoice[] = [
  { id: 'INV-20511', workOrderId: 'WO-3291', vendorId: 'V-01', amount: 340, receivedAt: '2026-10-29T12:00:00', glCode: '6120-PLUMB', status: 'exported', exportedAt: '2026-10-30T18:00:00' },
  { id: 'INV-20514', workOrderId: 'WO-3294', vendorId: 'V-02', amount: 280, receivedAt: '2026-10-30T09:30:00', glCode: '6130-ELEC', status: 'exported', exportedAt: '2026-11-03T18:00:00' },
  { id: 'INV-20519', workOrderId: 'WO-3298', vendorId: 'V-04', amount: 195, receivedAt: '2026-11-05T08:10:00', glCode: '6150-APPL', status: 'awaiting_completion', exportedAt: null },
  { id: 'INV-20522', workOrderId: 'WO-3308', vendorId: 'V-07', amount: 165, receivedAt: '2026-11-05T19:45:00', glCode: '6190-GEN', status: 'awaiting_completion', exportedAt: null },
];

export const tenantMessages: TenantMessage[] = [
  { id: 'M-501', requestId: 'REQ-1031', sentAt: '2026-10-27T09:05:00', channel: 'sms', body: 'Brightline Plumbing will visit tomorrow between 8 and 12.', sentBy: 'Priya Nair' },
  { id: 'M-502', requestId: 'REQ-1031', sentAt: '2026-10-28T12:00:00', channel: 'sms', body: 'Your sink repair is complete. Reply if anything is still leaking.', sentBy: 'Priya Nair' },
  { id: 'M-507', requestId: 'REQ-1036', sentAt: '2026-11-01T09:45:00', channel: 'email', body: 'Northgate HVAC will inspect the heating on Nov 5, 8 to 12. Someone needs to be home.', sentBy: 'Dana Okafor' },
  { id: 'M-509', requestId: 'REQ-1038', sentAt: '2026-11-02T09:20:00', channel: 'sms', body: 'A locksmith is booked for Nov 7, 12 to 4.', sentBy: 'Priya Nair' },
  { id: 'M-511', requestId: 'REQ-1042', sentAt: '2026-11-04T09:00:00', channel: 'sms', body: 'Thanks Nadia, we are looking into the ceiling stain and checking the unit above.', sentBy: 'Priya Nair' },
  { id: 'M-512', requestId: 'REQ-1040', sentAt: '2026-11-03T07:00:00', channel: 'sms', body: 'We have your water heater report and are finding a plumber now.', sentBy: 'Priya Nair' },
];

export const spendApprovals: SpendApproval[] = [
  { workOrderId: 'WO-3301', amount: 2150, requestedBy: 'Dana Okafor', requestedAt: '2026-11-01T09:35:00', status: 'approved', decidedBy: 'Joan Whitcombe', decidedAt: '2026-11-01T11:00:00' },
  { workOrderId: 'WO-3307', amount: 1850, requestedBy: 'Priya Nair', requestedAt: '2026-11-04T09:45:00', status: 'pending', decidedBy: null, decidedAt: null },
];

export const LAST_PORTAL_SYNC = '2026-11-06T05:00:00';
