import Link from "next/link";
import { AtlasScopeLogo } from "./AtlasScopeLogo";
import { SITE } from "@/lib/site";

// The site footer: the AtlasScope lockup with one line on licenses, then three short groups of links.
const GROUPS: { title: string; links: [string, string][] }[] = [
  { title: "Library", links: [["Prompts", "/prompts"], ["Skills", "/skills"], ["Kits", "/kits"], ["Fix a problem", "/fix"]] },
  { title: "Use it", links: [["Start here", "/start"], ["Connect your agent", "/mcp-setup"], ["GitHub", SITE.repo], ["llms.txt", "/llms.txt"]] },
  { title: "AtlasScope", links: [["About", "/about"], ["Credits", `${SITE.repo}/blob/main/CREDITS.md`], ["Privacy", "/privacy"], ["Terms", "/terms"]] },
];

export function Footer() {
  return (
    <footer className="foot">
      <div className="foot__brand">
        <Link className="foot__logo" href="/" aria-label="Agent Kit by AtlasScope, home"><AtlasScopeLogo /></Link>
        <p>Agent Kit is free. Its own skills are MIT licensed, and each borrowed skill keeps its author&apos;s license.</p>
      </div>
      {GROUPS.map((g) => (
        <nav key={g.title} className="foot__group" aria-label={g.title}>
          <h2>{g.title}</h2>
          <ul>
            {g.links.map(([label, href]) => (
              <li key={label}>{href.startsWith("/") && !href.endsWith(".txt") ? <Link href={href}>{label}</Link> : <a href={href}>{label}</a>}</li>
            ))}
          </ul>
        </nav>
      ))}
    </footer>
  );
}
