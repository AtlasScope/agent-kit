import { InstallPage } from "./InstallPage";
import { KITS, KIT_GUIDE, SITE } from "@/lib/site";
import { counts, authors, kits } from "@/lib/content";
import type { Place } from "./InstallPaths";

export function InstallRoute({ account }: { account: boolean }) {
  const a = authors();
  // What gets installed, kit by kit, in catalog order: the homepage's line for each kit and what to type to start it.
  // A kit missing from the content build or KIT_GUIDE fails the build rather than showing "0 skills".
  const kitLines = KITS.map((name) => {
    const k = kits.find((x) => x.name === name), g = KIT_GUIDE[name];
    if (!k || !g) throw new Error(`Install page: kit ${name} is missing from ${k ? "KIT_GUIDE" : "content/generated.json"}`);
    return { name, line: g.line, type: g.type, skills: k.skills.length };
  });
  // The explore drawer: each part of the site.
  const places: Place[] = [
    { href: "/prompts", icon: "prompts", title: "Prompts" },
    { href: "/skills", icon: "skills", title: "Skills" },
    { href: "/kits", icon: "kits", title: "Kits" },
    { href: "/fix", icon: "fix", title: "Fix a problem" },
    { href: "/start", icon: "start", title: "New to coding agents?" },
  ];
  return (
    <InstallPage places={places} kits={KITS.length} skills={counts.skills} kitLines={kitLines} account={account}>
      {counts.borrowed} of the {counts.skills} skills come from other authors:{" "}
      {a.map((x, n) => <span key={x.author}><a href={x.url}>{x.author}</a>{n < a.length - 1 ? ", " : ". "}</span>)}
      <a href={`${SITE.repo}/blob/main/CREDITS.md`}>Credits and licenses</a>
    </InstallPage>
  );
}
