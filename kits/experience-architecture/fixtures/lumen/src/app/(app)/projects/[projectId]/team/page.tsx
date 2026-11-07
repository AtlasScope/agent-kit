import Link from 'next/link';
import { people } from '~/lib/data';
import { personUrl } from '~/lib/urls';

export default function ProjectTeam() {
  return (
    <>
      <h2>Team</h2>
      <ul className="list">
        {people.map((p) => (
          <li key={p.id}>
            <Link href={personUrl(p)}>{p.name}</Link>
            <span className="pill">{p.role}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
