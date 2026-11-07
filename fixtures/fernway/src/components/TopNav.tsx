import { NavLink } from 'react-router-dom';
import { primaryNav } from '@/config/nav';

export default function TopNav({ onNew }: { onNew: () => void }) {
  return (
    <header className="topnav">
      <span className="brand">Fernway</span>
      <nav aria-label="Primary">
        {primaryNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => (isActive ? 'tab active' : 'tab')}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <button className="primary" onClick={onNew}>
        New ticket
      </button>
    </header>
  );
}
