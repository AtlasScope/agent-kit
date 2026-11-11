"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Agent } from "@/lib/site";
import { AgentMark } from "./AgentMark";
import { AGENT_KEY, COPIED_KEY, FALLBACK, SHOWN, commandFor, lastAgent } from "./install-choice";

// The install page. Arriving from the homepage's Install button, the command is already on the clipboard (the button
// copied it), and a notice says so and how to paste it. Arriving any other way, Copy does the same.
type Note = { ok: boolean; n: number };

const Check = () => <svg className="i" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;
const Keys = ({ k }: { k: string[] }) => <>{k.map((x) => <kbd key={x}>{x}</kbd>)}</>;
const CopyIcon = () => <svg className="i" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></svg>;

export function InstallPage({ kits, skills, children }: { kits: number; skills: number; children: React.ReactNode }) {
  const [agent, setAgent] = useState<Agent>(SHOWN[0]);
  const [copied, setCopied] = useState(false);
  const [note, setNote] = useState<Note | null>(null);
  // The paste keys for this computer; none on a phone, where the command is for a terminal elsewhere.
  const [paste, setPaste] = useState<string[] | null>(["⌘", "V"]);

  useEffect(() => {
    if (matchMedia("(hover: none) and (pointer: coarse)").matches) setPaste(null);
    else if (!/Mac/.test(navigator.platform || navigator.userAgent)) setPaste(["Ctrl", "V"]);
    let a = lastAgent();
    try {
      const c = sessionStorage.getItem(COPIED_KEY); sessionStorage.removeItem(COPIED_KEY);
      const hit = SHOWN.find((x) => x.id === c);
      if (hit) { a = hit; setCopied(true); setNote({ ok: true, n: 1 }); }
      else if (c === "blocked") setNote({ ok: false, n: 1 });
    } catch {}
    setAgent(a);
  }, []);
  useEffect(() => { if (!note) return; const t = setTimeout(() => setNote(null), note.ok ? 8000 : 10000); return () => clearTimeout(t); }, [note]);

  const pick = (a: Agent) => { setAgent(a); setCopied(false); try { localStorage.setItem(AGENT_KEY, a.id); } catch {} };
  const focus = (a: Agent) => { pick(a); document.getElementById(`it-${a.id}`)?.focus(); };
  const copy = async () => {
    try { await navigator.clipboard.writeText(commandFor(agent)); setCopied(true); setNote((x) => ({ ok: true, n: (x?.n ?? 0) + 1 })); }
    catch { setCopied(false); setNote((x) => ({ ok: false, n: (x?.n ?? 0) + 1 })); }
  };
  const many = agent.steps.length > 1;

  return (
    <main className="inst">
      <div className="inst__in">
        <h1>Install Agent Kit</h1>
        <p className="inst__lede">{kits} kits and {skills} skills, installed with one paste into your terminal.</p>

        <div className="inst__tabs" role="tablist" aria-label="Your agent"
          onKeyDown={(e) => {
            const i = SHOWN.findIndex((a) => a.id === agent.id);
            const to = e.key === "ArrowRight" ? (i + 1) % SHOWN.length : e.key === "ArrowLeft" ? (i + SHOWN.length - 1) % SHOWN.length : e.key === "Home" ? 0 : e.key === "End" ? SHOWN.length - 1 : -1;
            if (to < 0) return;
            e.preventDefault(); focus(SHOWN[to]);
          }}>
          {SHOWN.map((a) => (
            <button key={a.id} type="button" role="tab" id={`it-${a.id}`} aria-selected={a.id === agent.id} aria-controls="inst-cmd" tabIndex={a.id === agent.id ? 0 : -1} onClick={() => pick(a)}>
              <AgentMark id={a.id} /><span>{a.label}</span>
            </button>
          ))}
        </div>

        <div className={`inst__term${copied ? " is-copied" : ""}`} id="inst-cmd" role="tabpanel" aria-labelledby={`it-${agent.id}`}>
          <div className="inst__bar">
            <span>{copied ? "On your clipboard" : "Terminal"}</span>
            <button type="button" className="inst__copy" onClick={copy} aria-label={copied ? "Copied. Copy again" : `Copy ${many ? "all lines" : "the command"}`}>
              {copied ? <><Check />Copied</> : <><CopyIcon />{many ? "Copy all" : "Copy"}</>}
            </button>
          </div>
          <pre translate="no"><code>{agent.steps.map((s) => <span key={s} className="inst__line">{s}</span>)}</code></pre>
        </div>

        <p className="inst__tested">
          {agent.tested ? `${agent.testedScope ?? "Tested"} with ${agent.tested}.` : <>Not tested with {agent.label} yet. <button type="button" onClick={() => focus(FALLBACK)}>The {FALLBACK.label} command is tested</button>.</>}
        </p>

        <ol className="inst__next">
          <li><span>1</span><p>Paste {many ? "the lines" : "it"} into a terminal{paste && <> with <Keys k={paste} /></>} and press Return.</p></li>
          <li><span>2</span><p>{agent.check.replace(/^Copies/, "It copies")}</p></li>
        </ol>

        <nav className="inst__more" aria-label="After installing">
          <Link href="/start">New to coding agents? Start here</Link>
          <Link href="/kits">What each kit adds</Link>
          <Link href="/prompts">Prompts</Link>
          <Link href="/skills">Skills</Link>
        </nav>
        <p className="inst__by">{children}</p>
      </div>

      <div className="inst__toast" role="status" aria-live="polite">
        {note && (note.ok
          ? <div className="inst__note" key={note.n}><Check /><p><b>Install command copied.</b> {paste ? <>Paste it in your terminal with <Keys k={paste} />.</> : <>Paste it in a terminal on your computer.</>}</p></div>
          : <div className="inst__note is-warn" key={note.n}><p><b>Your browser blocked copying.</b> Use Copy, or select the command.</p></div>)}
      </div>
    </main>
  );
}
