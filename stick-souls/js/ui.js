/* Stick Souls — Menus, the settings panel and saved tuning.
   Plain scripts loaded in order by index.html; they share top-level names. */
'use strict';

// ---------------------------------------------------------------- saved tuning
// Values are kept on this device, and, where the page's storage is available, in the page
// itself so Claude can read them back ("apply my tuning").
const STORE_KEY = 'stick-souls-tuning-v1';
const tuning = { db: null, canWrite: false, saving: false, dirty: false, timer: 0, loaded: false };
function collectValues() {
  const values = {}, vers = {};
  for (const s of SETTINGS) { values[s[1]] = getPath(T, s[1]); vers[s[1]] = verOf(s[1]); }
  return { values, vers };
}
function applyValues(data) {
  if (!data || typeof data.values !== 'object' || !data.values) return;
  for (const s of SETTINGS) {
    const id = s[1], v = data.values[id];
    if (typeof v !== 'number' || !isFinite(v)) continue;
    if (!data.vers || data.vers[id] !== verOf(id)) continue;
    setPath(T, id, clamp(v, s[3], s[4]));
  }
}
function saveLocal() { try { localStorage.setItem(STORE_KEY, JSON.stringify(collectValues())); } catch (e) { /* storage may be blocked */ } }
function loadLocal() { try { const s = localStorage.getItem(STORE_KEY); if (s) applyValues(JSON.parse(s)); } catch (e) { /* ignore */ } }
function scheduleSave() {
  saveLocal();
  tuning.dirty = true;
  clearTimeout(tuning.timer);
  tuning.timer = setTimeout(flushSave, 700);
  setStatus();
}
async function flushSave() {
  if (!tuning.db || !tuning.canWrite || tuning.saving || !tuning.dirty) { setStatus(); return; }
  tuning.saving = true; tuning.dirty = false;
  setStatus();
  try {
    await tuning.db.doc('tuning/main').set({ ...collectValues(), updatedAt: new Date().toISOString() });
  } catch (e) {
    if (e && (e.code === 'invalid_argument' || e.code === 'not_granted' || e.code === 'revoked')) tuning.canWrite = false;
  }
  tuning.saving = false;
  setStatus();
  if (tuning.dirty) flushSave();
}
async function connectStore() {
  try {
    const c = window.claude;
    if (!c || typeof c.use !== 'function') { tuning.loaded = true; setStatus(); return; }
    const db = await c.use('db');
    if (!db) { tuning.loaded = true; setStatus(); return; }
    tuning.db = db;
    let owner = null;
    try { const u = await c.use('user'); if (u && typeof u.isOwner === 'function') owner = await u.isOwner(); } catch (e) { /* unknown */ }
    tuning.canWrite = owner !== false;
    const snap = await db.doc('tuning/main').get();
    if (snap.exists && !tuning.dirty) { applyValues(snap.data()); saveLocal(); applyLive(); refreshSliders(); }
  } catch (e) { /* page storage is optional */ }
  tuning.loaded = true;
  setStatus();
}
function applyLive() {
  P.st = Math.min(P.st, T.p.st);
  setVolume(T.f.volume);
}

