extends Node
## Stick Souls — fight state, the player, shared boss logic, shockwaves, particles, input and the
## per-frame loop. Autoload: G. Ported 1:1 from the browser version (stick-souls/js/: fight.js,
## player.js, boss-common.js, input.js, main.js). Function names match the JS so the two can be compared.

# ---------------------------------------------------------------- state
var P := {}
var B := {}
var waves := []
var parts := []
var trails := {"p": [], "b": []}
var clock := 0.0
var hitStop := 0.0
var shakeMag := 0.0
var timeScale := 1.0
var slowT := 0.0
var ended = null      # {kind, t} once the fight is over
var endTimer = null   # {kind, t} countdown to the end screen
var camX := 0.0
var mode := "menu"
var waveGroup := 0
var acc := 0.0
var TMP := {}
var TMPB := {}

# player rig and moves (player_moves.gd), boss kinds (boss_*.gd)
var PR: Dictionary
var PB: Dictionary
var RUN: Dictionary
var PA: Dictionary
var PC := {"walkPath": "p.run", "leanV": 5.0, "lean": [11.0, 0.5], "head": [26.0, 0.55], "thr": 9.0, "reach": 26.0, "dur": 0.11, "lift": 6.0}
var BOSSES := {}
var BK = null

# input state (the device handlers live in main.gd)
var input := {"l": false, "r": false, "pad": 0, "kbHeavy": false, "blockHeld": false, "buffer": null,
	"atk": {"down": false, "at": 0.0, "heavy": false}}
var test_time = null   # automated checks set this to drive the real-time clock themselves
var main_node = null


func _ready() -> void:
	var pm: Dictionary = preload("res://scripts/player_moves.gd").build()
	PR = pm.PR
	PB = pm.PB
	RUN = pm.RUN
	PA = pm.PA
	BOSSES["warden"] = preload("res://scripts/boss_warden.gd").new()
	BOSSES["duelist"] = preload("res://scripts/boss_duelist.gd").new()
	BK = BOSSES.warden


# ---------------------------------------------------------------- utils
func rnd(a: float, b: float) -> float:
	return randf_range(a, b)


func approach(v: float, t: float, d: float) -> float:
	return minf(t, v + d) if v < t else maxf(t, v - d)


## sign of v, or `fallback` when v is 0 (the JS `Math.sign(v) || fallback`)
func sgn(v: float, fallback: float) -> float:
	var s := signf(v)
	return s if s != 0.0 else fallback


func now() -> float:
	if test_time != null:
		return test_time
	return Time.get_ticks_usec() / 1000000.0


# ---------------------------------------------------------------- reset
func reset() -> void:
	P.clear()
	P.merge({
		"x": 480.0, "y": 0.0, "vx": 0.0, "face": 1.0,
		"maxHp": T.p.hp, "hp": T.p.hp, "hpGhost": T.p.hp, "ghostT": 0.0, "st": T.p.st, "stDelay": 0.0,
		"flasks": int(T.p.flasks), "state": "loco", "def": null, "t": 0.0, "start": null, "pose": Core.copyPose(PB, {}),
		"moveBlend": 0.0, "walkP": 0.0, "flash": 0.0, "charge": 0.0, "holdT": 0.0, "hitMask": 0, "swingId": 0,
		"blockPressAt": -9.0, "counterUntil": -9.0, "critX0": 0.0, "critX1": 0.0,
	})
	B.clear()
	B.merge({
		"x": BK.startX, "y": 0.0, "vx": 0.0, "face": -1.0, "maxHp": BK.hp(), "hp": BK.hp(), "hpGhost": BK.hp(), "ghostT": 0.0,
		"poise": BK.poise(), "poiseT": 0.0, "glueT": 0.0,
		"state": "loco", "def": null, "t": 0.0, "start": null, "pose": Core.copyPose(BK.base, {}), "moveBlend": 0.0, "walkP": 0.0,
		"flash": 0.0, "wait": 1.6, "cd": BK.cd(), "last": [], "queue": [], "phase2": false, "pending2": false,
		"behindT": 0.0, "hitMask": 0, "adaptD": null, "leapFrom": 0.0, "leapTo": 0.0, "swingId": 0, "punishT": 0.0, "stoppedSwing": -1,
	})
	Core.newMotion(P)
	Core.newMotion(B)
	P["S"] = Core.solve(PR, P.pose, P.x, P.y, P.face)
	B["S"] = Core.solve(BK.R, B.pose, B.x, B.y, B.face)
	B["caps"] = BK.caps(B.S)
	waves = []
	parts = []
	trails.p.clear()
	trails.b.clear()
	clock = 0.0
	hitStop = 0.0
	shakeMag = 0.0
	timeScale = 1.0
	slowT = 0.0
	acc = 0.0
	ended = null
	endTimer = null
	input.buffer = null
	camX = lerpf(P.x, B.x, 0.42)


