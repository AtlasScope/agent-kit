import Sidebar from '@/components/Sidebar';
import Breadcrumbs from '@/components/Breadcrumbs';

export default function AppLayout({ children }) {
  return (
    <div className="shell">
      <Sidebar />
      <main>
        <Breadcrumbs />
        {children}
      </main>
    </div>
  );
}
