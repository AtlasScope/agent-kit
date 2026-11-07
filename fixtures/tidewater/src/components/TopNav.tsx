import { NavLink } from 'react-router-dom';

interface NavItem {
  to: string;
  label: string;
  system: string;
}

// One entry per upstream system or team queue. The `system` line is shown as a
// tooltip so people know which tool the screen reads from.
export const NAV_ITEMS: NavItem[] = [
  { to: '/intake', label: 'Intake', system: 'Call centre + tenant portal' },
  { to: '/dispatch', label: 'Dispatch', system: 'Work order board' },
  { to: '/dispatch/assign', label: 'Assign Vendor', system: 'Work order board' },
  { to: '/vendor-sync', label: 'Vendor Portal Sync', system: 'Vendor portal (nightly sync)' },
  { to: '/tenant-comms', label: 'Tenant Comms', system: 'SMS / email gateway' },
  { to: '/billing-export', label: 'Billing Export', system: 'AP export to accounting' },
  { to: '/approvals', label: 'Approvals', system: 'Spend approvals' },
  { to: '/overview-beta', label: 'Overview (beta)', system: 'Experimental' },
];

export function TopNav() {
  return (
    <nav className="topnav" aria-label="Main">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end
          title={item.system}
          className={({ isActive }) => (isActive ? 'topnav-link active' : 'topnav-link')}
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
