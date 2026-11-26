extends RefCounted
## Stick Souls — the Twinfang Duelist: a fast, human-sized boss with two curved blades.
## Shorter wind-ups (never under ~0.45s real), long strings, a dash that cuts through you,
## an unparryable leaping cross, and a backstep that escapes a near poise break.
## Ported 1:1 from stick-souls/js/boss-duelist.js.

var id := "duelist"
var name := "Twinfang Duelist"
var blurb := "A swift duelist with twin blades. Fast strings: learn to block and parry."
# about 1.35x the player's height; blade A in the front hand, blade B (reverse grip) in the back hand
var R := {"thigh": 32.0, "shin": 32.0, "spine": 48.0, "neck": 6.0, "headR": 10.0, "upper": 25.0, "fore": 25.0,
	"grip": 0.0, "pommel": 7.0, "wlen": 58.0, "wlen2": 58.0, "pvx": 0.0, "pvy": -40.0, "line": 5.0}
var base := {"hx": 0, "hy": -56, "lean": 14, "head": -10, "ax": 22, "ay": 24, "bx": 4, "by": 30, "w": -25, "w2": 150, "th": 0,
	"ea": 1, "eb": 1, "f1x": 24, "f1y": 0, "f2x": -24, "f2y": 0, "rot": 0, "ox": 0, "oy": 0}
var mc := {"walkPath": "d.walk", "leanV": 4.0, "lean": [10.0, 0.5], "head": [24.0, 0.55], "thr": 12.0, "reach": 40.0, "dur": 0.12, "lift": 9.0}
var moves := {}
var weaponR := 4.0
var col: Color = T.C.duel
var col2: Color = T.C.duel2
var trailCol := Color8(226, 232, 238)
var startX := 1000.0
var edge := 40.0
var walkAccel := 900.0
var turnDelay := 0.12
var heavyWhoosh := false
var critDist := 62.0
var critRange := [20.0, 120.0]
var punishReach := 420.0
var stepW := 0.3

# strings: phase 2 adds a hit to each
const DSTR1 := {"twin": [["dash"], ["thrustD"]], "dash": [["twin"]], "thrustD": [["twin"]]}
const DSTR2 := {
	"twin": [["flurry"], ["dash", "twin"]], "dash": [["twin", "thrustD"], ["whirl"]],
	"thrustD": [["twin", "dash"]], "whirl": [["dash"]], "aerial": [["twin"]],
}


