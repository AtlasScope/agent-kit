/* ===== Controls: for every module, drop unused groups, give every control an id, add MORE choices, mark today ===== */

const CT = {}; // control id -> control
const onlyWith = (rule) => (s) => Object.entries(rule).every(([k, v]) => (Array.isArray(v) ? v : [v]).map(String).includes(String(s[k])));
const sameValue = (a, b) => String(a) === String(b);
/** Choices the agent added for a module's key: MORE['palette.scheme'], and for the button plain MORE.material too. */
const moreFor = (m, k) => [...(m.id === 'button' && Array.isArray(MO[k]) ? MO[k] : []), ...(Array.isArray(MO[m.id + '.' + k]) ? MO[m.id + '.' + k] : [])].filter(Array.isArray);

/* ---- new categories the agent added in this session (MORE.dims) ----
   A category is data: an id, a name, plain choices and optional sliders. Each drawing of its module gets the class
   x-<id>-<choice> and the custom property --x-<slider>, and the agent's CSS in <style id="more-css"> does the rest.
   A definition that breaks a rule is left out with a message; the rest of the page carries on. The same rules are
   checked by `studio.mjs check` and by the local server before it serves an edited page (scripts/lib/check.mjs). */
const DIM_ID = /^[a-z][A-Za-z0-9]{1,23}$/, DIM_VAL = /^[a-z0-9][a-z0-9-]{0,23}$/;
const DIMS = {}; // module id -> [{ id, opts, ranges }]
const DIM_BAD = [];
(Array.isArray(MO.dims) ? MO.dims.slice(0, 8) : []).forEach((d, i) => {
  const say = (why) => DIM_BAD.push(`${d && d.t ? `“${String(d.t).slice(0, 40)}”` : `Category ${i + 1}`}: ${why}`);
  if (!d || typeof d !== 'object') return say('is not a definition.');
  const mid = String(d.module || 'button'), m = STUDIO.by[mid];
  if (!m) return say(`belongs to a studio that is not open here (${mid}).`);
  if (!DIM_ID.test(String(d.id))) return say('needs an id of letters and digits, starting with a small letter.');
  const keys = new Set([...Object.keys(m.defaults), ...m.groups.flatMap((g) => g.ctl.map((c) => c.k))]);
  if (keys.has(d.id) || (DIMS[mid] || []).some((x) => x.id === d.id)) return say(`its id “${d.id}” is already used.`);
  if (typeof d.t !== 'string' || !d.t.trim() || d.t.length > 40) return say('needs a short plain name.');
  const opts = Array.isArray(d.options) ? d.options : [];
  if (opts.length < 2 || opts.length > 16 || !opts.every((x) => Array.isArray(x) && DIM_VAL.test(String(x[0])) && x[1] && x[2])) return say('needs 2 to 16 choices, each [value, \'Name\', \'Sentence\'] with a value of small letters, digits and hyphens.');
  const def = d.default == null ? String(opts[0][0]) : String(d.default);
  if (!opts.some((x) => String(x[0]) === def)) return say('its default is not one of its choices.');
  const ranges = Array.isArray(d.ranges) ? d.ranges.slice(0, 3) : [];
  const badRange = ranges.find((r) => !r || !DIM_ID.test(String(r.k)) || keys.has(r.k) || r.k === d.id || !r.label || !(+r.min < +r.max) || !(+r.step > 0) || !(+r.default >= +r.min && +r.default <= +r.max));
  if (badRange) return say('has a slider without a fresh id, a label, min below max, a step and a default between them.');
  const dim = { id: d.id, def, opts, ranges };
  m.defaults[d.id] = def;
  ranges.forEach((r) => { m.defaults[r.k] = +r.default; });
  const group = {
    id: 'x-' + d.id, t: d.t.trim(), short: d.short ? String(d.short).slice(0, 24) : undefined, sec: String(d.sec || m.groups.length && m.groups[m.groups.length - 1].sec || 'More'),
    why: esc(String(d.why || '').slice(0, 240)), dim: true,
    ctl: [ch(d.id, d.t.trim(), opts.map((x) => Object.assign(o(String(x[0]), String(x[1]).slice(0, 40), String(x[2]).slice(0, 200)), { more: true }))),
      ...ranges.map((r) => rg(r.k, String(r.label).slice(0, 40), +r.min, +r.max, +r.step, String(r.unit || '').slice(0, 6), String(r.hint || '').slice(0, 120)))],
  };
  const at = m.groups.findIndex((g) => g.id === d.after);
  if (at >= 0) m.groups.splice(at + 1, 0, group); else m.groups.push(group);
  (DIMS[mid] = DIMS[mid] || []).push(dim);
  if (m.tile) { const t = m.tile; m.tile = (c) => (c.k === d.id ? {} : t(c)); }
});
/** The classes and custom properties that let the agent's CSS draw a module's new categories. */
const dimCls = (mid, s) => (DIMS[mid] || []).map((d) => `x-${d.id}-${s[d.id]}`).join(' ');
const dimVars = (mid, s) => Object.fromEntries((DIMS[mid] || []).flatMap((d) => d.ranges.map((r) => ['--x-' + r.k, s[r.k]])));
for (const m of STUDIO.mods) {
  if (!DIMS[m.id]) continue;
  const v = m.vars;
  m.vars = (s) => Object.assign({}, v(s), dimVars(m.id, s));
}

