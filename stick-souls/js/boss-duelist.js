/* Stick Souls — The Twinfang Duelist: a fast, human-sized boss with two curved blades.
   Shorter wind-ups (never under ~0.45s real), long strings, a dash that cuts through you,
   an unparryable leaping cross, and a backstep that escapes a near poise break.
   Plain scripts loaded in order by index.html; they share top-level names. */
'use strict';

// ---------------------------------------------------------------- Twinfang Duelist: rig + moves
// about 1.35x the player's height; blade A in the front hand, blade B (reverse grip) in the back hand
const DR = { thigh: 32, shin: 32, spine: 48, neck: 6, headR: 10, upper: 25, fore: 25,
  grip: 0, pommel: 7, wlen: 58, wlen2: 58, pvx: 0, pvy: -40, line: 5 };
const DB = { hx: 0, hy: -56, lean: 14, head: -10, ax: 22, ay: 24, bx: 4, by: 30, w: -25, w2: 150, th: 0, ea: 1, eb: 1,
  f1x: 24, f1y: 0, f2x: -24, f2y: 0, rot: 0, ox: 0, oy: 0 };
const KNEEL_D = { hy: -34, lean: 50, head: 8, ax: 22, ay: 34, w: 70, bx: 26, by: 40, w2: 100, f1x: 28, f1y: 0, f2x: -18, f2y: 0 };
const DC = { get walk() { return T.d.walk; }, leanV: 4, lean: [10, 0.5], head: [24, 0.55], thr: 12, reach: 40, dur: 0.12, lift: 9 };

