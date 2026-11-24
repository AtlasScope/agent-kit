import Link from "next/link";
import { SITE } from "@/lib/site";
import { skillInstall, type Skill } from "@/lib/content";
import { InstallPanel } from "./InstallPanel";

// Two ways in, each shown exactly as it copies. The commands come from skillInstall and SITE unchanged.
export function SkillInstall({ s }: { s: Skill }) {
  const i = skillInstall(s);
  return (
    <InstallPanel id="install" title="Install" options={[
      { id: "skill", label: "This skill", text: i.any, copyName: `Copy the command that installs ${s.name}`,
        note: "Any agent. Installs this skill alone." },
      { id: "kit", label: "Whole kit", text: `claude plugin marketplace add ${SITE.repoSlug}\n${i.claude}`, copyName: `Copy the Claude Code commands that install ${s.kit}`,
        note: <>Claude Code, with the rest of {s.kit}. Codex and the paste-in message are on the <Link className="lic" href={`/kits/${s.kit}`}>{s.kit} page</Link>.</> },
    ]} />
  );
}
