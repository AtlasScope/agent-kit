import { Suspense, type ReactNode } from 'react';
import LeftNav from '~/components/LeftNav';
import MobileMenu from '~/components/MobileMenu';
import WorkspaceSwitcher from '~/components/WorkspaceSwitcher';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="shell">
      <header className="topbar">
        <span className="brand">Lumen</span>
        <Suspense fallback={null}>
          <WorkspaceSwitcher />
        </Suspense>
        <MobileMenu />
      </header>
      <div className="body">
        <aside className="leftnav">
          <LeftNav />
        </aside>
        <main>{children}</main>
      </div>
    </div>
  );
}
