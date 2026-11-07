# 0004. Spend approvals are a separate supervisor queue

Date: 2024-02-20
Status: Accepted

## Context

Finance policy FIN-07 requires a second person to approve any single maintenance spend over $1,500. The annual audit samples approvals and checks that the requester and the approver are different people and that the approver holds a supervisor role.

## Decision

Approvals is its own screen. Supervisors can approve or decline; coordinators can see the same list, read-only, so they know which of their work orders are waiting and can tell tenants. Nobody can approve a work order they raised. Scheduling is blocked until the approval is recorded.

## Consequences

The approval list looks a lot like the Dispatch board filtered to over-limit work orders. It is kept separate because the permissions and the audit trail differ, not the data.
