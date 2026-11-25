// Runs the built portable page's own script with an inert DOM, so a test can call the functions its Copy buttons
// use (copyText, stepText) on the data it shipped with. Shared by tests/library/copy.test.mjs and the site's copy test.
import fs from "node:fs";
import vm from "node:vm";

export function runPage(file) {
  const html = fs.readFileSync(file, "utf8");
  const json = /<script type="application\/json" id="library">([\s\S]*?)<\/script>/.exec(html)[1];
  const inert = () => new Proxy(function () {}, {
    get: (_, k) => (k === Symbol.toPrimitive ? () => "" : k === "textContent" || k === "value" ? "" : inert()),
    apply: () => inert(), set: () => true,
  });
  const document = { getElementById: (id) => (id === "library" ? { textContent: json } : inert()), querySelector: inert, querySelectorAll: () => [], createElement: inert, createTextNode: inert, addEventListener() {}, body: inert(), documentElement: inert() };
  const ctx = vm.createContext({ document, window: { addEventListener() {}, scrollTo() {} }, location: { hash: "", pathname: "/", search: "" }, history: { pushState() {}, replaceState() {} }, navigator: {}, requestAnimationFrame() {}, setTimeout() {}, clearTimeout() {} });
  for (const [, src] of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) vm.runInContext(src, ctx);
  return { data: JSON.parse(json), run: (code) => vm.runInContext(code, ctx) };
}
