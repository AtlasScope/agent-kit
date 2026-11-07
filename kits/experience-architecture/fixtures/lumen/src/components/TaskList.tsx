import Link from 'next/link';
import { getPerson, getProject, type Task } from '~/lib/data';
import { assigneeUrl, personUrl, projectUrl, taskUrl } from '~/lib/urls';

export default function TaskList({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) return <p className="muted">No tasks.</p>;
  return (
    <ul className="list">
      {tasks.map((t) => (
        <li key={t.id}>
          <Link href={taskUrl(t.projectId, t.id)}>{t.title}</Link>
          <span className="pill">{t.status}</span>
          <Link href={assigneeUrl(t.assigneeId)} className="muted">
            {getPerson(t.assigneeId)?.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function TaskDetail({ task }: { task: Task }) {
  const person = getPerson(task.assigneeId);
  const project = getProject(task.projectId);
  return (
    <article>
      <h2>{task.title}</h2>
      <p>
        <span className="pill">{task.status}</span>
      </p>
      {person && (
        <p>
          Assigned to <Link href={personUrl(person)}>{person.name}</Link>
        </p>
      )}
      {project && (
        <p className="muted">
          In <Link href={projectUrl(project.id)}>{project.name}</Link>
        </p>
      )}
    </article>
  );
}
