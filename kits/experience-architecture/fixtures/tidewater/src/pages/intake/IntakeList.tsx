import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { IdSearch } from '../../components/IdSearch';
import { PriorityPill } from '../../components/Pill';
import { useStore } from '../../store/StoreContext';
import { BUILDINGS } from '../../data/seed';
import { STAGE_LABEL, ageInDays, formatDateTime } from '../../lib/format';
import { normaliseId } from '../../lib/ids';
import type { Priority } from '../../types';

const INTAKE_STAGES = new Set(['reported', 'triaged']);

export function IntakeList() {
  const { state } = useStore();
  const [building, setBuilding] = useState<string>('all');
  const [priority, setPriority] = useState<Priority | 'all' | 'untriaged'>('all');
  const [query, setQuery] = useState('');

  const rows = useMemo(() => {
    const q = normaliseId(query);
    return state.requests
      .filter((r) => INTAKE_STAGES.has(r.stage))
      .filter((r) => building === 'all' || r.building === building)
      .filter((r) =>
        priority === 'all' ? true : priority === 'untriaged' ? r.priority === null : r.priority === priority,
      )
      .filter((r) => !q || r.id.includes(q) || r.unit.toUpperCase() === q)
      .sort((a, b) => a.reportedAt.localeCompare(b.reportedAt));
  }, [state.requests, building, priority, query]);

  return (
    <>
      <PageHeader
        title="Intake"
        subtitle="New reports from the call centre, tenant portal and the maintenance inbox. Triage here, then raise a work order for Dispatch."
      />
      <div className="toolbar">
        <IdSearch value={query} onChange={setQuery} placeholder="Find REQ number or unit" />
        <select value={building} onChange={(e) => setBuilding(e.target.value)} aria-label="Building">
          <option value="all">All buildings</option>
          {BUILDINGS.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority | 'all' | 'untriaged')}
          aria-label="Priority"
        >
          <option value="all">Any priority</option>
          <option value="untriaged">Not triaged</option>
          <option value="emergency">Emergency</option>
          <option value="urgent">Urgent</option>
          <option value="routine">Routine</option>
        </select>
        <span className="muted">{rows.length} in intake</span>
      </div>
      <table className="grid">
        <thead>
          <tr>
            <th>Request</th>
            <th>Reported</th>
            <th>Building / unit</th>
            <th>Summary</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Coordinator</th>
            <th>Age</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
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
              <td>{r.coordinator}</td>
              <td>{ageInDays(r.reportedAt)}d</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={8} className="empty">
                Nothing in intake matches. Requests that already have a work order are on the Dispatch board.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
}
