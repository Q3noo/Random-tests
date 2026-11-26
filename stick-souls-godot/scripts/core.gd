extends Node
## Stick Souls — maths helpers, keyframe animation, skeleton/IK and the secondary-motion layer. Autoload: Core.
## Ported 1:1 from the browser version (stick-souls/js/core.js). Points are Vector2.

const D2R := PI / 180.0

# ---------------------------------------------------------------- pose + keyframes
# A pose is a set of numbers in "facing space" (+x forward, +y down, origin on the ground
# under the character). Hands and feet are IK targets; the weapon angle w is in degrees.
const KEYS := ["hx", "hy", "lean", "head", "ax", "ay", "bx", "by", "w", "w2", "th", "ea", "eb",
	"f1x", "f1y", "f2x", "f2y", "rot", "ox", "oy"]
const BASE := "BASE"


func easef(e: String, t: float) -> float:
	match e:
		"lin":
			return t
		"in":
			return t * t * t
		"in2":
			return t * t
		"out":
			return 1.0 - pow(1.0 - t, 3.0)
		"out2":
			return 1.0 - pow(1.0 - t, 2.0)
	# "io"
	return 4.0 * t * t * t if t < 0.5 else 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0


## Copy of a with b's values on top (the JS spread { ...a, ...b }).
func M(a: Dictionary, b: Dictionary) -> Dictionary:
	return a.merged(b, true)


## Build an animation. Each key = [time, changes, ease, extra]; changes accumulate from the
## previous key, BASE resets to the base pose. Key 0 is replaced by the live pose at start,
## so every action blends in from wherever the body was.
func mk(base: Dictionary, keys: Array) -> Dictionary:
	var ks := []
	var prev: Dictionary = base.duplicate()
	for k in keys:
		var o = k[1]
		var p: Dictionary
		if typeof(o) == TYPE_STRING:
			p = base.duplicate()
		else:
			p = prev.merged(o, true)
		if k.size() > 3 and k[3] != null:
			p.merge(k[3], true)
		for key in p:
			p[key] = float(p[key])
		ks.append({"t": float(k[0]), "p": p, "e": k[2] if k.size() > 2 else "io"})
		prev = p
	return {"dur": ks[ks.size() - 1].t, "ks": ks}


func copyPose(src: Dictionary, out: Dictionary) -> Dictionary:
	for k in KEYS:
		out[k] = float(src[k])
	return out


func sample(an: Dictionary, t: float, start, out: Dictionary) -> Dictionary:
	var ks: Array = an.ks
	if t <= 0.0:
		return copyPose(start if start != null else ks[0].p, out)
	for i in range(1, ks.size()):
		var k: Dictionary = ks[i]
		if t <= k.t:
			var a: Dictionary = start if (i == 1 and start != null) else ks[i - 1].p
			var t0: float = ks[i - 1].t
			var span: float = k.t - t0
			var u := 1.0
			if span > 0.0:
				u = easef(k.e, clampf((t - t0) / span, 0.0, 1.0))
			var kp: Dictionary = k.p
			for key in KEYS:
				out[key] = a[key] + (kp[key] - a[key]) * u
			return out
	return copyPose(ks[ks.size() - 1].p, out)


## Stretch an attack after time `after` (delayed boss variants, finisher recoveries).
func shifted(def: Dictionary, after: float, extra: float) -> Dictionary:
	if extra <= 0.001:
		return def
	var nd: Dictionary = def.duplicate()
	var ks := []
	for k in def.an.ks:
		var nk: Dictionary = k.duplicate()
		nk["t"] = _sh(k.t, after, extra)
		ks.append(nk)
	nd["an"] = {"dur": def.an.dur + extra, "ks": ks}
	for fld in ["act", "cancel", "commit"]:
		if def.get(fld) != null:
			nd[fld] = _sh(def[fld], after, extra)
	if def.has("hits"):
		var hs := []
		for h in def.hits:
			var c: Dictionary = h.duplicate()
			c["t0"] = _sh(h.t0, after, extra)
			c["t1"] = _sh(h.t1, after, extra)
			hs.append(c)
		nd["hits"] = hs
	if def.has("events"):
		var es := []
		for e in def.events:
			var c: Dictionary = e.duplicate()
			c["t"] = _sh(e.t, after, extra)
			es.append(c)
		nd["events"] = es
	if def.has("moves"):
		var ms := []
		for m in def.moves:
			var c: Dictionary = m.duplicate()
			c["t0"] = _sh(m.t0, after, extra)
			c["t1"] = _sh(m.t1, after, extra)
			ms.append(c)
		nd["moves"] = ms
	if def.has("leap"):
		var l: Dictionary = def.leap.duplicate()
		l["t0"] = _sh(def.leap.t0, after, extra)
		l["t1"] = _sh(def.leap.t1, after, extra)
		nd["leap"] = l
	return nd


