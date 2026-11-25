/* Stick Souls — All gameplay numbers, the settings list and colours.
   Plain scripts loaded in order by index.html; they share top-level names. */
'use strict';

// ---------------------------------------------------------------- tuning
// Every gameplay number lives here. The settings panel edits these values live.
const T = {
  arenaL: 40, arenaR: 1440,
  step: 1 / 120,
  p: {
    hp: 100, st: 100, stRegen: 50, stDelayEmpty: 1.0, guardRegen: 0.2,
    run: 260, accel: 1800,
    flasks: 3, flaskHeal: 45,
    costLight: 16, costHeavy: 28, costRoll: 13, costBackstep: 8,
    rollDist: 190, rollInv: 0.43, buffer: 0.2, holdTime: 0.2, chargeTime: 0.5,
    dmgL: 10, dmgHeavy: 13, dmgCharged: 17, dmgCrit: 35,
    dmgCounter: 15, dmgRollAtk: 10,
    poiseL: 14, poiseHeavy: 15, poiseCharged: 39, poiseCounter: 39, poiseRollAtk: 12,
    parryWin: 0.14, blockTaken: 0.25, blockSt: 1.0,
  },
  b: {
    hp: 520, poise: 100, poiseDelay: 6, poiseRegen: 10, staggerMult: 1.5,
    walk: 140, approach: 200, strings: 0.45, phase2At: 0.5, speed2: 1.16,
    cdLeap: 4, cdStomp: 3.5, cdQuake: 7, healPunish: 0.7,
  },
  // Twinfang Duelist (poise recovery, stagger, phase 2 threshold and heal punishing are shared with b)
  d: { hp: 380, poise: 70, walk: 190, approach: 160, strings: 0.45, speed2: 1, cdAerial: 5, cdWhirl: 6, cdBackstep: 3 },
  // multipliers and feel
  // tempo speeds up the whole fight for both sides (not hit-stop, the parry window or input timing)
  f: { tempo: 1.1, atkSpeed: 1, recovery: 1.2, rollSpeed: 1, bossSpeed: 1, bossDmg: 1, bossPause: 1, poiseMult: 1,
    hitstop: 1, shake: 1, volume: 0.8 },
};
const DEFAULTS = JSON.parse(JSON.stringify(T));
const getPath = (o, p) => p.split('.').reduce((a, k) => a[k], o);
const setPath = (o, p, v) => { const ks = p.split('.'); const k = ks.pop(); ks.reduce((a, x) => a[x], o)[k] = v; };

// [group, setting, label, min, max, step, format, applies on restart]
const SETTINGS = [
  ['Pace', 'f.tempo', 'Combat tempo (both sides)', 0.8, 1.5, 0.05, 'x'],
  ['Movement', 'p.run', 'Run speed', 100, 400, 5],
  ['Movement', 'p.rollDist', 'Roll distance', 80, 320, 5],
  ['Movement', 'p.rollInv', 'Roll invincibility (seconds)', 0.1, 0.65, 0.01],
  ['Movement', 'f.rollSpeed', 'Roll speed', 0.6, 1.6, 0.05, 'x'],
  ['Attacks', 'f.atkSpeed', 'Attack speed', 0.6, 1.8, 0.05, 'x'],
  ['Attacks', 'f.recovery', 'Recovery speed after your attacks and rolls', 0.8, 1.8, 0.05, 'x'],
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
  ['Health', 'p.hp', 'Your health', 30, 300, 5, null, true],
  ['Health', 'p.flasks', 'Healing flasks', 0, 10, 1, null, true],
  ['Health', 'p.flaskHeal', 'Health per flask', 5, 100, 1],
  ['Both bosses', 'f.bossSpeed', 'Boss attack speed', 0.6, 1.6, 0.05, 'x'],
  ['Both bosses', 'f.bossDmg', 'Boss damage', 0.2, 2.5, 0.05, 'x'],
  ['Both bosses', 'f.bossPause', 'Pause between boss attacks', 0.2, 2.5, 0.05, 'x'],
  ['Both bosses', 'b.poiseDelay', 'Poise recovery delay (seconds)', 0.5, 15, 0.5],
  ['Both bosses', 'b.poiseRegen', 'Poise recovery per second', 1, 60, 1],
  ['Gaunt Warden', 'b.hp', 'Health', 100, 2000, 10, null, true],
  ['Gaunt Warden', 'b.poise', 'Poise', 30, 300, 5],
  ['Gaunt Warden', 'b.walk', 'Walk speed', 40, 260, 5],
  ['Gaunt Warden', 'b.approach', 'Walks in when farther than', 100, 400, 10],
  ['Gaunt Warden', 'b.cdLeap', 'Leap cooldown (seconds)', 1, 10, 0.5],
  ['Gaunt Warden', 'b.strings', 'Chance of attack strings', 0, 1, 0.05, 'pct'],
  ['Gaunt Warden', 'b.speed2', 'Phase 2 speed-up', 1, 1.5, 0.01, 'x'],
  ['Twinfang Duelist', 'd.hp', 'Health', 100, 1500, 10, null, true],
  ['Twinfang Duelist', 'd.poise', 'Poise', 20, 250, 5],
  ['Twinfang Duelist', 'd.walk', 'Walk speed', 60, 320, 5],
  ['Twinfang Duelist', 'd.approach', 'Walks in when farther than', 60, 400, 10],
  ['Twinfang Duelist', 'd.strings', 'Chance of attack strings', 0, 1, 0.05, 'pct'],
  ['Feel', 'f.hitstop', 'Hit-stop', 0, 2.5, 0.05, 'x'],
  ['Feel', 'f.shake', 'Screen shake', 0, 2, 0.05, 'x'],
  ['Sound', 'f.volume', 'Volume', 0, 1, 0.05, 'pct'],
];
// Bump a setting's number when its meaning or default changes on purpose:
// saved values for it are then ignored and it starts from the new default.
const SET_VER = { 'p.run': 2, 'p.parryWin': 2 };
const verOf = id => SET_VER[id] || 1;

const C = {
  bg: '#0d0e11',
  ground: '#cfc9bd',
  player: '#eeebe4', hurt: '#ff7a68',
  blade: '#a7bdd3', bladeHot: '#eef5ff', hilt: '#857a6a',
  boss: '#b8b0a2', boss2: '#cfa08f', bossFlash: '#ffffff', club: '#8a7863', eye: '#ff4a35',
  duel: '#9fb0c2', duel2: '#c9a2bf', duelBlade: '#dfe5ea', duelEdge: '#ff6a5a', duelEye: '#8fe8ff', scarf: '#9d2d25',
  spark: '#fff1cf', blood: '#ff8b73', heal: '#e8b752', parry: '#bfe3ff', crit: '#ffd27a',
  hp: '#b8382e', st: '#6aa062', flask: '#d9a441', bossHp: '#9d2d25', ghost: '#e0bf78',
  ui: '#e9e6df',
};
