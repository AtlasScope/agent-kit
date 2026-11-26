// Checks a studio page after an edit: every inline script parses, and every choice in MORE has a plain name, a
// sentence, and the CSS, icon or function it needs to show. A choice that cannot show is a dead option.
import vm from "node:vm";

const reEsc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// The selector each kind of added choice must define. Matched as a whole class name, so .m-gold is not
// satisfied by .m-golden.
const NEEDS_CSS = {
  material: (v) => `.m-${v}`, idle: (v) => `.i-${v}`, idle2: (v) => `.l-${v}`, hover: (v) => `.h-${v}`, press: (v) => `.p-${v}`,
  iconfx: (v) => `.if-${v}`, entrance: (v) => `.e-${v}`, focus: (v) => `.f-${v}`, menuStyle: (v) => `.menu.${v}`,
  mdens: (v) => `.d-${v}`, mhi: (v) => `.hi-${v}`, manim: (v) => `.ma-${v}`, cmode: (v) => `.cm-${v}`,
};
const hasClass = (css, selector) => new RegExp(reEsc(selector) + "(?![\\w-])").test(css);

export const scriptsOf = (html) => [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
/** Syntax errors in the page's inline scripts, as plain lines. */
export function syntaxProblems(html) {
  return scriptsOf(html).flatMap((code, i) => {
    try { new vm.Script(code, { filename: `script ${i + 1}` }); return []; } catch (e) { return [`Script ${i + 1} (${["PROJECT", "MORE", "ENGINE"][i] || "?"}) does not parse: ${e.message}`]; }
  });
}

export function checkHtml(html) {
  const scripts = scriptsOf(html);
  const problems = scripts.length < 3 ? [`Expected 3 inline scripts (PROJECT, MORE, ENGINE); found ${scripts.length}.`] : [];
  problems.push(...syntaxProblems(html));
  if (problems.length) return problems;

  const ctx = vm.createContext({});
  try { vm.runInContext(scripts[0] + "\n;globalThis.__P=PROJECT;", ctx, { timeout: 500 }); } catch (e) { problems.push(`PROJECT fails when run: ${e.message}`); }
  try { vm.runInContext(scripts[1] + "\n;globalThis.__M=MORE;globalThis.__J=typeof MORE_JS==='object'?MORE_JS:{};", ctx, { timeout: 500 }); } catch (e) { problems.push(`MORE fails when run: ${e.message}`); return problems; }
  const M = ctx.__M || {}, J = ctx.__J || {};
  const css = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join("\n");
  const icons = new Set([...html.matchAll(/<symbol id="i-([\w-]+)"/g)].map((m) => m[1]));

  // A class added for a choice that sets `transition` on the button itself replaces the built-in fades, so every
  // other hover and press effect snaps instead of easing. Changing it only while pressed or hovered is fine.
  const moreCss = (html.match(/<style id="more-css">([\s\S]*?)<\/style>/) || [])[1] || "";
  for (const [, sel, body] of moreCss.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/([^{}]+)\{([^}]*)\}/g)) {
    if (!/(^|;)\s*transition\s*:/.test(body)) continue;
    const onButton = sel.split(",").map((s) => s.trim()).filter((s) => /^(\.[\w-]+)+$/.test(s));
    if (onButton.length) problems.push(`${onButton.join(", ")} sets transition on the button, which stops the other hover and press effects from easing. Set it only under :active or :hover, or leave it out.`);
  }

  for (const [key, list] of Object.entries(M)) {
    if (!Array.isArray(list)) { problems.push(`MORE.${key} should be a list.`); continue; }
    for (const e of list) {
      if (!Array.isArray(e)) { problems.push(`MORE.${key}: each choice is a list like [value, 'Name', 'Sentence'].`); continue; }
      if (key === "swatch") {
        if (e.length < 4 || [1, 2, 3].some((i) => typeof e[i] !== "number")) problems.push(`MORE.swatch '${e[0]}': use ['Name', hue, chroma, lightness, 'Sentence'].`);
        if (!e[4]) problems.push(`MORE.swatch '${e[0]}' has no plain sentence.`);
        continue;
      }
      const [v, name, sentence] = e;
      if (!name || !sentence) problems.push(`MORE.${key} '${v}' needs a plain name and a short sentence.`);
      const sel = NEEDS_CSS[key];
      if (sel && !hasClass(css, sel(v))) problems.push(`MORE.${key} '${v}' needs CSS for ${sel(v)} in <style id="more-css">.`);
      if (key === "shape" && !hasClass(css, `.sh-${v}`) && !(e[3] && e[3].set)) problems.push(`MORE.shape '${v}' needs CSS for .sh-${v} or a set:{rr:...}.`);
      if (key === "icon" && !icons.has(String(v))) problems.push(`MORE.icon '${v}' needs <symbol id="i-${v}"> after the MORE ICONS comment.`);
      if (key === "bg" && !new RegExp(`\\.device\\[data-bg=["']?${reEsc(v)}["']?\\]`).test(css)) problems.push(`MORE.bg '${v}' needs CSS for .device[data-bg=${v}].`);
      if ((key === "confirm" || key === "split") && !(J[key] && typeof J[key][v] === "function")) problems.push(`MORE.${key} '${v}' needs a function in MORE_JS.${key}.`);
    }
  }
  return problems;
}
