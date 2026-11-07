import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDoc } from '~/lib/data';
import { docUrl } from '~/lib/urls';

export default async function DocPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const doc = getDoc(slug);
  if (!doc) notFound();
  return (
    <>
      <p className="muted">
        {slug.map((part, i) => (
          <span key={part}>
            <Link href={docUrl(slug.slice(0, i + 1))}>{part}</Link>
            {i < slug.length - 1 ? ' / ' : ''}
          </span>
        ))}
      </p>
      <h1>{doc.title}</h1>
      <p>{doc.body}</p>
    </>
  );
}
