import { create } from 'zustand';
import { seedTickets, type Priority, type Status, type Ticket } from '@/data/seed';

interface NewTicket {
  subject: string;
  customerId: string;
  priority: Priority;
}

interface TicketState {
  tickets: Ticket[];
  draft: string;
  setDraft: (value: string) => void;
  setStatus: (id: string, status: Status) => void;
  addMessage: (id: string, body: string) => void;
  addTicket: (input: NewTicket) => string;
}

export const useTicketStore = create<TicketState>((set, get) => ({
  tickets: seedTickets,
  draft: '',
  setDraft: (value) => set({ draft: value }),
  setStatus: (id, status) =>
    set((s) => ({
      tickets: s.tickets.map((t) => (t.id === id ? { ...t, status } : t)),
    })),
  addMessage: (id, body) =>
    set((s) => ({
      draft: '',
      tickets: s.tickets.map((t) =>
        t.id === id
          ? { ...t, messages: [...t.messages, { from: 'agent', body, at: new Date().toISOString() }] }
          : t,
      ),
    })),
  addTicket: (input) => {
    const nextId = String(Math.max(...get().tickets.map((t) => Number(t.id))) + 1);
    const ticket: Ticket = {
      id: nextId,
      subject: input.subject,
      priority: input.priority,
      customerId: input.customerId,
      status: 'open',
      assignee: 'You',
      updated: new Date().toISOString(),
      messages: [],
    };
    set((s) => ({ tickets: [ticket, ...s.tickets] }));
    return nextId;
  },
}));
