export type Status = 'open' | 'pending' | 'solved' | 'closed';
export type Priority = 'low' | 'normal' | 'high' | 'urgent';

export interface Customer {
  id: string;
  name: string;
  company: string;
  email: string;
}

export interface Message {
  from: 'customer' | 'agent';
  body: string;
  at: string;
}

export interface Ticket {
  id: string;
  subject: string;
  status: Status;
  priority: Priority;
  customerId: string;
  assignee: string;
  updated: string;
  messages: Message[];
}

export interface ArticleDoc {
  slug: string;
  title: string;
  section: string;
  body: string;
}

export const statuses: Status[] = ['open', 'pending', 'solved', 'closed'];
export const assignees = ['You', 'Priya', 'Marcus', 'Unassigned'];

export const customers: Customer[] = [
  { id: 'c1', name: 'Dana Whitfield', company: 'Ferris & Co', email: 'dana@ferris.example' },
  { id: 'c2', name: 'Luis Ortega', company: 'Brightloom', email: 'luis@brightloom.example' },
  { id: 'c3', name: 'Mei Tanaka', company: 'Northgate Labs', email: 'mei@northgate.example' },
  { id: 'c4', name: 'Oscar Bell', company: 'Quill & Anchor', email: 'oscar@quill.example' },
  { id: 'c5', name: 'Hannah Reyes', company: 'Pinecrest', email: 'hannah@pinecrest.example' },
  { id: 'c6', name: 'Tomas Novak', company: 'Alder Works', email: 'tomas@alder.example' },
  { id: 'c7', name: 'Ines Duarte', company: 'Marlow Freight', email: 'ines@marlow.example' },
  { id: 'c8', name: 'Reggie Cole', company: 'Cole Brothers', email: 'reggie@cole.example' },
];

const subjects = [
  'Cannot reset password',
  'Invoice shows wrong total',
  'Export to CSV fails',
  'Webhook retries not firing',
  'Request: dark mode',
  'Login loop on mobile',
  'Seat count mismatch',
  'Slow dashboard loading',
  'Merge duplicate accounts',
  'API rate limit question',
];
const priorities: Priority[] = ['normal', 'high', 'low', 'urgent'];
const base = Date.UTC(2026, 10, 1, 12, 0, 0);

export const seedTickets: Ticket[] = Array.from({ length: 60 }, (_, i) => ({
  id: String(1001 + i),
  subject: subjects[i % subjects.length],
  status: statuses[(i * 7) % 4],
  priority: priorities[i % 4],
  customerId: customers[i % customers.length].id,
  assignee: assignees[i % assignees.length],
  updated: new Date(base - i * 5 * 3600 * 1000).toISOString(),
  messages: [
    {
      from: 'customer',
      body: `Hi, I need help with: ${subjects[i % subjects.length].toLowerCase()}. It started this week.`,
      at: new Date(base - i * 5 * 3600 * 1000 - 3600 * 1000).toISOString(),
    },
  ],
}));

export const articles: ArticleDoc[] = [
  { slug: 'reset-password', title: 'Resetting a customer password', section: 'Accounts', body: 'Send the reset link from the customer profile and confirm the email on file first.' },
  { slug: 'refund-policy', title: 'Refund policy', section: 'Billing', body: 'Refunds up to 30 days are approved by any agent. Beyond that, ask a lead.' },
  { slug: 'csv-export', title: 'Troubleshooting CSV exports', section: 'Data', body: 'Exports over 50,000 rows are queued. Check the job status before retrying.' },
  { slug: 'webhooks', title: 'Webhook delivery and retries', section: 'Data', body: 'Failed webhooks retry six times with exponential backoff.' },
  { slug: 'merge-accounts', title: 'Merging duplicate accounts', section: 'Accounts', body: 'Merging is permanent. Keep the older account as the primary.' },
];

export const savedReplies = [
  { id: 'r1', title: 'Thanks for reaching out', body: 'Thanks for getting in touch. I am looking into this now.' },
  { id: 'r2', title: 'Need more details', body: 'Could you share a screenshot and the time it happened?' },
  { id: 'r3', title: 'Closing the loop', body: 'Marking this as solved. Reply here if it comes back.' },
];
