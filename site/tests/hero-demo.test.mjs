// The homepage hero quotes the kits line by line. Keep every router line, line number and quote true to the files,
// and keep each request a routing case that expects the same pick first.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { EXAMPLES } from "../lib/hero-demo.ts";

const root = new URL("../../", import.meta.url);
const read = (p) => readFileSync(new URL(p, root), "utf8").split("\n");
const at = (l) => read(l.file)[l.line - 1] ?? "";
const plain = (s) => s.replaceAll("’", "'");
const { cases } = JSON.parse(readFileSync(new URL("tests/routing/cases.json", root), "utf8"));

for (const ex of EXAMPLES) {
  test(`${ex.id}: the router's own line names the pick`, () => {
    const line = at(ex.because);
    assert.ok(line.includes(ex.because.text), `${ex.because.file}:${ex.because.line} says "${ex.because.text}"`);
    assert.ok(line.includes(`/${ex.pick}`) || line.includes(`\`${ex.pick}\``), `${ex.because.file}:${ex.because.line} picks ${ex.pick}`);
  });

  test(`${ex.id}: every quoted line says what the hero shows`, () => {
    for (const l of [ex.answer, ...ex.trail]) assert.ok(at(l).includes(l.text), `${l.file}:${l.line} contains "${l.text}"`);
    if (ex.answer.example) for (const s of [ex.answer.example.big, ex.answer.example.small]) assert.ok(at(ex.answer).includes(s));
    assert.ok(ex.trail.some((l) => l.file === ex.answer.file && l.line === ex.answer.line), "the trail includes the answer's line");
    assert.equal(ex.trail[0].file, ex.because.file); assert.equal(ex.trail[0].line, ex.because.line);
  });

  test(`${ex.id}: the request is a routing case whose first pick is the same`, () => {
    const c = cases.find((x) => x.id === ex.case);
    assert.ok(c, `tests/routing/cases.json has ${ex.case}`);
    assert.equal(plain(c.request), plain(`${ex.router} ${ex.request}`));
    assert.equal(c.expect[0].replace(/^\//, ""), ex.pick);
  });
}
