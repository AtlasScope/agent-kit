import { projects, tasks } from '~/lib/data';

export default function InsightsPage() {
  const done = tasks.filter((t) => t.status === 'done').length;
  return (
    <>
      <h1>Insights</h1>
      <p>
        {done} of {tasks.length} tasks done across {projects.length} projects.
      </p>
    </>
  );
}
