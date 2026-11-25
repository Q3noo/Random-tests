/* Stick Souls — Main loop and start-up. Loaded last.
   Plain scripts loaded in order by index.html; they share top-level names. */
'use strict';

// ---------------------------------------------------------------- main loop
let last = performance.now(), acc = 0;
function frame(t) {
  const rdt = Math.min(0.1, (t - last) / 1000);
  last = t;
  if (mode === 'play') {
    // attack button held long enough becomes a heavy
    if (input.atk.down && !input.atk.heavy && now() - input.atk.at >= T.p.holdTime) { input.atk.heavy = true; press('heavy'); }
    const dt = rdt;
    if (slowT > 0) {
      slowT -= dt;
      timeScale = slowT > 0.35 ? 0.3 : lerp(1, 0.3, Math.max(0, slowT) / 0.35);
    } else timeScale = 1;
    let wdt = dt * timeScale * T.f.tempo;   // the fight runs at combat tempo; hit-stop and UI stay real-time
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
