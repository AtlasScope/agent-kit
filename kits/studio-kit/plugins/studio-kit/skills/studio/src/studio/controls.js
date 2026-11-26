/* ===== Controls: for every module, drop unused groups, give every control an id, add MORE choices, mark today ===== */

const CT = {}; // control id -> control
const onlyWith = (rule) => (s) => Object.entries(rule).every(([k, v]) => (Array.isArray(v) ? v : [v]).map(String).includes(String(s[k])));
const sameValue = (a, b) => String(a) === String(b);
/** Choices the agent added for a module's key: MORE['palette.scheme'], and for the button plain MORE.material too. */
const moreFor = (m, k) => [...(m.id === 'button' && Array.isArray(MO[k]) ? MO[k] : []), ...(Array.isArray(MO[m.id + '.' + k]) ? MO[m.id + '.' + k] : [])].filter(Array.isArray);

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
      if (op) op.today = true;
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
