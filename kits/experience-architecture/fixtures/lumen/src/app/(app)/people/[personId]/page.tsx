import { notFound } from 'next/navigation';
import { getPerson } from '~/lib/data';

export default async function PersonPage({ params }: { params: Promise<{ personId: string }> }) {
  const person = getPerson((await params).personId);
  if (!person) notFound();
  return (
    <>
      <h1>{person.name}</h1>
      <p>{person.role}</p>
    </>
  );
}
