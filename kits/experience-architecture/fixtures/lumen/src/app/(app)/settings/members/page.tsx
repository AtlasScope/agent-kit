import { people } from '~/lib/data';

export default function MembersSettings() {
  return (
    <>
      <h2>Members and roles</h2>
      <ul className="list">
        {people.map((p) => (
          <li key={p.id}>
            {p.name} <span className="pill">{p.role}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