func _init() -> void:
	var DB := base
	var BASE: String = Core.BASE
	var KNEEL_D := {"hy": -34, "lean": 50, "head": 8, "ax": 22, "ay": 34, "w": 70, "bx": 26, "by": 40, "w2": 100, "f1x": 28, "f1y": 0, "f2x": -18, "f2y": 0}
	# commit = moment it stops re-aiming. Times are animation seconds (real = / tempo).
	moves = {
		# quick 2-hit: overhead cut with the front blade, rising cut with the back blade
		"twin": {
			"an": Core.mk(DB, [
				[0, {}],
				[0.44, {"hy": -58, "lean": 4, "head": -8, "ax": 4, "ay": -20, "w": -150, "bx": -8, "by": 26, "w2": 160, "f1x": 26, "f2x": -26}, "out"],
				[0.56, {"hy": -54, "lean": 22, "ax": 30, "ay": 10, "w": 20, "f1x": 32, "f2x": -22}, "in"],
				[0.66, {"ax": 26, "ay": 22, "w": 45, "bx": -14, "by": 26, "w2": 175}, "out"],
				[0.80, {"hy": -52, "lean": 18, "ax": 18, "ay": 26, "w": 60, "bx": 30, "by": -6, "w2": -40, "f1x": 34, "f2x": -18}, "in"],
				[0.92, {"bx": 26, "by": -16, "w2": -70}, "out"],
				[1.40, BASE, "io"],
			]),
			"hits": [
				{"t0": 0.50, "t1": 0.60, "w": "A", "dmg": 10, "knock": "small", "guard": 18},
				{"t0": 0.70, "t1": 0.84, "w": "B", "dmg": 10, "knock": "small", "guard": 18},
			],
			"moves": [{"t0": 0.34, "t1": 0.82, "d": 46, "adapt": [60, 0, 90]}],
			"commit": 0.40, "act": 1.40, "cancel": 1.0, "atk": true,
		},
		# 4-hit string; the last hit comes late (blades held high), then a long opening
		"flurry": {
			"an": Core.mk(DB, [
				[0, {}],
				[0.50, {"hy": -50, "lean": 20, "head": -14, "ax": 10, "ay": 4, "w": -120, "bx": 8, "by": 10, "w2": -60, "f1x": 28, "f2x": -26}, "out"],
				[0.58, {"ax": 30, "ay": 14, "w": 25}, "in"],
				[0.72, {"bx": 30, "by": 12, "w2": 30, "ax": 6, "ay": -4, "w": -110}, "in"],
				[0.86, {"ax": 30, "ay": 14, "w": 25, "bx": 6, "by": -2, "w2": -100}, "in"],
				[1.00, {"hy": -58, "lean": -2, "head": -6, "ax": 2, "ay": -26, "w": -100, "bx": 0, "by": -26, "w2": -80, "f1x": 26, "f2x": -26}, "out"],
				[1.42, {"lean": -4, "ay": -28, "by": -28}, "lin"],
				[1.56, {"hy": -48, "lean": 30, "head": -18, "ax": 32, "ay": 18, "w": 40, "bx": 28, "by": 22, "w2": 50, "f1x": 40, "f2x": -22}, "in"],
				[1.70, {"w": 46, "w2": 56}, "out"],
				[2.90, BASE, "io"],
			]),
			"hits": [
				{"t0": 0.52, "t1": 0.60, "w": "A", "dmg": 8, "knock": "small", "guard": 14},
				{"t0": 0.66, "t1": 0.74, "w": "B", "dmg": 8, "knock": "small", "guard": 14},
				{"t0": 0.80, "t1": 0.88, "w": "A", "dmg": 8, "knock": "small", "guard": 14},
				{"t0": 1.46, "t1": 1.60, "w": "AB", "dmg": 14, "knock": "down", "guard": 24},
			],
			"moves": [{"t0": 0.50, "t1": 0.90, "d": 40}, {"t0": 1.42, "t1": 1.58, "d": 30}],
			"commit": 0.44, "act": 2.90, "cancel": 1.9, "atk": true,
		},
		# low dash that cuts through you and ends behind you
		"dash": {
			"an": Core.mk(DB, [
				[0, {}],
				[0.48, {"hy": -42, "lean": 40, "head": -26, "ax": -6, "ay": 18, "w": 170, "bx": -16, "by": 22, "w2": 175, "ea": -1, "f1x": 30, "f2x": -30}, "out"],
				[0.58, {"hy": -44, "lean": 44, "ax": 28, "ay": 18, "w": 5, "ea": 1, "f1x": 34, "f2x": -34}, "in"],
				[0.74, {"ax": 30, "ay": 10, "w": -20, "bx": 20, "by": 20, "w2": 30}, "out"],
				[1.00, {"hy": -48, "lean": 20}, "out"],
				[1.60, BASE, "io"],
			]),
			"hits": [{"t0": 0.56, "t1": 0.74, "w": "A", "dmg": 12, "knock": "small", "guard": 20}],
			"moves": [{"t0": 0.50, "t1": 0.76, "d": 280, "e": "out2", "adapt": [-120, 160, 320]}],
			"commit": 0.46, "act": 1.60, "cancel": 1.0, "atk": true,
		},
		# both blades drawn back, a fixed long hold, then a lunging double thrust
		"thrustD": {
			"an": Core.mk(DB, [
				[0, {}],
				[0.45, {"hy": -52, "lean": -4, "head": -6, "ax": -18, "ay": 6, "w": 8, "bx": -22, "by": 12, "w2": 12, "ea": -1, "eb": -1, "f1x": 22, "f2x": -36}, "out"],
				[1.20, {"ax": -20, "ay": 7, "bx": -24, "by": 13, "lean": -6}, "lin"],
				[1.34, {"hy": -46, "lean": 34, "head": -22, "ax": 40, "ay": 12, "w": 4, "bx": 36, "by": 16, "w2": 8, "ea": 1, "eb": 1, "f1x": 40, "f2x": -26}, "in"],
				[1.50, {"ax": 42, "ay": 14}, "out"],
				[2.40, BASE, "io"],
			]),
			"hits": [{"t0": 1.26, "t1": 1.46, "w": "AB", "dmg": 14, "knock": "down", "guard": 26}],
			"moves": [{"t0": 1.22, "t1": 1.40, "d": 160, "e": "out2", "adapt": [90, 30, 220]}],
			"commit": 1.12, "act": 2.40, "cancel": 1.7, "atk": true,
		},
		# leaping X-slash: can't be parried (like souls jump attacks); long opening on landing
		"aerial": {
			"an": Core.mk(DB, [
				[0, {}],
				[0.42, {"hy": -40, "lean": 30, "head": -20, "ax": 10, "ay": 24, "w": 120, "bx": 0, "by": 26, "w2": 140, "f1x": 24, "f2x": -26}, "out"],
				[0.52, {"hy": -64, "lean": 6, "ax": 2, "ay": -22, "w": -100, "bx": -6, "by": -20, "w2": -80, "f1x": 14, "f1y": -14, "f2x": -10, "f2y": -8}, "out"],
				[0.84, {"hy": -62, "lean": -6, "ax": -6, "ay": -30, "w": -120, "bx": -10, "by": -28, "w2": -100, "f1x": 14, "f1y": -22, "f2x": -12, "f2y": -16}, "out"],
				[1.04, {"hy": -44, "lean": 34, "head": -20, "ax": 30, "ay": 22, "w": 50, "bx": 26, "by": 26, "w2": 60, "f1x": 30, "f1y": 0, "f2x": -24, "f2y": 0}, "in"],
				[1.12, {"w": 56, "w2": 66}, "out"],
				[2.00, {"hy": -46, "lean": 30}, "lin"],
				[2.45, BASE, "io"],
			]),
			"hits": [{"t0": 0.90, "t1": 1.08, "w": "AB", "dmg": 16, "knock": "down", "guard": 30, "noParry": true}],
			"events": [{"t": 1.04, "ev": "land"}],
			"leap": {"t0": 0.50, "t1": 1.04, "h": 110, "lead": 40},
			"commit": 0.44, "act": 2.45, "cancel": 1.6, "atk": true,
		},
		# hop away: shakes off a player glued to it, or escapes a near poise break
		"backstep": {
			"an": Core.mk(DB, [
				[0, {}],
				[0.08, {"hy": -48, "lean": 20}, "out"],
				[0.30, {"hy": -56, "lean": -10, "f1x": 18, "f1y": -10, "f2x": -26, "f2y": -6}, "out"],
				[0.42, {"hy": -52, "lean": 10, "f1y": 0, "f2y": 0}, "in"],
				[0.62, BASE, "io"],
			]),
			"moves": [{"t0": 0.06, "t1": 0.40, "d": -130, "e": "out2"}],
			"act": 0.62, "cancel": 0.45,
		},
		# phase 2: blades orbit like a saw while it spins forward through you (3 hits)
		"whirl": {
			"an": Core.mk(DB, [
				[0, {}],
				[0.50, {"hy": -46, "lean": 16, "head": -10, "ax": -10, "ay": 20, "w": 200, "bx": 24, "by": 18, "w2": 20, "f1x": 28, "f2x": -28}, "out"],
				[0.70, {"ax": 28, "ay": 14, "w": 330, "bx": -16, "by": 14, "w2": 150}, "lin"],
				[0.90, {"ax": -14, "ay": 14, "w": 470, "bx": 28, "by": 14, "w2": 290}, "lin"],
				[1.10, {"ax": 28, "ay": 14, "w": 610, "bx": -16, "by": 14, "w2": 430}, "lin"],
				[1.30, {"ax": -14, "ay": 14, "w": 750, "bx": 28, "by": 14, "w2": 570}, "lin"],
				[1.50, {"hy": -50, "lean": 10, "ax": 22, "ay": 22, "w": 695, "bx": 2, "by": 30, "w2": 510}, "out"],
				[2.50, BASE, "io", {"w": 695, "w2": 510}],
			]),
			"hits": [
				{"t0": 0.55, "t1": 0.72, "w": "AB", "dmg": 9, "knock": "small", "guard": 16},
				{"t0": 0.86, "t1": 1.02, "w": "AB", "dmg": 9, "knock": "small", "guard": 16},
				{"t0": 1.16, "t1": 1.32, "w": "AB", "dmg": 9, "knock": "small", "guard": 16},
			],
			"moves": [{"t0": 0.50, "t1": 1.35, "d": 260, "e": "lin", "adapt": [-100, 120, 320]}],
			"commit": 0.46, "act": 2.50, "cancel": 1.7, "atk": true,
		},
		"turn": {
			"an": Core.mk(DB, [[0, {}], [0.10, {"hy": -50, "lean": 6, "f1y": -8}, "out"], [0.26, BASE, "io"]]),
			"events": [{"t": 0.11, "ev": "flip"}], "act": 0.26,
		},
		# phase 2 transition: crosses its blades and flings them wide (pushes you back)
		"rally": {
			"an": Core.mk(DB, [
				[0, {}],
				[0.35, {"hy": -50, "lean": 26, "head": 6, "ax": 10, "ay": 10, "w": -60, "bx": 14, "by": 8, "w2": -120}, "out"],
				[0.60, {"hy": -58, "lean": -10, "head": -30, "ax": 30, "ay": -26, "w": -40, "bx": -20, "by": -26, "w2": -140}, "out"],
				[1.10, {"lean": -8, "head": -28}, "lin"],
				[1.40, BASE, "io"],
			]),
			"events": [{"t": 0.6, "ev": "rally"}], "act": 1.4, "noPoise": true,
		},
		"stagger": {
			"an": Core.mk(DB, [[0, {}], [0.16, KNEEL_D, "out"], [1.9, {"hy": -33, "lean": 52, "head": 10}, "lin"], [2.2, BASE, "io"]]),
			"act": 2.2, "noPoise": true, "critable": true,
		},
		"reel": {
			"an": Core.mk(DB, [
				[0, {}],
				[0.14, {"hy": -56, "lean": -18, "head": -30, "ax": -10, "ay": -30, "w": -140, "bx": -14, "by": -26, "w2": -160, "f1x": 18, "f2x": -26}, "out"],
				[0.50, {"hy": -44, "lean": 30, "head": 0, "ax": 16, "ay": 30, "w": 80, "bx": 20, "by": 32, "w2": 100, "f1x": 28, "f2x": -24}, "io"],
				[1.15, {"hy": -45, "lean": 32}, "lin"],
				[1.40, BASE, "io"],
			]),
			"act": 1.4, "noPoise": true, "critable": true,
		},
		"critHit": {
			"an": Core.mk(DB, [
				[0, {}],
				[0.52, Core.M(KNEEL_D, {"lean": 46, "head": 0}), "lin"],
				[0.62, {"hy": -38, "lean": 24, "head": -30, "ax": 6, "ay": 20, "w": 60, "bx": 16, "by": 6, "w2": 120}, "out"],
				[1.12, {"lean": 22, "head": -34}, "lin"],
				[1.40, {"hy": -28, "lean": 66, "head": 20, "ax": 24, "ay": 30, "w": 90, "bx": 28, "by": 34, "w2": 100}, "out"],
				[2.20, {"hy": -32, "lean": 60}, "lin"],
				[2.80, BASE, "io"],
			]),
			"act": 2.8, "noPoise": true,
		},
		"dead": {
			"an": Core.mk(DB, [
				[0, {}],
				[0.3, KNEEL_D, "out"],
				[1.1, {"hy": -33, "lean": 56, "head": 10}, "lin"],
				[1.7, {"rot": 90, "oy": 26, "hy": -62, "lean": 4, "head": 4, "f1x": 6, "f2x": -4, "f1y": 0, "f2y": 0, "ax": 20, "ay": 30, "w": 70, "bx": 24, "by": 24, "w2": 100}, "in2"],
				[1.9, {"oy": 27}, "out"],
				[9, {}, "lin"],
			]),
			"noPoise": true,
		},
	}


