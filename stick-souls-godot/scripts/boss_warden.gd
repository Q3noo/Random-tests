extends RefCounted
## Stick Souls — the Gaunt Warden: rig, moves, AI and drawing. Ported 1:1 from stick-souls/js/boss-warden.js.

var id := "warden"
var name := "Gaunt Warden"
var blurb := "A towering brute with a stone club. Slow, heavy, punishing."
var R := {"thigh": 58.0, "shin": 58.0, "spine": 86.0, "neck": 10.0, "headR": 18.0, "upper": 56.0, "fore": 56.0,
	"grip": 0.0, "pommel": 16.0, "wlen": 128.0, "wlen2": 0.0, "pvx": 0.0, "pvy": -50.0, "line": 8.5}
var base := {"hx": 0, "hy": -100, "lean": 24, "head": -14, "ax": 30, "ay": 68, "bx": 46, "by": 52, "w": 58, "w2": 0, "th": 0,
	"ea": 1, "eb": 1, "f1x": 42, "f1y": 0, "f2x": -46, "f2y": 0, "rot": 0, "ox": 0, "oy": 0}
var mc := {"walk": 80.0, "leanV": 3.0, "lean": [6.0, 0.45], "head": [16.0, 0.5], "arm": [9.0, 0.35, 0.12], "thr": 24.0, "reach": 70.0, "dur": 0.2, "lift": 16.0}
var moves := {}
var weaponR := 9.0
var col: Color = T.C.boss
var col2: Color = T.C.boss2
var trailCol := Color8(220, 200, 178)
var startX := 1000.0
var edge := 70.0
var walkAccel := 260.0
var turnDelay := 0.3
var heavyWhoosh := true
var critDist := 92.0
var critRange := [30.0, 170.0]
var punishReach := 520.0
var stepW := 0.6

# attack strings; the last attack of a string always leaves a long opening
const STRINGS1 := {"upswing": [["smash"]], "thrust": [["upswing"]]}
const STRINGS2 := {
	"upswing": [["smash"], ["thrust", "smash"]], "smash": [["smashD"]],
	"thrust": [["upswing"], ["upswing", "smash"]], "leap": [["stomp"]],
}


