'use strict';
/* ===== Studio core =====
   A studio page is the shared shell (src/studio) plus one or more modules (src/button, src/palette, src/type ...).
   The shell owns the page: navigation, the preview stage, tiles, compare, history, saving, Review and the link to the
   agent. A module owns one subject. It registers itself once with STUDIO.add({...}):

     id, name            'palette', 'Palette'
     title()             what is being designed, in the person's words: 'install button', 'colours'
     defaults            { key: value } for every key its controls use. Flat, JSON-safe values only.
     today               { key: value } measured from the project (may be empty), laid over defaults as the baseline
     groups              [{ id, t, sec, why, ctl: [controls], note?(s), na?(s) }]
                         sec is the heading it sits under in the navigator: 'Appearance', 'Content', 'Interaction', 'Behaviour'.
                         Controls come from ch(), rg(), { t: 'text' } and { t: 'swatches', sw: [[name, H, C, L, sentence]] }.
                         Every option has a plain name and one plain sentence. A control or option may carry
                         show(s) / when(s) so it only appears when it applies.
     looks               [{ id, n, d, patch }] finished looks for the Looks page; each patch is laid over the baseline
     keep                keys a look never resets (the person's words, for example)
     fix(s)              makes a state valid (optional)
     pick(s, c, op)      runs after a choice is laid on s, to bring coupled values with it (optional)
     vars(s)             { '--css-var': value } set on whatever element holds a drawing of this module
     live(el, s)         draws the working preview into el and wires it up
     still(s, opt)       returns HTML for a drawing that does nothing when clicked and has no element ids: used for
                         tiles, looks, compare and states. opt: { tile: controlKey } | { look: true } | { compare: true }
                         | { state: 'hover' }. The same drawing code as live(), given a different state.
     ground              true when its drawings bring their own background, so tiles do not show the stage background behind them
     tile(c)             null to list a control's options as words, or { tall?, wide? } to draw each as a tile
     states              [[id, 'Plain name']] the states the States view shows (optional)
     scene(s)            { vars: {...} } this module's part in the shared example page (optional)
     share(s)            foundation values other modules may follow, e.g. { accent: { H, C, L }, fonts: { body } } (optional)
     notes(s)            extra lines for the proposal (optional)
     warn(s)             [{ t: 'plain sentence', k?: controlKey }] real problems to look at before sending (optional)
     control(c, s)       HTML for a control of the module's own kind ({ t: 'role' }, say), or null for the shell's (optional).
                         It sets values with data-mset="module|key" data-val="..." and opens itself with data-mopen
     touch(s, k)         runs after key k changed by a pick, a slider or data-mset, to let go of values it covers (optional)
     changes(s, base)    [{ c, label, from, to, known }] what Review lists, when the module knows better than key by key (optional)

   New categories the agent adds to a session (MORE.dims) are turned into ordinary groups by controls.js before any
   module code sees them; their drawings get x-<id>-<value> classes and --x-<k> properties (see SKILL.md).

   Modules other than button are built into their own function scope so their names stay their own, and read their part of the
   project from P[id] (for example P.palette). State is only ever read from the `s` a function is given. */

if (typeof PROJECT === 'undefined') {
  document.body.insertAdjacentHTML('afterbegin', '<p style="margin:24px;font:15px system-ui;color:#f3f5f4">The project settings at the top of this file have a mistake, so the studio cannot start. Ask the agent to fix it.</p>');
  throw new Error('PROJECT failed to load');
}

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
/** 'text' or ['text', 'why'] -> ['text', 'why'] */
const two = (x) => (Array.isArray(x) ? [String(x[0]), String(x[1] || '')] : [String(x), '']);
const list = (a) => (a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]);
const clone = (x) => JSON.parse(JSON.stringify(x));
const cap = (s) => String(s).charAt(0).toUpperCase() + String(s).slice(1);
/** { '--a': 1 } -> '--a:1;' for a style attribute */
const varsCss = (v) => Object.entries(v || {}).map(([k, x]) => `${k}:${String(x).replace(/"/g, "'")}`).join(';');

const P = Object.assign({
  id: '', name: 'Your project', noun: 'main button', measured: false, startName: '', brand: ['Blue', 255, 0.17, 0.64],
  pageBg: '', column: 0, font: '', fontCss: '', labels: ['Get started'], subs: [], action: {}, choices: {}, secondary: [],
  system: [], specRules: 'Honour reduced motion.', afterNote: '', dropSteps: [], today: {}, sources: {},
  context: {}, palette: {}, type: {},
}, PROJECT);
const COLUMN = +P.column || 440;

const STUDIO = {
  mods: [], by: {},
  add(m) { if (!m || !m.id || this.by[m.id]) return; this.mods.push(m); this.by[m.id] = m; },
  has(id) { return !!this.by[id]; },
};

/* The studios this page was built with, and every studio the skill has (for the "Add a studio" menu). */
const metaList = (n) => ((document.querySelector(`meta[name="${n}"]`) || {}).content || "").split(",").filter(Boolean);
const BUILT = metaList("studio-modules").length ? metaList("studio-modules") : ["button"];
const AVAILABLE = metaList("studio-available").map((x) => x.split(":"));

/* Choices the agent added. A broken MORE block leaves MORE undefined; the studio still runs without them. */
const MORE_OK = typeof MORE === 'object' && MORE !== null;
const MO = MORE_OK ? MORE : {};
const MJ = (typeof MORE_JS === 'object' && MORE_JS) || {};
MJ.confirm = MJ.confirm || {};
MJ.split = MJ.split || {};

const RM_OS = matchMedia('(prefers-reduced-motion: reduce)').matches;
const TOUCH = matchMedia('(hover: none)').matches;

/* The kind of device the person is using, and the screens the preview can show. */
const VIEWER = () => (innerWidth < 600 ? 'phone' : innerWidth < 1000 ? 'tablet' : 'computer');
let VIEW = VIEWER();
const DEV = {
  phone: { n: 'Phone', w: 390, h: 844, gut: 16 },
  tablet: { n: 'Tablet', w: 768, h: 1024, gut: 32 },
  computer: { n: 'Computer', w: 1280, h: 800, gut: 32 },
};

/* The local server (scripts/studio.mjs). Without it the page works offline and buttons copy text instead. */
const LIVE = (() => {
  const k = new URLSearchParams(location.search).get('k');
  return /^https?:$/.test(location.protocol) && k ? { k } : null;
})();
/* A copy published on claude.ai: choices and requests go to the page's own store (the db capability) instead of a
   local server, and buttons also copy a message to paste in the chat. */
const CLOUD = !LIVE && !!(window.claude && typeof window.claude.use === 'function');
const STORE = CLOUD ? Promise.resolve(window.claude.use('db')).catch(() => null) : Promise.resolve(null);
const STATE_DOC = 'studio/state', REQUESTS = 'requests';
const SERVED_VERSION = (document.querySelector('meta[name="studio-version"]') || {}).content || null;
async function api(path, body) {
  const url = path + (path.includes('?') ? '&' : '?') + 'k=' + encodeURIComponent(LIVE.k);
  const res = await fetch(url, body
    ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }
    : { cache: 'no-store' });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
}

/* Control builders. Every choice: value, plain name, one plain sentence, and optionally when it applies. */
const o = (v, n, d, when) => ({ v, n, d: d || '', when });
const ch = (k, label, opts, x = {}) => Object.assign({ k, t: 'chips', label, opts }, x);
const rg = (k, label, min, max, step, unit, hint, x = {}) => Object.assign({ k, t: 'range', label, min, max, step, unit: unit || '', hint }, x);
