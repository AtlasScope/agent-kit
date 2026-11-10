#!/usr/bin/env node
// Install the skills for tools that read plain skill folders instead of Claude Code plugins.
//
//   node scripts/install-skills.mjs              Cursor (~/.cursor/skills)
//   node scripts/install-skills.mjs --codex      Codex skill folders (~/.codex/skills), if you don't use the Codex plugin
//   node scripts/install-skills.mjs --dir <path> any other skills folder
//   add --uninstall to remove what this script installed
//
// It copies the plugin to ~/.experience-architecture/plugin, then writes one folder per skill
// (experience-architecture-diagnose, -rethink, -verify, -walkthrough) with the plugin path filled in. It only ever
// overwrites or removes folders it created itself. Works on macOS, Linux and Windows (needs Node 18+).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HOME = os.homedir();
const ROOT = path.join(HOME, '.experience-architecture', 'plugin');
const MARK = '.installed-by-experience-architecture';
const SKILLS = ['diagnose', 'rethink', 'verify', 'walkthrough'];
const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const dirArg = args.includes('--dir') ? args[args.indexOf('--dir') + 1] : null;

const targets = [];
if (dirArg) targets.push(path.resolve(dirArg));
if (has('--codex')) targets.push(path.join(HOME, '.codex', 'skills'));
if (has('--cursor') || !targets.length) targets.push(path.join(HOME, '.cursor', 'skills'));

const slash = (p) => p.split(path.sep).join('/');
const ours = (d) => fs.existsSync(path.join(d, MARK));

function frontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) throw new Error('SKILL.md has no frontmatter');
  // Read the fields this file uses: plain values and ">-" folded blocks.
  const fields = {}; let key = null;
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([a-z_-]+):\s*(.*)$/);
    if (kv) { key = kv[1]; fields[key] = kv[2] === '>-' ? '' : kv[2].replace(/^"|"$/g, ''); }
    else if (key && /^\s+\S/.test(line) && !/^\s+- /.test(line)) fields[key] = (fields[key] + ' ' + line.trim()).trim();
  }
  return { fields, body: text.slice(m[0].length) };
}

function render(skill) {
  const { fields, body } = frontmatter(fs.readFileSync(path.join(SRC, 'skills', skill, 'SKILL.md'), 'utf8'));
  // Other tools only read name and description, so the "when to use" text joins the description.
  let desc = fields.description + (fields.when_to_use ? ' Use when: ' + fields.when_to_use : '');
  if (desc.length > 1024) desc = desc.slice(0, 1021).replace(/\s+\S*$/, '') + '...';
  const root = slash(ROOT);
  const where = `## Where things are\n\nThe plugin's files are in \`${root}\`. Wherever this skill says \`ea\`, run \`node ${root}/scripts/ea.mjs\`. If the request line above shows \`$ARGUMENTS\`, the request is the user's message.\n\n`;
  const text = body.replace(/## Where things are\n\n[\s\S]*?\n\n/, () => where)
    .split('${CLAUDE_PLUGIN_ROOT}').join(root)
    .replace(/!`ea /g, '`node ' + root + '/scripts/ea.mjs ');
  return `---\nname: experience-architecture-${skill}\ndescription: ${JSON.stringify(desc)}\n---\n` + text;
}

function copyPlugin() {
  if (fs.existsSync(ROOT) && !ours(ROOT)) throw new Error(`${ROOT} exists and was not created by this installer; move it aside first.`);
  fs.rmSync(ROOT, { recursive: true, force: true });
  fs.cpSync(SRC, ROOT, { recursive: true, filter: (p) => !/[\\/](evals|node_modules|\.experience-architecture)([\\/]|$)/.test(p.slice(SRC.length)) });
  fs.writeFileSync(path.join(ROOT, MARK), 'Created by scripts/install-skills.mjs\n');
}

if (has('--uninstall')) {
  for (const t of targets) for (const s of SKILLS) {
    const d = path.join(t, `experience-architecture-${s}`);
    if (ours(d)) { fs.rmSync(d, { recursive: true, force: true }); console.log('removed', d); }
  }
  if (ours(ROOT)) { fs.rmSync(ROOT, { recursive: true, force: true }); console.log('removed', ROOT); }
  process.exit(0);
}

copyPlugin();
console.log('plugin files ->', ROOT);
for (const t of targets) {
  fs.mkdirSync(t, { recursive: true });
  for (const s of SKILLS) {
    const d = path.join(t, `experience-architecture-${s}`);
    if (fs.existsSync(d) && !ours(d)) { console.error(`skipped ${d}: it exists and was not created by this installer`); process.exitCode = 1; continue; }
    fs.rmSync(d, { recursive: true, force: true });
    fs.mkdirSync(d, { recursive: true });
    fs.writeFileSync(path.join(d, 'SKILL.md'), render(s));
    fs.writeFileSync(path.join(d, MARK), 'Created by scripts/install-skills.mjs\n');
    console.log('skill ->', d);
  }
}
console.log('Done. Restart the tool, then type /experience-architecture-diagnose (or describe a navigation problem).');
