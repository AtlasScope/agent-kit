import { Link, useLocation, useNavigate } from 'react-router-dom';
import { sidebarNav } from '@/config/nav';
import { getSession, signOut } from '@/lib/session';

export default function Sidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  function isActive(to: string) {
    if (to === '/tickets') return pathname.startsWith('/tickets') || pathname.startsWith('/inbox');
    return pathname.startsWith(to);
  }

  return (
    <aside className="sidebar">
      <nav aria-label="Sidebar">
        {sidebarNav.map((item) => (
          <Link key={item.to} to={item.to} className={isActive(item.to) ? 'nav-link active' : 'nav-link'}>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="sidebar-foot">
        <span>{getSession()?.name}</span>
        <button
          onClick={() => {
            signOut();
            navigate('/sign-in', { replace: true });
          }}
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