# ---------------------------------------------------------------- tuning hooks
func hp() -> float:
	return T.d.hp


func poise() -> float:
	return T.d.poise


func walk() -> float:
	return T.d.walk


func approach() -> float:
	return T.d.approach


func speed2() -> float:
	return T.d.speed2


func cd() -> Dictionary:
	return {"aerial": 2.0, "whirl": 0.0, "backstep": 0.0}


func onBegin(nm: String) -> void:
	var B: Dictionary = G.B
	if nm == "aerial":
		B.cd.aerial = T.d.cdAerial
	if nm == "whirl":
		B.cd.whirl = T.d.cdWhirl
	if nm == "backstep":
		B.cd.backstep = T.d.cdBackstep
		if B.poise < G.maxPoise() * 0.3:
			B.poise = G.maxPoise() * 0.5   # escaping the break resets part of its poise


func pause() -> float:
	return G.rnd(0.05, 0.3) if G.B.phase2 else G.rnd(0.15, 0.45)


# ---------------------------------------------------------------- body, AI, events, walk
func caps(S: Dictionary) -> Array:
	return [
		[S.hip, S.sh, 11.0], [S.sh, S.hd, 10.0],
		[S.hip, S.k1, 7.0], [S.k1, S.f1, 6.0], [S.hip, S.k2, 7.0], [S.k2, S.f2, 6.0],
		[S.sh, S.eA, 5.0], [S.eA, S.hA, 5.0], [S.sh, S.eB, 5.0], [S.eB, S.hB, 5.0],
	]


