import "server-only";
import { get } from "@vercel/edge-config";
import { sql } from "./db";

// Limits for the public MCP server (ADR 0003). The per-visitor limit that matters is the Vercel
// Firewall rate-limit rule on /mcp; everything here works without it.
//   off switch   Edge Config item `mcp_enabled: false` (instant, no redeploy) or MCP_ENABLED=false
//   per-IP       MCP_PER_MINUTE calls a minute per visitor, per running instance (backstop)
//   daily cap    MCP_DAILY_CAP calls a UTC day across all instances, counted in Neon
//   alerts       at 50%, 80% and 100% of the cap: a log line, plus MCP_ALERT_WEBHOOK if set

const num = (v: string | undefined, d: number) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? Math.floor(n) : d; };

function rpcError(status: number, message: string, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32000, message } }), {
    status, headers: { "content-type": "application/json", "cache-control": "no-store", ...headers },
  });
}

// consistentRead skips the copy of Edge Config the platform keeps next to the function and reads
// the live value, so flipping the switch takes effect without a redeploy. The 10s cache below
// keeps this to one read per instance every 10 seconds.
let switchCache: { on: boolean; at: number } | null = null;
async function enabled() {
  if (process.env.MCP_ENABLED === "false") return false;
  if (!process.env.EDGE_CONFIG) return true;
  if (switchCache && Date.now() - switchCache.at < 10_000) return switchCache.on;
  let on = true;
  try { on = (await get("mcp_enabled", { consistentRead: true })) !== false; }
  catch (e) { console.error("mcp: Edge Config read failed, staying on", e); }
  switchCache = { on, at: Date.now() };
  return on;
}

const hits = new Map<string, { n: number; reset: number }>();
function ipOf(req: Request) {
  return (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
}
function overIpLimit(req: Request) {
  const limit = num(process.env.MCP_PER_MINUTE, 60);
  const now = Date.now(), ip = ipOf(req);
  let h = hits.get(ip);
  if (!h || h.reset <= now) { h = { n: 0, reset: now + 60_000 }; hits.set(ip, h); }
  h.n++;
  if (hits.size > 5000) for (const [k, v] of hits) if (v.reset <= now) hits.delete(k);
  return h.n > limit ? Math.ceil((h.reset - now) / 1000) : 0;
}

async function alert(text: string) {
  console.warn(`mcp: ${text}`);
  const url = process.env.MCP_ALERT_WEBHOOK;
  if (!url) return;
  try {
    await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text, content: text }), signal: AbortSignal.timeout(2000) });
  } catch (e) { console.error("mcp: alert webhook failed", e); }
}

async function overDailyCap() {
  if (!process.env.DATABASE_URL) return false;
  const cap = num(process.env.MCP_DAILY_CAP, 20000);
  let calls: number;
  try {
    const rows = await sql()`insert into mcp_usage (day, calls) values (current_date, 1)
      on conflict (day) do update set calls = mcp_usage.calls + 1 returning calls`;
    calls = Number(rows[0].calls);
  } catch (e) { console.error("mcp: usage count failed, letting the call through", e); return false; }
  for (const [share, label] of [[0.5, "50%"], [0.8, "80%"], [1, "100%"]] as const) {
    if (calls === Math.ceil(cap * share)) await alert(`Agent Kit MCP server reached ${label} of its daily cap (${calls} of ${cap} calls today, UTC).`);
  }
  return calls > cap;
}

// Returns an error Response to send instead of handling the call, or null to go ahead.
export async function guard(req: Request): Promise<Response | null> {
  if (!(await enabled())) return rpcError(503, "The Agent Kit MCP server is paused. The website still works.", { "retry-after": "3600" });
  if (req.method !== "POST") return null;
  const wait = overIpLimit(req);
  if (wait) return rpcError(429, "Too many calls from this address. Try again in a minute.", { "retry-after": String(wait) });
  if (await overDailyCap()) return rpcError(429, "Daily limit reached, back at 00:00 UTC.", { "retry-after": "3600" });
  return null;
}
