/* ===== Connection: hearing from the local server (or the claude.ai store), messages, and sending to the agent ===== */

let STATUS = { live: false, listening: false, cloud: false };
let pageVersion = SERVED_VERSION; // the version of index.html this page was built from

function conn() {
  const c = $('conn'), t = c.querySelector('span');
  c.className = 'conn' + (STATUS.live && STATUS.listening ? ' on' : '');
  t.textContent = STATUS.live ? (STATUS.listening ? 'Agent listening' : 'Connected') : STATUS.cloud ? 'Saved on this page' : LIVE ? 'Not connected · buttons copy text' : 'Offline · buttons copy text';
  c.title = STATUS.live ? (STATUS.listening ? 'What you send reaches the agent now.' : 'What you send waits until the agent listens again.')
    : STATUS.cloud ? 'Your choices and requests are saved on this page, where the agent can read them. Buttons also copy a message for you to paste in the chat.'
    : 'Buttons copy a message for you to paste in the chat.';
  if (cur >= REVIEW) renderFoot();
}

let msgTimer = 0;
function msg(html, kind, sticky) {
  const b = $('msg');
  clearTimeout(msgTimer);
  b.className = 'msg show' + (kind ? ' ' + kind : '');
  b.querySelector('span').innerHTML = html;
  if (!sticky) msgTimer = setTimeout(() => b.classList.remove('show'), 6000);
}

const reported = new Set();
function report(m) {
  if (reported.has(m)) return;
  reported.add(m);
  console.error('[studio]', m);
  if (STATUS.live) api('/api/send', { kind: 'error', message: String(m).slice(0, 500) }).catch(() => {});
  else if (CLOUD) cloudSend({ kind: 'error', message: String(m).slice(0, 500) });
}
/** Leaves a request in the claude.ai store for the agent to read. Resolves whether it was saved. */
async function cloudSend(item) {
  try {
    const db = await STORE;
    if (!db) return false;
    await db.collection(REQUESTS).add(Object.assign({}, item, { at: new Date().toISOString() }));
    return true;
  } catch { return false; }
}
addEventListener('error', (e) => report((e.message || 'error') + (e.lineno ? ' (line ' + e.lineno + ')' : '')));

function onStatus(st) {
  STATUS = { live: true, listening: !!st.listening };
  if (pageVersion == null) pageVersion = st.version; // opened without a version stamp: trust the first report
  else if (st.version && st.version !== pageVersion) { save(true); setTimeout(() => location.reload(), 120); return; }
  if (st.ok === false) msg('The agent’s last change to this page has a mistake, so you are seeing the version before it. The agent has been told. Your choices are safe.', 'warn', true);
  conn();
}
/* The server pushes status on /api/events; if that is not available, ask every two seconds. */
function connect() {
  if (CLOUD) { STORE.then((db) => { STATUS.cloud = !!db; conn(); }); }
  if (!LIVE) { conn(); return; }
  const lost = () => { STATUS = { live: false, listening: false }; conn(); };
  const poll = async () => {
    try { onStatus(await api('/api/status')); } catch { lost(); }
    setTimeout(poll, document.hidden ? 5000 : 2000);
  };
  if (!window.EventSource) { poll(); return; }
  const es = new EventSource('/api/events?k=' + encodeURIComponent(LIVE.k));
  es.onmessage = (e) => { try { onStatus(JSON.parse(e.data)); } catch {} };
  es.onerror = () => { lost(); if (es.readyState === 2) { es.close(); poll(); } };
}

async function copyText(t) {
  try { await navigator.clipboard.writeText(t); return true; } catch {}
  const ta = document.createElement('textarea');
  ta.value = t;
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch {}
  ta.remove();
  return ok;
}

async function sendMore() {
  const id = UI.compose, t = targetOf(id), c = t.ctl;
  const wish = (($('cw') || {}).value || '').trim().slice(0, 400);
  const payload = {
    kind: 'more', step: t.step.id, stepName: t.step.t, control: c ? c.k : null, controlName: c ? c.label : null, wish,
    current: c ? (c.t === 'swatches' ? S.swatch : String(S[c.k])) : null,
    existing: c
      ? (c.t === 'swatches' ? SW.map((w) => w[0]) : c.opts.map((q) => String(q.v)))
      : t.step.ctl.filter((x) => x.t === 'chips').map((x) => ({ control: x.k, existing: x.opts.map((q) => String(q.v)) })),
  };
  const words = `Button studio (${P.name} ${P.noun}): add more choices to ${c ? `“${c.label}” in the ${t.step.t} step` : `the ${t.step.t} step`}. `
    + (wish ? 'What I want: ' + wish + (/[.!?]$/.test(wish) ? '' : '.') : 'Pick what would be useful.') + (c ? ` Current choice: ${c.t === 'swatches' ? S.swatch : nameOf(c.k)}.` : '');
  let sent = false, copied = false, kept = false;
  if (CLOUD) { copied = await copyText(words); kept = await cloudSend(Object.assign({ words }, payload)); sent = kept; } // copy first, while the click still counts
  else if (STATUS.live) { try { await api('/api/send', payload); sent = true; } catch {} }
  UI.pending = { id, name: t.name, at: Date.now(), sent };
  UI.compose = null;
  UI.text = '';
  renderPanel();
  save(true);
  if (CLOUD) msg(cloudSentMsg(copied, kept, words, 'When it has added them, this page updates on its own and keeps your choices.'), copied || kept ? 'ok' : 'warn', true);
  else if (sent) msg(`<span class="spin"></span>&nbsp; Asked the agent for more choices for ${esc(t.name)}. They will appear here on their own; your choices stay as they are.`, 'ok', true);
  else {
    const ok = await copyText(words);
    msg(ok ? 'Copied the request. Paste it in the chat with the agent. When it is done, reload this page; your choices are saved.' : `Could not copy. Tell the agent: ${esc(words)}`, 'warn', true);
  }
}

/* What the claude.ai copy says after a request: it was copied, saved on the page, or both. */
function cloudSentMsg(copied, kept, words, after) {
  if (copied) return `Copied. Paste it in the chat with the agent.${kept ? ' It is also saved on this page.' : ''} ${after}`;
  if (kept) return `Saved on this page. In the chat, tell the agent “check the studio”. ${after}`;
  return `Could not copy or save. Tell the agent in the chat: ${esc(words)}`;
}

async function sendSpec() {
  if (CLOUD) {
    const text = specText();
    const copied = await copyText(text), kept = await cloudSend({ kind: 'spec', text });
    if (!copied && !kept) return msg('Could not copy or save. Open “Exact spec for the agent” and copy it from there.', 'warn', true);
    return msg(cloudSentMsg(copied, kept, '', 'It builds from them when you say so.'), 'ok', true);
  }
  if (STATUS.live) {
    try { await api('/api/send', { kind: 'spec', text: specText() }); msg('Sent your choices to the agent. It builds from them when you tell it to.', 'ok'); return; } catch {}
  }
  const ok = await copyText(specText());
  msg(ok ? 'Copied. Paste it in the chat with the agent.' : 'Could not copy. Open “Exact spec for the agent” and copy it from there.', ok ? 'ok' : 'warn');
}
