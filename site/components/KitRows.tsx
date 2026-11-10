import Link from "next/link";
import { getKit } from "@/lib/content";
import { KITS, KIT_GUIDE } from "@/lib/site";

// One row per kit: name and size, one sentence on what it does, and the commands that start it.
// Used on the homepage and /kits so the two always describe the kits the same way.
export function KitRows() {
  return (
    <ul className="adds__list">
      {KITS.map((name) => {
        const k = getKit(name)!;
        const g = KIT_GUIDE[name];
        return (
          <li key={name}>
            <h3><Link href={`/kits/${name}`}>{name}</Link></h3>
            <span className="adds__n">{k.skills.length} {k.skills.length === 1 ? "skill" : "skills"}</span>
            <p>{g.line}</p>
            <ul className="adds__type" aria-label={`Commands in ${name}`}>{g.type.map((t) => <li key={t}><code>{t}</code></li>)}</ul>
          </li>
        );
      })}
    </ul>
  );
}
