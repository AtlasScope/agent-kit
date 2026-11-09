// Best starting points: every entry they name exists, and "Changes code?" agrees with the entry's own mode.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { STARTS, CHANGES } from "../lib/starts.ts";

const data = JSON.parse(fs.readFileSync(new URL("../content/generated.json", import.meta.url), "utf8"));
const byId = new Map(data.prompts.map((p) => [p.id, p]));

// What each entry mode allows the card to say.
const ALLOWED = {
  read: ["no", "asks"], repro: ["test"], change: ["yes", "asks"],
  "Report only": ["no"], Advice: ["no"], "Changes code": ["yes"],
};

test("there are 8 to 12 starting points with unique slugs and picks", () => {
  assert.ok(STARTS.length >= 8 && STARTS.length <= 12, `${STARTS.length} starting points`);
  assert.equal(new Set(STARTS.map((s) => s.slug)).size, STARTS.length);
  assert.equal(new Set(STARTS.map((s) => s.pick)).size, STARTS.length);
});

test("every pick and alternative is a real entry", () => {
  for (const s of STARTS) for (const id of [s.pick, ...s.alts.map((a) => a.id)]) assert.ok(byId.has(id), `${s.slug}: no entry ${id}`);
});

test("each card answers all four questions", () => {
  for (const s of STARTS) {
    for (const k of ["job", "useWhen", "youGet", "requires"]) assert.ok(s[k]?.trim(), `${s.slug}: empty ${k}`);
    assert.ok(CHANGES[s.changes], `${s.slug}: unknown changes value ${s.changes}`);
    for (const a of s.alts) assert.ok(a.when.trim(), `${s.slug}: alternative ${a.id} has no "when"`);
  }
});

test("Changes code? agrees with the entry's mode", () => {
  for (const s of STARTS) {
    const p = byId.get(s.pick);
    const mode = p.iso ? null : p.mode || p.dmode;
    if (!mode) continue;
    assert.ok(ALLOWED[mode], `${s.slug}: unmapped mode ${mode}`);
    assert.ok(ALLOWED[mode].includes(s.changes), `${s.slug}: ${p.id} is "${mode}" but the card says "${s.changes}"`);
  }
});
