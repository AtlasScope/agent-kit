// Plain markdown for every page: the .md twins, llms.txt, llms-full.txt and the MCP server all use these.
import { SITE, AGENTS } from "./site";
import {
  type Prompt, type Skill, type Kit, type Fix, type Area,
  prompts, skills, kits, fixes, areas, sections, counts, getPrompt, getSkill, getArea,
  copyText, kindLabel, skillInstall, MODES, TOPO,
} from "./content";

const u = (p: string) => `${SITE.url}${p}`;
const fence = (t: string) => "```text\n" + t + "\n```";
const promptLink = (slug: string) => { const p = getPrompt(slug); return p ? `- [${p.t}](${u(`/prompts/${slug}`)})${p.why ? `: ${p.why}` : ""}` : ""; };
const skillLink = (name: string) => { const s = getSkill(name); return s ? `- [${s.name}](${u(`/skills/${name}`)}): ${s.description.split(/(?<=\.)\s/)[0]}` : ""; };

export function promptMd(p: Prompt) {
  const area = getArea(p.area)!;
  const out = [`# ${p.t}`, "", `${kindLabel(p)} · ${area.title} · ${p.id}`, ""];
  if (p.why || p.use) out.push(p.why || p.use || "", "");
  if (p.steps) out.push("## Steps", "", p.steps.map(([c, d], i) => `${i + 1}. \`${c}\`: ${d}`).join("\n"), "");
  out.push(`## ${p.steps ? "As one prompt" : p.sec === "ecmd" ? "Command" : "Prompt"}`, "", fence(copyText(p)), "");
  const facts: [string, string | undefined][] = [
    ["What it returns", p.ev], ["Skip it when", p.skip || p.skipw], ["Avoid", p.avoid], ["Tools", p.tools], ["Works on", p.plat],
    ["Watch for", p.blind], ["Best for", p.best], ["Changes", p.mode ? (p.iso ? "Tests on a separate copy" : MODES[p.mode]) : undefined],
    ["Sessions", p.top ? TOPO[p.top] : undefined], ["Notes", p.note],
  ];
  for (const [k, v] of facts) if (v) out.push(`**${k}:** ${v}`, "");
  if (p.src) out.push(`**Original post:** ${p.src}`, "");
  if (p.skills.length) out.push("## Skills", "", ...p.skills.map(skillLink), "");
  if (p.related.length) out.push("## Related", "", ...p.related.map(promptLink), "");
  out.push(`Source: ${u(`/prompts/${p.slug}`)}`);
  return out.join("\n");
}

export function skillMd(s: Skill, full = true) {
  const i = skillInstall(s);
  const out = [`# ${s.name}`, "", s.description, "", `Kit: [${s.kit}](${u(`/kits/${s.kit}`)})`, ""];
  if (s.credit) {
    const c = s.credit;
    out.push(`Written by ${c.author}. Source: [${c.repo}](${c.url}), copied at commit \`${c.commit}\`. License: ${c.license}. ${c.change ? `Change in Agent Kit: ${c.change}` : "Copied unchanged."}`, "");
  } else out.push("Written for Agent Kit. License: MIT, © AtlasScope.", "");
  out.push("## Install", "", "```sh", i.any, "```", "", "Claude Code:", "", "```sh", `claude plugin marketplace add ${SITE.repoSlug}`, i.claude, "```", "");
  if (full) out.push("## SKILL.md", "", s.bodyMd, "");
  if (s.files.length) out.push(`Other files in the skill folder: ${s.files.join(", ")}. Browse them at ${SITE.repo}/tree/main/${s.sourcePath}`, "");
  if (full && s.license) out.push("## License", "", fence(s.license), "");
  out.push(`Source: ${u(`/skills/${s.name}`)}`);
  return out.join("\n");
}

export function kitMd(k: Kit) {
  return [
    `# ${k.title}`, "", k.description, "", `Version ${k.version}.`, "",
    "## Install", "", "```sh", `claude plugin marketplace add ${SITE.repoSlug}`, `claude plugin install ${k.name}@agent-kit`, "```", "",
    `## Skills (${k.skills.length})`, "", ...k.skills.map(skillLink), "", `Source: ${u(`/kits/${k.name}`)}`,
  ].join("\n");
}

