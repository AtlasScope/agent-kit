import { InstallPage } from "./InstallPage";
import { KITS, KIT_GUIDE, SITE } from "@/lib/site";
import { counts, authors, kits, copyLabel, copyText, getPromptById } from "@/lib/content";
import { STARTS } from "@/lib/starts";
import type { Try } from "./InstallPage";

// "What do you want to do first?": four of the prompts page's best starting points, chosen because they need the
// least set-up and show the kits doing real work. Each keeps the library's own words and exact copy payload.
const TRIES: [string, string][] = [["fix-a-bug", "Fix a bug"], ["improve-a-page", "Improve a page"], ["plan-a-feature", "Plan a feature"], ["improve-copy", "Fix the wording"]];

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
  const tries: Try[] = TRIES.map(([slug, label]) => {
    const s = STARTS.find((x) => x.slug === slug), p = s && getPromptById(s.pick);
    if (!s || !p) throw new Error(`Install page: starting point ${slug} is missing`);
    return { label, job: s.job, get: s.youGet, when: s.useWhen, needs: s.requires.replace(/\.$/, ""), edits: s.changes === "yes" || s.changes === "test",
      id: p.id, title: p.t, slug: p.slug, text: copyText(p), copy: copyLabel(p) };
  });
  return (
    <InstallPage tries={tries} kits={KITS.length} skills={counts.skills} prompts={counts.prompts} kitLines={kitLines} account={account}>
      {counts.borrowed} of the {counts.skills} skills come from other authors:{" "}
      {a.map((x, n) => <span key={x.author}><a href={x.url}>{x.author}</a>{n < a.length - 1 ? ", " : ". "}</span>)}
      <a href={`${SITE.repo}/blob/main/CREDITS.md`}>Credits and licenses</a>
    </InstallPage>
  );
}
