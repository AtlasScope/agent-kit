import Link from "next/link";

export default function NotFound() {
  return (
    <div className="center-page">
      <h1>Page not found</h1>
      <p className="muted">That link doesn&apos;t match anything in Kestrel.</p>
      <Link href="/" className="btn primary">Go to start</Link>
    </div>
  );
}
