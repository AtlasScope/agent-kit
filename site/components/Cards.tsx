import Link from "next/link";
import { getPrompt, getSkill, kindLabel, type Prompt } from "@/lib/content";

export function PromptList({ slugs }: { slugs: string[] }) {
  return (
    <ul className="list">
      {slugs.map(getPrompt).filter((p): p is Prompt => Boolean(p)).map((p) => (
        <li key={p.slug}>
          <Link href={`/prompts/${p.slug}`}>
            <span className="list__t">{p.t}</span>
            <span className="list__n">{kindLabel(p)}</span>
            {(p.why || p.use) && <span className="list__d">{p.why || p.use}</span>}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function SkillCards({ names }: { names: string[] }) {
  return (
    <div className="grid">
      {names.map((n) => getSkill(n)).filter(Boolean).map((s) => (
        <Link key={s!.name} className="card" href={`/skills/${s!.name}`}>
          <span className="card__t">{s!.name}</span>
          <span className="card__d">{s!.description}</span>
          <span className="card__m"><span>{s!.kit}</span><span>·</span><span>{s!.credit ? s!.credit.author : "Agent Kit"}</span></span>
        </Link>
      ))}
    </div>
  );
}
