'use strict';
/* ===== Studio core =====
   A studio page is built from the general studio files (src/studio) and one kind's files (src/button).
   The kind provides, before studio/controls.js runs:
     DEFAULTS    starting values for every key the kind's steps use
     STEPS       [{id, t, why, dep, ctl:[controls], note?(S), na?(S)}]; controls come from ch(), rg(), {t:'text'}, {t:'swatches'}
     SHORT       short step names for the step bar, by step id
     SW          colour swatches [name, hue, chroma, lightness, sentence]
     PRESETS     [[name, {key: value}]]; the first is the measured or simple start
     fixDefaults(DEF), fixState(S), specNotes()
   and, after studio/state.js:
     previewVars(), renderPreview(), resetPreview(), replayPreview(), onPick(control, option), afterPick(control),
     onStepChange(), previewTall() */

if (typeof PROJECT === 'undefined') {
  document.body.insertAdjacentHTML('afterbegin', '<p style="margin:24px;font:15px system-ui;color:#f3f5f4">The project settings at the top of this file have a mistake, so the studio cannot start. Ask the agent to fix it.</p>');
  throw new Error('PROJECT failed to load');
}

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
/** 'text' or ['text', 'why'] -> ['text', 'why'] */
const two = (x) => (Array.isArray(x) ? [String(x[0]), String(x[1] || '')] : [String(x), '']);
const list = (a) => (a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]);

const P = Object.assign({
  name: 'Your project', noun: 'main button', measured: false, startName: '', brand: ['Blue', 255, 0.17, 0.64],
  pageBg: '', column: 0, font: '', fontCss: '', labels: ['Get started'], subs: [], action: {}, choices: {}, secondary: [],
  system: [], specRules: 'Honour reduced motion.', afterNote: '', dropSteps: [], today: {},
}, PROJECT);
const COLUMN = +P.column || 440;

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
