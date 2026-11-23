/* Stick Souls — one boss fight, all focus on movement, animation and combat feel.
   Everything is drawn and voiced in code: stick figures built from joints, posed with keyframes
   and two-bone IK, hit detection uses the real animated weapon geometry, sounds are synthesized. */
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
// Every gameplay number lives here. The settings panel edits these values live.
const T = {
  arenaL: 40, arenaR: 1440,
  step: 1 / 120,
  p: {
    hp: 100, st: 100, stRegen: 50, stDelayEmpty: 1.0, guardRegen: 0.2,
    run: 225, accel: 1800,
    flasks: 3, flaskHeal: 45,
    costLight: 16, costHeavy: 28, costRoll: 13, costJump: 10, costBackstep: 8,
    rollDist: 190, rollInv: 0.43, jumpH: 52, buffer: 0.2, holdTime: 0.2, chargeTime: 0.5,
    dmgL: 10, dmgHeavy: 13, dmgCharged: 17, dmgCrit: 35,
    dmgJumpL: 12, dmgJumpH: 15, dmgCounter: 15, dmgRollAtk: 10,
    poiseL: 14, poiseHeavy: 15, poiseCharged: 39, poiseJumpL: 18, poiseJumpH: 27, poiseCounter: 39, poiseRollAtk: 12,
    parryWin: 0.10, blockTaken: 0.25, blockSt: 1.0,
  },
  b: {
    hp: 520, poise: 100, poiseDelay: 6, poiseRegen: 10, staggerMult: 1.5,
    walk: 80, walk2: 100, phase2At: 0.5, speed2: 1.16,
    cdLeap: 6, cdStomp: 3.5, cdQuake: 7, healPunish: 0.7,
  },
  // multipliers and feel
  f: { atkSpeed: 1, rollSpeed: 1, bossSpeed: 1, bossDmg: 1, bossPause: 1, poiseMult: 1,
    hitstop: 1, shake: 1, game: 1, volume: 0.8 },
};
const DEFAULTS = JSON.parse(JSON.stringify(T));
const getPath = (o, p) => p.split('.').reduce((a, k) => a[k], o);
const setPath = (o, p, v) => { const ks = p.split('.'); const k = ks.pop(); ks.reduce((a, x) => a[x], o)[k] = v; };

// [group, setting, label, min, max, step, format, applies on restart]
const SETTINGS = [
  ['Movement', 'p.run', 'Run speed', 100, 400, 5],
  ['Movement', 'p.rollDist', 'Roll distance', 80, 320, 5],
  ['Movement', 'p.rollInv', 'Roll invincibility (seconds)', 0.1, 0.65, 0.01],
  ['Movement', 'f.rollSpeed', 'Roll speed', 0.6, 1.6, 0.05, 'x'],
  ['Movement', 'p.jumpH', 'Jump height', 20, 110, 1],
  ['Attacks', 'f.atkSpeed', 'Attack speed', 0.6, 1.8, 0.05, 'x'],
  ['Attacks', 'p.dmgL', 'Light damage', 2, 40, 1],
  ['Attacks', 'p.dmgHeavy', 'Heavy damage', 2, 60, 1],
  ['Attacks', 'p.dmgCharged', 'Charged heavy damage', 2, 80, 1],
  ['Attacks', 'p.dmgCrit', 'Critical hit damage', 5, 150, 1],
  ['Attacks', 'f.poiseMult', 'Poise damage you deal', 0.3, 3, 0.05, 'x'],
  ['Attacks', 'p.holdTime', 'Hold time for heavy (seconds)', 0.1, 0.5, 0.01],
  ['Defense', 'p.parryWin', 'Parry window (seconds)', 0.04, 0.3, 0.01],
  ['Defense', 'p.blockTaken', 'Damage taken while blocking', 0, 1, 0.05, 'pct'],
  ['Defense', 'p.blockSt', 'Stamina drain when blocking', 0.3, 2.5, 0.05, 'x'],
  ['Stamina', 'p.st', 'Max stamina', 40, 200, 5],
  ['Stamina', 'p.stRegen', 'Stamina recovery per second', 10, 120, 1],
  ['Stamina', 'p.costLight', 'Light attack cost', 0, 50, 1],
  ['Stamina', 'p.costHeavy', 'Heavy attack cost', 0, 60, 1],
  ['Stamina', 'p.costRoll', 'Roll cost', 0, 40, 1],
  ['Stamina', 'p.costJump', 'Jump cost', 0, 40, 1],
  ['Health', 'p.hp', 'Your health', 30, 300, 5, null, true],
  ['Health', 'p.flasks', 'Healing flasks', 0, 10, 1, null, true],
  ['Health', 'p.flaskHeal', 'Health per flask', 5, 100, 1],
  ['Boss', 'b.hp', 'Boss health', 100, 2000, 10, null, true],
  ['Boss', 'b.poise', 'Boss poise', 30, 300, 5],
  ['Boss', 'b.poiseDelay', 'Poise recovery delay (seconds)', 0.5, 15, 0.5],
  ['Boss', 'b.poiseRegen', 'Poise recovery per second', 1, 60, 1],
  ['Boss', 'f.bossSpeed', 'Boss attack speed', 0.6, 1.6, 0.05, 'x'],
  ['Boss', 'f.bossDmg', 'Boss damage', 0.2, 2.5, 0.05, 'x'],
  ['Boss', 'f.bossPause', 'Pause between boss attacks', 0.2, 2.5, 0.05, 'x'],
  ['Boss', 'b.speed2', 'Phase 2 speed-up', 1, 1.5, 0.01, 'x'],
  ['Feel', 'f.hitstop', 'Hit-stop', 0, 2.5, 0.05, 'x'],
  ['Feel', 'f.shake', 'Screen shake', 0, 2, 0.05, 'x'],
  ['Feel', 'f.game', 'Game speed', 0.5, 1.5, 0.05, 'x'],
  ['Sound', 'f.volume', 'Volume', 0, 1, 0.05, 'pct'],
];
// Bump a setting's number when its meaning or default changes on purpose:
// saved values for it are then ignored and it starts from the new default.
const SET_VER = {};
const verOf = id => SET_VER[id] || 1;

