import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { assignees } from '@/data/seed';
import { useTicketStore } from '@/store/tickets';
import TicketTable from '@/components/TicketTable';

const order = { urgent: 0, high: 1, normal: 2, low: 3 } as const;

export default function TicketList() {
  const [params, setParams] = useSearchParams();
  const tickets = useTicketStore((s) => s.tickets);
  const [assignee, setAssignee] = useState('any');
  const [sort, setSort] = useState<'updated' | 'priority'>('updated');

  const status = params.get('status');
  const q = params.get('q') ?? '';

  const rows = useMemo(() => {
    const list = tickets.filter(
      (t) =>
        (!status || t.status === status) &&
        (assignee === 'any' || t.assignee === assignee) &&
        (!q || t.subject.toLowerCase().includes(q.toLowerCase())),
    );
    return [...list].sort((a, b) =>
      sort === 'priority' ? order[a.priority] - order[b.priority] : b.updated.localeCompare(a.updated),
    );
  }, [tickets, status, assignee, sort, q]);

  function setQuery(value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set('q', value);
    else next.delete('q');
    setParams(next, { replace: true });
  }

  return (
    <div>
      <div className="filters">
        <input
          type="search"
          placeholder="Search subject"
          value={q}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select value={assignee} onChange={(e) => setAssignee(e.target.value)} aria-label="Assignee">
          <option value="any">Any assignee</option>
          {assignees.map((a) => (
            <option key={a}>{a}</option>
          ))}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as 'updated' | 'priority')} aria-label="Sort">
          <option value="updated">Latest first</option>
          <option value="priority">Priority</option>
        </select>
      </div>
      <p className="muted">{rows.length} tickets</p>
      <TicketTable tickets={rows} />
    </div>
  );
}