func _sh(t: float, after: float, extra: float) -> float:
	return t + extra if t > after else t


# ---------------------------------------------------------------- skeleton
## Two-bone IK. bend in [-1, 1] picks (and blends) which way the middle joint folds.
## Returns [middle joint, end point].
func joint(a: Vector2, tg: Vector2, l1: float, l2: float, bend: float) -> Array:
	var dv: Vector2 = tg - a
	var d: float = dv.length()
	var m: float = l1 + l2 - 0.01
	if d > m:
		dv *= m / d
		d = m
	if d < 0.01:
		d = 0.01
	var base: float = atan2(dv.y, dv.x)
	var a0: float = acos(clampf((l1 * l1 + d * d - l2 * l2) / (2.0 * l1 * d), -1.0, 1.0))
	# The two exact solutions mirror each other across the shoulder→hand line. Blending between
	# them moves the elbow as if it turned in depth, so neither bone ever stretches.
	var j: Vector2 = a + Vector2(cos(base + a0), sin(base + a0)) * l1
	var mm: Vector2 = a + Vector2(cos(base), sin(base)) * (l1 * cos(a0))
	return [mm + (j - mm) * bend, a + dv]


func solve(R: Dictionary, p: Dictionary, X: float, Y: float, face: float) -> Dictionary:
	var L: float = p.lean * D2R
	var HA: float = (p.lean + p.head) * D2R
	var hip := Vector2(p.hx, p.hy)
	var sh: Vector2 = hip + Vector2(sin(L), -cos(L)) * float(R.spine)
	var u := Vector2(sin(HA), -cos(HA))
	var nk: Vector2 = sh + u * float(R.neck)
	var hd: Vector2 = sh + u * float(R.neck + R.headR)
	var A := joint(sh, sh + Vector2(p.ax, p.ay), R.upper, R.fore, p.ea)
	var hA: Vector2 = A[1]
	var wa: float = p.w * D2R
	var wv := Vector2(cos(wa), sin(wa))
	# second hand: free target, or locked onto the grip for a two-handed hold (th = 1)
	var tb: Vector2 = (sh + Vector2(p.bx, p.by)).lerp(hA - wv * float(R.grip), p.th)
	var Bj := joint(sh, tb, R.upper, R.fore, p.eb)
	var K1 := joint(hip, Vector2(p.f1x, p.f1y), R.thigh, R.shin, -1.0)
	var K2 := joint(hip, Vector2(p.f2x, p.f2y), R.thigh, R.shin, -1.0)
	var pts := {
		"hip": hip, "sh": sh, "nk": nk, "hd": hd,
		"eA": A[0], "hA": hA, "eB": Bj[0], "hB": Bj[1],
		"k1": K1[0], "f1": K1[1], "k2": K2[0], "f2": K2[1],
		"wb": hA - wv * float(R.pommel),
		"wt": hA + wv * float(R.wlen),
	}
	if R.get("wlen2", 0) > 0:   # a second weapon in the other hand (dual wielders), angle w2
		var w2: float = p.w2 * D2R
		var v2 := Vector2(cos(w2), sin(w2))
		pts["wb2"] = Bj[1] - v2 * float(R.pommel)
		pts["wt2"] = Bj[1] + v2 * float(R.wlen2)
	var r: float = p.rot * D2R
	var c: float = cos(r)
	var s: float = sin(r)
	var pv := Vector2(R.pvx, R.pvy)
	var off := Vector2(p.ox, p.oy)
	var S := {}
	for k in pts:
		var q: Vector2 = pts[k]
		if r != 0.0:
			var dq: Vector2 = q - pv
			q = pv + Vector2(dq.x * c - dq.y * s, dq.x * s + dq.y * c)
		S[k] = Vector2(X + face * (q.x + off.x), Y + q.y + off.y)
	var v: Vector2 = u
	if r != 0.0:
		v = Vector2(u.x * c - u.y * s, u.x * s + u.y * c)
	S["up"] = Vector2(face * v.x, v.y)
	S["fw"] = Vector2(face * -v.y, v.x)
	return S