# ---------------------------------------------------------------- the frame loop (main.js)
func frame(rdt: float) -> void:
	if mode == "play":
		# attack button held long enough becomes a heavy
		if input.atk.down and not input.atk.heavy and now() - input.atk.at >= T.p.holdTime:
			input.atk.heavy = true
			press("heavy")
		var dt := rdt
		if slowT > 0.0:
			slowT -= dt
			timeScale = 0.3 if slowT > 0.35 else lerpf(1.0, 0.3, maxf(0.0, slowT) / 0.35)
		else:
			timeScale = 1.0
		var wdt: float = dt * timeScale * T.f.tempo   # the fight runs at combat tempo; hit-stop and UI stay real-time
		if hitStop > 0.0:
			hitStop -= dt
			wdt = 0.0
			if input.buffer != null:
				input.buffer.at += dt   # presses made during a freeze-frame aren't lost
		acc += wdt
		var n := 0
		while acc >= T.step and n < 24:
			update(T.step)
			acc -= T.step
			n += 1
			if hitStop > 0.0:
				acc = 0.0
				break
		if n >= 24:
			acc = 0.0
		updateFx(wdt)
		shakeMag = shakeMag * exp(-11.0 * dt) if shakeMag > 0.2 else 0.0
		if P.ghostT > 0.0:
			P.ghostT -= dt
		else:
			P.hpGhost = approach(P.hpGhost, P.hp, 45.0 * dt)
		if B.ghostT > 0.0:
			B.ghostT -= dt
		else:
			B.hpGhost = approach(B.hpGhost, B.hp, 160.0 * dt)
		if P.hpGhost < P.hp:
			P.hpGhost = P.hp
		if endTimer != null:
			endTimer.t -= dt
			if endTimer.t <= 0.0:
				ended = {"kind": endTimer.kind, "t": 0.0}
				endTimer = null
		if ended != null:
			ended.t += dt
	else:
		shakeMag = 0.0


func update(dt: float) -> void:
	clock += dt
	updatePlayer(dt)
	updateBoss(dt)
	updateWaves(dt)


func endIn(kind: String, delay: float) -> void:
	if endTimer == null and ended == null:
		endTimer = {"kind": kind, "t": delay}


# ---------------------------------------------------------------- shared helpers
func rootMove(def: Dictionary, t0: float, t1: float, adaptD) -> float:
	if not def.has("moves"):
		return 0.0
	var dx := 0.0
	for m in def.moves:
		if t1 <= m.t0 or t0 >= m.t1:
			continue
		var e: String = m.get("e", "io")
		var a: float = clampf((t0 - m.t0) / (m.t1 - m.t0), 0.0, 1.0)
		var b: float = clampf((t1 - m.t0) / (m.t1 - m.t0), 0.0, 1.0)
		var dist: float
		if typeof(m.d) == TYPE_STRING:
			dist = T.p[m.d]
		elif m.has("adapt") and adaptD != null:
			dist = adaptD
		else:
			dist = m.d
		dx += dist * (Core.easef(e, b) - Core.easef(e, a))
	return dx


func hitstop(t: float) -> void:
	hitStop = maxf(hitStop, t * T.f.hitstop)


func shake(m: float) -> void:
	shakeMag = maxf(shakeMag, m * T.f.shake)


func addTrail(who: String, id: int, hA: Vector2, wt: Vector2) -> void:
	trails[who].append({"id": id, "hx": hA.x, "hy": hA.y, "tx": wt.x, "ty": wt.y, "age": 0.0})


# ---------------------------------------------------------------- shockwaves + particles
func addWave(x: float, r: float, dmg: float, knock: String, o := {}) -> void:
	waves.append({"x": x, "r": r, "r0": o.get("r0", 0.0), "dmg": dmg, "knock": knock, "t": 0.0, "hit": o.get("harmless", false),
		"group": o.get("group", 0), "src": o.get("src", x), "ring": o.get("ring", null)})


func updateWaves(dt: float) -> void:
	for w in waves:
		w.t += dt
		if not w.hit and w.t <= 0.14:
			var k: float = minf(1.0, w.t / 0.14)
			var reach: float = lerpf(w.r0, w.r, k) if w.r0 > 0.0 else w.r * (0.35 + 0.65 * k)
			var dist: float = absf(P.x - w.x)
			var groupHit := false
			if w.group != 0:
				for o in waves:
					if not is_same(o, w) and o.group == w.group and o.hit:
						groupHit = true
			var onGround: bool = P.y > -12.0 or w.knock == "push"
			if not groupHit and dist <= reach and dist >= w.r0 - 12.0 and onGround and P.state != "dead" and not pInvuln():
				w.hit = true
				hurtPlayer(w.dmg, w.knock, w.x, {"guard": 25, "src": w.src})
	waves = waves.filter(func(w): return w.t < 0.55)


func sparks(x: float, y: float, dir: float, n: int, col: Color) -> void:
	for i in n:
		var a: float = (0.0 if dir > 0.0 else PI) + rnd(-1.1, 1.1) + (PI if randf() < 0.25 else 0.0)
		var s := rnd(160.0, 520.0)
		parts.append({"k": "s", "x": x, "y": y, "vx": cos(a) * s, "vy": sin(a) * s - 120.0, "life": rnd(0.12, 0.3), "max": 0.3, "col": col})


func dust(x: float, n: int, spread: float) -> void:
	for i in n:
		parts.append({"k": "d", "x": x + rnd(-spread, spread), "y": -2.0, "vx": rnd(-170.0, 170.0), "vy": rnd(-80.0, -15.0),
			"life": rnd(0.35, 0.75), "max": 0.75, "r": rnd(2.5, 7.0)})


