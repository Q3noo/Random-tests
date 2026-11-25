/* Stick Souls — Canvas, maths helpers, keyframe animation, skeleton/IK and the secondary-motion layer.
   Plain scripts loaded in order by index.html; they share top-level names. */
'use strict';

// ---------------------------------------------------------------- canvas
const cvs = document.getElementById('game');
const g = cvs.getContext('2d');
const safeEl = document.getElementById('safe');
const FONT_D = "'IM Fell English SC', Georgia, 'Times New Roman', serif";
const FONT_UI = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
try { document.fonts.load('24px "IM Fell English SC"'); } catch (e) { /* fallback font is fine */ }

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
const KEYS = ['hx', 'hy', 'lean', 'head', 'ax', 'ay', 'bx', 'by', 'w', 'w2', 'th', 'ea', 'eb',
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
  if (R.wlen2) {   // a second weapon in the other hand (dual wielders), angle w2
    const w2 = p.w2 * D2R, vx2 = Math.cos(w2), vy2 = Math.sin(w2);
    pts.wb2 = [Bj[2] - vx2 * R.pommel, Bj[3] - vy2 * R.pommel];
    pts.wt2 = [Bj[2] + vx2 * R.wlen2, Bj[3] + vy2 * R.wlen2];
  }
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
      if (u >= 1) { f.step = null; f.off = 0; if (ch === B) sStep(B.x, BK.stepW); }
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
    spring(ch.sLean, clamp(cfg.leanV * vx * ch.face / Math.max(1, cfg.walk) - 0.0035 * al, -9, 9), cfg.lean[0], cfg.lean[1], dt);
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
