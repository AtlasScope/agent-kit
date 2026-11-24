import { skills, getKit } from "@/lib/content";
import { firstSentence } from "@/components/Cards";
import { AGENTS, KITS, KIT_GUIDE } from "@/lib/site";

// The small, serialisable view of the catalog that the skills browser needs. Built on the server from
// content/generated.json, so the client gets names and one line each, never the SKILL.md bodies.
export type BrowseSkill = { name: string; kit: string; line: string; text: string; author: string; borrowed: boolean; typed: boolean; cmd: string };
export type BrowseKit = { name: string; title: string; version: string; line: string; count: number };

export const AGENT_KIT = "Agent Kit";

// What a person types to run a skill. A kit whose KIT_GUIDE commands are namespaced
// (/experience-architecture:diagnose) namespaces every one of its skills, including ones KIT_GUIDE
// doesn't list (/experience-architecture:verify); every other skill runs as /<name>.
function commandFor(kit: string, name: string) {
  const namespaced = KIT_GUIDE[kit]?.type.some((t) => t.startsWith(`/${kit}:`));
  return namespaced ? `/${kit}:${name}` : `/${name}`;
}

export const browseSkills: BrowseSkill[] = skills.map((s) => ({
  name: s.name,
  kit: s.kit,
  line: firstSentence(s.description),
  // What the filter matches against: name, full description, author and kit, lower-cased once here.
  text: [s.name, s.description, s.credit?.author ?? AGENT_KIT, s.kit].join(" ").toLowerCase(),
  author: s.credit?.author ?? AGENT_KIT,
  borrowed: Boolean(s.credit),
  typed: s.typedOnly,
  cmd: commandFor(s.kit, s.name),
}));

// Kits in catalog order (KITS), which is also the order of the install commands.
// A name in KITS with no kit in the catalog is left out instead of crashing the page.
export const browseKits: BrowseKit[] = KITS.flatMap((name) => {
  const k = getKit(name);
  return k ? [{ name, title: k.title, version: k.version, line: KIT_GUIDE[name]?.line ?? "", count: k.skills.length }] : [];
});

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
