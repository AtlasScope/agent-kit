/* ===== Panel: the step bar, one step at a time, Review, and the spec ===== */

const short = (i) => (i >= REVIEW ? 'Review' : SHORT[STEPS[i].id] || STEPS[i].t);
const freshKey = (c, v) => c.k + ':' + String(v);

/* ---- one control ---- */
function descHTML(c, op) {
  if (!op) return '';
  return `<b>${esc(op.n)}.</b> ${esc(op.d)}`
    + (c.k === 'tc' && op.v === 'auto' ? ` Right now that is ${S.L > 0.7 ? 'dark' : 'white'}.` : '')
    + (op.today && !op.n.startsWith('Today') ? ' This is what the project uses now.' : '')
    + (avail(op) ? '' : ' <em>It will not show with the current choices.</em>');
}
const moreLink = (c) => (c.more !== false ? `<button class="addc" data-more="${c.id}">Add more choices</button>` : '');
const swatchDesc = () => {
  const w = swOf(S.swatch);
  return `<b>${esc(w[0])}.</b> ${esc(w[4] || '')}${S.H !== w[1] || S.C !== w[2] || S.L !== w[3] ? ' Adjusted in Fine-tune.' : ''}`;
};
const fmt = (v, c) => (c.step < 0.01 ? (+v).toFixed(3) : c.step < 1 ? (+v).toFixed(2) : Math.round(v)) + (c.unit || '');
const MAX_SHOWN = 8; // longer lists show this many plus the current one, then "Show N more"

function chipsHTML(c) {
  const isOn = (op) => sameValue(S[c.k], op.v);
  const shown = c.opts.filter((op) => avail(op) || isOn(op));
  const all = UI.expanded[c.id] || shown.length <= MAX_SHOWN + 2;
  const vis = all ? shown : shown.filter((op, i) => i < MAX_SHOWN || isOn(op));
  const hidden = shown.length - vis.length;
  const chip = (op) => `<button class="chip${avail(op) ? '' : ' off'}" data-c="${c.id}" data-o="${c.opts.indexOf(op)}" aria-pressed="${isOn(op)}">${esc(op.n)}`
    + (op.today ? '<span class="now">now</span>' : '')
    + (UI.fresh.includes(freshKey(c, op.v)) ? '<span class="nw" aria-label="new"></span>' : '') + '</button>';
  return `<div class="ctl" data-ctl="${c.id}"><div class="lrow"><span class="lbl" id="l_${c.id}">${esc(c.label)}</span>${moreLink(c)}</div>`
    + `<div class="chips" role="group" aria-labelledby="l_${c.id}">${vis.map(chip).join('')}`
    + (hidden > 0 ? `<button class="chip ghost" data-expand="${c.id}">Show ${hidden} more</button>` : '')
    + (c.replay ? '<button class="chip ghost" data-act="replay">Replay</button>' : '') + '</div>'
    + `<p class="desc" id="d_${c.id}">${descHTML(c, optOf(c, S[c.k]))}</p>${composeHTML(c.id)}</div>`;
}
function ctlHTML(c) {
  if (c.t === 'chips') return chipsHTML(c);
  if (c.t === 'range') {
    return `<div class="ctl"><div class="lrow"><label class="lbl" for="r_${c.id}">${esc(c.label)}<span id="v_${c.id}">${fmt(S[c.k], c)}</span></label></div>`
      + `<input id="r_${c.id}" type="range" data-c="${c.id}" min="${c.min}" max="${c.max}" step="${c.step}" value="${S[c.k]}">`
      + (c.hint ? `<p class="rhint">${esc(c.hint)}</p>` : '') + '</div>';
  }
  if (c.t === 'text') return `<div class="ctl"><div class="lrow"><label class="lbl" for="t_${c.id}">${esc(c.label)}</label></div><input id="t_${c.id}" type="text" data-c="${c.id}" value="${esc(S[c.k])}" maxlength="40"></div>`;
  if (c.t === 'swatches') {
    const dot = (x) => `<button data-sw="${esc(x[0])}" aria-pressed="${S.swatch === x[0]}" aria-label="${esc(x[0])}" style="background:${x[2] === 0 && x[3] > 0.9 ? '#f6f8f7' : `oklch(${x[3]} ${x[2]} ${x[1]})`}">${UI.fresh.includes('swatch:' + x[0]) ? '<span class="nw"></span>' : ''}</button>`;
    return `<div class="ctl" data-ctl="${c.id}"><div class="lrow"><span class="lbl" id="l_${c.id}">${esc(c.label)}</span>${moreLink(c)}</div>`
      + `<div class="sw" role="group" aria-labelledby="l_${c.id}">${SW.map(dot).join('')}</div><p class="desc" id="d_sw">${swatchDesc()}</p>${composeHTML(c.id)}</div>`;
  }
  return '';
}

