/* Stick Souls — Keyboard and touch input.
   Plain scripts loaded in order by index.html; they share top-level names. */
'use strict';

// ---------------------------------------------------------------- input
const input = { l: false, r: false, pad: 0, kbHeavy: false, blockHeld: false, buffer: null,
  atk: { down: false, at: 0, heavy: false } };
const now = () => performance.now() / 1000;
const inDir = () => ((input.r ? 1 : 0) - (input.l ? 1 : 0)) || input.pad;
const heavyHeld = () => input.kbHeavy || (input.atk.down && input.atk.heavy);
function press(a) { if (!ended && mode === 'play') input.buffer = { a, at: now() }; }
function buffered() {
  const b = input.buffer;
  if (!b) return null;
  if (now() - b.at > T.p.buffer) { input.buffer = null; return null; }
  return b.a;
}
// one attack button: release before the hold time = light; keep holding = heavy (and charge)
function atkDown() { input.atk.down = true; input.atk.at = now(); input.atk.heavy = false; }
function atkUp() { if (input.atk.down && !input.atk.heavy) press('light'); input.atk.down = false; }
function blockDown() { input.blockHeld = true; P.blockPressAt = now(); press('block'); }
function blockUp() { input.blockHeld = false; }
function releaseAll() {
  input.l = input.r = input.kbHeavy = input.blockHeld = false; input.pad = 0;
  input.atk.down = false; input.buffer = null;
  for (const b of btns) b.down = false;
  ptrs.clear();
}

const KEYMAP = {
  ArrowLeft: 'l', KeyA: 'l', ArrowRight: 'r', KeyD: 'r',
  KeyJ: 'atk', KeyZ: 'atk', KeyK: 'heavy', KeyX: 'heavy',
  Space: 'roll', KeyW: 'jump', ArrowUp: 'jump', ShiftLeft: 'block', ShiftRight: 'block',
  KeyE: 'heal', KeyH: 'heal', KeyC: 'heal',
};
window.addEventListener('keydown', e => {
  if (e.code === 'Escape' || e.code === 'KeyP') {
    if (mode === 'play') { pauseGame(); e.preventDefault(); }
    else if (mode === 'pause' && ui.settings.hidden) { resumeGame(); e.preventDefault(); }
    return;
  }
  if (mode !== 'play') return;
  if ((e.code === 'KeyR' || e.code === 'Enter') && ended && ended.t > 0.5) { reset(); e.preventDefault(); return; }
  const a = KEYMAP[e.code];
  if (!a) return;
  e.preventDefault();
  if (e.repeat) return;
  if (a === 'l') input.l = true;
  else if (a === 'r') input.r = true;
  else if (a === 'atk') atkDown();
  else if (a === 'heavy') { input.kbHeavy = true; press('heavy'); }
  else if (a === 'block') blockDown();
  else press(a);
});
window.addEventListener('keyup', e => {
  const a = KEYMAP[e.code];
  if (a === 'l') input.l = false;
  else if (a === 'r') input.r = false;
  else if (a === 'atk') atkUp();
  else if (a === 'heavy') input.kbHeavy = false;
  else if (a === 'block') blockUp();
});
window.addEventListener('blur', () => { releaseAll(); if (mode === 'play') pauseGame(); });

// touch controls: floating stick on the left half, buttons on the right, heal top-left
let touchUI = false;
try { touchUI = window.matchMedia('(pointer: coarse)').matches; } catch (e) { /* desktop default */ }
const btns = [
  { act: 'light', label: 'ATTACK', sub: 'hold: heavy' }, { act: 'roll', label: 'ROLL' },
  { act: 'jump', label: 'JUMP' }, { act: 'block', label: 'BLOCK' }, { act: 'heal', label: 'HEAL' },
];
const btn = a => btns.find(b => b.act === a);
const ptrs = new Map();
let padHome = { x: 0, y: 0, r: 40 };

cvs.addEventListener('pointerdown', e => {
  e.preventDefault();
  try { cvs.focus({ preventScroll: true }); } catch (err) { /* ignore */ }
  if (e.pointerType === 'touch' && !touchUI) { touchUI = true; layout(); }
  if (mode !== 'play') return;
  if (ended) { if (ended.t > 0.6) reset(); return; }
  if (!touchUI) return;
  try { cvs.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  const x = e.clientX, y = e.clientY;
  for (const b of btns) {
    if (Math.hypot(x - b.x, y - b.y) <= b.r * 1.15) {
      ptrs.set(e.pointerId, { b });
      b.down = true;
      if (b.act === 'light') atkDown();
      else if (b.act === 'block') blockDown();
      else press(b.act);
      return;
    }
  }
  if (x < W * 0.5) { ptrs.set(e.pointerId, { pad: true, ox: x, oy: y, x, y, dx: 0 }); updatePad(); }
}, { passive: false });
cvs.addEventListener('pointermove', e => {
  const p = ptrs.get(e.pointerId);
  if (!p || !p.pad) return;
  p.x = e.clientX; p.y = e.clientY;
  const lim = padHome.r;
  if (p.x - p.ox > lim) p.ox = p.x - lim;
  if (p.ox - p.x > lim) p.ox = p.x + lim;
  p.dx = p.x - p.ox;
  updatePad();
});
function endPtr(e) {
  const p = ptrs.get(e.pointerId);
  if (!p) return;
  ptrs.delete(e.pointerId);
  if (p.b) {
    p.b.down = false;
    if (p.b.act === 'light') atkUp();
    else if (p.b.act === 'block') blockUp();
  }
  updatePad();
}
cvs.addEventListener('pointerup', endPtr);
cvs.addEventListener('pointercancel', endPtr);
cvs.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('gesturestart', e => e.preventDefault());
function updatePad() {
  let dir = 0;
  for (const p of ptrs.values()) if (p.pad) dir = p.dx > 14 ? 1 : p.dx < -14 ? -1 : 0;
  input.pad = dir;
}