// commit = moment it stops re-aiming. Times are animation seconds (real = / tempo).
const DA = {
  // quick 2-hit: overhead cut with the front blade, rising cut with the back blade
  twin: {
    an: mk(DB, [
      [0, {}],
      [0.44, { hy: -58, lean: 4, head: -8, ax: 4, ay: -20, w: -150, bx: -8, by: 26, w2: 160, f1x: 26, f2x: -26 }, 'out'],
      [0.56, { hy: -54, lean: 22, ax: 30, ay: 10, w: 20, f1x: 32, f2x: -22 }, 'in'],
      [0.66, { ax: 26, ay: 22, w: 45, bx: -14, by: 26, w2: 175 }, 'out'],
      [0.80, { hy: -52, lean: 18, ax: 18, ay: 26, w: 60, bx: 30, by: -6, w2: -40, f1x: 34, f2x: -18 }, 'in'],
      [0.92, { bx: 26, by: -16, w2: -70 }, 'out'],
      [1.40, BASE, 'io'],
    ]),
    hits: [
      { t0: 0.50, t1: 0.60, w: 'A', dmg: 10, knock: 'small', guard: 18 },
      { t0: 0.70, t1: 0.84, w: 'B', dmg: 10, knock: 'small', guard: 18 },
    ],
    moves: [{ t0: 0.34, t1: 0.82, d: 46, adapt: [60, 0, 90] }],
    commit: 0.40, act: 1.40, cancel: 1.0, atk: true,
  },
  // 4-hit string; the last hit comes late (blades held high), then a long opening
  flurry: {
    an: mk(DB, [
      [0, {}],
      [0.50, { hy: -50, lean: 20, head: -14, ax: 10, ay: 4, w: -120, bx: 8, by: 10, w2: -60, f1x: 28, f2x: -26 }, 'out'],
      [0.58, { ax: 30, ay: 14, w: 25 }, 'in'],
      [0.72, { bx: 30, by: 12, w2: 30, ax: 6, ay: -4, w: -110 }, 'in'],
      [0.86, { ax: 30, ay: 14, w: 25, bx: 6, by: -2, w2: -100 }, 'in'],
      [1.00, { hy: -58, lean: -2, head: -6, ax: 2, ay: -26, w: -100, bx: 0, by: -26, w2: -80, f1x: 26, f2x: -26 }, 'out'],
      [1.42, { lean: -4, ay: -28, by: -28 }, 'lin'],
      [1.56, { hy: -48, lean: 30, head: -18, ax: 32, ay: 18, w: 40, bx: 28, by: 22, w2: 50, f1x: 40, f2x: -22 }, 'in'],
      [1.70, { w: 46, w2: 56 }, 'out'],
      [2.90, BASE, 'io'],
    ]),
    hits: [
      { t0: 0.52, t1: 0.60, w: 'A', dmg: 8, knock: 'small', guard: 14 },
      { t0: 0.66, t1: 0.74, w: 'B', dmg: 8, knock: 'small', guard: 14 },
      { t0: 0.80, t1: 0.88, w: 'A', dmg: 8, knock: 'small', guard: 14 },
      { t0: 1.46, t1: 1.60, w: 'AB', dmg: 14, knock: 'down', guard: 24 },
    ],
    moves: [{ t0: 0.50, t1: 0.90, d: 40 }, { t0: 1.42, t1: 1.58, d: 30 }],
    commit: 0.44, act: 2.90, cancel: 1.9, atk: true,
  },
  // low dash that cuts through you and ends behind you
  dash: {
    an: mk(DB, [
      [0, {}],
      [0.48, { hy: -42, lean: 40, head: -26, ax: -6, ay: 18, w: 170, bx: -16, by: 22, w2: 175, ea: -1, f1x: 30, f2x: -30 }, 'out'],
      [0.58, { hy: -44, lean: 44, ax: 28, ay: 18, w: 5, ea: 1, f1x: 34, f2x: -34 }, 'in'],
      [0.74, { ax: 30, ay: 10, w: -20, bx: 20, by: 20, w2: 30 }, 'out'],
      [1.00, { hy: -48, lean: 20 }, 'out'],
      [1.60, BASE, 'io'],
    ]),
    hits: [{ t0: 0.56, t1: 0.74, w: 'A', dmg: 12, knock: 'small', guard: 20 }],
    moves: [{ t0: 0.50, t1: 0.76, d: 280, e: 'out2', adapt: [-120, 160, 320] }],
    commit: 0.46, act: 1.60, cancel: 1.0, atk: true,
  },
  // both blades drawn back, a fixed long hold, then a lunging double thrust
  thrustD: {
    an: mk(DB, [
      [0, {}],
      [0.45, { hy: -52, lean: -4, head: -6, ax: -18, ay: 6, w: 8, bx: -22, by: 12, w2: 12, ea: -1, eb: -1, f1x: 22, f2x: -36 }, 'out'],
      [1.20, { ax: -20, ay: 7, bx: -24, by: 13, lean: -6 }, 'lin'],
      [1.34, { hy: -46, lean: 34, head: -22, ax: 40, ay: 12, w: 4, bx: 36, by: 16, w2: 8, ea: 1, eb: 1, f1x: 40, f2x: -26 }, 'in'],
      [1.50, { ax: 42, ay: 14 }, 'out'],
      [2.40, BASE, 'io'],
    ]),
    hits: [{ t0: 1.26, t1: 1.46, w: 'AB', dmg: 14, knock: 'down', guard: 26 }],
    moves: [{ t0: 1.22, t1: 1.40, d: 160, e: 'out2', adapt: [90, 30, 220] }],
    commit: 1.12, act: 2.40, cancel: 1.7, atk: true,
  },
  // leaping X-slash: can't be parried (like souls jump attacks); long opening on landing
  aerial: {
    an: mk(DB, [
      [0, {}],
      [0.42, { hy: -40, lean: 30, head: -20, ax: 10, ay: 24, w: 120, bx: 0, by: 26, w2: 140, f1x: 24, f2x: -26 }, 'out'],
      [0.52, { hy: -64, lean: 6, ax: 2, ay: -22, w: -100, bx: -6, by: -20, w2: -80, f1x: 14, f1y: -14, f2x: -10, f2y: -8 }, 'out'],
      [0.84, { hy: -62, lean: -6, ax: -6, ay: -30, w: -120, bx: -10, by: -28, w2: -100, f1x: 14, f1y: -22, f2x: -12, f2y: -16 }, 'out'],
      [1.04, { hy: -44, lean: 34, head: -20, ax: 30, ay: 22, w: 50, bx: 26, by: 26, w2: 60, f1x: 30, f1y: 0, f2x: -24, f2y: 0 }, 'in'],
      [1.12, { w: 56, w2: 66 }, 'out'],
      [2.00, { hy: -46, lean: 30 }, 'lin'],
      [2.45, BASE, 'io'],
    ]),
    hits: [{ t0: 0.90, t1: 1.08, w: 'AB', dmg: 16, knock: 'down', guard: 30, noParry: true }],
    events: [{ t: 1.04, ev: 'land' }],
    leap: { t0: 0.50, t1: 1.04, h: 110, lead: 40 },
    commit: 0.44, act: 2.45, cancel: 1.6, atk: true,
  },
  // hop away: shakes off a player glued to it, or escapes a near poise break
  backstep: {
    an: mk(DB, [
      [0, {}],
      [0.08, { hy: -48, lean: 20 }, 'out'],
      [0.30, { hy: -56, lean: -10, f1x: 18, f1y: -10, f2x: -26, f2y: -6 }, 'out'],
      [0.42, { hy: -52, lean: 10, f1y: 0, f2y: 0 }, 'in'],
      [0.62, BASE, 'io'],
    ]),
    moves: [{ t0: 0.06, t1: 0.40, d: -130, e: 'out2' }],
    act: 0.62, cancel: 0.45,
  },
  // phase 2: blades orbit like a saw while it spins forward through you (3 hits)
  whirl: {
    an: mk(DB, [
      [0, {}],
      [0.50, { hy: -46, lean: 16, head: -10, ax: -10, ay: 20, w: 200, bx: 24, by: 18, w2: 20, f1x: 28, f2x: -28 }, 'out'],
      [0.70, { ax: 28, ay: 14, w: 330, bx: -16, by: 14, w2: 150 }, 'lin'],
      [0.90, { ax: -14, ay: 14, w: 470, bx: 28, by: 14, w2: 290 }, 'lin'],
      [1.10, { ax: 28, ay: 14, w: 610, bx: -16, by: 14, w2: 430 }, 'lin'],
      [1.30, { ax: -14, ay: 14, w: 750, bx: 28, by: 14, w2: 570 }, 'lin'],
      [1.50, { hy: -50, lean: 10, ax: 22, ay: 22, w: 695, bx: 2, by: 30, w2: 510 }, 'out'],
      [2.50, BASE, 'io', { w: 695, w2: 510 }],
    ]),
    hits: [
      { t0: 0.55, t1: 0.72, w: 'AB', dmg: 9, knock: 'small', guard: 16 },
      { t0: 0.86, t1: 1.02, w: 'AB', dmg: 9, knock: 'small', guard: 16 },
      { t0: 1.16, t1: 1.32, w: 'AB', dmg: 9, knock: 'small', guard: 16 },
    ],
    moves: [{ t0: 0.50, t1: 1.35, d: 260, e: 'lin', adapt: [-100, 120, 320] }],
    commit: 0.46, act: 2.50, cancel: 1.7, atk: true,
  },
  turn: {
    an: mk(DB, [[0, {}], [0.10, { hy: -50, lean: 6, f1y: -8 }, 'out'], [0.26, BASE, 'io']]),
    events: [{ t: 0.11, ev: 'flip' }], act: 0.26,
  },
  // phase 2 transition: crosses its blades and flings them wide (pushes you back)
  rally: {
    an: mk(DB, [
      [0, {}],
      [0.35, { hy: -50, lean: 26, head: 6, ax: 10, ay: 10, w: -60, bx: 14, by: 8, w2: -120 }, 'out'],
      [0.60, { hy: -58, lean: -10, head: -30, ax: 30, ay: -26, w: -40, bx: -20, by: -26, w2: -140 }, 'out'],
      [1.10, { lean: -8, head: -28 }, 'lin'],
      [1.40, BASE, 'io'],
    ]),
    events: [{ t: 0.6, ev: 'rally' }], act: 1.4, noPoise: true,
  },
  stagger: {
    an: mk(DB, [[0, {}], [0.16, KNEEL_D, 'out'], [1.9, { hy: -33, lean: 52, head: 10 }, 'lin'], [2.2, BASE, 'io']]),
    act: 2.2, noPoise: true, critable: true,
  },
  reel: {
    an: mk(DB, [
      [0, {}],
      [0.14, { hy: -56, lean: -18, head: -30, ax: -10, ay: -30, w: -140, bx: -14, by: -26, w2: -160, f1x: 18, f2x: -26 }, 'out'],
      [0.50, { hy: -44, lean: 30, head: 0, ax: 16, ay: 30, w: 80, bx: 20, by: 32, w2: 100, f1x: 28, f2x: -24 }, 'io'],
      [1.15, { hy: -45, lean: 32 }, 'lin'],
      [1.40, BASE, 'io'],
    ]),
    act: 1.4, noPoise: true, critable: true,
  },
  critHit: {
    an: mk(DB, [
      [0, {}],
      [0.52, { ...KNEEL_D, lean: 46, head: 0 }, 'lin'],
      [0.62, { hy: -38, lean: 24, head: -30, ax: 6, ay: 20, w: 60, bx: 16, by: 6, w2: 120 }, 'out'],
      [1.12, { lean: 22, head: -34 }, 'lin'],
      [1.40, { hy: -28, lean: 66, head: 20, ax: 24, ay: 30, w: 90, bx: 28, by: 34, w2: 100 }, 'out'],
      [2.20, { hy: -32, lean: 60 }, 'lin'],
      [2.80, BASE, 'io'],
    ]),
    act: 2.8, noPoise: true,
  },
  dead: {
    an: mk(DB, [
      [0, {}],
      [0.3, KNEEL_D, 'out'],
      [1.1, { hy: -33, lean: 56, head: 10 }, 'lin'],
      [1.7, { rot: 90, oy: 26, hy: -62, lean: 4, head: 4, f1x: 6, f2x: -4, f1y: 0, f2y: 0, ax: 20, ay: 30, w: 70, bx: 24, by: 24, w2: 100 }, 'in2'],
      [1.9, { oy: 27 }, 'out'],
      [9, {}, 'lin'],
    ]),
    noPoise: true,
  },
};
// strings: phase 2 adds a hit to each
const DSTR1 = { twin: [['dash'], ['thrustD']], dash: [['twin']], thrustD: [['twin']] };
const DSTR2 = {
  twin: [['flurry'], ['dash', 'twin']], dash: [['twin', 'thrustD'], ['whirl']],
  thrustD: [['twin', 'dash']], whirl: [['dash']], aerial: [['twin']],
};