## Closest distance between two segments, plus the contact point: [distance, point].
func segDist(a: Vector2, b: Vector2, c: Vector2, dd: Vector2) -> Array:
	var d1: Vector2 = b - a
	var d2: Vector2 = dd - c
	var rr: Vector2 = a - c
	var aa: float = d1.dot(d1)
	var e: float = d2.dot(d2)
	var f: float = d2.dot(rr)
	var s := 0.0
	var t := 0.0
	if aa > 1e-9 or e > 1e-9:
		if aa <= 1e-9:
			t = clampf(f / e, 0.0, 1.0)
		else:
			var cc: float = d1.dot(rr)
			if e <= 1e-9:
				s = clampf(-cc / aa, 0.0, 1.0)
			else:
				var bb: float = d1.dot(d2)
				var den: float = aa * e - bb * bb
				s = clampf((bb * f - cc * e) / den, 0.0, 1.0) if den != 0.0 else 0.0
				t = (bb * s + f) / e
				if t < 0.0:
					t = 0.0
					s = clampf(-cc / aa, 0.0, 1.0)
				elif t > 1.0:
					t = 1.0
					s = clampf((bb - cc) / aa, 0.0, 1.0)
	var p1: Vector2 = a + d1 * s
	var p2: Vector2 = c + d2 * t
	return [p1.distance_to(p2), (p1 + p2) / 2.0]


## caps: [[from, to, radius], ...]. Returns [distance, point] of the first capsule touched, or null.
func hitTest(a: Vector2, b: Vector2, r: float, caps: Array):
	for cp in caps:
		var h := segDist(a, b, cp[0], cp[1])
		if h[0] <= r + cp[2]:
			return h
	return null


# ---------------------------------------------------------------- secondary motion (visual only)
# Layered on top of the animation pose every step, just before drawing. Weapon hit checks use the
# animation pose directly, and the only layer that can move a weapon (torso lean) is limited to
# running and fades out within 0.12s of an action starting, before any hit window opens.
func newMotion(ch: Dictionary) -> void:
	ch.merge({
		"dpose": {}, "feet": [{"off": 0.0, "step": null}, {"off": 0.0, "step": null}],
		"sx": ch.x, "sy": ch.y, "svx": 0.0, "svy": 0.0, "lastFace": ch.face, "lw": 0.0,
		"sLean": {"x": 0.0, "v": 0.0}, "sHead": {"x": null, "v": 0.0},
		"sArmX": {"x": 0.0, "v": 0.0}, "sArmY": {"x": 0.0, "v": 0.0},
	}, true)


## damped spring: w = stiffness (rad/s), z = damping ratio (below 1 overshoots a little)
func spring(s: Dictionary, target: float, w: float, z: float, dt: float) -> void:
	s.v += (w * w * (target - s.x) - 2.0 * z * w * s.v) * dt
	s.x += s.v * dt


## Gait cycle with a planted stance part (fraction sf): the foot moves back exactly as fast as the
## body moves forward, so it stays still on the ground, then lifts and swings forward on an arc.
## Returns Vector2(forward offset, lift).
func gait(ph: float, S: float, H: float, sf := 0.5) -> Vector2:
	var p: float = ph - floorf(ph)
	if p < sf:
		return Vector2(S - 2.0 * S * p / sf, 0.0)
	var u: float = (p - sf) / (1.0 - sf)
	return Vector2(-S + 2.0 * S * easef("io", u), H * sin(PI * u))


func startStep(f: Dictionary, cfg: Dictionary) -> void:
	var k: float = absf(f.off) / cfg.thr
	f["step"] = {"from": f.off, "t": 0.0, "dur": cfg.dur * clampf(0.6 + 0.25 * k, 0.7, 1.4), "h": clampf(0.4 + 0.4 * k, 0.5, 1.4)}


