/* ===== Connection: hearing from the local server (or the claude.ai store), messages, and sending to the agent ===== */

let STATUS = { live: false, listening: false, cloud: false, queued: 0 };
let pageVersion = SERVED_VERSION; // the version of index.html this page was built from

function conn() {
  const c = $('conn'), t = c.querySelector('span');
  c.className = 'conn' + (STATUS.live && STATUS.listening ? ' on' : '');
  c.hidden = STATUS.live && !STATUS.listening && !STATUS.queued; // all is well: say nothing
  if (UI.pending && UI.pending.kind === 'queued' && STATUS.live && STATUS.queued === 0 && Date.now() - UI.pending.at > 1500) { UI.pending.kind = 'agent'; if (typeof renderPanel === 'function') renderPanel(); } // the agent took it from the queue
  t.textContent = STATUS.live ? (STATUS.listening ? 'Agent listening' : STATUS.queued ? `${STATUS.queued} waiting for the agent` : 'Agent connected') : STATUS.cloud ? 'Saved on this page' : LIVE ? 'Not connected · buttons copy text' : 'Offline · buttons copy text';
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
/* Sending to the agent. Listening: it goes straight there. Connected but not listening: the person chooses Send now
   (the request is copied for the chat, where the agent starts at once) or Keep in queue (saved for when it next
   looks); nothing pretends to be working. Offline: copied. done(kind) learns which: agent, queued or copied. */
let AWAY = null;
async function deliver(payload, words, okMsg, after, done = () => {}) {
  if (CLOUD) {
    const copied = await copyText(words), kept = await cloudSend(Object.assign({ words }, payload)); // copy first, while the click still counts
    msg(cloudSentMsg(copied, kept, words, after), copied || kept ? 'ok' : 'warn', true);
    done(kept ? 'queued' : 'copied');
    return kept;
  }
  if (STATUS.live && STATUS.listening) {
    try { await api('/api/send', payload); msg(okMsg, 'ok'); done('agent'); return true; } catch {}
  }
  if (STATUS.live) {
    if (AWAY) await keepQueued(); // a request still waiting for Send now or Keep in queue is kept, never replaced
    AWAY = { payload, words, after, done, name: payload.stepName || '', wish: payload.wish || '' };
    if (!NAV.review && typeof renderPanel === 'function') renderPanel(); // the choice appears in the box that was clicked
    else msg('The agent is not watching the studio right now. <button class="chip sm" data-act="sendnow">Send now</button> <button class="chip sm" data-act="queue">Keep in queue</button>', 'warn', true);
    return false;
  }
  const ok = await copyText(words);
  msg(ok ? `Copied. Paste it in the chat with the agent. ${after}` : `Could not copy. Tell the agent: ${esc(words)}`, 'warn', true);
  done('copied');
  return false;
}
async function sendNow() {
  if (!AWAY) return;
  const a = AWAY; AWAY = null;
  const ok = await copyText(a.words);
  renderPanel();
  msg(ok ? 'Copied. Paste it in the chat with the agent (Ctrl+V, then Enter) and it starts now. New choices arrive here on their own.' : `Could not copy. Tell the agent: ${esc(a.words)}`, ok ? 'ok' : 'warn', true);
  a.done('copied');
}
async function keepQueued() {
  if (!AWAY) return;
  const a = AWAY; AWAY = null;
  renderPanel();
  try { await api('/api/send', a.payload); msg('Kept in the queue. The agent picks it up the next time it looks; say “check the studio” in the chat to make that now.', 'ok'); a.done('queued'); }
  catch { msg('Could not reach the studio’s server. Use Send now instead.', 'warn', true); AWAY = a; }
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
  UI.ask = { target: null, text: '' };
  await deliver(payload, words, `The agent has your request for ${esc(w.name)}. New choices arrive here on their own, marked New.`, 'When it is done this page updates and keeps your choices.', (kind) => {
    UI.pending = { name: w.name, at: Date.now(), kind, key };
    renderPanel(); save(true);
  });
  renderPanel();
}
async function sendModule(id) {
  const name = (AVAILABLE.find((x) => x[0] === id) || [id, id])[1];
  const words = `Studio (${P.name}): add the ${name} studio to this workspace.`;
  await deliver({ kind: 'module', id: 'r' + Date.now().toString(36), module: id }, words, `Asked the agent to add ${esc(name)}. It needs a minute to read the project; this page reloads when it is ready.`, 'This page reloads when it is ready.');
}
async function sendSpec() {
  const missing = reachMissing();
  if (missing.length) { msg(`First choose how far ${esc(list(missing.map((m) => m.name)))} should reach, just above.`, 'warn'); const el = document.querySelector(`[data-scope^="${missing[0].id}|"]`); if (el) el.scrollIntoView({ block: 'center', behavior: RM_OS ? 'auto' : 'smooth' }); return; }
  const text = specText();
  if (CLOUD) {
    const copied = await copyText(text), kept = await cloudSend({ kind: 'spec', text });
    if (!copied && !kept) return msg('Could not copy or save. Open “The exact proposal” and copy it from there.', 'warn', true);
    return msg(cloudSentMsg(copied, kept, '', 'Nothing is built until you say so.'), 'ok', true);
  }
  // the same honest path as every other request: straight to a listening agent, or Send now / Keep in queue
  await deliver({ kind: 'spec', text }, text, 'The agent has your proposal. Nothing is built until you tell it to in the chat.', 'Nothing is built until you say so.');
}
