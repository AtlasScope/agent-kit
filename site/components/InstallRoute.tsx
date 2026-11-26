import { InstallPage } from "./InstallPage";
import { KITS, KIT_GUIDE, SITE } from "@/lib/site";
import { counts, authors, kits, fixes } from "@/lib/content";
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
  // The explore drawer: each part of the site in one line, with real counts.
  const places: Place[] = [
    { href: "/prompts", title: "Prompts", line: `${counts.prompts} prompts, commands and recipes to paste into your agent` },
    { href: "/skills", title: "Skills", line: `${counts.skills} skills your agent picks up on its own once installed` },
    { href: "/kits", title: "Kits", line: `${KITS.length} kits: what each one does and how to start it` },
    { href: "/fix", title: "Fix a problem", line: `${fixes.length} common problems, each with the prompts that help` },
    { href: "/start", title: "New to coding agents?", line: "An eight-step guide, from opening an agent to a first result" },
  ];
  return (
    <InstallPage places={places} kits={KITS.length} skills={counts.skills} kitLines={kitLines} account={account}>
      {counts.borrowed} of the {counts.skills} skills come from other authors:{" "}
      {a.map((x, n) => <span key={x.author}><a href={x.url}>{x.author}</a>{n < a.length - 1 ? ", " : ". "}</span>)}
      <a href={`${SITE.repo}/blob/main/CREDITS.md`}>Credits and licenses</a>
    </InstallPage>
  );
}
