extends RefCounted
## Stick Souls — the player's rig, poses and moves. Ported 1:1 from stick-souls/js/player.js.
## Timings follow Elden Ring's two-handed greatsword (seconds at attack speed 1).


static func build() -> Dictionary:
	var M := func(a: Dictionary, b: Dictionary) -> Dictionary: return a.merged(b, true)
	var PR := {"thigh": 23.0, "shin": 23.0, "spine": 31.0, "neck": 5.0, "headR": 8.5, "upper": 17.5, "fore": 17.5,
		"grip": 11.0, "pommel": 14.0, "wlen": 76.0, "pvx": 12.0, "pvy": -26.0, "line": 4.0}
	var PB := {"hx": 0, "hy": -42, "lean": 8, "head": -4, "ax": 14, "ay": 22, "bx": 8, "by": 24, "w": -38, "w2": 0,
		"th": 1, "ea": 1, "eb": 1, "f1x": 13, "f1y": 0, "f2x": -12, "f2y": 0, "rot": 0, "ox": 0, "oy": 0}
	var GUARD := {"hx": 0, "hy": -42, "lean": 8, "head": -4, "ax": 14, "ay": 22, "w": -38, "th": 1, "ea": 1,
		"f1x": 14, "f1y": 0, "f2x": -12, "f2y": 0, "rot": 0, "ox": 0, "oy": 0}
	# running: greatsword carried low with the blade trailing behind
	var RUN: Dictionary = M.call(PB, {"hy": -38, "lean": 18, "head": -14, "ax": 8, "ay": 28, "w": 150})
	var BLOCK: Dictionary = M.call(GUARD, {"hy": -40, "lean": 0, "head": -6, "ax": 16, "ay": 6, "w": -84, "f1x": 16, "f2x": -15})
	var TUCK := {"hy": -24, "lean": 62, "head": 22, "ax": 8, "ay": 12, "w": -208, "f1x": 10, "f1y": -9, "f2x": 0, "f2y": -5}
	var DOWN_KEYS := [
		[0, {}],
		[0.12, {"lean": -30, "head": -25, "rot": -35, "hy": -40, "ax": -4, "ay": -14, "w": -130, "f1x": 22, "f1y": -12, "f2x": 4, "f2y": -4}, "out"],
		[0.36, {"rot": -88, "oy": 20, "ox": -6, "lean": -6, "head": -10, "hy": -44, "ax": 10, "ay": 10, "w": -30, "f1x": 16, "f1y": 0, "f2x": 6, "f2y": -6}, "in2"],
	]
	var PA := {}

	PA["light1"] = {
		"an": Core.mk(PB, [
			[0, {}],
			[0.22, {"ax": 4, "ay": -6, "w": -140, "lean": 0, "hy": -42, "head": -4, "f1x": 14, "f2x": -13}, "out"],
			[0.40, {"ax": -2, "ay": -12, "w": -158, "lean": -5, "hy": -43, "head": -2, "f1x": 15, "f2x": -14}, "io"],
			[0.53, {"ax": 16, "ay": -8, "w": -62, "lean": 8, "hy": -41, "head": -6, "f1x": 20, "f2x": -15}, "in"],
			[0.62, {"ax": 26, "ay": 18, "w": 30, "lean": 22, "hy": -37, "head": -8, "f1x": 26, "f2x": -15}, "lin"],
			[0.70, {"ax": 24, "ay": 18, "w": 36, "lean": 24}, "out"],
			[1.10, {"ax": 22, "ay": 18, "w": 35, "lean": 22}, "lin"],
			[1.32, M.call(GUARD, {"lean": 5, "hy": -43, "ay": 20, "w": -45}), "out"],
			[1.45, GUARD, "io"],
		]),
		"hits": [{"t0": 0.53, "t1": 0.66, "k": "L1"}], "pay": [0.53, "L1"],
		"moves": [{"t0": 0.40, "t1": 0.62, "d": 30}],
		"chainAt": 0.85, "next": "light2", "rollAt": 0.95, "act": 1.25, "armor": [0.30, 0.83], "regenAt": 1.3, "atk": true, "spd": "atk",
	}
	PA["light2"] = {
		"an": Core.mk(PB, [
			[0, {}],
			[0.30, {"ax": 6, "ay": 24, "w": 40, "lean": 18, "hy": -38, "head": -6, "f1x": 18, "f2x": -16}, "out"],
			[0.48, {"ax": 2, "ay": 26, "w": 52, "lean": 20, "hy": -37, "f1x": 17, "f2x": -17}, "io"],
			[0.60, {"ax": 18, "ay": 6, "w": -10, "lean": 14, "hy": -40, "head": -8, "f1x": 20, "f2x": -14}, "in"],
			[0.68, {"ax": 24, "ay": -22, "w": -78, "lean": 10, "hy": -40, "f1x": 21, "f2x": -12}, "lin"],
			[0.82, {"ax": 16, "ay": -28, "w": -100, "lean": 4}, "out"],
			[1.20, {"ax": 15, "ay": -26, "w": -96, "lean": 5}, "lin"],
			[1.38, M.call(GUARD, {"lean": 10, "ay": 24, "w": -31}), "out"],
			[1.50, GUARD, "io"],
		]),
		"hits": [{"t0": 0.58, "t1": 0.73, "k": "L2"}], "pay": [0.58, "L2"],
		"moves": [{"t0": 0.45, "t1": 0.68, "d": 24}],
		"chainAt": 1.0, "next": "light3", "rollAt": 1.05, "act": 1.3, "armor": [0.30, 0.90], "regenAt": 1.35, "atk": true, "spd": "atk",
	}
	# finisher: slower two-handed overhead slam
	PA["light3"] = {
		"an": Core.mk(PB, [
			[0, {}],
			[0.35, {"ax": -4, "ay": -24, "w": -150, "lean": -8, "hy": -41, "head": -6, "f1x": 16, "f2x": -16}, "out"],
			[0.62, {"ax": -6, "ay": -27, "w": -162, "lean": -11, "hy": -40, "f1x": 17, "f2x": -18}, "io"],
			[0.80, {"ax": 18, "ay": -6, "w": -50, "lean": 12, "hy": -38, "head": -6, "f1x": 24, "f2x": -15}, "in"],
			[0.90, {"ax": 28, "ay": 16, "w": 34, "lean": 30, "hy": -33, "head": -2, "f1x": 28, "f2x": -16}, "lin"],
			[1.05, {"ax": 27, "ay": 17, "w": 36, "lean": 31, "hy": -32}, "out"],
			[1.40, {"lean": 29}, "lin"],
			[1.62, M.call(GUARD, {"lean": 4, "hy": -43, "w": -46}), "out"],
			[1.75, GUARD, "io"],
		]),
		"hits": [{"t0": 0.80, "t1": 0.95, "k": "L3"}], "pay": [0.80, "L3"],
		"moves": [{"t0": 0.62, "t1": 0.90, "d": 34}],
		"events": [{"t": 0.90, "ev": "pImpact"}],
		"chainAt": 1.30, "next": "light1", "rollAt": 1.25, "act": 1.5, "armor": [0.30, 1.0], "regenAt": 1.5, "atk": true, "spd": "atk",
	}
	# heavy: raise; keep holding to charge (all or nothing), release or full charge to swing
	PA["heavyWind"] = {
		"an": Core.mk(PB, [
			[0, {}],
			[0.45, {"ax": -6, "ay": -26, "w": -160, "lean": -8, "hy": -40, "head": -8, "f1x": 19, "f2x": -18}, "out"],
		]),
		"armor": [0.30, 99], "regenAt": 99, "atk": true, "spd": "atk",
	}
	PA["heavyStrike"] = {
		"an": Core.mk(PB, [
			[0, {}],
			[0.12, {"ax": -8, "ay": -28, "w": -166, "lean": -10, "hy": -39}, "out"],
			[0.25, {"ax": 16, "ay": -6, "w": -50, "lean": 14, "hy": -37, "head": -4, "f1x": 26, "f2x": -16}, "in"],
			[0.33, {"ax": 28, "ay": 18, "w": 35, "lean": 30, "hy": -33, "head": -2, "f1x": 30, "f2x": -16}, "lin"],
			[0.45, {"lean": 31, "hy": -32}, "out"],
			[0.85, {"lean": 30}, "lin"],
			[1.12, M.call(GUARD, {"lean": 4, "hy": -43, "w": -46}), "out"],
			[1.25, GUARD, "io"],
		]),
		"hits": [{"t0": 0.25, "t1": 0.38, "k": "H"}], "pay": [0.25, "H"],
		"moves": [{"t0": 0.12, "t1": 0.33, "d": 30}],
		"events": [{"t": 0.33, "ev": "pImpact"}],
		"armor": [0, 0.58], "rollAt": 0.75, "act": 0.85, "regenAt": 0.9, "atk": true, "spd": "atk",
	}
	# roll: invincible from 0.03s for T.p.rollInv seconds
	PA["roll"] = {
		"an": Core.mk(PB, [
			[0, {}],
			[0.10, {"hy": -32, "lean": 38, "head": 10, "ax": 12, "ay": 18, "w": -60, "f1x": 20, "f2x": -16, "f2y": -6}, "out"],
			[0.18, M.call(TUCK, {"rot": 50}), "lin"],
			[0.46, M.call(TUCK, {"rot": 320}), "lin"],
			[0.58, {"hy": -34, "lean": 22, "head": 0, "ax": 14, "ay": 20, "w": -30, "f1x": 16, "f1y": 0, "f2x": -14, "f2y": 0, "rot": 360}, "out"],
			[0.72, M.call(GUARD, {"rot": 360}), "io"],
		]),
		"moves": [{"t0": 0.03, "t1": 0.60, "d": "rollDist", "e": "out2"}],
		"inv": "roll", "cost": "costRoll", "act": 0.67, "rollAt": 0.67, "rollAtkFrom": 0.45, "regenAt": 1.0, "roll": true, "spd": "roll",
	}
	PA["rollAtk"] = {
		"an": Core.mk(PB, [
			[0, {}],
			[0.18, {"ax": 6, "ay": 20, "w": 150, "lean": 20, "hy": -36, "ea": -1, "f1x": 18, "f2x": -15}, "out"],
			[0.30, {"ax": 26, "ay": 4, "w": 10, "lean": 16, "hy": -40, "ea": 1, "f1x": 22, "f2x": -14}, "in"],
			[0.40, {"ax": 22, "ay": -14, "w": -40, "lean": 10, "hy": -42}, "out"],
			[0.80, {"ax": 18, "ay": -10, "w": -45, "lean": 9}, "lin"],
			[1.0, GUARD, "io"],
		]),
		"hits": [{"t0": 0.26, "t1": 0.40, "k": "RA"}], "pay": [0.26, "RA"],
		"moves": [{"t0": 0.10, "t1": 0.32, "d": 26}],
		"act": 0.85, "rollAt": 0.75, "regenAt": 0.9, "atk": true, "spd": "atk",
	}
	# dodge with no direction held: short hop back, no invincibility
	PA["backstep"] = {
		"an": Core.mk(PB, [
			[0, {}],
			[0.08, {"hy": -38, "lean": -6, "f1x": 10, "f2x": -10, "ay": 18}, "out"],
			[0.22, {"hy": -44, "lean": -10, "f1x": 8, "f1y": -6, "f2x": -14, "f2y": -4}, "out"],
			[0.40, GUARD, "io"],
		]),
		"moves": [{"t0": 0.04, "t1": 0.30, "d": -75, "e": "out2"}],
		"cost": "costBackstep", "act": 0.36, "rollAt": 0.36, "regenAt": 0.5, "roll": true, "spd": "roll",
	}
	# hold to block (stays up at least 0.25s so a quick tap can still parry)
	PA["block"] = {
		"an": Core.mk(PB, [[0, {}], [0.1, BLOCK, "out"], [999, BLOCK, "lin"]]),
		"act": 0, "rollAt": 0, "guard": true,
	}
	PA["unblock"] = {"an": Core.mk(PB, [[0, {}], [0.14, GUARD, "io"]]), "act": 0, "rollAt": 0}
	PA["blockHit"] = {
		"an": Core.mk(PB, [
			[0, {}],
			[0.06, M.call(BLOCK, {"lean": -9, "hy": -41, "ax": 8, "ay": 4, "w": -96}), "out"],
			[0.30, BLOCK, "io"],
		]),
		"act": 0.3, "rollAt": 0.15, "guard": true,
	}
	PA["guardBreak"] = {
		"an": Core.mk(PB, [
			[0, {}],
			[0.1, {"lean": -24, "head": -24, "ax": -4, "ay": -18, "w": -120, "hy": -41, "f1x": 16, "f2x": -18}, "out"],
			[0.8, {"lean": -14}, "lin"],
			[1.05, GUARD, "io"],
		]),
		"act": 1.0, "rollAt": 1.0,
	}
	PA["parry"] = {
		"an": Core.mk(PB, [
			[0, {}],
			[0.07, {"lean": -8, "ax": 6, "ay": -20, "w": -118, "hy": -42, "f1x": 16, "f2x": -16}, "out"],
			[0.42, GUARD, "io"],
		]),
		"inv": [0, 0.42], "act": 0.2, "rollAt": 0.2,
	}
	# guard counter: heavy right after blocking a hit
	PA["gCounter"] = {
		"an": Core.mk(PB, [
			[0, {}],
			[0.35, {"ax": -6, "ay": -24, "w": -150, "lean": -6, "hy": -41, "f1x": 17, "f2x": -16}, "out"],
			[0.53, {"ax": 16, "ay": -6, "w": -50, "lean": 14, "hy": -37, "f1x": 24, "f2x": -15}, "in"],
			[0.62, {"ax": 28, "ay": 18, "w": 35, "lean": 30, "hy": -33, "f1x": 28, "f2x": -16}, "lin"],
			[0.75, {"lean": 30, "hy": -32}, "out"],
			[1.15, M.call(GUARD, {"lean": 4, "hy": -43, "w": -46}), "out"],
			[1.3, GUARD, "io"],
		]),
		"hits": [{"t0": 0.53, "t1": 0.66, "k": "GC"}], "pay": [0.53, "GC"],
		"moves": [{"t0": 0.35, "t1": 0.6, "d": 24}],
		"armor": [0, 0.7], "act": 1.1, "rollAt": 1.0, "regenAt": 1.1, "atk": true, "spd": "atk",
	}
	# critical hit on a kneeling or parried boss: stab, hold, rip out
	PA["crit"] = {
		"an": Core.mk(PB, [
			[0, {}],
			[0.15, {"ax": 14, "ay": 6, "w": -10, "lean": 10, "hy": -40, "f1x": 18, "f2x": -16}, "out"],
			[0.40, {"ax": 4, "ay": 2, "w": -4, "lean": 4, "hy": -41, "f1x": 16, "f2x": -18}, "io"],
			[0.52, {"ax": 30, "ay": 2, "w": 4, "lean": 26, "hy": -36, "head": -10, "f1x": 28, "f2x": -14}, "in"],
			[0.95, {"ax": 29, "ay": 3, "w": 6, "lean": 27}, "lin"],
			[1.15, {"ax": 6, "ay": 4, "w": -20, "lean": -6, "hy": -42, "f1x": 14, "f2x": -18}, "out"],
			[1.9, GUARD, "io"],
		]),
		"events": [{"t": 0.52, "ev": "crit1"}, {"t": 1.12, "ev": "crit2"}],
		"inv": [0, 9], "act": 1.7, "rollAt": 1.6, "regenAt": 1.5,
	}
	# heal: plant the sword, drink. The flask is used at 0.6s; getting hit before that saves it.
	PA["heal"] = {
		"an": Core.mk(PB, [
			[0, {}],
			[0.18, {"th": 0, "ax": 16, "ay": 10, "w": 80, "bx": 14, "by": 16, "lean": 6, "hy": -41, "head": -4}, "out"],
			[0.42, {"bx": 9, "by": -9, "head": -24}, "io"],
			[0.72, {"bx": 9, "by": -10, "head": -26}, "lin"],
			[0.95, M.call(GUARD, {"bx": 8, "by": 24}), "io"],
			[1.1, {}, "lin"],
		]),
		"events": [{"t": 0.6, "ev": "heal"}], "act": 1.0, "rollAt": 1.0,
	}
	PA["flinch"] = {
		"an": Core.mk(PB, [
			[0, {}],
			[0.07, {"lean": -16, "head": -20, "hy": -40, "ax": 8, "ay": 14, "w": -72, "f1x": 16, "f2x": -16}, "out"],
			[0.40, GUARD, "io"],
		]),
		"act": 0.34, "rollAt": 0.34,
	}
	# knockdown: thrown back, land, get up (invincible the whole time); roll out from 0.9s
	PA["down"] = {
		"an": Core.mk(PB, DOWN_KEYS + [
			[0.85, {"rot": -90, "oy": 21}, "lin"],
			[1.05, {"rot": -30, "oy": 6, "ox": 0, "hy": -26, "lean": 40, "head": 0, "ax": 14, "ay": 20, "w": -20, "f1x": 16, "f1y": 0, "f2x": -10, "f2y": 0}, "out"],
			[1.3, GUARD, "io"],
		]),
		"inv": [0, 1.2], "act": 1.24, "rollAt": 0.9, "air": [0, 0.36, 26],
	}
	PA["dead"] = {
		"an": Core.mk(PB, DOWN_KEYS + [[3, {"rot": -90, "oy": 21}, "lin"]]),
		"inv": [0, 99], "air": [0, 0.36, 26],
	}
	return {"PR": PR, "PB": PB, "RUN": RUN, "GUARD": GUARD, "PA": PA}
