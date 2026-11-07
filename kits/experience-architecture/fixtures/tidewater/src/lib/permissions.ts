import type { Role } from '../types';

// Work orders quoted above this amount need a second person to sign off
// before the vendor is confirmed (finance policy FIN-07, separation of duties).
// Coordinators raise the request and can see where it sits in the queue so they
// can tell the tenant what is holding things up; only supervisors can decide.
// Audit checks that the requester and the approver are never the same person.
export const SPEND_APPROVAL_THRESHOLD = 1500;

export type Permission =
  | 'triage'
  | 'dispatch'
  | 'message_tenant'
  | 'accept_completion'
  | 'export_billing'
  | 'view_approvals'
  | 'decide_approvals';

const GRANTS: Record<Role, Permission[]> = {
  coordinator: [
    'triage',
    'dispatch',
    'message_tenant',
    'accept_completion',
    'export_billing',
    'view_approvals',
  ],
  supervisor: ['view_approvals', 'decide_approvals', 'export_billing'],
};

export function can(role: Role, permission: Permission): boolean {
  return GRANTS[role].includes(permission);
}

export function needsSpendApproval(amount: number | null): boolean {
  return amount !== null && amount > SPEND_APPROVAL_THRESHOLD;
}
