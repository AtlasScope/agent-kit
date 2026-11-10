"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

// Progress through the first-app guide or the lessons, kept in this browser only. A step counts as done
// once the reader presses Next on it. Nothing is sent anywhere; clearing site data resets it.
type Item = { slug: string; title: string; goal?: string };
const KEY = (store: string) => `agent-kit:done:${store}`;

function read(store: string): string[] {
  try { return JSON.parse(localStorage.getItem(KEY(store)) || "[]"); } catch { return []; }
}

function useDone(store: string) {
  const [done, setDone] = useState<string[]>([]);
  useEffect(() => { setDone(read(store)); }, [store]);
  return done;
}

const Check = () => <svg className="i" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;

// The numbered list on a hub page, with a mark on each finished step and a way back in.
export function GuideList({ items, base, store }: { items: Item[]; base: string; store: string }) {
  const done = useDone(store);
  const next = items.find((s) => !done.includes(s.slug));
  return (
    <>
      {done.length > 0 && next && (
        <p className="guide-resume">
          <span>{done.length} of {items.length} done.</span>
          <Link className="btn btn--sm" href={`${base}/${next.slug}`}>Continue: {next.title}</Link>
        </p>
      )}
      <ol className={`guide-list${items.length > 5 ? " guide-list--two" : ""}`}>
        {items.map((s, i) => {
          const d = done.includes(s.slug);
          return (
            <li key={s.slug} className={d ? "is-done" : undefined}>
              <Link href={`${base}/${s.slug}`}>
                <span className="guide-list__n" aria-hidden="true">{d ? <Check /> : i + 1}</span>
                <span className="guide-list__t"><strong>{s.title}</strong>{s.goal && <span>{s.goal}</span>}</span>
                {d && <span className="sr"> (done)</span>}
              </Link>
            </li>
          );
        })}
      </ol>
    </>
  );
}

// The side list on a step or lesson page: every item, this one marked, finished ones ticked.
export function GuideRail({ items, base, store, current, label }: { items: Item[]; base: string; store: string; current: string; label: string }) {
  const done = useDone(store);
  return (
    <nav className="guide-rail" aria-label={label}>
      <ol>
        {items.map((s, i) => {
          const d = done.includes(s.slug), here = s.slug === current;
          return (
            <li key={s.slug} className={[here && "is-here", d && "is-done"].filter(Boolean).join(" ") || undefined}>
              <Link href={`${base}/${s.slug}`} aria-current={here ? "step" : undefined}>
                <span className="guide-rail__n" aria-hidden="true">{d && !here ? <Check /> : i + 1}</span>
                <span>{s.title}</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// The Next button: marks this item done in the browser, then follows the link.
export function GuideNext({ href, store, current, children }: { href: string; store: string; current: string; children: React.ReactNode }) {
  return (
    <Link className="btn btn--solid" href={href} onClick={() => {
      try { const d = read(store); if (!d.includes(current)) localStorage.setItem(KEY(store), JSON.stringify([...d, current])); } catch {}
    }}>{children}</Link>
  );
}
