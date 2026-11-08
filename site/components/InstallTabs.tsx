"use client";
import { useEffect, useState } from "react";
import { AGENTS } from "@/lib/site";
import { CopyButton } from "./CopyButton";

const KEY = "agent-kit:agent";

export function InstallTabs({ children }: { children?: React.ReactNode }) {
  const [cur, setCur] = useState(AGENTS[0].id);
  useEffect(() => {
    try { const last = localStorage.getItem(KEY)?.replace(/^t-/, ""); if (last && AGENTS.some((a) => a.id === last)) setCur(last); } catch {}
  }, []);
  const agent = AGENTS.find((a) => a.id === cur)!;
  return (
    <div className="install">
      <div className="tabs" role="tablist" aria-label="Your agent">
        {AGENTS.map((a) => (
          <button key={a.id} type="button" role="tab" id={`t-${a.id}`} aria-selected={a.id === cur}
            onClick={() => { setCur(a.id); try { localStorage.setItem(KEY, a.id); } catch {} }}>
            {a.label}
          </button>
        ))}
      </div>
      <div className="actions">
        <span className="cmd" role="tabpanel" aria-labelledby={`t-${cur}`}><code>{agent.cmd}</code><CopyButton text={agent.cmd} /></span>
        {children}
      </div>
      <p className="also">Also Windsurf, OpenCode, Cline, Amp and 70 more agents through <code>npx skills</code>.</p>
    </div>
  );
}
