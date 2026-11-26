extends Node
## Stick Souls — automated checks for the Godot port, ported from the browser version's test suites.
## The fight is stepped by hand on a fake clock, so results don't depend on the machine's speed.
## Run from the stick-souls-godot folder:
##   godot --headless --path . res://tests/checks.tscn
## Prints PASS/FAIL lines; the exit code is the number of failures.
## It never writes your saved settings.

var fails := 0
var total := 0
var main
var ui


func check(nm: String, ok: bool, info = null) -> void:
	total += 1
	var s := ("PASS  " if ok else "FAIL  ") + nm
	if info != null:
		s += "  — " + str(info)
	print(s)
	if not ok:
		fails += 1


func run(sec: float) -> void:
	var dt := 1.0 / 120.0
	for i in int(round(sec / dt)):
		G.test_time += dt
		G.frame(dt)


func run_until(cond: Callable, max_sec: float) -> bool:
	var dt := 1.0 / 120.0
	var t := 0.0
	while t < max_sec:
		if cond.call():
			return true
		G.test_time += dt
		G.frame(dt)
		t += dt
	return cond.call()


func defaults() -> void:
	for k in ["p", "b", "d", "f"]:
		T.set(k, T.DEFAULTS[k].duplicate())


func fight(id: String) -> void:
	G.BK = G.BOSSES[id]
	G.reset()
	G.mode = "play"
	G.releaseAll()


## both fighters placed, the boss passive until told otherwise
func setup(px: float, bx: float, id := "warden") -> void:
	defaults()
	T.b.walk = 0.0
	T.d.walk = 0.0
	fight(id)
	G.P.x = px
	G.B.x = bx
	G.B.face = G.sgn(px - bx, -1.0)
	G.P.face = -G.B.face
	G.B.wait = 999.0
	run(0.05)


func tap() -> void:
	G.atkDown()
	G.atkUp()


func key(code: Key, pressed := true) -> void:
	var e := InputEventKey.new()
	e.physical_keycode = code
	e.pressed = pressed
	main.handle_key(e)


