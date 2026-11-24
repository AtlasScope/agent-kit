// Node side of webkit/wk.py: starts it under Xvfb and sends it commands.
import { spawn } from "node:child_process";
import { createInterface } from "node:readline";

export function driver() {
  const py = process.env.WK_PYTHON || "python3";
  const proc = spawn("xvfb-run", ["-a", "-s", "-screen 0 2560x1600x24", py, new URL("./wk.py", import.meta.url).pathname], { env: { ...process.env, GDK_SCALE: "2" }, stdio: ["pipe", "pipe", "pipe"] });
  let stderr = "";
  proc.stderr.on("data", (b) => { stderr = (stderr + b).slice(-2000); });
  const rl = createInterface({ input: proc.stdout });
  const waiting = [];
  rl.on("line", (l) => { if (l.startsWith("{")) waiting.shift()?.(JSON.parse(l)); });
  // If the helper dies (no xvfb-run, PyGObject missing, a crash), fail every pending call with its stderr.
  let dead = null;
  const die = (why) => { dead = `${why}\n${stderr.split("\n").filter((l) => !/libEGL/.test(l)).slice(-12).join("\n")}`; while (waiting.length) waiting.shift()({ ok: false, error: dead }); };
  proc.on("error", (e) => die(`could not start xvfb-run: ${e.message}`));
  proc.on("exit", (code) => { if (code) die(`WebKit helper exited with code ${code}`); });
  const send = (msg) => new Promise((res) => { if (dead) return res({ ok: false, error: dead }); waiting.push(res); proc.stdin.write(JSON.stringify(msg) + "\n"); });
  const call = async (fn, ...a) => {
    const r = await send({ cmd: "call", body: `return (${fn.toString()})(...JSON.parse(a));`, args: { a } });  // wk.py JSON-encodes each argument once
    if (!r.ok) throw new Error(r.error);
    return r.value;
  };
  return { send, call, quit: () => send({ cmd: "quit" }).then(() => proc.kill()) };
}
