import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { CopyId } from '../../components/CopyId';
import { Pill } from '../../components/Pill';
import { useStore } from '../../store/StoreContext';
import { findWorkOrder, vendorJobForWorkOrder, vendorName } from '../../lib/lookup';
import { CATEGORY_LABEL, WO_STATUS_LABEL, formatDate, formatDateTime, formatMoney } from '../../lib/format';
import { can } from '../../lib/permissions';

const WINDOWS = ['8-12', '12-4', '4-7'];

export function WorkOrderDetail() {
  const { workOrderId = '' } = useParams();
  const { state, dispatch, user } = useStore();
  const wo = findWorkOrder(state, workOrderId);
  const [date, setDate] = useState(wo?.scheduledFor ?? '');
  const [window, setWindow] = useState(wo?.arrivalWindow ?? WINDOWS[0]);

  if (!wo) {
    return (
      <>
        <PageHeader title="Work order not found" />
        <p>
          No work order <code>{workOrderId}</code>. Work orders start with WO-. <Link to="/dispatch">Back to Dispatch</Link>
        </p>
      </>
    );
  }

  const job = vendorJobForWorkOrder(state, wo.id);
  const approval = state.spendApprovals.find((a) => a.workOrderId === wo.id);
  const canSchedule = can(user.role, 'dispatch') && wo.vendorId !== null && wo.status !== 'awaiting_approval';

  return (
    <>
      <PageHeader title={`${wo.id} · ${CATEGORY_LABEL[wo.trade]}`} subtitle={WO_STATUS_LABEL[wo.status]} />
      <div className="two-col">
        <section className="card">
          <h2>Work order</h2>
          <dl className="facts">
            <dt>Work order</dt>
            <dd>
              <CopyId id={wo.id} />
            </dd>
            <dt>Request</dt>
            <dd>
              <CopyId id={wo.requestId} />
            </dd>
            <dt>Created</dt>
            <dd>{formatDateTime(wo.createdAt)}</dd>
            <dt>Vendor</dt>
            <dd>
              {wo.vendorId ? (
                vendorName(state, wo.vendorId)
              ) : (
                <>
                  Unassigned · <Link to="/dispatch/assign">Assign Vendor</Link>
                </>
              )}
            </dd>
            <dt>Quote</dt>
            <dd>{formatMoney(wo.quoteAmount)}</dd>
            <dt>Spend approval</dt>
            <dd>
              {approval ? (
                <Pill tone={approval.status === 'approved' ? 'good' : approval.status === 'declined' ? 'bad' : 'warn'}>
                  {approval.status}
                </Pill>
              ) : (
                'Not needed'
              )}
            </dd>
            <dt>Access</dt>
            <dd>{wo.accessNotes || '—'}</dd>
            <dt>Vendor portal job</dt>
            <dd>{job ? <CopyId id={job.id} /> : 'Not on portal yet'}</dd>
          </dl>
        </section>

        <section className="card">
          <h2>Schedule visit</h2>
          {wo.status === 'awaiting_approval' && (
            <p className="notice">Quote is over the approval limit. Scheduling unlocks once a supervisor approves.</p>
          )}
          <div className="form-row">
            <label>
              Date
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} disabled={!canSchedule} />
            </label>
            <label>
              Window
              <select value={window} onChange={(e) => setWindow(e.target.value)} disabled={!canSchedule}>
                {WINDOWS.map((w) => (
                  <option key={w}>{w}</option>
                ))}
              </select>
            </label>
          </div>
          <button
            type="button"
            className="primary"
            disabled={!canSchedule || !date}
            onClick={() => dispatch({ type: 'scheduleVisit', workOrderId: wo.id, date, window })}
          >
            {wo.scheduledFor ? 'Reschedule' : 'Schedule'}
          </button>
          {wo.scheduledFor && (
            <p className="muted">
              Booked for {formatDate(wo.scheduledFor)}, {wo.arrivalWindow}. Remember to tell the tenant in Tenant Comms.
            </p>
          )}
        </section>
      </div>
    </>
  );
}
