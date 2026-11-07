import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';

export function NotFound() {
  return (
    <>
      <PageHeader title="Page not found" />
      <p>
        Try <Link to="/intake">Intake</Link> or <Link to="/dispatch">Dispatch</Link>.
      </p>
    </>
  );
}
