import { Suspense } from 'react';
import TaskFilters from '~/components/TaskFilters';
import { tasksFor } from '~/lib/data';

export default async function ProjectTasks({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  return (
    <Suspense fallback={<p className="muted">Loading tasks</p>}>
      <TaskFilters tasks={tasksFor(projectId)} />
    </Suspense>
  );
}
