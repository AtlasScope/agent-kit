// What every Copy button gives for a library item, wherever it is copied from: the portable library page and its
// Markdown cheat sheet (library/build.mjs), and the website with its Markdown twins and MCP server
// (site/scripts/build-content.mjs). One implementation, so a prompt never carries different permissions because
// of where it was copied. What an investigation may change comes only from library.json's composer: the line for
// its mode, plus composer.iso when it tests on a separate database. Node standard library only, no imports.
//
//   command (ecmd, dcmd, keen)  what you type: a command's name, or a design command's example
//   way of working (think)      the prompt as written
//   older recipe (recipe)       its steps as one prompt, plus what to do when a step's plugin is missing
//   page recipe (v3.recipes)    its own one-chat text; run step by step, what its first step copies
//   workflow (flow)             its text, the safeguards of the investigations it uses, then the plain-English report line
//   investigation (inv, db)     the prompt, then what it may change, what to bring back, the trap, when to stop
//                               and a report that starts in plain English

export const PLAIN_REPORT = "Start your report in plain English: what you found, what it means, and whether I need to do anything. Put files, lines and commands underneath.";
export const STOP_LEAD = "If this describes the project, say so and stop instead:";
export const RECIPE_FALLBACK = "If a command in these steps isn't installed, tell me which one and stop before that step.";
const RECIPE_RUN = "Run these steps one at a time. After each one, tell me what you found or changed and wait for my yes before starting the next. Steps that only investigate must not change anything.";

const clean = (s) => String(s ?? "").trim();
const sentence = (s) => (/[.!?)]$/.test(s) ? s : s + ".");
const isCommand = (e) => e.sec === "ecmd" || e.sec === "dcmd" || e.sec === "keen";
const isPageRecipe = (e) => !e.sec || e.sec === "plan" || e.sec === "recipe2";
const isInvestigation = (e) => !isCommand(e) && !isPageRecipe(e) && e.sec !== "think" && !e.steps;

/** The lines that say what an item may change. Investigations without a mode are read-only; everything else adds none.
 *  A private overlay may give an entry its own mode line as modeText; the public library never does. */
export function authority(e, composer) {
  if (!isInvestigation(e) || e.flow) return [];
  const mode = e.modeText || composer.mode[e.mode || "read"]?.[1];
  if (!mode) throw new Error(`${e.id} has mode "${e.mode}", which library.json's composer does not define`);
  if (e.iso && !composer.iso) throw new Error(`${e.id} tests on a separate database, but library.json's composer has no iso line`);
  return e.iso ? [mode, composer.iso] : [mode];
}

/** Copy for one library: lib is library.json; keen is Keen's job list when the caller has it. */
export function makeCopy(lib, keen = []) {
  const hidden = lib.notShown || {};
  const items = new Map([...lib.entries, ...keen].map((e) => [e.id, e]));
  const resolve = (ref) => (hidden[ref] ? null : items.get(ref) || null);
  const keenRef = (ref) => /^K:[a-z]+$/.test(ref);

  // One recipe step on its own: a command as typed, a prompt with all its rules, nothing for plain words.
  function step(ref) {
    const e = resolve(ref);
    if (e) return isCommand(e) ? clean(e.cmd) || e.t : text(e);
    if (keenRef(ref)) return "/keen " + ref.slice(2);
    return ref.startsWith("/") ? ref : null;
  }
  // A page recipe with a command among its steps runs one step per message.
  function split(r) {
    return !!r.split || r.steps.some(([ref]) => { const e = resolve(ref); return e ? isCommand(e) : keenRef(ref) || ref.startsWith("/"); });
  }
  function recipe(r) {
    if (clean(r.copy)) return clean(r.copy);
    if (split(r)) return step(r.steps[0][0]) ?? r.steps[0][0];
    const lines = [`${r.t}. ${r.line}`, RECIPE_RUN];
    r.steps.forEach(([ref, note], i) => {
      const s = step(ref);
      lines.push(s == null ? `Step ${i + 1}: ${ref}, ${note}.` : `Step ${i + 1} (${note}):\n${s.endsWith(PLAIN_REPORT) ? s.slice(0, -PLAIN_REPORT.length).trimEnd() : s}`);
    });
    lines.push(PLAIN_REPORT);
    return lines.join("\n\n");
  }
  // A workflow embeds its investigations' prompts. Their safeguards (a separate database, the traps to avoid) come
  // from each investigation's own fields, once, and hold after the user approves a change. A step that is hidden from
  // the listings still brings its safeguards.
  function flowRules(e) {
    const rules = [...new Set(e.flow.flatMap(([, ids]) => ids))].map((ref) => items.get(ref)).filter((s) => s && isInvestigation(s)).flatMap((s) => {
      const lines = [];
      if (s.iso) lines.push(authority({ ...s, mode: "read" }, lib.composer)[1]);
      if (clean(s.avoid)) lines.push(`Avoid: ${sentence(clean(s.avoid))}`);
      if (clean(s.blind)) lines.push(`Watch for: ${sentence(clean(s.blind))}`);
      return lines.length ? [`- ${s.id}: ${lines.join(" ")}`] : [];
    });
    return rules.length ? [`These rules hold for the step that names them, before and after I approve a change:\n${rules.join("\n")}`] : [];
  }
  function text(e) {
    if (isPageRecipe(e)) return recipe(e);
    if (e.sec === "ecmd" || e.sec === "keen") return clean(e.cmd || e.p) || e.t;
    if (e.sec === "dcmd") return clean(e.p || e.cmd) || e.t;
    const body = clean(e.p) || e.t;
    if (e.sec === "think") return body;
    if (e.steps) return body.includes(RECIPE_FALLBACK) ? body : `${body}\n\n${RECIPE_FALLBACK}`;
    if (e.flow) return `${body}\n\n${[...flowRules(e), PLAIN_REPORT].join("\n\n")}`;
    const lines = authority(e, lib.composer);
    if (clean(e.ev)) lines.push(`Give me: ${sentence(clean(e.ev))}`);
    if (clean(e.avoid)) lines.push(`Avoid: ${sentence(clean(e.avoid))}`);
    if (clean(e.blind)) lines.push(`Watch for: ${sentence(clean(e.blind))}`);
    if (clean(e.skip)) lines.push(`${STOP_LEAD} ${sentence(clean(e.skip))}`);
    lines.push(PLAIN_REPORT);
    return `${body}\n\n${lines.join("\n")}`;
  }
  return { text, step, split };
}