func decide() -> void:
	var P: Dictionary = G.P
	var B: Dictionary = G.B
	if P.state == "dead":
		B.wait = 1.0
		return
	if B.pending2:
		G.bossPhase2("rally")
		return
	var dx: float = P.x - B.x
	var d: float = absf(dx)
	var front: bool = dx * B.face > 0.0
	if not front and d > 20.0:
		G.bBegin("turn")
		return
	# escape a near poise break, or shake off a player standing on top of it
	if B.cd.backstep <= 0.0 and d < 110.0 and (B.poise < G.maxPoise() * 0.3 or B.glueT > 0.6):
		B.queue = ["dash"] if randf() < 0.5 else []
		G.bBegin("backstep")
		return
	var o := []
	var add := func(n: String, w: float) -> void:
		if B.last.size() >= 2 and B.last[0] == n and B.last[1] == n:
			return
		o.append([n, w])
	if d < 200.0:
		add.call("twin", 3.0)
		add.call("flurry", 2.0)
	if d > 80.0 and d < 300.0:
		add.call("thrustD", 1.5)
	if d > 140.0 and d < 420.0:
		add.call("dash", 3.0)
	if d > 160.0 and B.cd.aerial <= 0.0:
		add.call("aerial", 2.0)
	if B.phase2 and d < 320.0 and B.cd.whirl <= 0.0:
		add.call("whirl", 3.0)
	if o.is_empty():
		B.wait = 0.15
		return
	var n: String = G.pick(o)
	B.queue = G.pickString(n, DSTR1, DSTR2, T.d.strings)
	G.bBegin(n, false)


