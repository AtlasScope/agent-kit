// What the running site serves an agent: every prompt's Markdown twin, the MCP server's get_prompt and, for recipes,
// get_recipe carry exactly the payload the content build composed with library/copy.mjs, so a prompt fetched by an
// agent says the same about what it may change as the page and the portable library. No browser needed.
//   npm run build && npm run smoke
// Set SMOKE_URL to test a running site instead; a deployed one limits MCP calls per visitor, so use a local build.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { smokeTarget } from "./run.mjs";
import { createRequire } from "node:module";

const data = createRequire(import.meta.url)("../../content/generated.json");
let target, base;

before(async () => {
  target = await smokeTarget();
  base = target.url;
});

after(async () => { await target?.close(); });

async function tool(name, args) {
  const res = await fetch(`${base}/mcp`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } }),
  });
  const body = await res.text();
  assert.equal(res.status, 200, `${name} ${JSON.stringify(args)}: ${body.slice(0, 200)}`);
  const line = body.split("\n").find((l) => l.startsWith("data: "));
  return JSON.parse(line ? line.slice(6) : body).result.content[0].text;
}

const fences = (md, heading) => [...md.matchAll(new RegExp(`^${heading}\\n\\n\`\`\`text\\n([\\s\\S]*?)\\n\`\`\`$`, "gm"))].map((m) => m[1]);

test("every prompt's Markdown twin and MCP answer carry its payload", async () => {
  for (const p of data.prompts) {
    const res = await fetch(`${base}/prompts/${p.slug}.md`);
    assert.equal(res.status, 200, `${p.slug}.md`);
    const twin = await res.text();
    assert.equal(`${await tool("get_prompt", { slug: p.slug })}\n`, twin, `${p.id}: get_prompt and the twin differ`);
    if (p.split) {
      // Run step by step: the twin prints each prompt step's own copy.
      assert.deepEqual(fences(twin, "### Step \\d+: [^\\n]*"), p.planSteps.filter((s) => s.copy && s.kind === "prompt").map((s) => s.copy), p.id);
    } else {
      assert.deepEqual(fences(twin, "## (?:Prompt|As one prompt|Command)"), [p.payload], `${p.id}: the twin's copy block`);
    }
    if (p.sec === "plan" || p.sec === "recipe") {
      assert.ok((await tool("get_recipe", { id: p.slug })).endsWith("```text\n" + p.payload + "\n```"), `${p.id}: get_recipe's copy`);
    }
  }
});