for (const m of STUDIO.mods) {
  const drop = new Set(m.id === 'button' ? P.dropSteps || [] : (P[m.id] && P[m.id].drop) || []);
  m.groups = m.groups.filter((g) => !drop.has(g.id));
  m.today = m.today || {};
  m.looks = (m.looks || []).slice();
  m.keep = m.keep || [];
  m.transient = m.transient || [];
  m.groups.forEach((g) => g.ctl.forEach((c, i) => {
    c.id = m.id + '.' + g.id + '-' + i;
    c.sid = g.id;
    c.mid = m.id;
    CT[c.id] = c;
    if (c.t === 'swatches') {
      for (const w of moreFor(m, c.k)) if (w.length >= 4 && !c.sw.some((x) => x[0] === String(w[0]))) c.sw.push([String(w[0]), +w[1], +w[2], +w[3], String(w[4] || ''), 'more']);
      return;
    }
    if (c.t !== 'chips') return;
    if (c.more !== false) {
      for (const e of moreFor(m, c.k)) {
        if (e[0] == null || c.opts.some((q) => sameValue(q.v, e[0]))) continue;
        const x = e[3] || {};
        c.opts.push({ v: e[0], n: String(e[1] || e[0]), d: String(e[2] || ''), set: x.set, when: x.onlyWith ? onlyWith(x.onlyWith) : null, more: !x.setup });
      }
    }
    if (m.measured && c.k in m.today && c.k !== 'sub') {
      const tv = m.today[c.k];
      let op = c.opts.find((q) => sameValue(q.v, tv));
      if (!op && c.k !== 'label') {
        op = o(tv, c.k === 'h' ? `Today, ${tv}px` : 'Today', 'What the project uses now.');
        c.opts.unshift(op);
      }
      if (op) { op.today = true; if (c.opts[0] !== op && c.k !== 'label') { c.opts.splice(c.opts.indexOf(op), 1); c.opts.unshift(op); } } // today's comes first
    }
  }));
  for (const e of moreFor(m, 'look')) {
    if (e[0] == null || !e[3] || typeof e[3].set !== 'object' || m.looks.some((l) => l.id === String(e[0]))) continue;
    m.looks.push({ id: String(e[0]), n: String(e[1] || e[0]), d: String(e[2] || ''), patch: e[3].set, more: true });
  }
  m.keys = [...new Set(m.groups.flatMap((g) => g.ctl.map((c) => c.k)))];
}

const ctlsFor = (mid, k) => Object.values(CT).filter((c) => c.mid === mid && c.k === k);
const chipsFor = (mid, k) => ctlsFor(mid, k).find((c) => c.t === 'chips');
const optOf = (c, v) => c.opts && c.opts.find((q) => sameValue(q.v, v));
const avail = (op, s) => !op.when || op.when(s);
const shown = (c, s) => !c.show || c.show(s);
const isFine = (c) => c.t === 'range' && !c.primary; // sliders sit under Fine-tune unless marked primary
/** The plain name of whatever a key is set to in a state. */
function nameIn(mid, k, s) {
  for (const c of ctlsFor(mid, k)) {
    if (c.t === 'swatches') return String(s[k]);
    const op = optOf(c, s[k]);
    if (op) return op.n;
  }
  return String(s[k]);
}
const nameOf = (k) => nameIn('button', k, S); // the button catalogue's own notes use this
/** Every choice the agent added, as 'module.key:value', so the page can mark the new ones. */
function addedKeys() {
  const out = [];
  Object.values(CT).forEach((c) => {
    if (c.t === 'chips') c.opts.filter((q) => q.more).forEach((q) => out.push(c.mid + '.' + c.k + ':' + String(q.v)));
    if (c.t === 'swatches') c.sw.filter((w) => w[5] === 'more').forEach((w) => out.push(c.mid + '.' + c.k + ':' + w[0]));
  });
  STUDIO.mods.forEach((m) => m.looks.filter((l) => l.more).forEach((l) => out.push(m.id + '.look:' + l.id)));
  return out;
}
const freshKey = (c, v) => c.mid + '.' + c.k + ':' + String(v);
