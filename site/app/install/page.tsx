import type { Metadata } from "next";
import { InstallPage } from "@/components/InstallPage";
import { KITS, SITE } from "@/lib/site";
import { counts, authors } from "@/lib/content";
import "./install.css";

export const metadata: Metadata = {
  title: "Install",
  description: `Install Agent Kit in Claude Code, Codex, Cursor, Gemini CLI or GitHub Copilot: ${KITS.length} kits and ${counts.skills} skills, one command per agent.`,
  alternates: { canonical: "/install" },
};

export default function Install() {
  const a = authors();
  return (
    <InstallPage kits={KITS.length} skills={counts.skills}>
      {counts.borrowed} of the {counts.skills} skills come from other authors:{" "}
      {a.map((x, n) => <span key={x.author}><a href={x.url}>{x.author}</a>{n < a.length - 1 ? ", " : ". "}</span>)}
      <a href={`${SITE.repo}/blob/main/CREDITS.md`}>Credits and licenses</a>
    </InstallPage>
  );
}
