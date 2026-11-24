import { skills, kits, getKit } from "@/lib/content";
import { firstSentence } from "@/components/Cards";
import { AGENTS, KITS, KIT_GUIDE } from "@/lib/site";

// The small, serialisable view of the catalog that the skills browser needs. Built on the server from
// content/generated.json, so the client gets names and one line each, never the SKILL.md bodies.
export type BrowseSkill = { name: string; kit: string; line: string; text: string; author: string; borrowed: boolean; typed: boolean };
export type BrowseKit = { name: string; title: string; version: string; line: string; count: number };

export const AGENT_KIT = "Agent Kit";

export const browseSkills: BrowseSkill[] = skills.map((s) => ({
  name: s.name,
  kit: s.kit,
  line: firstSentence(s.description),
  // What the filter matches against: name, full description, author and kit, lower-cased once here.
  text: [s.name, s.description, s.credit?.author ?? AGENT_KIT, s.kit].join(" ").toLowerCase(),
  author: s.credit?.author ?? AGENT_KIT,
  borrowed: Boolean(s.credit),
  typed: s.typedOnly,
}));

// Kits in catalog order (KITS), which is also the order of the install commands.
export const browseKits: BrowseKit[] = KITS.map((name) => {
  const k = getKit(name)!;
  return { name, title: k.title, version: k.version, line: KIT_GUIDE[name]?.line ?? "", count: k.skills.length };
}).filter((k) => kits.some((x) => x.name === k.name));

// Authors of one kit's skills, Agent Kit first, then by how many skills each wrote.
export function kitAuthors(kit: string) {
  const m = new Map<string, number>();
  for (const s of browseSkills) if (s.kit === kit) m.set(s.author, (m.get(s.author) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => (a[0] === AGENT_KIT ? -1 : b[0] === AGENT_KIT ? 1 : b[1] - a[1])).map(([a]) => a);
}

// "A, B and C" or "A, B, C and 4 others".
export function nameList(names: string[], max = 3) {
  if (names.length <= 1) return names[0] ?? "";
  if (names.length <= max) return `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
  const rest = names.length - max;
  return `${names.slice(0, max).join(", ")} and ${rest} ${rest === 1 ? "other" : "others"}`;
}

// Agents with a documented install path, straight from AGENTS. `tested` is the recorded clean-environment run, or null.
export const agentSupport = AGENTS.filter((a) => a.id !== "any").map((a) => ({
  id: a.id, label: a.label, tested: a.tested, scope: a.testedScope ?? null, plugin: a.id === "claude" || a.id === "codex",
}));