func updateFx(dt: float) -> void:
	for p in parts:
		p.life -= dt
		p.x += p.vx * dt
		p.y += p.vy * dt
		if p.k == "s":
			p.vy += 1100.0 * dt
		elif p.k == "d":
			p.vx *= exp(-3.0 * dt)
			p.vy += 40.0 * dt
	parts = parts.filter(func(p): return p.life > 0.0)
	for k in ["p", "b"]:
		var tr: Array = trails[k]
		for s in tr:
			s.age += dt
		while tr.size() > 0 and tr[0].age > 0.14:
			tr.pop_front()


# ---------------------------------------------------------------- input (input.js)
func inDir() -> int:
	var d: int = (1 if input.r else 0) - (1 if input.l else 0)
	return d if d != 0 else int(input.pad)


func heavyHeld() -> bool:
	return input.kbHeavy or (input.atk.down and input.atk.heavy)


func press(a: String) -> void:
	if ended == null and mode == "play":
		input.buffer = {"a": a, "at": now()}


func buffered():
	var b = input.buffer
	if b == null:
		return null
	if now() - b.at > T.p.buffer:
		input.buffer = null
		return null
	return b.a


## one attack button: release before the hold time = light; keep holding = heavy (and charge)
func atkDown() -> void:
	input.atk.down = true
	input.atk.at = now()
	input.atk.heavy = false


func atkUp() -> void:
	if input.atk.down and not input.atk.heavy:
		press("light")
	input.atk.down = false


func blockDown() -> void:
	input.blockHeld = true
	P.blockPressAt = now()
	press("block")


func blockUp() -> void:
	input.blockHeld = false


func releaseAll() -> void:
	input.l = false
	input.r = false
	input.kbHeavy = false
	input.blockHeld = false
	input.pad = 0
	input.atk.down = false
	input.buffer = null
	if main_node != null:
		main_node.clearTouch()


# ---------------------------------------------------------------- player logic (player.js)
## [damage, poise damage, weight] per player hit kind
func HIT(k: String) -> Array:
	match k:
		"L1":
			return [T.p.dmgL, T.p.poiseL, "light"]
		"L2":
			return [T.p.dmgL * 1.1, T.p.poiseL, "light"]
		"L3":
			return [T.p.dmgL * 1.3, T.p.poiseL * 1.3, "heavy"]
		"H":
			if P.charge >= 1.0:
				return [T.p.dmgCharged, T.p.poiseCharged, "charged"]
			return [T.p.dmgHeavy, T.p.poiseHeavy, "heavy"]
		"RA":
			return [T.p.dmgRollAtk, T.p.poiseRollAtk, "light"]
	# "GC"
	return [T.p.dmgCounter, T.p.poiseCounter, "heavy"]


## stamina is spent when the blade becomes dangerous, not on the button press
func PAY(k: String) -> float:
	match k:
		"L1", "L2":
			return T.p.costLight
		"L3":
			return T.p.costLight * 1.25
		"H":
			return T.p.costHeavy * (1.33 if P.charge >= 1.0 else 1.0)
		"RA":
			return 14.0
	# "GC"
	return 20.0


func pInvuln() -> bool:
	var d = P.def
	if d == null or not d.has("inv"):
		return false
	var inv: Array = [0.03, 0.03 + T.p.rollInv] if typeof(d.inv) == TYPE_STRING else d.inv
	return P.t >= inv[0] and P.t <= inv[1]


func pArmor() -> bool:
	if P.state == "heavyCharge":
		return true
	var d = P.def
	return d != null and d.has("armor") and P.t >= d.armor[0] and P.t <= d.armor[1]


func grounded() -> bool:
	return P.y >= -0.5


func blocking() -> bool:
	return P.def != null and P.def.get("guard", false)


func counterOpen() -> bool:
	return clock < P.counterUntil


func spend(c: float) -> void:
	P.st = maxf(0.0, P.st - c)
	if P.st <= 0.0:
		P.stDelay = T.p.stDelayEmpty


func faceBoss() -> void:
	if B.state != "dead" and absf(B.x - P.x) > 8.0:
		P.face = signf(B.x - P.x)


func clampP() -> void:
	P.x = clampf(P.x, T.arenaL + 12.0, T.arenaR - 12.0)


func pBegin(nm: String, def = null) -> void:
	var d: Dictionary = def if def != null else PA[nm]
	P.state = nm
	P.def = d
	P.t = 0.0
	P.start = Core.copyPose(P.pose, {})
	P.hitMask = 0
	P.swingId += 1
	if d.has("cost"):
		spend(T.p[d.cost])


func pStrike(charge: float) -> void:
	P.charge = charge
	pBegin("heavyStrike")
	if charge >= 1.0:
		Snd.sCharge(P.x)
		P.flash = 0.0


func toLoco() -> void:
	var d = P.def
	if d != null and d.has("regenAt") and d.regenAt > d.an.dur and d.regenAt < 50.0:
		P.stDelay = maxf(P.stDelay, d.regenAt - d.an.dur)
	P.state = "loco"
	P.def = null
	P.moveBlend = 0.0
	P.sLean.x = 0.0
	P.sLean.v = 0.0
	if inDir() == 0:
		faceBoss()