func _init() -> void:
	var BB := base
	var BASE: String = Core.BASE
	var KNEEL := {"hy": -62, "lean": 56, "head": 6, "ax": 30, "ay": 70, "w": 85, "bx": 50, "by": 66, "f1x": 50, "f1y": 0, "f2x": -30, "f2y": 0}
	# commit = moment the boss stops re-aiming (it turns to follow you until then)
	moves = {
		"smash": {
			"an": Core.mk(BB, [
				[0, {}],
				[0.75, {"hy": -106, "lean": 0, "head": -6, "ax": -14, "ay": -86, "w": -115, "bx": 40, "by": -20, "f1x": 46, "f2x": -44}, "out"],
				[1.0, {"lean": -4, "ay": -90, "w": -121}, "lin"],
				[1.16, {"hy": -86, "lean": 38, "head": -20, "ax": 70, "ay": 62, "w": 34, "bx": 50, "by": 40, "f1x": 70, "f2x": -44}, "in"],
				[1.26, {"w": 40, "ay": 64}, "out"],
				[2.0, {"w": 38, "lean": 34, "hy": -90}, "lin"],
				[2.25, BASE, "out", {"lean": 17, "hy": -104, "w": 48, "ay": 62}],
				[2.4, BASE, "io"],
			]),
			"hits": [{"t0": 1.02, "t1": 1.2, "dmg": 30, "knock": "down", "guard": 45}],
			"events": [{"t": 1.16, "ev": "smash"}],
			"moves": [{"t0": 0.95, "t1": 1.15, "d": 50, "adapt": [200, 0, 80]}],
			"commit": 0.85, "act": 2.4, "cancel": 1.5, "atk": true,
		},
		# low scoop from behind, up through the front: punishes hugging and standing underneath
		"upswing": {
			"an": Core.mk(BB, [
				[0, {}],
				[0.6, {"hy": -92, "lean": 30, "head": -16, "ax": -50, "ay": 80, "w": 140, "ea": -1, "bx": 40, "by": 30, "f1x": 50, "f2x": -40}, "out"],
				[0.68, {"ay": 82, "w": 142}, "lin"],
				[0.84, {"ax": 60, "ay": -40, "w": -55, "lean": 10, "hy": -100, "head": -10, "f1x": 54, "ea": 1}, "in"],
				[0.96, {"ax": 50, "ay": -62, "w": -82}, "out"],
				[1.55, BASE, "out", {"lean": 29, "hy": -96, "w": 68, "ay": 72}],
				[1.75, BASE, "io"],
			]),
			"hits": [{"t0": 0.69, "t1": 0.9, "dmg": 22, "knock": "down", "guard": 35}],
			"moves": [{"t0": 0.66, "t1": 0.84, "d": 30, "adapt": [90, 0, 60]}],
			"commit": 0.52, "act": 1.75, "cancel": 1.05, "atk": true,
		},
		# coiled lunge that closes distance
		"thrust": {
			"an": Core.mk(BB, [
				[0, {}],
				[0.7, {"hy": -94, "lean": -6, "head": -4, "ax": -36, "ay": 14, "w": 22, "ea": -1, "bx": 30, "by": 10, "f1x": 30, "f2x": -64}, "out"],
				[0.84, {"ax": -40, "ay": 16}, "lin"],
				[1.02, {"hy": -80, "lean": 40, "head": -28, "ax": 95, "ay": 40, "w": 18, "ea": 1, "bx": -10, "by": 60, "f1x": 80, "f2x": -60}, "in"],
				[1.2, {"ax": 100, "ay": 44, "w": 22}, "out"],
				[1.9, BASE, "out", {"lean": 18, "hy": -104}],
				[2.1, BASE, "io"],
			]),
			"hits": [{"t0": 0.88, "t1": 1.1, "dmg": 24, "knock": "down", "guard": 35}],
			"moves": [{"t0": 0.84, "t1": 1.04, "d": 240, "e": "out2", "adapt": [170, 40, 320]}],
			"commit": 0.72, "act": 2.1, "cancel": 1.4, "atk": true,
		},
		# jump onto the player's position, club first, with a landing shockwave
		"leap": {
			"an": Core.mk(BB, [
				[0, {}],
				[0.58, {"hy": -70, "lean": 40, "head": -30, "ax": -24, "ay": 40, "w": 150, "ea": -1, "bx": -10, "by": 56, "f1x": 40, "f2x": -50}, "out"],
				[0.66, {"hy": -104, "lean": 10, "head": -14, "ax": -10, "ay": -20, "w": 200, "f1x": 30, "f1y": -20, "f2x": -30, "f2y": -10}, "out"],
				[0.9, {"lean": -6, "head": -6, "ax": -12, "ay": -88, "w": 248, "ea": 1, "bx": 36, "by": -30, "f1x": 34, "f1y": -36, "f2x": -26, "f2y": -24}, "out"],
				[1.2, {"hy": -80, "lean": 38, "head": -20, "ax": 70, "ay": 62, "w": 396, "bx": 50, "by": 40, "f1x": 66, "f1y": 0, "f2x": -44, "f2y": 0}, "in"],
				[1.3, {"w": 400, "ay": 64}, "out"],
				[2.05, {"w": 398, "lean": 34, "hy": -86}, "lin"],
				[2.3, BASE, "out", {"lean": 17, "hy": -104, "w": 408, "ay": 62}],
				[2.45, BASE, "io", {"w": 418}],
			]),
			"hits": [{"t0": 1.04, "t1": 1.22, "dmg": 30, "knock": "down", "guard": 50}],
			"events": [{"t": 1.2, "ev": "leap"}],
			"leap": {"t0": 0.62, "t1": 1.2, "h": 140},
			"commit": 0.55, "act": 2.45, "cancel": 1.6, "atk": true,
		},
		# stomp shockwave on both sides: answers a player who is under or behind
		"stomp": {
			"an": Core.mk(BB, [
				[0, {}],
				[0.55, {"hy": -108, "lean": 8, "head": -8, "ax": 20, "ay": 40, "w": 70, "bx": 56, "by": -14, "f1x": 34, "f1y": -66, "f2x": -34}, "out"],
				[0.68, {"f1y": -70, "hy": -110}, "lin"],
				[0.77, {"hy": -90, "lean": 28, "head": -18, "f1x": 38, "f1y": 0, "ax": 28, "ay": 62, "bx": 50, "by": 44}, "in"],
				[1.28, BASE, "out", {"lean": 19, "hy": -104}],
				[1.45, BASE, "io"],
			]),
			"events": [{"t": 0.76, "ev": "stomp"}],
			"act": 1.45, "cancel": 1.0, "atk": true,
		},
		# phase 2 area attack: club driven into the ground, three rings of eruptions travel outward
		"quake": {
			"an": Core.mk(BB, [
				[0, {}],
				[0.8, {"hy": -106, "lean": -2, "head": -8, "ax": -10, "ay": -92, "w": -100, "bx": 30, "by": -40, "f1x": 46, "f2x": -44}, "out"],
				[1.0, {"hy": -84, "lean": 40, "head": -22, "ax": 62, "ay": 70, "w": 60, "bx": 50, "by": 50, "f1x": 60, "f2x": -46}, "in"],
				[1.7, {"hy": -86, "lean": 38}, "lin"],
				[2.3, BASE, "out", {"lean": 17, "hy": -104}],
				[2.6, BASE, "io"],
			]),
			"events": [{"t": 1.0, "ev": "quake1"}, {"t": 1.18, "ev": "quake2"}, {"t": 1.36, "ev": "quake3"}],
			"act": 2.6, "cancel": 2.0, "atk": true,
		},
		"turn": {
			"an": Core.mk(BB, [[0, {}], [0.2, {"hy": -90, "lean": 14, "f1y": -14, "f2x": -40}, "out"], [0.55, BASE, "io"]]),
			"events": [{"t": 0.22, "ev": "flip"}], "act": 0.55,
		},
		# phase 2 transition
		"roar": {
			"an": Core.mk(BB, [
				[0, {}],
				[0.45, {"hy": -92, "lean": 44, "head": 10, "ax": 10, "ay": 70, "w": 80, "bx": 20, "by": 70}, "out"],
				[0.7, {"hy": -106, "lean": -14, "head": -36, "ax": 40, "ay": -70, "w": -70, "bx": 60, "by": -60, "f1x": 46, "f2x": -46}, "out"],
				[1.3, {"lean": -12, "head": -34, "ay": -72}, "lin"],
				[1.7, BASE, "io"],
			]),
			"events": [{"t": 0.7, "ev": "roar"}], "act": 1.7, "noPoise": true,
		},
		# poise broken: kneels, takes extra damage, open to a critical hit
		"stagger": {
			"an": Core.mk(BB, [[0, {}], [0.18, KNEEL, "out"], [1.9, {"hy": -60, "lean": 58, "head": 8}, "lin"], [2.2, BASE, "io"]]),
			"act": 2.2, "noPoise": true, "critable": true,
		},
		# parried: thrown off balance, open to a critical hit
		"reel": {
			"an": Core.mk(BB, [
				[0, {}],
				[0.15, {"hy": -96, "lean": -16, "head": -30, "ax": -20, "ay": -60, "w": -130, "bx": 40, "by": -30, "f1x": 30, "f2x": -50}, "out"],
				[0.5, {"hy": -80, "lean": 30, "head": 0, "ax": 20, "ay": 60, "w": 80, "bx": 50, "by": 60, "f1x": 46, "f2x": -40}, "io"],
				[1.15, {"hy": -82, "lean": 32}, "lin"],
				[1.4, BASE, "io"],
			]),
			"act": 1.4, "noPoise": true, "critable": true,
		},
		# receiving a critical hit
		"critHit": {
			"an": Core.mk(BB, [
				[0, {}],
				[0.52, Core.M(KNEEL, {"lean": 50, "head": 0}), "lin"],
				[0.62, {"hy": -66, "lean": 30, "head": -30, "bx": 30, "by": 10, "ax": 10, "ay": 40, "w": 70}, "out"],
				[1.12, {"lean": 28, "head": -34}, "lin"],
				[1.40, {"hy": -50, "lean": 70, "head": 20, "bx": 50, "by": 60, "ax": 40, "ay": 50, "w": 90}, "out"],
				[2.2, {"hy": -56, "lean": 62}, "lin"],
				[2.8, BASE, "io"],
			]),
			"act": 2.8, "noPoise": true,
		},
		"dead": {
			"an": Core.mk(BB, [
				[0, {}],
				[0.3, KNEEL, "out"],
				[1.1, {"hy": -60, "lean": 60, "head": 10}, "lin"],
				[1.7, {"rot": 90, "oy": 38, "hy": -112, "lean": 4, "head": 4, "f1x": 8, "f2x": -6, "f1y": 0, "f2y": 0, "ax": 34, "ay": 50, "w": 70, "bx": 40, "by": 40}, "in2"],
				[1.9, {"oy": 40}, "out"],
				[9, {}, "lin"],
			]),
			"noPoise": true,
		},
	}
	# fixed delayed versions: same wind-up, much longer hold at the top
	moves["smashD"] = Core.shifted(moves.smash, 0.75, 0.68)
	moves["thrustD"] = Core.shifted(moves.thrust, 0.7, 0.45)


