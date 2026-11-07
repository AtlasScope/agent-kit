import { notFound } from 'next/navigation';
import { BackButton } from '~/components/Modal';
import { TaskDetail } from '~/components/TaskList';
import { getTask } from '~/lib/data';

export default async function TaskPage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  const task = getTask(taskId);
  if (!task) notFound();
  return (
    <>
      <BackButton label="Close" />
      <TaskDetail task={task} />
    </>
  );
}
