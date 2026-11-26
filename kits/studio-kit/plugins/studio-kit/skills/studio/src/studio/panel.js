/* ===== Panel: the studio tabs, the navigator, Looks, a category's choices drawn as tiles, Review and the proposal ===== */

const MAX_SHOWN = 16; // longer lists show this many plus the current one, then "Show N more"
const fmt = (v, c) => (c.step < 0.01 ? (+v).toFixed(3) : c.step < 1 ? (+v).toFixed(2) : Math.round(v)) + (c.unit || '');
const isNew = (key) => UI.fresh.includes(key);
const dot = (key) => (isNew(key) ? '<span class="nw" aria-label="new"></span>' : '');

/* ---- a state with one more choice laid on it, and a drawing of any state ---- */
function candidate(c, op) {
  const m = STUDIO.by[c.mid], s = clone(ST[c.mid]);
  s[c.k] = op.v;
  if (op.set) for (const k in op.set) if (k in DEFS[c.mid]) s[k] = op.set[k];
  if (m.pick) m.pick(s, c, op);
  if (m.fix) m.fix(s);
  return s;
}
function art(m, s, opt, cls = '') {
  let inner;
  try { inner = m.still(s, opt); } catch (e) { report(m.id + ' drawing: ' + e.message); inner = ''; }
  return `<span class="art bgd ${cls}" ${bgAttr()}><span class="art-in" style="${varsCss(m.vars(s))}">${inner}</span></span>`;
}
function lookState(m, look) {
  const s = Object.assign(fresh(m.id), look.patch), now = ST[m.id];
  m.keep.forEach((k) => { if (!(k in look.patch)) s[k] = now[k]; });
  if (m.fix) m.fix(s);
  return s;
}

/** Scales each drawing to fit its frame: as large as reads well, smaller only when it would not fit. */
function fitArt(root) {
  root.querySelectorAll('.art').forEach((a) => {
    const i = a.firstElementChild, w = i && i.offsetWidth, h = i && i.offsetHeight;
    if (!w || !h) return;
    const k = Math.min(a.classList.contains('big') ? 0.9 : 0.72, (a.clientWidth - 14) / w, (a.clientHeight - 10) / h);
    i.style.transform = `scale(${Math.max(0.2, k).toFixed(3)})`;
  });
}

