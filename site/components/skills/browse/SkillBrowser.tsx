"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Star } from "@/components/Star";
import type { BrowseKit, BrowseSkill } from "./data";

type Who = "all" | "original" | "borrowed";
type By = "kit" | "author";
type Group = { id: string; title: string; kit?: BrowseKit; items: BrowseSkill[] };

const AGENT_KIT = "Agent Kit";
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// The skills index. The server renders it grouped by kit with nothing filtered, so it reads the same without
// JavaScript. Filtering, the who-wrote-it switch and grouping by author happen here, and are mirrored into the
// query string (?q=, ?from=, ?by=) so a filtered view can be shared. Section ids stay the kit names, so
// existing links like /skills#motion-kit keep working.
export function SkillBrowser({ skills, kits }: { skills: BrowseSkill[]; kits: BrowseKit[] }) {
  const [q, setQ] = useState("");
  const [who, setWho] = useState<Who>("all");
  const [by, setBy] = useState<By>("kit");
  const [current, setCurrent] = useState<string | null>(null);
  // Phones only: the two switches fold behind one Filters button so the list starts on the first screen.
  const [more, setMore] = useState(false);
  const ready = useRef(false);
  const field = useRef<HTMLInputElement>(null);

  // Read the shared view from the URL once, after hydration, so the static page stays static.
  useEffect(() => {
    const u = new URLSearchParams(location.search);
    const fq = u.get("q"); const fw = u.get("from"); const fb = u.get("by");
    if (fq) setQ(fq);
    if (fw === "original" || fw === "borrowed") setWho(fw);
    // A kit anchor (/skills#motion-kit) needs the kit grouping; an author anchor (#by-…, which the rail adds) does not.
    const hash = decodeURIComponent(location.hash.slice(1));
    if (fb === "author" && !kits.some((k) => k.name === hash)) setBy("author");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mirror the view into the URL. Skip the first run: it sees the defaults before the state read above lands,
  // and writing them would strip the shared parameters.
  useEffect(() => {
    if (!ready.current) { ready.current = true; return; }
    const u = new URL(location.href);
    const set = (k: string, v: string | null) => (v ? u.searchParams.set(k, v) : u.searchParams.delete(k));
    set("q", q.trim() || null); set("from", who === "all" ? null : who); set("by", by === "kit" ? null : by);
    history.replaceState(history.state, "", u.pathname + u.search + u.hash);
  }, [q, who, by]);

  const terms = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const shown = useMemo(
    () => skills.filter((s) => (who === "all" || (who === "borrowed") === s.borrowed) && terms.every((t) => s.text.includes(t))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [skills, who, terms.join(" ")],
  );

  const groups: Group[] = useMemo(() => {
    if (by === "kit") return kits.map((k) => ({ id: k.name, title: k.name, kit: k, items: shown.filter((s) => s.kit === k.name) }));
    const m = new Map<string, BrowseSkill[]>();
    for (const s of shown) m.set(s.author, [...(m.get(s.author) ?? []), s]);
    const used = new Set<string>();
    return [...m.entries()]
      .sort((a, b) => (a[0] === AGENT_KIT ? -1 : b[0] === AGENT_KIT ? 1 : b[1].length - a[1].length || a[0].localeCompare(b[0])))
      .map(([author, items]) => {
        // Names that slug the same (or to nothing, like a non-Latin name) still get distinct ids and keys.
        const base = `by-${slug(author) || "author"}`;
        let id = base;
        for (let i = 2; used.has(id); i++) id = `${base}-${i}`;
        used.add(id);
        return { id, title: author, items };
      });
  }, [by, kits, shown]);
  const visible = groups.filter((g) => g.items.length > 0);

  // Mark the section in view in the side index. Only the label changes; nothing moves.
  useEffect(() => {
    const els = visible.map((g) => document.getElementById(g.id)).filter((e): e is HTMLElement => Boolean(e));
    if (!els.length || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (es) => { const top = es.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]; if (top) setCurrent(top.target.id); },
      { rootMargin: "-140px 0px -55% 0px" },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [visible.map((g) => g.id).join()]); // eslint-disable-line react-hooks/exhaustive-deps

  const total = skills.length;
  const borrowed = skills.filter((s) => s.borrowed).length;
  const filtered = terms.length > 0 || who !== "all";
  const reset = () => { setQ(""); setWho("all"); field.current?.focus(); };

  return (
    <div className="sb">
      <div className="sb__bar">
        <div className="sb__find" role="search" aria-label="Filter skills">
          <svg className="sb__glass" viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4.75" /><path d="m10.5 10.5 3.25 3.25" /></svg>
          <input
            ref={field}
            className="sb__input"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Escape" && q) { e.preventDefault(); setQ(""); } }}
            placeholder={`Filter ${total} skills`}
            aria-label="Filter skills by name, job or author"
            aria-controls="sb-results"
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="search"
          />
        </div>
        <button type="button" className="sb__more" aria-expanded={more} aria-controls="sb-opts" onClick={() => setMore((m) => !m)}>
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 4.5h11M4.5 8h7M6.5 11.5h3" /></svg>
          Filters{(who !== "all" || by !== "kit") && <><span className="sb__dot" aria-hidden="true" /><span className="sr"> (some set)</span></>}
        </button>
        <div className="sb__opts" id="sb-opts" data-open={more || undefined}>
        <div className="sb__seg" role="group" aria-label="Who wrote it">
          {([["all", "All", total], ["original", "Agent Kit", total - borrowed], ["borrowed", "Borrowed", borrowed]] as const).map(([v, label, n]) => (
            <button key={v} type="button" aria-pressed={who === v} onClick={() => setWho(v)}>{label}<span className="sb__n">{n}</span></button>
          ))}
        </div>
        <div className="sb__seg" role="group" aria-label="Group by">
          {([["kit", "By kit"], ["author", "By author"]] as const).map(([v, label]) => (
            <button key={v} type="button" aria-pressed={by === v} onClick={() => setBy(v)}>{label}</button>
          ))}
        </div>
        </div>
      </div>

      <p className="sb__count" aria-live="polite" aria-atomic="true">
        {filtered ? <>{shown.length} of {total} skills{terms.length > 0 && <> match “{q.trim()}”</>}</> : <>{total} skills in {kits.length} kits</>}
        {filtered && <button type="button" className="sb__clear" onClick={reset}>Clear</button>}
      </p>

      <nav className="sb__rail" aria-label={by === "kit" ? "Kits" : "Authors"}>
        <ul>
          {visible.map((g) => (
            <li key={g.id}>
              <a href={`#${g.id}`} aria-current={current === g.id ? "true" : undefined} translate={by === "kit" ? "no" : undefined}>
                <span>{g.title}</span><span className="sb__n">{g.items.length}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sb__body" id="sb-results">
        <div className="sb__groups">
          {visible.length === 0 && (
            <div className="sb__empty">
              <p>{terms.length > 0 ? <>No skill matches “{q.trim()}”</> : <>No skills</>}{who !== "all" && <> among {who === "borrowed" ? "borrowed" : "Agent Kit"} skills</>}.</p>
              <p className="ink2">Try a job, like “animation” or “bug”, or <button type="button" className="sb__clear" onClick={reset}>clear the filter</button>.</p>
            </div>
          )}
          {visible.map((g) => (
            <section key={g.id} id={g.id} className="sg" aria-labelledby={`${g.id}-h`}>
              <header className="sg__head">
                <div className="sg__title">
                  <h2 id={`${g.id}-h`} translate={g.kit ? "no" : undefined}>{g.title}</h2>
                  <span className="sg__n">{g.items.length}{g.kit && g.items.length !== g.kit.count ? ` of ${g.kit.count}` : ""} {(g.kit ? g.kit.count : g.items.length) === 1 ? "skill" : "skills"}</span>
                  {g.kit && <span className="sg__v" translate="no">v{g.kit.version}</span>}
                </div>
                {g.kit?.line && <p>{g.kit.line} <Link className="lic" href={`/kits/${g.kit.name}`}>Install the kit</Link></p>}
              </header>
              <ul className="sk-list">
                {g.items.map((s) => (
                  <li key={s.name} className="sk" data-kit={s.kit}>
                    <h3 className="sk__name"><Link className="stretch" href={`/skills/${s.name}`} translate="no">{s.name}</Link></h3>
                    <p className="sk__d">{s.line}</p>
                    <p className="sk__m">
                      {by === "author" && <span translate="no">{s.kit}</span>}
                      {by === "kit" && <span className={s.borrowed ? undefined : "sk__own"}>{s.borrowed ? `By ${s.author}` : "By Agent Kit"}</span>}
                      {/* How it starts: typed-only skills name their command; the rest start automatically and can also be typed. */}
                      <span className="sk__start">{s.typed ? <>Type <code translate="no">{s.cmd}</code> to run</> : <>Starts automatically, or type <code translate="no">{s.cmd}</code></>}</span>
                    </p>
                    <span className="sk__star"><Star kind="skill" refId={s.name} title={s.name} /></span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
