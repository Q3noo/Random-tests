// Stick Souls — renders the browser version's synthesized sound effects (stick-souls/js/sound.js)
// to WAV files for Godot. Same recipes: oscillators and filtered noise with exponential
// frequency ramps and exponential gain envelopes, following the Web Audio formulas.
// Run from the stick-souls-godot folder:  node tools/make_sounds.js
// Files are written at half level (so loud ones don't clip); sound.gd plays them back at double gain.
'use strict';
const fs = require('fs');
const path = require('path');

const SR = 44100;
const OUT = path.join(__dirname, '..', 'sounds');
const LEVEL = 0.5;

// seeded random so re-running gives identical files
let seed = 12345;
const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

const lo = 0.0001;
// setValueAtTime(0.0001, t) → exponentialRamp to peak at t+a → exponentialRamp to 0.0001 at t+a+d
function env(t, t0, a, peak, d) {
  const pk = Math.max(0.0002, peak);
  if (t < t0) return 0;
  if (t < t0 + a) return lo * Math.pow(pk / lo, (t - t0) / a);
  if (t < t0 + a + d) return pk * Math.pow(lo / pk, (t - t0 - a) / d);
  return lo;
}
const expRamp = (v0, v1, lt, dur) => (lt >= dur ? v1 : v0 * Math.pow(v1 / v0, lt / dur));

function tone(buf, t0, dur, type, f0, f1, peak, a) {
  const d = Math.max(0.01, dur - a);
  const end = Math.min(buf.length, Math.ceil((t0 + dur + 0.05) * SR));
  let ph = 0;
  for (let i = Math.floor(t0 * SR); i < end; i++) {
    const t = i / SR, lt = t - t0;
    const f = f1 !== f0 ? expRamp(f0, f1, lt, dur) : f0;
    ph += f / SR; ph -= Math.floor(ph);
    let s;
    if (type === 'sine') s = Math.sin(2 * Math.PI * ph);
    else if (type === 'triangle') { const q = (ph + 0.25) % 1; s = 1 - 4 * Math.abs(q - 0.5); }
    else s = 2 * ph - 1;   // sawtooth
    buf[i] += s * env(t, t0, a, peak, d);
  }
}

// Web Audio BiquadFilterNode coefficients (lowpass/highpass Q in dB, bandpass Q linear)
function coeffs(type, f, q) {
  const w0 = 2 * Math.PI * Math.min(f, SR / 2 - 100) / SR, cw = Math.cos(w0), sw = Math.sin(w0);
  let b0, b1, b2, a0, a1, a2;
  if (type === 'bandpass') {
    const al = sw / (2 * q);
    b0 = al; b1 = 0; b2 = -al; a0 = 1 + al; a1 = -2 * cw; a2 = 1 - al;
  } else {
    const al = sw / (2 * Math.pow(10, q / 20));
    if (type === 'lowpass') { b0 = (1 - cw) / 2; b1 = 1 - cw; b2 = (1 - cw) / 2; }
    else { b0 = (1 + cw) / 2; b1 = -(1 + cw); b2 = (1 + cw) / 2; }
    a0 = 1 + al; a1 = -2 * cw; a2 = 1 - al;
  }
  return [b0 / a0, b1 / a0, b2 / a0, a1 / a0, a2 / a0];
}
function noise(buf, t0, dur, type, f0, f1, q, peak, a) {
  const d = Math.max(0.01, dur - a);
  const end = Math.min(buf.length, Math.ceil((t0 + dur + 0.05) * SR));
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = Math.floor(t0 * SR); i < end; i++) {
    const t = i / SR, lt = t - t0;
    const f = f1 !== f0 ? expRamp(f0, f1, lt, dur) : f0;
    const [b0, b1, b2, a1, a2] = coeffs(type, f, q);
    const x = rand() * 2 - 1;
    const y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    buf[i] += y * env(t, t0, a, peak, d);
  }
}

