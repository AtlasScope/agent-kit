export type NavItem = { key: string; label: string; href: string };

export const primaryNav: NavItem[] = [
  { key: 'home', label: 'Home', href: '/dashboard' },
  { key: 'projects', label: 'Projects', href: '/projects' },
  { key: 'my-tasks', label: 'My tasks', href: '/my-tasks' },
  { key: 'people', label: 'People', href: '/people' },
  { key: 'docs', label: 'Docs', href: '/docs' },
  { key: 'settings', label: 'Settings', href: '/settings' },
];

export const projectTabs = [
  { key: 'overview', label: 'Overview' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'docs', label: 'Docs' },
  { key: 'team', label: 'Team' },
  { key: 'timeline', label: 'Timeline' },
] as const;

export type ProjectTabKey = (typeof projectTabs)[number]['key'];

export const settingsNav: NavItem[] = [
  { key: 'profile', label: 'Profile', href: '/settings' },
  { key: 'workspace', label: 'Workspace', href: '/settings/workspace' },
  { key: 'members', label: 'Members', href: '/settings/members' },
];