func canCrit() -> bool:
	if B.def == null or not B.def.get("critable", false) or B.y < -1.0 or not grounded():
		return false
	var rel: float = (P.x - B.x) * B.face   # positive: you are in front of the boss
	return rel > BK.critRange[0] and rel < BK.critRange[1]


func startCrit() -> void:
	P.face = -B.face
	pBegin("crit")
	P.critX0 = P.x
	P.critX1 = B.x + B.face * BK.critDist
	B.queue = []
	bBegin("critHit")


func bossNoticeHeal() -> void:
	if B.state == "loco" and absf(P.x - B.x) < BK.punishReach and randf() < T.b.healPunish:
		B.punishT = rnd(0.1, 0.2)


## Start a player-chosen action. Returns false if it can't happen right now.
func pDo(a: String) -> bool:
	if a == "heal":
		if P.flasks <= 0 or not grounded():
			return false
		faceBoss()
		P.vx *= 0.2
		pBegin("heal")
		bossNoticeHeal()
		return true
	if a == "block":
		if not grounded() or P.st <= 0.0 or blocking():
			return false
		faceBoss()
		P.vx = 0.0
		pBegin("block")
		return true
	if P.st < 1.0:
		return false
	if a == "roll":
		var dir := inDir()
		if dir == 0:
			faceBoss()
			P.vx = 0.0
			pBegin("backstep")
			Snd.sRoll(P.x)
			return true
		P.face = float(dir)
		P.vx = 0.0
		pBegin("roll")
		Snd.sRoll(P.x)
		return true
	if a == "light":
		if canCrit():
			startCrit()
			return true
		if P.state == "roll" and P.t >= PA.roll.rollAtkFrom:
			faceBoss()
			pBegin("rollAtk")
			return true
		var chain: bool = P.def != null and P.def.has("next") and P.t >= P.def.chainAt
		var nxt: String = P.def.next if chain else "light1"
		faceBoss()
		P.vx *= 0.2
		pBegin(nxt)
		return true
	if a == "heavy":
		if counterOpen():
			faceBoss()
			P.vx = 0.0
			pBegin("gCounter")
			return true
		faceBoss()
		P.vx *= 0.2
		P.charge = 0.0
		pBegin("heavyWind")
		return true
	return false


func playerLoco(dt: float) -> void:
	var v: float = P.vx * P.face
	var S := 20.0
	var sf := 0.4
	P.moveBlend = approach(P.moveBlend, clampf(absf(P.vx) / T.p.run, 0.0, 1.0), dt * 7.0)
	var before := floorf(P.walkP * 2.0)
	P.walkP += v * dt / (2.0 * S / sf)
	if floorf(P.walkP * 2.0) != before and P.moveBlend > 0.5:
		Snd.sStep(P.x, 0.22)
	var m: float = P.moveBlend
	var p: Dictionary = P.pose
	for k in Core.KEYS:
		p[k] = lerpf(PB[k], RUN[k], m)
	var g1: Vector2 = Core.gait(P.walkP, S, 12.0, sf)
	var g2: Vector2 = Core.gait(P.walkP + 0.5, S, 12.0, sf)
	var q: float = P.walkP * 4.0 * PI
	p.f1x = lerpf(PB.f1x, 4.0 + g1.x, m)
	p.f1y = -g1.y * m
	p.f2x = lerpf(PB.f2x, -2.0 + g2.x, m)
	p.f2y = -g2.y * m
	p.hy += (0.5 + 0.5 * cos(q - 0.8 * PI)) * 3.0 * m + sin(clock * 2.4) * 0.8 * (1.0 - m)
	p.ay += sin(clock * 2.4 + 0.6) * 0.7 * (1.0 - m) + sin(q) * 2.0 * m
	p.w += sin(q) * 3.0 * m


func chargePose() -> void:
	var k: Array = PA.heavyWind.an.ks
	Core.copyPose(k[k.size() - 1].p, P.pose)
	var c: float = clampf(P.holdT / (T.p.chargeTime / T.f.atkSpeed), 0.0, 1.0)
	var p: Dictionary = P.pose
	p.lean -= 3.0 * c
	p.hy += 2.5 * c
	p.head -= 4.0 * c
	p.ax += sin(clock * 47.0) * 0.6 * c
	p.ay += sin(clock * 39.0) * 0.6 * c
	p.w += sin(clock * 31.0) * 1.6 * c


func pEvent(ev: String) -> void:
	if ev == "heal" and P.flasks > 0:
		P.flasks -= 1
		P.hp = minf(P.maxHp, P.hp + T.p.flaskHeal)
		P.hpGhost = P.hp
		Snd.sHeal()
		for i in 16:
			parts.append({"k": "h", "x": P.x + rnd(-16.0, 16.0), "y": rnd(-86.0, -8.0), "vx": rnd(-10.0, 10.0), "vy": rnd(-80.0, -30.0),
				"life": rnd(0.5, 0.9), "max": 0.9})
	elif ev == "pImpact":
		dust(P.S.wt.x, 6 + int(round(8.0 * P.charge)), 20.0)
		shake(2.0 + 4.0 * P.charge)
		Snd.sStep(P.S.wt.x, 0.8)
	elif ev == "crit1" or ev == "crit2":
		var first := ev == "crit1"
		damageBoss(T.p.dmgCrit * (0.6 if first else 0.4), 0.0, P.S.wt.x, P.S.wt.y, "crit" if first else "heavy")


