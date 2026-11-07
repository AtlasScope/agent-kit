import Link from 'next/link';
import { Suspense } from 'react';
import InviteModal from '~/components/InviteModal';
import { getPerson, people } from '~/lib/data';

export default async function PeoplePage({ searchParams }: { searchParams: Promise<{ person?: string }> }) {
  const focus = (await searchParams).person;
  const focused = focus ? getPerson(focus) : undefined;
  return (
    <>
      <h1>People</h1>
      <Suspense fallback={null}>
        <InviteModal />
      </Suspense>
      {focused && (
        <p>
          Showing <strong>{focused.name}</strong>, {focused.role}
        </p>
      )}
      <ul className="list">
        {people.map((p) => (
          <li key={p.id}>
            <Link href={`/people/${p.id}`}>{p.name}</Link>
            <span className="pill">{p.role}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
