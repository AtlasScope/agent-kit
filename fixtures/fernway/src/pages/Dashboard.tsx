import { Link } from 'react-router-dom';
import { statuses } from '@/data/seed';
import { useTicketStore } from '@/store/tickets';
import { statusPath, ticketUrl } from '@/lib/urls';

export default function Dashboard() {
  const tickets = useTicketStore((s) => s.tickets);
  const recent = tickets.slice(0, 6);

  return (
    <div>
      <h1>Dashboard</h1>
      <section className="cards">
        {statuses.map((s) => (
          <Link key={s} to={statusPath(s)} className="card stat">
            <strong>{tickets.filter((t) => t.status === s).length}</strong>
            <span>{s}</span>
          </Link>
        ))}
      </section>

      <section>
        <h2>Recently updated</h2>
        <ul className="plain">
          {recent.map((t) => (
            <li key={t.id}>
              <Link to={ticketUrl(t.id)}>
                #{t.id} {t.subject}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Shortcuts</h2>
        <ul className="plain">
          <li><Link to="/inbox">Assigned to you</Link></li>
          <li><Link to="/reports/weekly">Weekly digest</Link></li>
          <li><Link to="/knowledge/saved-replies">Saved replies</Link></li>
        </ul>
      </section>
    </div>
  );
}
