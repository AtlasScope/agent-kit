/* ===== Scene: one example page that every studio in the workspace paints =====
   A button on its own says little; so does a palette as a row of squares. "In a page" shows them at work together:
   a header, a headline and paragraph, the main action, a field, a short list and a line of code. The words come from
   the project (PROJECT.context) where the agent found them, and are stand-ins where it did not; the stage says which.

   Modules paint it by returning custom properties from scene(s):
     colour  --sc-bg --sc-surface --sc-line --sc-control --sc-fg --sc-fg2 --sc-fg3 --sc-accent --sc-fill --sc-on-fill
             --sc-ok --sc-warn --sc-bad
     type    --sc-display --sc-body --sc-mono (font families)  --sc-size (px)  --sc-ratio (step between sizes)
             --sc-lh --sc-hlh (line heights)  --sc-htrack (em)  --sc-hweight --sc-bweight  --sc-hcase  --sc-measure (ch)
             --sc-num (font-variant-numeric) */

const CX = Object.assign({ eyebrow: '', headline: '', body: '', links: [], secondary: '', field: '', hint: '', placeholder: '', rows: [], code: '', real: false, layout: '', note: '', foot: [], bg: '' }, P.context || {});

function sceneHTML() {
  const links = (CX.links.length ? CX.links : ['Docs', 'Pricing', 'Changelog']).slice(0, 4);
  const rows = (CX.rows.length ? CX.rows : [['Weekly summary', 'Updated today', 'New'], ['Billing export', 'Updated yesterday', ''], ['Team access', '12 people', '']]).slice(0, 4);
  const action = STUDIO.has('button')
    ? '<div id="mount" class="unit"></div>'
    : `<span class="sc-btn">${esc((P.labels && two(P.labels[0])[0]) || 'Get started')}</span>`;
  /* layout 'hero': one centred column (headline, one line, the action, a note under it, one link, small links at the
     foot), as on a landing page. bg names one of the stage backgrounds, such as a picture the agent added with MORE.bg. */
  // The page's own picture stays only while the palette keeps today's light or dark; words chosen for the other side
  // need the palette's own page behind them, or they stop being readable.
  const sideMoved = STUDIO.has('palette') && ST.palette.side !== DEFS.palette.side;
  const bg = CX.bg && !sideMoved && BGS.some((b) => b[0] === CX.bg) ? ` bgd" data-bg="${esc(CX.bg)}` : '';
  if (CX.layout === 'hero') {
    return `<div class="scene sc-heroonly${bg}" id="scene">
 <div class="sc-top"><b class="sc-brand">${esc(P.name)}</b><span class="sc-links">${links.map((l) => `<span>${esc(l)}</span>`).join('')}</span></div>
 <div class="sc-center">
  ${CX.eyebrow ? `<p class="sc-eyebrow">${esc(CX.eyebrow)}</p>` : ''}
  <h2 class="sc-h">${esc(CX.headline || 'A clear headline that says what this is')}</h2>
  ${CX.body ? `<p class="sc-p">${esc(CX.body)}</p>` : ''}
  <div class="sc-cta">${action}</div>
  ${CX.note ? `<p class="sc-note">${esc(CX.note)}</p>` : ''}
  ${CX.secondary ? `<span class="sc-link">${esc(CX.secondary)} ›</span>` : ''}
 </div>
 ${CX.foot.length ? `<p class="sc-foot">${CX.foot.slice(0, 6).map((l) => `<span>${esc(l)}</span>`).join('')}</p>` : ''}
</div>`;
  }
  const row = (r) => `<li><span class="sc-rt">${esc(r[0])}</span><span class="sc-rm">${esc(r[1] || '')}</span>${r[2] ? `<span class="sc-badge">${esc(r[2])}</span>` : ''}</li>`;
  return `<div class="scene" id="scene">
 <div class="sc-top"><b class="sc-brand">${esc(P.name)}</b><span class="sc-links">${links.map((l) => `<span>${esc(l)}</span>`).join('')}</span><span class="sc-ghost">Sign in</span></div>
 <div class="sc-hero">
  ${CX.eyebrow ? `<p class="sc-eyebrow">${esc(CX.eyebrow)}</p>` : ''}
  <h2 class="sc-h">${esc(CX.headline || 'A clear headline that says what this is')}</h2>
  <p class="sc-p">${esc(CX.body || 'One or two plain sentences underneath. Long enough to judge how a paragraph reads at this size, and where the eye goes next.')}</p>
  <div class="sc-cta">${action}<span class="sc-link">${esc(CX.secondary || (P.secondary && P.secondary[0]) || 'See how it works')} →</span></div>
 </div>
 <div class="sc-grid">
  <div class="sc-card"><span class="sc-label">${esc(CX.field || 'Email')}</span><span class="sc-field">${esc(CX.placeholder || (CX.field ? '' : 'name@example.com')) || '&nbsp;'}</span><span class="sc-hint">${esc(CX.hint || 'Used only to sign you in.')}</span>
   <span class="sc-status"><i class="ok"></i>Saved <i class="warn"></i>Needs a look <i class="bad"></i>Failed</span></div>
  <ul class="sc-list">${rows.map(row).join('')}</ul>
 </div>
 <pre class="sc-code">${esc(CX.code || 'npm install your-package')}</pre>
</div>`;
}

/** Whether the example page is light: the palette says so if there is one, else the stage background decides. */
function sceneLight() {
  const l = shared('light');
  return l == null ? bgLight() : !!l;
}
function paintSceneVars() {
  const sc = $('scene');
  if (!sc) return;
  const vars = {};
  for (const m of STUDIO.mods) if (m.scene) { try { Object.assign(vars, (m.scene(ST[m.id]) || {}).vars); } catch (e) { report(m.id + ' scene: ' + e.message); } }
  sc.style.cssText = varsCss(vars);
  if (sc.dataset.base == null) sc.dataset.base = sc.className; // its own layout classes, kept under the added ones
  sc.className = sc.dataset.base + ' ' + STUDIO.mods.map((m) => dimCls(m.id, ST[m.id])).join(' ');
  sc.classList.toggle('light', sceneLight());
}
function paintScene() {
  paintSceneVars();
  if (STUDIO.has('button')) STUDIO.by.button.reset();
}
