// What the Copy button sends to an agent. Kept free of imports so tests can run it with plain Node.
// One format per kind of entry:
//   command        exactly what you type, nothing added
//   thinking       the short prompt as written
//   recipe         the steps, plus what to do when a step's plugin isn't installed
//   investigation  the prompt, plus the mode, the evidence to return and the known trap
export type CopyFields = {
  sec: string; t: string; p?: string; cmd?: string; mode?: string; iso?: boolean;
  ev?: string; avoid?: string; blind?: string; steps?: [string, string][]; flow?: unknown;
};

export type CopyFormat = "command" | "thinking" | "recipe" | "investigation";

export function copyFormat(e: CopyFields): CopyFormat {
  if (e.sec === "ecmd" || e.sec === "dcmd") return "command";
  if (e.sec === "think") return "thinking";
  if (e.steps?.length) return "recipe";
  return "investigation";
}

// How each mode limits what the agent may do. Written to the agent, not about it.
export const MODE_RULE: Record<string, string> = {
  read: "Read-only: don't change code, data or settings. Report what you find.",
  repro: "Don't fix anything yet. You may add one test that shows the problem; leave everything else unchanged.",
  change: "Show the evidence before you change anything, and ask me before you apply a fix.",
};
const ISO_RULE = "Work on a separate copy or branch, never on the live system.";
// Read-only entries that ask for a rebuild or replay: production stays untouched, the separate copy may change.
export const ISO_READ_RULE =
  "Don't change code, data or settings on the live system. Run any rebuild, replay or test on a separate copy you're allowed to change, and report what you find.";
export const RECIPE_FALLBACK = "If a command in these steps isn't installed, tell me which one and stop before that step.";

const clean = (s?: string) => (s || "").trim();
const sentence = (s: string) => (/[.!?)]$/.test(s) ? s : s + ".");

export function composeCopy(e: CopyFields): string {
  const f = copyFormat(e);
  if (f === "command") return clean(e.sec === "ecmd" ? e.cmd || e.p : e.p || e.cmd) || e.t;
  const body = clean(e.p || e.cmd) || e.t;
  if (f === "thinking") return body;
  if (f === "recipe") return body.includes(RECIPE_FALLBACK) ? body : `${body}\n\n${RECIPE_FALLBACK}`;
  const extra: string[] = [];
  const rule = e.mode && MODE_RULE[e.mode];
  // Workflow entries (flow) already carry their own step-by-step rules in the body.
  if (rule && !e.flow) extra.push(!e.iso ? rule : e.mode === "read" ? ISO_READ_RULE : `${rule} ${ISO_RULE}`);
  if (clean(e.ev)) extra.push(`Give me: ${sentence(clean(e.ev))}`);
  const trap = clean(e.avoid) || clean(e.blind);
  if (trap) extra.push(`${e.avoid ? "Avoid" : "Watch for"}: ${sentence(trap)}`);
  return extra.length ? `${body}\n\n${extra.join("\n")}` : body;
}
