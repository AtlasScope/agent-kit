import test from "node:test";
import assert from "node:assert/strict";
import { SCOPES, evidencePacket, matchSubjects, parseBundle, validateBundle } from "../scripts/evidence.mjs";
import { bundle } from "./evidence-fixture.mjs";

const without = (b, key) => { const out = { ...b }; delete out[key]; return out; };

test("a bundle may use real runs, database reads, relations, the working tree and a producer", () => {
  assert.ok(SCOPES.includes("runtime-observation") && SCOPES.includes("database-snapshot"));
  assert.doesNotThrow(() => validateBundle(bundle()));
  assert.doesNotThrow(() => validateBundle(without(bundle(), "producer")), "producer is optional");
  for (const revision of ["a".repeat(40), "0123456789abcdef".repeat(4)]) assert.doesNotThrow(() => validateBundle({ ...bundle(), project: { repository: "example/shop", revision } }));
  assert.doesNotThrow(() => validateBundle({ ...bundle(), producer: { capability: "engineer", at: "2026-11-25T10:04:05.123Z" } }));
});

test("anything outside the contract is refused", () => {
  const bad = [
    [(b) => { b.sources[0].scope = "production"; }, /Invalid evidence source/],
    [(b) => { b.subjects[1].kind = "table"; }, /Invalid subject/],
    [(b) => { b.subjects[0].key = "../secrets.txt"; }, /Invalid repository path/],
    [(b) => { b.extra = true; }, /Invalid bundle shape/],
    [(b) => { b.decisions[0].state = "approved"; }, /Invalid proposed decision/],
  ];
  for (const revision of ["main", "HEAD", "abc1234", "A".repeat(40), "a".repeat(39), "Working-Tree", ""]) bad.push([(b) => { b.project.revision = revision; }, /Repository snapshot required/]);
  for (const producer of [{ capability: "database" }, { at: "2026-11-25T10:04:05Z" }, { capability: "database", at: "2026-11-25 10:04:05" }, { capability: "database", at: "2026-11-25T10:04:05+01:00" }, { capability: "database", at: "2026-02-30T10:04:05Z" }, { capability: "data base", at: "2026-11-25T10:04:05Z" }, { capability: "database", at: "2026-11-25T10:04:05Z", by: "x" }, "database"]) bad.push([(b) => { b.producer = producer; }, /Invalid producer/]);
  for (const [spoil, message] of bad) { const b = bundle(); spoil(b); assert.throws(() => validateBundle(b), message, JSON.stringify(b.project) + JSON.stringify(b.producer)); }
});

test("evidence from another scope can give context to a claim but never support or refute it", () => {
  const b = bundle();
  b.claims[0].links[1].relation = "supports"; // a database read supporting a claim about the code
  assert.throws(() => validateBundle(b), /Cross-scope/);
  const open = bundle();
  open.claims[3].status = "supported"; // context alone cannot make a claim supported
  assert.throws(() => validateBundle(open), /needs support/);
});

test("a packet holds the chosen claims and only what they rest on, and stays a valid bundle", () => {
  const b = bundle();
  const one = evidencePacket(b, ["stored-net"]);
  assert.deepEqual(one.claims.map((c) => c.id), ["stored-net"]);
  assert.deepEqual(one.observations.map((o) => o.id), ["o-stored"]);
  assert.deepEqual(one.sources.map((s) => s.id), ["db"]);
  assert.deepEqual(one.subjects.map((s) => s.id), ["orders-total"]);
  assert.deepEqual(one.decisions, [], "a proposal travels only with all of its claims");
  assert.deepEqual(one.producer, b.producer);
  assert.match(one.title, /review only/);
  assert.deepEqual(parseBundle(JSON.stringify(one)), one);

  const both = evidencePacket(b, ["pre-discount", "stored-net"]);
  assert.deepEqual(both.decisions.map((d) => d.id), ["use-stored"]);
  assert.equal(both.decisions[0].state, "proposed");
  assert.deepEqual(both.observations.map((o) => o.id), ["o-sum", "o-stored"], "context observations come along");
  assert.equal(both.claims[0].limits, b.claims[0].limits);
  assert.throws(() => evidencePacket(b, []), /Select at least one claim/);
  assert.throws(() => evidencePacket(b, ["nope"]), /Unknown claim/);
});

test("subjects match only at the same revision", () => {
  assert.equal(matchSubjects(bundle(), bundle()).length, 3);
  const other = bundle();
  other.project.revision = "f".repeat(40);
  assert.equal(matchSubjects(bundle(), other).length, 0);
});
