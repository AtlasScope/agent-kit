"use client";
import { useEffect, useState } from "react";
import { AGENTS } from "@/lib/site";
import { AgentMark } from "./AgentMark";
import { CopyButton } from "./CopyButton";

const KEY = "agent-kit:agent";
// Every agent with an install path, most used first.
const SHOWN = ["claude", "codex", "cursor", "gemini", "copilot", "any"].map((id) => AGENTS.find((a) => a.id === id)!);
const FALLBACK = AGENTS.find((a) => a.id === "any")!;

// The strip under the hero: pick your agent, copy the install commands, see what was tested and what to do next.
export function InstallRail() {
  const [cur, setCur] = useState(SHOWN[0].id);
  useEffect(() => {
    try { const last = localStorage.getItem(KEY)?.replace(/^t-/, ""); if (last && SHOWN.some((a) => a.id === last)) setCur(last); } catch {}
  }, []);
  const agent = SHOWN.find((a) => a.id === cur)!;
  const pick = (id: string) => { setCur(id); try { localStorage.setItem(KEY, id); } catch {} };
  const focus = (id: string) => { pick(id); document.getElementById(`rt-${id}`)?.focus(); };
  return (
    <div className="container rail">
      <div className="rail__install">
        <div className="rail__tabs" role="tablist" aria-label="Your agent"
          onKeyDown={(e) => {
            const i = SHOWN.findIndex((a) => a.id === cur);
            const to = e.key === "ArrowRight" ? (i + 1) % SHOWN.length : e.key === "ArrowLeft" ? (i + SHOWN.length - 1) % SHOWN.length : e.key === "Home" ? 0 : e.key === "End" ? SHOWN.length - 1 : -1;
            if (to < 0) return;
            e.preventDefault();
            focus(SHOWN[to].id);
          }}>
          {SHOWN.map((a) => (
            <button key={a.id} type="button" role="tab" id={`rt-${a.id}`} aria-selected={a.id === cur} aria-controls="rail-cmd" tabIndex={a.id === cur ? 0 : -1} onClick={() => pick(a.id)}>
              <AgentMark id={a.id} />{a.label}
            </button>
          ))}
        </div>
        <div className="rail__cmd" id="rail-cmd" role="tabpanel" aria-labelledby={`rt-${cur}`}>
          <div className="rail__steps">{agent.steps.map((s) => <code key={s}>{s.split(" ").map((w, i) => <span key={i}>{i ? " " : ""}<span className="nw">{w}</span></span>)}</code>)}</div>
          <CopyButton key={agent.id} className="rail__copy" text={agent.steps.join("\n")} label={agent.steps.length > 1 ? "Copy all" : "Copy"} />
        </div>
        <p className="rail__tested" aria-live="polite">
          {agent.tested ? `${agent.testedScope ?? "Tested"} with ${agent.tested}.` : <>Not tested with {agent.label} yet. <button type="button" onClick={() => focus(FALLBACK.id)}>The {FALLBACK.label} command is tested</button>.</>}
        </p>
      </div>
      <div className="rail__next">
        <h2>Then, in {agent.id === "any" ? "your agent" : agent.label}</h2>
        <p>Paste {agent.steps.length > 1 ? "the lines" : "the line"} into a terminal. {agent.check.replace(/^Copies/, "It copies")}</p>
      </div>
    </div>
  );
}
