/* Stick Souls — Screen layout and all drawing.
   Plain scripts loaded in order by index.html; they share top-level names. */
'use strict';

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
