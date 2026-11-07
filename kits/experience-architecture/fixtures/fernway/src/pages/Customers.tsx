import { Link, useParams } from 'react-router-dom';
import { customers } from '@/data/seed';
import { useTicketStore } from '@/store/tickets';
import TicketTable from '@/components/TicketTable';
import Breadcrumbs from '@/components/Breadcrumbs';
import { customerUrl } from '@/lib/urls';

export function Customers() {
  return (
    <div>
      <h1>Customers</h1>
      <ul className="plain">
        {customers.map((c) => (
          <li key={c.id}>
            <Link to={customerUrl(c.id)}>{c.name}</Link> <span className="muted">{c.company}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CustomerDetail() {
  const { customerId } = useParams();
  const customer = customers.find((c) => c.id === customerId);
  const tickets = useTicketStore((s) => s.tickets.filter((t) => t.customerId === customerId));
  if (!customer) return <p>Customer not found.</p>;
  return (
    <div>
      <Breadcrumbs crumbs={[{ label: 'Customers', to: '/customers' }, { label: customer.name }]} />
      <h1>{customer.name}</h1>
      <p className="muted">
        {customer.company} · {customer.email}
      </p>
      <h2>Tickets</h2>
      <TicketTable tickets={tickets} />
    </div>
  );
}
