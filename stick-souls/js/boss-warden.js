/* Stick Souls — The Gaunt Warden boss: rig, moves and AI.
   Plain scripts loaded in order by index.html; they share top-level names. */
'use strict';

// ---------------------------------------------------------------- boss rig + moves
const BR = { thigh: 58, shin: 58, spine: 86, neck: 10, headR: 18, upper: 56, fore: 56,
  grip: 0, pommel: 16, wlen: 128, wlen2: 0, pvx: 0, pvy: -50, line: 8.5 };
const BB = { hx: 0, hy: -100, lean: 24, head: -14, ax: 30, ay: 68, bx: 46, by: 52, w: 58, w2: 0, th: 0, ea: 1, eb: 1,
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
    moves: [{ t0: 0.84, t1: 1.04, d: 240, e: 'out2', adapt: [170, 40, 320] }],
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

// ---------------------------------------------------------------- Gaunt Warden: AI, events, walk, drawing
function wardenCaps(S) {
  return [
    [S.hip, S.sh, 22], [S.sh, S.hd, 18],
    [S.hip, S.k1, 13], [S.k1, S.f1, 11], [S.hip, S.k2, 13], [S.k2, S.f2, 11],
    [S.sh, S.eA, 10], [S.eA, S.hA, 9], [S.sh, S.eB, 9], [S.eB, S.hB, 8],
  ];
}
function wardenDecide() {
  if (P.state === 'dead') { B.wait = 1; return; }
  if (B.pending2) { bossPhase2('roar'); return; }
  const dx = P.x - B.x, d = Math.abs(dx), front = dx * B.face > 0;
  if (!front && d > 30) { bBegin(d < 170 && B.cd.stomp <= 0 ? 'stomp' : 'turn'); return; }
  const o = [];
  const add = (n, w) => { if (B.last[0] === n && B.last[1] === n) return; o.push([n, w]); };
  if (d < 120 && B.cd.stomp <= 0) add('stomp', 2);
  if (d < 175) add('upswing', 3);
  if (d > 70 && d < 320) add('smash', 3);
  if (d > 190 && d < 520) add('thrust', 2);
  if (d > (B.phase2 ? 300 : 380) && B.cd.leap <= 0) add('leap', d > 520 ? 6 : 2);
  if (B.phase2 && d < 360 && B.cd.quake <= 0) add('quake', 2);
  if (!o.length) { B.wait = 0.25; return; }
  const n = pick(o);
  B.queue = pickString(n, STRINGS1, STRINGS2, T.b.strings);
  let start = n;
  if (n === 'smash' && Math.random() < (B.phase2 ? 0.6 : 0.45)) start = 'smashD';
  if (n === 'thrust' && Math.random() < (B.phase2 ? 0.45 : 0.3)) start = 'thrustD';
  bBegin(start, false);
}
// punish a heal started within reach
function wardenPunish() {
  const dx = P.x - B.x, d = Math.abs(dx);
  if (dx * B.face < 0) { bBegin('turn'); return; }
  B.queue = [];
  if (d < 175) bBegin('upswing');
  else if (d < 520) bBegin('thrust');
  else if (B.cd.leap <= 0) bBegin('leap');
}
function wardenEvent(ev) {
  const S = B.S;
  const stopped = B.stoppedSwing === B.swingId;   // the club was blocked: its impact wave can't hurt
  if (ev === 'smash') { addWave(S.wt[0], 85, 10, 'small', { src: B.x, harmless: stopped }); shake(10); dust(S.wt[0], 14, 30); sImpact(S.wt[0], 1); }
  else if (ev === 'leap') { const x = B.x + B.face * 70; addWave(x, 210, 14, 'small', { src: B.x, harmless: stopped }); shake(16); dust(x, 26, 90); sQuake(x); }
  else if (ev === 'stomp') { addWave(S.f1[0], 140, 12, 'small', { src: B.x }); shake(9); dust(S.f1[0], 16, 40); sQuake(S.f1[0]); }
  else if (ev === 'roar') { addWave(B.x, 320, 0, 'push', { ring: S.hd }); shake(12); sRoar(B.x); }
  else if (ev.startsWith('quake')) {
    const i = +ev.slice(5), r0 = [0, 130, 240][i - 1], r1 = [140, 250, 370][i - 1];
    if (i === 1) waveGroup++;
    addWave(B.x, r1, 14, 'small', { r0, group: waveGroup, src: B.x });
    shake(8 + 3 * i); sQuake(B.x);
    dust(B.x - r1 + 20, 8, 20); dust(B.x + r1 - 20, 8, 20);
  }
}
function wardenLoco(dt) {
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
function drawWarden(S, col) {
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
}

BOSSES.warden = {
  id: 'warden', name: 'Gaunt Warden',
  blurb: 'A towering brute with a stone club. Slow, heavy, punishing.',
  R: BR, base: BB, moves: BA, mc: BC, caps: wardenCaps, weaponR: 9,
  hp: () => T.b.hp, poise: () => T.b.poise, walk: () => T.b.walk, approach: () => T.b.approach,
  speed2: () => T.b.speed2,
  cd: () => ({ leap: 3, stomp: 0, quake: 2 }),
  onBegin(name) {
    if (name === 'leap') B.cd.leap = T.b.cdLeap;
    if (name === 'stomp') B.cd.stomp = T.b.cdStomp;
    if (name === 'quake') B.cd.quake = T.b.cdQuake;
  },
  pause: () => (B.phase2 ? rand(0.1, 0.4) : rand(0.25, 0.6)),
  decide: wardenDecide, punish: wardenPunish, event: wardenEvent, loco: wardenLoco, draw: drawWarden,
  col: C.boss, col2: C.boss2, startX: 1000, edge: 70, walkAccel: 260, turnDelay: 0.3, heavyWhoosh: true,
  critDist: 92, critRange: [30, 170], punishReach: 520, stepW: 0.6, trailRGB: '220,200,178',
};
BK = BOSSES.warden;
