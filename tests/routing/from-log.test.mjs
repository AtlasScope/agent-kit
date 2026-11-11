import { test } from "node:test";
import assert from "node:assert/strict";
import { draftsFromLog } from "./from-log.mjs";

test("pairs each pick with the outcome line that follows it", () => {
  const log = [
    '{"at":"2026-11-11T10:00:00Z","router":"/design","request":"the type feels off","route":"/web-typography","auto":false}',
    '{"at":"2026-11-11T10:01:00Z","router":"/design","outcome":"redirected","to":"a full critique"}',
    '{"at":"2026-11-11T11:00:00Z","router":"/engineer","request":"/engineer tests pass but prod breaks","route":"T01","auto":true}',
    "{not json",
  ].join("\n");
  const drafts = draftsFromLog(log);
  assert.equal(drafts.length, 2);
  assert.equal(drafts[0].request, "/design the type feels off");
  assert.equal(drafts[0].outcome, "redirected");
  assert.equal(drafts[0].asked_for_instead, "a full critique");
  assert.equal(drafts[1].request, "/engineer tests pass but prod breaks");
  assert.equal(drafts[1].outcome, "unknown");
  assert.equal(drafts[1].started_on_its_own, true);
});
