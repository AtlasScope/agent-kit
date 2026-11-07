import { notFound } from 'next/navigation';
import TaskList from '~/components/TaskList';
import { getProject, tasksFor } from '~/lib/data';

export default async function ProjectOverview({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const project = getProject(projectId);
  if (!project) notFound();
  return (
    <>
      <p>{project.summary}</p>
      <h2>Open work</h2>
      <TaskList tasks={tasksFor(project.id).filter((t) => t.status !== 'done')} />
    </>
  );
}
