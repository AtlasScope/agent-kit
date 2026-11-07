export interface NavItem {
  label: string;
  to: string;
}

export const primaryNav: NavItem[] = [
  { label: 'Dashboard', to: '/' },
  { label: 'Tickets', to: '/tickets' },
  { label: 'Customers', to: '/customers' },
  { label: 'Knowledge', to: '/knowledge' },
  { label: 'Reports', to: '/reports' },
];

export const sidebarNav: NavItem[] = [
  { label: 'Home', to: '/home' },
  { label: 'Inbox', to: '/inbox' },
  { label: 'Tickets', to: '/tickets' },
  { label: 'Customers', to: '/customers' },
  { label: 'Knowledge', to: '/knowledge' },
  { label: 'Reports', to: '/reports' },
  { label: 'Settings', to: '/settings' },
];

export const mobileNav: NavItem[] = [
  { label: 'Dashboard', to: '/' },
  { label: 'Tickets', to: '/tickets' },
  { label: 'Customers', to: '/customers' },
];

export const settingsNav: NavItem[] = [
  { label: 'Profile', to: '/settings/profile' },
  { label: 'Team', to: '/settings/team' },
  { label: 'Notifications', to: '/settings/notifications' },
  { label: 'Macros', to: '/settings/macros' },
];
