"use client";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { INSTALL_MESSAGE, type Agent } from "@/lib/site";
import { signInHref } from "./AuthNav";
import { AgentMark } from "./AgentMark";
import { HANDOFF_EVENT } from "./stage/HomeHero";
import { AGENT_KEY, COPIED_KEY, FALLBACK, FRESH_MS, OPEN_URL, OS_SCRIPT, SHOWN, commandFor, lastAgent, markOS, readHandoff } from "./install-choice";

// The install page. One message to paste into any agent's chat (INSTALL_MESSAGE) is the centrepiece: the agent reads
// the steps for itself, so nobody picks a tool or opens a terminal. The message itself is never on show: the panel
// says Copied and offers to open an agent and, to a visitor with no account, one soft offer to make one. Only when
// the browser blocks copying does the message appear, selected, to copy by hand. Under the panel one status line says
// what actually happened (copied, or blocked). Everything else waits behind two closed
// rows: the per-agent commands ("Or run it yourself") and what gets installed, kit by kit.
//
// It shares the homepage's view from orbit (components/stage/Stage.tsx), seen from further away, and that stage plays
// the arrival from the homepage's Install button. By then the message is on the clipboard (readHandoff,
// install-choice.ts): Copy shows Copied at once and the status line says so a moment later, after a screen reader
// has read the new page's title. The clipboard's answer can land after this page is up, so the page also listens for
// it (HANDOFF_EVENT). data-arrived marks such a visit.
//
// Nothing jumps after load: an inline script marks the saved agent (data-agent) and the computer (html[data-os])
// before paint, every agent's command, test note and next step are in the page, and CSS shows the marked one.
// It also marks a full page load (data-load): only then does it run, since React doesn't run inline scripts it inserts on
// an in-site navigation. The homepage arrival's settle plays only without it, so a reload never blanks the column.
const AGENT_SCRIPT = `document.currentScript.parentElement.setAttribute("data-load","");try{var h=JSON.parse(sessionStorage.getItem("${COPIED_KEY}")||"null");if(h&&h.message&&Date.now()-h.at<${FRESH_MS})document.currentScript.parentElement.setAttribute("data-got","")}catch(e){}try{var a=(localStorage.getItem("${AGENT_KEY}")||"").replace(/^t-/,"");if(/^(${SHOWN.map((a) => a.id).join("|")})$/.test(a))document.currentScript.parentElement.setAttribute("data-agent",a)}catch(e){}`;
// How long a "copied" note lasts. After that the page stops claiming anything about the clipboard.
const NOTE_MS = 6000;
// How long the panel keeps saying Copied: long enough to switch to an agent and back, short enough that a tab left open
// does not claim a clipboard it may no longer hold.
const COPIED_MS = 120_000;
type Note = { kind: "message" | "copied" | "blocked" | "failed"; n: number };
export type KitLine = { name: string; line: string; type: string[]; skills: number };

const Check = () => <svg className="i" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;
const CopyIcon = () => <svg className="i" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></svg>;
const Ext = () => <svg className="inst__ext" viewBox="0 0 16 16" aria-hidden="true"><path d="M5 11 11 5M6 5h5v5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const Chevron = () => <svg className="i inst__chev" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>;
// The paste keys for each kind of computer; html[data-os] decides which shows. Linux terminals paste with Ctrl Shift V,
// and the message may go into a terminal agent or an app, so Linux gets both for the message and the terminal keys for
// a command. Phones show none of these (install.css).
const Keys = ({ terminal }: { terminal?: boolean }) => (
  <span className="inst__keys"> with{" "}
    <span data-os="mac"><kbd>⌘</kbd><kbd>V</kbd></span>
    <span data-os="linux">{terminal ? <><kbd>Ctrl</kbd><kbd>Shift</kbd><kbd>V</kbd></> : <><kbd>Ctrl</kbd><kbd>V</kbd>, or <kbd>Ctrl</kbd><kbd>Shift</kbd><kbd>V</kbd> in a terminal</>}</span>
    <span data-os="other"><kbd>Ctrl</kbd><kbd>V</kbd></span>
  </span>
);
// After a blocked copy the text is selected: how to copy it yourself, by keys on a computer, by touch on a phone.
const CopyHint = () => (
  <>
    <span className="inst__keys"> Copy it with{" "}
      <span data-os="mac"><kbd>⌘</kbd><kbd>C</kbd></span>
      <span data-os="linux"><kbd>Ctrl</kbd><kbd>C</kbd></span>
      <span data-os="other"><kbd>Ctrl</kbd><kbd>C</kbd></span>.
    </span>
    <span className="inst__touch"> Touch and hold it, then choose Copy.</span>
  </>
);
const tested = (a: Agent) => a.tested ? `${a.testedScope ?? "Tested"} with ${a.tested}.` : `Not tested with ${a.label} yet.`;
const selectText = (el: Element | null) => {
  if (!el) return;
  try { const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s?.removeAllRanges(); s?.addRange(r); } catch {}
};

