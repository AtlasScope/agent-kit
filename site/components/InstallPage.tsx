"use client";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { INSTALL_MESSAGE, type Agent } from "@/lib/site";
import { InstallPaths, Ext, type Place } from "./InstallPaths";
import { AgentMark } from "./AgentMark";
import { HANDOFF_EVENT } from "./stage/HomeHero";
import { AGENT_KEY, COPIED_KEY, FALLBACK, FRESH_MS, OPEN, OS_SCRIPT, SHOWN, commandFor, device, lastAgent, markOS, readHandoff, type Device } from "./install-choice";

// The install page: a short welcome. Two ways on, side by side (a free account, and a drawer that introduces the site:
// InstallPaths), then a panel with Claude Code, Codex and Cursor. On a Mac or Windows PC each tile opens that desktop
// app with the install message (INSTALL_MESSAGE, also copied by the homepage's Install button) typed in and not sent.
// A tile that opens a website copies the message too, since it has to be pasted there. A chip above it all flashes Copied after a copy.
// The page's heading is for screen readers. Under the panel, two small chips go back to the homepage and copy the
// message again. Under them, one panel with two tabs: the kits it installs, and the terminal commands for each agent. The message shows,
// selected, only when the browser blocks copying. Nothing here says the kits are installed.
//
// It shares the homepage's view from orbit (components/stage/Stage.tsx), seen from further away, and that stage plays
// the arrival from the homepage's Install button. By then the message is on the clipboard (readHandoff,
// install-choice.ts): the chip shows Copied at once and the status line says so a moment later, after a screen reader
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
// How long the panel keeps its copied glow: long enough to switch to an agent and back, short enough that a tab left
// open does not claim a clipboard it may no longer hold.
const COPIED_MS = 120_000;
type Note = { kind: "message" | "copied" | "blocked" | "failed"; n: number };
export type KitLine = { name: string; line: string; type: string[] };

