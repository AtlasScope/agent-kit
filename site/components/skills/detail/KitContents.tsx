import Link from "next/link";
import { Star } from "@/components/Star";
import { getSkill, type Skill } from "@/lib/content";
import { splitLead } from "./prose";

function Row({ s }: { s: Skill }) {
  return (
    <li className="kd-row">
      <h4 className="kd-row__name"><Link href={`/skills/${s.name}`} translate="no">{s.name}</Link></h4>
      <p className="kd-row__d">{splitLead(s.description)[0]}</p>
      <p className="kd-row__m">
        {s.typedOnly ? <span>Type it to run</span> : <span>Agent can pick it</span>}
        <span>{s.credit ? `By ${s.credit.author}` : "By Agent Kit"}</span>
      </p>
      <div className="kd-row__star"><Star kind="skill" refId={s.name} title={s.name} /></div>
    </li>
  );
}

// A kit's skills as scannable rows, in two groups: what was written for Agent Kit, then what was borrowed with
// credit. Order within each group follows the kit's own list.
export function KitContents({ names }: { names: string[] }) {
  const all = names.map(getSkill).filter((s): s is Skill => Boolean(s));
  const own = all.filter((s) => !s.credit);
  const borrowed = all.filter((s) => s.credit);
  const groups: [string, string, Skill[]][] = [
    ["kd-own", "Written for Agent Kit", own],
    ["kd-borrowed", "Borrowed, with credit", borrowed],
  ];
  return (
    <div className="kd-groups">
      {groups.filter(([, , list]) => list.length).map(([id, title, list]) => (
        <section key={id} className="kd-group" aria-labelledby={id}>
          <h3 id={id} className="kd-group__h">{title}<span className="kd-group__n">{list.length}</span></h3>
          <ul className="kd-rows">{list.map((s) => <Row key={s.name} s={s} />)}</ul>
        </section>
      ))}
    </div>
  );
}
