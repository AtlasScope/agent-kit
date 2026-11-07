import Link from "next/link";

export default function NotFound() {
  return (
    <div className="login-wrap">
      <div className="card card-pad login-card stack">
        <h1>Page not found</h1>
        <p className="muted">
          The page you asked for does not exist, or it belongs to a workspace you are not looking at right now.
        </p>
        <div className="row">
          <Link className="btn btn-primary" href="/workspaces">
            Choose a workspace
          </Link>
          <Link className="btn" href="/inbox">
            Open inbox
          </Link>
        </div>
      </div>
    </div>
  );
}
