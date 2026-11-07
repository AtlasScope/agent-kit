import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { PriorityPill } from '../../components/Pill';
import { CopyId } from '../../components/CopyId';
import { useStore } from '../../store/StoreContext';
import { findRequest, workOrdersForRequest } from '../../lib/lookup';
import { CATEGORY_LABEL, STAGE_LABEL, formatDate, formatDateTime } from '../../lib/format';
import { nextId } from '../../lib/ids';
import { can } from '../../lib/permissions';
import type { Category, Priority } from '../../types';

export function IntakeDetail() {
  const { requestId = '' } = useParams();
  const { state, dispatch, user } = useStore();
  const req = findRequest(state, requestId);
  const [category, setCategory] = useState<Category | ''>(req?.category ?? '');
  const [priority, setPriority] = useState<Priority | ''>(req?.priority ?? '');
  const [accessNotes, setAccessNotes] = useState('');
  const [createdWo, setCreatedWo] = useState<string | null>(null);

  if (!req) {
    return (
      <>
        <PageHeader title="Request not found" />
        <p>
          No request with id <code>{requestId}</code>. Check the number on the call sheet, or go back to{' '}
          <Link to="/intake">Intake</Link>.
        </p>
      </>
    );
  }

  const existing = workOrdersForRequest(state, req.id);
  const canTriage = can(user.role, 'triage');
  const triaged = req.category !== null && req.priority !== null;

  const saveTriage = () => {
    if (!category || !priority) return;
    dispatch({ type: 'triage', requestId: req.id, category, priority });
  };

  const raiseWorkOrder = () => {
    if (!req.category) return;
    const id = nextId('WO', state.workOrders.map((w) => w.id));
    dispatch({
      type: 'createWorkOrder',
      workOrder: {
        id,
        requestId: req.id,
        createdAt: new Date().toISOString().slice(0, 19),
        trade: req.category,
        vendorId: null,
        quoteAmount: null,
        scheduledFor: null,
        arrivalWindow: null,
        accessNotes: accessNotes || (req.permissionToEnter ? 'Permission to enter on file.' : 'Tenant must be home.'),
        status: 'unassigned',
      },
    });
    setCreatedWo(id);
  };

  return (
    <>
      <PageHeader title={`${req.id} · ${req.summary}`} subtitle={`${req.building} ${req.unit} · ${req.tenantName}`} />
      <div className="two-col">
        <section className="card">
          <h2>Report</h2>
          <dl className="facts">
            <dt>Request</dt>
            <dd>
              <CopyId id={req.id} />
            </dd>
            <dt>Reported</dt>
            <dd>
              {formatDateTime(req.reportedAt)} via {req.channel}
            </dd>
            <dt>Tenant</dt>
            <dd>
              {req.tenantName} · {req.tenantPhone}
            </dd>
            <dt>Permission to enter</dt>
            <dd>{req.permissionToEnter ? 'Yes' : 'No, tenant must be home'}</dd>
            <dt>Status</dt>
            <dd>{STAGE_LABEL[req.stage]}</dd>
            <dt>Coordinator</dt>
            <dd>{req.coordinator}</dd>
            <dt>Follow up by</dt>
            <dd>{formatDate(req.followUpBy)}</dd>
          </dl>
          <p className="details">{req.details}</p>
        </section>

        <section className="card">
          <h2>Triage</h2>
          <div className="form-row">
            <label>
              Category
              <select value={category} onChange={(e) => setCategory(e.target.value as Category)} disabled={!canTriage}>
                <option value="">Choose…</option>
                {Object.entries(CATEGORY_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Priority
              <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} disabled={!canTriage}>
                <option value="">Choose…</option>
                <option value="emergency">Emergency (4h)</option>
                <option value="urgent">Urgent (48h)</option>
                <option value="routine">Routine (7 days)</option>
              </select>
            </label>
          </div>
          <button type="button" onClick={saveTriage} disabled={!canTriage || !category || !priority}>
            Save triage
          </button>
          <p className="muted">
            Current: <PriorityPill priority={req.priority} /> {req.category ? CATEGORY_LABEL[req.category] : ''}
          </p>

          <h2>Work order</h2>
          {existing.length > 0 ? (
            <>
              <p>A work order already exists for this request:</p>
              <ul>
                {existing.map((w) => (
                  <li key={w.id}>
                    <CopyId id={w.id} />
                  </li>
                ))}
              </ul>
              <p className="muted">
                Track it on the <Link to="/dispatch">Dispatch board</Link>.
              </p>
            </>
          ) : createdWo ? (
            <div className="notice">
              Work order <CopyId id={createdWo} /> created. Assign a vendor from{' '}
              <Link to="/dispatch/assign">Assign Vendor</Link>.
            </div>
          ) : (
            <>
              <label>
                Access notes for the vendor
                <textarea value={accessNotes} onChange={(e) => setAccessNotes(e.target.value)} rows={2} />
              </label>
              <button type="button" className="primary" onClick={raiseWorkOrder} disabled={!triaged || !canTriage}>
                Raise work order
              </button>
              {!triaged && <p className="muted">Save triage first.</p>}
            </>
          )}
        </section>
      </div>
    </>
  );
}
