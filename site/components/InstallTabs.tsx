"use client";
import { useEffect, useState } from "react";
import { AGENTS } from "@/lib/site";
import { CopyButton } from "./CopyButton";

const KEY = "agent-kit:agent";

export function InstallTabs({ children, note, className = "" }: { children?: React.ReactNode; note?: string; className?: string }) {
  const [cur, setCur] = useState(AGENTS[0].id);
  useEffect(() => {
    try { const last = localStorage.getItem(KEY)?.replace(/^t-/, ""); if (last && AGENTS.some((a) => a.id === last)) setCur(last); } catch {}
  }, []);
  const agent = AGENTS.find((a) => a.id === cur)!;
  return (
    <div className={`install ${className}`}>
      <div className="tabs" role="tablist" aria-label="Your agent">
        {AGENTS.map((a) => (
          <button key={a.id} type="button" role="tab" id={`t-${a.id}`} aria-selected={a.id === cur}
            onClick={(e) => { setCur(a.id); e.currentTarget.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" }); try { localStorage.setItem(KEY, a.id); } catch {} }}>
            {a.label}
          </button>
        ))}
      </div>
      <div className="actions">
        <span className="cmd" role="tabpanel" aria-labelledby={`t-${cur}`}><code>{agent.cmd}</code><CopyButton key={agent.id} text={agent.steps.join("\n")} label={agent.steps.length > 1 ? `Copy ${agent.steps.length} steps` : "Copy"} /></span>
        {children}
      </div>
      <div className="also" aria-live="polite">
        {agent.steps.slice(1).map((s) => <p key={s}>Then <code>{s}</code></p>)}
        <p>{agent.check} {agent.tested ? <>Tested with {agent.tested}.</> : <>Not tested yet.</>}</p>
        <p>{note ?? <>Other agents that read Agent Skills, such as Windsurf, OpenCode, Cline and Amp, can load the files through <code>npx skills</code>. We have not tested them.</>}</p>
      </div>
    </div>
  );
}
