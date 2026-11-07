import TaskList from '~/components/TaskList';
import { ME, tasks } from '~/lib/data';

export default function MyTasks() {
  return (
    <>
      <h1>My tasks</h1>
      <TaskList tasks={tasks.filter((t) => t.assigneeId === ME)} />
    </>
  );
}
