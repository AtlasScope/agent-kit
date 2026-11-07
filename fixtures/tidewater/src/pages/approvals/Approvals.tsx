import { PageHeader } from '../../components/PageHeader';
import { Pill } from '../../components/Pill';
import { useStore } from '../../store/StoreContext';
import { findWorkOrder, requestForWorkOrder, vendorName } from '../../lib/lookup';
import { CATEGORY_LABEL, formatDateTime, formatMoney } from '../../lib/format';
import { SPEND_APPROVAL_THRESHOLD, can } from '../../lib/permissions';

export function Approvals() {
  const { state, dispatch, user } = useStore();
  const canDecide = can(user.role, 'decide_approvals');
  const rows = [...state.spendApprovals].sort((a, b) =>
    a.status === b.status ? b.requestedAt.localeCompare(a.requestedAt) : a.status === 'pending' ? -1 : 1,
  );

  return (
    <>
      <PageHeader
        title="Approvals"
        subtitle={`Work orders quoted over ${formatMoney(SPEND_APPROVAL_THRESHOLD)} need a supervisor to approve the spend before the vendor is confirmed.`}
      />
      {!canDecide && (
        <p className="notice">
          You can see where your work orders are in the queue. Approving and declining is limited to supervisors.
        </p>
      )}
      <table className="grid">
        <thead>
          <tr>
            <th>Work order</th>
            <th>Request</th>
            <th>Building</th>
            <th>Trade</th>
            <th>Vendor</th>
            <th>Amount</th>
            <th>Requested</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((a) => {
            const wo = findWorkOrder(state, a.workOrderId);
            const req = requestForWorkOrder(state, a.workOrderId);
            const ownRequest = a.requestedBy === user.name;
            return (
              <tr key={a.workOrderId}>
                <td>
                  <code>{a.workOrderId}</code>
                </td>
                <td>
                  <code>{req?.id}</code>
                </td>
                <td>{req ? `${req.building} ${req.unit}` : '—'}</td>
                <td>{wo ? CATEGORY_LABEL[wo.trade] : '—'}</td>
                <td>{vendorName(state, wo?.vendorId ?? null)}</td>
                <td>{formatMoney(a.amount)}</td>
                <td>
                  {formatDateTime(a.requestedAt)} by {a.requestedBy}
                </td>
                <td>
                  <Pill tone={a.status === 'approved' ? 'good' : a.status === 'declined' ? 'bad' : 'warn'}>
                    {a.status === 'pending' ? 'Pending' : `${a.status} by ${a.decidedBy}`}
                  </Pill>
                </td>
                <td>
                  {a.status === 'pending' && canDecide && !ownRequest && (
                    <span className="row-actions">
                      <button
                        type="button"
                        className="primary"
                        onClick={() => dispatch({ type: 'decideApproval', workOrderId: a.workOrderId, approve: true, decidedBy: user.name })}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => dispatch({ type: 'decideApproval', workOrderId: a.workOrderId, approve: false, decidedBy: user.name })}
                      >
                        Decline
                      </button>
                    </span>
                  )}
                  {a.status === 'pending' && !canDecide && <span className="muted">Waiting on supervisor</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}
