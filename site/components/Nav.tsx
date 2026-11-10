import Link from "next/link";
import { SITE, authEnabled } from "@/lib/site";
import { AtlasScopeLogo } from "./AtlasScopeLogo";
import { AuthNav } from "./AuthNav";
import { NavLinks } from "./NavLinks";
import { NavMenu } from "./NavMenu";
import { Search } from "./Search";

const GitHubLink = () => (
  <a className="btn btn--sm btn--ghost" href={SITE.repo} aria-label="Agent Kit on GitHub">
    <svg className="i" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.3-3.4-1.3-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.4-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-5a3.9 3.9 0 0 1 1-2.7c-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.8 1a9.6 9.6 0 0 1 5 0c1.9-1.3 2.8-1 2.8-1 .5 1.4.2 2.4.1 2.7a3.9 3.9 0 0 1 1 2.7c0 3.9-2.3 4.7-4.6 5 .4.3.7.9.7 1.9v2.8c0 .3.2.6.7.5A10 10 0 0 0 12 2z" /></svg>
    <span>GitHub</span>
  </a>
);

// One bar everywhere. From 1024px up it holds the links, search, account and GitHub; below that the links,
// account and GitHub move into the menu, and below 640px search collapses to a button.
export function Nav() {
  const end = <>{authEnabled() && <AuthNav />}<GitHubLink /></>;
  return (
    <header className="top ink">
      <div className="container nav">
        <Link className="wordmark" href="/" aria-label={`${SITE.name} ${SITE.byline}, home`}>
          <AtlasScopeLogo />
          <span className="wordmark__sep" aria-hidden="true" />
          <span className="wordmark__name">{SITE.name}</span>
        </Link>
        <NavLinks />
        <Search />
        <div className="nav__end">{end}</div>
        <NavMenu>{end}</NavMenu>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <span>{SITE.name} {SITE.byline}. Each skill keeps its author’s license.</span>
      <nav aria-label="Footer">
        <Link href="/prompts">Prompts</Link>
        <Link href="/skills">Skills</Link>
        <Link href="/kits">Kits</Link>
        <Link href="/fix">Fix a problem</Link>
        <Link href="/mcp-setup">MCP server</Link>
        <a href={`${SITE.repo}/blob/main/CREDITS.md`}>Credits</a>
        <a href="/llms.txt">llms.txt</a>
      </nav>
    </footer>
  );
}
