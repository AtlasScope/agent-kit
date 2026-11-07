import { useParams } from 'react-router-dom';
import { useTicketStore } from '@/store/tickets';
import TicketTable from '@/components/TicketTable';

export default function TicketsByStatus() {
  const { status } = useParams();
  const rows = useTicketStore((s) => s.tickets.filter((t) => t.status === status));
  return (
    <div>
      <h2>{status} tickets</h2>
      <TicketTable tickets={rows} />
    </div>
  );
}
