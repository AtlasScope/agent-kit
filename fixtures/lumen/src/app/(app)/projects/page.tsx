import Link from 'next/link';
import { getWorkspaceId, projects } from '~/lib/data';
import { projectUrl } from '~/lib/urls';

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ ws?: string }> }) {
  const ws = getWorkspaceId((await searchParams).ws);
  return (
    <>
      <h1>Projects</h1>
      <ul className="cards">
        {projects
          .filter((p) => p.workspace === ws)
          .map((p) => (
            <li key={p.id}>
              <Link href={projectUrl(p.id)}>{p.name}</Link>
              <p className="muted">{p.summary}</p>
            </li>
          ))}
      </ul>
    </>
  );
}
