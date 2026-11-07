import { customers } from '@/lib/data';

export default async function CustomerNotesPage({ params }) {
  const { id } = await params;
  const customer = customers.find((c) => c.id === id);
  return (
    <>
      <h1>Notes for {customer?.name}</h1>
      <p>No notes yet.</p>
    </>
  );
}
