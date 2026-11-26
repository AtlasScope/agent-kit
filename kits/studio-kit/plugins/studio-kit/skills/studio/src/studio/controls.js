/* ===== Controls: drop unused steps, give every control an id, add MORE choices, mark today ===== */

{
  const drop = new Set(P.dropSteps || []);
  for (let i = STEPS.length - 1; i >= 0; i--) if (drop.has(STEPS[i].id)) STEPS.splice(i, 1);
}
const REVIEW = STEPS.length; // the step index of Review, after every real step

const CT = {}; // control id -> control
const onlyWith = (rule) => (s) => Object.entries(rule).every(([k, v]) => (Array.isArray(v) ? v : [v]).map(String).includes(String(s[k])));
const sameValue = (a, b) => String(a) === String(b);

STEPS.forEach((st) => st.ctl.forEach((c, i) => {
  c.id = st.id + '-' + i;
  c.sid = st.id;
  CT[c.id] = c;
  if (c.t !== 'chips') return;
  if (c.more !== false && Array.isArray(MO[c.k])) {
    for (const e of MO[c.k]) {
      if (!Array.isArray(e) || e[0] == null || c.opts.some((q) => sameValue(q.v, e[0]))) continue;
      const x = e[3] || {};
      c.opts.push({ v: e[0], n: String(e[1] || e[0]), d: String(e[2] || ''), set: x.set, when: x.onlyWith ? onlyWith(x.onlyWith) : null, more: !x.setup });
    }
  }
  if (P.measured && c.k in P.today && c.k !== 'sub') {
    const tv = P.today[c.k];
    let op = c.opts.find((q) => sameValue(q.v, tv));
    if (!op && c.k !== 'label') {
      op = o(tv, c.k === 'h' ? `Today, ${tv}px` : 'Today', 'What the project uses now.');
      c.opts.unshift(op);
    }
    if (op) op.today = true;
  }
}));

const ctlsFor = (k) => Object.values(CT).filter((c) => c.k === k);
const chipsFor = (k) => Object.values(CT).find((c) => c.k === k && c.t === 'chips');
const optOf = (c, v) => c.opts && c.opts.find((q) => sameValue(q.v, v));
const avail = (op) => !op.when || op.when(S);
const isFine = (c) => c.t === 'range' && !c.primary; // sliders sit under Fine-tune unless marked primary
function nameOf(k) {
  for (const c of ctlsFor(k)) { const op = optOf(c, S[k]); if (op) return op.n; }
  return String(S[k]);
}
const swOf = (name) => SW.find((w) => w[0] === name) || SW[0];
/** Every choice the agent added, as 'key:value', so the page can mark the new ones. */
function addedKeys() {
  const out = [];
  Object.values(CT).forEach((c) => { if (c.t === 'chips') c.opts.filter((q) => q.more).forEach((q) => out.push(c.k + ':' + String(q.v))); });
  SW.filter((w) => w[5] === 'more').forEach((w) => out.push('swatch:' + w[0]));
  return out;
}
