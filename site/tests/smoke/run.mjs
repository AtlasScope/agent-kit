// One normal Next server for all public journeys; one isolated fixture server for account mutations.
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { once } from "node:events";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const site = fileURLToPath(new URL("../../", import.meta.url));
const next = fileURLToPath(new URL("../../node_modules/next/dist/bin/next", import.meta.url));
const hostname = "127.0.0.1";

async function freePort() {
  const socket = createServer();
  socket.listen(0, hostname);
  await once(socket, "listening");
  const port = socket.address().port;
  await new Promise((resolve, reject) => socket.close(err => err ? reject(err) : resolve()));
  return port;
}

async function startServer(fixtures) {
  const port = await freePort();
  const url = `http://${hostname}:${port}`;
  // Every smoke file calls from one address, and the delivery smoke asks the MCP server about every prompt, so a
  // local server lifts the per-visitor MCP limit unless the caller sets one. It never reaches real services: a
  // developer's shell may export the production database, Edge Config, Clerk or alert settings, and test traffic
  // must not count against, alert on or change them.
  const live = new Set([
    "DATABASE_URL", "DATABASE_URL_UNPOOLED", "EDGE_CONFIG", "CLERK_SECRET_KEY",
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "MCP_ALERT_WEBHOOK", "MCP_BACKGROUND_WEBHOOK", "MCP_INBOX_WEBHOOK",
  ]);
  const env = { ...Object.fromEntries(Object.entries(process.env).filter(([k]) => !live.has(k))), ACCOUNT_FIXTURES: fixtures ? "1" : "0", VERCEL_ENV: "production", MCP_PER_MINUTE: process.env.MCP_PER_MINUTE || "100000" };
  const child = spawn(process.execPath, [next, "start", "--hostname", hostname, "--port", String(port)], {
    cwd: site, env, stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "", ended = false;
  for (const stream of [child.stdout, child.stderr]) stream.on("data", chunk => {
    output = (output + chunk).slice(-12000);
  });
  const finished = new Promise(resolve => {
    child.once("exit", () => { ended = true; resolve(); });
    child.once("error", err => { output += String(err); ended = true; resolve(); });
  });
  async function close() {
    if (ended) return;
    child.kill();
    const timer = setTimeout(() => { if (!ended) child.kill("SIGKILL"); }, 5000);
    timer.unref();
    try { await finished; } finally { clearTimeout(timer); }
  }
  try {
    const deadline = Date.now() + 30000;
    while (!ended && Date.now() < deadline) {
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
        await res.body?.cancel();
        if (res.ok && !ended) return { url, close };
      } catch {}
      await delay(250);
    }
    throw new Error(`next start did not become ready at ${url}; run npm run build first.\n${output}`);
  } catch (err) {
    await close();
    throw err;
  }
}

// Individual files remain runnable via node --test; the suite runner supplies shared targets.
export async function smokeTarget({ fixtures = false } = {}) {
  const external = fixtures ? process.env.SMOKE_ACCOUNT_URL || process.env.SMOKE_URL : process.env.SMOKE_URL;
  return external ? { url: external.replace(/\/$/, ""), close: async () => {} } : startServer(fixtures);
}

async function run() {
  const servers = [];
  let child, interrupted;
  const interrupt = signal => {
    interrupted = signal;
    child?.kill(signal);
  };
  const onInt = () => interrupt("SIGINT"), onTerm = () => interrupt("SIGTERM");
  process.on("SIGINT", onInt);
  process.on("SIGTERM", onTerm);
  try {
    const env = { ...process.env };
    if (!env.SMOKE_URL) {
      const target = await startServer(false);
      servers.push(target);
      env.SMOKE_URL = target.url;
      if (!env.SMOKE_ACCOUNT_URL) {
        const account = await startServer(true);
        servers.push(account);
        env.SMOKE_ACCOUNT_URL = account.url;
      }
    }
    if (interrupted) return interrupted === "SIGINT" ? 130 : 143;
    child = spawn(process.execPath, ["--test", "tests/smoke/*.smoke.mjs", ...process.argv.slice(2)], { cwd: site, env, stdio: "inherit" });
    const [code, signal] = await once(child, "exit");
    return code ?? (signal === "SIGINT" ? 130 : 1);
  } finally {
    await Promise.all(servers.map(server => server.close()));
    process.off("SIGINT", onInt);
    process.off("SIGTERM", onTerm);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  process.exitCode = await run();
}
