import { useState } from 'react';
import { Navigate, NavLink, Route, Routes } from 'react-router-dom';
import { settingsNav } from '@/config/nav';
import { getSession, signIn } from '@/lib/session';
import { savedReplies } from '@/data/seed';

function Profile() {
  const [name, setName] = useState(getSession()?.name ?? '');
  return (
    <form className="stack" onSubmit={(e) => { e.preventDefault(); signIn(name); }}>
      <h2>Profile</h2>
      <label>
        Display name
        <input value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <button className="primary" type="submit">Save</button>
    </form>
  );
}

function Team() {
  return (
    <div>
      <h2>Team</h2>
      <ul className="plain">
        <li>Alex Agent (admin)</li>
        <li>Priya (agent)</li>
        <li>Marcus (agent)</li>
      </ul>
    </div>
  );
}

function Notifications() {
  return (
    <div>
      <h2>Notifications</h2>
      <label><input type="checkbox" defaultChecked /> Email me when a ticket is assigned</label>
    </div>
  );
}

function Macros() {
  return (
    <div>
      <h2>Macros</h2>
      <ul className="plain">
        {savedReplies.map((r) => (
          <li key={r.id}>{r.title}</li>
        ))}
      </ul>
    </div>
  );
}

export default function SettingsArea() {
  return (
    <div>
      <h1>Settings</h1>
      <div className="split">
        <nav aria-label="Settings" className="settings-nav">
          {settingsNav.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <section>
          <Routes>
            <Route index element={<Navigate to="profile" replace />} />
            <Route path="profile" element={<Profile />} />
            <Route path="team" element={<Team />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="macros" element={<Macros />} />
            <Route path="*" element={<p>Section not found.</p>} />
          </Routes>
        </section>
      </div>
    </div>
  );
}
