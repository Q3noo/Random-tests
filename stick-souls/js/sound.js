/* Stick Souls — Synthesized sound effects.
   Plain scripts loaded in order by index.html; they share top-level names. */
'use strict';

// ---------------------------------------------------------------- sound (synthesized)
const SFX = { ctx: null, master: null, noise: null };
function audioInit() {
  if (SFX.ctx) { if (SFX.ctx.state === 'suspended') SFX.ctx.resume().catch(() => {}); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  try {
    const c = new AC();
    const comp = c.createDynamicsCompressor();
    const master = c.createGain();
    master.gain.value = T.f.volume;
    master.connect(comp); comp.connect(c.destination);
    const buf = c.createBuffer(1, c.sampleRate, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    Object.assign(SFX, { ctx: c, master, noise: buf });
  } catch (e) { SFX.ctx = null; }
}
function setVolume(v) { if (SFX.master) SFX.master.gain.setTargetAtTime(v, SFX.ctx.currentTime, 0.03); }
const panOf = x => clamp((x - camX) / 700, -0.8, 0.8);
function bus(pan) {
  const c = SFX.ctx, gn = c.createGain();
  if (c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = pan || 0; gn.connect(p); p.connect(SFX.master); }
  else gn.connect(SFX.master);
  return gn;
}
function envGain(gn, t, a, peak, d) {
  gn.gain.setValueAtTime(0.0001, t);
  gn.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a);
  gn.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
}
function noise(t, dur, type, f0, f1, q, peak, a, pan) {
  const c = SFX.ctx, s = c.createBufferSource(), f = c.createBiquadFilter();
  s.buffer = SFX.noise; s.loop = true;
  f.type = type; f.Q.value = q;
  f.frequency.setValueAtTime(f0, t);
  if (f1 !== f0) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const gn = bus(pan);
  envGain(gn, t, a, peak, Math.max(0.01, dur - a));
  s.connect(f); f.connect(gn);
  s.start(t, Math.random() * 0.8); s.stop(t + dur + 0.05);
}
function tone(t, dur, type, f0, f1, peak, a, pan) {
  const c = SFX.ctx, o = c.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const gn = bus(pan);
  envGain(gn, t, a, peak, Math.max(0.01, dur - a));
  o.connect(gn); o.start(t); o.stop(t + dur + 0.05);
}
const snd = fn => (...a) => {
  if (!SFX.ctx || T.f.volume <= 0 || SFX.ctx.state !== 'running') return;
  try { fn(SFX.ctx.currentTime, ...a); } catch (e) { /* audio is optional */ }
};
const sWhoosh = snd((t, x, heavy) => noise(t, heavy ? 0.34 : 0.22, 'bandpass', heavy ? 260 : 420, heavy ? 1300 : 2100, 1.4, heavy ? 0.42 : 0.3, heavy ? 0.16 : 0.09, panOf(x)));
const sImpact = snd((t, x, w) => {
  const p = panOf(x);
  tone(t, 0.22, 'sine', 130, 42, 0.5 + 0.35 * w, 0.004, p);
  noise(t, 0.07, 'highpass', 1800, 1800, 0.7, 0.26, 0.002, p);
  noise(t, 0.2 + 0.15 * w, 'lowpass', 900, 200, 0.8, 0.2 + 0.2 * w, 0.004, p);
});
const sHurt = snd((t, x) => {
  const p = panOf(x);
  tone(t, 0.26, 'sine', 110, 38, 0.7, 0.004, p);
  noise(t, 0.25, 'lowpass', 1200, 180, 0.8, 0.35, 0.003, p);
});
const sClang = snd((t, x) => {
  const p = panOf(x);
  for (const [f, v] of [[523, 0.18], [1307, 0.14], [2093, 0.1], [3311, 0.07]]) tone(t, 0.45, 'triangle', f, f * 0.995, v, 0.002, p);
  noise(t, 0.06, 'highpass', 2500, 2500, 0.7, 0.24, 0.001, p);
  tone(t, 0.12, 'sine', 160, 70, 0.3, 0.003, p);
});
const sParry = snd((t, x) => {
  const p = panOf(x);
  for (const [f, v] of [[1760, 0.2], [2637, 0.14], [3520, 0.09]]) tone(t, 0.9, 'sine', f, f, v, 0.002, p);
  for (const [f, v] of [[660, 0.18], [1550, 0.12]]) tone(t, 0.35, 'triangle', f, f, v, 0.002, p);
  noise(t, 0.08, 'highpass', 3000, 3000, 0.7, 0.28, 0.001, p);
});
const sCrit = snd((t, x) => {
  const p = panOf(x);
  tone(t, 0.5, 'sine', 90, 30, 0.8, 0.004, p);
  noise(t, 0.35, 'lowpass', 1400, 160, 0.8, 0.45, 0.003, p);
  tone(t, 0.6, 'triangle', 980, 940, 0.1, 0.002, p);
});
const sRoll = snd((t, x) => noise(t, 0.26, 'lowpass', 700, 250, 0.7, 0.22, 0.05, panOf(x)));
const sStep = snd((t, x, w) => {
  const p = panOf(x);
  tone(t, 0.14, 'sine', 90, 38, 0.35 * w, 0.004, p);
  noise(t, 0.08, 'lowpass', 400, 150, 0.7, 0.16 * w, 0.004, p);
});
const sJump = snd((t, x) => noise(t, 0.16, 'bandpass', 500, 1100, 1, 0.12, 0.03, panOf(x)));
const sHeal = snd(t => { [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(t + i * 0.09, 0.5, 'sine', f, f, 0.1, 0.02, 0)); });
const sCharge = snd((t, x) => tone(t, 0.3, 'sine', 880, 1320, 0.1, 0.01, panOf(x)));
const sRoar = snd((t, x) => {
  const p = panOf(x);
  tone(t, 1.4, 'sawtooth', 82, 58, 0.2, 0.15, p);
  tone(t, 1.4, 'sawtooth', 123, 88, 0.1, 0.2, p);
  noise(t, 1.3, 'bandpass', 380, 220, 2, 0.3, 0.2, p);
});
const sQuake = snd((t, x) => {
  const p = panOf(x);
  tone(t, 0.6, 'sine', 70, 32, 0.55, 0.01, p);
  noise(t, 0.7, 'lowpass', 320, 80, 0.7, 0.38, 0.01, p);
});
const sDeath = snd(t => {
  tone(t, 1.8, 'sine', 196, 49, 0.3, 0.05, 0);
  tone(t + 0.1, 1.8, 'triangle', 147, 37, 0.16, 0.05, 0);
  noise(t, 1.2, 'lowpass', 600, 100, 0.7, 0.14, 0.1, 0);
});
const sVictory = snd(t => { [261.6, 329.6, 392, 523.3].forEach((f, i) => tone(t + i * 0.12, 2.2, 'triangle', f, f, 0.1, 0.3, 0)); });
const sUI = snd(t => tone(t, 0.06, 'triangle', 1200, 900, 0.07, 0.003, 0));
