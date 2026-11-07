import { Link } from 'react-router-dom';
import { statuses } from '@/data/seed';
import { useTicketStore } from '@/store/tickets';
import Breadcrumbs from '@/components/Breadcrumbs';

export function Reports() {
  const tickets = useTicketStore((s) => s.tickets);
  return (
    <div>
      <h1>Reports</h1>
      <table className="table">
        <tbody>
          {statuses.map((s) => (
            <tr key={s}>
              <td>{s}</td>
              <td>{tickets.filter((t) => t.status === s).length}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        <Link to="/reports/billing">Plan and billing</Link>
      </p>
    </div>
  );
}

export function Billing() {
  return (
    <div>
      <Breadcrumbs crumbs={[{ label: 'Reports', to: '/reports' }, { label: 'Billing' }]} />
      <h1>Plan and billing</h1>
      <p>Team plan, 12 seats. Next invoice on the 1st.</p>
      <button>Update payment method</button>
    </div>
  );
}