/* ---- one control ---- */
function descHTML(c, op, s) {
  if (!op) return '';
  return `<b>${esc(op.n)}.</b> ${esc(op.d)}`
    + (op.today && !op.n.startsWith('Today') ? ' This is what the project uses now.' : '')
    + (avail(op, s) ? '' : ' <em>It will not show with the current choices.</em>');
}
const moreLink = (c) => (c.more !== false ? `<button class="addc" data-more="${c.id}">Ask for more</button>` : '');
function choicesHTML(c, s) {
  const m = STUDIO.by[c.mid], tile = m.tile ? m.tile(c) : null;
  const isOn = (op) => sameValue(s[c.k], op.v);
  const can = c.opts.filter((op) => avail(op, s) || isOn(op));
  const all = UI.expanded[c.id] || can.length <= MAX_SHOWN + 2;
  const vis = all ? can : can.filter((op, i) => i < MAX_SHOWN || isOn(op) || isNew(freshKey(c, op.v)));
  const hidden = can.length - vis.length;
  const tags = (op) => (op.today ? '<span class="now">now</span>' : '') + dot(freshKey(c, op.v));
  const one = (op) => {
    const at = `data-c="${c.id}" data-o="${c.opts.indexOf(op)}" aria-pressed="${isOn(op)}"`;
    if (!tile) return `<button class="chip${avail(op, s) ? '' : ' off'}" ${at}>${esc(op.n)}${tags(op)}</button>`;
    return `<div class="tile${tile.wide ? ' wide' : ''}${avail(op, s) ? '' : ' off'}" role="button" tabindex="0" ${at}>${art(m, candidate(c, op), { tile: c.k })}<span class="tn">${esc(op.n)}${tags(op)}</span></div>`;
  };
  return `<div class="ctl" data-ctl="${c.id}"><div class="lrow"><span class="lbl" id="l_${c.id}">${esc(c.label)}</span>${moreLink(c)}</div>`
    + `<div class="${tile ? 'tiles' + (tile.wide ? ' wide' : '') : 'chips'}" role="group" aria-labelledby="l_${c.id}">${vis.map(one).join('')}`
    + (hidden > 0 ? `<button class="chip ghost" data-expand="${c.id}">Show ${hidden} more</button>` : '')
    + (c.replay ? '<button class="chip ghost" data-act="replay">Replay</button>' : '') + '</div>'
    + `<p class="desc" id="d_${c.id}">${descHTML(c, optOf(c, s[c.k]), s)}</p></div>`;
}
function swatchDesc(c, s) {
  const w = c.sw.find((x) => x[0] === s[c.k]) || c.sw[0];
  return `<b>${esc(w[0])}.</b> ${esc(w[4] || '')}`;
}
function ctlHTML(c, s) {
  if (c.t === 'chips') return choicesHTML(c, s);
  if (c.t === 'range') {
    return `<div class="ctl"><div class="lrow"><label class="lbl" for="r_${c.id}">${esc(c.label)}<span id="v_${c.id}">${fmt(s[c.k], c)}</span></label></div>`
      + `<input id="r_${c.id}" type="range" data-c="${c.id}" min="${c.min}" max="${c.max}" step="${c.step}" value="${s[c.k]}">`
      + (c.hint ? `<p class="rhint">${esc(c.hint)}</p>` : '') + '</div>';
  }
  if (c.t === 'text') return `<div class="ctl"><div class="lrow"><label class="lbl" for="t_${c.id}">${esc(c.label)}</label></div><input id="t_${c.id}" type="text" data-c="${c.id}" value="${esc(s[c.k])}" maxlength="${c.max || 40}"></div>`;
  if (c.t === 'swatches') {
    const m = STUDIO.by[c.mid];
    const one = (w) => `<button data-c="${c.id}" data-sw="${esc(w[0])}" aria-pressed="${s[c.k] === w[0]}" aria-label="${esc(w[0])}" title="${esc(w[0])}" style="background:${m.swatchColour ? m.swatchColour(s, w) : `oklch(${w[3]} ${w[2]} ${w[1]})`}">${dot(freshKey(c, w[0]))}</button>`;
    return `<div class="ctl" data-ctl="${c.id}"><div class="lrow"><span class="lbl" id="l_${c.id}">${esc(c.label)}</span>${moreLink(c)}</div>`
      + `<div class="sw" role="group" aria-labelledby="l_${c.id}">${c.sw.map(one).join('')}</div><p class="desc" id="d_${c.id}">${swatchDesc(c, s)}</p></div>`;
  }
  return '';
}

/* ---- asking the agent ---- */
function askWhere() {
  const m = AM(), c = UI.ask.target && CT[UI.ask.target];
  if (c && c.mid === m.id) return { ctl: c, group: m.groups.find((g) => g.id === c.sid), name: `“${c.label}”` };
  const cat = NAV.cat[m.id];
  if (cat === 'looks') return { ctl: null, group: null, name: `${m.name.toLowerCase()} looks` };
  const g = m.groups.find((x) => x.id === cat);
  return { ctl: null, group: g, name: g ? g.t : m.name };
}
function askHTML() {
  if (NAV.review) return '';
  const w = askWhere(), p = UI.pending;
  const waiting = p && p.sent && Date.now() - p.at < 15 * 60e3;
  return `<div class="ask" id="askbox"><label for="ask">Want something that is not here?</label>`
    + `<p>Say it in your own words${w.ctl ? ` for ${esc(w.name)} <button class="addc" data-act="askwide">ask about the whole page instead</button>` : ''}. The agent adds new choices to this page; what you have picked stays as it is.</p>`
    + `<div class="askrow"><input id="ask" type="text" maxlength="400" value="${esc(UI.ask.text)}" placeholder="calmer · more like brushed metal · something for a white page"><button class="go" data-act="ask">${STATUS.live ? 'Send' : 'Copy request'}</button></div>`
    + '<div class="quick"><button class="chip sm" data-quick="like">More like this</button><button class="chip sm" data-quick="different">Something completely different</button><button class="chip sm" data-quick="what">What else could change?</button></div>'
    + (waiting ? `<p class="wait"><span class="spin"></span> Waiting for the agent to add to ${esc(p.name)}. Keep going; new choices arrive with a green dot.</p>` : '') + '</div>';
}