// ---------------------------------------------------------------- menus (DOM)
const UI_CSS = `
#ss-ui { --ink: #e9e6df; --dim: rgba(233,230,223,0.6); --line: rgba(233,230,223,0.16); --panel: #15161b;
  --accent: #b8382e; --gold: #d9a441; position: fixed; inset: 0; pointer-events: none; color: var(--ink);
  font: 15px/1.4 ${FONT_UI}; -webkit-user-select: none; user-select: none; }
#ss-ui [hidden] { display: none !important; }
#ss-ui .scrim { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  background: rgba(8,9,11,0.74); pointer-events: auto;
  padding: max(16px, env(safe-area-inset-top, 0px)) max(16px, env(safe-area-inset-right, 0px))
    max(16px, env(safe-area-inset-bottom, 0px)) max(16px, env(safe-area-inset-left, 0px)); }
#ss-ui .panel { background: var(--panel); border: 1px solid var(--line); border-radius: 10px; padding: 26px 30px;
  width: min(340px, 100%); display: flex; flex-direction: column; gap: 12px; box-shadow: 0 24px 64px rgba(0,0,0,0.55); }
#ss-ui h1, #ss-ui h2 { font-family: ${FONT_D}; font-weight: 400; margin: 0; text-wrap: balance; }
#ss-ui h1 { font-size: clamp(36px, 8vw, 58px); text-align: center; line-height: 1; }
#ss-ui .tag { text-align: center; color: var(--dim); font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; margin: 0 0 8px; }
#ss-ui h2 { font-size: 28px; text-align: center; }
#ss-ui button { font: 600 14px ${FONT_UI}; letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink);
  background: rgba(233,230,223,0.06); border: 1px solid rgba(233,230,223,0.32); border-radius: 6px;
  min-height: 46px; padding: 10px 18px; cursor: pointer; }
#ss-ui button:hover { background: rgba(233,230,223,0.14); }
#ss-ui button:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }
#ss-ui button.primary { background: var(--accent); border-color: #d2493d; }
#ss-ui button.primary:hover { background: #cc4236; }
#ss-ui button.foe { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; text-align: left;
  text-transform: none; letter-spacing: 0; padding: 12px 16px; }
#ss-ui .foe-name { font-family: ${FONT_D}; font-size: 22px; font-weight: 400; }
#ss-ui .foe-blurb { font-size: 13px; font-weight: 400; color: var(--dim); }
#ss-ui .settings { width: min(760px, 100%); max-height: 100%; padding: 0; gap: 0; }
#ss-ui .head { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-bottom: 1px solid var(--line); }
#ss-ui .head h2 { flex: 1; text-align: left; font-size: 26px; }
#ss-ui .head button { min-height: 40px; padding: 8px 14px; }
#ss-ui .status { font-size: 12px; color: var(--dim); padding: 8px 16px 0; }
#ss-ui .body { overflow-y: auto; -webkit-overflow-scrolling: touch; padding: 4px 16px 16px; display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); column-gap: 28px; min-height: 0; flex: 1; }
#ss-ui .group { grid-column: 1 / -1; font-size: 11px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase;
  color: var(--gold); padding: 14px 0 4px; border-bottom: 1px solid var(--line); margin-bottom: 4px; }
#ss-ui .row { display: grid; grid-template-columns: minmax(0, 1fr) auto; column-gap: 10px; align-items: center; padding: 6px 0; min-width: 0; }
#ss-ui .row label { font-size: 14px; min-width: 0; }
#ss-ui .row output { font-size: 13px; color: var(--dim); font-variant-numeric: tabular-nums; }
#ss-ui .row input { grid-column: 1 / -1; width: 100%; height: 28px; margin: 2px 0 0; accent-color: var(--accent); }
#ss-ui .note { grid-column: 1 / -1; font-size: 11px; color: var(--dim); }
#ss-ui .foot { display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap; padding: 12px 16px; border-top: 1px solid var(--line); }
#ss-pause { position: absolute; pointer-events: auto; width: 44px; height: 44px; min-height: 0 !important; padding: 0 !important;
  border-radius: 50% !important; top: max(12px, env(safe-area-inset-top, 0px)); right: max(12px, env(safe-area-inset-right, 0px));
  font-size: 13px !important; letter-spacing: 0 !important; background: rgba(13,14,17,0.55) !important; }
@media (prefers-reduced-motion: no-preference) { #ss-ui .panel { animation: ss-in 0.18s ease-out; } }
@keyframes ss-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
`;
function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}
function fmtVal(v, fmt, step) {
  if (fmt === 'pct') return Math.round(v * 100) + '%';
  if (fmt === 'x') return v.toFixed(2) + '×';
  const dec = step < 0.1 ? 2 : step < 1 ? 1 : 0;
  return v.toFixed(dec);
}
function buildUI() {
  const style = document.createElement('style');
  style.textContent = UI_CSS;
  document.head.appendChild(style);
  const root = el('div'); root.id = 'ss-ui';
  document.body.appendChild(root);

  const main = el('div', 'scrim');
  const mp = el('div', 'panel');
  mp.append(el('h1', null, 'Stick Souls'), el('p', 'tag', 'Two bosses. One greatsword.'));
  const bStart = el('button', 'primary', 'Start'); bStart.type = 'button'; bStart.id = 'ss-start';
  const bSet = el('button', null, 'Settings'); bSet.type = 'button'; bSet.id = 'ss-settings';
  mp.append(bStart, bSet);
  main.appendChild(mp);

  // Start → choose a boss
  const choose = el('div', 'scrim'); choose.hidden = true;
  const cp = el('div', 'panel');
  cp.appendChild(el('h2', null, 'Choose your foe'));
  const pickBtns = [];
  for (const id of Object.keys(BOSSES)) {
    const k = BOSSES[id];
    const b = el('button', 'foe'); b.type = 'button'; b.id = 'ss-foe-' + id;
    b.append(el('span', 'foe-name', k.name), el('span', 'foe-blurb', k.blurb));
    cp.appendChild(b);
    pickBtns.push([b, id]);
  }
  const bBack2 = el('button', null, 'Back'); bBack2.type = 'button';
  cp.appendChild(bBack2);
  choose.appendChild(cp);

  const pause = el('div', 'scrim'); pause.hidden = true;
  const pp = el('div', 'panel');
  pp.appendChild(el('h2', null, 'Paused'));
  const bRes = el('button', 'primary', 'Resume'); bRes.type = 'button';
  const bSet2 = el('button', null, 'Settings'); bSet2.type = 'button';
  const bRestart = el('button', null, 'Restart fight'); bRestart.type = 'button';
  const bMenu = el('button', null, 'Main menu'); bMenu.type = 'button';
  pp.append(bRes, bSet2, bRestart, bMenu);
  pause.appendChild(pp);

  const settings = el('div', 'scrim'); settings.hidden = true;
  const sp = el('div', 'panel settings');
  const head = el('div', 'head');
  head.appendChild(el('h2', null, 'Settings'));
  const bBack = el('button', null, 'Back'); bBack.type = 'button';
  head.appendChild(bBack);
  const status = el('div', 'status', 'Loading saved settings…');
  status.setAttribute('aria-live', 'polite');
  const body = el('div', 'body');
  const rows = [];
  let lastGroup = '';
  for (const s of SETTINGS) {
    const [group, id, label, min, max, step, fmt, restart] = s;
    if (group !== lastGroup) { body.appendChild(el('div', 'group', group)); lastGroup = group; }
    const row = el('div', 'row');
    const inputId = 'set-' + id.replace('.', '-');
    const lab = el('label', null, label); lab.htmlFor = inputId;
    const out = el('output'); out.htmlFor = inputId;
    const inp = el('input'); inp.type = 'range'; inp.id = inputId;
    inp.min = String(min); inp.max = String(max); inp.step = String(step);
    inp.addEventListener('input', () => {
      setPath(T, id, parseFloat(inp.value));
      out.textContent = fmtVal(getPath(T, id), fmt, step);
      applyLive();
      scheduleSave();
    });
    row.append(lab, out, inp);
    if (restart) row.appendChild(el('div', 'note', 'Applies when the fight restarts'));
    body.appendChild(row);
    rows.push({ s, inp, out });
  }
  const foot = el('div', 'foot');
  const bReset = el('button', null, 'Reset to defaults'); bReset.type = 'button';
  const bDone = el('button', 'primary', 'Done'); bDone.type = 'button';
  foot.append(bReset, bDone);
  sp.append(head, status, body, foot);
  settings.appendChild(sp);

  const pauseBtn = el('button', null, 'II'); pauseBtn.id = 'ss-pause'; pauseBtn.type = 'button';
  pauseBtn.setAttribute('aria-label', 'Pause'); pauseBtn.hidden = true;

  root.append(main, choose, pause, settings, pauseBtn);

  let settingsFrom = 'main';
  const openSettings = from => { settingsFrom = from; main.hidden = true; pause.hidden = true; settings.hidden = false; refreshSliders(); setStatus(); bBack.focus(); };
  const closeSettings = () => { settings.hidden = true; (settingsFrom === 'main' ? main : pause).hidden = false; };
  const click = (b, fn) => b.addEventListener('click', () => { audioInit(); sUI(); fn(); });
  click(bStart, () => { main.hidden = true; choose.hidden = false; pickBtns[0][0].focus(); });
  for (const [b, id] of pickBtns) click(b, () => { BK = BOSSES[id]; choose.hidden = true; startGame(); });
  click(bBack2, () => { choose.hidden = true; main.hidden = false; bStart.focus(); });
  click(bSet, () => openSettings('main'));
  click(bRes, () => resumeGame());
  click(bSet2, () => openSettings('pause'));
  click(bRestart, () => { reset(); resumeGame(); });
  click(bMenu, () => toMenu());
  click(bBack, closeSettings);
  click(bDone, closeSettings);
  click(bReset, () => {
    for (const s of SETTINGS) setPath(T, s[1], getPath(DEFAULTS, s[1]));
    refreshSliders(); applyLive(); scheduleSave();
  });
  click(pauseBtn, () => pauseGame());
  return { root, main, choose, pause, settings, pauseBtn, status, rows, bStart };
}
const ui = buildUI();
function refreshSliders() {
  for (const r of ui.rows) {
    const v = getPath(T, r.s[1]);
    r.inp.value = String(v);
    r.out.textContent = fmtVal(v, r.s[6], r.s[5]);
  }
}
function setStatus() {
  if (!ui || !ui.status) return;
  let msg;
  if (!tuning.loaded) msg = 'Loading saved settings…';
  else if (tuning.db && tuning.canWrite) msg = tuning.saving || tuning.dirty ? 'Saving…' : 'Changes save automatically, here and with the page, where Claude can read them.';
  else msg = 'Changes save on this device. Page storage is not available here, so use this device when you ask Claude to apply your tuning.';
  ui.status.textContent = msg;
}
function startGame() { reset(); mode = 'play'; ui.main.hidden = true; ui.choose.hidden = true; ui.pauseBtn.hidden = false; try { cvs.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }
function pauseGame() { if (mode !== 'play') return; mode = 'pause'; releaseAll(); ui.pause.hidden = false; ui.pauseBtn.hidden = true; }
function resumeGame() { mode = 'play'; releaseAll(); ui.pause.hidden = true; ui.settings.hidden = true; ui.pauseBtn.hidden = false; try { cvs.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }
function toMenu() { mode = 'menu'; releaseAll(); reset(); ui.pause.hidden = true; ui.settings.hidden = true; ui.choose.hidden = true; ui.main.hidden = false; ui.pauseBtn.hidden = true; }
