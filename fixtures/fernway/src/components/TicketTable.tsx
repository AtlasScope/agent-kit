import { Link } from 'react-router-dom';
import { customers, type Ticket } from '@/data/seed';
import { ticketUrl } from '@/lib/urls';

export function StatusBadge({ status }: { status: string }) {
  return <span className={`badge badge-${status}`}>{status}</span>;
}

export default function TicketTable({ tickets }: { tickets: Ticket[] }) {
  if (tickets.length === 0) return <p className="muted">No tickets match.</p>;
  return (
    <table className="table">
      <thead>
        <tr>
          <th>#</th>
          <th>Subject</th>
          <th>Customer</th>
          <th>Status</th>
          <th>Priority</th>
          <th>Assignee</th>
        </tr>
      </thead>
      <tbody>
        {tickets.map((t) => (
          <tr key={t.id}>
            <td>{t.id}</td>
            <td>
              <Link to={ticketUrl(t.id)}>{t.subject}</Link>
            </td>
            <td>{customers.find((c) => c.id === t.customerId)?.name}</td>
            <td>
              <StatusBadge status={t.status} />
            </td>
            <td>{t.priority}</td>
            <td>{t.assignee}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
