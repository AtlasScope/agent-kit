import { Link, Outlet } from 'react-router-dom';
import { STAFF } from '../data/seed';
import { useStore } from '../store/StoreContext';
import { TopNav } from './TopNav';

export function StaffLayout() {
  const { user, setUser } = useStore();
  return (
    <div className="shell">
      <header className="masthead">
        <Link to="/intake" className="brand">
          Tidewater <span className="brand-sub">Maintenance coordination</span>
        </Link>
        <label className="whoami">
          Signed in as
          <select value={user.name} onChange={(e) => setUser(e.target.value)}>
            {STAFF.map((s) => (
              <option key={s.name} value={s.name}>
                {s.name} ({s.role})
              </option>
            ))}
          </select>
        </label>
      </header>
      <TopNav />
      <main className="content">
        <Outlet />
      </main>
      <footer className="footer">East portfolio · Harbor View, Linden Court, Marlowe Flats, Seagrass Terrace</footer>
    </div>
  );
}
