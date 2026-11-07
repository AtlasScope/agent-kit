import Link from 'next/link';
import { getWorkspaceId, projects, tasks } from '~/lib/data';
import { projectUrl, taskUrl } from '~/lib/urls';

export default async function HomePage({ searchParams }: { searchParams: Promise<{ ws?: string }> }) {
  const ws = getWorkspaceId((await searchParams).ws);
  const mine = projects.filter((p) => p.workspace === ws);
  const recent = tasks.filter((t) => mine.some((p) => p.id === t.projectId)).slice(0, 4);
  return (
    <>
      <h1>Home</h1>
      <h2>Your projects</h2>
      <ul className="cards">
        {mine.map((p) => (
          <li key={p.id}>
            <Link href={projectUrl(p.id)}>{p.name}</Link>
            <p className="muted">{p.summary}</p>
          </li>
        ))}
      </ul>
      <h2>Recent tasks</h2>
      <ul className="list">
        {recent.map((t) => (
          <li key={t.id}>
            <Link href={taskUrl(t.projectId, t.id)}>{t.title}</Link>
          </li>
        ))}
      </ul>
    </>
  );
}