const Check = () => <svg className="i" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;
const CopyIcon = () => <svg className="i" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></svg>;
const Chevron = () => <svg className="i inst__chev" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>;
const BoxIcon = () => <svg className="i" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="M12 3 20 7.5v9L12 21l-8-4.5v-9z" /><path d="M4 7.5 12 12l8-4.5M12 12v9" /></svg>;
const TermIcon = () => <svg className="i" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4.5" width="18" height="15" rx="3" /><path d="m7.5 10 3 2.5-3 2.5M13 15h3.5" /></svg>;
// What it installs shows this many kits; past that, a last card links to all of them. Nothing on the panel depends on
// how many kits or skills there are.
const KIT_CARDS = 6;
// Each kit's tile takes a hue from its name, so a new kit gets its own colour without a list to keep.
const hue = (name: string) => [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
// Firefox replaces the page with an error when no app answers an app link, so there the link opens in a hidden frame.
const FIREFOX = () => /Firefox\//.test(navigator.userAgent);
const launch = (href: string) => {
  const f = document.createElement("iframe");
  f.hidden = true; f.src = href; document.body.append(f);
  setTimeout(() => f.remove(), 3000);
};
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

export function InstallPage({ places, kitLines, account, children }: { places: Place[]; kitLines: KitLine[]; account: boolean; children: React.ReactNode }) {
  // Which agent the visitor opened: this page stays, says where it went, and the account path comes forward.
  const [opened, setOpened] = useState("");
  // Where the tiles lead (install-choice.ts); read after load, so the page renders the same for everyone.
  const [on, setOn] = useState<Device>("web");
  useEffect(() => setOn(device()), []);
  const [agent, setAgent] = useState<Agent>(SHOWN[0]);
  // The by-hand command's copied state.
  const [copied, setCopied] = useState(false);
  // The browser refused to copy: the message shows, selected, to copy by hand. It is shown at no other time.
  const [blocked, setBlocked] = useState(false);
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
  // The panel's copied glow, which lapses (COPIED_MS).
  const [lit, setLit] = useState(false);
  useEffect(() => { if (!trace) return; setLit(true); const t = setTimeout(() => setLit(false), COPIED_MS); return () => clearTimeout(t); }, [trace]);
  // Hydrated: until then both tabs' panels show, so the terminal commands are there without scripts.
  const [ready, setReady] = useState(false);
  const h1 = useRef<HTMLHeadingElement>(null);
  const msg = useRef<HTMLPreElement>(null);
  const root = useRef<HTMLElement>(null);
  const cmd = useRef<HTMLPreElement>(null);

  // Before paint: the saved agent, a link straight to the commands (#manual, which picks the Run it yourself tab), and what the homepage's Install button did.
  useLayoutEffect(() => {
    if (!document.documentElement.hasAttribute("data-os")) markOS();
    setAgent(lastAgent());
    if (location.hash === "#manual") setOpen(true);
    setReady(true);
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
      if (kind === "message") { setBlocked(false); setTrace((n) => n + 1); } else setBlocked(true);
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
  useEffect(() => { if (!copied) return; const t = setTimeout(() => setCopied(false), NOTE_MS); return () => clearTimeout(t); }, [copied]);

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
    try { await navigator.clipboard.writeText(INSTALL_MESSAGE); setBlocked(false); setTrace((n) => n + 1); show("message"); }
    catch { setBlocked(true); show("blocked"); }
  };
  const many = agent.steps.length > 1;
  // The agents with something to open, and the one just opened.
  // The tiles run Codex, Claude Code, Cursor: Claude in the middle, between the two quieter colours.
  const openable = ["codex", "claude", "cursor"].map((id) => SHOWN.find((a) => a.id === id)).filter((a): a is Agent => Boolean(a && OPEN[a.id]));
  const went = openable.find((a) => a.label === opened);
  // The message's status line answers the message; the command's answers inside the disclosure, next to it.
  const msgNote = note && (note.kind === "message" || note.kind === "blocked") ? note : null;
  const cmdNote = note && (note.kind === "copied" || note.kind === "failed") ? note : null;

  return (
    <main ref={root} className="quiet inst" data-agent={agent.id} data-picked={picked || undefined} data-arrived={arrived || undefined} suppressHydrationWarning>
      {/* Runs only from the server's HTML. Rendered in the browser (an in-site link) it is inert, which also keeps React
          from warning about it. */}
      <script type={typeof window === "undefined" ? undefined : "text/plain"} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: AGENT_SCRIPT + OS_SCRIPT }} />
      <div className="inst__in">
        <div className="inst__main">
          <h1 ref={h1} tabIndex={-1} className="sr">Install Agent Kit</h1>
          {/* The chip that flashes after a copy, in the space above everything; the status line says it to screen
              readers. The first flash can start before scripts (data-got); later copies replay it. */}
          <div className="inst__flash"><span className="inst__chip" key={`c${Math.max(trace, 1)}`} data-on={trace > 0 || undefined} aria-hidden="true"><Check />Copied</span></div>

          <InstallPaths account={account} places={places} nudge={Boolean(opened)} />

          <div className="inst__deck">
          <section className={`inst__msg${lit && !blocked ? " is-copied" : ""}`} data-blocked={blocked || undefined} aria-label="Agents">
            <span className="inst__rim" aria-hidden="true" />
            {trace > 0 && <><span className="inst__trace" key={`t${trace}`} aria-hidden="true" /><span className="inst__bloom" key={`b${trace}`} aria-hidden="true" /></>}
            {blocked && <pre className="inst__say" ref={msg}>{INSTALL_MESSAGE}</pre>}
            {/* Three equal choices, each lit in its own colour. An app link leaves this page where it is; a website opens
                in a new tab. */}
            <div className="inst__agents" role="group" aria-label="Open your agent">
              {openable.map((a) => {
                const o = OPEN[a.id], app = on === "desktop";
                return (
                  <a key={a.id} className="inst__agent" data-a-light={a.id} href={app ? o.app(INSTALL_MESSAGE) : (on === "phone" && o.phone) || o.web} target={app ? undefined : "_blank"} rel="noopener noreferrer" onClick={(e) => { setOpened(a.label); void copyMessage(); if (app && FIREFOX()) { e.preventDefault(); launch(e.currentTarget.href); } }}>
                    <AgentMark id={a.id} /><span>{a.label}</span><Ext /><span className="sr">{app ? " (opens the app)" : " (opens in a new tab)"}</span>
                  </a>
                );
              })}
            </div>
            <p className="inst__opened" aria-live="polite">
              {went && (on === "desktop"
                ? <>Opening {went.label} with the message filled in. Send it there.<span className="inst__help">Nothing opened? {OPEN[went.id].help.map(([label, href], n) => <span key={href}>{n > 0 && " or "}<a href={href} target="_blank" rel="noopener noreferrer">{label}</a></span>)}.</span></>
                : <>{went.label} opens in a new tab. {blocked ? "Copy the message above and paste" : "Paste the message"} {blocked ? "it " : ""}there.</>)}
            </p>
          </section>
          <div className="inst__ground" aria-hidden="true"><span className="inst__grid" /><span className="inst__pool" /><span className="inst__horizon" /></div>
          </div>

          {/* What Copy did, for screen readers; a blocked copy also shows here, since the visitor has to act. */}
          <div className="inst__status" role="status">
            {msgNote && (
              <p className={`inst__note${msgNote.kind === "blocked" ? " is-warn" : " sr"}`} key={msgNote.n}>
                {msgNote.kind === "message"
                  ? <>Message copied. Paste it into your agent.</>
                  : <><span className="inst__warn" aria-hidden="true">!</span><span><b>Your browser blocked copying.</b> The message is selected.<CopyHint /></span></>}
              </p>
            )}
          </div>

          {/* Two small chips: back to the homepage (the stage plays the camera move back), and the message copied again. */}
          <div className="inst__chips">
            <Link className="inst__pill" href="/"><svg className="i" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 3.5 5 8l4.5 4.5" /></svg>Back</Link>
            <button type="button" className="inst__pill" onClick={copyMessage} aria-label="Copy install message"><CopyIcon />Copy install</button>
          </div>

          {/* What's inside: one panel, two tabs. What it installs shows the kits as cards that wrap to fit however many
              there are; Run it yourself holds the terminal commands for each agent. */}
          <section className="inst__inside" id="manual">
            <div className="inst__views" role="tablist" aria-label="What's inside"
              onKeyDown={(e) => {
                const to = e.key === "ArrowRight" || e.key === "ArrowLeft" ? !open : e.key === "Home" ? false : e.key === "End" ? true : null;
                if (to === null) return;
                e.preventDefault(); setOpen(to);
                document.getElementById(to ? "iv-term" : "iv-kits")?.focus();
              }}>
              <button type="button" role="tab" id="iv-kits" aria-selected={!open} aria-controls="iv-kits-p" tabIndex={open ? -1 : 0} onClick={() => setOpen(false)}><BoxIcon />What it installs</button>
              <button type="button" role="tab" id="iv-term" aria-selected={open} aria-controls="iv-term-p" tabIndex={open ? 0 : -1} onClick={() => setOpen(true)}><TermIcon />Run it yourself</button>
            </div>

            <div className="inst__view inst__kits" id="iv-kits-p" role="tabpanel" aria-labelledby="iv-kits" hidden={ready && open}>
              <p className="inst__kitnote">Each kit starts with the command shown, as typed in Claude Code.</p>
              <ul data-cap={KIT_CARDS}>
                {kitLines.slice(0, KIT_CARDS).map((k) => (
                  <li key={k.name}>
                    <Link href={`/kits/${k.name}`} style={{ "--h": hue(k.name) } as React.CSSProperties}>
                      <span className="inst__kittile" aria-hidden="true">{k.name[0]}</span>
                      <span className="inst__kitname">{k.name}</span>
                      <span className="inst__kitline">{k.line}</span>
                      <span className="inst__kittype">{k.type.map((t) => <code key={t} translate="no">{t}</code>)}</span>
                    </Link>
                  </li>
                ))}
                {kitLines.length > KIT_CARDS && <li className="inst__kitall"><Link href="/kits">All kits<Chevron /></Link></li>}
              </ul>
              <p className="inst__by">{children}</p>
            </div>

            <div className="inst__view inst__body" id="iv-term-p" role="tabpanel" aria-labelledby="iv-term" hidden={ready && !open}>
              <div className="inst__tabs" role="tablist" aria-label="Agent for the commands"
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
          </section>

        </div>
      </div>

      <p className="inst__said" aria-live="polite">{said}</p>
    </main>
  );
}
