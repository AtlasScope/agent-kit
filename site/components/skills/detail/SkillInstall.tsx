import Link from "next/link";
import { CopyButton } from "@/components/CopyButton";
import { SITE } from "@/lib/site";
import type { Skill } from "@/lib/content";
import { skillInstall } from "@/lib/content";

// Two ways in, each shown exactly as it copies. The commands come from skillInstall and SITE unchanged.
export function SkillInstall({ s }: { s: Skill }) {
  const i = skillInstall(s);
  const kitCmd = `claude plugin marketplace add ${SITE.repoSlug}\n${i.claude}`;
  return (
    <section className="sd-install" id="install" aria-labelledby="sd-install-h">
      <h2 id="sd-install-h" className="sd-install__h">Install</h2>
      <div className="block sd-cmd">
        <div className="block__head"><span className="sd-cmd__label"><b>This skill only</b><span>Any agent</span></span><CopyButton text={i.any} name={`Copy the command that installs ${s.name}`} /></div>
        <pre translate="no">{i.any}</pre>
      </div>
      <div className="block sd-cmd">
        <div className="block__head"><span className="sd-cmd__label"><b>With the rest of {s.kit}</b><span>Claude Code</span></span><CopyButton text={kitCmd} name={`Copy the Claude Code commands that install ${s.kit}`} /></div>
        <pre translate="no">{kitCmd}</pre>
      </div>
      <p className="sd-install__note">Codex and the paste-in message are on the <Link className="lic" href={`/kits/${s.kit}`}>{s.kit} page</Link>.</p>
    </section>
  );
}