func pHits(d: Dictionary, t0: float, t1: float) -> void:
	for i in d.hits.size():
		var h: Dictionary = d.hits[i]
		if (P.hitMask & (1 << i)) != 0 or t1 < h.t0 or t0 > h.t1:
			continue
		for j in range(1, 4):
			var tt := lerpf(t0, t1, j / 3.0)
			if tt < h.t0 or tt > h.t1:
				continue
			var S: Dictionary = Core.solve(PR, Core.sample(d.an, tt, P.start, TMP), P.x, P.y, P.face)
			addTrail("p", P.swingId, S.hA, S.wt)
			if B.state == "dead":
				continue
			var hit = Core.hitTest(S.hA, S.wt, 3.0, B.caps)
			if hit != null:
				P.hitMask |= 1 << i
				var r := HIT(h.k)
				damageBoss(r[0], r[1], hit[1].x, hit[1].y, r[2])
				break


func actSpeed(d: Dictionary) -> float:
	var spd = d.get("spd")
	if spd == "atk":
		return T.f.atkSpeed
	if spd == "roll":
		return T.f.rollSpeed
	return 1.0


## Pace: after the last damaging frame (or the roll's invincibility) your recovery plays faster,
## so you get back into the fight sooner while wind-ups stay readable.
func recStart(d: Dictionary):
	if d.has("hits"):
		if not d.has("_rec"):
			var m := 0.0
			for h in d.hits:
				m = maxf(m, h.t1)
			d["_rec"] = m
		return d._rec
	if d.has("inv") and typeof(d.inv) == TYPE_STRING:
		return 0.03 + T.p.rollInv
	if d.get("roll", false) and d.has("moves"):
		return d.moves[0].t1
	return null


func updatePlayer(dt: float) -> void:
	if P.flash > 0.0:
		P.flash -= dt
	var d0 = P.def
	var noRegen := false
	if d0 != null:
		noRegen = P.t < d0.regenAt if d0.has("regenAt") else (d0.get("atk", false) or d0.get("roll", false))
	if P.stDelay > 0.0:
		P.stDelay -= dt
	elif not noRegen and P.state != "dead" and P.state != "heavyCharge":
		var k: float = T.p.guardRegen if blocking() else 1.0
		P.st = minf(T.p.st, P.st + T.p.stRegen * k * dt)

	if P.state == "loco":
		var dir := inDir()
		if dir != 0:
			P.face = float(dir)
		else:
			faceBoss()
		P.vx = approach(P.vx, dir * T.p.run, T.p.accel * dt)
		P.x += P.vx * dt
		P.y = 0.0
		clampP()
		playerLoco(dt)
		var b = buffered()
		if b != null and pDo(b):
			input.buffer = null
	elif P.state == "heavyCharge":
		P.holdT += dt
		P.charge = 0.0
		chargePose()
		P.vx *= exp(-8.0 * dt)
		P.x += P.vx * dt
		clampP()
		if P.holdT >= T.p.chargeTime / T.f.atkSpeed:
			pStrike(1.0)
		elif not heavyHeld():
			pStrike(0.0)
	else:
		playerAction(dt)
	var fm := "lock"
	if P.state == "loco":
		fm = "gait"
	elif P.state == "roll" or P.state == "down" or P.state == "dead" or P.y < -1.0:
		fm = "free"
	P.S = Core.solve(PR, Core.finalize(P, PC, dt, fm), P.x, P.y, P.face)