# ---------------------------------------------------------------- tuning hooks
func hp() -> float:
	return T.b.hp


func poise() -> float:
	return T.b.poise


func walk() -> float:
	return T.b.walk


func approach() -> float:
	return T.b.approach


func speed2() -> float:
	return T.b.speed2


func cd() -> Dictionary:
	return {"leap": 3.0, "stomp": 0.0, "quake": 2.0}


func onBegin(nm: String) -> void:
	var B: Dictionary = G.B
	if nm == "leap":
		B.cd.leap = T.b.cdLeap
	if nm == "stomp":
		B.cd.stomp = T.b.cdStomp
	if nm == "quake":
		B.cd.quake = T.b.cdQuake


func pause() -> float:
	return G.rnd(0.1, 0.4) if G.B.phase2 else G.rnd(0.25, 0.6)


# ---------------------------------------------------------------- body, AI, events, walk
func caps(S: Dictionary) -> Array:
	return [
		[S.hip, S.sh, 22.0], [S.sh, S.hd, 18.0],
		[S.hip, S.k1, 13.0], [S.k1, S.f1, 11.0], [S.hip, S.k2, 13.0], [S.k2, S.f2, 11.0],
		[S.sh, S.eA, 10.0], [S.eA, S.hA, 9.0], [S.sh, S.eB, 9.0], [S.eB, S.hB, 8.0],
	]


