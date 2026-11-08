import Link from "next/link";
export default function NotFound() {
  return (
    <main className="page"><div className="page-head"><h1>Not here</h1><p className="lead ink2">That page doesn’t exist. Try <Link className="lic" href="/prompts">the prompts</Link>, <Link className="lic" href="/skills">the skills</Link> or <Link className="lic" href="/fix">fix a problem</Link>.</p></div></main>
  );
}
