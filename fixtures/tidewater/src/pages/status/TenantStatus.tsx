import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useStore } from '../../store/StoreContext';
import { requestByToken, timelineForRequest } from '../../lib/lookup';
import { STAGE_LABEL, STAGE_ORDER, formatDate, formatDateTime } from '../../lib/format';

// Tenant-facing page, linked from every SMS and email we send. It renders
// outside StaffLayout and reads only the fields listed in ADR 0003: no vendor
// names, quotes, invoices, access notes or staff names. Tenants reach it with
// the per-request token, never with a REQ number.
export function TenantStatus() {
  const { token = '' } = useParams();
  const { state } = useStore();
  const req = requestByToken(state, token);

  useEffect(() => {
    const previous = document.title;
    document.title = 'Your repair request';
    return () => {
      document.title = previous;
    };
  }, []);

  if (!req) {
    return (
      <div className="tenant-page">
        <h1>We could not find that request</h1>
        <p>The link may have expired. Call the maintenance line at 555-0100 and we will help.</p>
      </div>
    );
  }

  const timeline = timelineForRequest(state, req.id);
  const reached = STAGE_ORDER.indexOf(req.stage);
  const steps = STAGE_ORDER.filter((s) => s !== 'invoiced');

  return (
    <div className="tenant-page">
      <p className="tenant-brand">Tidewater Residential · Maintenance</p>
      <h1>{req.summary}</h1>
      <p className="muted">
        {req.building}, unit {req.unit} · reported {formatDate(req.reportedAt)}
      </p>

      <ol className="tenant-steps">
        {steps.map((s) => (
          <li key={s} className={STAGE_ORDER.indexOf(s) <= reached ? 'done' : ''}>
            {s === 'closed' ? 'Closed' : STAGE_LABEL[s]}
          </li>
        ))}
      </ol>

      <h2>What has happened</h2>
      <ul className="tenant-timeline">
        {timeline.map((t, i) => (
          <li key={i}>
            <span className="muted">{formatDateTime(t.at)}</span> {t.label}
          </li>
        ))}
      </ul>

      {!req.permissionToEnter && <p className="notice">Someone needs to be home for the visit.</p>}
      <p className="muted">Questions? Reply to the last message we sent, or call 555-0100.</p>
    </div>
  );
}