/* ---- Looks, a category, Review ---- */
function looksHTML() {
  const m = AM(), now = AS();
  const base = { id: '@base', n: baseName(m), d: m.measured ? 'What the project has now, as measured.' : 'A plain, sensible place to begin. Not taken from your project.', patch: {} };
  const card = (l) => {
    const s = l.id === '@base' ? fresh(m.id) : lookState(m, l);
    return `<div class="look" role="button" tabindex="0" data-look="${esc(l.id)}" aria-pressed="${sameLook(m.id, s, now)}">${art(m, s, { look: true }, 'big')}`
      + `<span class="tn">${esc(l.n)}${dot(m.id + '.look:' + l.id)}</span><small>${esc(l.d)}</small></div>`;
  };
  return `<h2>Looks</h2><p class="why">Whole ${esc(m.title())} looks to start from. Pick one and it is yours to change, piece by piece. Nothing is lost: Undo brings back what you had.</p>`
    + `<div class="looks">${[base, ...m.looks].map(card).join('')}</div>`
    + (m.looks.length > 1 ? '<div class="prow"><button class="chip" data-act="surprise">Surprise me</button><span class="rhint">Picks a look you have not tried.</span></div>' : '');
}
function groupHTML(g) {
  const s = AS();
  const vis = g.ctl.filter((c) => shown(c, s));
  const na = g.na && g.na(s), note = g.note && g.note(s);
  const main = vis.filter((c) => !isFine(c)), fine = vis.filter(isFine);
  const body = na ? `<div class="na">${esc(na)}</div>`
    : main.map((c) => ctlHTML(c, s)).join('')
      + (fine.length ? `<details class="fine" data-fine="${g.id}"${UI.fine[NAV.mod + '.' + g.id] ? ' open' : ''}><summary>Fine-tune</summary>${fine.map((c) => ctlHTML(c, s)).join('')}</details>` : '');
  return `<h2>${esc(g.t)}</h2><p class="why">${g.why}</p>${note ? `<div class="note">${note}</div>` : ''}${body}`;
}

