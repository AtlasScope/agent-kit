#!/usr/bin/env node
// Writes the /database router's reference from the prompt library, so the prompts live in one place.
// Usage, from the repo root: node kits/engineering-kit/scripts/build_database_references.mjs
// Reads library/library.json and writes kits/engineering-kit/plugins/engineering-kit/skills/database/references/prompts.md.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const lib = JSON.parse(fs.readFileSync(path.join(root, "library/library.json"), "utf8"));
const out = path.join(root, "kits/engineering-kit/plugins/engineering-kit/skills/database/references/prompts.md");
const BY = Object.fromEntries(lib.entries.map((e) => [e.id, e]));
const db = lib.entries.filter((e) => e.sec === "db");
const ids = (a) => a.map((x) => `\`${x}\``).join(", ");

let s = "# Database prompts\n\nGenerated from `library/library.json` by `kits/engineering-kit/scripts/build_database_references.mjs`; do not edit by hand.\n";
s += "\nEvery prompt is read-only unless marked otherwise, and works on any PostgreSQL host. Read only the entries you are weighing.\n";
let group = null;
for (const e of db.filter((x) => !x.flow)) {
  if (e.group !== group) { group = e.group; s += `\n## ${group}\n\n${lib.areaBlurb?.[group] || ""}\n`; }
  s += `\n### ${e.id} ${e.t}\n\n\`\`\`text\n${e.p}\n\`\`\`\n\n`;
  s += `- When: ${e.why}\n- Evidence to ask for: ${e.ev}\n- Skip when: ${e.skip}\n- Avoid: ${e.avoid}\n- Needs: ${e.tools.replace(/^Needs: /, "")}\n`;
  s += `- Mode: ${e.iso ? "read-only on production; any rebuild, replay or migration test runs on a separate database the user approves" : "read-only"}.\n`;
  if (e.refs?.length) s += `- Tools that can help: ${e.refs.map((k) => lib.dbTools[k][0]).join(", ")}\n`;
  s += `- Related: ${ids(e.rel.filter((r) => BY[r]))}\n`;
}
s += "\n## Workflows\n\nRoutes for a whole job. Offer one only when the user asks for the whole job, not for a single question.\n";
for (const e of db.filter((x) => x.flow)) {
  s += `\n### ${e.id} ${e.t}\n\n${e.why}\n\n`;
  for (const [label, list, note] of e.flow) s += `- ${label}: ${list.length ? ids(list) + ". " : ""}${note}\n`;
}
s += "\n## Related prompts from the investigations\n\nThese live in the /engineer catalog. Use them when the routing table names them.\n\n";
const outside = [...new Set(db.flatMap((e) => e.rel || []).filter((r) => BY[r] && BY[r].sec !== "db"))].sort();
for (const r of outside) s += `- \`${r}\` ${BY[r].t}: ${BY[r].why}\n`;
s += `\n## Tools\n\nInstall steps last checked ${lib.dbToolsVerified}. Check the linked page before telling the user a command is current. None of these is installed by this plugin.\n\n`;
for (const [, [name, url, what]] of Object.entries(lib.dbTools)) s += `- [${name}](${url}): ${what}\n`;
s += "\n## Wrapping a prompt\n\nSend the prompt as written, then the mode line, then the evidence line:\n\n";
for (const [k, [label, text]] of Object.entries(lib.composer.mode)) s += `- \`${k}\` (${label}): ${text}\n`;
s += "\nFor prompts marked as testing on a separate database, add: Anything that changes state, such as a rebuild, replay or migration test, runs only on a separate database with safe test data, never on production.\n";

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, s);
console.log(`Wrote ${db.length} entries to ${path.relative(root, out)}`);
