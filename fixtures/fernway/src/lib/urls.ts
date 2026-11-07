import type { Status } from '@/data/seed';

interface TicketFilters {
  status?: Status;
  q?: string;
  priority?: string;
}

export const ticketUrl = (id: string) => `/tickets/${id}`;

export const statusPath = (status: Status) => `/tickets/status/${status}`;

export function ticketsUrl(filters: TicketFilters = {}) {
  const parts: string[] = [];
  if (filters.status) parts.push(`status=${filters.status}`);
  if (filters.priority) parts.push(`priority=${filters.priority}`);
  if (filters.q) parts.push(`q=${filters.q}`);
  return parts.length ? `/tickets?${parts.join('&')}` : '/tickets';
}

export const customerUrl = (id: string) => `/customers/${id}`;

export const articleUrl = (slug: string) => `/knowledge/${slug}`;
