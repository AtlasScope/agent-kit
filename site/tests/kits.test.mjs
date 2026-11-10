// The homepage lists every kit with what it adds and the commands that start it. Keep that list true to the catalog.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { KITS, KIT_GUIDE } from "../lib/site.ts";

const { kits, skills } = createRequire(import.meta.url)("../content/generated.json");

test("every kit in the catalog is installed and described on the homepage", () => {
  assert.deepEqual([...KITS].sort(), kits.map((k) => k.name).sort());
  for (const k of kits) assert.ok(KIT_GUIDE[k.name]?.line.trim(), `${k.name} has no line on the homepage`);
});

test("every command shown for a kit is a skill that kit ships", () => {
  for (const [kit, g] of Object.entries(KIT_GUIDE)) {
    assert.ok(g.type.length > 0, `${kit} shows no command`);
    for (const cmd of g.type) {
      const name = cmd.replace(/^\//, "").replace(/^[^:]+:/, "");
      assert.ok(skills.some((s) => s.kit === kit && s.name === name), `${cmd} is not a skill in ${kit}`);
    }
  }
});
