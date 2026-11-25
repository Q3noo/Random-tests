/* Stick Souls — Fight state, shared helpers, shockwaves, particles and the per-step update.
   Plain scripts loaded in order by index.html; they share top-level names. */
'use strict';

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
    x: 480, y: 0, vx: 0, face: 1,
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
