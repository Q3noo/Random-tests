/* Stick Souls — Shared boss logic: attacks, hits, poise, phase 2, criticals and the per-step update.
   Each boss (boss-warden.js, boss-duelist.js) registers a "kind" in BOSSES with its own body, moves,
   AI, sounds and drawing. BK is the boss being fought.
   Plain scripts loaded in order by index.html; they share top-level names. */
'use strict';

const BOSSES = {};
let BK = null;

function playerCaps() {
  const S = P.S;
  return [[S.hip, S.hd, 10], [S.hip, S.f1, 5], [S.hip, S.f2, 5]];
}
const maxPoise = () => BK.poise() * (B.phase2 ? 1.2 : 1);
const bSpeed = () => (B.phase2 ? BK.speed2() : 1) * T.f.bossSpeed;
// the last attack of a string keeps at least 1.2 seconds (at tempo 1) of recovery after its hit
function withFinisher(d) {
  const ends = [];
  if (d.hits) for (const h of d.hits) ends.push(h.t1);
  if (d.events) for (const e of d.events) ends.push(e.t);
  const lastHit = ends.length ? Math.max(...ends) : 0;
  const extra = 1.2 * bSpeed() - (d.act - lastHit);
  return extra > 0.01 ? shifted(d, lastHit + 0.02, extra) : d;
}
function bBegin(name, finisher) {
  let d = BK.moves[name];
  if (finisher) d = withFinisher(d);
  B.state = name; B.def = d; B.t = 0; B.start = copyPose(B.pose, {}); B.hitMask = 0;
  B.adaptD = null; B.vx = 0; B.swingId++; B.leapTo = B.x; B.punishT = 0;
  if (name === 'stagger' || name === 'dead' || name === 'reel' || name === 'critHit') B.queue = [];
  if (BK.onBegin) BK.onBegin(name);
  if (d.atk) { B.last.unshift(name.replace(/D$/, '')); B.last.length = Math.min(B.last.length, 3); }
}
function bLoco() {
  B.state = 'loco'; B.def = null; B.moveBlend = 0; B.sLean.x = B.sLean.v = 0;
  B.wait = BK.pause() * T.f.bossPause;
}
function pick(o) {
  let s = 0;
  for (const it of o) s += it[1];
  let r = Math.random() * s;
  for (const it of o) { r -= it[1]; if (r <= 0) return it[0]; }
  return o[o.length - 1][0];
}
// choose a string to follow an opening attack
function pickString(n, s1, s2, chance) {
  const pool = (B.phase2 ? s2 : s1)[n];
  const c = B.phase2 ? Math.min(1, chance + 0.15) : chance;
  return pool && Math.random() < c ? pool[Math.floor(Math.random() * pool.length)].slice() : [];
}
function bossTrack(d) {
  const dist = Math.abs(P.x - B.x), front = (P.x - B.x) * B.face > 0;
  const m = d.moves && d.moves.find(mv => mv.adapt);
  if (m) B.adaptD = front ? clamp(dist - m.adapt[0], m.adapt[1], m.adapt[2]) : m.adapt[1];
  if (d.leap) {
    const lead = d.leap.lead != null ? d.leap.lead : 105;
    B.leapTo = clamp(front ? P.x - B.face * lead : B.x + B.face * 60, T.arenaL + 80, T.arenaR - 80);
  }
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
  if (ev === 'flip') { if ((P.x - B.x) * B.face < 0) B.face *= -1; return; }
  BK.event(ev);
}
// weapon segments: 'A' = main hand (wt), 'B' = second hand (wt2) for dual wielders
function bHits(d, t0, t1) {
  for (let i = 0; i < d.hits.length; i++) {
    const h = d.hits[i];
    if ((B.hitMask & (1 << i)) || t1 < h.t0 || t0 > h.t1) continue;
    const blades = h.w === 'B' ? [1] : h.w === 'AB' ? [0, 1] : [0];
    for (let j = 1; j <= 3; j++) {
      const tt = lerp(t0, t1, j / 3);
      if (tt < h.t0 || tt > h.t1) continue;
      const S = solve(BK.R, sample(d.an, tt, B.start, TMPB), B.x, B.y, B.face);
      let hit = false;
      for (const bl of blades) {
        const a = bl ? S.hB : S.hA, b = bl ? S.wt2 : S.wt;
        addTrail('b', B.swingId * 2 + bl, a, b);
        if (!hit && P.state !== 'dead' && !pInvuln() && hitTest(a, b, BK.weaponR, playerCaps())) hit = true;
      }
      if (hit) {
        B.hitMask |= 1 << i;
        const res = hurtPlayer(h.dmg, h.knock, B.x, { parry: !h.noParry, guard: h.guard });
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
// phase 2 begins at the next decision with the boss's transition move
function bossPhase2(move) {
  B.pending2 = false; B.phase2 = true; B.poise = maxPoise();
  B.face = Math.sign(P.x - B.x) || B.face;
  bBegin(move);
}

function updateBoss(dt) {
  if (B.flash > 0) B.flash -= dt;
  for (const k in B.cd) B.cd[k] -= dt;
  B.poiseT += dt;
  B.glueT = Math.abs(P.x - B.x) < 70 ? B.glueT + dt : 0;
  if (B.poiseT > T.b.poiseDelay && !(B.def && B.def.noPoise)) B.poise = Math.min(maxPoise(), B.poise + T.b.poiseRegen * dt);
  if (B.poise <= 0 && B.state !== 'dead' && B.y >= -0.5 && !(B.def && B.def.noPoise)) {
    bBegin('stagger'); shake(6); sImpact(B.x, 1);
  }

  if (B.state === 'loco') {
    const dx = P.x - B.x, d = Math.abs(dx), front = dx * B.face > 0;
    let want = 0;
    if (P.state !== 'dead' && !ended) {
      if (B.punishT > 0) { B.punishT -= dt; if (B.punishT <= 0) BK.punish(); }
      if (B.state === 'loco') {
        if (!front && d > 30) {
          B.behindT += dt;
          if (B.behindT > BK.turnDelay) { B.behindT = 0; BK.decide(); }
        } else {
          B.behindT = 0;
          if (d > BK.approach()) want = B.face * BK.walk() * (B.phase2 ? 1.2 : 1);
        }
        B.wait -= dt;
        if (B.state === 'loco' && B.wait <= 0) BK.decide();
      }
    }
    if (B.state === 'loco') {
      B.vx = approach(B.vx, want, BK.walkAccel * dt);
      B.x += B.vx * dt;
      if (B.y < 0) B.y = Math.min(0, B.y + 700 * dt);
      BK.loco(dt);
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
    B.S = solve(BK.R, B.pose, B.x, B.y, B.face);
    if (d.hits) for (const h of d.hits) {
      const w = h.t0 - 0.1;
      if (t0 < w && t1 >= w) sWhoosh(B.x, BK.heavyWhoosh);
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
  B.x = clamp(B.x, T.arenaL + BK.edge, T.arenaR - BK.edge);
  const fm = B.state === 'loco' ? 'gait' : (B.state === 'dead' || B.y < -1) ? 'free' : 'lock';
  B.S = solve(BK.R, finalize(B, BK.mc, dt, fm), B.x, B.y, B.face);
  B.caps = BK.caps(B.S);
}
