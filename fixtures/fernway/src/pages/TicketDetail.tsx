import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { customers, statuses, type Status } from '@/data/seed';
import { useTicketStore } from '@/store/tickets';
import Breadcrumbs from '@/components/Breadcrumbs';
import ReplyBox from '@/components/ReplyBox';
import { StatusBadge } from '@/components/TicketTable';
import { customerUrl, ticketsUrl } from '@/lib/urls';

export default function TicketDetail() {
  const { ticketId } = useParams();
  const ticket = useTicketStore((s) => s.tickets.find((t) => t.id === ticketId));
  const setStatus = useTicketStore((s) => s.setStatus);

  if (!ticket) return <p>Ticket not found.</p>;
  const customer = customers.find((c) => c.id === ticket.customerId)!;

  const Panels = () => {
    const [tab, setTab] = useState<'conversation' | 'activity' | 'related'>('conversation');
    return (
      <div>
        <div role="tablist" className="tabs">
          {(['conversation', 'activity', 'related'] as const).map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? 'tab active' : 'tab'} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </div>
        {tab === 'conversation' && (
          <div>
            {ticket.messages.map((m, i) => (
              <div key={i} className={`msg msg-${m.from}`}>
                <strong>{m.from === 'agent' ? 'You' : customer.name}</strong>
                <p>{m.body}</p>
              </div>
            ))}
            <ReplyBox ticketId={ticket.id} />
          </div>
        )}
        {tab === 'activity' && (
          <ul className="plain">
            <li>Created {new Date(ticket.updated).toLocaleDateString()}</li>
            <li>Assigned to {ticket.assignee}</li>
            <li>Priority set to {ticket.priority}</li>
          </ul>
        )}
        {tab === 'related' && (
          <ul className="plain">
            <li><Link to={customerUrl(customer.id)}>{customer.name}</Link></li>
            <li><Link to={ticketsUrl({ q: customer.company })}>Tickets mentioning {customer.company}</Link></li>
          </ul>
        )}
      </div>
    );
  };

  return (
    <div>
      <Breadcrumbs
        crumbs={[
          { label: 'Dashboard', to: '/' },
          { label: 'Inbox', to: '/inbox' },
          { label: `#${ticket.id}` },
        ]}
      />
      <header className="detail-head">
        <h2>{ticket.subject}</h2>
        <StatusBadge status={ticket.status} />
        <select value={ticket.status} onChange={(e) => setStatus(ticket.id, e.target.value as Status)} aria-label="Status">
          {statuses.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </header>
      <Panels />
    </div>
  );
}
