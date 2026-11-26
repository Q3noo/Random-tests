extends Node
## Stick Souls — every gameplay number, the settings list, colours and fonts. Autoload: T.
## The settings panel edits these values live. Ported 1:1 from the browser version (stick-souls/js/tuning.js).

var arenaL := 40.0
var arenaR := 1440.0
var step := 1.0 / 120.0

var p := {
	"hp": 100.0, "st": 100.0, "stRegen": 50.0, "stDelayEmpty": 1.0, "guardRegen": 0.2,
	"run": 260.0, "accel": 1800.0,
	"flasks": 3.0, "flaskHeal": 45.0,
	"costLight": 16.0, "costHeavy": 28.0, "costRoll": 13.0, "costBackstep": 8.0,
	"rollDist": 190.0, "rollInv": 0.43, "buffer": 0.2, "holdTime": 0.2, "chargeTime": 0.5,
	"dmgL": 10.0, "dmgHeavy": 13.0, "dmgCharged": 17.0, "dmgCrit": 35.0,
	"dmgCounter": 15.0, "dmgRollAtk": 10.0,
	"poiseL": 14.0, "poiseHeavy": 15.0, "poiseCharged": 39.0, "poiseCounter": 39.0, "poiseRollAtk": 12.0,
	"parryWin": 0.14, "blockTaken": 0.25, "blockSt": 1.0,
}
var b := {
	"hp": 520.0, "poise": 100.0, "poiseDelay": 6.0, "poiseRegen": 10.0, "staggerMult": 1.5,
	"walk": 140.0, "approach": 200.0, "strings": 0.45, "phase2At": 0.5, "speed2": 1.16,
	"cdLeap": 4.0, "cdStomp": 3.5, "cdQuake": 7.0, "healPunish": 0.7,
}
# Twinfang Duelist (poise recovery, stagger, phase 2 threshold and heal punishing are shared with b)
var d := {
	"hp": 380.0, "poise": 70.0, "walk": 190.0, "approach": 160.0, "strings": 0.45, "speed2": 1.0,
	"cdAerial": 5.0, "cdWhirl": 6.0, "cdBackstep": 3.0,
}
# multipliers and feel; tempo speeds up the whole fight for both sides (not hit-stop, the parry window or input timing)
var f := {
	"tempo": 1.1, "atkSpeed": 1.0, "recovery": 1.2, "rollSpeed": 1.0, "bossSpeed": 1.0, "bossDmg": 1.0,
	"bossPause": 1.0, "poiseMult": 1.0, "hitstop": 1.0, "shake": 1.0, "volume": 0.8,
}
var DEFAULTS := {}