/* ---- "Add more choices" ---- */
function targetOf(id) {
  if (id.startsWith('step:')) { const st = STEPS.find((x) => x.id === id.slice(5)); return { step: st, ctl: null, name: `the ${st.t} step` }; }
  const c = CT[id];
  return { step: STEPS.find((x) => x.id === c.sid), ctl: c, name: `“${c.label}”` };
}
function composeHTML(id) {
  if (UI.compose !== id) return '';
  return `<div class="compose"><label for="cw">More choices for ${esc(targetOf(id).name)}</label>`
    + '<p>Say what you would like, or leave it blank and the agent will pick. New ones appear with a green dot; your current choices stay as they are.</p>'
    + `<textarea id="cw" maxlength="400" placeholder="For example: calmer, more like metal, something that works on a white page">${esc(UI.text)}</textarea>`
    + `<div class="row2"><button class="go q" data-act="cancel">Cancel</button><button class="go" data-act="sendmore">${STATUS.live ? 'Send to chat' : 'Copy request'}</button></div></div>`;
}

/* ---- a step, Review, the step bar and the footer ---- */
function stepHTML() {
  if (cur >= REVIEW) return reviewHTML();
  const st = STEPS[cur];
  const vis = st.ctl.filter((c) => !c.show || c.show(S));
  const na = st.na && st.na(S);
  const note = st.note && st.note(S);
  const main = vis.filter((c) => !isFine(c)), fine = vis.filter(isFine);
  let body;
  if (na) body = `<div class="na">${esc(na)}</div>`;
  else {
    body = main.map(ctlHTML).join('')
      + (fine.length ? `<details class="fine" data-fine="${st.id}"${UI.fine[st.id] ? ' open' : ''}><summary>Fine-tune</summary>${fine.map(ctlHTML).join('')}</details>` : '')
      + `<button class="addstep" data-more="step:${st.id}">+ Add more choices to this step</button>${composeHTML('step:' + st.id)}`;
  }
  return `<h2>${esc(st.t)}</h2><p class="why">${st.why}</p>`
    + (stale[st.id] ? '<div class="flag">An earlier choice changed. Check this step still looks right, then press Next.</div>' : '')
    + (note ? `<div class="note">${note}</div>` : '') + body;
}
/** One readable line per step for Review: the main choice, then the others by name, leaving out the "none" ones. */
function plainLine(st) {
  if (st.na && st.na(S)) return 'Not needed with this layout';
  const parts = [], done = new Set();
  for (const c of st.ctl) {
    if (c.inSpec === false || (c.show && !c.show(S)) || done.has(c.k) || c.t === 'range' || c.t === 'text') continue;
    done.add(c.k);
    if (c.t === 'swatches') { parts.push(swOf(S.swatch)[0]); continue; }
    if (c.k === 'label') { parts.push('“' + S.label + '”'); continue; }
    const op = optOf(c, S[c.k]);
    if (!op) continue;
    const first = !parts.length;
    if (!first && (op.v === 'none' || op.v === false || op.v === '')) continue;
    parts.push(first ? op.n : `${c.label}: ${op.n}`);
  }
  return parts.join(' · ');
}
function checkedLine() {
  const d = UI.seen.dev.filter((k) => DEV[k]).map((k) => DEV[k].n.toLowerCase());
  const b = UI.seen.bg.map((v) => (BGS.find((x) => x[0] === v) || [v, v])[1].toLowerCase());
  return `Looked at on ${list(d) || 'one device'}, against ${list(b) || 'one background'}, less motion ${UI.seen.rm ? 'tried' : 'not tried yet'}.`;
}
function reviewHTML() {
  const todo = STEPS.filter((st) => !locked[st.id]).length;
  const row = (st, i) => `<li class="${locked[st.id] ? '' : 'todo'}"><b>${esc(st.t)}</b><span>${stale[st.id] ? '<em>Check again. </em>' : ''}${esc(plainLine(st))}</span><button class="addc" data-go="${i}">Change</button></li>`;
  return '<h2>Review</h2>'
    + `<p class="why">Everything you picked. Change any line, then send it to the agent.${todo ? ` Steps you have not finished keep ${P.measured ? 'today’s' : 'the starting'} choices.` : ''}</p>`
    + `<ul class="rv">${STEPS.map(row).join('')}</ul><p class="checked">${esc(checkedLine())}</p>`
    + `<details class="fine" data-fine="review"${UI.fine.review ? ' open' : ''}><summary>Exact spec for the agent</summary><pre class="spec">${esc(specBody())}</pre></details>`;
}
function navHTML() {
  const item = (i, mark, cls) => `<button data-go="${i}" class="${cls}" aria-current="${i === cur ? 'step' : 'false'}"><i>${mark}</i><span>${esc(short(i))}</span></button>`;
  return STEPS.map((st, i) => item(i, stale[st.id] ? '!' : locked[st.id] ? '✓' : i + 1, (locked[st.id] ? 'done ' : '') + (stale[st.id] ? 'stale' : ''))).join('') + item(REVIEW, REVIEW + 1, '');
}
function footHTML() {
  if (cur >= REVIEW) return `<button class="go q" data-back>Back</button><span class="count"></span><button class="go q" data-act="copy">Copy</button><button class="go" data-act="send">${STATUS.live ? 'Send to chat' : 'Copy for chat'}</button>`;
  return `<button class="go q" data-back${cur === 0 ? ' hidden' : ''}>Back</button><span class="count">Step ${cur + 1} of ${STEPS.length}</span><button class="go" data-next>Next: ${esc(short(cur + 1))}</button>`;
}

