export type Workspace = { id: string; name: string };
export type Project = { id: string; slug: string; name: string; workspace: string; summary: string };
export type Task = { id: string; projectId: string; title: string; status: 'todo' | 'doing' | 'done'; assigneeId: string };
export type Person = { id: string; handle: string; name: string; role: string };
export type Doc = { slug: string[]; title: string; body: string };

export const ME = 'u1';

export const workspaces: Workspace[] = [
  { id: 'acme', name: 'Acme Studio' },
  { id: 'side', name: 'Side Projects' },
];

export const projects: Project[] = [
  { id: 'p1', slug: 'apollo', name: 'Apollo launch', workspace: 'acme', summary: 'Ship the public launch of the new editor.' },
  { id: 'p2', slug: 'harbor', name: 'Harbor redesign', workspace: 'acme', summary: 'Refresh the customer portal.' },
  { id: 'p3', slug: 'orchard', name: 'Orchard notes', workspace: 'side', summary: 'Personal research notes and reading list.' },
];

export const people: Person[] = [
  { id: 'u1', handle: 'maya', name: 'Maya Chen', role: 'Designer' },
  { id: 'u2', handle: 'dev', name: 'Dev Patel', role: 'Engineer' },
  { id: 'u3', handle: 'ines', name: 'Ines Moreau', role: 'Product manager' },
];

export const tasks: Task[] = [
  { id: 't1', projectId: 'p1', title: 'Draft launch announcement', status: 'doing', assigneeId: 'u1' },
  { id: 't2', projectId: 'p1', title: 'Fix editor paste handling', status: 'todo', assigneeId: 'u2' },
  { id: 't3', projectId: 'p1', title: 'Prepare press kit', status: 'done', assigneeId: 'u3' },
  { id: 't4', projectId: 'p2', title: 'Audit navigation labels', status: 'todo', assigneeId: 'u1' },
  { id: 't5', projectId: 'p2', title: 'Rebuild invoice table', status: 'doing', assigneeId: 'u2' },
  { id: 't6', projectId: 'p3', title: 'Summarize reading backlog', status: 'todo', assigneeId: 'u1' },
];

export const docs: Doc[] = [
  { slug: ['handbook'], title: 'Team handbook', body: 'How we work, meet and decide.' },
  { slug: ['handbook', 'onboarding'], title: 'Onboarding', body: 'Your first week at Acme Studio.' },
  { slug: ['specs', 'launch-plan'], title: 'Launch plan', body: 'Milestones and owners for the Apollo launch.' },
];

export const getWorkspaceId = (ws: string | string[] | undefined) => {
  const v = Array.isArray(ws) ? ws[0] : ws;
  return workspaces.some((w) => w.id === v) ? (v as string) : workspaces[0].id;
};
export const getProject = (id: string) => projects.find((p) => p.id === id);
export const getTask = (id: string) => tasks.find((t) => t.id === id);
export const getPerson = (id: string) => people.find((p) => p.id === id);
export const getDoc = (slug: string[]) => docs.find((d) => d.slug.join('/') === slug.join('/'));
export const tasksFor = (projectId: string) => tasks.filter((t) => t.projectId === projectId);
