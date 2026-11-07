import { savedReplies } from '@/data/seed';
import Breadcrumbs from '@/components/Breadcrumbs';

export default function SavedReplies() {
  return (
    <div>
      <Breadcrumbs crumbs={[{ label: 'Knowledge', to: '/knowledge' }, { label: 'Saved replies' }]} />
      <h1>Saved replies</h1>
      <ul className="plain">
        {savedReplies.map((r) => (
          <li key={r.id}>
            <strong>{r.title}</strong>
            <p className="muted">{r.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