export function InstallPage({ kits, skills, kitLines, account, children }: { kits: number; skills: number; kitLines: KitLine[]; account: boolean; children: React.ReactNode }) {
  const [agent, setAgent] = useState<Agent>(SHOWN[0]);
  // The by-hand command's copied state, and the message's, each with its own button.
  const [copied, setCopied] = useState(false);
  const [said1, setSaid1] = useState(false);
  // The browser refused to copy: the message shows, selected, to copy by hand. It is shown at no other time.
  const [blocked, setBlocked] = useState(false);
  // After a copy, a visitor with no account is offered one once; Not now hides it.
  const [guest, setGuest] = useState(false);
  const [later, setLater] = useState(false);
  // Once an agent's command has been copied this visit, its light stays softly lit (it never says the clipboard
  // still holds it); another agent's is unlit until its own command is copied.
  const [copiedIds, setCopiedIds] = useState<string[]>([]);
  useEffect(() => { if (copied) setCopiedIds((x) => (x.includes(agent.id) ? x : [...x, agent.id])); }, [copied, agent.id]);
  const ever = copiedIds.includes(agent.id);
  // Set by the first agent the visitor picks, so the command fades in on a pick and never on load.
  const [picked, setPicked] = useState(false);
  const [open, setOpen] = useState(false);
  const [arrived, setArrived] = useState(false);
  const [note, setNote] = useState<Note | null>(null);
  // Counts copies of the message that succeeded; each one runs the rim light once.
  const [trace, setTrace] = useState(0);
  const [said, setSaid] = useState("");
  const h1 = useRef<HTMLHeadingElement>(null);
  const msg = useRef<HTMLPreElement>(null);
  const root = useRef<HTMLElement>(null);
  const cmd = useRef<HTMLPreElement>(null);

  // Before paint: the saved agent, a link straight to the commands (#manual), and what the homepage's Install button did.
  useLayoutEffect(() => {
    if (!document.documentElement.hasAttribute("data-os")) markOS();
    setAgent(lastAgent());
    if (location.hash === "#manual") setOpen(true);
    // What the homepage's Install button did. The answer may already be saved, or arrive in the next moments.
    let t = 0, done = false;
    const read = () => {
      const h = readHandoff();
      if (done || !h) return;
      setArrived(true);
      // The homepage saves a copied message or a blocked copy. Any other shape claims nothing.
      if (!("message" in h) && !("blocked" in h)) return;
      done = true;
      const kind: Note["kind"] = "message" in h ? "message" : "blocked";
      if (kind === "message") { setSaid1(true); setBlocked(false); setTrace((n) => n + 1); } else setBlocked(true);
      h1.current?.focus({ preventScroll: true });
      // The status waits a moment, so a screen reader reads it after the new page's title, not over it.
      t = window.setTimeout(() => setNote({ kind, n: 1 }), 600);
    };
    read();
    addEventListener(HANDOFF_EVENT, read);
    return () => { clearTimeout(t); removeEventListener(HANDOFF_EVENT, read); };
  }, []);
  // A link to #manual from this same page opens the commands too, even when the address already ends in #manual.
  useEffect(() => {
    const on = () => { if (location.hash === "#manual") setOpen(true); };
    const click = (e: MouseEvent) => { const a = (e.target as Element | null)?.closest?.("a[href]"); if (a && new URL((a as HTMLAnchorElement).href).hash === "#manual" && (a as HTMLAnchorElement).pathname === location.pathname) setOpen(true); };
    addEventListener("hashchange", on); document.addEventListener("click", click);
    return () => { removeEventListener("hashchange", on); document.removeEventListener("click", click); };
  }, []);
  useEffect(() => { if (blocked) { root.current?.removeAttribute("data-got"); selectText(msg.current); } }, [blocked]);
  // The offer of an account opens sign-in in a new tab, so this page stays. When the visitor comes back to it, it asks
  // again whether they are signed in now, and the offer goes away if they are.
  useEffect(() => {
    if (!said1) return;
    // Clerk's own signed-out rule (lib/auth-hint.ts): __client_uat is 0 when signed out. The cookie, unlike data-auth, changes when another tab signs in.
      const ask = () => setGuest(!/(?:^|; )__client_uat[^=]*=(?!0(?:;|$))[^;]/.test(document.cookie));
    ask();
    addEventListener("focus", ask); document.addEventListener("visibilitychange", ask);
    return () => { removeEventListener("focus", ask); document.removeEventListener("visibilitychange", ask); };
  }, [said1]);
  useEffect(() => { if (!copied) return; const t = setTimeout(() => setCopied(false), NOTE_MS); return () => clearTimeout(t); }, [copied]);
  // data-got (set before paint on a full load) shows the Copied panel from the first frame; it ends with the claim.
  useEffect(() => { if (!said1) return; const t = setTimeout(() => { setSaid1(false); root.current?.removeAttribute("data-got"); }, COPIED_MS); return () => clearTimeout(t); }, [said1]);

  // Copied notes clear with their button; a blocked note stays until the next copy, since the visitor still has to act.
  useEffect(() => { if (!note || note.kind === "blocked" || note.kind === "failed") return; const t = setTimeout(() => setNote(null), NOTE_MS); return () => clearTimeout(t); }, [note]);

  const pick = (a: Agent) => {
    setPicked(true);
    setAgent(a); setCopied(false); setSaid(`${a.label}. ${tested(a)}`);
    // A command note belongs to the agent it was about; switching agents clears it.
    if (note?.kind === "copied" || note?.kind === "failed") setNote(null);
    try { localStorage.setItem(AGENT_KEY, a.id); } catch {}
  };
  const focus = (a: Agent) => { pick(a); document.getElementById(`it-${a.id}`)?.focus(); };
  const show = (kind: Note["kind"]) => setNote((x) => ({ kind, n: (x?.n ?? 0) + 1 }));
  const copy = async () => {
    try { await navigator.clipboard.writeText(commandFor(agent)); setCopied(true); show("copied"); }
    catch { setCopied(false); selectText(cmd.current?.querySelector(`[data-a="${agent.id}"]`) ?? null); show("failed"); }
  };
  const copyMessage = async () => {
    try { await navigator.clipboard.writeText(INSTALL_MESSAGE); setSaid1(true); setBlocked(false); setTrace((n) => n + 1); show("message"); }
    catch { setSaid1(false); setBlocked(true); show("blocked"); }
  };
  const many = agent.steps.length > 1;
  // The agents with a site to open; the visitor's own is the lit one.
  const openable = SHOWN.filter((a) => OPEN_URL[a.id]);
  const lead = openable.find((a) => a.id === agent.id) ?? openable[0];
  // The message's status line answers the message; the command's answers inside the disclosure, next to it.
  const msgNote = note && (note.kind === "message" || note.kind === "blocked") ? note : null;
  const cmdNote = note && (note.kind === "copied" || note.kind === "failed") ? note : null;

  return (
    <main ref={root} className="quiet inst" data-agent={agent.id} data-picked={picked || undefined} data-arrived={arrived || undefined} suppressHydrationWarning>
      <script dangerouslySetInnerHTML={{ __html: AGENT_SCRIPT + OS_SCRIPT }} />
      <div className="inst__in">
        <div className="inst__main">
          <h1 ref={h1} tabIndex={-1}>Install Agent Kit</h1>
          <p className="inst__lede">Paste one message into your agent. It installs {kits} kits and {skills} skills.</p>

          {/* The panel the homepage's Install button travels to. It never shows the message. Arriving from the homepage
              the message is already copied, so the panel opens on Copied (data-got marks it before the first paint, so
              nothing flashes from one state to the other) and offers to open an agent. Visited directly, it is only
              the Copy key until Copy is pressed. A copy that truly succeeded runs one light round the rim and swells a
              bloom under it (both remounted per copy). Screen readers hear the same through the status below. If the
              browser blocked copying, the message shows here, selected, and Copy tries again. */}
          <section className={`inst__msg${said1 ? " is-copied" : ""}`} data-blocked={blocked || undefined} aria-labelledby="inst-msg-h">
            <span className="inst__rim" aria-hidden="true" />
            {trace > 0 && <><span className="inst__trace" key={`t${trace}`} aria-hidden="true" /><span className="inst__bloom" key={`b${trace}`} aria-hidden="true" /></>}
            <h2 id="inst-msg-h" className="sr">Paste into your agent</h2>
            {blocked && <pre className="inst__say" ref={msg}>{INSTALL_MESSAGE}</pre>}
            <div className="inst__done">
              <div className="inst__got">
                <p className="inst__big"><span className="inst__tick"><Check /></span>Copied</p>
                <p className="inst__sub">Paste it into your agent<Keys /> and press return.</p>
              </div>
              <div className="inst__open">
                <span className="inst__label">Open your agent</span>
                <div className="inst__agents">
                  {openable.map((a) => (
                    <a key={a.id} className={`inst__agent${a.id === lead?.id ? " inst__agent--lead" : ""}`} href={OPEN_URL[a.id]} target="_blank" rel="noopener noreferrer">
                      <AgentMark id={a.id} /><span>{a.label}</span><Ext />
                    </a>
                  ))}
                  <button type="button" className="inst__again" onClick={copyMessage} aria-label="Copied. Copy the message again">Copy again</button>
                </div>
              </div>
            </div>
            <div className="inst__bar inst__idle">
              <span className="inst__label" aria-hidden="true"><i className="led" />{blocked ? "Copy it yourself" : "Ready to copy"}</span>
              <button type="button" className="inst__copy inst__copy--main" onClick={copyMessage} aria-label="Copy the message"><CopyIcon />{blocked ? "Copy" : "Copy install message"}</button>
            </div>
          </section>

          {/* The status: a success is said inside the composer, so here it is only announced; a blocked copy needs
              the visitor to act, so it shows in place of the idle line (one grid cell, so nothing below moves). */}
          <div className="inst__stat">
          <div className="inst__status" role="status">
            {msgNote && (
              <p className={`inst__note${msgNote.kind === "blocked" ? " is-warn" : " sr"}`} key={msgNote.n}>
                {msgNote.kind === "message"
                  ? <>Message copied. Paste it into your agent.</>
                  : <><span className="inst__warn" aria-hidden="true">!</span><span><b>Your browser blocked copying.</b> The message is selected.<CopyHint /></span></>}
              </p>
            )}
          </div>
          <p className="inst__how" aria-hidden={msgNote?.kind === "blocked" ? true : undefined}>Works in Claude Code, Codex, Cursor and other coding agents.</p>
          </div>
          {account && said1 && guest && !later && (
            <section className="inst__acct" aria-labelledby="inst-acct-h">
              <div>
                <h2 id="inst-acct-h">Make a free account</h2>
                <p>Star the prompts and skills you use, group them into collections, and share a collection with a link. Everything here also works without one.</p>
              </div>
              <div className="inst__acctdo">
                <Link className="inst__agent inst__agent--lead" href={signInHref("/install")} target="_blank" rel="noopener noreferrer">Create a free account<Ext /></Link>
                <button type="button" className="inst__again" onClick={() => setLater(true)}>Not now</button>
              </div>
            </section>
          )}
          <p className="inst__phone">Agent Kit installs on a computer. Send yourself this page, or paste the message into your agent there.</p>

          <details className="inst__manual" id="manual" open={open} onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}>
            <summary>
              <h2 className="inst__or">Or run it yourself</h2>
              <span className="inst__sum">Terminal commands for each agent</span>
              <Chevron />
            </summary>
            <div className="inst__body">
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
                  <span className="inst__label"><i className={`led${copied ? " is-on" : ever ? " is-on is-dim" : ""}`} aria-hidden="true" />{copied ? "Copied" : "Terminal"}</span>
                  <button type="button" className="inst__copy" onClick={copy} aria-label={copied ? "Copied. Copy again" : `Copy ${many ? "all lines" : "the command"}`}>
                    {copied ? <><Check />Copied</> : <><CopyIcon />{many ? "Copy all" : "Copy"}</>}
                  </button>
                </div>
                <pre translate="no" ref={cmd}>{SHOWN.map((a) => (
                  <code key={a.id} data-a={a.id}>{a.steps.map((s) => <span key={s} className="inst__line">{s}</span>)}</code>
                ))}</pre>
              </div>

              <div className="inst__cmdnote" role="status">
                {cmdNote && (
                  <p className={`inst__note${cmdNote.kind === "failed" ? " is-warn" : ""}`} key={cmdNote.n}>
                    {cmdNote.kind === "copied"
                      ? <><i className="led is-on" aria-hidden="true" /><span><b>Install command copied.</b> Paste it in a terminal<Keys terminal />.</span></>
                      : <><span className="inst__warn" aria-hidden="true">!</span><span><b>Copying was blocked.</b> The command is selected.<CopyHint /></span></>}
                  </p>
                )}
              </div>

              <div className="inst__tested">
                {SHOWN.map((a) => (
                  <p key={a.id} data-a={a.id}><i className={`led${a.tested ? " is-on" : ""}`} aria-hidden="true" /> {tested(a)}{!a.tested && <> <button type="button" onClick={() => focus(FALLBACK)}>The {FALLBACK.label} command is tested</button>.</>}</p>
                ))}
              </div>

              <div className="inst__next">
                {SHOWN.map((a) => (
                  <ol key={a.id} data-a={a.id}>
                    <li><span>1</span><p>Paste {a.steps.length > 1 ? "the lines" : "it"} into a terminal<Keys terminal /> and press Return.</p></li>
                    <li><span>2</span><p>{a.check.replace(/^Copies/, "It copies")}</p></li>
                  </ol>
                ))}
              </div>
            </div>
          </details>

          <details className="inst__fold inst__kits">
            <summary>
              <h2 className="inst__or">What it installs</h2>
              <span className="inst__sum">{kits} kits, {skills} skills</span>
              <Chevron />
            </summary>
            <div className="inst__body">
              <p className="inst__kitnote">Each kit starts with the command shown, as typed in Claude Code.</p>
              <ul>
                {kitLines.map((k) => (
                  <li key={k.name}>
                    <Link href={`/kits/${k.name}`}>
                      <span className="inst__kit"><span className="inst__kitname">{k.name}</span><span className="inst__kitn">{k.skills} {k.skills === 1 ? "skill" : "skills"}</span></span>
                      <span className="inst__kitline">{k.line}</span>
                      <span className="inst__kittype">{k.type.map((t) => <code key={t} translate="no">{t}</code>)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="inst__by">{children}</p>
            </div>
          </details>

          <nav className="inst__more" aria-label="After installing">
            <Link href="/start">New to coding agents?</Link>
            <Link href="/kits">Kits</Link>
            <Link href="/prompts">Prompts</Link>
            <Link href="/skills">Skills</Link>
          </nav>
        </div>
      </div>

      <p className="inst__said" aria-live="polite">{said}</p>
    </main>
  );
}