func _ready() -> void:
	seed(1)
	G.test_time = 1000.0
	main = load("res://main.tscn").instantiate()
	add_child(main)
	main.set_process(false)   # the checks drive the frames themselves
	ui = main.ui
	ui.save_pending = true    # never write the saved settings file
	defaults()

	# ---------------------------------------------------------------- menus and the Warden
	check("start menu shows on load", ui.main_menu.visible and G.mode == "menu")
	ui.b_start.pressed.emit()
	check("Start opens the boss choice", ui.choose.visible and not ui.main_menu.visible)
	ui.foe_btns[0][0].pressed.emit()
	check("choosing the Warden begins the fight", G.mode == "play" and G.BK.id == "warden" and G.B.maxHp == 520.0)

	setup(880, 1000)
	tap()
	var hit := run_until(func(): return G.B.hp < 520.0, 2.0)
	check("tap attack lands a light hit around 0.53s", hit and G.P.t >= 0.5 and G.P.t <= 0.7, "anim %.2fs" % G.P.t)

	setup(880, 1000)
	G.B.maxHp = 1e6
	G.B.hp = 1e6
	var seen := {}
	for i in 40:
		tap()
		run(0.1)
		seen[G.P.state] = true
	check("light attacks chain light1 → light2 → light3", seen.has("light2") and seen.has("light3"), seen.keys())

	setup(880, 1000)
	G.atkDown()
	run(0.3)
	check("holding attack 0.2s starts a heavy", G.P.state in ["heavyWind", "heavyCharge", "heavyStrike"], G.P.state)
	var charged := run_until(func(): return G.P.state == "heavyStrike" and G.P.charge >= 1.0, 2.0)
	G.atkUp()
	check("holding through the charge fires a charged heavy", charged)

	setup(850, 1000)
	G.bBegin("smash")
	var smashed := run_until(func(): return G.P.hp < 100.0, 3.0)
	var tc: float = G.B.t
	check("standing in the smash takes damage", smashed, "contact at %.2fs (anim)" % tc)

	setup(850, 1000)
	G.bBegin("smash")
	run_until(func(): return G.B.t >= tc - 0.12, 3.0)
	G.input.r = true
	G.press("roll")
	run(0.1)
	G.input.r = false
	run(2.0)
	check("rolling through the smash on time avoids damage", G.P.hp == 100.0, G.P.hp)

	setup(850, 1000)
	G.bBegin("smash")
	G.blockDown()
	run_until(func(): return G.P.hp < 100.0, 3.0)
	run(0.3)
	G.blockUp()
	check("blocking early takes reduced damage", G.P.hp < 100.0 and G.P.hp > 85.0 and G.B.state != "reel", "hp %.1f" % G.P.hp)

	setup(850, 1000)
	G.bBegin("smash")
	run_until(func(): return G.B.t >= tc - 0.05, 3.0)
	G.blockDown()
	run(0.2)
	G.blockUp()
	check("pressing block right as the hit lands parries", G.B.state == "reel" and G.P.hp == 100.0, "%s, hp %.1f" % [G.B.state, G.P.hp])
	G.P.x = G.B.x + G.B.face * 70.0
	var hp0: float = G.B.hp
	tap()
	run(0.38)
	var crit_ok: bool = G.P.state == "crit" and G.B.state == "critHit"
	run(1.3)
	check("attacking a parried boss from the front does a critical hit", crit_ok)
	check("critical hit deals its damage", hp0 - G.B.hp >= 34.0, "%.1f" % (hp0 - G.B.hp))

	setup(850, 1000)
	G.bBegin("smash")
	G.blockDown()
	run_until(func(): return G.P.state == "blockHit", 3.0)
	G.press("heavy")
	run(0.1)
	G.blockUp()
	check("heavy right after a block is a guard counter", G.P.state == "gCounter", G.P.state)

	setup(900, 1000)
	G.B.poise = 30.0
	G.atkDown()
	run_until(func(): return G.P.state == "heavyStrike" and G.P.charge >= 1.0, 2.0)
	G.atkUp()
	run_until(func(): return G.B.state == "stagger", 1.0)
	check("charged heavies break poise and the boss kneels", G.B.state == "stagger", G.B.state)

	setup(900, 1000)
	G.bBegin("stomp")
	check("standing in the stomp shockwave takes damage", run_until(func(): return G.P.hp < 100.0, 2.0))

	setup(700, 1000)
	G.press("roll")
	run(0.05)
	check("dodge with no direction is a backstep", G.P.state == "backstep", G.P.state)

	setup(600, 1000)
	G.input.r = true
	G.press("roll")
	run_until(func(): return G.P.state == "roll" and G.P.t >= 0.47, 1.0)
	G.input.r = false
	tap()
	run(0.05)
	check("attack at the end of a roll is a rolling attack", G.P.state == "rollAtk", G.P.state)

	setup(700, 1000)
	G.input.l = true
	run(1.0)
	check("moving away turns and runs at full speed", G.P.face == -1.0 and absf(G.P.vx) >= 255.0, "face %d, speed %.0f" % [int(G.P.face), absf(G.P.vx)])
	G.input.l = false

	setup(800, 1000)
	T.b.healPunish = 1.0
	G.press("heal")
	run(0.5)
	check("healing in reach makes the boss attack at once", G.B.state != "loco", G.B.state)

	setup(800, 1000)
	G.B.hp = G.B.maxHp * 0.45
	G.B.pending2 = true
	G.B.wait = 0.0
	run(0.2)
	check("boss enters phase 2 below half health", G.B.phase2 and G.B.state == "roar", G.B.state)

	var fin: Dictionary = G.withFinisher(G.BK.moves.smash)
	var last_hit := 0.0
	for h in fin.hits:
		last_hit = maxf(last_hit, h.t1)
	for e in fin.events:
		last_hit = maxf(last_hit, e.t)
	check("the last attack of a string leaves at least 1.2s of recovery", fin.act - last_hit >= 1.2 * G.bSpeed() - 0.03, "%.2fs" % (fin.act - last_hit))

	setup(860, 1000)
	T.b.walk = 140.0
	G.B.phase2 = true
	G.B.wait = 0.0
	G.P.hp = 1e9
	var seen2 := {}
	for i in 300:
		run(0.1)
		seen2[G.B.state] = true
		if i % 15 == 0:
			G.P.x = 400.0 + randf() * 800.0
	check("phase 2 boss uses the quake and delayed attacks", seen2.has("quake") and (seen2.has("smashD") or seen2.has("thrustD")), seen2.keys())

	setup(930, 1000)
	G.B.hp = 3.0
	tap()
	run(5.0)
	check("killing the boss shows VICTORY", G.ended != null and G.ended.kind == "win")
	key(KEY_R)
	check("R restarts the fight", G.ended == null and G.B.hp == G.B.maxHp)

	setup(850, 1000)
	G.P.hp = 1.0
	G.bBegin("smash")
	run(5.0)
	check("dying shows YOU FELL", G.ended != null and G.ended.kind == "lose")

	fight("warden")
	key(KEY_ESCAPE)
	check("Esc pauses and shows the pause menu", G.mode == "pause" and ui.pause.visible)
	var run_row = null
	for r in ui.rows:
		if r.s[1] == "p.run":
			run_row = r
	run_row.slider.value = 300.0
	check("a slider changes the game value live", T.p.run == 300.0, T.p.run)
	ui.b_reset.pressed.emit()
	check("Reset to defaults restores values", T.p.run == 260.0, T.p.run)
	ui.b_resume.pressed.emit()
	check("Resume returns to the fight", G.mode == "play" and not ui.pause.visible)

	setup(880, 1000)
	var A: Dictionary = main.btn("light")
	main.touch_down(0, Vector2(A.x, A.y))
	run(0.05)
	main.touch_up(0)
	run(0.1)
	check("tapping ATTACK on a phone starts a light swing", G.P.state == "light1", G.P.state)
	main.touchUI = false
	main.layout()

	# ---------------------------------------------------------------- the Twinfang Duelist
	ui.to_menu()
	ui.b_start.pressed.emit()
	ui.foe_btns[1][0].pressed.emit()
	check("choosing the Duelist starts its fight", G.BK.id == "duelist" and G.mode == "play" and G.B.maxHp == 380.0)

	var mn := 9.0
	var mn_name := ""
	for k in G.BK.moves:
		var mv: Dictionary = G.BK.moves[k]
		if mv.has("hits") and mv.hits[0].t0 < mn:
			mn = mv.hits[0].t0
			mn_name = k
	var real: float = mn / (T.f.tempo * T.f.bossSpeed)
	check("fastest wind-up stays at or above 0.45s real", real >= 0.449, "%s: %.3fs" % [mn_name, real])

	setup(880, 1000, "duelist")
	G.bBegin("twin")
	var tw := run_until(func(): return G.P.hp < 100.0, 2.0)
	var tct: float = G.B.t
	check("Twin Slash hits a player standing still", tw, "contact at %.2fs (anim)" % tct)
	setup(880, 1000, "duelist")
	G.bBegin("twin")
	run_until(func(): return G.B.t >= tct - 0.05, 2.0)
	G.blockDown()
	run(0.2)
	G.blockUp()
	check("Twin Slash can be parried", G.B.state == "reel" and G.P.hp == 100.0, "%s, hp %.1f" % [G.B.state, G.P.hp])
	G.P.x = G.B.x + G.B.face * 70.0
	var dhp0: float = G.B.hp
	tap()
	run(0.38)
	var dcrit: bool = G.P.state == "crit" and G.B.state == "critHit"
	run(1.3)
	check("critical hit works on the Duelist", dcrit)
	check("critical damage lands", dhp0 - G.B.hp >= 34.0, "%.1f" % (dhp0 - G.B.hp))

	setup(700, 1000, "duelist")
	G.bBegin("aerial")
	run_until(func(): return G.P.hp < 100.0, 3.0)
	var ta: float = G.B.t
	setup(700, 1000, "duelist")
	G.bBegin("aerial")
	run_until(func(): return G.B.t >= ta - 0.05, 3.0)
	G.blockDown()
	run(0.2)
	G.blockUp()
	check("Aerial Cross cannot be parried (it is only blocked)", G.B.state == "aerial" and G.P.hp < 100.0 and G.P.hp > 90.0, "%s, hp %.1f" % [G.B.state, G.P.hp])

	setup(780, 1000, "duelist")
	G.bBegin("dash")
	run(1.2)
	check("Dash Slash cuts through and ends behind you", G.B.x < G.P.x and G.P.hp < 100.0, "boss %.0f, you %.0f, hp %.1f" % [G.B.x, G.P.x, G.P.hp])

	setup(940, 1000, "duelist")
	G.B.poise = 10.0
	G.B.wait = 0.0
	run(0.06)
	check("near a poise break it backsteps and recovers some poise", G.B.state == "backstep" and G.B.poise >= 34.0, "%s, poise %.0f" % [G.B.state, G.B.poise])

	setup(860, 1000, "duelist")
	T.d.walk = 190.0
	G.B.hp = 185.0
	G.B.pending2 = true
	G.B.wait = 0.0
	G.P.hp = 1e9
	run(0.2)
	check("phase 2 starts with its blade flourish", G.B.state == "rally" and G.B.phase2, G.B.state)
	var seen3 := {}
	for i in 300:
		run(0.1)
		seen3[G.B.state] = true
		if i % 15 == 0:
			G.P.x = 400.0 + randf() * 800.0
	check("phase 2 Duelist uses its moves including Whirl", seen3.has("whirl") and seen3.has("twin") and seen3.has("dash"), seen3.keys())

	setup(930, 1000, "duelist")
	G.B.hp = 3.0
	tap()
	run(5.0)
	check("defeating the Duelist shows VICTORY", G.ended != null and G.ended.kind == "win")
	key(KEY_R)
	check("restart keeps the Duelist", G.BK.id == "duelist" and G.B.hp == 380.0)

	print("\n%d of %d checks passed" % [total - fails, total])
	get_tree().quit(fails)
