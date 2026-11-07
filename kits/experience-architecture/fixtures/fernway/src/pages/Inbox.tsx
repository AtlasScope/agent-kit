import { useTicketStore } from '@/store/tickets';
import TicketTable from '@/components/TicketTable';

export default function Inbox() {
  const mine = useTicketStore((s) => s.tickets.filter((t) => t.assignee === 'You' && t.status !== 'closed'));
  return (
    <div>
      <h1>Inbox</h1>
      <p className="muted">{mine.length} tickets assigned to you.</p>
      <TicketTable tickets={mine} />
    </div>
  );
}