// ---------------------------------------------------------------- Twinfang Duelist: AI, events, walk, drawing
function duelCaps(S) {
  return [
    [S.hip, S.sh, 11], [S.sh, S.hd, 10],
    [S.hip, S.k1, 7], [S.k1, S.f1, 6], [S.hip, S.k2, 7], [S.k2, S.f2, 6],
    [S.sh, S.eA, 5], [S.eA, S.hA, 5], [S.sh, S.eB, 5], [S.eB, S.hB, 5],
  ];
}
function duelDecide() {
  if (P.state === 'dead') { B.wait = 1; return; }
  if (B.pending2) { bossPhase2('rally'); return; }
  const dx = P.x - B.x, d = Math.abs(dx), front = dx * B.face > 0;
  if (!front && d > 20) { bBegin('turn'); return; }
  // escape a near poise break, or shake off a player standing on top of it
  if (B.cd.backstep <= 0 && d < 110 && (B.poise < maxPoise() * 0.3 || B.glueT > 0.6)) {
    B.queue = Math.random() < 0.5 ? ['dash'] : [];
    bBegin('backstep');
    return;
  }
  const o = [];
  const add = (n, w) => { if (B.last[0] === n && B.last[1] === n) return; o.push([n, w]); };
  if (d < 200) { add('twin', 3); add('flurry', 2); }
  if (d > 80 && d < 300) add('thrustD', 1.5);
  if (d > 140 && d < 420) add('dash', 3);
  if (d > 160 && B.cd.aerial <= 0) add('aerial', 2);
  if (B.phase2 && d < 320 && B.cd.whirl <= 0) add('whirl', 3);
  if (!o.length) { B.wait = 0.15; return; }
  const n = pick(o);
  B.queue = pickString(n, DSTR1, DSTR2, T.d.strings);
  bBegin(n, false);
}
function duelPunish() {
  const dx = P.x - B.x, d = Math.abs(dx);
  if (dx * B.face < 0) { bBegin('turn'); return; }
  B.queue = [];
  if (d < 200) bBegin('twin');
  else if (d < 420 || B.cd.aerial > 0) bBegin('dash');
  else bBegin('aerial');
}
function duelEvent(ev) {
  if (ev === 'land') { const x = B.x + B.face * 30; dust(x, 10, 26); shake(6); sStep(x, 1); }
  else if (ev === 'rally') { addWave(B.x, 220, 0, 'push', { ring: B.S.hd }); shake(6); sClang(B.x); sWhoosh(B.x, true); }
}
function duelLoco(dt) {
  const v = B.vx * B.face, S = 16;
  B.moveBlend = approach(B.moveBlend, clamp(Math.abs(B.vx) / 120, 0, 1), dt * 6);
  const before = Math.floor(B.walkP * 2);
  B.walkP += v * dt / (4 * S);
  if (Math.floor(B.walkP * 2) !== before && B.moveBlend > 0.4) sStep(B.x, 0.25);
  const m = B.moveBlend, p = copyPose(DB, B.pose);
  const g1 = gait(B.walkP, S, 10), g2 = gait(B.walkP + 0.5, S, 10), q = B.walkP * 2 * Math.PI;
  p.f1x = lerp(DB.f1x, 8 + g1[0], m); p.f1y = -g1[1] * m;
  p.f2x = lerp(DB.f2x, -8 + g2[0], m); p.f2y = -g2[1] * m;
  p.hy = DB.hy + (0.5 + 0.5 * Math.cos(2 * q)) * 3 * m + Math.sin(clock * 2.2) * 1.2 * (1 - m);
  p.lean = DB.lean + Math.sin(clock * 2.2 + 0.4) * 1.2 + 6 * m;
  p.w = DB.w + Math.sin(clock * 2) * 3;
  p.w2 = DB.w2 + Math.sin(clock * 2 + 1) * 4;
}
function drawCurvedBlade(h, t, alpha) {
  const dx = t[0] - h[0], dy = t[1] - h[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, f = B.face;
  const cx = h[0] + dx * 0.55 - uy * 7 * f, cy = h[1] + dy * 0.55 + ux * 7 * f;
  g.globalAlpha = alpha;
  g.strokeStyle = C.duelBlade; g.lineWidth = 2.6;
  g.beginPath(); g.moveTo(h[0], h[1]); g.quadraticCurveTo(cx, cy, t[0], t[1]); g.stroke();
  g.strokeStyle = C.hilt; g.lineWidth = 2.4;
  path([[h[0] - uy * 5 + ux * 2, h[1] + ux * 5 + uy * 2], [h[0] + uy * 5 + ux * 2, h[1] - ux * 5 + uy * 2]]);
  g.globalAlpha = 1;
}
function drawDuelist(S, col) {
  g.strokeStyle = col; g.lineWidth = DR.line;
  g.globalAlpha = 0.5;
  path([S.hip, S.k2, S.f2]);
  path([S.sh, S.eB, S.hB]);
  g.globalAlpha = 1;
  drawCurvedBlade(S.hB, S.wt2, 0.8);
  g.strokeStyle = col; g.lineWidth = DR.line;
  path([S.hip, S.sh, S.nk]);
  // scarf trailing from the neck
  const hd = S.hd, up = S.up, fw = S.fw, nk = S.nk, wv = Math.sin(clock * 9) * 3 - B.vx * B.face * 0.02;
  g.strokeStyle = B.flash > 0 ? C.bossFlash : C.scarf; g.lineWidth = 3.5;
  g.beginPath(); g.moveTo(nk[0], nk[1]);
  g.quadraticCurveTo(nk[0] - fw[0] * 12 + up[0] * 4, nk[1] - fw[1] * 12 + up[1] * 4,
    nk[0] - fw[0] * 26 - up[0] * (2 + wv), nk[1] - fw[1] * 26 - up[1] * (2 + wv));
  g.stroke();
  g.strokeStyle = col; g.lineWidth = 4;
  g.beginPath(); g.arc(hd[0], hd[1], DR.headR, 0, Math.PI * 2);
  g.fillStyle = C.bg; g.fill(); g.stroke();
  if (B.state !== 'dead') {   // a single eye slit
    g.strokeStyle = C.duelEye; g.lineWidth = 2;
    if (B.phase2) { g.shadowColor = C.duelEye; g.shadowBlur = 10; }
    const ex = hd[0] + fw[0] * 5 + up[0] * 1.5, ey = hd[1] + fw[1] * 5 + up[1] * 1.5;
    path([[ex - fw[0] * 2.5, ey - fw[1] * 2.5], [ex + fw[0] * 2.5, ey + fw[1] * 2.5]]);
    g.shadowBlur = 0;
  }
  g.strokeStyle = col; g.lineWidth = DR.line;
  path([S.hip, S.k1, S.f1]);
  drawCurvedBlade(S.hA, S.wt, 1);
  g.strokeStyle = col; g.lineWidth = DR.line;
  path([S.sh, S.eA, S.hA]);
}

BOSSES.duelist = {
  id: 'duelist', name: 'Twinfang Duelist',
  blurb: 'A swift duelist with twin blades. Fast strings: learn to block and parry.',
  R: DR, base: DB, moves: DA, mc: DC, caps: duelCaps, weaponR: 4,
  hp: () => T.d.hp, poise: () => T.d.poise, walk: () => T.d.walk, approach: () => T.d.approach,
  speed2: () => T.d.speed2,
  cd: () => ({ aerial: 2, whirl: 0, backstep: 0 }),
  onBegin(name) {
    if (name === 'aerial') B.cd.aerial = T.d.cdAerial;
    if (name === 'whirl') B.cd.whirl = T.d.cdWhirl;
    if (name === 'backstep') {
      B.cd.backstep = T.d.cdBackstep;
      if (B.poise < maxPoise() * 0.3) B.poise = maxPoise() * 0.5;   // escaping the break resets part of its poise
    }
  },
  pause: () => (B.phase2 ? rand(0.05, 0.3) : rand(0.15, 0.45)),
  decide: duelDecide, punish: duelPunish, event: duelEvent, loco: duelLoco, draw: drawDuelist,
  col: C.duel, col2: C.duel2, startX: 1000, edge: 40, walkAccel: 900, turnDelay: 0.12, heavyWhoosh: false,
  critDist: 62, critRange: [20, 120], punishReach: 420, stepW: 0.3, trailRGB: '226,232,238',
};
