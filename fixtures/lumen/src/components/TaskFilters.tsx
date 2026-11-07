'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { ME, type Task } from '~/lib/data';
import { viewState } from '~/lib/view-state';
import TaskList from './TaskList';

type StatusFilter = 'all' | Task['status'];

export default function TaskFilters({ tasks }: { tasks: Task[] }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const mine = params.get('assignee') === 'me';
  const [status, setStatus] = useState<StatusFilter>('all');
  const [query, setQuery] = useState(viewState.taskQuery);

  const visible = tasks
    .filter((t) => status === 'all' || t.status === status)
    .filter((t) => !mine || t.assigneeId === ME)
    .filter((t) => t.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <section>
      <div className="toolbar">
        <input
          type="search"
          placeholder="Search tasks"
          value={query}
          onChange={(e) => {
            viewState.taskQuery = e.target.value;
            setQuery(e.target.value);
          }}
        />
        {(['all', 'todo', 'doing', 'done'] as const).map((s) => (
          <button key={s} type="button" className={status === s ? 'active' : ''} onClick={() => setStatus(s)}>
            {s}
          </button>
        ))}
        <Link href={mine ? pathname : `${pathname}?assignee=me`}>{mine ? 'Show everyone' : 'Only mine'}</Link>
      </div>
      <TaskList tasks={visible} />
    </section>
  );
}
