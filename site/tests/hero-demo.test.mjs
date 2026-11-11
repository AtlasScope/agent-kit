// The homepage hero quotes the design kit line by line. Keep every quote, range and count true to the files.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DEMO, USED_LINES } from "../lib/hero-demo.ts";

const root = new URL("../../", import.meta.url);
const read = (p) => readFileSync(new URL(p, root), "utf8").split("\n");
const skill = read(DEMO.skillFile);
const count = (lines) => (lines.at(-1) === "" ? lines.length - 1 : lines.length);
const line = (n) => skill[n - 1];

test("the request is the router row whose first pick is the skill shown", () => {
  const row = read(DEMO.routedBy.file).find((l) => l.includes(`| ${DEMO.routedBy.row} |`));
  assert.ok(row, `situations.md has a "${DEMO.routedBy.row}" row`);
  assert.equal(row.split("|")[2].trim().replaceAll("`", ""), DEMO.routedBy.pick);
  assert.equal(DEMO.routedBy.pick, `/${DEMO.skill}`);
  assert.ok(DEMO.request.includes(DEMO.why) && DEMO.request.includes(DEMO.key));
});

test("the outline is SKILL.md's headings, in order, with the lines each spans", () => {
  const heads = skill.map((l, i) => [l, i + 1]).filter(([l]) => /^#{2,3} /.test(l));
  assert.deepEqual(DEMO.outline.map((o) => o.from), heads.map(([, n]) => n), "a heading was added, removed or moved");
  DEMO.outline.forEach((o, i) => {
    assert.equal(line(o.from).replace(/^#+ /, ""), o.title);
    assert.equal(o.to, i < DEMO.outline.length - 1 ? DEMO.outline[i + 1].from - 1 : count(skill));
    assert.equal(Boolean(o.sub), line(o.from).startsWith("### "));
  });
});

test("each quoted line says what the hero shows", () => {
  const s = DEMO.outline[DEMO.section];
  for (const n of [DEMO.core.line, DEMO.row.line]) assert.ok(n >= s.from && n <= s.to, `line ${n} is inside ${s.title}`);
  assert.equal(line(DEMO.core.line), `**${DEMO.core.label}** ${DEMO.core.text}`);
  const cells = line(DEMO.row.line).split("|").map((c) => c.trim()).filter(Boolean);
  assert.deepEqual(cells, [`**${DEMO.row.context}**`, DEMO.row.technique, DEMO.row.example]);
  assert.equal(DEMO.answer.text, DEMO.row.technique);
  assert.ok(DEMO.row.example.includes(DEMO.exampleBig) && DEMO.row.example.includes(DEMO.exampleSmall));
  const m = DEMO.outline[DEMO.matches[1]];
  assert.ok(line(DEMO.alsoRow.line).includes(`"${DEMO.alsoRow.text}"`) && DEMO.alsoRow.line >= m.from && DEMO.alsoRow.line <= m.to);
  assert.ok(line(DEMO.opensAt.line).includes(`references/${DEMO.opensAt.file}`) && line(DEMO.opensAt.line).includes(DEMO.opensAt.says));
});

test("every line count is the file's real length, and the opened section is real", () => {
  const dir = DEMO.skillFile.replace(/SKILL\.md$/, "");
  for (const f of DEMO.files) assert.equal(count(read(dir + (f.name === "SKILL.md" ? f.name : `references/${f.name}`))), f.lines, f.name);
  const ref = read(`${dir}references/${DEMO.opensAt.file}`);
  assert.equal(ref[DEMO.opened.from - 1], `## ${DEMO.opened.title}`);
  assert.ok(/^## /.test(ref[DEMO.opened.to]), "the opened section ends where the next one starts");
  assert.equal(DEMO.files[1].name, DEMO.opensAt.file);
  assert.equal(USED_LINES, DEMO.files[0].lines + DEMO.files[1].lines);
});
