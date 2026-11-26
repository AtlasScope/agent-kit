/* ===== Connection: hearing from the local server (or the claude.ai store), messages, and sending to the agent ===== */

let STATUS = { live: false, listening: false, cloud: false, queued: 0 };
let pageVersion = SERVED_VERSION; // the version of index.html this page was built from

function conn() {
  const c = $('conn'), t = c.querySelector('span');
  c.className = 'conn' + (STATUS.live && STATUS.listening ? ' on' : '');
  t.textContent = STATUS.live ? (STATUS.listening ? 'Agent listening' : STATUS.queued ? `${STATUS.queued} waiting for the agent` : 'Connected') : STATUS.cloud ? 'Saved on this page' : LIVE ? 'Not connected · buttons copy text' : 'Offline · buttons copy text';
  c.title = STATUS.live ? (STATUS.listening ? 'What you send reaches the agent now.' : 'What you send is kept, and reaches the agent when it next listens. Say “check the studio” in the chat if it seems to have stopped.')
    : STATUS.cloud ? 'Your choices and requests are saved on this page, where the agent can read them. Buttons also copy a message for you to paste in the chat.'
    : 'Everything on this page still works. Buttons copy a message for you to paste in the chat.';
  const b = document.querySelector('[data-act="ask"]'); if (b) b.textContent = STATUS.live ? 'Send' : 'Copy request';
  if (NAV.review) $('pfoot').innerHTML = footHTML();
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
addEventListener('error', (e) => { if (/ResizeObserver loop/.test(e.message || '')) return; report((e.message || 'error') + (e.lineno ? ' (line ' + e.lineno + ')' : '')); }); // the browser's harmless layout notice is not a page error

function onStatus(st) {
  STATUS = { live: true, listening: !!st.listening, queued: +st.queued || 0 };
  if (pageVersion == null) pageVersion = st.version; // opened without a version stamp: trust the first report
  else if (st.version && st.version !== pageVersion) { save(true); setTimeout(() => location.reload(), 120); return; }
  if (st.ok === false) msg('The agent’s last change to this page has a mistake, so you are seeing the version before it. The agent has been told. Your choices are safe.', 'warn', true);
  conn();
}
/* The server pushes status on /api/events; if that is not available, ask every two seconds. */
function connect() {
  if (CLOUD) { STORE.then((db) => { STATUS.cloud = !!db; conn(); }); }
  if (!LIVE) { conn(); return; }
  const lost = () => { STATUS = { live: false, listening: false, queued: 0 }; conn(); };
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

/* What the claude.ai copy says after a request: it was copied, saved on the page, or both. */
function cloudSentMsg(copied, kept, words, after) {
  if (copied) return `Copied. Paste it in the chat with the agent.${kept ? ' It is also saved on this page.' : ''} ${after}`;
  if (kept) return `Saved on this page. In the chat, tell the agent “check the studio”. ${after}`;
  return `Could not copy or save. Tell the agent in the chat: ${esc(words)}`;
}
/** Hands one request to the agent by whichever way is open: the local server, the claude.ai store, or the clipboard. */
async function deliver(payload, words, okMsg, after) {
  let sent = false;
  if (CLOUD) {
    const copied = await copyText(words), kept = await cloudSend(Object.assign({ words }, payload)); // copy first, while the click still counts
    msg(cloudSentMsg(copied, kept, words, after), copied || kept ? 'ok' : 'warn', true);
    return kept;
  }
  if (STATUS.live) { try { await api('/api/send', payload); sent = true; } catch {} }
  if (sent) msg(okMsg + (STATUS.listening ? '' : ' The agent is not listening right now; it is kept until it does. Saying “check the studio” in the chat wakes it.'), 'ok', !STATUS.listening);
  else {
    const ok = await copyText(words);
    msg(ok ? `Copied. Paste it in the chat with the agent. ${after}` : `Could not copy. Tell the agent: ${esc(words)}`, 'warn', true);
  }
  return sent;
}

const INTENTS = { more: 'More choices for this, clearly different from the ones already here and suited to this project.', like: 'More choices in the spirit of the current one.', different: 'Something completely different from everything here.', what: 'What else could change here that the studio does not offer yet? Add it.' };
async function sendAsk(intent, key = null) {
  const m = AM(), w = askWhere(), c = w.ctl, s = AS();
  const wish = key ? '' : (($('ask') || {}).value || '').trim().slice(0, 400); // the one-click offer sends just the request
  if (!intent && !wish) return msg('Say what you would like first, or use one of the three buttons underneath.', 'warn');
  const curName = c ? nameIn(m.id, c.k, s) : '';
  const payload = {
    kind: 'more', id: 'r' + Date.now().toString(36), module: m.id, step: w.group ? w.group.id : 'looks', stepName: w.group ? w.group.t : 'Looks',
    control: c ? c.k : null, controlName: c ? c.label : null, wish, intent: intent || '', current: c ? String(s[c.k]) : null,
    existing: c ? (c.t === 'swatches' ? c.sw.map((x) => x[0]) : c.opts.map((q) => String(q.v)))
      : w.group ? w.group.ctl.filter((x) => x.t === 'chips').map((x) => ({ control: x.k, existing: x.opts.map((q) => String(q.v)) }))
      : m.looks.map((l) => l.id),
    pinned: PINS.filter((p) => p.mod === m.id).map((p) => p.name),
  };
  const words = `Studio (${P.name}, ${m.title()}): add choices to ${c ? `“${c.label}” under ${w.group.t}` : w.group ? w.group.t : `the ${m.name} looks`}. `
    + (intent ? INTENTS[intent] + ' ' : '') + (wish ? 'What I want: ' + wish + (/[.!?]$/.test(wish) ? '' : '.') : '') + (c ? ` Current choice: ${curName}.` : '');
  const sent = await deliver(payload, words, `Asked the agent to add to ${esc(w.name)}. New choices arrive here on their own, marked New.`, 'When it is done this page updates and keeps your choices.');
  UI.pending = { name: w.name, at: Date.now(), sent, key };
  UI.ask = { target: null, text: '' };
  renderPanel();
  save(true);
}
async function sendModule(id) {
  const name = (AVAILABLE.find((x) => x[0] === id) || [id, id])[1];
  const words = `Studio (${P.name}): add the ${name} studio to this workspace.`;
  await deliver({ kind: 'module', id: 'r' + Date.now().toString(36), module: id }, words, `Asked the agent to add ${esc(name)}. It needs a minute to read the project; this page reloads when it is ready.`, 'This page reloads when it is ready.');
}
async function sendSpec() {
  if (!SCOPE) { msg('First choose how far this should reach, just above.', 'warn'); const el = document.querySelector('[data-scope]'); if (el) el.scrollIntoView({ block: 'center', behavior: RM_OS ? 'auto' : 'smooth' }); return; }
  const text = specText();
  if (CLOUD) {
    const copied = await copyText(text), kept = await cloudSend({ kind: 'spec', text });
    if (!copied && !kept) return msg('Could not copy or save. Open “The exact proposal” and copy it from there.', 'warn', true);
    return msg(cloudSentMsg(copied, kept, '', 'Nothing is built until you say so.'), 'ok', true);
  }
  if (STATUS.live) {
    try { await api('/api/send', { kind: 'spec', text }); msg('Sent to the agent as a proposal. Nothing is built until you tell it to in the chat.', 'ok'); return; } catch {}
  }
  const ok = await copyText(text);
  msg(ok ? 'Copied. Paste it in the chat with the agent.' : 'Could not copy. Open “The exact proposal” and copy it from there.', ok ? 'ok' : 'warn');
}