export function fixMd(f: Fix) {
  return [`# ${f.title}`, "", `Prompts to start with when ${f.scope === "database" ? "a PostgreSQL database" : "a codebase"} shows this problem.`, "", ...f.prompts.map(promptLink), "", `Source: ${u(`/fix/${f.slug}`)}`].join("\n");
}

export function areaMd(a: Area) {
  return [`# ${a.title}`, "", a.blurb || sections.find((s) => s.id === a.sec)!.blurb, "", ...a.prompts.map(promptLink), "", `Source: ${u(`/prompts/${a.slug}`)}`].join("\n");
}

export function promptsIndexMd() {
  const out = ["# Prompts", "", `${counts.prompts} prompts, commands and recipes for coding and design agents.`, ""];
  for (const s of sections) {
    out.push(`## ${s.title}`, "", s.blurb, "");
    for (const a of areas.filter((x) => x.sec === s.id)) out.push(`- [${a.title}](${u(`/prompts/${a.slug}`)}) (${a.prompts.length})`);
    out.push("");
  }
  return out.join("\n");
}
export const skillsIndexMd = () => ["# Skills", "", `${counts.skills} skills; ${counts.borrowed} were written by other authors and keep their licenses.`, "", ...skills.map((s) => skillLink(s.name))].join("\n");
export const kitsIndexMd = () => ["# Kits", "", ...kits.map((k) => `- [${k.title}](${u(`/kits/${k.name}`)}): ${k.description}`)].join("\n");
export const fixIndexMd = () => ["# Fix a problem", "", "Pick the symptom that matches; each page lists the prompts to try first.", "", ...fixes.map((f) => `- [${f.title}](${u(`/fix/${f.slug}`)})`)].join("\n");

export function homeMd() {
  return [
    `# ${SITE.name} ${SITE.byline}`, "",
    `${counts.skills} skills and ${counts.prompts} prompts for AI coding agents. ${counts.borrowed} of the skills were written by other authors and keep their licenses.`, "",
    "## Install", "", ...AGENTS.map((a) => `- ${a.label}: ${a.steps.map((c) => `\`${c}\``).join(", then ")}. ${a.check}${a.tested ? ` Tested with ${a.tested}.` : " Not tested yet."}`), "",
    "## Sections", "", `- [Prompts](${u("/prompts")})`, `- [Skills](${u("/skills")})`, `- [Kits](${u("/kits")})`, `- [Fix a problem](${u("/fix")})`, "",
    `MCP server: ${u("/mcp")}`,
  ].join("\n");
}

export function llmsTxt() {
  const top = prompts.filter((p) => p.sec === "inv" || p.sec === "db").filter((p) => (p as { imp?: string }).imp === "H" || p.id === "PG00").slice(0, 40);
  return [
    `# ${SITE.name}`, "",
    `> ${counts.skills} skills and ${counts.prompts} prompts for AI coding agents (Claude Code, Codex, Cursor and any agent that reads Agent Skills). Every page is public and has a markdown twin at the same URL plus .md.`, "",
    `Install: \`${AGENTS[0].cmd}\`. Public read-only MCP server: ${u("/mcp")}. Everything in one file: ${u("/llms-full.txt")}.`, "",
    "## Kits", "", ...kits.map((k) => `- [${k.title}](${u(`/kits/${k.name}.md`)}): ${k.description}`), "",
    "## Fix a problem", "", ...fixes.map((f) => `- [${f.title}](${u(`/fix/${f.slug}.md`)})`), "",
    "## Prompt areas", "", ...areas.filter((a) => ["inv", "db", "think", "recipe"].includes(a.sec)).map((a) => `- [${a.title}](${u(`/prompts/${a.slug}.md`)}): ${a.prompts.length} prompts`), "",
    "## Key prompts", "", ...top.map((p) => `- [${p.t}](${u(`/prompts/${p.slug}.md`)}): ${p.why}`), "",
    "## Skills", "", ...skills.map((s) => `- [${s.name}](${u(`/skills/${s.name}.md`)})${s.credit ? ` by ${s.credit.author}` : ""}`), "",
    "## Optional", "", `- [Source on GitHub](${SITE.repo})`, `- [Credits](${SITE.repo}/blob/main/CREDITS.md)`,
  ].join("\n");
}

export function llmsFullTxt() {
  return [homeMd(), ...kits.map(kitMd), ...fixes.map(fixMd), ...prompts.map(promptMd), ...skills.map((s) => skillMd(s, true))].join("\n\n---\n\n");
}