const SCOPES = [['one', 'Only this one', 'Change this one place and leave everything like it alone.'], ['family', 'Every one like it', 'Change the shared style, so every matching one follows.'], ['system', 'The design system', 'Change the foundations (colours, type, shared styles) that the rest is built from.']];
/** What changed in one module, as [{ c, label, from, to }], one per key. */
function changes(m) {
  const s = ST[m.id], d = DEFS[m.id];
  return changedKeys(m.id).map((k) => {
    const c = ctlsFor(m.id, k).find((x) => shown(x, s)) || ctlsFor(m.id, k)[0];
    if (!c || c.inSpec === false) return null;
    const say = (st) => { const r = ctlsFor(m.id, k).find((x) => x.t === 'range'); const n = nameIn(m.id, k, st); return n === String(st[k]) && r ? fmt(st[k], r) : n === '' ? 'none' : n; };
    const known = m.measured && k in m.today ? (P.sources && P.sources[k]) || 'measured' : m.measured ? 'not measured' : '';
    return { c, label: c.label, from: say(d), to: say(s), known };
  }).filter(Boolean);
}
function checkedLine() {
  const d = UI.seen.dev.filter((k) => DEV[k]).map((k) => DEV[k].n.toLowerCase());
  const b = UI.seen.bg.map((v) => (BGS.find((x) => x[0] === v) || [v, v])[1].toLowerCase());
  return `Looked at on ${list(d) || 'one device'}, against ${list(b) || 'one background'}${UI.seen.mode.includes('context') ? ', in the example page' : ''}; less motion ${UI.seen.rm ? 'tried' : 'not tried'}.`;
}
function reviewHTML() {
  const blocks = STUDIO.mods.map((m) => {
    const ch = changes(m), warn = m.warn ? m.warn(ST[m.id]) : [];
    const rows = ch.map((x) => `<li><b>${esc(x.label)}</b><span><s>${esc(x.from)}</s>${x.known === 'not measured' ? ' <i>(not measured)</i>' : ''} → ${esc(x.to)}</span><button class="addc" data-goctl="${x.c.id}">Change</button></li>`).join('');
    return `<section class="rvm"><h3>${esc(cap(m.title()))}</h3>`
      + (ch.length
        ? `<div class="ba"><figure>${art(m, DEFS[m.id], { compare: true })}<figcaption>${esc(baseName(m))}</figcaption></figure><figure>${art(m, ST[m.id], { compare: true })}<figcaption>Proposed</figcaption></figure></div><ul class="rv">${rows}</ul>`
        : `<p class="why">Nothing changed from ${esc(baseName(m).toLowerCase())}.</p>`)
      + (warn.length ? `<ul class="warns">${warn.map((w) => `<li class="${w.soft ? 'soft' : ''}">${esc(w.t)}</li>`).join('')}</ul>` : '') + '</section>';
  }).join('');
  const any = STUDIO.mods.some((m) => changedKeys(m.id).length);
  return '<h2>Review</h2><p class="why">What you would change, before and after. Sending it is a proposal: the agent builds nothing until you say so in the chat.</p>'
    + blocks
    + `<div class="ctl"><div class="lrow"><span class="lbl" id="l_scope">How far should this reach?</span></div><div class="chips" role="group" aria-labelledby="l_scope">${SCOPES.map(([k, n]) => `<button class="chip" data-scope="${k}" aria-pressed="${SCOPE === k}">${n}</button>`).join('')}</div>`
    + `<p class="desc">${SCOPE ? esc(SCOPES.find((x) => x[0] === SCOPE)[2]) : 'Choose one, so the agent knows whether to touch one place or the shared styles.'}</p></div>`
    + `<p class="checked">${esc(checkedLine())}</p>`
    + `<details class="fine" data-fine="review"${UI.fine.review ? ' open' : ''}><summary>The exact proposal the agent receives</summary><pre class="spec">${esc(specText())}</pre></details>`
    + `<div class="prow"><button class="chip sm" data-act="export">Save to a file</button><button class="chip sm" data-act="import">Open a saved file</button>${any ? '<button class="chip sm" data-act="resetall">Put everything back</button>' : ''}<input type="file" id="importfile" accept="application/json,.json" hidden></div>`;
}

function tabsHTML() {
  const tab = (m) => `<button role="tab" data-mod="${m.id}" aria-selected="${!NAV.review && NAV.mod === m.id}">${esc(m.name)}${changedKeys(m.id).length ? '<i class="ch" title="Changed"></i>' : ''}</button>`;
  const rest = AVAILABLE.filter(([id]) => !STUDIO.has(id));
  return STUDIO.mods.map(tab).join('')
    + (rest.length ? `<select id="addmod" aria-label="Add a studio"><option value="">+ Add</option>${rest.map(([id, n]) => `<option value="${esc(id)}">${esc(n)}</option>`).join('')}</select>` : '');
}
function navHTML() {
  const m = AM(), cur = NAV.review ? '' : NAV.cat[m.id], s = AS(), changed = new Set(changedKeys(m.id));
  const item = (id, name, mark = '') => `<button data-cat="${id}" aria-current="${cur === id ? 'page' : 'false'}"><span>${esc(name)}</span>${mark}</button>`;
  let h = item('looks', 'Looks', m.looks.some((l) => isNew(m.id + '.look:' + l.id)) ? '<i class="nw"></i>' : ''), sec = '';
  for (const g of m.groups) {
    if (g.sec && g.sec !== sec) { sec = g.sec; h += `<span class="sec">${esc(sec)}</span>`; }
    const fresh = g.ctl.some((c) => UI.fresh.some((f) => f.startsWith(m.id + '.' + c.k + ':')));
    const off = g.na && g.na(s);
    h += item(g.id, g.short || g.t, fresh ? '<i class="nw"></i>' : !off && g.ctl.some((c) => changed.has(c.k)) ? '<i class="ch"></i>' : '');
  }
  return h;
}
function footHTML() {
  if (!NAV.review) return '';
  return `<button class="go q" data-act="back">Back</button><span class="count"></span><button class="go q" data-act="copy">Copy</button><button class="go" data-act="send">${STATUS.live ? 'Send to chat' : 'Copy for chat'}</button>`;
}

