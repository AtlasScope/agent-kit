'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { projectTabs } from '~/lib/nav';
import { projectTabUrl } from '~/lib/urls';

export default function ProjectTabs({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Project" className="tabs">
      {projectTabs.map((tab) => {
        const href = projectTabUrl(projectId, tab.key);
        return (
          <Link key={tab.key} href={href} replace className={pathname === href ? 'active' : ''}>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
