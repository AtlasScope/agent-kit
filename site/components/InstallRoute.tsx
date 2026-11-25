import { InstallPage } from "./InstallPage";
import { KITS, KIT_GUIDE, SITE } from "@/lib/site";
import { counts, authors, kits, listed } from "@/lib/content";

// Prompts the account offer shows in its small Starred list, as an example of what a star keeps. Real library
// prompts, looked up by id, so a renamed title follows; a removed one drops out of the example.
const PICKS = ["RC11", "S06", "MO06"];

// The install page's content: /install renders it, and so does the sample-data preview at /account/fixture/install,
// which forces the account offer on so it can be seen and tested without Clerk.
export function InstallRoute({ account }: { account: boolean }) {
  const a = authors();
  // What gets installed, kit by kit, in catalog order: the homepage's line for each kit and what to type to start it.
  // A kit missing from the content build or KIT_GUIDE fails the build rather than showing "0 skills".
  const kitLines = KITS.map((name) => {
    const k = kits.find((x) => x.name === name), g = KIT_GUIDE[name];
    if (!k || !g) throw new Error(`Install page: kit ${name} is missing from ${k ? "KIT_GUIDE" : "content/generated.json"}`);
    return { name, line: g.line, type: g.type, skills: k.skills.length };
  });
  const picks = PICKS.map((id) => listed.find((p) => p.id === id)?.t).filter((t): t is string => Boolean(t));
  return (
    <InstallPage kits={KITS.length} skills={counts.skills} prompts={counts.prompts} picks={picks} kitLines={kitLines} account={account}>
      {counts.borrowed} of the {counts.skills} skills come from other authors:{" "}
      {a.map((x, n) => <span key={x.author}><a href={x.url}>{x.author}</a>{n < a.length - 1 ? ", " : ". "}</span>)}
      <a href={`${SITE.repo}/blob/main/CREDITS.md`}>Credits and licenses</a>
    </InstallPage>
  );
}