func playerAction(dt: float) -> void:
	var d: Dictionary = P.def
	var nm: String = P.state
	var t0: float = P.t
	var rs = recStart(d)
	P.t += dt * actSpeed(d) * (T.f.recovery if (rs != null and t0 >= rs) else 1.0)
	var t1: float = P.t
	P.vx *= exp(-6.5 * dt)
	P.x += P.vx * dt + P.face * rootMove(d, t0, t1, null)
	if nm == "crit":
		P.x = lerpf(P.critX0, P.critX1, Core.easef("out", clampf(t1 / 0.15, 0.0, 1.0)))
	clampP()
	if d.has("air"):
		var u: float = clampf((t1 - d.air[0]) / (d.air[1] - d.air[0]), 0.0, 1.0)
		P.y = -4.0 * d.air[2] * u * (1.0 - u)
	else:
		P.y = 0.0
	if d.get("guard", false):
		faceBoss()
	Core.sample(d.an, t1, P.start, P.pose)
	P.S = Core.solve(PR, P.pose, P.x, P.y, P.face)
	if d.has("hits"):
		for h in d.hits:
			var w: float = h.t0 - 0.08
			if t0 < w and t1 >= w:
				Snd.sWhoosh(P.x, h.k != "L1" and h.k != "L2" and h.k != "RA")
	if d.has("pay") and t0 < d.pay[0] and t1 >= d.pay[0]:
		spend(PAY(d.pay[1]))
	if d.has("events"):
		for e in d.events:
			if t0 < e.t and t1 >= e.t:
				pEvent(e.ev)
	if d.has("hits"):
		pHits(d, t0, t1)
	if P.state != nm or nm == "dead":
		return
	if nm == "heavyWind" and t1 >= d.an.dur:
		if heavyHeld():
			P.state = "heavyCharge"
			P.holdT = 0.0
		else:
			pStrike(0.0)
		return
	if nm == "block" and not input.blockHeld and t1 >= 0.25:
		pBegin("unblock")
		return
	if (nm == "blockHit" or nm == "parry") and t1 >= d.an.dur:
		if input.blockHeld and P.st > 0.0:
			pBegin("block")
		else:
			toLoco()
		return
	var late := 0.13 if (nm == "heavyStrike" and P.charge >= 1.0) else 0.0
	var b = buffered()
	if b != null:
		var ok := false
		if (b == "light" or b == "heavy") and d.has("next") and t1 >= d.chainAt:
			ok = pDo(b)
		elif b == "light" and nm == "roll" and t1 >= d.rollAtkFrom:
			ok = pDo(b)
		elif b == "heavy" and counterOpen() and (d.get("guard", false) or nm == "unblock"):
			ok = pDo(b)
		elif b == "roll" and d.has("rollAt") and t1 >= d.rollAt + late:
			ok = pDo("roll")
		elif d.has("act") and t1 >= d.act + late:
			ok = pDo(b)
		if ok:
			input.buffer = null
			return
	if t1 >= d.an.dur and d.an.dur < 900.0:
		toLoco()


## What happens when a boss attack reaches the player. opt: {parry, guard, src}
func hurtPlayer(dmg: float, knock: String, fromX: float, opt := {}) -> String:
	if P.state == "dead" or pInvuln() or ended != null or endTimer != null:
		return "miss"
	var src: float = opt.get("src", fromX)   # where the attack came from (a wave's boss, not its centre)
	var dir := sgn(P.x - src, -P.face)
	var front: bool = absf(src - P.x) < 20.0 or signf(src - P.x) == P.face
	if knock == "push":
		if not pArmor() and not blocking():
			pBegin("flinch")
		P.vx = dir * 420.0
		return "push"
	input.buffer = null
	var mid: Vector2 = P.S.hA.lerp(P.S.wt, 0.4)
	if blocking() and front:
		if opt.get("parry", false) and now() - P.blockPressAt <= T.p.parryWin:
			P.blockPressAt = -9.0
			pBegin("parry")
			B.queue = []
			bBegin("reel")
			hitstop(0.16)
			shake(7.0)
			sparks(mid.x, mid.y, -dir, 22, T.C.parry)
			Snd.sParry(P.x)
			return "parry"
		P.hp = maxf(0.0, P.hp - dmg * T.f.bossDmg * T.p.blockTaken)
		P.st -= float(opt.get("guard", 30)) * T.p.blockSt
		P.counterUntil = clock + 0.8
		sparks(mid.x, mid.y, -dir, 10, T.C.spark)
		Snd.sClang(P.x)
		hitstop(0.06)
		shake(4.0)
		if P.hp <= 0.0:
			die(dir)
			return "block"
		if P.st < 0.0:
			P.st = 0.0
			P.stDelay = T.p.stDelayEmpty
			pBegin("guardBreak")
			P.vx = dir * 260.0
			Snd.sHurt(P.x)
		else:
			pBegin("blockHit")
			P.vx = dir * 150.0
		return "block"
	P.hp = maxf(0.0, P.hp - dmg * T.f.bossDmg)
	P.flash = 0.18
	P.ghostT = 0.7
	hitstop(0.12 if knock == "down" else 0.08)
	shake(14.0 if knock == "down" else 8.0)
	sparks(P.S.hip.x, P.S.hip.y - 22.0, dir, 10, T.C.blood)
	Snd.sHurt(P.x)
	if P.hp <= 0.0:
		die(dir)
		return "hit"
	if knock == "down":
		pBegin("down")
		P.vx = dir * 340.0
	elif not pArmor():
		pBegin("flinch")
		P.vx = dir * 250.0
	return "hit"


func die(dir: float) -> void:
	pBegin("dead")
	P.vx = dir * 320.0
	P.flash = 0.18
	slowT = 1.4
	endIn("lose", 2.0)
	Snd.sDeath()


# ---------------------------------------------------------------- shared boss logic (boss-common.js)
# Each boss (boss_warden.gd, boss_duelist.gd) is a "kind" with its own body, moves, AI, sounds
# and drawing. BK is the boss being fought.
func playerCaps() -> Array:
	var S: Dictionary = P.S
	return [[S.hip, S.hd, 10.0], [S.hip, S.f1, 5.0], [S.hip, S.f2, 5.0]]


func maxPoise() -> float:
	return BK.poise() * (1.2 if B.phase2 else 1.0)


func bSpeed() -> float:
	return (BK.speed2() if B.phase2 else 1.0) * T.f.bossSpeed


