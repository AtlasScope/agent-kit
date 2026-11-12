"use client";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Agent } from "@/lib/site";
import { AgentMark } from "./AgentMark";
import { AGENT_KEY, FALLBACK, OS_SCRIPT, SHOWN, commandFor, lastAgent, markOS, readHandoff } from "./install-choice";

// The install page. Arriving from the homepage's Install button, the command is already on the clipboard (the button
// copied it), and a notice says so and how to paste it. Arriving any other way, Copy does the same.
//
// Nothing jumps after load: an inline script marks the saved agent (data-agent) and the computer (html[data-os])
// before paint, every agent's command, test note and next step are in the page, and CSS shows the marked one. React
// then takes over the same values. On a phone the paste keys are hidden, since the command is for a computer.
const AGENT_SCRIPT = `try{var a=(localStorage.getItem("${AGENT_KEY}")||"").replace(/^t-/,"");if(/^(${SHOWN.map((a) => a.id).join("|")})$/.test(a))document.currentScript.parentElement.setAttribute("data-agent",a)}catch(e){}`;
// How long a "copied" state and its notice last. The CSS fade-out reads the same value.
const NOTE_MS = 6000;
type Note = { kind: "copied" | "blocked" | "failed"; n: number };

const Check = () => <svg className="i" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;
const CopyIcon = () => <svg className="i" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></svg>;
// The paste keys for each kind of computer; html[data-os] decides which shows. Linux terminals paste with Ctrl Shift V.
const Keys = () => (
  <span className="inst__keys"> with{" "}
    <span data-os="mac"><kbd>⌘</kbd><kbd>V</kbd></span>
    <span data-os="linux"><kbd>Ctrl</kbd><kbd>Shift</kbd><kbd>V</kbd></span>
    <span data-os="other"><kbd>Ctrl</kbd><kbd>V</kbd></span>
  </span>
);
const tested = (a: Agent) => a.tested ? `${a.testedScope ?? "Tested"} with ${a.tested}.` : `Not tested with ${a.label} yet.`;

export function InstallPage({ kits, skills, children }: { kits: number; skills: number; children: React.ReactNode }) {
  const [agent, setAgent] = useState<Agent>(SHOWN[0]);
  const [copied, setCopied] = useState(false);
  // Set by the first agent the visitor picks, so the command fades in on a pick and never on load.
  const [picked, setPicked] = useState(false);
  const [note, setNote] = useState<Note | null>(null);
  const [said, setSaid] = useState("");
  const h1 = useRef<HTMLHeadingElement>(null);

  // Before paint: the saved agent, and what the homepage's Install button did.
  useLayoutEffect(() => {
    if (!document.documentElement.hasAttribute("data-os")) markOS();
    const h = readHandoff(), hit = h && "agent" in h ? SHOWN.find((x) => x.id === h.agent) : undefined;
    setAgent(hit ?? lastAgent());
    if (!h) return;
    if (hit) setCopied(true);
    h1.current?.focus({ preventScroll: true });
    // The notice waits a moment, so a screen reader reads it after the new page's title, not over it.
    const t = setTimeout(() => setNote({ kind: hit ? "copied" : "blocked", n: 1 }), 600);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => { if (!copied) return; const t = setTimeout(() => setCopied(false), NOTE_MS); return () => clearTimeout(t); }, [copied]);
  useEffect(() => { if (!note) return; const t = setTimeout(() => setNote(null), NOTE_MS); return () => clearTimeout(t); }, [note]);

  const pick = (a: Agent) => {
    setPicked(true);
    setAgent(a); setCopied(false); setSaid(`${a.label}. ${tested(a)}`);
    try { localStorage.setItem(AGENT_KEY, a.id); } catch {}
  };
  const focus = (a: Agent) => { pick(a); document.getElementById(`it-${a.id}`)?.focus(); };
  const show = (kind: Note["kind"]) => setNote((x) => ({ kind, n: (x?.n ?? 0) + 1 }));
  const copy = async () => {
    try { await navigator.clipboard.writeText(commandFor(agent)); setCopied(true); show("copied"); }
    catch { setCopied(false); show("failed"); }
  };
  const many = agent.steps.length > 1;

  return (
    <main className="quiet inst" data-agent={agent.id} data-picked={picked || undefined} suppressHydrationWarning style={{ "--note": `${NOTE_MS}ms` } as React.CSSProperties}>
      <script dangerouslySetInnerHTML={{ __html: AGENT_SCRIPT + OS_SCRIPT }} />
      <div className="inst__in">
        <h1 ref={h1} tabIndex={-1}>Install Agent Kit</h1>
        <p className="inst__lede">{kits} kits and {skills} skills, installed with one paste into your terminal.</p>
        <p className="inst__phone">On a phone? Open this page on your computer, where your terminal is.</p>

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
          <pre translate="no">{SHOWN.map((a) => (
            <code key={a.id} data-a={a.id}>{a.steps.map((s) => <span key={s} className="inst__line">{s}</span>)}</code>
          ))}</pre>
        </div>

        <div className="inst__tested">
          {SHOWN.map((a) => (
            <p key={a.id} data-a={a.id}>{tested(a)}{!a.tested && <> <button type="button" onClick={() => focus(FALLBACK)}>The {FALLBACK.label} command is tested</button>.</>}</p>
          ))}
        </div>

        <div className="inst__next">
          {SHOWN.map((a) => (
            <ol key={a.id} data-a={a.id}>
              <li><span>1</span><p>Paste {a.steps.length > 1 ? "the lines" : "it"} into a terminal<Keys /> and press Return.</p></li>
              <li><span>2</span><p>{a.check.replace(/^Copies/, "It copies")}</p></li>
            </ol>
          ))}
        </div>

        <nav className="inst__more" aria-label="After installing">
          <Link href="/start">New to coding agents? Start here</Link>
          <Link href="/kits">What each kit adds</Link>
          <Link href="/prompts">Prompts</Link>
          <Link href="/skills">Skills</Link>
        </nav>
        <p className="inst__by">{children}</p>
      </div>

      <p className="inst__said" aria-live="polite">{said}</p>
      <div className="inst__toast" role="status">
        {note && (
          <div className={`inst__note${note.kind === "copied" ? "" : " is-warn"}`} key={note.n}>
            {note.kind === "copied" && <Check />}
            <p>{note.kind === "copied" ? <><b>Install command copied.</b> Paste it in a terminal<Keys />.</>
              : note.kind === "blocked" ? <><b>Your browser blocked copying.</b> Press Copy, or select the command.</>
              : <><b>Copying was blocked.</b> Select the command and copy it yourself.</>}</p>
          </div>
        )}
      </div>
    </main>
  );
}
