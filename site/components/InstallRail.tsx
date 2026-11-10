"use client";
import { useEffect, useState } from "react";
import { AGENTS } from "@/lib/site";
import { CopyButton } from "./CopyButton";

const KEY = "agent-kit:agent";
// The four agents named in the hero, most used first. The rest are on /start.
const SHOWN = ["claude", "codex", "cursor", "any"].map((id) => AGENTS.find((a) => a.id === id)!);

// The strip under the hero: pick your agent, copy the install command, see what was tested.
export function InstallRail({ stats }: { stats: { label: string; value: number }[] }) {
  const [cur, setCur] = useState(SHOWN[0].id);
  useEffect(() => {
    try { const last = localStorage.getItem(KEY)?.replace(/^t-/, ""); if (last && SHOWN.some((a) => a.id === last)) setCur(last); } catch {}
  }, []);
  const agent = SHOWN.find((a) => a.id === cur)!;
  const pick = (id: string) => { setCur(id); try { localStorage.setItem(KEY, id); } catch {} };
  return (
    <div className="container rail">
      <div className="rail__install">
        <div className="rail__tabs" role="tablist" aria-label="Your agent"
          onKeyDown={(e) => {
            if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
            const i = SHOWN.findIndex((a) => a.id === cur);
            const next = SHOWN[(i + (e.key === "ArrowRight" ? 1 : SHOWN.length - 1)) % SHOWN.length];
            pick(next.id);
            document.getElementById(`rt-${next.id}`)?.focus();
          }}>
          {SHOWN.map((a) => (
            <button key={a.id} type="button" role="tab" id={`rt-${a.id}`} aria-selected={a.id === cur} aria-controls="rail-cmd" tabIndex={a.id === cur ? 0 : -1} onClick={() => pick(a.id)}>
              {a.label}
            </button>
          ))}
        </div>
        <div className="rail__cmd" id="rail-cmd" role="tabpanel" aria-labelledby={`rt-${cur}`}>
          <code>{agent.cmd}</code>
          <CopyButton key={agent.id} className="rail__copy" text={agent.steps.join("\n")} label={agent.steps.length > 1 ? `Copy ${agent.steps.length} steps` : "Copy"} />
        </div>
      </div>
      <dl className="rail__stats">
        {stats.map((s) => <div key={s.label}><dt>{s.label}</dt><dd>{s.value}</dd></div>)}
      </dl>
      <p className="rail__tested" aria-live="polite">{agent.tested ? `Tested with ${agent.tested}.` : `Not tested with ${agent.label} yet.`}</p>
    </div>
  );
}