## the last attack of a string keeps at least 1.2 seconds (at tempo 1) of recovery after its hit
func withFinisher(d: Dictionary) -> Dictionary:
	var lastHit := 0.0
	if d.has("hits"):
		for h in d.hits:
			lastHit = maxf(lastHit, h.t1)
	if d.has("events"):
		for e in d.events:
			lastHit = maxf(lastHit, e.t)
	var extra: float = 1.2 * bSpeed() - (d.act - lastHit)
	return Core.shifted(d, lastHit + 0.02, extra) if extra > 0.01 else d


func bBegin(nm: String, finisher := false) -> void:
	var d: Dictionary = BK.moves[nm]
	if finisher:
		d = withFinisher(d)
	B.state = nm
	B.def = d
	B.t = 0.0
	B.start = Core.copyPose(B.pose, {})
	B.hitMask = 0
	B.adaptD = null
	B.vx = 0.0
	B.swingId += 1
	B.leapTo = B.x
	B.punishT = 0.0
	if nm == "stagger" or nm == "dead" or nm == "reel" or nm == "critHit":
		B.queue = []
	BK.onBegin(nm)
	if d.get("atk", false):
		var base_nm: String = nm.substr(0, nm.length() - 1) if nm.ends_with("D") else nm
		B.last.push_front(base_nm)
		if B.last.size() > 3:
			B.last.resize(3)


func bLoco() -> void:
	B.state = "loco"
	B.def = null
	B.moveBlend = 0.0
	B.sLean.x = 0.0
	B.sLean.v = 0.0
	B.wait = BK.pause() * T.f.bossPause


## weighted pick from [[name, weight], ...]
func pick(o: Array) -> String:
	var s := 0.0
	for it in o:
		s += it[1]
	var r := randf() * s
	for it in o:
		r -= it[1]
		if r <= 0.0:
			return it[0]
	return o[o.size() - 1][0]


## choose a string to follow an opening attack
func pickString(n: String, s1: Dictionary, s2: Dictionary, chance: float) -> Array:
	var pool = (s2 if B.phase2 else s1).get(n)
	var c: float = minf(1.0, chance + 0.15) if B.phase2 else chance
	if pool != null and randf() < c:
		return pool[randi() % pool.size()].duplicate()
	return []


func bossTrack(d: Dictionary) -> void:
	var dist: float = absf(P.x - B.x)
	var front: bool = (P.x - B.x) * B.face > 0.0
	if d.has("moves"):
		for mv in d.moves:
			if mv.has("adapt"):
				B.adaptD = clampf(dist - mv.adapt[0], mv.adapt[1], mv.adapt[2]) if front else float(mv.adapt[1])
				break
	if d.has("leap"):
		var lead: float = d.leap.get("lead", 105.0)
		B.leapTo = clampf(P.x - B.face * lead if front else B.x + B.face * 60.0, T.arenaL + 80.0, T.arenaR - 80.0)


func leapMotion(L: Dictionary, t0: float, t1: float) -> void:
	if t0 < L.t0 and t1 >= L.t0:
		B.leapFrom = B.x
	if t1 >= L.t0 and t0 <= L.t1:
		var u: float = clampf((t1 - L.t0) / (L.t1 - L.t0), 0.0, 1.0)
		B.x = lerpf(B.leapFrom, B.leapTo, Core.easef("io", u))
		B.y = -4.0 * L.h * u * (1.0 - u)


func bEvent(ev: String) -> void:
	if ev == "flip":
		if (P.x - B.x) * B.face < 0.0:
			B.face *= -1.0
		return
	BK.event(ev)


## weapon segments: "A" = main hand (wt), "B" = second hand (wt2) for dual wielders
func bHits(d: Dictionary, t0: float, t1: float) -> void:
	for i in d.hits.size():
		var h: Dictionary = d.hits[i]
		if (B.hitMask & (1 << i)) != 0 or t1 < h.t0 or t0 > h.t1:
			continue
		var wsel: String = h.get("w", "A")
		var blades := [1] if wsel == "B" else ([0, 1] if wsel == "AB" else [0])
		for j in range(1, 4):
			var tt := lerpf(t0, t1, j / 3.0)
			if tt < h.t0 or tt > h.t1:
				continue
			var S: Dictionary = Core.solve(BK.R, Core.sample(d.an, tt, B.start, TMPB), B.x, B.y, B.face)
			var hit := false
			for bl in blades:
				var a: Vector2 = S.hB if bl == 1 else S.hA
				var b: Vector2 = S.wt2 if bl == 1 else S.wt
				addTrail("b", B.swingId * 2 + bl, a, b)
				if not hit and P.state != "dead" and not pInvuln() and Core.hitTest(a, b, BK.weaponR, playerCaps()) != null:
					hit = true
			if hit:
				B.hitMask |= 1 << i
				var res := hurtPlayer(h.dmg, h.knock, B.x, {"parry": not h.get("noParry", false), "guard": h.get("guard", 30)})
				if res == "block" or res == "parry":
					B.stoppedSwing = B.swingId
				break
		if not is_same(B.def, d):   # parried mid-swing
			return


