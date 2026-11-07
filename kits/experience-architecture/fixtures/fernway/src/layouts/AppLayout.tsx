import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import TopNav from '@/components/TopNav';
import Sidebar from '@/components/Sidebar';
import MobileHeader from '@/components/MobileHeader';
import NewTicketDialog from '@/components/NewTicketDialog';

export default function AppLayout() {
  const [creating, setCreating] = useState(false);

  return (
    <div className="shell">
      <TopNav onNew={() => setCreating(true)} />
      <MobileHeader />
      <div className="body">
        <Sidebar />
        <main id="main">
          <Outlet />
        </main>
      </div>
      {creating && <NewTicketDialog onClose={() => setCreating(false)} />}
    </div>
  );
}
