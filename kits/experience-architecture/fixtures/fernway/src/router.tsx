import { createBrowserRouter, Navigate, redirect } from 'react-router-dom';
import { getSession } from '@/lib/session';
import AppLayout from '@/layouts/AppLayout';
import TicketsLayout from '@/layouts/TicketsLayout';
import SignIn from '@/pages/SignIn';
import Dashboard from '@/pages/Dashboard';
import Inbox from '@/pages/Inbox';
import TicketList from '@/pages/TicketList';
import TicketsByStatus from '@/pages/TicketsByStatus';
import TicketDetail from '@/pages/TicketDetail';
import { Customers, CustomerDetail } from '@/pages/Customers';
import { Knowledge, Article } from '@/pages/Knowledge';
import SavedReplies from '@/pages/SavedReplies';
import { Reports, Billing } from '@/pages/Reports';
import Archive from '@/pages/Archive';
import SettingsArea from '@/pages/settings/SettingsArea';

function requireSession() {
  if (!getSession()) {
    throw redirect('/sign-in');
  }
  return null;
}

export const router = createBrowserRouter([
  { path: '/sign-in', element: <SignIn /> },
  {
    path: '/',
    element: <AppLayout />,
    loader: requireSession,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'home', element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <Navigate to="/" replace /> },
      { path: 'inbox', element: <Inbox /> },
      {
        path: 'tickets',
        element: <TicketsLayout />,
        children: [
          { index: true, element: <TicketList /> },
          { path: 'status/:status', element: <TicketsByStatus /> },
          { path: ':ticketId', element: <TicketDetail /> },
        ],
      },
      {
        path: 'customers',
        children: [
          { index: true, element: <Customers /> },
          { path: ':customerId', element: <CustomerDetail /> },
        ],
      },
      {
        path: 'knowledge',
        children: [
          { index: true, element: <Knowledge /> },
          { path: 'saved-replies', element: <SavedReplies /> },
          { path: ':slug', element: <Article /> },
        ],
      },
      {
        path: 'reports',
        children: [
          { index: true, element: <Reports /> },
          { path: 'billing', element: <Billing /> },
        ],
      },
      { path: 'archive', element: <Archive /> },
      { path: 'settings/*', element: <SettingsArea /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
