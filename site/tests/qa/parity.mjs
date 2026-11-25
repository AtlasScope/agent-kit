// HTTP-only regression checks of a target site against a reference site (normally a local build of
// main, which is what production runs). No browser. Checks:
//   - every URL in the reference sitemap answers on the target with the same status
//   - the sitemap URL set is unchanged
//   - title, description, canonical, robots, Open Graph, markdown alternate, h1 count and JSON-LD
//     types on every sitemap page match the reference
//   - markdown twins, llms.txt, llms-full.txt, robots.txt and install.md are byte-identical
//   - old prompt ids (/prompts/<ID>) still redirect to the same place
// Usage: node tests/qa/parity.mjs --target http://localhost:4001 --ref http://localhost:4000 [--out dir]
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { parseArgs } from "node:util";

const { values: args } = parseArgs({ options: { target: { type: "string" }, ref: { type: "string" }, out: { type: "string" }, concurrency: { type: "string", default: "8" } } });
if (!args.target || !args.ref) { console.error("need --target and --ref"); process.exit(2); }
if (!/^[1-9]\d*$/.test(args.concurrency)) { console.error("--concurrency must be a positive whole number"); process.exit(2); }
const T = args.target.replace(/\/$/, ""), R = args.ref.replace(/\/$/, "");

async function pool(items, n, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k], k); } }));
  return out;
}

async function get(base, path, redirect = "follow") {
  try {
    const res = await fetch(base + path, { redirect });
    const body = redirect === "manual" ? "" : await res.text();
    return { status: res.status, location: res.headers.get("location"), body, type: res.headers.get("content-type") || "" };
  } catch (e) { return { status: 0, error: String(e), body: "", type: "" }; }
}

// &amp; goes last, so "&amp;quot;" decodes once to "&quot;" and not on to a quote.
const attr = (html, re) => { const m = html.match(re); return m ? m[1].replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&") : null; };
function head(html) {
  const metaName = (n) => attr(html, new RegExp(`<meta[^>]+name="${n}"[^>]+content="([^"]*)"`)) ?? attr(html, new RegExp(`<meta[^>]+content="([^"]*)"[^>]+name="${n}"`));
  const metaProp = (n) => attr(html, new RegExp(`<meta[^>]+property="${n}"[^>]+content="([^"]*)"`));
  return {
    title: attr(html, /<title[^>]*>([^<]*)<\/title>/),
    description: metaName("description"),
    robots: metaName("robots"),
    canonical: attr(html, /<link[^>]+rel="canonical"[^>]+href="([^"]*)"/),
    "og:title": metaProp("og:title"),
    "og:description": metaProp("og:description"),
    "og:url": metaProp("og:url"),
    "og:image": metaProp("og:image")?.replace(/\?.*$/, ""),
    "twitter:card": metaName("twitter:card"),
    alternateMd: attr(html, /<link[^>]+type="text\/markdown"[^>]+href="([^"]*)"/) ?? attr(html, /<link[^>]+href="([^"]*)"[^>]+type="text\/markdown"/),
    h1Count: (html.match(/<h1[\s>]/g) || []).length,
    jsonLd: [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => { try { return JSON.parse(m[1])["@type"]; } catch { return "invalid"; } }).sort().join(","),
  };
}

const findings = [];
const add = (severity, check, path, detail) => findings.push({ severity, check, path, detail });

const refMap = await get(R, "/sitemap.xml");
const tgtMap = await get(T, "/sitemap.xml");
const locs = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
const refPaths = locs(refMap.body), tgtPaths = locs(tgtMap.body);
for (const p of refPaths.filter((p) => !tgtPaths.includes(p))) add("blocker", "sitemap", p, "in the reference sitemap, missing from the target's");
for (const p of tgtPaths.filter((p) => !refPaths.includes(p))) add("minor", "sitemap", p, "new in the target sitemap (check it is meant to be public)");

// Pages: status and head.
await pool(refPaths, Number(args.concurrency), async (p) => {
  const [r, t] = await Promise.all([get(R, p), get(T, p)]);
  if (r.status === 0) { add("serious", "fetch", p, `reference fetch failed: ${r.error}`); return; }
  if (t.status !== r.status) { add(t.status >= 400 || t.status === 0 ? "blocker" : "serious", "status", p, `reference ${r.status}, target ${t.status}`); return; }
  if (!r.type.includes("html")) return;
  const hr = head(r.body), ht = head(t.body);
  for (const k of Object.keys(hr)) {
    if (hr[k] === ht[k]) continue;
    const sev = ["title", "canonical", "robots", "description"].includes(k) ? "serious" : k === "h1Count" && ht[k] !== 1 ? "serious" : "moderate";
    add(sev, `meta:${k}`, p, `reference ${JSON.stringify(hr[k])}, target ${JSON.stringify(ht[k])}`);
  }
});

// Byte-identical machine files and markdown twins.
const twins = ["/robots.txt", "/llms.txt", "/llms-full.txt", "/install.md", "/index.md", "/prompts.md", "/skills.md", "/kits.md", "/fix.md",
  ...refPaths.filter((p) => /^\/(prompts|skills|kits|fix)\/[^/]+$/.test(p)).map((p) => p + ".md")];
let twinsSame = 0;
await pool(twins, Number(args.concurrency), async (p) => {
  const [r, t] = await Promise.all([get(R, p), get(T, p)]);
  if (r.status !== t.status) add("blocker", "machine-file", p, `reference ${r.status}, target ${t.status}`);
  else if (r.body !== t.body) add("blocker", "machine-file", p, `bytes differ (reference ${r.body.length}, target ${t.body.length})`);
  else twinsSame++;
});

// Old prompt ids keep redirecting (next.config.ts sends /prompts/<ID> to the slug). Ids come from this
// checkout's built content, so run `npm run content` first.
const { prompts } = JSON.parse(readFileSync(new URL("../../content/generated.json", import.meta.url), "utf8"));
const uniqueIds = prompts.map((p) => p.id);
let redirectsChecked = 0;
await pool(uniqueIds, Number(args.concurrency), async (id) => {
  const [r, t] = await Promise.all([get(R, `/prompts/${id}`, "manual"), get(T, `/prompts/${id}`, "manual")]);
  if (r.status < 300 || r.status >= 400) return;
  redirectsChecked++;
  if (t.status !== r.status || t.location !== r.location) add("blocker", "redirect", `/prompts/${id}`, `reference ${r.status} → ${r.location}, target ${t.status} → ${t.location}`);
});

const order = { blocker: 0, serious: 1, moderate: 2, minor: 3 };
findings.sort((a, b) => order[a.severity] - order[b.severity] || a.path.localeCompare(b.path));
const summary = { target: T, ref: R, pages: refPaths.length, machineFiles: twins.length, machineFilesIdentical: twinsSame, redirectsChecked, findings: findings.length,
  bySeverity: Object.fromEntries(Object.keys(order).map((s) => [s, findings.filter((f) => f.severity === s).length])) };
console.log(JSON.stringify(summary, null, 2));
for (const f of findings.slice(0, 40)) console.log(`${f.severity.padEnd(8)} ${f.check.padEnd(18)} ${f.path}  ${f.detail}`);
if (args.out) { mkdirSync(args.out, { recursive: true }); writeFileSync(`${args.out}/parity.json`, JSON.stringify({ summary, findings }, null, 2)); }
process.exitCode = findings.some((f) => f.severity === "blocker") ? 1 : 0;
