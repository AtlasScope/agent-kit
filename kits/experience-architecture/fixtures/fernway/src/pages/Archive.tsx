import { useTicketStore } from '@/store/tickets';
import TicketTable from '@/components/TicketTable';

export default function Archive() {
  const closed = useTicketStore((s) => s.tickets.filter((t) => t.status === 'closed'));
  return (
    <div>
      <h1>Archive</h1>
      <TicketTable tickets={closed} />
    </div>
  );
}