function renderTop() {
  $('tabs').innerHTML = tabsHTML();
  $('undo').disabled = !HIST.undo.length;
  $('redo').disabled = !HIST.redo.length;
  $('review').setAttribute('aria-pressed', String(NAV.review));
  const title = STUDIO.mods.length > 1 ? 'Studio' : cap(AM().title()) + ' studio';
  document.title = title + ' · ' + P.name;
}
/** Redraws the panel, keeping keyboard focus where the person was. */
function renderPanel() {
  const host = $('panel'), ae = document.activeElement, m = AM();
  let refocus = null;
  if (ae && host.contains(ae)) {
    refocus = ae.dataset.o != null ? `[data-c="${ae.dataset.c}"][data-o="${ae.dataset.o}"]`
      : ae.dataset.sw ? `[data-sw="${CSS.escape(ae.dataset.sw)}"]`
      : ae.dataset.look ? `[data-look="${CSS.escape(ae.dataset.look)}"]`
      : ae.dataset.scope ? `[data-scope="${ae.dataset.scope}"]`
      : ae.id ? '#' + CSS.escape(ae.id)
      : ae.dataset.more ? `[data-more="${ae.dataset.more}"]` : null;
  }
  const navCat = ae && $('nav').contains(ae) ? ae.dataset.cat : null;
  const cat = NAV.cat[m.id], g = m.groups.find((x) => x.id === cat);
  let html;
  try { html = NAV.review ? reviewHTML() : (g ? groupHTML(g) : looksHTML()) + askHTML(); } catch (e) { report('panel: ' + e.message); html = '<p class="why">This page could not be drawn. The agent has been told.</p>'; }
  host.innerHTML = html;
  fitArt(host);
  $('nav').innerHTML = navHTML();
  $('nav').hidden = NAV.review;
  $('scol').classList.toggle('reviewing', NAV.review);
  $('pfoot').innerHTML = footHTML();
  renderTop();
  renderStageBar();
  const focus = (el) => el && el.focus({ preventScroll: true });
  if (refocus) focus(host.querySelector(refocus));
  else if (navCat) focus($('nav').querySelector(`[data-cat="${navCat}"]`));
}
/** Everything, after a state changed underneath: undo, a pinned version taken, a file opened. */
function redrawAll() { renderStage(); renderPanel(); }

