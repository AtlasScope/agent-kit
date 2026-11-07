import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { PriorityPill } from '../components/Pill';
import { useStore } from '../store/StoreContext';
import { STAGE_LABEL, formatDateTime } from '../lib/format';

export function OverviewBeta() {
  const { state } = useStore();
  const open = state.requests
    .filter((r) => r.stage === 'reported' || r.stage === 'triaged')
    .sort((a, b) => a.reportedAt.localeCompare(b.reportedAt));

  return (
    <>
      <PageHeader title="Requests overview" subtitle="Beta" />
      <p className="notice">
        We are trying out a single overview of open requests. Tell us what you think in #tidewater-dev before 31 March
        2024.
      </p>
      <table className="grid">
        <thead>
          <tr>
            <th>Request</th>
            <th>Reported</th>
            <th>Where</th>
            <th>Summary</th>
            <th>Priority</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {open.map((r) => (
            <tr key={r.id}>
              <td>
                <Link to={`/intake/${r.id}`}>{r.id}</Link>
              </td>
              <td>{formatDateTime(r.reportedAt)}</td>
              <td>
                {r.building} {r.unit}
              </td>
              <td>{r.summary}</td>
              <td>
                <PriorityPill priority={r.priority} />
              </td>
              <td>{STAGE_LABEL[r.stage]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
