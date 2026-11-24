import type { Metadata, Viewport } from "next";
import { InstallPage } from "@/components/InstallPage";
import { KITS, KIT_GUIDE, SITE } from "@/lib/site";
import { counts, authors, kits } from "@/lib/content";
import "./install.css";

export const metadata: Metadata = {
  title: "Install",
  description: `Install Agent Kit in Claude Code, Codex, Cursor or any coding agent: ${KITS.length} kits and ${counts.skills} skills, with one message you paste into your agent.`,
  alternates: { canonical: "/install" },
};

// Always dark, so the browser's own bar matches it in both themes.
export const viewport: Viewport = { themeColor: "#020302", colorScheme: "dark" };

export default function Install() {
  const a = authors();
  // What gets installed, kit by kit, in catalog order: the homepage's line for each kit and what to type to start it.
  const kitLines = KITS.map((name) => {
    const k = kits.find((x) => x.name === name);
    return { name, line: KIT_GUIDE[name]?.line ?? "", type: KIT_GUIDE[name]?.type ?? [], skills: k?.skills.length ?? 0 };
  });
  return (
    <InstallPage kits={KITS.length} skills={counts.skills} kitLines={kitLines}>
      {counts.borrowed} of the {counts.skills} skills come from other authors:{" "}
      {a.map((x, n) => <span key={x.author}><a href={x.url}>{x.author}</a>{n < a.length - 1 ? ", " : ". "}</span>)}
      <a href={`${SITE.repo}/blob/main/CREDITS.md`}>Credits and licenses</a>
    </InstallPage>
  );
}
