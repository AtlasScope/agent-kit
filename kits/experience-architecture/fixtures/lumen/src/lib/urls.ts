import type { Person } from '~/lib/data';
import type { ProjectTabKey } from '~/lib/nav';

export const projectUrl = (id: string) => `/projects/${id}`;

export const projectTabUrl = (id: string, tab: ProjectTabKey) => {
  if (tab === 'overview') return projectUrl(id);
  if (tab === 'docs') return '/docs';
  return `${projectUrl(id)}/${tab}`;
};

export const taskUrl = (projectId: string, taskId: string) => `${projectUrl(projectId)}/tasks/${taskId}`;
export const personUrl = (p: Person) => `/people/${p.handle}`;
export const assigneeUrl = (personId: string) => `/people?person=${personId}`;
export const docUrl = (slug: string[]) => `/docs/${slug.join('/')}`;