# [group, setting, label, min, max, step, format, applies on restart]
const SETTINGS := [
	["Pace", "f.tempo", "Combat tempo (both sides)", 0.8, 1.5, 0.05, "x"],
	["Movement", "p.run", "Run speed", 100, 400, 5],
	["Movement", "p.rollDist", "Roll distance", 80, 320, 5],
	["Movement", "p.rollInv", "Roll invincibility (seconds)", 0.1, 0.65, 0.01],
	["Movement", "f.rollSpeed", "Roll speed", 0.6, 1.6, 0.05, "x"],
	["Attacks", "f.atkSpeed", "Attack speed", 0.6, 1.8, 0.05, "x"],
	["Attacks", "f.recovery", "Recovery speed after your attacks and rolls", 0.8, 1.8, 0.05, "x"],
	["Attacks", "p.dmgL", "Light damage", 2, 40, 1],
	["Attacks", "p.dmgHeavy", "Heavy damage", 2, 60, 1],
	["Attacks", "p.dmgCharged", "Charged heavy damage", 2, 80, 1],
	["Attacks", "p.dmgCrit", "Critical hit damage", 5, 150, 1],
	["Attacks", "f.poiseMult", "Poise damage you deal", 0.3, 3, 0.05, "x"],
	["Attacks", "p.holdTime", "Hold time for heavy (seconds)", 0.1, 0.5, 0.01],
	["Defense", "p.parryWin", "Parry window (seconds)", 0.04, 0.3, 0.01],
	["Defense", "p.blockTaken", "Damage taken while blocking", 0, 1, 0.05, "pct"],
	["Defense", "p.blockSt", "Stamina drain when blocking", 0.3, 2.5, 0.05, "x"],
	["Stamina", "p.st", "Max stamina", 40, 200, 5],
	["Stamina", "p.stRegen", "Stamina recovery per second", 10, 120, 1],
	["Stamina", "p.costLight", "Light attack cost", 0, 50, 1],
	["Stamina", "p.costHeavy", "Heavy attack cost", 0, 60, 1],
	["Stamina", "p.costRoll", "Roll cost", 0, 40, 1],
	["Health", "p.hp", "Your health", 30, 300, 5, null, true],
	["Health", "p.flasks", "Healing flasks", 0, 10, 1, null, true],
	["Health", "p.flaskHeal", "Health per flask", 5, 100, 1],
	["Both bosses", "f.bossSpeed", "Boss attack speed", 0.6, 1.6, 0.05, "x"],
	["Both bosses", "f.bossDmg", "Boss damage", 0.2, 2.5, 0.05, "x"],
	["Both bosses", "f.bossPause", "Pause between boss attacks", 0.2, 2.5, 0.05, "x"],
	["Both bosses", "b.poiseDelay", "Poise recovery delay (seconds)", 0.5, 15, 0.5],
	["Both bosses", "b.poiseRegen", "Poise recovery per second", 1, 60, 1],
	["Gaunt Warden", "b.hp", "Health", 100, 2000, 10, null, true],
	["Gaunt Warden", "b.poise", "Poise", 30, 300, 5],
	["Gaunt Warden", "b.walk", "Walk speed", 40, 260, 5],
	["Gaunt Warden", "b.approach", "Walks in when farther than", 100, 400, 10],
	["Gaunt Warden", "b.cdLeap", "Leap cooldown (seconds)", 1, 10, 0.5],
	["Gaunt Warden", "b.strings", "Chance of attack strings", 0, 1, 0.05, "pct"],
	["Gaunt Warden", "b.speed2", "Phase 2 speed-up", 1, 1.5, 0.01, "x"],
	["Twinfang Duelist", "d.hp", "Health", 100, 1500, 10, null, true],
	["Twinfang Duelist", "d.poise", "Poise", 20, 250, 5],
	["Twinfang Duelist", "d.walk", "Walk speed", 60, 320, 5],
	["Twinfang Duelist", "d.approach", "Walks in when farther than", 60, 400, 10],
	["Twinfang Duelist", "d.strings", "Chance of attack strings", 0, 1, 0.05, "pct"],
	["Feel", "f.hitstop", "Hit-stop", 0, 2.5, 0.05, "x"],
	["Feel", "f.shake", "Screen shake", 0, 2, 0.05, "x"],
	["Sound", "f.volume", "Volume", 0, 1, 0.05, "pct"],
]
# Bump a setting's number when its meaning or default changes on purpose:
# saved values for it are then ignored and it starts from the new default.
const SET_VER := {"p.run": 2, "p.parryWin": 2}

var C := {
	"bg": Color("#0d0e11"),
	"ground": Color("#cfc9bd"),
	"player": Color("#eeebe4"), "hurt": Color("#ff7a68"),
	"blade": Color("#a7bdd3"), "bladeHot": Color("#eef5ff"), "hilt": Color("#857a6a"),
	"boss": Color("#b8b0a2"), "boss2": Color("#cfa08f"), "bossFlash": Color("#ffffff"), "club": Color("#8a7863"), "eye": Color("#ff4a35"),
	"duel": Color("#9fb0c2"), "duel2": Color("#c9a2bf"), "duelBlade": Color("#dfe5ea"), "duelEdge": Color("#ff6a5a"),
	"duelEye": Color("#8fe8ff"), "scarf": Color("#9d2d25"),
	"spark": Color("#fff1cf"), "blood": Color("#ff8b73"), "heal": Color("#e8b752"), "parry": Color("#bfe3ff"), "crit": Color("#ffd27a"),
	"hp": Color("#b8382e"), "st": Color("#6aa062"), "flask": Color("#d9a441"), "bossHp": Color("#9d2d25"), "ghost": Color("#e0bf78"),
	"ui": Color("#e9e6df"),
}

# fonts: display face for titles and names, the engine's own font for everything else
var font_d: Font
var font_ui: Font
var font_bold: Font


func _init() -> void:
	DEFAULTS = {"p": p.duplicate(), "b": b.duplicate(), "d": d.duplicate(), "f": f.duplicate()}
	font_ui = ThemeDB.fallback_font
	var bold := FontVariation.new()
	bold.base_font = font_ui
	bold.variation_embolden = 0.7
	font_bold = bold
	var path := "res://fonts/IMFellEnglishSC-Regular.ttf"
	font_d = load(path) if ResourceLoader.exists(path) else font_ui


func get_val(path: String) -> float:
	var ks := path.split(".")
	return float(get(ks[0])[ks[1]])


func set_val(path: String, v: float) -> void:
	var ks := path.split(".")
	get(ks[0])[ks[1]] = v


func default_val(path: String) -> float:
	var ks := path.split(".")
	return float(DEFAULTS[ks[0]][ks[1]])


func ver_of(id: String) -> int:
	return SET_VER.get(id, 1)


# optional parts of a SETTINGS row
func fmt_of(s: Array):
	return s[6] if s.size() > 6 else null


func restart_of(s: Array) -> bool:
	return s.size() > 7 and s[7] == true
