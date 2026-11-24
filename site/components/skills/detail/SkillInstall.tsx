import Link from "next/link";
import { SITE } from "@/lib/site";
import { skillInstall, type Skill } from "@/lib/content";
import { InstallPanel } from "./InstallPanel";
import { commandFor } from "@/lib/skill-command";

// Two ways in, each shown exactly as it copies. The commands come from skillInstall and SITE unchanged.
// Each way says how the skill starts in the agent it installs into: /name in Claude Code, $name in Codex.
export function SkillInstall({ s }: { s: Skill }) {
  const i = skillInstall(s);
  // Installed alone, a skill is a plain skill (/name); installed with its kit, it takes the kit's command form.
  const cc = <code translate="no">/{s.name}</code>, cx = <code translate="no">${s.name}</code>;
  const kitCc = <code translate="no">{commandFor(s.kit, s.name)}</code>;
  return (
    <InstallPanel id="install" title="Install" options={[
      { id: "skill", label: "This skill", text: i.any, copyName: `Copy the command that installs ${s.name}`,
        note: s.typedOnly
          ? <>Any agent. Installs this skill alone. To run it, type {cc} in Claude Code or {cx} in Codex.</>
          : <>Any agent. Installs this skill alone. It starts automatically, or type {cc} in Claude Code or {cx} in Codex.</> },
      { id: "kit", label: "Whole kit", text: `claude plugin marketplace add ${SITE.repoSlug}\n${i.claude}`, copyName: `Copy the Claude Code commands that install ${s.kit}`,
        note: <>Claude Code, with the rest of {s.kit}. {s.typedOnly ? <>Then type {kitCc} to run it.</> : <>It starts automatically, or type {kitCc}.</>} Codex and the paste-in message are on the <Link className="lic" href={`/kits/${s.kit}`}>{s.kit} page</Link>.</> },
    ]} />
  );
}
