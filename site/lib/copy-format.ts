// How a prompt page lays out the text its Copy button sends. Layout only: the text itself is composed once, by
// library/copy.mjs at build time, and read from the entry's payload.
//   command        exactly what you type
//   thinking       a short prompt as written
//   recipe         steps
//   plan           a page recipe
//   investigation  a prompt with what it may change, what to bring back and when to stop
export type CopyFormat = "command" | "thinking" | "recipe" | "plan" | "investigation";

export function copyFormat(e: { sec: string; steps?: unknown[] }): CopyFormat {
  if (e.sec === "ecmd" || e.sec === "dcmd") return "command";
  if (e.sec === "think") return "thinking";
  if (e.sec === "plan") return "plan";
  if (e.steps?.length) return "recipe";
  return "investigation";
}
