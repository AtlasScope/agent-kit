import Link from "next/link";
import { STEPS } from "@/lib/start";
import { LESSONS } from "@/lib/lessons";
import { fixes } from "@/lib/content";

// The three guided routes in the order a newcomer takes them: build a first app, learn the five ideas behind it,
// then fix real problems. Shown at the top of each hub so every route says where it sits and what comes next.
const STAGES = [
  { href: "/start", title: "Build your first app", n: `${STEPS.length} steps` },
  { href: "/learn", title: "Five short lessons", n: `${LESSONS.length} lessons` },
  { href: "/fix", title: "Fix a problem", n: `${fixes.length} symptoms` },
] as const;

export function JourneyPath({ current }: { current: (typeof STAGES)[number]["href"] }) {
  return (
    <nav className="journey" aria-label="Guided routes">
      <ol>
        {STAGES.map((s, i) => (
          <li key={s.href} className={s.href === current ? "is-here" : undefined}>
            <Link href={s.href} aria-current={s.href === current ? "page" : undefined}>
              <span className="journey__n" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
              <span className="journey__t">{s.title}</span>
              <span className="journey__c">{s.n}</span>
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}
