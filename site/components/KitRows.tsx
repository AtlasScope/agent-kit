import Link from "next/link";
import { CopyButton } from "@/components/CopyButton";
import { getKit } from "@/lib/content";
import { KITS, KIT_GUIDE } from "@/lib/site";
import { kitAuthors, nameList } from "@/components/skills/browse/data";

// How many skill names a kit shows before "and N more".
const PREVIEW = 6;

// One sheet per kit on /kits: name, version and size; one sentence on what it does; who wrote its skills; the
// commands that start it; and the first few skills it ships. The kit name's link is stretched over the sheet, so
// the whole sheet opens the kit. Commands and skill links sit above that link and act on their own.
export function KitRows({ level = 3 }: { level?: 2 | 3 }) {
  const H = level === 2 ? "h2" : "h3";
  return (
    <ul className="kits">
      {KITS.map((name, i) => {
        const k = getKit(name)!;
        const g = KIT_GUIDE[name];
        const by = kitAuthors(name);
        const shown = k.skills.slice(0, PREVIEW);
        const more = k.skills.length - shown.length;
        return (
          <li key={name} className="kit" id={name}>
            <div className="kit__id">
              <span className="kit__i" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
              <H className="kit__name"><Link className="stretch" href={`/kits/${name}`} translate="no">{name}</Link></H>
              <p className="kit__m">
                <span>{k.skills.length} {k.skills.length === 1 ? "skill" : "skills"}</span>
                <span translate="no">v{k.version}</span>
              </p>
            </div>
            <div className="kit__body">
              <p className="kit__line">{g.line}</p>
              <p className="kit__by">By {nameList(by)}</p>
              <ul className="kit__skills" aria-label={`Skills in ${name}`} translate="no">
                {shown.map((s) => <li key={s}><Link href={`/skills/${s}`}>{s}</Link></li>)}
                {more > 0 && <li><Link className="kit__more" href={`/kits/${name}`} aria-label={`+${more} more: all ${k.skills.length} skills in ${name}`}>+{more} more</Link></li>}
              </ul>
            </div>
            <div className="kit__start">
              <p className="kit__label" id={`start-${name}`}>Start it</p>
              <ul className="kit__type" translate="no" aria-labelledby={`start-${name}`}>
                {g.type.map((t) => <li key={t}><CopyButton text={t} label={t} className="kit__cmd" name={`${t} (copy)`} /></li>)}
              </ul>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