/* ---- moving around ---- */
const topOffset = () => (innerWidth < 900 ? $('pcol').offsetHeight + 8 : parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hdr')) + 12);
function scrollToPanel() {
  const r = $('scol').getBoundingClientRect(), mgn = topOffset();
  if (r.top < mgn - 1 || r.top > innerHeight * 0.6) scrollTo({ top: scrollY + r.top - mgn, behavior: RM_OS ? 'auto' : 'smooth' });
}
function go(mod, cat) {
  const wasMod = NAV.mod, wasReview = NAV.review;
  if (mod && STUDIO.has(mod)) NAV.mod = mod;
  NAV.review = cat === 'review';
  if (cat && cat !== 'review') NAV.cat[NAV.mod] = cat;
  UI.ask.target = null;
  const m = AM();
  if (m.onNav) m.onNav();
  if (wasMod !== NAV.mod || wasReview !== NAV.review) renderStage();
  renderPanel(); scrollToPanel(); save();
}
function goControl(id) {
  const c = CT[id];
  if (!c) return;
  if (isFine(c)) UI.fine[c.mid + '.' + c.sid] = true;
  go(c.mid, c.sid);
  const el = $('panel').querySelector(`[data-ctl="${id}"], [data-c="${id}"]`);
  if (el) el.scrollIntoView({ block: 'center', behavior: RM_OS ? 'auto' : 'smooth' });
}

/* ---- the proposal the agent receives ---- */
function specLines(m) {
  const s = ST[m.id], out = [];
  for (const g of m.groups) {
    if (g.na && g.na(s)) continue;
    const parts = [], done = new Set();
    for (const c of g.ctl) {
      if (c.inSpec === false || !shown(c, s) || done.has(c.k)) continue;
      done.add(c.k);
      const same = sameValue(JSON.stringify(s[c.k]), JSON.stringify(DEFS[m.id][c.k]));
      if (c.t === 'swatches') { const k = m.colourOf ? m.colourOf(s) : null; parts.push(`${s[c.k]}${k ? `, oklch(${(+k.L).toFixed(2)} ${(+k.C).toFixed(2)} ${Math.round(k.H)})` : ''}${same ? ' [unchanged]' : ''}`); continue; }
      if (c.t === 'text') { parts.push(`${c.spec || c.label}: “${s[c.k]}”`); continue; }
      if (c.t === 'range') { parts.push(`${c.label}: ${fmt(s[c.k], c)}`); continue; }
      const op = optOf(c, s[c.k]);
      const r = g.ctl.find((x) => x.k === c.k && x.t === 'range');
      if (!op) { parts.push(`${c.label}: ${r ? fmt(s[c.k], r) : s[c.k]}`); continue; }
      const raw = String(op.v);
      const showRaw = typeof op.v === 'string' && raw && raw.toLowerCase() !== op.n.toLowerCase() && c.k !== 'sub' && c.k !== 'label';
      parts.push((c.label.toLowerCase() === g.t.toLowerCase() ? '' : c.label + ': ') + op.n
        + (showRaw ? ` (${raw})` : '') + (r ? `, ${fmt(s[c.k], r)}` : '') + (same ? ' [unchanged]' : '')
        + (avail(op, s) ? '' : ' [will not show with these choices]'));
    }
    if (parts.length) out.push(`${g.t}: ${parts.join('; ')}`);
  }
  return out;
}
function specText() {
  const scope = SCOPES.find((x) => x[0] === SCOPE);
  const out = [`A proposal from the studio for ${P.name}. Nothing has been changed. Do not build it until I say so in the chat. ${P.specRules}`, '',
    `Reach: ${scope ? `${scope[1]}. ${scope[2]}` : 'not chosen yet. Ask me before deciding.'}`];
  for (const m of STUDIO.mods) {
    const ch = changes(m);
    out.push('', `== ${m.name}: ${m.title()} ==`);
    if (!ch.length) { out.push(`No change from ${baseName(m).toLowerCase()}.`); continue; }
    out.push('Changed: ' + ch.map((x) => `${x.label} ${x.from}${x.known === 'not measured' ? ' (starting value, not measured from the project)' : ''} → ${x.to}`).join('; ') + '.');
    out.push(...specLines(m).map((l, i) => `${i + 1}. ${l}`));
    const warn = m.warn ? m.warn(ST[m.id]) : [];
    if (warn.length) out.push('To check: ' + warn.map((w) => w.t).join(' '));
    if (m.notes) out.push(...m.notes(ST[m.id]));
    const system = m.system ? m.system() : [];
    if (system.length) out.push(`How the project builds this today: ${system.join(' ')} These choices may change that. Where they differ and the reach allows it, update or add to the design system to match rather than special-casing.`);
  }
  out.push('', checkedLine());
  return out.join('\n');
}
