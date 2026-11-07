import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import ProjectTabs from '~/components/ProjectTabs';
import { getProject } from '~/lib/data';

export default async function ProjectLayout({
  children,
  modal,
  params,
}: {
  children: ReactNode;
  modal: ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = getProject(projectId);
  if (!project) notFound();
  return (
    <>
      <h1>{project.name}</h1>
      <ProjectTabs projectId={project.id} />
      {children}
      {modal}
    </>
  );
}