func decide() -> void:
	var P: Dictionary = G.P
	var B: Dictionary = G.B
	if P.state == "dead":
		B.wait = 1.0
		return
	if B.pending2:
		G.bossPhase2("roar")
		return
	var dx: float = P.x - B.x
	var d: float = absf(dx)
	var front: bool = dx * B.face > 0.0
	if not front and d > 30.0:
		G.bBegin("stomp" if (d < 170.0 and B.cd.stomp <= 0.0) else "turn")
		return
	var o := []
	var add := func(n: String, w: float) -> void:
		if B.last.size() >= 2 and B.last[0] == n and B.last[1] == n:
			return
		o.append([n, w])
	if d < 120.0 and B.cd.stomp <= 0.0:
		add.call("stomp", 2.0)
	if d < 175.0:
		add.call("upswing", 3.0)
	if d > 70.0 and d < 320.0:
		add.call("smash", 3.0)
	if d > 190.0 and d < 520.0:
		add.call("thrust", 2.0)
	if d > (300.0 if B.phase2 else 380.0) and B.cd.leap <= 0.0:
		add.call("leap", 6.0 if d > 520.0 else 2.0)
	if B.phase2 and d < 360.0 and B.cd.quake <= 0.0:
		add.call("quake", 2.0)
	if o.is_empty():
		B.wait = 0.25
		return
	var n: String = G.pick(o)
	B.queue = G.pickString(n, STRINGS1, STRINGS2, T.b.strings)
	var start := n
	if n == "smash" and randf() < (0.6 if B.phase2 else 0.45):
		start = "smashD"
	if n == "thrust" and randf() < (0.45 if B.phase2 else 0.3):
		start = "thrustD"
	G.bBegin(start, false)


## punish a heal started within reach
func punish() -> void:
	var P: Dictionary = G.P
	var B: Dictionary = G.B
	var dx: float = P.x - B.x
	var d: float = absf(dx)
	if dx * B.face < 0.0:
		G.bBegin("turn")
		return
	B.queue = []
	if d < 175.0:
		G.bBegin("upswing")
	elif d < 520.0:
		G.bBegin("thrust")
	elif B.cd.leap <= 0.0:
		G.bBegin("leap")