## Feet on the ground ignore root motion (attack steps, lunges, knockback) and take a quick
## arcing step to catch up once they fall too far behind, so they never skate.
func plantFeet(ch: Dictionary, cfg: Dictionary, dt: float, mode: String, dx: float, p: Dictionary) -> void:
	var K := [["f1x", "f1y"], ["f2x", "f2y"]]
	for i in 2:
		var f: Dictionary = ch.feet[i]
		var other: Dictionary = ch.feet[1 - i]
		var lift := 0.0
		if f.step != null:
			f.step.t += dt
			var u: float = clampf(f.step.t / f.step.dur, 0.0, 1.0)
			f.off = f.step.from * (1.0 - easef("io", u))
			lift = cfg.lift * f.step.h * sin(PI * u)
			if u >= 1.0:
				f.step = null
				f.off = 0.0
				if is_same(ch, G.B):
					Snd.sStep(G.B.x, G.BK.stepW)
		elif mode == "free" or p[K[i][1]] < -2.0:
			f.off *= exp(-18.0 * dt)
		elif mode == "lock":
			f.off -= dx
			if absf(f.off) > cfg.thr and (other.step == null or absf(f.off) > cfg.reach):
				startStep(f, cfg)
		elif absf(f.off) > 1.5:
			if other.step == null:
				startStep(f, cfg)
		else:
			f.off = 0.0
		p[K[i][0]] += ch.face * f.off
		p[K[i][1]] -= lift


## The walk speed a motion config leans against (some follow a live setting).
func cfgWalk(cfg: Dictionary) -> float:
	if cfg.has("walkPath"):
		return T.get_val(cfg.walkPath)
	return float(cfg.walk)


## mode: "gait" (running/standing), "lock" (grounded action), "free" (airborne, rolling, knocked down)
func finalize(ch: Dictionary, cfg: Dictionary, dt: float, mode: String) -> Dictionary:
	var p: Dictionary = copyPose(ch.pose, ch.dpose)
	var dx: float = ch.x - ch.sx
	var dy: float = ch.y - ch.sy
	ch.sx = ch.x
	ch.sy = ch.y
	if absf(dx) > 60.0 or absf(dy) > 60.0:   # a teleport (restart), not movement
		dx = 0.0
		dy = 0.0
		ch.svx = 0.0
		ch.svy = 0.0
		for f in ch.feet:
			f.off = 0.0
			f.step = null
	var vx: float = dx / dt
	var vy: float = dy / dt
	var ax: float = clampf((vx - ch.svx) / dt, -15000.0, 15000.0)
	var ay: float = clampf((vy - ch.svy) / dt, -15000.0, 15000.0)
	ch.svx = vx
	ch.svy = vy
	if ch.face != ch.lastFace:
		ch.lastFace = ch.face
		for f in ch.feet:
			f.off = 0.0
			f.step = null
		ch.sArmX.x = 0.0
		ch.sArmX.v = 0.0
	var free: bool = mode == "free" or absf(p.rot) > 0.01
	var al: float = ax * ch.face
	# torso settles into running speed and pitches a little on starts and stops
	if mode == "gait":
		spring(ch.sLean, clampf(cfg.leanV * vx * ch.face / maxf(1.0, cfgWalk(cfg)) - 0.0035 * al, -9.0, 9.0), cfg.lean[0], cfg.lean[1], dt)
		ch.lw = 1.0
	else:
		ch.lw = maxf(0.0, ch.lw - dt / 0.12)
	p.lean += ch.sLean.x * ch.lw
	# head trails fast torso moves slightly, then settles
	var hT: float = p.lean + p.head
	if free or ch.sHead.x == null:
		ch.sHead.x = hT
		ch.sHead.v = 0.0
	else:
		spring(ch.sHead, hT, cfg.head[0], cfg.head[1], dt)
		ch.sHead.x = clampf(ch.sHead.x, hT - 22.0, hT + 22.0)
	p.head = ch.sHead.x - p.lean
	# a free (non-weapon) arm swings against the body's acceleration
	if cfg.has("arm"):
		if free:
			ch.sArmX.x *= exp(-10.0 * dt)
			ch.sArmY.x *= exp(-10.0 * dt)
			ch.sArmX.v = 0.0
			ch.sArmY.v = 0.0
		else:
			var w: float = cfg.arm[0]
			var z: float = cfg.arm[1]
			var gain: float = cfg.arm[2]
			ch.sArmX.v -= al * gain * dt
			ch.sArmY.v -= ay * gain * dt
			spring(ch.sArmX, 0.0, w, z, dt)
			spring(ch.sArmY, 0.0, w, z, dt)
			ch.sArmX.x = clampf(ch.sArmX.x, -22.0, 22.0)
			ch.sArmY.x = clampf(ch.sArmY.x, -22.0, 22.0)
		p.bx += ch.sArmX.x
		p.by += ch.sArmY.x
	plantFeet(ch, cfg, dt, "free" if free else mode, dx, p)
	return p
