import { test } from "node:test";
import assert from "node:assert/strict";

// A star pressed while signed out is added after sign-in, once, only for that item, and not after it lapses.
test("a star chosen before sign-in is finished once, for that item, while fresh", async () => {
  const store = new Map();
  globalThis.localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
  const { saveIntent, takeIntent, INTENT_MS } = await import("../lib/intent.ts");
  saveIntent("prompt", "RC11");
  assert.equal(takeIntent("prompt", "S06"), false, "another item leaves it waiting");
  assert.equal(takeIntent("skill", "RC11"), false);
  assert.equal(takeIntent("prompt", "RC11"), true);
  assert.equal(takeIntent("prompt", "RC11"), false, "only once");
  saveIntent("skill", "design");
  assert.equal(takeIntent("skill", "design", Date.now() + INTENT_MS + 1), false, "lapsed");
  assert.equal(store.size, 0, "a lapsed intent is cleared");
});