func punish() -> void:
	var P: Dictionary = G.P
	var B: Dictionary = G.B
	var dx: float = P.x - B.x
	var d: float = absf(dx)
	if dx * B.face < 0.0:
		G.bBegin("turn")
		return
	B.queue = []
	if d < 200.0:
		G.bBegin("twin")
	elif d < 420.0 or B.cd.aerial > 0.0:
		G.bBegin("dash")
	else:
		G.bBegin("aerial")


func event(ev: String) -> void:
	var B: Dictionary = G.B
	if ev == "land":
		var x: float = B.x + B.face * 30.0
		G.dust(x, 10, 26.0)
		G.shake(6.0)
		Snd.sStep(x, 1.0)
	elif ev == "rally":
		G.addWave(B.x, 220.0, 0.0, "push", {"ring": B.S.hd})
		G.shake(6.0)
		Snd.sClang(B.x)
		Snd.sWhoosh(B.x, true)


func loco(dt: float) -> void:
	var B: Dictionary = G.B
	var DB := base
	var v: float = B.vx * B.face
	var S := 16.0
	B.moveBlend = G.approach(B.moveBlend, clampf(absf(B.vx) / 120.0, 0.0, 1.0), dt * 6.0)
	var before := floorf(B.walkP * 2.0)
	B.walkP += v * dt / (4.0 * S)
	if floorf(B.walkP * 2.0) != before and B.moveBlend > 0.4:
		Snd.sStep(B.x, 0.25)
	var m: float = B.moveBlend
	var p: Dictionary = Core.copyPose(DB, B.pose)
	var g1: Vector2 = Core.gait(B.walkP, S, 10.0)
	var g2: Vector2 = Core.gait(B.walkP + 0.5, S, 10.0)
	var q: float = B.walkP * 2.0 * PI
	var clock: float = G.clock
	p.f1x = lerpf(DB.f1x, 8.0 + g1.x, m)
	p.f1y = -g1.y * m
	p.f2x = lerpf(DB.f2x, -8.0 + g2.x, m)
	p.f2y = -g2.y * m
	p.hy = DB.hy + (0.5 + 0.5 * cos(2.0 * q)) * 3.0 * m + sin(clock * 2.2) * 1.2 * (1.0 - m)
	p.lean = DB.lean + sin(clock * 2.2 + 0.4) * 1.2 + 6.0 * m
	p.w = DB.w + sin(clock * 2.0) * 3.0
	p.w2 = DB.w2 + sin(clock * 2.0 + 1.0) * 4.0


