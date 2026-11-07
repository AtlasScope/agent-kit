import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { IdSearch } from '../../components/IdSearch';
import { Pill } from '../../components/Pill';
import { useStore } from '../../store/StoreContext';
import { VENDOR_STATUS_LABEL, formatDateTime } from '../../lib/format';
import { vendorName } from '../../lib/lookup';
import { normaliseId } from '../../lib/ids';
import type { VendorReportedStatus } from '../../types';

const TONE: Record<VendorReportedStatus, 'neutral' | 'warn' | 'good' | 'bad'> = {
  queued: 'neutral',
  accepted: 'neutral',
  en_route: 'neutral',
  on_site: 'warn',
  completed: 'good',
  needs_return: 'bad',
};

export function VendorSync() {
  const { state } = useStore();
  const [query, setQuery] = useState('');
  const [onlyUnreviewed, setOnlyUnreviewed] = useState(true);

  const jobs = useMemo(() => {
    const q = normaliseId(query);
    return state.vendorJobs
      .filter((j) => !onlyUnreviewed || !j.accepted)
      .filter((j) => !q || j.id.includes(q) || j.workOrderId.includes(q))
      .sort((a, b) => b.lastSyncedAt.localeCompare(a.lastSyncedAt));
  }, [state.vendorJobs, query, onlyUnreviewed]);

  const portalVendors = state.vendors.filter((v) => v.onPortal).length;

  return (
    <>
      <PageHeader
        title="Vendor Portal Sync"
        subtitle={`Status reported by vendors in the vendor portal. Last sync ${formatDateTime(state.lastPortalSync)} (runs nightly at 5am). ${portalVendors} of ${state.vendors.length} vendors are on the portal.`}
      />
      <div className="toolbar">
        <IdSearch value={query} onChange={setQuery} placeholder="Find VJ or WO number" />
        <label className="inline">
          <input type="checkbox" checked={onlyUnreviewed} onChange={(e) => setOnlyUnreviewed(e.target.checked)} />{' '}
          Hide accepted
        </label>
      </div>
      <table className="grid">
        <thead>
          <tr>
            <th>Portal job</th>
            <th>Work order</th>
            <th>Vendor</th>
            <th>Vendor status</th>
            <th>Photos</th>
            <th>Synced</th>
            <th>Reviewed</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((j) => (
            <tr key={j.id}>
              <td>
                <Link to={`/vendor-sync/${j.id}`}>{j.id}</Link>
              </td>
              <td>
                <code>{j.workOrderId}</code>
              </td>
              <td>{vendorName(state, j.vendorId)}</td>
              <td>
                <Pill tone={TONE[j.reportedStatus]}>{VENDOR_STATUS_LABEL[j.reportedStatus]}</Pill>
              </td>
              <td>{j.photoCount}</td>
              <td>{formatDateTime(j.lastSyncedAt)}</td>
              <td>{j.accepted ? 'Accepted' : '—'}</td>
            </tr>
          ))}
          {jobs.length === 0 && (
            <tr>
              <td colSpan={7} className="empty">
                No portal jobs match.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <p className="muted">
        Phone-only vendors do not appear here. Their completion is recorded when the invoice arrives in Billing Export.
      </p>
    </>
  );
}
