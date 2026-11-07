import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '@/components/Modal';
import { customers, type Priority } from '@/data/seed';
import { useTicketStore } from '@/store/tickets';
import { ticketUrl } from '@/lib/urls';

export default function NewTicketDialog({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const addTicket = useTicketStore((s) => s.addTicket);
  const [subject, setSubject] = useState('');
  const [customerId, setCustomerId] = useState(customers[0].id);
  const [priority, setPriority] = useState<Priority>('normal');

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!subject.trim()) return;
    const id = addTicket({ subject: subject.trim(), customerId, priority });
    onClose();
    navigate(ticketUrl(id));
  }

  return (
    <Modal title="New ticket" onClose={onClose}>
      <form onSubmit={submit} className="stack">
        <label>
          Subject
          <input value={subject} onChange={(e) => setSubject(e.target.value)} />
        </label>
        <label>
          Customer
          <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Priority
          <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
            {(['low', 'normal', 'high', 'urgent'] as Priority[]).map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>
        <div className="row">
          <button type="submit" className="primary">Create</button>
          <button type="button" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </Modal>
  );
}