const BOSS_NAME = 'Gaunt Warden';
const C = {
  bg: '#0d0e11',
  ground: '#cfc9bd',
  player: '#eeebe4', hurt: '#ff7a68',
  blade: '#a7bdd3', bladeHot: '#eef5ff', hilt: '#857a6a',
  boss: '#b8b0a2', boss2: '#cfa08f', bossFlash: '#ffffff', club: '#8a7863', eye: '#ff4a35',
  spark: '#fff1cf', blood: '#ff8b73', heal: '#e8b752', parry: '#bfe3ff', crit: '#ffd27a',
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
// Stretch an attack after time `after` (delayed boss variants, finisher recoveries).
function shifted(def, after, extra) {
  if (extra <= 0.001) return def;
  const sh = t => (t > after ? t + extra : t);
  const nd = { ...def, an: { dur: def.an.dur + extra, ks: def.an.ks.map(k => ({ ...k, t: sh(k.t) })) } };
  for (const f of ['act', 'cancel', 'commit']) if (nd[f] != null) nd[f] = sh(nd[f]);
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
// running and fades out within 0.12s of an action starting, before any hit window opens.
const PC = { get walk() { return T.p.run; }, leanV: 5, lean: [11, 0.5], head: [26, 0.55], thr: 9, reach: 26, dur: 0.11, lift: 6 };
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
// Gait cycle with a planted stance part (fraction sf): the foot moves back exactly as fast as the
// body moves forward, so it stays still on the ground, then lifts and swings forward on an arc.
function gait(ph, S, H, sf = 0.5) {
  const p = ph - Math.floor(ph);
  if (p < sf) return [S - 2 * S * p / sf, 0];
  const u = (p - sf) / (1 - sf);
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
      if (u >= 1) { f.step = null; f.off = 0; if (ch === B) sStep(B.x, 0.6); }
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
// mode: 'gait' (running/standing), 'lock' (grounded action), 'free' (airborne, rolling, knocked down)
function finalize(ch, cfg, dt, mode) {
  const p = copyPose(ch.pose, ch.dpose);
  let dx = ch.x - ch.sx, dy = ch.y - ch.sy;
  ch.sx = ch.x; ch.sy = ch.y;
  if (Math.abs(dx) > 60 || Math.abs(dy) > 60) {   // a teleport (restart), not movement
    dx = dy = 0; ch.svx = ch.svy = 0;
    for (const f of ch.feet) { f.off = 0; f.step = null; }
  }
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
  // torso settles into running speed and pitches a little on starts and stops
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
// running: greatsword carried low with the blade trailing behind
const RUN = { ...PB, hy: -38, lean: 18, head: -14, ax: 8, ay: 28, w: 150 };
const BLOCK = { ...GUARD, hy: -40, lean: 0, head: -6, ax: 16, ay: 6, w: -84, f1x: 16, f2x: -15 };
const TUCK = { hy: -24, lean: 62, head: 22, ax: 8, ay: 12, w: -208, f1x: 10, f1y: -9, f2x: 0, f2y: -5 };
const DOWN_KEYS = [
  [0, {}],
  [0.12, { lean: -30, head: -25, rot: -35, hy: -40, ax: -4, ay: -14, w: -130, f1x: 22, f1y: -12, f2x: 4, f2y: -4 }, 'out'],
  [0.36, { rot: -88, oy: 20, ox: -6, lean: -6, head: -10, hy: -44, ax: 10, ay: 10, w: -30, f1x: 16, f1y: 0, f2x: 6, f2y: -6 }, 'in2'],
];

// Timings follow Elden Ring's two-handed greatsword (seconds at attack speed 1).
const PA = {
  light1: {
    an: mk(PB, [
      [0, {}],
      [0.22, { ax: 4, ay: -6, w: -140, lean: 0, hy: -42, head: -4, f1x: 14, f2x: -13 }, 'out'],
      [0.40, { ax: -2, ay: -12, w: -158, lean: -5, hy: -43, head: -2, f1x: 15, f2x: -14 }, 'io'],
      [0.53, { ax: 16, ay: -8, w: -62, lean: 8, hy: -41, head: -6, f1x: 20, f2x: -15 }, 'in'],
      [0.62, { ax: 26, ay: 18, w: 30, lean: 22, hy: -37, head: -8, f1x: 26, f2x: -15 }, 'lin'],
      [0.70, { ax: 24, ay: 18, w: 36, lean: 24 }, 'out'],
      [1.10, { ax: 22, ay: 18, w: 35, lean: 22 }, 'lin'],
      [1.32, { ...GUARD, lean: 5, hy: -43, ay: 20, w: -45 }, 'out'],
      [1.45, GUARD, 'io'],
    ]),
    hits: [{ t0: 0.53, t1: 0.66, k: 'L1' }], pay: [0.53, 'L1'],
    moves: [{ t0: 0.40, t1: 0.62, d: 30 }],
    chainAt: 0.85, next: 'light2', rollAt: 0.95, act: 1.25, armor: [0.30, 0.83], regenAt: 1.3, atk: true, spd: 'atk',
  },
  light2: {
    an: mk(PB, [
      [0, {}],
      [0.30, { ax: 6, ay: 24, w: 40, lean: 18, hy: -38, head: -6, f1x: 18, f2x: -16 }, 'out'],
      [0.48, { ax: 2, ay: 26, w: 52, lean: 20, hy: -37, f1x: 17, f2x: -17 }, 'io'],
      [0.60, { ax: 18, ay: 6, w: -10, lean: 14, hy: -40, head: -8, f1x: 20, f2x: -14 }, 'in'],
      [0.68, { ax: 24, ay: -22, w: -78, lean: 10, hy: -40, f1x: 21, f2x: -12 }, 'lin'],
      [0.82, { ax: 16, ay: -28, w: -100, lean: 4 }, 'out'],
      [1.20, { ax: 15, ay: -26, w: -96, lean: 5 }, 'lin'],
      [1.38, { ...GUARD, lean: 10, ay: 24, w: -31 }, 'out'],
      [1.50, GUARD, 'io'],
    ]),
    hits: [{ t0: 0.58, t1: 0.73, k: 'L2' }], pay: [0.58, 'L2'],
    moves: [{ t0: 0.45, t1: 0.68, d: 24 }],
    chainAt: 1.0, next: 'light3', rollAt: 1.05, act: 1.3, armor: [0.30, 0.90], regenAt: 1.35, atk: true, spd: 'atk',
  },
  // finisher: slower two-handed overhead slam
  light3: {
    an: mk(PB, [
      [0, {}],
      [0.35, { ax: -4, ay: -24, w: -150, lean: -8, hy: -41, head: -6, f1x: 16, f2x: -16 }, 'out'],
      [0.62, { ax: -6, ay: -27, w: -162, lean: -11, hy: -40, f1x: 17, f2x: -18 }, 'io'],
      [0.80, { ax: 18, ay: -6, w: -50, lean: 12, hy: -38, head: -6, f1x: 24, f2x: -15 }, 'in'],
      [0.90, { ax: 28, ay: 16, w: 34, lean: 30, hy: -33, head: -2, f1x: 28, f2x: -16 }, 'lin'],
      [1.05, { ax: 27, ay: 17, w: 36, lean: 31, hy: -32 }, 'out'],
      [1.40, { lean: 29 }, 'lin'],
      [1.62, { ...GUARD, lean: 4, hy: -43, w: -46 }, 'out'],
      [1.75, GUARD, 'io'],
    ]),
    hits: [{ t0: 0.80, t1: 0.95, k: 'L3' }], pay: [0.80, 'L3'],
    moves: [{ t0: 0.62, t1: 0.90, d: 34 }],
    events: [{ t: 0.90, ev: 'pImpact' }],
    chainAt: 1.30, next: 'light1', rollAt: 1.25, act: 1.5, armor: [0.30, 1.0], regenAt: 1.5, atk: true, spd: 'atk',
  },
  // heavy: raise; keep holding to charge (all or nothing), release or full charge to swing
  heavyWind: {
    an: mk(PB, [
      [0, {}],
      [0.45, { ax: -6, ay: -26, w: -160, lean: -8, hy: -40, head: -8, f1x: 19, f2x: -18 }, 'out'],
    ]),
    armor: [0.30, 99], regenAt: 99, atk: true, spd: 'atk',
  },
  heavyStrike: {
    an: mk(PB, [
      [0, {}],
      [0.12, { ax: -8, ay: -28, w: -166, lean: -10, hy: -39 }, 'out'],
      [0.25, { ax: 16, ay: -6, w: -50, lean: 14, hy: -37, head: -4, f1x: 26, f2x: -16 }, 'in'],
      [0.33, { ax: 28, ay: 18, w: 35, lean: 30, hy: -33, head: -2, f1x: 30, f2x: -16 }, 'lin'],
      [0.45, { lean: 31, hy: -32 }, 'out'],
      [0.85, { lean: 30 }, 'lin'],
      [1.12, { ...GUARD, lean: 4, hy: -43, w: -46 }, 'out'],
      [1.25, GUARD, 'io'],
    ]),
    hits: [{ t0: 0.25, t1: 0.38, k: 'H' }], pay: [0.25, 'H'],
    moves: [{ t0: 0.12, t1: 0.33, d: 30 }],
    events: [{ t: 0.33, ev: 'pImpact' }],
    armor: [0, 0.58], rollAt: 0.75, act: 0.85, regenAt: 0.9, atk: true, spd: 'atk',
  },
  // roll: invincible from 0.03s for T.p.rollInv seconds
  roll: {
    an: mk(PB, [
      [0, {}],
      [0.10, { hy: -32, lean: 38, head: 10, ax: 12, ay: 18, w: -60, f1x: 20, f2x: -16, f2y: -6 }, 'out'],
      [0.18, { ...TUCK, rot: 50 }, 'lin'],
      [0.46, { ...TUCK, rot: 320 }, 'lin'],
      [0.58, { hy: -34, lean: 22, head: 0, ax: 14, ay: 20, w: -30, f1x: 16, f1y: 0, f2x: -14, f2y: 0, rot: 360 }, 'out'],
      [0.72, { ...GUARD, rot: 360 }, 'io'],
    ]),
    moves: [{ t0: 0.03, t1: 0.60, d: 'rollDist', e: 'out2' }],
    inv: 'roll', cost: 'costRoll', act: 0.67, rollAt: 0.67, rollAtkFrom: 0.45, regenAt: 1.0, roll: true, spd: 'roll',
  },
  rollAtk: {
    an: mk(PB, [
      [0, {}],
      [0.18, { ax: 6, ay: 20, w: 150, lean: 20, hy: -36, ea: -1, f1x: 18, f2x: -15 }, 'out'],
      [0.30, { ax: 26, ay: 4, w: 10, lean: 16, hy: -40, ea: 1, f1x: 22, f2x: -14 }, 'in'],
      [0.40, { ax: 22, ay: -14, w: -40, lean: 10, hy: -42 }, 'out'],
      [0.80, { ax: 18, ay: -10, w: -45, lean: 9 }, 'lin'],
      [1.0, GUARD, 'io'],
    ]),
    hits: [{ t0: 0.26, t1: 0.40, k: 'RA' }], pay: [0.26, 'RA'],
    moves: [{ t0: 0.10, t1: 0.32, d: 26 }],
    act: 0.85, rollAt: 0.75, regenAt: 0.9, atk: true, spd: 'atk',
  },
  // dodge with no direction held: short hop back, no invincibility
  backstep: {
    an: mk(PB, [
      [0, {}],
      [0.08, { hy: -38, lean: -6, f1x: 10, f2x: -10, ay: 18 }, 'out'],
      [0.22, { hy: -44, lean: -10, f1x: 8, f1y: -6, f2x: -14, f2y: -4 }, 'out'],
      [0.40, GUARD, 'io'],
    ]),
    moves: [{ t0: 0.04, t1: 0.30, d: -75, e: 'out2' }],
    cost: 'costBackstep', act: 0.36, rollAt: 0.36, regenAt: 0.5, roll: true, spd: 'roll',
  },
  jump: {
    an: mk(PB, [
      [0, {}],
      [0.08, { hy: -36, lean: 12, f1x: 12, f2x: -10 }, 'out'],
      [0.22, { hy: -45, lean: 6, head: -6, f1x: 12, f1y: -18, f2x: -6, f2y: -12, ay: 16, w: -30 }, 'out'],
      [9, {}, 'lin'],
    ]),
    regenAt: 99,
  },
  land: {
    an: mk(PB, [[0, {}], [0.07, { hy: -34, lean: 14, f1x: 14, f2x: -12, f1y: 0, f2y: 0 }, 'out'], [0.2, GUARD, 'io']]),
    act: 0.06, rollAt: 0.06, regenAt: 0.15,
  },
  // hold to block (stays up at least 0.25s so a quick tap can still parry)
  block: {
    an: mk(PB, [[0, {}], [0.1, BLOCK, 'out'], [999, BLOCK, 'lin']]),
    act: 0, rollAt: 0, guard: true,
  },
  unblock: { an: mk(PB, [[0, {}], [0.14, GUARD, 'io']]), act: 0, rollAt: 0 },
  blockHit: {
    an: mk(PB, [
      [0, {}],
      [0.06, { ...BLOCK, lean: -9, hy: -41, ax: 8, ay: 4, w: -96 }, 'out'],
      [0.30, BLOCK, 'io'],
    ]),
    act: 0.3, rollAt: 0.15, guard: true,
  },
  guardBreak: {
    an: mk(PB, [
      [0, {}],
      [0.1, { lean: -24, head: -24, ax: -4, ay: -18, w: -120, hy: -41, f1x: 16, f2x: -18 }, 'out'],
      [0.8, { lean: -14 }, 'lin'],
      [1.05, GUARD, 'io'],
    ]),
    act: 1.0, rollAt: 1.0,
  },
  parry: {
    an: mk(PB, [
      [0, {}],
      [0.07, { lean: -8, ax: 6, ay: -20, w: -118, hy: -42, f1x: 16, f2x: -16 }, 'out'],
      [0.42, GUARD, 'io'],
    ]),
    inv: [0, 0.42], act: 0.2, rollAt: 0.2,
  },
  // guard counter: heavy right after blocking a hit
  gCounter: {
    an: mk(PB, [
      [0, {}],
      [0.35, { ax: -6, ay: -24, w: -150, lean: -6, hy: -41, f1x: 17, f2x: -16 }, 'out'],
      [0.53, { ax: 16, ay: -6, w: -50, lean: 14, hy: -37, f1x: 24, f2x: -15 }, 'in'],
      [0.62, { ax: 28, ay: 18, w: 35, lean: 30, hy: -33, f1x: 28, f2x: -16 }, 'lin'],
      [0.75, { lean: 30, hy: -32 }, 'out'],
      [1.15, { ...GUARD, lean: 4, hy: -43, w: -46 }, 'out'],
      [1.3, GUARD, 'io'],
    ]),
    hits: [{ t0: 0.53, t1: 0.66, k: 'GC' }], pay: [0.53, 'GC'],
    moves: [{ t0: 0.35, t1: 0.6, d: 24 }],
    armor: [0, 0.7], act: 1.1, rollAt: 1.0, regenAt: 1.1, atk: true, spd: 'atk',
  },
  // critical hit on a kneeling or parried boss: stab, hold, rip out
  crit: {
    an: mk(PB, [
      [0, {}],
      [0.15, { ax: 14, ay: 6, w: -10, lean: 10, hy: -40, f1x: 18, f2x: -16 }, 'out'],
      [0.40, { ax: 4, ay: 2, w: -4, lean: 4, hy: -41, f1x: 16, f2x: -18 }, 'io'],
      [0.52, { ax: 30, ay: 2, w: 4, lean: 26, hy: -36, head: -10, f1x: 28, f2x: -14 }, 'in'],
      [0.95, { ax: 29, ay: 3, w: 6, lean: 27 }, 'lin'],
      [1.15, { ax: 6, ay: 4, w: -20, lean: -6, hy: -42, f1x: 14, f2x: -18 }, 'out'],
      [1.9, GUARD, 'io'],
    ]),
    events: [{ t: 0.52, ev: 'crit1' }, { t: 1.12, ev: 'crit2' }],
    inv: [0, 9], act: 1.7, rollAt: 1.6, regenAt: 1.5,
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
  // knockdown: thrown back, land, get up (invincible the whole time); roll out from 0.9s
  down: {
    an: mk(PB, [
      ...DOWN_KEYS,
      [0.85, { rot: -90, oy: 21 }, 'lin'],
      [1.05, { rot: -30, oy: 6, ox: 0, hy: -26, lean: 40, head: 0, ax: 14, ay: 20, w: -20, f1x: 16, f1y: 0, f2x: -10, f2y: 0 }, 'out'],
      [1.3, GUARD, 'io'],
    ]),
    inv: [0, 1.2], act: 1.24, rollAt: 0.9, air: [0, 0.36, 26],
  },
  dead: {
    an: mk(PB, [...DOWN_KEYS, [3, { rot: -90, oy: 21 }, 'lin']]),
    inv: [0, 99], air: [0, 0.36, 26],
  },
};
// jump attacks are built per jump so the blow lands exactly as the feet touch down
function makeJumpLight(Tl) {
  return {
    an: mk(PB, [
      [0, {}],
      [Tl * 0.5, { ax: -2, ay: -14, w: -150, lean: -4, hy: -44, head: -4, f1x: 10, f1y: -14, f2x: -8, f2y: -10 }, 'out'],
      [Tl - 0.02, { ax: 24, ay: 10, w: 10, lean: 18, hy: -40, head: -8, f1x: 16, f1y: -4, f2x: -12, f2y: -2 }, 'in'],
      [Tl + 0.07, { ax: 26, ay: 18, w: 34, lean: 26, hy: -34, f1x: 20, f1y: 0, f2x: -14, f2y: 0 }, 'out'],
      [Tl + 0.32, { lean: 24 }, 'lin'],
      [Tl + 0.55, GUARD, 'io'],
    ]),
    hits: [{ t0: Tl - 0.14, t1: Tl + 0.05, k: 'JL' }], pay: [Tl - 0.14, 'JL'],
    events: [{ t: Tl, ev: 'land' }],
    act: Tl + 0.45, rollAt: Tl + 0.36, regenAt: Tl + 0.4, atk: true,
  };
}
function makeJumpHeavy(Tl) {
  return {
    an: mk(PB, [
      [0, {}],
      [Tl * 0.55, { ax: -6, ay: -26, w: -165, lean: -10, hy: -44, head: -8, f1x: 10, f1y: -14, f2x: -8, f2y: -10 }, 'out'],
      [Tl - 0.02, { ax: 20, ay: 0, w: -20, lean: 16, hy: -40, f1x: 18, f1y: -4, f2x: -12, f2y: -2 }, 'in'],
      [Tl + 0.08, { ax: 28, ay: 18, w: 35, lean: 32, hy: -32, head: -2, f1x: 24, f1y: 0, f2x: -16, f2y: 0 }, 'out'],
      [Tl + 0.5, { lean: 30 }, 'lin'],
      [Tl + 0.85, GUARD, 'io'],
    ]),
    hits: [{ t0: Tl - 0.12, t1: Tl + 0.07, k: 'JH' }], pay: [Tl - 0.12, 'JH'],
    events: [{ t: Tl, ev: 'pImpact' }],
    armor: [0, Tl + 0.1], act: Tl + 0.75, rollAt: Tl + 0.6, regenAt: Tl + 0.7, atk: true,
  };
}
// [damage, poise damage, weight] per player hit kind
const HIT = {
  L1: () => [T.p.dmgL, T.p.poiseL, 'light'],
  L2: () => [T.p.dmgL * 1.1, T.p.poiseL, 'light'],
  L3: () => [T.p.dmgL * 1.3, T.p.poiseL * 1.3, 'heavy'],
  H: () => (P.charge >= 1 ? [T.p.dmgCharged, T.p.poiseCharged, 'charged'] : [T.p.dmgHeavy, T.p.poiseHeavy, 'heavy']),
  JL: () => [T.p.dmgJumpL, T.p.poiseJumpL, 'light'],
  JH: () => [T.p.dmgJumpH, T.p.poiseJumpH, 'heavy'],
  RA: () => [T.p.dmgRollAtk, T.p.poiseRollAtk, 'light'],
  GC: () => [T.p.dmgCounter, T.p.poiseCounter, 'heavy'],
};
// stamina is spent when the blade becomes dangerous, not on the button press
const PAY = {
  L1: () => T.p.costLight, L2: () => T.p.costLight, L3: () => T.p.costLight * 1.25,
  H: () => T.p.costHeavy * (P.charge >= 1 ? 1.33 : 1),
  JL: () => 15, JH: () => 30, RA: () => 14, GC: () => 20,
};
const G_JUMP = 760;

// ---------------------------------------------------------------- boss rig + moves
const BR = { thigh: 58, shin: 58, spine: 86, neck: 10, headR: 18, upper: 56, fore: 56,
  grip: 0, pommel: 16, wlen: 128, pvx: 0, pvy: -50, line: 8.5 };
const BB = { hx: 0, hy: -100, lean: 24, head: -14, ax: 30, ay: 68, bx: 46, by: 52, w: 58, th: 0, ea: 1, eb: 1,
  f1x: 42, f1y: 0, f2x: -46, f2y: 0, rot: 0, ox: 0, oy: 0 };
const KNEEL = { hy: -62, lean: 56, head: 6, ax: 30, ay: 70, w: 85, bx: 50, by: 66, f1x: 50, f1y: 0, f2x: -30, f2y: 0 };

// commit = moment the boss stops re-aiming (it turns to follow you until then)
const BA = {
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
    hits: [{ t0: 1.02, t1: 1.2, dmg: 30, knock: 'down', guard: 45 }],
    events: [{ t: 1.16, ev: 'smash' }],
    moves: [{ t0: 0.95, t1: 1.15, d: 50, adapt: [200, 0, 80] }],
    commit: 0.85, act: 2.4, cancel: 1.5, atk: true,
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
    hits: [{ t0: 0.69, t1: 0.9, dmg: 22, knock: 'down', guard: 35 }],
    moves: [{ t0: 0.66, t1: 0.84, d: 30, adapt: [90, 0, 60] }],
    commit: 0.52, act: 1.75, cancel: 1.05, atk: true,
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
    hits: [{ t0: 0.88, t1: 1.1, dmg: 24, knock: 'down', guard: 35 }],
    moves: [{ t0: 0.84, t1: 1.04, d: 240, e: 'out2', adapt: [170, 40, 280] }],
    commit: 0.72, act: 2.1, cancel: 1.4, atk: true,
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
    hits: [{ t0: 1.04, t1: 1.22, dmg: 30, knock: 'down', guard: 50 }],
    events: [{ t: 1.2, ev: 'leap' }],
    leap: { t0: 0.62, t1: 1.2, h: 140 },
    commit: 0.55, act: 2.45, cancel: 1.6, atk: true,
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
    act: 1.45, cancel: 1.0, atk: true,
  },
  // phase 2 area attack: club driven into the ground, three rings of eruptions travel outward
  quake: {
    an: mk(BB, [
      [0, {}],
      [0.8, { hy: -106, lean: -2, head: -8, ax: -10, ay: -92, w: -100, bx: 30, by: -40, f1x: 46, f2x: -44 }, 'out'],
      [1.0, { hy: -84, lean: 40, head: -22, ax: 62, ay: 70, w: 60, bx: 50, by: 50, f1x: 60, f2x: -46 }, 'in'],
      [1.7, { hy: -86, lean: 38 }, 'lin'],
      [2.3, BASE, 'out', { lean: 17, hy: -104 }],
      [2.6, BASE, 'io'],
    ]),
    events: [{ t: 1.0, ev: 'quake1' }, { t: 1.18, ev: 'quake2' }, { t: 1.36, ev: 'quake3' }],
    act: 2.6, cancel: 2.0, atk: true,
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
  // poise broken: kneels, takes extra damage, open to a critical hit
  stagger: {
    an: mk(BB, [[0, {}], [0.18, KNEEL, 'out'], [1.9, { hy: -60, lean: 58, head: 8 }, 'lin'], [2.2, BASE, 'io']]),
    act: 2.2, noPoise: true, critable: true,
  },
  // parried: thrown off balance, open to a critical hit
  reel: {
    an: mk(BB, [
      [0, {}],
      [0.15, { hy: -96, lean: -16, head: -30, ax: -20, ay: -60, w: -130, bx: 40, by: -30, f1x: 30, f2x: -50 }, 'out'],
      [0.5, { hy: -80, lean: 30, head: 0, ax: 20, ay: 60, w: 80, bx: 50, by: 60, f1x: 46, f2x: -40 }, 'io'],
      [1.15, { hy: -82, lean: 32 }, 'lin'],
      [1.4, BASE, 'io'],
    ]),
    act: 1.4, noPoise: true, critable: true,
  },
  // receiving a critical hit
  critHit: {
    an: mk(BB, [
      [0, {}],
      [0.52, { ...KNEEL, lean: 50, head: 0 }, 'lin'],
      [0.62, { hy: -66, lean: 30, head: -30, bx: 30, by: 10, ax: 10, ay: 40, w: 70 }, 'out'],
      [1.12, { lean: 28, head: -34 }, 'lin'],
      [1.40, { hy: -50, lean: 70, head: 20, bx: 50, by: 60, ax: 40, ay: 50, w: 90 }, 'out'],
      [2.2, { hy: -56, lean: 62 }, 'lin'],
      [2.8, BASE, 'io'],
    ]),
    act: 2.8, noPoise: true,
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
// fixed delayed versions: same wind-up, much longer hold at the top
BA.smashD = shifted(BA.smash, 0.75, 0.68);
BA.thrustD = shifted(BA.thrust, 0.7, 0.45);
// attack strings; the last attack of a string always leaves a long opening
const STRINGS1 = { upswing: [['smash']], thrust: [['upswing']] };
const STRINGS2 = {
  upswing: [['smash'], ['thrust', 'smash']], smash: [['smashD']],
  thrust: [['upswing'], ['upswing', 'smash']], leap: [['stomp']],
};

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

// ---------------------------------------------------------------- state
const P = {}, B = {};
let waves = [], parts = [];
const trails = { p: [], b: [] };
let clock = 0, hitStop = 0, shakeMag = 0, timeScale = 1, slowT = 0;
let ended = null, endTimer = null, camX = 0, mode = 'menu';
let waveGroup = 0;
const TMP = {}, TMPB = {};

function reset() {
  Object.assign(P, {
    x: 480, y: 0, vx: 0, vy: 0, jvx: 0, face: 1,
    maxHp: T.p.hp, hp: T.p.hp, hpGhost: T.p.hp, ghostT: 0, st: T.p.st, stDelay: 0,
    flasks: T.p.flasks, state: 'loco', def: null, t: 0, start: null, pose: copyPose(PB, {}),
    moveBlend: 0, walkP: 0, flash: 0, charge: 0, holdT: 0, hitMask: 0, swingId: 0,
    blockPressAt: -9, counterUntil: -9, critX0: 0, critX1: 0,
  });
  Object.assign(B, {
    x: 1000, y: 0, vx: 0, face: -1, maxHp: T.b.hp, hp: T.b.hp, hpGhost: T.b.hp, ghostT: 0,
    poise: T.b.poise, poiseT: 0,
    state: 'loco', def: null, t: 0, start: null, pose: copyPose(BB, {}), moveBlend: 0, walkP: 0,
    flash: 0, wait: 1.6, cd: { leap: 3, stomp: 0, quake: 2 }, last: [], queue: [], phase2: false, pending2: false,
    behindT: 0, hitMask: 0, adaptD: null, leapFrom: 0, leapTo: 0, swingId: 0, punishT: 0, stoppedSwing: -1,
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
const hitstop = t => { hitStop = Math.max(hitStop, t * T.f.hitstop); };
const shake = m => { shakeMag = Math.max(shakeMag, m * T.f.shake); };
function addTrail(who, id, hA, wt) {
  trails[who].push({ id, hx: hA[0], hy: hA[1], tx: wt[0], ty: wt[1], age: 0 });
}

// ---------------------------------------------------------------- player logic
function pInvuln() {
  const d = P.def;
  if (!d || !d.inv) return false;
  const inv = d.inv === 'roll' ? [0.03, 0.03 + T.p.rollInv] : d.inv;
  return P.t >= inv[0] && P.t <= inv[1];
}
function pArmor() {
  if (P.state === 'heavyCharge') return true;
  const d = P.def;
  return !!(d && d.armor && P.t >= d.armor[0] && P.t <= d.armor[1]);
}
const grounded = () => P.y >= -0.5;
const blocking = () => !!(P.def && P.def.guard);
const counterOpen = () => clock < P.counterUntil;
function spend(c) { P.st = Math.max(0, P.st - c); if (P.st <= 0) P.stDelay = T.p.stDelayEmpty; }
function faceBoss() { if (B.state !== 'dead' && Math.abs(B.x - P.x) > 8) P.face = Math.sign(B.x - P.x); }
function clampP() { P.x = clamp(P.x, T.arenaL + 12, T.arenaR - 12); }
function pBegin(name, def) {
  const d = def || PA[name];
  P.state = name; P.def = d; P.t = 0; P.start = copyPose(P.pose, {}); P.hitMask = 0; P.swingId++;
  if (d.cost) spend(T.p[d.cost]);
}
function pStrike(charge) {
  P.charge = charge;
  pBegin('heavyStrike');
  if (charge >= 1) { sCharge(P.x); P.flash = 0; }
}
function toLoco() {
  const d = P.def;
  if (d && d.regenAt != null && d.regenAt > d.an.dur && d.regenAt < 50) P.stDelay = Math.max(P.stDelay, d.regenAt - d.an.dur);
  P.state = 'loco'; P.def = null; P.moveBlend = 0; P.sLean.x = P.sLean.v = 0;
  if (!inDir()) faceBoss();
}
function canCrit() {
  if (!(B.def && B.def.critable) || B.y < -1 || !grounded()) return false;
  const rel = (P.x - B.x) * B.face;   // positive: you are in front of the boss
  return rel > 30 && rel < 170;
}
function startCrit() {
  P.face = -B.face;
  pBegin('crit');
  P.critX0 = P.x; P.critX1 = B.x + B.face * 92;
  B.queue = [];
  bBegin('critHit');
}
function startJump() {
  spend(T.p.costJump);
  const dir = inDir();
  if (dir) P.face = dir;
  P.jvx = dir ? dir * T.p.run * 0.9 : P.vx * 0.5;
  P.vx = 0;
  P.vy = -Math.sqrt(2 * G_JUMP * T.p.jumpH);
  pBegin('jump');
  sJump(P.x);
}
function startJumpAtk(heavy) {
  const y0 = P.y, vy0 = P.vy;
  const tNat = (-vy0 + Math.sqrt(Math.max(0, vy0 * vy0 - 2 * G_JUMP * y0))) / G_JUMP;
  const Tl = Math.max(tNat, heavy ? 0.36 : 0.28);
  const d = heavy ? makeJumpHeavy(Tl) : makeJumpLight(Tl);
  d.jumpAtk = { y0, vy0, g: 2 * (-y0 - vy0 * Tl) / (Tl * Tl), T: Tl };
  faceBoss();
  pBegin(heavy ? 'jumpH' : 'jumpL', d);
}
function bossNoticeHeal() {
  if (B.state === 'loco' && Math.abs(P.x - B.x) < 470 && Math.random() < T.b.healPunish) B.punishT = rand(0.1, 0.2);
}

// Start a player-chosen action. Returns false if it can't happen right now.
function pDo(a) {
  if (a === 'heal') {
    if (P.flasks <= 0 || !grounded()) return false;
    faceBoss(); P.vx *= 0.2; pBegin('heal'); bossNoticeHeal();
    return true;
  }
  if (a === 'block') {
    if (!grounded() || P.st <= 0 || blocking()) return false;
    faceBoss(); P.vx = 0; pBegin('block');
    return true;
  }
  if (P.st < 1) return false;
  if (a === 'roll') {
    const dir = inDir();
    if (!dir) { faceBoss(); P.vx = 0; pBegin('backstep'); sRoll(P.x); return true; }
    P.face = dir; P.vx = 0; pBegin('roll'); sRoll(P.x);
    return true;
  }
  if (a === 'jump') { if (!grounded()) return false; startJump(); return true; }
  if (a === 'light') {
    if (canCrit()) { startCrit(); return true; }
    if (P.state === 'roll' && P.t >= PA.roll.rollAtkFrom) { faceBoss(); pBegin('rollAtk'); return true; }
    const chain = P.def && P.def.next && P.t >= P.def.chainAt;
    const next = chain ? P.def.next : 'light1';
    faceBoss(); P.vx *= 0.2;
    pBegin(next);
    return true;
  }
  if (a === 'heavy') {
    if (counterOpen()) { faceBoss(); P.vx = 0; pBegin('gCounter'); return true; }
    faceBoss(); P.vx *= 0.2; P.charge = 0; pBegin('heavyWind');
    return true;
  }
  return false;
}

function playerLoco(dt) {
  const v = P.vx * P.face, S = 20, sf = 0.4;
  P.moveBlend = approach(P.moveBlend, clamp(Math.abs(P.vx) / T.p.run, 0, 1), dt * 7);
  const before = Math.floor(P.walkP * 2);
  P.walkP += v * dt / (2 * S / sf);
  if (Math.floor(P.walkP * 2) !== before && P.moveBlend > 0.5) sStep(P.x, 0.22);
  const m = P.moveBlend, p = P.pose;
  for (const k of KEYS) p[k] = lerp(PB[k], RUN[k], m);
  const g1 = gait(P.walkP, S, 12, sf), g2 = gait(P.walkP + 0.5, S, 12, sf), q = P.walkP * 4 * Math.PI;
  p.f1x = lerp(PB.f1x, 4 + g1[0], m); p.f1y = -g1[1] * m;
  p.f2x = lerp(PB.f2x, -2 + g2[0], m); p.f2y = -g2[1] * m;
  p.hy += (0.5 + 0.5 * Math.cos(q - 0.8 * Math.PI)) * 3 * m + Math.sin(clock * 2.4) * 0.8 * (1 - m);
  p.ay += Math.sin(clock * 2.4 + 0.6) * 0.7 * (1 - m) + Math.sin(q) * 2 * m;
  p.w += Math.sin(q) * 3 * m;
}
function chargePose() {
  const k = PA.heavyWind.an.ks;
  copyPose(k[k.length - 1].p, P.pose);
  const c = clamp(P.holdT / (T.p.chargeTime / T.f.atkSpeed), 0, 1), p = P.pose;
  p.lean -= 3 * c; p.hy += 2.5 * c; p.head -= 4 * c;
  p.ax += Math.sin(clock * 47) * 0.6 * c;
  p.ay += Math.sin(clock * 39) * 0.6 * c;
  p.w += Math.sin(clock * 31) * 1.6 * c;
}
function pEvent(ev) {
  if (ev === 'heal' && P.flasks > 0) {
    P.flasks--;
    P.hp = Math.min(P.maxHp, P.hp + T.p.flaskHeal);
    P.hpGhost = P.hp;
    sHeal();
    for (let i = 0; i < 16; i++) {
      parts.push({ k: 'h', x: P.x + rand(-16, 16), y: rand(-86, -8), vx: rand(-10, 10), vy: rand(-80, -30), life: rand(0.5, 0.9), max: 0.9 });
    }
  } else if (ev === 'pImpact') {
    dust(P.S.wt[0], 6 + Math.round(8 * P.charge), 20);
    shake(2 + 4 * P.charge);
    sStep(P.S.wt[0], 0.8);
  } else if (ev === 'land') {
    dust(P.x, 5, 14); sStep(P.x, 0.4);
  } else if (ev === 'crit1' || ev === 'crit2') {
    const first = ev === 'crit1';
    damageBoss(T.p.dmgCrit * (first ? 0.6 : 0.4), 0, P.S.wt[0], P.S.wt[1], first ? 'crit' : 'heavy');
  }
}
function pHits(d, t0, t1) {
  for (let i = 0; i < d.hits.length; i++) {
    const h = d.hits[i];
    if ((P.hitMask & (1 << i)) || t1 < h.t0 || t0 > h.t1) continue;
    for (let j = 1; j <= 3; j++) {
      const tt = lerp(t0, t1, j / 3);
      if (tt < h.t0 || tt > h.t1) continue;
      let y = P.y;
      if (d.jumpAtk) { const J = d.jumpAtk; y = tt < J.T ? Math.min(0, J.y0 + J.vy0 * tt + 0.5 * J.g * tt * tt) : 0; }
      const S = solve(PR, sample(d.an, tt, P.start, TMP), P.x, y, P.face);
      addTrail('p', P.swingId, S.hA, S.wt);
      if (B.state === 'dead') continue;
      const hit = hitTest(S.hA, S.wt, 3, B.caps);
      if (hit) {
        P.hitMask |= 1 << i;
        const [dmg, poise, kind] = HIT[h.k]();
        damageBoss(dmg, poise, hit[1], hit[2], kind);
        break;
      }
    }
  }
}
const actSpeed = d => (d.spd === 'atk' ? T.f.atkSpeed : d.spd === 'roll' ? T.f.rollSpeed : 1);

function updatePlayer(dt) {
  if (P.flash > 0) P.flash -= dt;
  const d0 = P.def;
  const noRegen = d0 && (d0.regenAt != null ? P.t < d0.regenAt : (d0.atk || d0.roll));
  if (P.stDelay > 0) P.stDelay -= dt;
  else if (!noRegen && P.state !== 'dead' && P.state !== 'heavyCharge') {
    const k = blocking() ? T.p.guardRegen : 1;
    P.st = Math.min(T.p.st, P.st + T.p.stRegen * k * dt);
  }

  if (P.state === 'loco') {
    const dir = inDir();
    if (dir) P.face = dir; else faceBoss();
    P.vx = approach(P.vx, dir * T.p.run, T.p.accel * dt);
    P.x += P.vx * dt; P.y = 0;
    clampP();
    playerLoco(dt);
    const b = buffered();
    if (b && pDo(b)) input.buffer = null;
  } else if (P.state === 'heavyCharge') {
    P.holdT += dt;
    P.charge = 0;
    chargePose();
    P.vx *= Math.exp(-8 * dt); P.x += P.vx * dt; clampP();
    if (P.holdT >= T.p.chargeTime / T.f.atkSpeed) pStrike(1);
    else if (!heavyHeld()) pStrike(0);
  } else if (P.state === 'jump') playerJump(dt);
  else playerAction(dt);
  const fm = P.state === 'loco' ? 'gait'
    : (P.state === 'roll' || P.state === 'down' || P.state === 'dead' || P.y < -1) ? 'free' : 'lock';
  P.S = solve(PR, finalize(P, PC, dt, fm), P.x, P.y, P.face);
}
function playerJump(dt) {
  P.t += dt;
  P.vy += G_JUMP * dt;
  P.y += P.vy * dt;
  P.x += P.jvx * dt;
  clampP();
  sample(P.def.an, P.t, P.start, P.pose);
  if (P.y >= 0 && P.vy > 0) { P.y = 0; dust(P.x, 4, 12); sStep(P.x, 0.35); pBegin('land'); return; }
  const b = buffered();
  if ((b === 'light' || b === 'heavy') && P.t > 0.04) { input.buffer = null; startJumpAtk(b === 'heavy'); }
}
function playerAction(dt) {
  const d = P.def, name = P.state, t0 = P.t;
  P.t += dt * actSpeed(d);
  const t1 = P.t;
  P.vx *= Math.exp(-6.5 * dt);
  let mx = P.vx * dt + P.face * rootMove(d, t0, t1, null);
  if (d.jumpAtk && t1 < d.jumpAtk.T) mx += P.jvx * dt;
  P.x += mx;
  if (name === 'crit') P.x = lerp(P.critX0, P.critX1, EASE.out(clamp(t1 / 0.15, 0, 1)));
  clampP();
  if (d.air) {
    const u = clamp((t1 - d.air[0]) / (d.air[1] - d.air[0]), 0, 1);
    P.y = -4 * d.air[2] * u * (1 - u);
  } else if (d.jumpAtk) {
    const J = d.jumpAtk;
    P.y = t1 < J.T ? Math.min(0, J.y0 + J.vy0 * t1 + 0.5 * J.g * t1 * t1) : 0;
  } else P.y = 0;
  if (d.guard) faceBoss();
  sample(d.an, t1, P.start, P.pose);
  P.S = solve(PR, P.pose, P.x, P.y, P.face);
  if (d.hits) for (const h of d.hits) {
    const w = h.t0 - 0.08;
    if (t0 < w && t1 >= w) sWhoosh(P.x, h.k !== 'L1' && h.k !== 'L2' && h.k !== 'RA' && h.k !== 'JL');
  }
  if (d.pay && t0 < d.pay[0] && t1 >= d.pay[0]) spend(PAY[d.pay[1]]());
  if (d.events) for (const e of d.events) if (t0 < e.t && t1 >= e.t) pEvent(e.ev);
  if (d.hits) pHits(d, t0, t1);
  if (P.state !== name || name === 'dead') return;
  if (name === 'heavyWind' && t1 >= d.an.dur) {
    if (heavyHeld()) { P.state = 'heavyCharge'; P.holdT = 0; } else pStrike(0);
    return;
  }
  if (name === 'block' && !input.blockHeld && t1 >= 0.25) { pBegin('unblock'); return; }
  if ((name === 'blockHit' || name === 'parry') && t1 >= d.an.dur) {
    if (input.blockHeld && P.st > 0) pBegin('block'); else toLoco();
    return;
  }
  const late = name === 'heavyStrike' && P.charge >= 1 ? 0.13 : 0;
  const b = buffered();
  if (b) {
    let ok = false;
    if ((b === 'light' || b === 'heavy') && d.next && t1 >= d.chainAt) ok = pDo(b);
    else if (b === 'light' && name === 'roll' && t1 >= d.rollAtkFrom) ok = pDo(b);
    else if (b === 'heavy' && counterOpen() && (d.guard || name === 'unblock')) ok = pDo(b);
    else if (b === 'roll' && d.rollAt != null && t1 >= d.rollAt + late) ok = pDo('roll');
    else if (d.act != null && t1 >= d.act + late) ok = pDo(b);
    if (ok) { input.buffer = null; return; }
  }
  if (t1 >= d.an.dur && d.an.dur < 900) toLoco();
}

// What happens when a boss attack reaches the player. opt: { parry, guard }
function hurtPlayer(dmg, knock, fromX, opt) {
  opt = opt || {};
  if (P.state === 'dead' || pInvuln() || ended || endTimer) return 'miss';
  const src = opt.src != null ? opt.src : fromX;   // where the attack came from (a wave's boss, not its centre)
  const dir = Math.sign(P.x - src) || -P.face;
  const front = Math.abs(src - P.x) < 20 || Math.sign(src - P.x) === P.face;
  if (knock === 'push') {
    if (!pArmor() && !blocking()) pBegin('flinch');
    P.vx = dir * 420;
    return 'push';
  }
  input.buffer = null;
  const mid = [lerp(P.S.hA[0], P.S.wt[0], 0.4), lerp(P.S.hA[1], P.S.wt[1], 0.4)];
  if (blocking() && front) {
    if (opt.parry && now() - P.blockPressAt <= T.p.parryWin) {
      P.blockPressAt = -9;
      pBegin('parry');
      B.queue = [];
      bBegin('reel');
      hitstop(0.16); shake(7);
      sparks(mid[0], mid[1], -dir, 22, C.parry);
      sParry(P.x);
      return 'parry';
    }
    P.hp = Math.max(0, P.hp - dmg * T.f.bossDmg * T.p.blockTaken);
    P.st -= (opt.guard || 30) * T.p.blockSt;
    P.counterUntil = clock + 0.8;
    sparks(mid[0], mid[1], -dir, 10, C.spark);
    sClang(P.x);
    hitstop(0.06); shake(4);
    if (P.hp <= 0) { die(dir); return 'block'; }
    if (P.st < 0) { P.st = 0; P.stDelay = T.p.stDelayEmpty; pBegin('guardBreak'); P.vx = dir * 260; sHurt(P.x); }
    else { pBegin('blockHit'); P.vx = dir * 150; }
    return 'block';
  }
  P.hp = Math.max(0, P.hp - dmg * T.f.bossDmg);
  P.flash = 0.18; P.ghostT = 0.7;
  hitstop(knock === 'down' ? 0.12 : 0.08);
  shake(knock === 'down' ? 14 : 8);
  sparks(P.S.hip[0], P.S.hip[1] - 22, dir, 10, C.blood);
  sHurt(P.x);
  if (P.hp <= 0) { die(dir); return 'hit'; }
  if (knock === 'down') { pBegin('down'); P.vx = dir * 340; }
  else if (!pArmor()) { pBegin('flinch'); P.vx = dir * 250; }
  return 'hit';
}
function die(dir) {
  pBegin('dead'); P.vx = dir * 320; P.flash = 0.18;
  slowT = 1.4; endIn('lose', 2.0); sDeath();
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
const maxPoise = () => T.b.poise * (B.phase2 ? 1.2 : 1);
const bSpeed = () => (B.phase2 ? T.b.speed2 : 1) * T.f.bossSpeed;
// the last attack of a string keeps at least 1.2 real seconds of recovery after its hit
function withFinisher(d) {
  const ends = [];
  if (d.hits) for (const h of d.hits) ends.push(h.t1);
  if (d.events) for (const e of d.events) ends.push(e.t);
  const lastHit = ends.length ? Math.max(...ends) : 0;
  const extra = 1.2 * bSpeed() - (d.act - lastHit);
  return extra > 0.01 ? shifted(d, lastHit + 0.02, extra) : d;
}
function bBegin(name, finisher) {
  let d = BA[name];
  if (finisher) d = withFinisher(d);
  B.state = name; B.def = d; B.t = 0; B.start = copyPose(B.pose, {}); B.hitMask = 0;
  B.adaptD = null; B.vx = 0; B.swingId++; B.leapTo = B.x; B.punishT = 0;
  if (name === 'stagger' || name === 'dead' || name === 'reel' || name === 'critHit') B.queue = [];
  if (name === 'leap') B.cd.leap = T.b.cdLeap;
  if (name === 'stomp') B.cd.stomp = T.b.cdStomp;
  if (name === 'quake') B.cd.quake = T.b.cdQuake;
  if (d.atk) { B.last.unshift(name.replace(/D$/, '')); B.last.length = Math.min(B.last.length, 3); }
}
function bLoco() {
  B.state = 'loco'; B.def = null; B.moveBlend = 0; B.sLean.x = B.sLean.v = 0;
  B.wait = (B.phase2 ? rand(0.25, 0.7) : rand(0.5, 1.1)) * T.f.bossPause;
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
  if (B.phase2 && d < 360 && B.cd.quake <= 0) add('quake', 2);
  if (!o.length) { B.wait = 0.25; return; }
  const n = pick(o);
  const pool = (B.phase2 ? STRINGS2 : STRINGS1)[n];
  B.queue = pool && Math.random() < (B.phase2 ? 0.6 : 0.3) ? pool[Math.floor(Math.random() * pool.length)].slice() : [];
  let start = n;
  if (n === 'smash' && Math.random() < (B.phase2 ? 0.6 : 0.45)) start = 'smashD';
  if (n === 'thrust' && Math.random() < (B.phase2 ? 0.45 : 0.3)) start = 'thrustD';
  bBegin(start, false);
}
// punish a heal started within reach
function bossPunish() {
  const dx = P.x - B.x, d = Math.abs(dx);
  if (dx * B.face < 0) { bBegin('turn'); return; }
  B.queue = [];
  if (d < 175) bBegin('upswing');
  else if (d < 470) bBegin('thrust');
  else if (B.cd.leap <= 0) bBegin('leap');
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
  const stopped = B.stoppedSwing === B.swingId;   // the club was blocked: its impact wave can't hurt
  if (ev === 'smash') { addWave(S.wt[0], 85, 10, 'small', { src: B.x, harmless: stopped }); shake(10); dust(S.wt[0], 14, 30); sImpact(S.wt[0], 1); }
  else if (ev === 'leap') { const x = B.x + B.face * 70; addWave(x, 210, 14, 'small', { src: B.x, harmless: stopped }); shake(16); dust(x, 26, 90); sQuake(x); }
  else if (ev === 'stomp') { addWave(S.f1[0], 140, 12, 'small', { src: B.x }); shake(9); dust(S.f1[0], 16, 40); sQuake(S.f1[0]); }
  else if (ev === 'roar') { addWave(B.x, 320, 0, 'push', { ring: S.hd }); shake(12); sRoar(B.x); }
  else if (ev === 'flip') { if ((P.x - B.x) * B.face < 0) B.face *= -1; }
  else if (ev.startsWith('quake')) {
    const i = +ev.slice(5), r0 = [0, 130, 240][i - 1], r1 = [140, 250, 370][i - 1];
    if (i === 1) waveGroup++;
    addWave(B.x, r1, 14, 'small', { r0, group: waveGroup, src: B.x });
    shake(8 + 3 * i); sQuake(B.x);
    dust(B.x - r1 + 20, 8, 20); dust(B.x + r1 - 20, 8, 20);
  }
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
      if (hitTest(S.hA, S.wt, 9, playerCaps())) {
        B.hitMask |= 1 << i;
        const res = hurtPlayer(h.dmg, h.knock, B.x, { parry: true, guard: h.guard });
        if (res === 'block' || res === 'parry') B.stoppedSwing = B.swingId;
        break;
      }
    }
    if (B.def !== d) return;   // parried mid-swing
  }
}
function damageBoss(dmg, poise, x, y, kind) {
  if (B.state === 'dead') return;
  const mult = B.state === 'stagger' ? T.b.staggerMult : 1;
  B.hp = Math.max(0, B.hp - dmg * mult);
  B.flash = kind === 'crit' ? 0.2 : 0.09; B.ghostT = 0.8; B.poiseT = 0;
  if (kind === 'crit') {
    hitstop(0.18); shake(12); sparks(x, y, P.face, 26, C.crit); sCrit(x);
  } else {
    const heavy = kind !== 'light';
    hitstop(kind === 'charged' ? 0.12 : heavy ? 0.09 : 0.075);
    shake(kind === 'charged' ? 8 : heavy ? 5 : 2.5);
    sparks(x, y, P.face, heavy ? 15 : 9, C.spark);
    sImpact(x, kind === 'charged' ? 1 : heavy ? 0.6 : 0.25);
  }
  if (B.hp <= 0) { bBegin('dead'); waves = []; slowT = 1.4; endIn('win', 2.8); sVictory(); return; }
  if (!(B.def && B.def.noPoise)) B.poise -= poise * T.f.poiseMult;
  if (!B.phase2 && B.hp <= B.maxHp * T.b.phase2At) B.pending2 = true;
}
function bossLoco(dt) {
  const v = B.vx * B.face, S = 30;
  B.moveBlend = approach(B.moveBlend, clamp(Math.abs(B.vx) / 80, 0, 1), dt * 4);
  const before = Math.floor(B.walkP * 2);
  B.walkP += v * dt / (4 * S);
  if (Math.floor(B.walkP * 2) !== before && B.moveBlend > 0.4) sStep(B.x, 0.8);
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
  B.cd.leap -= dt; B.cd.stomp -= dt; B.cd.quake -= dt;
  B.poiseT += dt;
  if (B.poiseT > T.b.poiseDelay && !(B.def && B.def.noPoise)) B.poise = Math.min(maxPoise(), B.poise + T.b.poiseRegen * dt);
  if (B.poise <= 0 && B.state !== 'dead' && B.y >= -0.5 && !(B.def && B.def.noPoise)) {
    bBegin('stagger'); shake(6); sImpact(B.x, 1);
  }

  if (B.state === 'loco') {
    const dx = P.x - B.x, d = Math.abs(dx), front = dx * B.face > 0;
    let want = 0;
    if (P.state !== 'dead' && !ended) {
      if (B.punishT > 0) { B.punishT -= dt; if (B.punishT <= 0) bossPunish(); }
      if (B.state === 'loco') {
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
    B.t += dt * bSpeed();
    const t1 = B.t, name = B.state;
    // keep turning to face the player until the commit point
    if (d.commit != null && t1 < d.commit && (P.x - B.x) * B.face < -40 && B.y >= -1 && P.state !== 'dead') B.face *= -1;
    if (d.commit != null && t0 < d.commit && t1 >= d.commit) bossTrack(d);
    B.x += B.face * rootMove(d, t0, t1, B.adaptD);
    if (d.leap) leapMotion(d.leap, t0, t1);
    else if (B.y < 0) B.y = Math.min(0, B.y + 700 * dt);
    sample(d.an, t1, B.start, B.pose);
    B.S = solve(BR, B.pose, B.x, B.y, B.face);
    if (d.hits) for (const h of d.hits) {
      const w = h.t0 - 0.1;
      if (t0 < w && t1 >= w) sWhoosh(B.x, true);
    }
    if (d.events) for (const e of d.events) if (t0 < e.t && t1 >= e.t) bEvent(e.ev);
    if (d.hits && B.state === name) bHits(d, t0, t1);
    if (B.state === name && name !== 'dead') {
      if (B.queue.length && d.cancel != null && t1 >= d.cancel && P.state !== 'dead') {
        const n = B.queue.shift();
        B.face = Math.sign(P.x - B.x) || B.face;
        bBegin(n, B.queue.length === 0);
      } else if (t1 >= d.an.dur) {
        if (name === 'stagger' || name === 'critHit' || name === 'reel') B.poise = maxPoise();
        bLoco();
      }
    }
  }
  B.x = clamp(B.x, T.arenaL + 70, T.arenaR - 70);
  const fm = B.state === 'loco' ? 'gait' : (B.state === 'dead' || B.y < -1) ? 'free' : 'lock';
  B.S = solve(BR, finalize(B, BC, dt, fm), B.x, B.y, B.face);
  B.caps = bossCaps(B.S);
}

// ---------------------------------------------------------------- shockwaves + particles
function addWave(x, r, dmg, knock, o) {
  o = o || {};
  waves.push({ x, r, r0: o.r0 || 0, dmg, knock, t: 0, hit: !!o.harmless, group: o.group || 0, src: o.src != null ? o.src : x,
    ring: o.ring ? [o.ring[0], o.ring[1]] : null });
}
function updateWaves(dt) {
  for (const w of waves) {
    w.t += dt;
    if (!w.hit && w.t <= 0.14) {
      const k = Math.min(1, w.t / 0.14);
      const reach = w.r0 ? lerp(w.r0, w.r, k) : w.r * (0.35 + 0.65 * k);
      const dist = Math.abs(P.x - w.x);
      const groupHit = w.group && waves.some(o => o !== w && o.group === w.group && o.hit);
      const onGround = P.y > -12 || w.knock === 'push';
      if (!groupHit && dist <= reach && dist >= w.r0 - 12 && onGround && P.state !== 'dead' && !pInvuln()) {
        w.hit = true;
        hurtPlayer(w.dmg, w.knock, w.x, { guard: 25, src: w.src });
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
  const Tp = Math.max(14, safe.t + 10), L0 = Math.max(16, safe.l + 12);
  const A = btn('light'); A.r = R * 1.2; A.x = W - mR - A.r; A.y = H - mB - A.r;
  const Ro = btn('roll'); Ro.r = R; Ro.x = A.x - A.r - Ro.r - R * 0.35; Ro.y = H - mB - Ro.r;
  const J = btn('jump'); J.r = R * 0.95; J.x = A.x - R * 0.1; J.y = A.y - A.r - J.r - R * 0.35;
  const Bk = btn('block'); Bk.r = R * 0.95; Bk.x = Ro.x - R * 0.1; Bk.y = Ro.y - Ro.r - Bk.r - R * 0.45;
  const He = btn('heal'); He.r = R * 0.72; He.x = L0 + He.r; He.y = Tp + 48 + He.r;
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
  const hot = P.state === 'heavyCharge' ? clamp(P.holdT / (T.p.chargeTime / T.f.atkSpeed), 0, 1) : 0;
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
  const hx = S.hA[0], hy = S.hA[1], tx = S.wt[0], ty = S.wt[1];
  const L = Math.hypot(tx - hx, ty - hy) || 1, ux = (tx - hx) / L, uy = (ty - hy) / L;
  g.strokeStyle = C.club;
  g.lineWidth = 7; path([[hx - ux * 14, hy - uy * 14], [tx - ux * 40, ty - uy * 40]]);
  g.lineWidth = 17; path([[tx - ux * 44, ty - uy * 44], [tx - ux * 7, ty - uy * 7]]);
  g.strokeStyle = col; g.lineWidth = BR.line;
  path([S.sh, S.eA, S.hA]);
  // critical hit available: a pulsing mark on the boss's chest
  if (mode === 'play' && canCrit() && (P.state === 'loco' || (P.def && P.t >= (P.def.act || 0)))) {
    const cx = lerp(S.hip[0], S.sh[0], 0.6), cy = lerp(S.hip[1], S.sh[1], 0.6), k = 0.5 + 0.5 * Math.sin(clock * 10);
    g.strokeStyle = C.crit; g.lineWidth = 3; g.globalAlpha = 0.6 + 0.4 * k;
    g.beginPath();
    g.moveTo(cx, cy - 12 - 4 * k); g.lineTo(cx + 9 + 3 * k, cy); g.lineTo(cx, cy + 12 + 4 * k); g.lineTo(cx - 9 - 3 * k, cy);
    g.closePath(); g.stroke();
    g.globalAlpha = 1;
  }
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
  for (const w of waves) {
    const u = clamp(w.t / 0.45, 0, 1);
    if (w.ring) {
      g.strokeStyle = C.ui; g.globalAlpha = (1 - u) * 0.55; g.lineWidth = 4 * (1 - u) + 1;
      g.beginPath(); g.arc(w.ring[0], w.ring[1], lerp(24, w.r, EASE.out(u)), 0, Math.PI * 2); g.stroke();
    } else {
      const k = EASE.out(Math.min(1, w.t / 0.2));
      const reach = w.r0 ? lerp(w.r0, w.r, k) : w.r * k;
      g.strokeStyle = C.ground; g.globalAlpha = (1 - u) * 0.85; g.lineWidth = 3;
      const hgt = w.r0 ? 26 : 18;
      for (const s of [-1, 1]) {
        const x = w.x + s * reach;
        g.beginPath();
        g.moveTo(x - s * 28, 0);
        g.quadraticCurveTo(x - s * 8, -hgt * (1 - u) - 4, x, 0);
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
  bar(L, Tp, bw, 9, P.hp / P.maxHp, P.hpGhost / P.maxHp, C.hp);
  bar(L, Tp + 16, bw * 0.82, 6, P.st / T.p.st, null, C.st);
  for (let i = 0; i < Math.max(T.p.flasks, P.flasks); i++) {
    const x = L + i * 15, y = Tp + 30;
    g.beginPath();
    g.moveTo(x + 4, y); g.lineTo(x + 8, y + 6); g.lineTo(x + 4, y + 12); g.lineTo(x, y + 6); g.closePath();
    if (i < P.flasks) { g.fillStyle = C.flask; g.fill(); }
    else { g.strokeStyle = 'rgba(217,164,65,0.45)'; g.lineWidth = 1; g.stroke(); }
  }
  const bbw = Math.min(W * 0.46, 560), bx = (W - bbw) / 2;
  const by = H - Math.max(18, safe.b + 14) - 8;
  g.font = `${Math.round(clamp(W * 0.02, 14, 19))}px ${FONT_D}`;
  g.fillStyle = C.ui; g.textBaseline = 'bottom'; g.textAlign = 'left';
  g.fillText(BOSS_NAME, bx, by - 6);
  bar(bx, by, bbw, 8, B.hp / B.maxHp, B.hpGhost / B.maxHp, C.bossHp);
  if (!touchUI) {
    g.font = `500 12px ${FONT_UI}`; g.textAlign = 'right'; g.textBaseline = 'top';
    g.fillStyle = 'rgba(233,230,223,0.5)';
    const r = W - Math.max(16, safe.r + 12);
    ['A / D   run', 'J   attack  (hold: heavy, keep holding: charge)', 'K   heavy', 'Space   roll  (no direction: backstep)',
      'W   jump', 'Shift   block  (press as the hit lands: parry)', 'E   heal', 'Esc   pause']
      .forEach((s, i) => g.fillText(s, r, Tp + 56 + i * 17));
    g.textAlign = 'left';
  }
  if (touchUI && portrait) {
    g.font = `600 14px ${FONT_UI}`; g.textAlign = 'center'; g.textBaseline = 'top';
    g.fillStyle = 'rgba(233,230,223,0.8)';
    g.fillText('Turn your phone sideways to play', W / 2, Tp + 60);
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
    if (b.act === 'light' && input.atk.down) {   // hold progress towards a heavy
      const k = input.atk.heavy ? 1 : clamp((now() - input.atk.at) / T.p.holdTime, 0, 1);
      g.beginPath(); g.arc(b.x, b.y, b.r - 3, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2);
      g.strokeStyle = input.atk.heavy ? C.bladeHot : 'rgba(233,230,223,0.7)'; g.lineWidth = 4; g.stroke();
    }
    g.fillStyle = 'rgba(233,230,223,0.88)';
    g.font = `700 ${Math.round(clamp(b.r * 0.3, 10, 14))}px ${FONT_UI}`;
    const label = b.act === 'heal' ? `HEAL ${P.flasks}` : b.label;
    g.fillText(label, b.x, b.sub ? b.y - 6 : b.y);
    if (b.sub) {
      g.font = `500 ${Math.round(clamp(b.r * 0.2, 9, 11))}px ${FONT_UI}`;
      g.fillStyle = 'rgba(233,230,223,0.6)';
      g.fillText(b.sub, b.x, b.y + 10);
    }
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
  if (mode !== 'menu') {
    drawHUD();
    if (mode === 'play') drawControls();
    drawOverlay();
  }
}

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
  mp.append(el('h1', null, 'Stick Souls'), el('p', 'tag', 'One boss. One greatsword.'));
  const bStart = el('button', 'primary', 'Start'); bStart.type = 'button'; bStart.id = 'ss-start';
  const bSet = el('button', null, 'Settings'); bSet.type = 'button'; bSet.id = 'ss-settings';
  mp.append(bStart, bSet);
  main.appendChild(mp);

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

  root.append(main, pause, settings, pauseBtn);

  let settingsFrom = 'main';
  const openSettings = from => { settingsFrom = from; main.hidden = true; pause.hidden = true; settings.hidden = false; refreshSliders(); setStatus(); bBack.focus(); };
  const closeSettings = () => { settings.hidden = true; (settingsFrom === 'main' ? main : pause).hidden = false; };
  const click = (b, fn) => b.addEventListener('click', () => { audioInit(); sUI(); fn(); });
  click(bStart, () => startGame());
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
  return { root, main, pause, settings, pauseBtn, status, rows, bStart };
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
function startGame() { reset(); mode = 'play'; ui.main.hidden = true; ui.pauseBtn.hidden = false; try { cvs.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }
function pauseGame() { if (mode !== 'play') return; mode = 'pause'; releaseAll(); ui.pause.hidden = false; ui.pauseBtn.hidden = true; }
function resumeGame() { mode = 'play'; releaseAll(); ui.pause.hidden = true; ui.settings.hidden = true; ui.pauseBtn.hidden = false; try { cvs.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }
function toMenu() { mode = 'menu'; releaseAll(); reset(); ui.pause.hidden = true; ui.settings.hidden = true; ui.main.hidden = false; ui.pauseBtn.hidden = true; }

// ---------------------------------------------------------------- main loop
let last = performance.now(), acc = 0;
function frame(t) {
  const rdt = Math.min(0.1, (t - last) / 1000);
  last = t;
  if (mode === 'play') {
    // attack button held long enough becomes a heavy
    if (input.atk.down && !input.atk.heavy && now() - input.atk.at >= T.p.holdTime) { input.atk.heavy = true; press('heavy'); }
    const dt = rdt * T.f.game;
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
    shakeMag = shakeMag > 0.2 ? shakeMag * Math.exp(-11 * dt) : 0;
    if (P.ghostT > 0) P.ghostT -= dt; else P.hpGhost = approach(P.hpGhost, P.hp, 45 * dt);
    if (B.ghostT > 0) B.ghostT -= dt; else B.hpGhost = approach(B.hpGhost, B.hp, 160 * dt);
    if (P.hpGhost < P.hp) P.hpGhost = P.hp;
    if (endTimer) { endTimer.t -= dt; if (endTimer.t <= 0) { ended = { kind: endTimer.kind, t: 0 }; endTimer = null; } }
    if (ended) ended.t += dt;
  } else shakeMag = 0;
  // camera: stays between the fighters, leaning towards the player
  const vw = W / scale, aw = T.arenaR - T.arenaL;
  let target = lerp(P.x, B.x, 0.42);
  target = vw >= aw + 80 ? (T.arenaL + T.arenaR) / 2 : clamp(target, T.arenaL - 40 + vw / 2, T.arenaR + 40 - vw / 2);
  camX += (target - camX) * (1 - Math.exp(-4 * rdt));
  render();
  requestAnimationFrame(frame);
}

loadLocal();
resize();
reset();
refreshSliders();
setStatus();
connectStore();
requestAnimationFrame(frame);

// Handle for automated checks.
window.__duel = { P, B, T, input, press, reset, bBegin, pDo, canCrit, atkDown, atkUp, blockDown, blockUp,
  startGame, pauseGame, resumeGame, toMenu,
  get mode() { return mode; }, get waves() { return waves; }, get ended() { return ended; },
  toScreen: (x, y) => [W / 2 - camX * scale + x * scale, groundY + y * scale] };
})();
