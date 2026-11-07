import { Link, Outlet, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { statuses, type Status } from '@/data/seed';
import { ticketsUrl } from '@/lib/urls';

export default function TicketsLayout() {
  const { ticketId } = useParams();
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const current = params.get('status');

  const views: { label: string; status?: Status }[] = [
    { label: 'All' },
    ...statuses.map((s) => ({ label: s[0].toUpperCase() + s.slice(1), status: s })),
  ];

  return (
    <div>
      <h1>Tickets</h1>
      {!ticketId && (
        <nav className="subnav" aria-label="Ticket views">
          {views.map((v) => {
            const active = pathname === '/tickets' && (current ?? undefined) === v.status;
            return (
              <Link key={v.label} to={ticketsUrl({ status: v.status })} className={active ? 'chip active' : 'chip'}>
                {v.label}
              </Link>
            );
          })}
        </nav>
      )}
      <Outlet />
    </div>
  );
}
