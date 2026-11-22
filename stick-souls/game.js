/* Stick Souls — one boss fight, all focus on movement, animation and combat feel.
   Everything is drawn in code: stick figures built from joints, posed with keyframes
   and two-bone IK, hit detection uses the real animated weapon geometry. */
(() => {
'use strict';

// ---------------------------------------------------------------- canvas
const cvs = document.getElementById('game');
const g = cvs.getContext('2d');
const safeEl = document.getElementById('safe');
const FONT_D = "'IM Fell English SC', Georgia, 'Times New Roman', serif";
const FONT_UI = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
try { document.fonts.load('24px "IM Fell English SC"'); } catch (e) { /* fallback font is fine */ }

// ---------------------------------------------------------------- tuning
// Every gameplay number lives here so feel can be tuned in one place.
const T = {
  arenaL: 40, arenaR: 1440,
  step: 1 / 120,
  p: {
    hp: 100, st: 100, stRegen: 50, stDelay: 0.45, stDelayEmpty: 1.0,
    walk: 175, walkBack: 125, accel: 1600,
    flasks: 3, flaskHeal: 45,
    costLight: 16, costHeavy: 28, costRoll: 22,
    rollDist: 225, buffer: 0.32,
    dmgL1: 10, dmgL2: 11, dmgHeavy: 20, dmgCharged: 34,
    poiseL: 14, poiseHeavy: 30, poiseCharged: 50,
    chargeTime: 0.7, chargeMax: 1.25,
  },
  b: {
    hp: 520, poise: 100, poise2: 120, poiseDelay: 2.4, poiseRegen: 30, staggerMult: 1.5,
    walk: 80, walk2: 100, phase2At: 0.5, speed2: 1.16,
    cdLeap: 6, cdStomp: 3.5,
  },
};
const BOSS_NAME = 'Gaunt Warden';

const C = {
  bg: '#0d0e11',
  ground: '#cfc9bd',
  player: '#eeebe4', hurt: '#ff7a68',
  blade: '#a7bdd3', bladeHot: '#eef5ff', hilt: '#857a6a',
  boss: '#b8b0a2', boss2: '#cfa08f', bossFlash: '#ffffff', club: '#8a7863', eye: '#ff4a35',
  spark: '#fff1cf', blood: '#ff8b73', heal: '#e8b752',
  hp: '#b8382e', st: '#6aa062', flask: '#d9a441', bossHp: '#9d2d25', ghost: '#e0bf78',
  ui: '#e9e6df',
};

// ---------------------------------------------------------------- utils
const D2R = Math.PI / 180;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const approach = (v, t, d) => (v < t ? Math.min(t, v + d) : Math.max(t, v - d));
const EASE = {
  lin: t => t,
  in: t => t * t * t,
  in2: t => t * t,
  out: t => 1 - (1 - t) ** 3,
  out2: t => 1 - (1 - t) ** 2,
  io: t => (t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2),
};

// ---------------------------------------------------------------- pose + keyframes
// A pose is a set of numbers in "facing space" (+x forward, +y down, origin on the ground
// under the character). Hands and feet are IK targets; the weapon angle w is in degrees.
const KEYS = ['hx', 'hy', 'lean', 'head', 'ax', 'ay', 'bx', 'by', 'w', 'th', 'ea', 'eb',
  'f1x', 'f1y', 'f2x', 'f2y', 'rot', 'ox', 'oy'];
const BASE = Symbol('base');

// Build an animation. Each key = [time, changes, ease, extra]; changes accumulate from the
// previous key, BASE resets to the base pose. Key 0 is replaced by the live pose at start,
// so every action blends in from wherever the body was.
function mk(base, keys) {
  const ks = [];
  let prev = { ...base };
  for (const [t, o, e, o2] of keys) {
    const p = o === BASE ? { ...base } : { ...prev, ...o };
    if (o2) Object.assign(p, o2);
    ks.push({ t, p, e: EASE[e || 'io'] });
    prev = p;
  }
  return { dur: ks[ks.length - 1].t, ks };
}
function copyPose(src, out) { for (const k of KEYS) out[k] = src[k]; return out; }
function sample(an, t, start, out) {
  const ks = an.ks;
  if (t <= 0) return copyPose(start || ks[0].p, out);
  for (let i = 1; i < ks.length; i++) {
    const k = ks[i];
    if (t <= k.t) {
      const a = i === 1 && start ? start : ks[i - 1].p;
      const t0 = ks[i - 1].t, span = k.t - t0;
      const u = span > 0 ? k.e(clamp((t - t0) / span, 0, 1)) : 1;
      for (const key of KEYS) out[key] = a[key] + (k.p[key] - a[key]) * u;
      return out;
    }
  }
  return copyPose(ks[ks.length - 1].p, out);
}
// Stretch an attack after time `after` (used for the boss's delayed swings).
function shifted(def, after, extra) {
  if (extra <= 0.001) return def;
  const sh = t => (t > after ? t + extra : t);
  const nd = { ...def, an: { dur: def.an.dur + extra, ks: def.an.ks.map(k => ({ ...k, t: sh(k.t) })) } };
  for (const f of ['act', 'cancel', 'track']) if (nd[f] != null) nd[f] = sh(nd[f]);
  if (def.hits) nd.hits = def.hits.map(h => ({ ...h, t0: sh(h.t0), t1: sh(h.t1) }));
  if (def.events) nd.events = def.events.map(e => ({ ...e, t: sh(e.t) }));
  if (def.moves) nd.moves = def.moves.map(m => ({ ...m, t0: sh(m.t0), t1: sh(m.t1) }));
  if (def.leap) nd.leap = { ...def.leap, t0: sh(def.leap.t0), t1: sh(def.leap.t1) };
  return nd;
}

// ---------------------------------------------------------------- skeleton
// Two-bone IK. bend in [-1, 1] picks (and blends) which way the middle joint folds.
function joint(ax, ay, tx, ty, l1, l2, bend) {
  let dx = tx - ax, dy = ty - ay, d = Math.hypot(dx, dy);
  const m = l1 + l2 - 0.01;
  if (d > m) { dx *= m / d; dy *= m / d; d = m; }
  if (d < 0.01) d = 0.01;
  const base = Math.atan2(dy, dx);
  const a0 = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
  // The two exact solutions mirror each other across the shoulder→hand line. Blending between
  // them moves the elbow as if it turned in depth, so neither bone ever stretches.
  const jx = ax + Math.cos(base + a0) * l1, jy = ay + Math.sin(base + a0) * l1;
  const mx = ax + Math.cos(base) * l1 * Math.cos(a0), my = ay + Math.sin(base) * l1 * Math.cos(a0);
  return [mx + (jx - mx) * bend, my + (jy - my) * bend, ax + dx, ay + dy];
}
function solve(R, p, X, Y, face) {
  const L = p.lean * D2R, HA = (p.lean + p.head) * D2R;
  const hip = [p.hx, p.hy];
  const sh = [hip[0] + Math.sin(L) * R.spine, hip[1] - Math.cos(L) * R.spine];
  const ux = Math.sin(HA), uy = -Math.cos(HA);
  const nk = [sh[0] + ux * R.neck, sh[1] + uy * R.neck];
  const hd = [sh[0] + ux * (R.neck + R.headR), sh[1] + uy * (R.neck + R.headR)];
  const A = joint(sh[0], sh[1], sh[0] + p.ax, sh[1] + p.ay, R.upper, R.fore, p.ea);
  const hA = [A[2], A[3]];
  const wa = p.w * D2R, wx = Math.cos(wa), wy = Math.sin(wa);
  // second hand: free target, or locked onto the grip for a two-handed hold (th = 1)
  const tbx = lerp(sh[0] + p.bx, hA[0] - wx * R.grip, p.th);
  const tby = lerp(sh[1] + p.by, hA[1] - wy * R.grip, p.th);
  const Bj = joint(sh[0], sh[1], tbx, tby, R.upper, R.fore, p.eb);
  const K1 = joint(hip[0], hip[1], p.f1x, p.f1y, R.thigh, R.shin, -1);
  const K2 = joint(hip[0], hip[1], p.f2x, p.f2y, R.thigh, R.shin, -1);
  const pts = {
    hip, sh, nk, hd,
    eA: [A[0], A[1]], hA, eB: [Bj[0], Bj[1]], hB: [Bj[2], Bj[3]],
    k1: [K1[0], K1[1]], f1: [K1[2], K1[3]], k2: [K2[0], K2[1]], f2: [K2[2], K2[3]],
    wb: [hA[0] - wx * R.pommel, hA[1] - wy * R.pommel],
    wt: [hA[0] + wx * R.wlen, hA[1] + wy * R.wlen],
  };
  const r = p.rot * D2R, c = Math.cos(r), s = Math.sin(r);
  const S = {};
  for (const k in pts) {
    let x = pts[k][0], y = pts[k][1];
    if (r) { const dx = x - R.pvx, dy = y - R.pvy; x = R.pvx + dx * c - dy * s; y = R.pvy + dx * s + dy * c; }
    S[k] = [X + face * (x + p.ox), Y + y + p.oy];
  }
  let vx = ux, vy = uy;
  if (r) { vx = ux * c - uy * s; vy = ux * s + uy * c; }
  S.up = [face * vx, vy];
  S.fw = [face * -vy, vx];
  return S;
}

// Closest distance between two segments, plus the contact point.
function segDist(ax, ay, bx, by, cx, cy, dx, dy) {
  const d1x = bx - ax, d1y = by - ay, d2x = dx - cx, d2y = dy - cy, rx = ax - cx, ry = ay - cy;
  const a = d1x * d1x + d1y * d1y, e = d2x * d2x + d2y * d2y, f = d2x * rx + d2y * ry;
  let s = 0, t = 0;
  if (a > 1e-9 || e > 1e-9) {
    if (a <= 1e-9) t = clamp(f / e, 0, 1);
    else {
      const c = d1x * rx + d1y * ry;
      if (e <= 1e-9) s = clamp(-c / a, 0, 1);
      else {
        const b = d1x * d2x + d1y * d2y, den = a * e - b * b;
        s = den !== 0 ? clamp((b * f - c * e) / den, 0, 1) : 0;
        t = (b * s + f) / e;
        if (t < 0) { t = 0; s = clamp(-c / a, 0, 1); } else if (t > 1) { t = 1; s = clamp((b - c) / a, 0, 1); }
      }
    }
  }
  const p1x = ax + d1x * s, p1y = ay + d1y * s, p2x = cx + d2x * t, p2y = cy + d2y * t;
  return [Math.hypot(p1x - p2x, p1y - p2y), (p1x + p2x) / 2, (p1y + p2y) / 2];
}
function hitTest(a, b, r, caps) {
  for (const cp of caps) {
    const h = segDist(a[0], a[1], b[0], b[1], cp[0][0], cp[0][1], cp[1][0], cp[1][1]);
    if (h[0] <= r + cp[2]) return h;
  }
  return null;
}

// ---------------------------------------------------------------- secondary motion (visual only)
// Layered on top of the animation pose every step, just before drawing. Weapon hit checks use the
// animation pose directly, and the only layer that can move a weapon (torso lean) is limited to
// walking and fades out within 0.12s of an action starting, before any hit window opens.
const PC = { walk: T.p.walk, leanV: 5, lean: [11, 0.5], head: [26, 0.55], thr: 9, reach: 26, dur: 0.11, lift: 6 };
const BC = { walk: 80, leanV: 3, lean: [6, 0.45], head: [16, 0.5], arm: [9, 0.35, 0.12], thr: 24, reach: 70, dur: 0.2, lift: 16 };
function newMotion(ch) {
  Object.assign(ch, {
    dpose: {}, feet: [{ off: 0, step: null }, { off: 0, step: null }],
    sx: ch.x, sy: ch.y, svx: 0, svy: 0, lastFace: ch.face, lw: 0,
    sLean: { x: 0, v: 0 }, sHead: { x: null, v: 0 }, sArmX: { x: 0, v: 0 }, sArmY: { x: 0, v: 0 },
  });
}
// damped spring: w = stiffness (rad/s), z = damping ratio (below 1 overshoots a little)
function spring(s, target, w, z, dt) {
  s.v += (w * w * (target - s.x) - 2 * z * w * s.v) * dt;
  s.x += s.v * dt;
}
// Walk cycle with a planted stance half: the foot moves back exactly as fast as the body moves
// forward, so it stays still on the ground, then lifts and swings forward on an arc.
function gait(ph, S, H) {
  const p = ph - Math.floor(ph);
  if (p < 0.5) return [S - 4 * S * p, 0];
  const u = (p - 0.5) * 2;
  return [-S + 2 * S * EASE.io(u), H * Math.sin(Math.PI * u)];
}
function startStep(f, cfg) {
  const k = Math.abs(f.off) / cfg.thr;
  f.step = { from: f.off, t: 0, dur: cfg.dur * clamp(0.6 + 0.25 * k, 0.7, 1.4), h: clamp(0.4 + 0.4 * k, 0.5, 1.4) };
}
// Feet on the ground ignore root motion (attack steps, lunges, knockback) and take a quick
// arcing step to catch up once they fall too far behind, so they never skate.
function plantFeet(ch, cfg, dt, mode, dx, p) {
  const K = [['f1x', 'f1y'], ['f2x', 'f2y']];
  for (let i = 0; i < 2; i++) {
    const f = ch.feet[i], other = ch.feet[1 - i];
    let lift = 0;
    if (f.step) {
      f.step.t += dt;
      const u = clamp(f.step.t / f.step.dur, 0, 1);
      f.off = f.step.from * (1 - EASE.io(u));
      lift = cfg.lift * f.step.h * Math.sin(Math.PI * u);
      if (u >= 1) { f.step = null; f.off = 0; }
    } else if (mode === 'free' || p[K[i][1]] < -2) {
      f.off *= Math.exp(-18 * dt);
    } else if (mode === 'lock') {
      f.off -= dx;
      if (Math.abs(f.off) > cfg.thr && (!other.step || Math.abs(f.off) > cfg.reach)) startStep(f, cfg);
    } else if (Math.abs(f.off) > 1.5) {
      if (!other.step) startStep(f, cfg);
    } else f.off = 0;
    p[K[i][0]] += ch.face * f.off;
    p[K[i][1]] -= lift;
  }
}
// mode: 'gait' (walking/standing), 'lock' (grounded action), 'free' (airborne, rolling, knocked down)
function finalize(ch, cfg, dt, mode) {
  const p = copyPose(ch.pose, ch.dpose);
  const dx = ch.x - ch.sx, dy = ch.y - ch.sy;
  ch.sx = ch.x; ch.sy = ch.y;
  const vx = dx / dt, vy = dy / dt;
  const ax = clamp((vx - ch.svx) / dt, -15000, 15000), ay = clamp((vy - ch.svy) / dt, -15000, 15000);
  ch.svx = vx; ch.svy = vy;
  if (ch.face !== ch.lastFace) {
    ch.lastFace = ch.face;
    for (const f of ch.feet) { f.off = 0; f.step = null; }
    ch.sArmX.x = ch.sArmX.v = 0;
  }
  const free = mode === 'free' || Math.abs(p.rot) > 0.01;
  const al = ax * ch.face;
  // torso settles into walking speed and pitches a little on starts and stops
  if (mode === 'gait') {
    spring(ch.sLean, clamp(cfg.leanV * vx * ch.face / cfg.walk - 0.0035 * al, -9, 9), cfg.lean[0], cfg.lean[1], dt);
    ch.lw = 1;
  } else ch.lw = Math.max(0, ch.lw - dt / 0.12);
  p.lean += ch.sLean.x * ch.lw;
  // head trails fast torso moves slightly, then settles
  const hT = p.lean + p.head;
  if (free || ch.sHead.x === null) { ch.sHead.x = hT; ch.sHead.v = 0; }
  else {
    spring(ch.sHead, hT, cfg.head[0], cfg.head[1], dt);
    ch.sHead.x = clamp(ch.sHead.x, hT - 22, hT + 22);
  }
  p.head = ch.sHead.x - p.lean;
  // a free (non-weapon) arm swings against the body's acceleration
  if (cfg.arm) {
    if (free) {
      ch.sArmX.x *= Math.exp(-10 * dt); ch.sArmY.x *= Math.exp(-10 * dt); ch.sArmX.v = ch.sArmY.v = 0;
    } else {
      const [w, z, gain] = cfg.arm;
      ch.sArmX.v -= al * gain * dt; ch.sArmY.v -= ay * gain * dt;
      spring(ch.sArmX, 0, w, z, dt); spring(ch.sArmY, 0, w, z, dt);
      ch.sArmX.x = clamp(ch.sArmX.x, -22, 22); ch.sArmY.x = clamp(ch.sArmY.x, -22, 22);
    }
    p.bx += ch.sArmX.x; p.by += ch.sArmY.x;
  }
  plantFeet(ch, cfg, dt, free ? 'free' : mode, dx, p);
  return p;
}

// ---------------------------------------------------------------- player rig + moves
const PR = { thigh: 23, shin: 23, spine: 31, neck: 5, headR: 8.5, upper: 17.5, fore: 17.5,
  grip: 11, pommel: 14, wlen: 76, pvx: 12, pvy: -26, line: 4 };
const PB = { hx: 0, hy: -42, lean: 8, head: -4, ax: 14, ay: 22, bx: 8, by: 24, w: -38, th: 1, ea: 1, eb: 1,
  f1x: 13, f1y: 0, f2x: -12, f2y: 0, rot: 0, ox: 0, oy: 0 };
const GUARD = { hx: 0, hy: -42, lean: 8, head: -4, ax: 14, ay: 22, w: -38, th: 1, ea: 1,
  f1x: 14, f1y: 0, f2x: -12, f2y: 0, rot: 0, ox: 0, oy: 0 };
const TUCK = { hy: -24, lean: 62, head: 22, ax: 8, ay: 12, w: -208, f1x: 10, f1y: -9, f2x: 0, f2y: -5 };
const DOWN_KEYS = [
  [0, {}],
  [0.12, { lean: -30, head: -25, rot: -35, hy: -40, ax: -4, ay: -14, w: -130, f1x: 22, f1y: -12, f2x: 4, f2y: -4 }, 'out'],
  [0.36, { rot: -88, oy: 20, ox: -6, lean: -6, head: -10, hy: -44, ax: 10, ay: 10, w: -30, f1x: 16, f1y: 0, f2x: 6, f2y: -6 }, 'in2'],
];

const PA = {
  // light 1: overhead diagonal chop
  light1: {
    an: mk(PB, [
      [0, {}],
      [0.22, { ax: 0, ay: -10, w: -150, lean: -3, hy: -43, head: -2, f1x: 15, f2x: -14 }, 'out'],
      [0.33, { ax: 26, ay: 20, w: 32, lean: 22, hy: -37, head: -8, f1x: 24, f2x: -15 }, 'in'],
      [0.45, { ax: 24, ay: 18, w: 36, lean: 24 }, 'out'],
      [0.63, { ...GUARD, lean: 5, hy: -43, ay: 20, w: -45 }, 'out'],
      [0.74, GUARD, 'io'],
    ]),
    hits: [{ t0: 0.23, t1: 0.36, dmg: 'dmgL1', poise: 'poiseL' }],
    moves: [{ t0: 0.16, t1: 0.34, d: 24 }],
    cost: 'costLight', chainAt: 0.40, act: 0.62, rollAt: 0.46, next: 'light2', atk: true,
  },
  // light 2: rising slash out of the first swing
  light2: {
    an: mk(PB, [
      [0, {}],
      [0.17, { ax: 8, ay: 22, w: 36, lean: 16, hy: -38, head: -6, f1x: 18, f2x: -15 }, 'out'],
      [0.29, { ax: 24, ay: -22, w: -78, lean: 10, hy: -45, head: -8, f1x: 27, f2x: -12 }, 'in'],
      [0.43, { ax: 16, ay: -28, w: -100, lean: 4 }, 'out'],
      [0.62, { ...GUARD, lean: 10, ay: 24, w: -31 }, 'out'],
      [0.72, GUARD, 'io'],
    ]),
    hits: [{ t0: 0.18, t1: 0.31, dmg: 'dmgL2', poise: 'poiseL' }],
    moves: [{ t0: 0.14, t1: 0.29, d: 18 }],
    cost: 'costLight', chainAt: 0.38, act: 0.6, rollAt: 0.44, next: 'light1', atk: true,
  },
  // heavy: wind up over the head, hold to charge, release to slam
  heavyWind: {
    an: mk(PB, [
      [0, {}],
      [0.44, { ax: -6, ay: -26, w: -160, lean: -8, hy: -40, head: -8, f1x: 19, f2x: -18 }, 'out'],
    ]),
    cost: 'costHeavy', armor: [0.08, 99], atk: true,
  },
  heavyStrike: {
    an: mk(PB, [
      [0, {}],
      [0.11, { ax: 28, ay: 18, w: 35, lean: 30, hy: -33, head: -2, f1x: 30, f2x: -16 }, 'in'],
      [0.20, { lean: 31, hy: -32 }, 'out'],
      [0.48, { lean: 30 }, 'lin'],
      [0.67, { ...GUARD, lean: 4, hy: -43, w: -46 }, 'out'],
      [0.78, GUARD, 'io'],
    ]),
    hits: [{ t0: 0, t1: 0.13, heavy: true }],
    moves: [{ t0: 0, t1: 0.12, d: 30, e: 'out' }],
    events: [{ t: 0.11, ev: 'pImpact' }],
    armor: [0, 0.14], act: 0.66, rollAt: 0.5, atk: true,
  },
  // roll: invincible from 0.03s to 0.38s
  roll: {
    an: mk(PB, [
      [0, {}],
      [0.08, { hy: -32, lean: 38, head: 10, ax: 12, ay: 18, w: -60, f1x: 20, f2x: -16, f2y: -6 }, 'out'],
      [0.14, { ...TUCK, rot: 50 }, 'lin'],
      [0.36, { ...TUCK, rot: 320 }, 'lin'],
      [0.45, { hy: -34, lean: 22, head: 0, ax: 14, ay: 20, w: -30, f1x: 16, f1y: 0, f2x: -14, f2y: 0, rot: 360 }, 'out'],
      [0.56, { ...GUARD, rot: 360 }, 'io'],
    ]),
    moves: [{ t0: 0.03, t1: 0.46, d: 'rollDist', e: 'out2' }],
    inv: [0.03, 0.38], cost: 'costRoll', act: 0.48, rollAt: 0.48, roll: true,
  },
  // heal: plant the sword, drink. The flask is used at 0.6s; getting hit before that saves it.
  heal: {
    an: mk(PB, [
      [0, {}],
      [0.18, { th: 0, ax: 16, ay: 10, w: 80, bx: 14, by: 16, lean: 6, hy: -41, head: -4 }, 'out'],
      [0.42, { bx: 9, by: -9, head: -24 }, 'io'],
      [0.72, { bx: 9, by: -10, head: -26 }, 'lin'],
      [0.95, { ...GUARD, bx: 8, by: 24 }, 'io'],
      [1.1, {}, 'lin'],
    ]),
    events: [{ t: 0.6, ev: 'heal' }], act: 1.0, rollAt: 1.0,
  },
  flinch: {
    an: mk(PB, [
      [0, {}],
      [0.07, { lean: -16, head: -20, hy: -40, ax: 8, ay: 14, w: -72, f1x: 16, f2x: -16 }, 'out'],
      [0.40, GUARD, 'io'],
    ]),
    act: 0.34, rollAt: 0.34,
  },
  // knockdown: thrown back, land, get up (invincible the whole time)
  down: {
    an: mk(PB, [
      ...DOWN_KEYS,
      [0.85, { rot: -90, oy: 21 }, 'lin'],
      [1.05, { rot: -30, oy: 6, ox: 0, hy: -26, lean: 40, head: 0, ax: 14, ay: 20, w: -20, f1x: 16, f1y: 0, f2x: -10, f2y: 0 }, 'out'],
      [1.3, GUARD, 'io'],
    ]),
    inv: [0, 1.2], act: 1.24, rollAt: 1.24, air: [0, 0.36, 26],
  },
  dead: {
    an: mk(PB, [...DOWN_KEYS, [3, { rot: -90, oy: 21 }, 'lin']]),
    inv: [0, 99], air: [0, 0.36, 26],
  },
};

// ---------------------------------------------------------------- boss rig + moves
const BR = { thigh: 58, shin: 58, spine: 86, neck: 10, headR: 18, upper: 56, fore: 56,
  grip: 0, pommel: 16, wlen: 128, pvx: 0, pvy: -50, line: 8.5 };
const BB = { hx: 0, hy: -100, lean: 24, head: -14, ax: 30, ay: 68, bx: 46, by: 52, w: 58, th: 0, ea: 1, eb: 1,
  f1x: 42, f1y: 0, f2x: -46, f2y: 0, rot: 0, ox: 0, oy: 0 };
const KNEEL = { hy: -62, lean: 56, head: 6, ax: 30, ay: 70, w: 85, bx: 50, by: 66, f1x: 50, f1y: 0, f2x: -30, f2y: 0 };

const BA = {
  // overhead smash; the hold before the swing gets a random delay (longer in phase 2)
  smash: {
    an: mk(BB, [
      [0, {}],
      [0.75, { hy: -106, lean: 0, head: -6, ax: -14, ay: -86, w: -115, bx: 40, by: -20, f1x: 46, f2x: -44 }, 'out'],
      [1.0, { lean: -4, ay: -90, w: -121 }, 'lin'],
      [1.16, { hy: -86, lean: 38, head: -20, ax: 70, ay: 62, w: 34, bx: 50, by: 40, f1x: 70, f2x: -44 }, 'in'],
      [1.26, { w: 40, ay: 64 }, 'out'],
      [2.0, { w: 38, lean: 34, hy: -90 }, 'lin'],
      [2.25, BASE, 'out', { lean: 17, hy: -104, w: 48, ay: 62 }],
      [2.4, BASE, 'io'],
    ]),
    hits: [{ t0: 1.02, t1: 1.2, dmg: 30, knock: 'down' }],
    events: [{ t: 1.16, ev: 'smash' }],
    moves: [{ t0: 0.95, t1: 1.15, d: 50, adapt: [200, 0, 80] }],
    track: 0.6, act: 2.4, cancel: 1.5, hold: [0.75, 0.15, 0.5], atk: true,
  },
  // low scoop from behind, up through the front: punishes hugging and standing underneath
  upswing: {
    an: mk(BB, [
      [0, {}],
      [0.6, { hy: -92, lean: 30, head: -16, ax: -50, ay: 80, w: 140, ea: -1, bx: 40, by: 30, f1x: 50, f2x: -40 }, 'out'],
      [0.68, { ay: 82, w: 142 }, 'lin'],
      [0.84, { ax: 60, ay: -40, w: -55, lean: 10, hy: -100, head: -10, f1x: 54, ea: 1 }, 'in'],
      [0.96, { ax: 50, ay: -62, w: -82 }, 'out'],
      [1.55, BASE, 'out', { lean: 29, hy: -96, w: 68, ay: 72 }],
      [1.75, BASE, 'io'],
    ]),
    hits: [{ t0: 0.69, t1: 0.9, dmg: 22, knock: 'down' }],
    moves: [{ t0: 0.66, t1: 0.84, d: 30, adapt: [90, 0, 60] }],
    track: 0.45, act: 1.75, cancel: 1.05, atk: true,
  },
  // coiled lunge that closes distance
  thrust: {
    an: mk(BB, [
      [0, {}],
      [0.7, { hy: -94, lean: -6, head: -4, ax: -36, ay: 14, w: 22, ea: -1, bx: 30, by: 10, f1x: 30, f2x: -64 }, 'out'],
      [0.84, { ax: -40, ay: 16 }, 'lin'],
      [1.02, { hy: -80, lean: 40, head: -28, ax: 95, ay: 40, w: 18, ea: 1, bx: -10, by: 60, f1x: 80, f2x: -60 }, 'in'],
      [1.2, { ax: 100, ay: 44, w: 22 }, 'out'],
      [1.9, BASE, 'out', { lean: 18, hy: -104 }],
      [2.1, BASE, 'io'],
    ]),
    hits: [{ t0: 0.88, t1: 1.1, dmg: 24, knock: 'down' }],
    moves: [{ t0: 0.84, t1: 1.04, d: 240, e: 'out2', adapt: [170, 40, 280] }],
    track: 0.7, act: 2.1, cancel: 1.4, atk: true,
  },
  // jump onto the player's position, club first, with a landing shockwave
  leap: {
    an: mk(BB, [
      [0, {}],
      [0.58, { hy: -70, lean: 40, head: -30, ax: -24, ay: 40, w: 150, ea: -1, bx: -10, by: 56, f1x: 40, f2x: -50 }, 'out'],
      [0.66, { hy: -104, lean: 10, head: -14, ax: -10, ay: -20, w: 200, f1x: 30, f1y: -20, f2x: -30, f2y: -10 }, 'out'],
      [0.9, { lean: -6, head: -6, ax: -12, ay: -88, w: 248, ea: 1, bx: 36, by: -30, f1x: 34, f1y: -36, f2x: -26, f2y: -24 }, 'out'],
      [1.2, { hy: -80, lean: 38, head: -20, ax: 70, ay: 62, w: 396, bx: 50, by: 40, f1x: 66, f1y: 0, f2x: -44, f2y: 0 }, 'in'],
      [1.3, { w: 400, ay: 64 }, 'out'],
      [2.05, { w: 398, lean: 34, hy: -86 }, 'lin'],
      [2.3, BASE, 'out', { lean: 17, hy: -104, w: 408, ay: 62 }],
      [2.45, BASE, 'io', { w: 418 }],
    ]),
    hits: [{ t0: 1.04, t1: 1.22, dmg: 30, knock: 'down' }],
    events: [{ t: 1.2, ev: 'leap' }],
    leap: { t0: 0.62, t1: 1.2, h: 140 },
    track: 0.55, act: 2.45, cancel: 1.6, atk: true,
  },
  // stomp shockwave on both sides: answers a player who is under or behind
  stomp: {
    an: mk(BB, [
      [0, {}],
      [0.55, { hy: -108, lean: 8, head: -8, ax: 20, ay: 40, w: 70, bx: 56, by: -14, f1x: 34, f1y: -66, f2x: -34 }, 'out'],
      [0.68, { f1y: -70, hy: -110 }, 'lin'],
      [0.77, { hy: -90, lean: 28, head: -18, f1x: 38, f1y: 0, ax: 28, ay: 62, bx: 50, by: 44 }, 'in'],
      [1.28, BASE, 'out', { lean: 19, hy: -104 }],
      [1.45, BASE, 'io'],
    ]),
    events: [{ t: 0.76, ev: 'stomp' }],
    track: 0.3, act: 1.45, cancel: 1.0, atk: true,
  },
  turn: {
    an: mk(BB, [[0, {}], [0.2, { hy: -90, lean: 14, f1y: -14, f2x: -40 }, 'out'], [0.55, BASE, 'io']]),
    events: [{ t: 0.22, ev: 'flip' }], act: 0.55,
  },
  // phase 2 transition
  roar: {
    an: mk(BB, [
      [0, {}],
      [0.45, { hy: -92, lean: 44, head: 10, ax: 10, ay: 70, w: 80, bx: 20, by: 70 }, 'out'],
      [0.7, { hy: -106, lean: -14, head: -36, ax: 40, ay: -70, w: -70, bx: 60, by: -60, f1x: 46, f2x: -46 }, 'out'],
      [1.3, { lean: -12, head: -34, ay: -72 }, 'lin'],
      [1.7, BASE, 'io'],
    ]),
    events: [{ t: 0.7, ev: 'roar' }], act: 1.7, noPoise: true,
  },
  // poise broken: kneels, takes extra damage
  stagger: {
    an: mk(BB, [[0, {}], [0.18, KNEEL, 'out'], [1.9, { hy: -60, lean: 58, head: 8 }, 'lin'], [2.2, BASE, 'io']]),
    act: 2.2, noPoise: true,
  },
  dead: {
    an: mk(BB, [
      [0, {}],
      [0.3, KNEEL, 'out'],
      [1.1, { hy: -60, lean: 60, head: 10 }, 'lin'],
      [1.7, { rot: 90, oy: 38, hy: -112, lean: 4, head: 4, f1x: 8, f2x: -6, f1y: 0, f2y: 0, ax: 34, ay: 50, w: 70, bx: 40, by: 40 }, 'in2'],
      [1.9, { oy: 40 }, 'out'],
      [9, {}, 'lin'],
    ]),
    noPoise: true,
  },
};
const COMBO = { upswing: ['smash'], smash: ['smash'], thrust: ['upswing'], leap: ['stomp'] };

// ---------------------------------------------------------------- state
const P = {}, B = {};
let waves = [], parts = [];
const trails = { p: [], b: [] };
let clock = 0, hitStop = 0, shakeMag = 0, timeScale = 1, slowT = 0;
let ended = null, endTimer = null, camX = 0;
const TMP = {}, TMPB = {};

function reset() {
  Object.assign(P, {
    x: 480, y: 0, vx: 0, face: 1, hp: T.p.hp, hpGhost: T.p.hp, ghostT: 0, st: T.p.st, stDelay: 0,
    flasks: T.p.flasks, state: 'loco', def: null, t: 0, start: null, pose: copyPose(PB, {}),
    moveBlend: 0, walkP: 0, flash: 0, charge: 0, holdT: 0, hitMask: 0, swingId: 0,
  });
  Object.assign(B, {
    x: 1000, y: 0, vx: 0, face: -1, hp: T.b.hp, hpGhost: T.b.hp, ghostT: 0, poise: T.b.poise, poiseT: 0,
    state: 'loco', def: null, t: 0, start: null, pose: copyPose(BB, {}), moveBlend: 0, walkP: 0,
    flash: 0, wait: 1.6, cd: { leap: 3, stomp: 0 }, last: [], queue: [], phase2: false, pending2: false,
    behindT: 0, hitMask: 0, adaptD: null, leapFrom: 0, leapTo: 0, swingId: 0,
  });
  newMotion(P);
  newMotion(B);
  P.S = solve(PR, P.pose, P.x, P.y, P.face);
  B.S = solve(BR, B.pose, B.x, B.y, B.face);
  B.caps = bossCaps(B.S);
  waves = []; parts = []; trails.p.length = 0; trails.b.length = 0;
  clock = 0; hitStop = 0; shakeMag = 0; timeScale = 1; slowT = 0;
  ended = null; endTimer = null;
  input.buffer = null;
  camX = lerp(P.x, B.x, 0.42);
}

// ---------------------------------------------------------------- input
const input = { l: false, r: false, pad: 0, kbHeavy: false, tHeavy: false, buffer: null };
const now = () => performance.now() / 1000;
const inDir = () => ((input.r ? 1 : 0) - (input.l ? 1 : 0)) || input.pad;
const heavyHeld = () => input.kbHeavy || input.tHeavy;
function press(a) { if (!ended) input.buffer = { a, at: now() }; }
function buffered() {
  const b = input.buffer;
  if (!b) return null;
  if (now() - b.at > T.p.buffer) { input.buffer = null; return null; }
  return b.a;
}

const KEYMAP = {
  ArrowLeft: 'l', KeyA: 'l', ArrowRight: 'r', KeyD: 'r',
  KeyJ: 'light', KeyZ: 'light', KeyK: 'heavy', KeyX: 'heavy',
  Space: 'roll', KeyL: 'roll', ShiftLeft: 'roll', KeyE: 'heal', KeyH: 'heal', KeyC: 'heal',
};
window.addEventListener('keydown', e => {
  if ((e.code === 'KeyR' || e.code === 'Enter') && ended && ended.t > 0.5) { reset(); e.preventDefault(); return; }
  const a = KEYMAP[e.code];
  if (!a) return;
  e.preventDefault();
  if (a === 'l') input.l = true;
  else if (a === 'r') input.r = true;
  else {
    if (a === 'heavy') input.kbHeavy = true;
    if (!e.repeat) press(a);
  }
});
window.addEventListener('keyup', e => {
  const a = KEYMAP[e.code];
  if (a === 'l') input.l = false;
  else if (a === 'r') input.r = false;
  else if (a === 'heavy') input.kbHeavy = false;
});
window.addEventListener('blur', () => { input.l = input.r = input.kbHeavy = input.tHeavy = false; input.pad = 0; });

// touch controls: floating stick on the left half, buttons on the right
let touchUI = false;
try { touchUI = window.matchMedia('(pointer: coarse)').matches; } catch (e) { /* desktop default */ }
const btns = [
  { act: 'light', label: 'ATTACK' }, { act: 'heavy', label: 'HEAVY' },
  { act: 'roll', label: 'ROLL' }, { act: 'heal', label: 'HEAL' },
];
const btn = a => btns.find(b => b.act === a);
const ptrs = new Map();
let padHome = { x: 0, y: 0, r: 40 };

cvs.addEventListener('pointerdown', e => {
  e.preventDefault();
  try { cvs.focus({ preventScroll: true }); } catch (err) { /* ignore */ }
  if (e.pointerType === 'touch' && !touchUI) { touchUI = true; layout(); }
  if (ended) { if (ended.t > 0.6) reset(); return; }
  if (!touchUI) return;
  try { cvs.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  const x = e.clientX, y = e.clientY;
  for (const b of btns) {
    if (Math.hypot(x - b.x, y - b.y) <= b.r * 1.2) {
      ptrs.set(e.pointerId, { b });
      b.down = true;
      if (b.act === 'heavy') input.tHeavy = true;
      press(b.act);
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
  if (p.b) { p.b.down = false; if (p.b.act === 'heavy') input.tHeavy = false; }
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

// ---------------------------------------------------------------- shared helpers
function rootMove(def, t0, t1, adaptD) {
  if (!def.moves) return 0;
  let dx = 0;
  for (const m of def.moves) {
    if (t1 <= m.t0 || t0 >= m.t1) continue;
    const e = EASE[m.e || 'io'];
    const a = clamp((t0 - m.t0) / (m.t1 - m.t0), 0, 1), b = clamp((t1 - m.t0) / (m.t1 - m.t0), 0, 1);
    const dist = typeof m.d === 'string' ? T.p[m.d] : (m.adapt && adaptD != null ? adaptD : m.d);
    dx += dist * (e(b) - e(a));
  }
  return dx;
}
const hitstop = t => { hitStop = Math.max(hitStop, t); };
const shake = m => { shakeMag = Math.max(shakeMag, m); };
function addTrail(who, id, hA, wt) {
  trails[who].push({ id, hx: hA[0], hy: hA[1], tx: wt[0], ty: wt[1], age: 0 });
}

// ---------------------------------------------------------------- player logic
function pInvuln() { const d = P.def; return !!(d && d.inv && P.t >= d.inv[0] && P.t <= d.inv[1]); }
function pArmor() {
  if (P.state === 'heavyHold') return true;
  const d = P.def;
  return !!(d && d.armor && P.t >= d.armor[0] && P.t <= d.armor[1]);
}
function spend(c) { P.st = Math.max(0, P.st - c); P.stDelay = P.st <= 0 ? T.p.stDelayEmpty : T.p.stDelay; }
function faceBoss() { if (B.state !== 'dead' && Math.abs(B.x - P.x) > 8) P.face = Math.sign(B.x - P.x); }
function clampP() { P.x = clamp(P.x, T.arenaL + 12, T.arenaR - 12); }
function pBegin(name) {
  const d = PA[name];
  P.state = name; P.def = d; P.t = 0; P.start = copyPose(P.pose, {}); P.hitMask = 0; P.swingId++;
  if (d.cost) spend(T.p[d.cost]);
}
function pStrike() {
  P.state = 'heavyStrike'; P.def = PA.heavyStrike; P.t = 0;
  P.start = copyPose(P.pose, {}); P.hitMask = 0; P.swingId++;
}
function toLoco() { P.state = 'loco'; P.def = null; P.moveBlend = 0; P.sLean.x = P.sLean.v = 0; faceBoss(); }

// Start a player-chosen action. Returns false if it can't happen right now.
function pDo(a) {
  if (a === 'heal') {
    if (P.flasks <= 0) return false;
    faceBoss(); P.vx *= 0.2; pBegin('heal'); return true;
  }
  if (P.st < 1) return false;
  if (a === 'roll') { const dir = inDir() || P.face; P.face = dir; P.vx = 0; pBegin('roll'); return true; }
  const chain = P.state !== 'loco' && P.def && P.def.next && P.t >= P.def.chainAt;
  faceBoss(); P.vx *= 0.2;
  if (a === 'light') { pBegin(chain ? P.def.next : 'light1'); return true; }
  if (a === 'heavy') { P.charge = 0; pBegin('heavyWind'); return true; }
  return false;
}

function playerLoco(dt) {
  const v = P.vx * P.face, S = 15;
  P.moveBlend = approach(P.moveBlend, clamp(Math.abs(P.vx) / T.p.walk, 0, 1), dt * 7);
  P.walkP += v * dt / (4 * S);
  const m = P.moveBlend, p = copyPose(PB, P.pose);
  const g1 = gait(P.walkP, S, 7), g2 = gait(P.walkP + 0.5, S, 7), q = P.walkP * 4 * Math.PI;
  p.f1x = lerp(PB.f1x, 3 + g1[0], m); p.f1y = -g1[1] * m;
  p.f2x = lerp(PB.f2x, -1 + g2[0], m); p.f2y = -g2[1] * m;
  p.hy = PB.hy + (0.5 + 0.5 * Math.cos(q)) * 2.5 * m + Math.sin(clock * 2.4) * 0.8 * (1 - m);
  p.ay = PB.ay + Math.sin(clock * 2.4 + 0.6) * 0.7 + Math.sin(q) * 1.2 * m;
  p.w = PB.w + Math.sin(q) * 2 * m;
}
function holdPose() {
  const k = PA.heavyWind.an.ks;
  copyPose(k[k.length - 1].p, P.pose);
  const c = P.charge, p = P.pose;
  p.lean -= 3 * c; p.hy += 2.5 * c; p.head -= 4 * c;
  p.ax += Math.sin(clock * 47) * 0.5 * c;
  p.ay += Math.sin(clock * 39) * 0.5 * c;
  p.w += Math.sin(clock * 31) * 1.5 * c;
}
function pEvent(ev) {
  if (ev === 'heal' && P.flasks > 0) {
    P.flasks--;
    P.hp = Math.min(T.p.hp, P.hp + T.p.flaskHeal);
    P.hpGhost = P.hp;
    for (let i = 0; i < 16; i++) {
      parts.push({ k: 'h', x: P.x + rand(-16, 16), y: rand(-86, -8), vx: rand(-10, 10), vy: rand(-80, -30), life: rand(0.5, 0.9), max: 0.9 });
    }
  } else if (ev === 'pImpact') {
    dust(P.S.wt[0], 6 + Math.round(8 * P.charge), 20);
    shake(2 + 4 * P.charge);
  }
}
function pHits(d, t0, t1) {
  for (let i = 0; i < d.hits.length; i++) {
    const h = d.hits[i];
    if ((P.hitMask & (1 << i)) || t1 < h.t0 || t0 > h.t1) continue;
    for (let j = 1; j <= 3; j++) {
      const tt = lerp(t0, t1, j / 3);
      if (tt < h.t0 || tt > h.t1) continue;
      const S = solve(PR, sample(d.an, tt, P.start, TMP), P.x, P.y, P.face);
      addTrail('p', P.swingId, S.hA, S.wt);
      if (B.state === 'dead') continue;
      const hit = hitTest(S.hA, S.wt, 3, B.caps);
      if (hit) { P.hitMask |= 1 << i; hitBoss(h, hit); break; }
    }
  }
}

function updatePlayer(dt) {
  if (P.flash > 0) P.flash -= dt;
  const busy = P.def && (P.def.atk || P.def.roll);
  if (P.stDelay > 0) P.stDelay -= dt;
  else if (!busy && P.state !== 'dead') P.st = Math.min(T.p.st, P.st + T.p.stRegen * dt);

  if (P.state === 'loco') {
    faceBoss();
    const dir = inDir();
    const back = dir !== 0 && dir !== P.face;
    P.vx = approach(P.vx, dir * (back ? T.p.walkBack : T.p.walk), T.p.accel * dt);
    P.x += P.vx * dt; P.y = 0;
    clampP();
    playerLoco(dt);
    const b = buffered();
    if (b && pDo(b)) input.buffer = null;
  } else if (P.state === 'heavyHold') {
    P.holdT += dt;
    P.charge = clamp(P.holdT / T.p.chargeTime, 0, 1);
    holdPose();
    P.vx *= Math.exp(-8 * dt); P.x += P.vx * dt; clampP();
    if (!heavyHeld() || P.holdT >= T.p.chargeMax) pStrike();
  } else playerAction(dt);
  const mode = P.state === 'loco' ? 'gait'
    : (P.state === 'roll' || P.state === 'down' || P.state === 'dead' || P.y < -1) ? 'free' : 'lock';
  P.S = solve(PR, finalize(P, PC, dt, mode), P.x, P.y, P.face);
}
function playerAction(dt) {
  const d = P.def, t0 = P.t;
  P.t += dt;
  const t1 = P.t, name = P.state;
  P.vx *= Math.exp(-6.5 * dt);
  P.x += P.vx * dt + P.face * rootMove(d, t0, t1, null);
  clampP();
  if (d.air) {
    const u = clamp((t1 - d.air[0]) / (d.air[1] - d.air[0]), 0, 1);
    P.y = -4 * d.air[2] * u * (1 - u);
  } else P.y = 0;
  sample(d.an, t1, P.start, P.pose);
  P.S = solve(PR, P.pose, P.x, P.y, P.face);
  if (d.events) for (const e of d.events) if (t0 < e.t && t1 >= e.t) pEvent(e.ev);
  if (d.hits) pHits(d, t0, t1);
  if (P.state !== name || name === 'dead') return;
  if (name === 'heavyWind' && t1 >= d.an.dur) {
    if (heavyHeld()) { P.state = 'heavyHold'; P.holdT = 0; } else pStrike();
    return;
  }
  const b = buffered();
  if (b) {
    let ok = false;
    if ((b === 'light' || b === 'heavy') && d.next && t1 >= d.chainAt) ok = pDo(b);
    else if (b === 'roll' && d.rollAt != null && t1 >= d.rollAt) ok = pDo('roll');
    else if (d.act != null && t1 >= d.act) ok = pDo(b);
    if (ok) { input.buffer = null; return; }
  }
  if (t1 >= d.an.dur) toLoco();
}

function hurtPlayer(dmg, knock, fromX) {
  if (P.state === 'dead' || pInvuln() || ended || endTimer) return;
  const dir = Math.sign(P.x - fromX) || -P.face;
  faceBoss();
  if (knock === 'push') {
    if (!pArmor()) pBegin('flinch');
    P.vx = dir * 420;
    return;
  }
  P.hp = Math.max(0, P.hp - dmg);
  P.flash = 0.18; P.ghostT = 0.7;
  hitstop(knock === 'down' ? 0.12 : 0.08);
  shake(knock === 'down' ? 14 : 8);
  sparks(P.S.hip[0], P.S.hip[1] - 22, dir, 10, C.blood);
  if (P.hp <= 0) { pBegin('dead'); P.vx = dir * 320; slowT = 1.4; endIn('lose', 2.0); return; }
  if (knock === 'down') { pBegin('down'); P.vx = dir * 340; }
  else if (!pArmor()) { pBegin('flinch'); P.vx = dir * 250; }
}

// ---------------------------------------------------------------- boss logic
function bossCaps(S) {
  return [
    [S.hip, S.sh, 22], [S.sh, S.hd, 18],
    [S.hip, S.k1, 13], [S.k1, S.f1, 11], [S.hip, S.k2, 13], [S.k2, S.f2, 11],
    [S.sh, S.eA, 10], [S.eA, S.hA, 9], [S.sh, S.eB, 9], [S.eB, S.hB, 8],
  ];
}
function playerCaps() {
  const S = P.S;
  return [[S.hip, S.hd, 10], [S.hip, S.f1, 5], [S.hip, S.f2, 5]];
}
const maxPoise = () => (B.phase2 ? T.b.poise2 : T.b.poise);
function bBegin(name) {
  let d = BA[name];
  if (d.hold) d = shifted(d, d.hold[0], rand(0, B.phase2 ? d.hold[2] : d.hold[1]));
  B.state = name; B.def = d; B.t = 0; B.start = copyPose(B.pose, {}); B.hitMask = 0;
  B.adaptD = null; B.vx = 0; B.swingId++; B.leapTo = B.x;
  if (name === 'stagger' || name === 'dead') B.queue = [];
  if (name === 'leap') B.cd.leap = T.b.cdLeap;
  if (name === 'stomp') B.cd.stomp = T.b.cdStomp;
  if (d.atk) { B.last.unshift(name); B.last.length = Math.min(B.last.length, 3); }
}
function bLoco() {
  B.state = 'loco'; B.def = null; B.moveBlend = 0; B.sLean.x = B.sLean.v = 0;
  B.wait = B.phase2 ? rand(0.25, 0.7) : rand(0.5, 1.1);
}
function pick(o) {
  let s = 0;
  for (const it of o) s += it[1];
  let r = Math.random() * s;
  for (const it of o) { r -= it[1]; if (r <= 0) return it[0]; }
  return o[o.length - 1][0];
}
function bossDecide() {
  if (P.state === 'dead') { B.wait = 1; return; }
  if (B.pending2) {
    B.pending2 = false; B.phase2 = true; B.poise = maxPoise();
    B.face = Math.sign(P.x - B.x) || B.face;
    bBegin('roar');
    return;
  }
  const dx = P.x - B.x, d = Math.abs(dx), front = dx * B.face > 0;
  if (!front && d > 30) { bBegin(d < 170 && B.cd.stomp <= 0 ? 'stomp' : 'turn'); return; }
  const o = [];
  const add = (n, w) => { if (B.last[0] === n && B.last[1] === n) return; o.push([n, w]); };
  if (d < 120 && B.cd.stomp <= 0) add('stomp', 2);
  if (d < 175) add('upswing', 3);
  if (d > 70 && d < 320) add('smash', 3);
  if (d > 190 && d < 470) add('thrust', 2);
  if (d > (B.phase2 ? 300 : 380) && B.cd.leap <= 0) add('leap', d > 520 ? 6 : 2);
  if (!o.length) { B.wait = 0.25; return; }
  const n = pick(o);
  B.queue = B.phase2 && COMBO[n] && Math.random() < 0.55 ? COMBO[n].slice() : [];
  bBegin(n);
}
function bossTrack(d) {
  const dist = Math.abs(P.x - B.x), front = (P.x - B.x) * B.face > 0;
  const m = d.moves && d.moves.find(mv => mv.adapt);
  if (m) B.adaptD = front ? clamp(dist - m.adapt[0], m.adapt[1], m.adapt[2]) : m.adapt[1];
  if (d.leap) B.leapTo = clamp(front ? P.x - B.face * 105 : B.x + B.face * 60, T.arenaL + 80, T.arenaR - 80);
}
function leapMotion(L, t0, t1) {
  if (t0 < L.t0 && t1 >= L.t0) B.leapFrom = B.x;
  if (t1 >= L.t0 && t0 <= L.t1) {
    const u = clamp((t1 - L.t0) / (L.t1 - L.t0), 0, 1);
    B.x = lerp(B.leapFrom, B.leapTo, EASE.io(u));
    B.y = -4 * L.h * u * (1 - u);
  }
}
function bEvent(ev) {
  const S = B.S;
  if (ev === 'smash') { addWave(S.wt[0], 85, 10, 'small'); shake(10); dust(S.wt[0], 14, 30); }
  else if (ev === 'leap') { const x = B.x + B.face * 70; addWave(x, 210, 14, 'small'); shake(16); dust(x, 26, 90); }
  else if (ev === 'stomp') { addWave(S.f1[0], 140, 12, 'small'); shake(9); dust(S.f1[0], 16, 40); }
  else if (ev === 'roar') { addWave(B.x, 320, 0, 'push', S.hd); shake(12); }
  else if (ev === 'flip') { if ((P.x - B.x) * B.face < 0) B.face *= -1; }
}
function bHits(d, t0, t1) {
  for (let i = 0; i < d.hits.length; i++) {
    const h = d.hits[i];
    if ((B.hitMask & (1 << i)) || t1 < h.t0 || t0 > h.t1) continue;
    for (let j = 1; j <= 3; j++) {
      const tt = lerp(t0, t1, j / 3);
      if (tt < h.t0 || tt > h.t1) continue;
      const S = solve(BR, sample(d.an, tt, B.start, TMPB), B.x, B.y, B.face);
      addTrail('b', B.swingId, S.hA, S.wt);
      if (P.state === 'dead' || pInvuln()) continue;
      if (hitTest(S.hA, S.wt, 9, playerCaps())) { B.hitMask |= 1 << i; hurtPlayer(h.dmg, h.knock, B.x); break; }
    }
  }
}
function hitBoss(h, hit) {
  const heavy = !!h.heavy, c = heavy ? P.charge : 0;
  const dmg = heavy ? lerp(T.p.dmgHeavy, T.p.dmgCharged, c) : T.p[h.dmg];
  const poise = heavy ? lerp(T.p.poiseHeavy, T.p.poiseCharged, c) : T.p[h.poise];
  const mult = B.state === 'stagger' ? T.b.staggerMult : 1;
  B.hp = Math.max(0, B.hp - dmg * mult);
  B.flash = 0.09; B.ghostT = 0.8; B.poiseT = 0;
  hitstop(heavy ? 0.08 + 0.05 * c : 0.05);
  shake(heavy ? 5 + 5 * c : 2.5);
  sparks(hit[1], hit[2], P.face, heavy ? 16 : 9, C.spark);
  if (B.hp <= 0) { bBegin('dead'); waves = []; slowT = 1.4; endIn('win', 2.8); return; }
  if (!(B.def && B.def.noPoise)) B.poise -= poise;
  if (!B.phase2 && B.hp <= T.b.hp * T.b.phase2At) B.pending2 = true;
}
function bossLoco(dt) {
  const v = B.vx * B.face, S = 30;
  B.moveBlend = approach(B.moveBlend, clamp(Math.abs(B.vx) / 80, 0, 1), dt * 4);
  B.walkP += v * dt / (4 * S);
  const m = B.moveBlend, p = copyPose(BB, B.pose);
  const g1 = gait(B.walkP, S, 20), g2 = gait(B.walkP + 0.5, S, 20), q = B.walkP * 2 * Math.PI;
  p.f1x = lerp(BB.f1x, 10 + g1[0], m); p.f1y = -g1[1] * m;
  p.f2x = lerp(BB.f2x, -14 + g2[0], m); p.f2y = -g2[1] * m;
  p.hy = BB.hy + (0.5 + 0.5 * Math.cos(2 * q)) * 5 * m + Math.sin(clock * 1.7) * 2 * (1 - m);
  p.lean = BB.lean + Math.sin(clock * 1.7 + 0.4) * 1.5;
  p.ay = BB.ay + Math.sin(2 * q) * 3 * m + Math.sin(clock * 1.7) * 1.5;
  p.w = BB.w + Math.sin(q) * 4 * m;
  p.by = BB.by + Math.sin(q + 1) * 6 * m;
}

function updateBoss(dt) {
  if (B.flash > 0) B.flash -= dt;
  B.cd.leap -= dt; B.cd.stomp -= dt;
  B.poiseT += dt;
  if (B.poiseT > T.b.poiseDelay && B.state !== 'stagger') B.poise = Math.min(maxPoise(), B.poise + T.b.poiseRegen * dt);
  if (B.poise <= 0 && B.state !== 'stagger' && B.state !== 'dead' && B.y >= -0.5 && !(B.def && B.def.noPoise)) {
    bBegin('stagger');
    shake(6);
  }

  if (B.state === 'loco') {
    const dx = P.x - B.x, d = Math.abs(dx), front = dx * B.face > 0;
    let want = 0;
    if (P.state !== 'dead' && !ended) {
      if (!front && d > 30) {
        B.behindT += dt;
        if (B.behindT > 0.3) { B.behindT = 0; bossDecide(); }
      } else {
        B.behindT = 0;
        if (d > 260) want = B.face * (B.phase2 ? T.b.walk2 : T.b.walk);
      }
      B.wait -= dt;
      if (B.state === 'loco' && B.wait <= 0) bossDecide();
    }
    if (B.state === 'loco') {
      B.vx = approach(B.vx, want, 260 * dt);
      B.x += B.vx * dt;
      if (B.y < 0) B.y = Math.min(0, B.y + 700 * dt);
      bossLoco(dt);
    }
  }
  if (B.state !== 'loco') {
    const d = B.def, t0 = B.t;
    B.t += dt * (B.phase2 ? T.b.speed2 : 1);
    const t1 = B.t, name = B.state;
    if (d.track != null && t0 < d.track && t1 >= d.track) bossTrack(d);
    B.x += B.face * rootMove(d, t0, t1, B.adaptD);
    if (d.leap) leapMotion(d.leap, t0, t1);
    else if (B.y < 0) B.y = Math.min(0, B.y + 700 * dt);
    sample(d.an, t1, B.start, B.pose);
    B.S = solve(BR, B.pose, B.x, B.y, B.face);
    if (d.events) for (const e of d.events) if (t0 < e.t && t1 >= e.t) bEvent(e.ev);
    if (d.hits) bHits(d, t0, t1);
    if (B.state === name && name !== 'dead') {
      if (B.queue.length && d.cancel != null && t1 >= d.cancel && P.state !== 'dead') {
        const n = B.queue.shift();
        B.face = Math.sign(P.x - B.x) || B.face;
        bBegin(n);
      } else if (t1 >= d.an.dur) {
        if (name === 'stagger') B.poise = maxPoise();
        bLoco();
      }
    }
  }
  B.x = clamp(B.x, T.arenaL + 70, T.arenaR - 70);
  const mode = B.state === 'loco' ? 'gait' : (B.state === 'dead' || B.y < -1) ? 'free' : 'lock';
  B.S = solve(BR, finalize(B, BC, dt, mode), B.x, B.y, B.face);
  B.caps = bossCaps(B.S);
}

// ---------------------------------------------------------------- shockwaves + particles
function addWave(x, r, dmg, knock, ring) {
  waves.push({ x, r, dmg, knock, t: 0, hit: false, ring: ring ? [ring[0], ring[1]] : null });
}
function updateWaves(dt) {
  for (const w of waves) {
    w.t += dt;
    if (!w.hit && w.t <= 0.14) {
      const reach = w.r * (0.35 + 0.65 * Math.min(1, w.t / 0.14));
      if (Math.abs(P.x - w.x) <= reach && P.state !== 'dead' && !pInvuln()) {
        w.hit = true;
        hurtPlayer(w.dmg, w.knock, w.x);
      }
    }
  }
  waves = waves.filter(w => w.t < 0.55);
}
function sparks(x, y, dir, n, col) {
  for (let i = 0; i < n; i++) {
    const a = (dir > 0 ? 0 : Math.PI) + rand(-1.1, 1.1) + (Math.random() < 0.25 ? Math.PI : 0);
    const s = rand(160, 520);
    parts.push({ k: 's', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 120, life: rand(0.12, 0.3), max: 0.3, col });
  }
}
function dust(x, n, spread) {
  for (let i = 0; i < n; i++) {
    parts.push({ k: 'd', x: x + rand(-spread, spread), y: -2, vx: rand(-170, 170), vy: rand(-80, -15),
      life: rand(0.35, 0.75), max: 0.75, r: rand(2.5, 7) });
  }
}
function updateFx(dt) {
  for (const p of parts) {
    p.life -= dt;
    p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.k === 's') p.vy += 1100 * dt;
    else if (p.k === 'd') { p.vx *= Math.exp(-3 * dt); p.vy += 40 * dt; }
  }
  parts = parts.filter(p => p.life > 0);
  for (const k of ['p', 'b']) {
    const tr = trails[k];
    for (const s of tr) s.age += dt;
    while (tr.length && tr[0].age > 0.14) tr.shift();
  }
}

// ---------------------------------------------------------------- frame update
function update(dt) {
  clock += dt;
  updatePlayer(dt);
  updateBoss(dt);
  updateWaves(dt);
}
function endIn(kind, delay) { if (!endTimer && !ended) endTimer = { kind, t: delay }; }

// ---------------------------------------------------------------- layout
let W = 0, H = 0, dpr = 1, scale = 1, groundY = 0, portrait = false;
let safe = { t: 0, r: 0, b: 0, l: 0 };
function layout() {
  portrait = H > W * 1.05;
  scale = Math.min(W / 1150, H / 560);
  groundY = Math.round(H * (touchUI ? (portrait ? 0.56 : 0.63) : 0.68));
  const R = clamp(Math.min(W, H) * 0.1, 28, 48);
  const mR = Math.max(14, safe.r + 8), mB = Math.max(14, safe.b + 8), mL = Math.max(14, safe.l + 8);
  const L = btn('light'); L.r = R * 1.15; L.x = W - mR - L.r; L.y = H - mB - L.r;
  const Ro = btn('roll'); Ro.r = R; Ro.x = L.x - L.r - Ro.r - R * 0.35; Ro.y = H - mB - Ro.r;
  const Hv = btn('heavy'); Hv.r = R * 0.92; Hv.x = L.x - R * 0.15; Hv.y = L.y - L.r - Hv.r - R * 0.35;
  const He = btn('heal'); He.r = R * 0.75; He.x = Ro.x - R * 0.1; He.y = Ro.y - Ro.r - He.r - R * 0.45;
  padHome = { x: mL + R * 1.4, y: H - mB - R * 1.4, r: R * 1.25 };
}
function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth; H = window.innerHeight;
  cvs.width = Math.round(W * dpr); cvs.height = Math.round(H * dpr);
  if (safeEl) {
    const cs = getComputedStyle(safeEl);
    safe = { t: parseFloat(cs.paddingTop) || 0, r: parseFloat(cs.paddingRight) || 0,
      b: parseFloat(cs.paddingBottom) || 0, l: parseFloat(cs.paddingLeft) || 0 };
  }
  layout();
}
window.addEventListener('resize', resize);

// ---------------------------------------------------------------- drawing: world
function path(pts) {
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.stroke();
}
function drawSword(S) {
  const hx = S.hA[0], hy = S.hA[1], tx = S.wt[0], ty = S.wt[1];
  const L = Math.hypot(tx - hx, ty - hy) || 1, ux = (tx - hx) / L, uy = (ty - hy) / L;
  g.strokeStyle = C.hilt; g.lineWidth = 3.2;
  path([S.wb, [hx + ux * 2, hy + uy * 2]]);
  const gx = hx + ux * 3, gy = hy + uy * 3;
  g.lineWidth = 3;
  path([[gx - uy * 7, gy + ux * 7], [gx + uy * 7, gy - ux * 7]]);
  const hot = P.state === 'heavyHold' ? P.charge : 0;
  if (hot > 0) { g.shadowColor = C.bladeHot; g.shadowBlur = 14 * hot; }
  g.fillStyle = hot > 0.98 ? C.bladeHot : C.blade;
  g.beginPath();
  g.moveTo(gx - uy * 2.8, gy + ux * 2.8);
  g.lineTo(tx - uy * 0.8, ty + ux * 0.8);
  g.lineTo(tx + ux * 3, ty + uy * 3);
  g.lineTo(gx + uy * 2.8, gy - ux * 2.8);
  g.closePath();
  g.fill();
  g.shadowBlur = 0;
}
function drawPlayer() {
  const S = P.S, col = P.flash > 0 ? C.hurt : C.player;
  g.lineCap = 'round'; g.lineJoin = 'round';
  g.strokeStyle = col; g.lineWidth = PR.line;
  g.globalAlpha = 0.5;
  path([S.hip, S.k2, S.f2]);
  path([S.sh, S.eB, S.hB]);
  g.globalAlpha = 1;
  path([S.hip, S.sh, S.nk]);
  g.beginPath(); g.arc(S.hd[0], S.hd[1], PR.headR, 0, Math.PI * 2);
  g.fillStyle = C.bg; g.fill(); g.stroke();
  path([S.hip, S.k1, S.f1]);
  drawSword(S);
  g.strokeStyle = col; g.lineWidth = PR.line;
  path([S.sh, S.eA, S.hA]);
  if (P.state === 'heal' && P.t > 0.12 && P.t < 0.9) {   // the flask in the free hand
    g.fillStyle = C.flask;
    g.beginPath(); g.arc(S.hB[0], S.hB[1] - 2, 3.6, 0, Math.PI * 2); g.fill();
  }
}
function claws(e, h) {
  const dx = h[0] - e[0], dy = h[1] - e[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
  for (const a of [-0.45, 0, 0.45]) {
    const c = Math.cos(a), s = Math.sin(a);
    path([h, [h[0] + (ux * c - uy * s) * 13, h[1] + (ux * s + uy * c) * 13]]);
  }
}
function drawBoss() {
  const S = B.S;
  const col = B.flash > 0 ? C.bossFlash : (B.phase2 ? C.boss2 : C.boss);
  g.lineCap = 'round'; g.lineJoin = 'round';
  g.strokeStyle = col; g.lineWidth = BR.line;
  g.globalAlpha = 0.5;
  path([S.hip, S.k2, S.f2]);
  path([S.sh, S.eB, S.hB]);
  g.lineWidth = 4; claws(S.eB, S.hB);
  g.globalAlpha = 1; g.lineWidth = BR.line;
  path([S.hip, S.sh, S.nk]);
  // head, horns, eyes
  const hd = S.hd, up = S.up, fw = S.fw;
  g.lineWidth = 5;
  for (const side of [-1, 1]) {
    const bx = hd[0] + up[0] * 12 - fw[0] * (4 + side * 6), by = hd[1] + up[1] * 12 - fw[1] * (4 + side * 6);
    g.beginPath();
    g.moveTo(bx, by);
    g.quadraticCurveTo(hd[0] + up[0] * 34 + fw[0] * 4, hd[1] + up[1] * 34 + fw[1] * 4,
      hd[0] + up[0] * 40 - fw[0] * (22 + side * 6), hd[1] + up[1] * 40 - fw[1] * (22 + side * 6));
    g.stroke();
  }
  g.lineWidth = 6;
  g.beginPath(); g.arc(hd[0], hd[1], BR.headR, 0, Math.PI * 2);
  g.fillStyle = C.bg; g.fill(); g.stroke();
  if (B.state !== 'dead') {
    g.fillStyle = C.eye;
    if (B.phase2) { g.shadowColor = C.eye; g.shadowBlur = 12; }
    g.beginPath();
    g.arc(hd[0] + fw[0] * 8 + up[0] * 2, hd[1] + fw[1] * 8 + up[1] * 2, B.phase2 ? 3.6 : 3, 0, Math.PI * 2);
    g.fill();
    g.shadowBlur = 0;
  }
  g.lineWidth = BR.line;
  path([S.hip, S.k1, S.f1]);
  // club
  const hx = S.hA[0], hy = S.hA[1], tx = S.wt[0], ty = S.wt[1];
  const L = Math.hypot(tx - hx, ty - hy) || 1, ux = (tx - hx) / L, uy = (ty - hy) / L;
  g.strokeStyle = C.club;
  g.lineWidth = 7; path([[hx - ux * 14, hy - uy * 14], [tx - ux * 40, ty - uy * 40]]);
  g.lineWidth = 17; path([[tx - ux * 44, ty - uy * 44], [tx - ux * 7, ty - uy * 7]]);
  g.strokeStyle = col; g.lineWidth = BR.line;
  path([S.sh, S.eA, S.hA]);
}
function drawTrail(tr, k, rgb, maxA) {
  for (let i = 1; i < tr.length; i++) {
    const a = tr[i - 1], b = tr[i];
    if (a.id !== b.id) continue;
    const al = (1 - b.age / 0.14) * maxA;
    if (al <= 0) continue;
    g.fillStyle = `rgba(${rgb},${al.toFixed(3)})`;
    g.beginPath();
    g.moveTo(lerp(a.hx, a.tx, k), lerp(a.hy, a.ty, k));
    g.lineTo(a.tx, a.ty);
    g.lineTo(b.tx, b.ty);
    g.lineTo(lerp(b.hx, b.tx, k), lerp(b.hy, b.ty, k));
    g.closePath();
    g.fill();
  }
}
function drawParts() {
  g.lineCap = 'round';
  for (const p of parts) {
    const a = clamp(p.life / p.max, 0, 1);
    if (p.k === 's') {
      g.strokeStyle = p.col; g.globalAlpha = a; g.lineWidth = 2;
      path([[p.x, p.y], [p.x - p.vx * 0.025, p.y - p.vy * 0.025]]);
    } else if (p.k === 'd') {
      g.fillStyle = C.ground; g.globalAlpha = 0.22 * a;
      g.beginPath(); g.arc(p.x, p.y, p.r * (1.4 - a * 0.4), 0, Math.PI * 2); g.fill();
    } else {
      g.fillStyle = C.heal; g.globalAlpha = a;
      g.beginPath(); g.arc(p.x, p.y, 2, 0, Math.PI * 2); g.fill();
    }
  }
  g.globalAlpha = 1;
}
function drawGroundMarks() {
  // ground line with low end posts
  g.strokeStyle = C.ground; g.lineCap = 'round'; g.lineWidth = 2.5;
  path([[T.arenaL, 0], [T.arenaR, 0]]);
  g.lineWidth = 2;
  path([[T.arenaL, 0], [T.arenaL, -12]]);
  path([[T.arenaR, 0], [T.arenaR, -12]]);
  // contact marks under the fighters (shrink with height, so a leap shows where it lands)
  const mark = (x, y, w) => {
    const k = 1 - clamp(-y / 260, 0, 0.7);
    g.globalAlpha = 0.28 * k; g.lineWidth = 6;
    path([[x - w * k, 2], [x + w * k, 2]]);
  };
  mark(B.x, B.y, 50);
  mark(P.x, P.y, 16);
  g.globalAlpha = 1;
  // shockwaves
  for (const w of waves) {
    const u = clamp(w.t / 0.45, 0, 1);
    if (w.ring) {
      g.strokeStyle = C.ui; g.globalAlpha = (1 - u) * 0.55; g.lineWidth = 4 * (1 - u) + 1;
      g.beginPath(); g.arc(w.ring[0], w.ring[1], lerp(24, w.r, EASE.out(u)), 0, Math.PI * 2); g.stroke();
    } else {
      const reach = w.r * EASE.out(Math.min(1, w.t / 0.2));
      g.strokeStyle = C.ground; g.globalAlpha = (1 - u) * 0.85; g.lineWidth = 3;
      for (const s of [-1, 1]) {
        const x = w.x + s * reach;
        g.beginPath();
        g.moveTo(x - s * 28, 0);
        g.quadraticCurveTo(x - s * 8, -18 * (1 - u) - 4, x, 0);
        g.stroke();
      }
    }
  }
  g.globalAlpha = 1;
}

// ---------------------------------------------------------------- drawing: HUD + controls
function bar(x, y, w, h, f, ghost, col) {
  g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(x - 1, y - 1, w + 2, h + 2);
  g.strokeStyle = 'rgba(233,230,223,0.28)'; g.lineWidth = 1; g.strokeRect(x - 1.5, y - 1.5, w + 3, h + 3);
  if (ghost != null && ghost > f) { g.fillStyle = C.ghost; g.fillRect(x, y, w * clamp(ghost, 0, 1), h); }
  g.fillStyle = col; g.fillRect(x, y, w * clamp(f, 0, 1), h);
}
function drawHUD() {
  const L = Math.max(16, safe.l + 12), Tp = Math.max(14, safe.t + 10);
  const bw = Math.min(W * 0.3, 240);
  bar(L, Tp, bw, 9, P.hp / T.p.hp, P.hpGhost / T.p.hp, C.hp);
  bar(L, Tp + 16, bw * 0.82, 6, P.st / T.p.st, null, C.st);
  for (let i = 0; i < T.p.flasks; i++) {
    const x = L + i * 15, y = Tp + 30;
    g.beginPath();
    g.moveTo(x + 4, y); g.lineTo(x + 8, y + 6); g.lineTo(x + 4, y + 12); g.lineTo(x, y + 6); g.closePath();
    if (i < P.flasks) { g.fillStyle = C.flask; g.fill(); }
    else { g.strokeStyle = 'rgba(217,164,65,0.45)'; g.lineWidth = 1; g.stroke(); }
  }
  // boss bar, bottom centre
  const bbw = Math.min(W * 0.46, 560), bx = (W - bbw) / 2;
  const by = H - Math.max(18, safe.b + 14) - 8;
  g.font = `${Math.round(clamp(W * 0.02, 14, 19))}px ${FONT_D}`;
  g.fillStyle = C.ui; g.textBaseline = 'bottom'; g.textAlign = 'left';
  g.fillText(BOSS_NAME, bx, by - 6);
  bar(bx, by, bbw, 8, B.hp / T.b.hp, B.hpGhost / T.b.hp, C.bossHp);
  if (!touchUI) {
    g.font = `500 12px ${FONT_UI}`; g.textAlign = 'right'; g.textBaseline = 'top';
    g.fillStyle = 'rgba(233,230,223,0.5)';
    const r = W - Math.max(16, safe.r + 12);
    ['A / D   move', 'J   attack', 'K   heavy (hold to charge)', 'Space   roll', 'E   heal']
      .forEach((s, i) => g.fillText(s, r, Tp + i * 17));
    g.textAlign = 'left';
  }
  if (touchUI && portrait) {
    g.font = `600 14px ${FONT_UI}`; g.textAlign = 'center'; g.textBaseline = 'top';
    g.fillStyle = 'rgba(233,230,223,0.8)';
    g.fillText('Turn your phone sideways to play', W / 2, Tp + 52);
    g.textAlign = 'left';
  }
}
function drawControls() {
  if (!touchUI) return;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  for (const b of btns) {
    g.beginPath(); g.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    g.fillStyle = b.down ? 'rgba(233,230,223,0.28)' : 'rgba(233,230,223,0.08)'; g.fill();
    g.strokeStyle = 'rgba(233,230,223,0.45)'; g.lineWidth = 1.5; g.stroke();
    g.fillStyle = 'rgba(233,230,223,0.85)';
    g.font = `700 ${Math.round(clamp(b.r * 0.3, 10, 14))}px ${FONT_UI}`;
    g.fillText(b.act === 'heal' ? `HEAL ${P.flasks}` : b.label, b.x, b.y);
  }
  let pad = null;
  for (const p of ptrs.values()) if (p.pad) pad = p;
  const cx = pad ? pad.ox : padHome.x, cy = pad ? pad.oy : padHome.y, r = padHome.r;
  g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2);
  g.fillStyle = 'rgba(233,230,223,0.06)'; g.fill();
  g.strokeStyle = 'rgba(233,230,223,0.35)'; g.lineWidth = 1.5; g.stroke();
  const kx = cx + (pad ? clamp(pad.dx, -r, r) : 0);
  g.beginPath(); g.arc(kx, cy, r * 0.42, 0, Math.PI * 2);
  g.fillStyle = pad ? 'rgba(233,230,223,0.4)' : 'rgba(233,230,223,0.18)'; g.fill();
  if (!pad) {
    g.fillStyle = 'rgba(233,230,223,0.6)'; g.font = `700 12px ${FONT_UI}`;
    g.fillText('◀', cx - r * 0.68, cy); g.fillText('▶', cx + r * 0.68, cy);
  }
  g.textAlign = 'left';
}
function drawOverlay() {
  if (!ended) return;
  const a = clamp(ended.t / 0.8, 0, 1), lose = ended.kind === 'lose';
  g.fillStyle = `rgba(8,8,10,${(0.55 * a).toFixed(3)})`; g.fillRect(0, 0, W, H);
  g.globalAlpha = a; g.textAlign = 'center'; g.textBaseline = 'middle';
  const size = Math.round(clamp(W * 0.075, 34, 84));
  g.font = `${size}px ${FONT_D}`;
  g.fillStyle = lose ? '#c0392e' : '#d9b36a';
  g.fillText(lose ? 'YOU FELL' : 'VICTORY', W / 2, H * 0.4);
  if (ended.t > 0.6) {
    g.font = `500 ${Math.round(clamp(size * 0.24, 13, 18))}px ${FONT_UI}`; g.fillStyle = C.ui;
    g.fillText(touchUI ? 'Tap to fight again' : 'Press R or click to fight again', W / 2, H * 0.4 + size * 0.85);
  }
  g.globalAlpha = 1; g.textAlign = 'left';
}

function render() {
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.fillStyle = C.bg; g.fillRect(0, 0, cvs.width, cvs.height);
  const sx = shakeMag ? rand(-1, 1) * shakeMag * 0.6 : 0, sy = shakeMag ? rand(-1, 1) * shakeMag * 0.6 : 0;
  const ox = W / 2 - camX * scale + sx, oy = groundY + sy;
  g.setTransform(scale * dpr, 0, 0, scale * dpr, ox * dpr, oy * dpr);
  g.save();
  g.beginPath(); g.rect(-5000, -5000, 12000, 5000); g.clip();   // nothing draws below the ground line
  drawBoss();
  drawPlayer();
  drawTrail(trails.b, 0.55, '220,200,178', 0.32);
  drawTrail(trails.p, 0.38, '206,224,255', 0.5);
  drawParts();
  g.restore();
  drawGroundMarks();
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawHUD();
  drawControls();
  drawOverlay();
}

// ---------------------------------------------------------------- main loop
let last = performance.now(), acc = 0;
function frame(t) {
  const dt = Math.min(0.1, (t - last) / 1000);
  last = t;
  if (slowT > 0) {
    slowT -= dt;
    timeScale = slowT > 0.35 ? 0.3 : lerp(1, 0.3, Math.max(0, slowT) / 0.35);
  } else timeScale = 1;
  let wdt = dt * timeScale;
  if (hitStop > 0) { hitStop -= dt; wdt = 0; }
  acc += wdt;
  let n = 0;
  while (acc >= T.step && n < 24) {
    update(T.step);
    acc -= T.step; n++;
    if (hitStop > 0) { acc = 0; break; }
  }
  if (n >= 24) acc = 0;
  updateFx(wdt);
  // UI timers run on real time
  shakeMag = shakeMag > 0.2 ? shakeMag * Math.exp(-11 * dt) : 0;
  if (P.ghostT > 0) P.ghostT -= dt; else P.hpGhost = approach(P.hpGhost, P.hp, 45 * dt);
  if (B.ghostT > 0) B.ghostT -= dt; else B.hpGhost = approach(B.hpGhost, B.hp, 160 * dt);
  if (P.hpGhost < P.hp) P.hpGhost = P.hp;
  if (endTimer) { endTimer.t -= dt; if (endTimer.t <= 0) { ended = { kind: endTimer.kind, t: 0 }; endTimer = null; } }
  if (ended) ended.t += dt;
  // camera: stays between the fighters, leaning towards the player
  const vw = W / scale, aw = T.arenaR - T.arenaL;
  let target = lerp(P.x, B.x, 0.42);
  target = vw >= aw + 80 ? (T.arenaL + T.arenaR) / 2 : clamp(target, T.arenaL - 40 + vw / 2, T.arenaR + 40 - vw / 2);
  camX += (target - camX) * (1 - Math.exp(-4 * dt));
  render();
  requestAnimationFrame(frame);
}

resize();
reset();
requestAnimationFrame(frame);

// Handle for automated checks.
window.__duel = { P, B, T, input, press, reset, bBegin, pDo,
  get waves() { return waves; }, get ended() { return ended; },
  toScreen: (x, y) => [W / 2 - camX * scale + x * scale, groundY + y * scale] };
})();