function renderNav() {
  const n = $('nav');
  n.innerHTML = navHTML();
  n.style.setProperty('--n', REVIEW + 1);
  n.style.setProperty('--half', Math.ceil((REVIEW + 1) / 2));
  const b = n.querySelector('[aria-current=step]');
  if (b && n.scrollWidth > n.clientWidth) n.scrollLeft = b.offsetLeft - n.clientWidth / 2 + b.offsetWidth / 2;
}
const renderFoot = () => { $('pfoot').innerHTML = footHTML(); };
/** Redraws the step, keeping keyboard focus where the person was. */
function renderPanel() {
  const host = $('panel'), ae = document.activeElement;
  let refocus = null;
  if (ae && host.contains(ae)) {
    refocus = ae.dataset.o != null ? `[data-c="${ae.dataset.c}"][data-o="${ae.dataset.o}"]`
      : ae.id ? '#' + CSS.escape(ae.id)
      : ae.dataset.sw ? `[data-sw="${CSS.escape(ae.dataset.sw)}"]`
      : ae.dataset.more ? `[data-more="${ae.dataset.more}"]`
      : ae.dataset.expand ? '.chip.ghost[data-expand]' : null;
  }
  const navGo = ae && $('nav').contains(ae) ? ae.dataset.go : null;
  const fromFoot = ae && $('pfoot').contains(ae) && (ae.dataset.next != null || ae.dataset.back != null);
  host.innerHTML = stepHTML();
  renderNav();
  renderFoot();
  const focus = (el) => el && el.focus({ preventScroll: true });
  if (refocus) focus(host.querySelector(refocus));
  else if (navGo != null) focus($('nav').querySelector(`[data-go="${navGo}"]`));
  else if (fromFoot) { const h = host.querySelector('h2'); if (h) { h.tabIndex = -1; focus(h); } }
  const ta = $('cw');
  if (ta && UI.focusCompose) {
    focus(ta);
    ta.closest('.compose').scrollIntoView({ block: 'center', behavior: RM_OS ? 'auto' : 'smooth' });
    UI.focusCompose = false;
  }
}

