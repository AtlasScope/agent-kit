'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { workspaces } from '~/lib/data';

export default function WorkspaceSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const current = params.get('ws') ?? workspaces[0].id;

  function choose(id: string) {
    const next = new URLSearchParams(params.toString());
    next.set('ws', id);
    router.replace(`${pathname}?${next.toString()}`);
  }

  return (
    <label className="switcher">
      <span className="muted">Workspace</span>
      <select value={current} onChange={(e) => choose(e.target.value)}>
        {workspaces.map((w) => (
          <option key={w.id} value={w.id}>
            {w.name}
          </option>
        ))}
      </select>
    </label>
  );
}
