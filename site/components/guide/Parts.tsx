import Link from "next/link";
import type { ReactNode } from "react";
import { GuideNext } from "@/components/GuideProgress";

// Shared pieces of a step or lesson page: the checkpoint that says what success looks like, the list of what can go
// wrong with the fix for each, and the back/next bar. Server components; GuideNext is the only client part.

export function Checkpoint({ children }: { children: ReactNode }) {
  return (
    <section className="checkpoint" aria-labelledby="expect-h">
      <h2 id="expect-h"><span className="checkpoint__mark" aria-hidden="true"><svg className="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></span>You should see</h2>
      <p>{children}</p>
    </section>
  );
}

export function Troubles({ items }: { items: [string, string][] }) {
  return (
    <section className="troubles" aria-labelledby="wrong-h">
      <h2 id="wrong-h">If something’s off</h2>
      <dl>
        {items.map(([see, fix]) => (
          <div key={see} className="troubles__row"><dt>{see}</dt><dd>{fix}</dd></div>
        ))}
      </dl>
    </section>
  );
}

export function StepNav({ label, back, store, current, next }: {
  label: string; back: [string, string]; store: string; current: string; next: [string, string];
}) {
  return (
    <nav className="stepnav" aria-label={label}>
      <Link className="btn btn--lg btn--ghost stepnav__back" href={back[1]}>
        <svg className="i" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>{back[0]}
      </Link>
      <GuideNext store={store} current={current} href={next[1]}>{next[0]}</GuideNext>
    </nav>
  );
}
