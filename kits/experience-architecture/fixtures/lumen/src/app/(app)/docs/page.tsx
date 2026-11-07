import Link from 'next/link';
import { docs } from '~/lib/data';
import { docUrl } from '~/lib/urls';

export default function DocsIndex() {
  return (
    <>
      <h1>Docs</h1>
      <p>
        <Link href="/docs/import">Import data</Link>
      </p>
      <ul className="list">
        {docs.map((d) => (
          <li key={d.slug.join('/')}>
            <Link href={docUrl(d.slug)}>{d.title}</Link>
          </li>
        ))}
      </ul>
    </>
  );
}