func damageBoss(dmg: float, poise: float, x: float, y: float, kind: String) -> void:
	if B.state == "dead":
		return
	var mult: float = T.b.staggerMult if B.state == "stagger" else 1.0
	B.hp = maxf(0.0, B.hp - dmg * mult)
	B.flash = 0.2 if kind == "crit" else 0.09
	B.ghostT = 0.8
	B.poiseT = 0.0
	if kind == "crit":
		hitstop(0.18)
		shake(12.0)
		sparks(x, y, P.face, 26, T.C.crit)
		Snd.sCrit(x)
	else:
		var heavy := kind != "light"
		hitstop(0.12 if kind == "charged" else (0.09 if heavy else 0.075))
		shake(8.0 if kind == "charged" else (5.0 if heavy else 2.5))
		sparks(x, y, P.face, 15 if heavy else 9, T.C.spark)
		Snd.sImpact(x, 1.0 if kind == "charged" else (0.6 if heavy else 0.25))
	if B.hp <= 0.0:
		bBegin("dead")
		waves = []
		slowT = 1.4
		endIn("win", 2.8)
		Snd.sVictory()
		return
	if not (B.def != null and B.def.get("noPoise", false)):
		B.poise -= poise * T.f.poiseMult
	if not B.phase2 and B.hp <= B.maxHp * T.b.phase2At:
		B.pending2 = true


## phase 2 begins at the next decision with the boss's transition move
func bossPhase2(move: String) -> void:
	B.pending2 = false
	B.phase2 = true
	B.poise = maxPoise()
	B.face = sgn(P.x - B.x, B.face)
	bBegin(move)


func updateBoss(dt: float) -> void:
	if B.flash > 0.0:
		B.flash -= dt
	for k in B.cd:
		B.cd[k] -= dt
	B.poiseT += dt
	B.glueT = B.glueT + dt if absf(P.x - B.x) < 70.0 else 0.0
	var noPoise: bool = B.def != null and B.def.get("noPoise", false)
	if B.poiseT > T.b.poiseDelay and not noPoise:
		B.poise = minf(maxPoise(), B.poise + T.b.poiseRegen * dt)
	if B.poise <= 0.0 and B.state != "dead" and B.y >= -0.5 and not noPoise:
		bBegin("stagger")
		shake(6.0)
		Snd.sImpact(B.x, 1.0)

	if B.state == "loco":
		var dx: float = P.x - B.x
		var d: float = absf(dx)
		var front: bool = dx * B.face > 0.0
		var want := 0.0
		if P.state != "dead" and ended == null:
			if B.punishT > 0.0:
				B.punishT -= dt
				if B.punishT <= 0.0:
					BK.punish()
			if B.state == "loco":
				if not front and d > 30.0:
					B.behindT += dt
					if B.behindT > BK.turnDelay:
						B.behindT = 0.0
						BK.decide()
				else:
					B.behindT = 0.0
					if d > BK.approach():
						want = B.face * BK.walk() * (1.2 if B.phase2 else 1.0)
				B.wait -= dt
				if B.state == "loco" and B.wait <= 0.0:
					BK.decide()
		if B.state == "loco":
			B.vx = approach(B.vx, want, BK.walkAccel * dt)
			B.x += B.vx * dt
			if B.y < 0.0:
				B.y = minf(0.0, B.y + 700.0 * dt)
			BK.loco(dt)
	if B.state != "loco":
		var d: Dictionary = B.def
		var t0: float = B.t
		B.t += dt * bSpeed()
		var t1: float = B.t
		var nm: String = B.state
		# keep turning to face the player until the commit point
		if d.has("commit") and t1 < d.commit and (P.x - B.x) * B.face < -40.0 and B.y >= -1.0 and P.state != "dead":
			B.face *= -1.0
		if d.has("commit") and t0 < d.commit and t1 >= d.commit:
			bossTrack(d)
		B.x += B.face * rootMove(d, t0, t1, B.adaptD)
		if d.has("leap"):
			leapMotion(d.leap, t0, t1)
		elif B.y < 0.0:
			B.y = minf(0.0, B.y + 700.0 * dt)
		Core.sample(d.an, t1, B.start, B.pose)
		B.S = Core.solve(BK.R, B.pose, B.x, B.y, B.face)
		if d.has("hits"):
			for h in d.hits:
				var w: float = h.t0 - 0.1
				if t0 < w and t1 >= w:
					Snd.sWhoosh(B.x, BK.heavyWhoosh)
		if d.has("events"):
			for e in d.events:
				if t0 < e.t and t1 >= e.t:
					bEvent(e.ev)
		if d.has("hits") and B.state == nm:
			bHits(d, t0, t1)
		if B.state == nm and nm != "dead":
			if B.queue.size() > 0 and d.has("cancel") and t1 >= d.cancel and P.state != "dead":
				var n: String = B.queue.pop_front()
				B.face = sgn(P.x - B.x, B.face)
				bBegin(n, B.queue.size() == 0)
			elif t1 >= d.an.dur:
				if nm == "stagger" or nm == "critHit" or nm == "reel":
					B.poise = maxPoise()
				bLoco()
	B.x = clampf(B.x, T.arenaL + BK.edge, T.arenaR - BK.edge)
	var fm := "lock"
	if B.state == "loco":
		fm = "gait"
	elif B.state == "dead" or B.y < -1.0:
		fm = "free"
	B.S = Core.solve(BK.R, Core.finalize(B, BK.mc, dt, fm), B.x, B.y, B.face)
	B.caps = BK.caps(B.S)