/* ---- moving between steps ---- */
function markStale(id) { STEPS.forEach((st) => { if (st.dep.includes(id) && locked[st.id]) stale[st.id] = true; }); }
function changed(stepId) { markStale(stepId); stale[stepId] = false; }
const topOffset = () => (innerWidth < 900 ? $('pcol').offsetHeight + 8 : parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hdr')) + 12);
function scrollToPanel() {
  const r = $('scol').getBoundingClientRect(), m = topOffset();
  if (r.top < m - 1 || r.top > innerHeight * 0.6) scrollTo({ top: scrollY + r.top - m, behavior: RM_OS ? 'auto' : 'smooth' });
}
function goStep(i) {
  cur = Math.max(0, Math.min(REVIEW, i));
  UI.compose = null;
  onStepChange();
  renderPanel(); scrollToPanel(); save();
}
function next() {
  if (cur < REVIEW) {
    const st = STEPS[cur];
    locked[st.id] = true;
    stale[st.id] = false;
    UI.fresh = UI.fresh.filter((f) => !st.ctl.some((c) => f.startsWith(c.k + ':')));
  }
  goStep(cur + 1);
}

/* ---- the spec the agent builds from ---- */
function specLines() {
  const out = [];
  for (const st of STEPS) {
    if (st.na && st.na(S)) continue;
    const parts = [], done = new Set();
    for (const c of st.ctl) {
      if (c.inSpec === false || (c.show && !c.show(S)) || done.has(c.k)) continue;
      done.add(c.k);
      if (c.t === 'swatches') { const w = swOf(S.swatch); parts.push(`${w[0]}, oklch(${(+S.L).toFixed(2)} ${(+S.C).toFixed(2)} ${Math.round(S.H)})`); continue; }
      if (c.k === 'label') { parts.push(`Words: “${S.label}”`); continue; }
      if (c.t === 'range') { parts.push(`${c.label}: ${fmt(S[c.k], c)}`); continue; }
      if (c.t !== 'chips') continue;
      const op = optOf(c, S[c.k]);
      const r = st.ctl.find((x) => x.k === c.k && x.t === 'range');
      if (!op) { parts.push(`${c.label}: ${r ? fmt(S[c.k], r) : S[c.k]}`); continue; }
      const raw = String(op.v);
      const showRaw = typeof op.v === 'string' && raw && raw.toLowerCase() !== op.n.toLowerCase() && c.k !== 'sub';
      parts.push((c.label.toLowerCase() === st.t.toLowerCase() ? '' : c.label + ': ') + op.n
        + (showRaw ? ` (${raw})` : '') + (r ? `, ${fmt(S[c.k], r)}` : '') + (op.today ? ' [unchanged]' : '')
        + (avail(op) ? '' : ' [will not show with these choices]'));
    }
    if (parts.length) out.push(`${st.t}: ${parts.join('; ')}${locked[st.id] ? '' : ' [not reviewed]'}`);
  }
  out.push('Checked: ' + checkedLine());
  out.push(...specNotes());
  const system = P.system || P.rules || [];
  if (system.length) out.push('The project’s buttons today: ' + system.join(' ') + ' These choices may change that. Where they differ, update or add to the design system to match; do not special-case this one button.');
  return out;
}
const specBody = () => specLines().map((l, i) => `${i + 1}. ${l}`).join('\n');
const specText = () => `Build the ${P.name} ${P.noun} to this spec. ${P.specRules}\n\n${specBody()}`;
