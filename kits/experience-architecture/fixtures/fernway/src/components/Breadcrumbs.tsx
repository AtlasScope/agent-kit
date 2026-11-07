import { Link } from 'react-router-dom';

export interface Crumb {
  label: string;
  to?: string;
}

export default function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="crumbs">
      {crumbs.map((c, i) => (
        <span key={c.label + i}>
          {c.to ? <Link to={c.to}>{c.label}</Link> : <span aria-current="page">{c.label}</span>}
          {i < crumbs.length - 1 && <span className="sep"> / </span>}
        </span>
      ))}
    </nav>
  );
}
