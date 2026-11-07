import { notFound } from 'next/navigation';
import Modal from '~/components/Modal';
import { TaskDetail } from '~/components/TaskList';
import { getTask } from '~/lib/data';

export default async function TaskModal({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  const task = getTask(taskId);
  if (!task) notFound();
  return (
    <Modal>
      <TaskDetail task={task} />
    </Modal>
  );
}
