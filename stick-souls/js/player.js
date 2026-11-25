/* Stick Souls — The player: rig, moves and logic.
   Plain scripts loaded in order by index.html; they share top-level names. */
'use strict';

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