// each recipe: [length in seconds, (buf) => draw]; same numbers as sound.js
const impact = w => [0.5, b => {
  tone(b, 0, 0.22, 'sine', 130, 42, 0.5 + 0.35 * w, 0.004);
  noise(b, 0, 0.07, 'highpass', 1800, 1800, 0.7, 0.26, 0.002);
  noise(b, 0, 0.2 + 0.15 * w, 'lowpass', 900, 200, 0.8, 0.2 + 0.2 * w, 0.004);
}];
const SOUNDS = {
  whoosh_light: [0.3, b => noise(b, 0, 0.22, 'bandpass', 420, 2100, 1.4, 0.3, 0.09)],
  whoosh_heavy: [0.42, b => noise(b, 0, 0.34, 'bandpass', 260, 1300, 1.4, 0.42, 0.16)],
  impact_light: impact(0.25),
  impact_heavy: impact(0.6),
  impact_charged: impact(1),
  hurt: [0.35, b => {
    tone(b, 0, 0.26, 'sine', 110, 38, 0.7, 0.004);
    noise(b, 0, 0.25, 'lowpass', 1200, 180, 0.8, 0.35, 0.003);
  }],
  clang: [0.55, b => {
    for (const [f, v] of [[523, 0.18], [1307, 0.14], [2093, 0.1], [3311, 0.07]]) tone(b, 0, 0.45, 'triangle', f, f * 0.995, v, 0.002);
    noise(b, 0, 0.06, 'highpass', 2500, 2500, 0.7, 0.24, 0.001);
    tone(b, 0, 0.12, 'sine', 160, 70, 0.3, 0.003);
  }],
  parry: [1.0, b => {
    for (const [f, v] of [[1760, 0.2], [2637, 0.14], [3520, 0.09]]) tone(b, 0, 0.9, 'sine', f, f, v, 0.002);
    for (const [f, v] of [[660, 0.18], [1550, 0.12]]) tone(b, 0, 0.35, 'triangle', f, f, v, 0.002);
    noise(b, 0, 0.08, 'highpass', 3000, 3000, 0.7, 0.28, 0.001);
  }],
  crit: [0.7, b => {
    tone(b, 0, 0.5, 'sine', 90, 30, 0.8, 0.004);
    noise(b, 0, 0.35, 'lowpass', 1400, 160, 0.8, 0.45, 0.003);
    tone(b, 0, 0.6, 'triangle', 980, 940, 0.1, 0.002);
  }],
  roll: [0.34, b => noise(b, 0, 0.26, 'lowpass', 700, 250, 0.7, 0.22, 0.05)],
  // footstep at weight 1; sound.gd scales the level by the weight like the original
  step: [0.22, b => {
    tone(b, 0, 0.14, 'sine', 90, 38, 0.35, 0.004);
    noise(b, 0, 0.08, 'lowpass', 400, 150, 0.7, 0.16, 0.004);
  }],
  heal: [0.9, b => [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(b, i * 0.09, 0.5, 'sine', f, f, 0.1, 0.02))],
  charge: [0.38, b => tone(b, 0, 0.3, 'sine', 880, 1320, 0.1, 0.01)],
  roar: [1.5, b => {
    tone(b, 0, 1.4, 'sawtooth', 82, 58, 0.2, 0.15);
    tone(b, 0, 1.4, 'sawtooth', 123, 88, 0.1, 0.2);
    noise(b, 0, 1.3, 'bandpass', 380, 220, 2, 0.3, 0.2);
  }],
  quake: [0.8, b => {
    tone(b, 0, 0.6, 'sine', 70, 32, 0.55, 0.01);
    noise(b, 0, 0.7, 'lowpass', 320, 80, 0.7, 0.38, 0.01);
  }],
  death: [2.0, b => {
    tone(b, 0, 1.8, 'sine', 196, 49, 0.3, 0.05);
    tone(b, 0.1, 1.8, 'triangle', 147, 37, 0.16, 0.05);
    noise(b, 0, 1.2, 'lowpass', 600, 100, 0.7, 0.14, 0.1);
  }],
  victory: [2.65, b => [261.6, 329.6, 392, 523.3].forEach((f, i) => tone(b, i * 0.12, 2.2, 'triangle', f, f, 0.1, 0.3))],
  ui: [0.12, b => tone(b, 0, 0.06, 'triangle', 1200, 900, 0.07, 0.003)],
};

function wav(buf) {
  const n = buf.length, out = Buffer.alloc(44 + n * 2);
  out.write('RIFF', 0); out.writeUInt32LE(36 + n * 2, 4); out.write('WAVE', 8);
  out.write('fmt ', 12); out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20); out.writeUInt16LE(1, 22);
  out.writeUInt32LE(SR, 24); out.writeUInt32LE(SR * 2, 28); out.writeUInt16LE(2, 32); out.writeUInt16LE(16, 34);
  out.write('data', 36); out.writeUInt32LE(n * 2, 40);
  let clipped = 0;
  for (let i = 0; i < n; i++) {
    let v = buf[i] * LEVEL;
    if (Math.abs(v) > 1) { clipped++; v = Math.sign(v); }
    out.writeInt16LE(Math.round(v * 32767), 44 + i * 2);
  }
  return [out, clipped];
}

fs.mkdirSync(OUT, { recursive: true });
for (const [name, [len, draw]] of Object.entries(SOUNDS)) {
  const buf = new Float32Array(Math.ceil(len * SR));
  draw(buf);
  // short fade at the very end so nothing clicks
  const fade = Math.min(buf.length, 220);
  for (let i = 0; i < fade; i++) buf[buf.length - 1 - i] *= i / fade;
  const peak = buf.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
  const [data, clipped] = wav(buf);
  fs.writeFileSync(path.join(OUT, name + '.wav'), data);
  console.log(`${name.padEnd(15)} ${len.toFixed(2)}s  peak ${(peak * LEVEL).toFixed(2)}${clipped ? `  CLIPPED ${clipped}` : ''}`);
}
