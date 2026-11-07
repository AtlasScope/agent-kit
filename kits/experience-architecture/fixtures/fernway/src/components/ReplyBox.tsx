import type { FormEvent } from 'react';
import { useTicketStore } from '@/store/tickets';

export default function ReplyBox({ ticketId }: { ticketId: string }) {
  const draft = useTicketStore((s) => s.draft);
  const setDraft = useTicketStore((s) => s.setDraft);
  const addMessage = useTicketStore((s) => s.addMessage);

  function send(e: FormEvent) {
    e.preventDefault();
    if (draft.trim()) addMessage(ticketId, draft.trim());
  }

  return (
    <form onSubmit={send} className="stack reply">
      <label>
        Reply
        <textarea rows={4} value={draft} onChange={(e) => setDraft(e.target.value)} />
      </label>
      <div className="row">
        <button type="submit" className="primary">Send reply</button>
      </div>
    </form>
  );
}