func drawCurvedBlade(cv, h: Vector2, t: Vector2, alpha: float) -> void:
	var C: Dictionary = T.C
	var dv: Vector2 = t - h
	var u: Vector2 = dv.normalized()
	var f: float = G.B.face
	var c: Vector2 = h + dv * 0.55 + Vector2(-u.y, u.x) * 7.0 * f
	var blade: Color = C.duelBlade
	cv.curve(h, c, t, Color(blade, alpha), 2.6, false)
	var hilt: Color = C.hilt
	var n := Vector2(-u.y, u.x)
	cv.line(h + n * 5.0 + u * 2.0, h - n * 5.0 + u * 2.0, Color(hilt, alpha), 2.4)


func draw(cv, S: Dictionary, c: Color) -> void:
	var B: Dictionary = G.B
	var C: Dictionary = T.C
	var back: Color = c.lerp(C.bg, 0.5)
	cv.path([S.hip, S.k2, S.f2], back, R.line)
	cv.path([S.sh, S.eB, S.hB], back, R.line)
	drawCurvedBlade(cv, S.hB, S.wt2, 0.8)
	cv.path([S.hip, S.sh, S.nk], c, R.line)
	# scarf trailing from the neck
	var hd: Vector2 = S.hd
	var up: Vector2 = S.up
	var fw: Vector2 = S.fw
	var nk: Vector2 = S.nk
	var wv: float = sin(G.clock * 9.0) * 3.0 - B.vx * B.face * 0.02
	var scarf: Color = C.bossFlash if B.flash > 0.0 else C.scarf
	cv.curve(nk, nk - fw * 12.0 + up * 4.0, nk - fw * 26.0 - up * (2.0 + wv), scarf, 3.5)
	cv.head(hd, R.headR, c, 4.0)
	if B.state != "dead":   # a single eye slit
		var ep: Vector2 = hd + fw * 5.0 + up * 1.5
		if B.phase2:
			cv.glow(ep, 2.5, C.duelEye)
		cv.path([ep - fw * 2.5, ep + fw * 2.5], C.duelEye, 2.0)
	cv.path([S.hip, S.k1, S.f1], c, R.line)
	drawCurvedBlade(cv, S.hA, S.wt, 1.0)
	cv.path([S.sh, S.eA, S.hA], c, R.line)