func event(ev: String) -> void:
	var B: Dictionary = G.B
	var S: Dictionary = B.S
	var stopped: bool = B.stoppedSwing == B.swingId   # the club was blocked: its impact wave can't hurt
	if ev == "smash":
		G.addWave(S.wt.x, 85.0, 10.0, "small", {"src": B.x, "harmless": stopped})
		G.shake(10.0)
		G.dust(S.wt.x, 14, 30.0)
		Snd.sImpact(S.wt.x, 1.0)
	elif ev == "leap":
		var x: float = B.x + B.face * 70.0
		G.addWave(x, 210.0, 14.0, "small", {"src": B.x, "harmless": stopped})
		G.shake(16.0)
		G.dust(x, 26, 90.0)
		Snd.sQuake(x)
	elif ev == "stomp":
		G.addWave(S.f1.x, 140.0, 12.0, "small", {"src": B.x})
		G.shake(9.0)
		G.dust(S.f1.x, 16, 40.0)
		Snd.sQuake(S.f1.x)
	elif ev == "roar":
		G.addWave(B.x, 320.0, 0.0, "push", {"ring": S.hd})
		G.shake(12.0)
		Snd.sRoar(B.x)
	elif ev.begins_with("quake"):
		var i := int(ev.substr(5))
		var r0: float = [0.0, 130.0, 240.0][i - 1]
		var r1: float = [140.0, 250.0, 370.0][i - 1]
		if i == 1:
			G.waveGroup += 1
		G.addWave(B.x, r1, 14.0, "small", {"r0": r0, "group": G.waveGroup, "src": B.x})
		G.shake(8.0 + 3.0 * i)
		Snd.sQuake(B.x)
		G.dust(B.x - r1 + 20.0, 8, 20.0)
		G.dust(B.x + r1 - 20.0, 8, 20.0)


func loco(dt: float) -> void:
	var B: Dictionary = G.B
	var BB := base
	var v: float = B.vx * B.face
	var S := 30.0
	B.moveBlend = G.approach(B.moveBlend, clampf(absf(B.vx) / 80.0, 0.0, 1.0), dt * 4.0)
	var before := floorf(B.walkP * 2.0)
	B.walkP += v * dt / (4.0 * S)
	if floorf(B.walkP * 2.0) != before and B.moveBlend > 0.4:
		Snd.sStep(B.x, 0.8)
	var m: float = B.moveBlend
	var p: Dictionary = Core.copyPose(BB, B.pose)
	var g1: Vector2 = Core.gait(B.walkP, S, 20.0)
	var g2: Vector2 = Core.gait(B.walkP + 0.5, S, 20.0)
	var q: float = B.walkP * 2.0 * PI
	var clock: float = G.clock
	p.f1x = lerpf(BB.f1x, 10.0 + g1.x, m)
	p.f1y = -g1.y * m
	p.f2x = lerpf(BB.f2x, -14.0 + g2.x, m)
	p.f2y = -g2.y * m
	p.hy = BB.hy + (0.5 + 0.5 * cos(2.0 * q)) * 5.0 * m + sin(clock * 1.7) * 2.0 * (1.0 - m)
	p.lean = BB.lean + sin(clock * 1.7 + 0.4) * 1.5
	p.ay = BB.ay + sin(2.0 * q) * 3.0 * m + sin(clock * 1.7) * 1.5
	p.w = BB.w + sin(q) * 4.0 * m
	p.by = BB.by + sin(q + 1.0) * 6.0 * m


func draw(cv, S: Dictionary, c: Color) -> void:
	var B: Dictionary = G.B
	var C: Dictionary = T.C
	var back: Color = c.lerp(C.bg, 0.5)
	cv.path([S.hip, S.k2, S.f2], back, R.line)
	cv.path([S.sh, S.eB, S.hB], back, R.line)
	cv.claws(S.eB, S.hB, back, 4.0)
	cv.path([S.hip, S.sh, S.nk], c, R.line)
	var hd: Vector2 = S.hd
	var up: Vector2 = S.up
	var fw: Vector2 = S.fw
	for side in [-1.0, 1.0]:   # horns
		var b0: Vector2 = hd + up * 12.0 - fw * (4.0 + side * 6.0)
		var c0: Vector2 = hd + up * 34.0 + fw * 4.0
		var e0: Vector2 = hd + up * 40.0 - fw * (22.0 + side * 6.0)
		cv.curve(b0, c0, e0, c, 5.0)
	cv.head(hd, R.headR, c, 6.0)
	if B.state != "dead":
		var ep: Vector2 = hd + fw * 8.0 + up * 2.0
		if B.phase2:
			cv.glow(ep, 3.6, C.eye)
		cv.draw_circle(ep, 3.6 if B.phase2 else 3.0, C.eye)
	cv.path([S.hip, S.k1, S.f1], c, R.line)
	var h: Vector2 = S.hA
	var t: Vector2 = S.wt
	var u: Vector2 = (t - h).normalized()
	cv.path([h - u * 14.0, t - u * 40.0], C.club, 7.0)
	cv.path([t - u * 44.0, t - u * 7.0], C.club, 17.0)
	cv.path([S.sh, S.eA, S.hA], c, R.line)
