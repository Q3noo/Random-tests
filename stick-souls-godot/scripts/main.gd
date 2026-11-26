extends Node2D
## Stick Souls — screen layout, keyboard and touch input, the camera and all drawing.
## The fight itself runs in the G autoload; menus are in ui.gd.
## Ported from the browser version (stick-souls/js/render.js, input.js, main.js).

var W := 960.0
var H := 540.0
var wscale := 1.0       # world-to-screen scale ("scale" is taken by Node2D)
var groundY := 0.0
var portrait := false
var touchUI := false
var safe := {"t": 0.0, "r": 0.0, "b": 0.0, "l": 0.0}
var last_size := Vector2.ZERO
var ui

# touch controls: floating stick on the left half, buttons on the right, heal top-left
var btns := [
	{"act": "light", "label": "ATTACK", "sub": "hold: heavy", "x": 0.0, "y": 0.0, "r": 40.0, "down": false},
	{"act": "roll", "label": "ROLL", "sub": "", "x": 0.0, "y": 0.0, "r": 40.0, "down": false},
	{"act": "block", "label": "BLOCK", "sub": "", "x": 0.0, "y": 0.0, "r": 40.0, "down": false},
	{"act": "heal", "label": "HEAL", "sub": "", "x": 0.0, "y": 0.0, "r": 40.0, "down": false},
]
var ptrs := {}   # touch index -> {"b": button} or {"pad": true, ox, oy, x, y, dx}
var padHome := {"x": 0.0, "y": 0.0, "r": 40.0}

const KEYMAP := {
	KEY_LEFT: "l", KEY_A: "l", KEY_RIGHT: "r", KEY_D: "r",
	KEY_J: "atk", KEY_Z: "atk", KEY_K: "heavy", KEY_X: "heavy",
	KEY_SPACE: "roll", KEY_SHIFT: "block",
	KEY_E: "heal", KEY_H: "heal", KEY_C: "heal",
}


func _ready() -> void:
	G.main_node = self
	touchUI = OS.has_feature("mobile")
	ui = preload("res://scripts/ui.gd").new()
	add_child(ui)
	ui.load_local()
	resize()
	G.reset()
	ui.refresh_sliders()
	Snd.set_volume(T.f.volume)


func _process(delta: float) -> void:
	if get_viewport_rect().size != last_size:
		resize()
	var rdt := minf(0.1, delta)
	G.frame(rdt)
	# camera: stays between the fighters, leaning towards the player
	var vw: float = W / wscale
	var aw: float = T.arenaR - T.arenaL
	var target: float = lerpf(G.P.x, G.B.x, 0.42)
	if vw >= aw + 80.0:
		target = (T.arenaL + T.arenaR) / 2.0
	else:
		target = clampf(target, T.arenaL - 40.0 + vw / 2.0, T.arenaR + 40.0 - vw / 2.0)
	G.camX += (target - G.camX) * (1.0 - exp(-4.0 * rdt))
	queue_redraw()


func _notification(what: int) -> void:
	if what == NOTIFICATION_APPLICATION_FOCUS_OUT:
		G.releaseAll()
		if G.mode == "play" and ui != null:
			ui.pause_game()


# ---------------------------------------------------------------- layout
func resize() -> void:
	var sz := get_viewport_rect().size
	last_size = sz
	W = sz.x
	H = sz.y
	safe = {"t": 0.0, "r": 0.0, "b": 0.0, "l": 0.0}
	if OS.has_feature("mobile"):
		var sa := DisplayServer.get_display_safe_area()
		var ws := DisplayServer.window_get_size()
		if ws.x > 0 and ws.y > 0:
			var k := W / float(ws.x)
			safe = {"l": sa.position.x * k, "t": sa.position.y * k, "r": (ws.x - sa.end.x) * k, "b": (ws.y - sa.end.y) * k}
	layout()
	if ui != null:
		ui.on_resize(safe)


func btn(a: String) -> Dictionary:
	for b in btns:
		if b.act == a:
			return b
	return {}


func layout() -> void:
	portrait = H > W * 1.05
	wscale = minf(W / 1150.0, H / 560.0)
	groundY = roundf(H * ((0.56 if portrait else 0.63) if touchUI else 0.68))
	var R := clampf(minf(W, H) * 0.1, 28.0, 48.0)
	var mR := maxf(14.0, safe.r + 8.0)
	var mB := maxf(14.0, safe.b + 8.0)
	var mL := maxf(14.0, safe.l + 8.0)
	var Tp := maxf(14.0, safe.t + 10.0)
	var L0 := maxf(16.0, safe.l + 12.0)
	var A := btn("light")
	A.r = R * 1.2
	A.x = W - mR - A.r
	A.y = H - mB - A.r
	var Ro := btn("roll")
	Ro.r = R
	Ro.x = A.x - A.r - Ro.r - R * 0.35
	Ro.y = H - mB - Ro.r
	var Bk := btn("block")
	Bk.r = R * 0.95
	Bk.x = Ro.x - R * 0.1
	Bk.y = Ro.y - Ro.r - Bk.r - R * 0.45
	var He := btn("heal")
	He.r = R * 0.72
	He.x = L0 + He.r
	He.y = Tp + 48.0 + He.r
	padHome = {"x": mL + R * 1.4, "y": H - mB - R * 1.4, "r": R * 1.25}


# ---------------------------------------------------------------- input
func _input(event) -> void:
	if event is InputEventKey:
		handle_key(event)
	elif event is InputEventScreenTouch:
		if event.pressed:
			touch_down(event.index, event.position)
		else:
			touch_up(event.index)
	elif event is InputEventScreenDrag:
		touch_move(event.index, event.position)
	elif event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		if G.mode == "play" and G.ended != null and G.ended.t > 0.6:
			G.reset()


func handle_key(e: InputEventKey) -> void:
	var code := e.physical_keycode
	if not e.pressed:
		var a = KEYMAP.get(code)
		if a == "l":
			G.input.l = false
		elif a == "r":
			G.input.r = false
		elif a == "atk":
			G.atkUp()
		elif a == "heavy":
			G.input.kbHeavy = false
		elif a == "block":
			G.blockUp()
		return
	if code == KEY_ESCAPE or code == KEY_P:
		if e.echo:
			return
		if G.mode == "play":
			ui.pause_game()
			get_viewport().set_input_as_handled()
		elif G.mode == "pause" and not ui.settings.visible:
			ui.resume_game()
			get_viewport().set_input_as_handled()
		return
	if G.mode != "play":
		return
	if (code == KEY_R or code == KEY_ENTER) and G.ended != null and G.ended.t > 0.5:
		G.reset()
		get_viewport().set_input_as_handled()
		return
	if not KEYMAP.has(code):
		return
	get_viewport().set_input_as_handled()
	if e.echo:
		return
	var act: String = KEYMAP[code]
	if act == "l":
		G.input.l = true
	elif act == "r":
		G.input.r = true
	elif act == "atk":
		G.atkDown()
	elif act == "heavy":
		G.input.kbHeavy = true
		G.press("heavy")
	elif act == "block":
		G.blockDown()
	else:
		G.press(act)


func touch_down(id: int, pos: Vector2) -> void:
	if not touchUI:
		touchUI = true
		layout()
	if G.mode != "play":
		return
	if G.ended != null:
		if G.ended.t > 0.6:
			G.reset()
		return
	for b in btns:
		if pos.distance_to(Vector2(b.x, b.y)) <= b.r * 1.15:
			ptrs[id] = {"b": b}
			b.down = true
			if b.act == "light":
				G.atkDown()
			elif b.act == "block":
				G.blockDown()
			else:
				G.press(b.act)
			return
	if pos.x < W * 0.5:
		ptrs[id] = {"pad": true, "ox": pos.x, "oy": pos.y, "x": pos.x, "y": pos.y, "dx": 0.0}
		updatePad()


func touch_move(id: int, pos: Vector2) -> void:
	var p = ptrs.get(id)
	if p == null or not p.has("pad"):
		return
	p.x = pos.x
	p.y = pos.y
	var lim: float = padHome.r
	if p.x - p.ox > lim:
		p.ox = p.x - lim
	if p.ox - p.x > lim:
		p.ox = p.x + lim
	p.dx = p.x - p.ox
	updatePad()


func touch_up(id: int) -> void:
	var p = ptrs.get(id)
	if p == null:
		return
	ptrs.erase(id)
	if p.has("b"):
		p.b.down = false
		if p.b.act == "light":
			G.atkUp()
		elif p.b.act == "block":
			G.blockUp()
	updatePad()


func updatePad() -> void:
	var dir := 0
	for p in ptrs.values():
		if p.has("pad"):
			dir = 1 if p.dx > 14.0 else (-1 if p.dx < -14.0 else 0)
	G.input.pad = dir


func clearTouch() -> void:
	for b in btns:
		b.down = false
	ptrs.clear()


# ---------------------------------------------------------------- drawing helpers
## a thick stroke through points with round joints and ends (canvas lineCap/lineJoin "round")
func path(pts: Array, c: Color, w: float) -> void:
	for i in range(1, pts.size()):
		draw_line(pts[i - 1], pts[i], c, w, true)
	for pt in pts:
		draw_circle(pt, w * 0.5, c)


## a single stroke without round ends (for see-through strokes, where the caps would double up)
func line(a: Vector2, b: Vector2, c: Color, w: float) -> void:
	draw_line(a, b, c, w, true)


## quadratic curve p0 → p1 bending towards c
func curve(p0: Vector2, c: Vector2, p1: Vector2, col: Color, w: float, caps := true) -> void:
	var pts := PackedVector2Array()
	for i in 13:
		var t := i / 12.0
		pts.append(p0.lerp(c, t).lerp(c.lerp(p1, t), t))
	draw_polyline(pts, col, w, true)
	if caps:
		draw_circle(p0, w * 0.5, col)
		draw_circle(p1, w * 0.5, col)


## a stick-figure head: filled with the background, outlined
func head(center: Vector2, r: float, c: Color, w: float) -> void:
	draw_circle(center, r, T.C.bg)
	draw_arc(center, r, 0.0, TAU, 36, c, w, true)


## soft glow standing in for the canvas shadowBlur
func glow(center: Vector2, r: float, c: Color) -> void:
	draw_circle(center, r * 3.2, Color(c, 0.12))
	draw_circle(center, r * 2.0, Color(c, 0.25))


func claws(e: Vector2, h: Vector2, c: Color, w: float) -> void:
	var u := (h - e).normalized()
	for a in [-0.45, 0.0, 0.45]:
		path([h, h + u.rotated(a) * 13.0], c, w)


func quad(pts: Array, c: Color) -> void:
	draw_primitive(PackedVector2Array(pts), PackedColorArray([c, c, c, c]), PackedVector2Array())


func text(s: String, x: float, y: float, size: int, c: Color, halign := 0, valign := "top", font: Font = null) -> void:
	var f: Font = font if font != null else T.font_ui
	var w := f.get_string_size(s, HORIZONTAL_ALIGNMENT_LEFT, -1, size).x
	var px := x
	if halign == 1:
		px = x - w / 2.0
	elif halign == 2:
		px = x - w
	var asc := f.get_ascent(size)
	var desc := f.get_descent(size)
	var py := y + asc
	if valign == "middle":
		py = y + (asc - desc) / 2.0
	elif valign == "bottom":
		py = y - desc
	draw_string(f, Vector2(px, py), s, HORIZONTAL_ALIGNMENT_LEFT, -1, size, c)


# ---------------------------------------------------------------- drawing: world
func drawSword(S: Dictionary) -> void:
	var C: Dictionary = T.C
	var P: Dictionary = G.P
	var h: Vector2 = S.hA
	var t: Vector2 = S.wt
	var u := (t - h).normalized()
	var n := Vector2(-u.y, u.x)
	path([S.wb, h + u * 2.0], C.hilt, 3.2)
	var gp := h + u * 3.0
	path([gp + n * 7.0, gp - n * 7.0], C.hilt, 3.0)
	var hot := 0.0
	if P.state == "heavyCharge":
		hot = clampf(P.holdT / (T.p.chargeTime / T.f.atkSpeed), 0.0, 1.0)
	if hot > 0.0:
		draw_line(gp, t, Color(C.bladeHot, 0.22 * hot), 10.0 * hot + 2.0, true)
	var bc: Color = C.bladeHot if hot > 0.98 else C.blade
	quad([gp + n * 2.8, t + n * 0.8, t + u * 3.0, gp - n * 2.8], bc)


func drawPlayer() -> void:
	var C: Dictionary = T.C
	var P: Dictionary = G.P
	var R: Dictionary = G.PR
	var S: Dictionary = P.S
	var c: Color = C.hurt if P.flash > 0.0 else C.player
	var back: Color = c.lerp(C.bg, 0.5)
	path([S.hip, S.k2, S.f2], back, R.line)
	path([S.sh, S.eB, S.hB], back, R.line)
	path([S.hip, S.sh, S.nk], c, R.line)
	head(S.hd, R.headR, c, R.line)
	path([S.hip, S.k1, S.f1], c, R.line)
	drawSword(S)
	path([S.sh, S.eA, S.hA], c, R.line)
	if P.state == "heal" and P.t > 0.12 and P.t < 0.9:   # the flask in the free hand
		draw_circle(S.hB + Vector2(0, -2), 3.6, C.flask)


func drawBoss() -> void:
	var C: Dictionary = T.C
	var B: Dictionary = G.B
	var BK = G.BK
	var S: Dictionary = B.S
	var c: Color = C.bossFlash if B.flash > 0.0 else (BK.col2 if B.phase2 else BK.col)
	BK.draw(self, S, c)
	# critical hit available: a pulsing mark on the boss's chest
	var P: Dictionary = G.P
	if G.mode == "play" and G.canCrit() and (P.state == "loco" or (P.def != null and P.t >= P.def.get("act", 0.0))):
		var cp: Vector2 = S.hip.lerp(S.sh, 0.6)
		var k := 0.5 + 0.5 * sin(G.clock * 10.0)
		var mc := Color(C.crit, 0.6 + 0.4 * k)
		var pts := PackedVector2Array([cp + Vector2(0, -12 - 4 * k), cp + Vector2(9 + 3 * k, 0), cp + Vector2(0, 12 + 4 * k),
			cp + Vector2(-9 - 3 * k, 0), cp + Vector2(0, -12 - 4 * k)])
		draw_polyline(pts, mc, 3.0, true)


func drawTrail(tr: Array, k: float, col: Color, maxA: float) -> void:
	for i in range(1, tr.size()):
		var a: Dictionary = tr[i - 1]
		var b: Dictionary = tr[i]
		if a.id != b.id:
			continue
		var al: float = (1.0 - b.age / 0.14) * maxA
		if al <= 0.0:
			continue
		quad([Vector2(lerpf(a.hx, a.tx, k), lerpf(a.hy, a.ty, k)), Vector2(a.tx, a.ty), Vector2(b.tx, b.ty),
			Vector2(lerpf(b.hx, b.tx, k), lerpf(b.hy, b.ty, k))], Color(col, al))


func drawParts() -> void:
	var C: Dictionary = T.C
	for p in G.parts:
		var a: float = clampf(p.life / p.max, 0.0, 1.0)
		if p.k == "s":
			line(Vector2(p.x, p.y), Vector2(p.x - p.vx * 0.025, p.y - p.vy * 0.025), Color(p.col, a), 2.0)
		elif p.k == "d":
			draw_circle(Vector2(p.x, p.y), p.r * (1.4 - a * 0.4), Color(C.ground, 0.22 * a))
		else:
			draw_circle(Vector2(p.x, p.y), 2.0, Color(C.heal, a))


func drawGroundMarks() -> void:
	var C: Dictionary = T.C
	var B: Dictionary = G.B
	var P: Dictionary = G.P
	path([Vector2(T.arenaL, 0), Vector2(T.arenaR, 0)], C.ground, 2.5)
	path([Vector2(T.arenaL, 0), Vector2(T.arenaL, -12)], C.ground, 2.0)
	path([Vector2(T.arenaR, 0), Vector2(T.arenaR, -12)], C.ground, 2.0)
	# contact marks under the fighters (shrink with height, so a leap shows where it lands)
	for m in [[B.x, B.y, 50.0], [P.x, P.y, 16.0]]:
		var k := 1.0 - clampf(-m[1] / 260.0, 0.0, 0.7)
		draw_line(Vector2(m[0] - m[2] * k, 2), Vector2(m[0] + m[2] * k, 2), Color(C.ground, 0.28 * k), 6.0, true)
	for w in G.waves:
		var u: float = clampf(w.t / 0.45, 0.0, 1.0)
		if w.ring != null:
			draw_arc(w.ring, lerpf(24.0, w.r, Core.easef("out", u)), 0.0, TAU, 64, Color(C.ui, (1.0 - u) * 0.55), 4.0 * (1.0 - u) + 1.0, true)
		else:
			var kk: float = Core.easef("out", minf(1.0, w.t / 0.2))
			var reach: float = lerpf(w.r0, w.r, kk) if w.r0 > 0.0 else w.r * kk
			var hgt := 26.0 if w.r0 > 0.0 else 18.0
			var wc := Color(C.ground, (1.0 - u) * 0.85)
			for s in [-1.0, 1.0]:
				var x: float = w.x + s * reach
				curve(Vector2(x - s * 28.0, 0), Vector2(x - s * 8.0, -hgt * (1.0 - u) - 4.0), Vector2(x, 0), wc, 3.0, false)


# ---------------------------------------------------------------- drawing: HUD + controls
func bar(x: float, y: float, w: float, h: float, f: float, ghost, col: Color) -> void:
	draw_rect(Rect2(x - 1, y - 1, w + 2, h + 2), Color(0, 0, 0, 0.55))
	draw_rect(Rect2(x - 1.5, y - 1.5, w + 3, h + 3), Color(0.913, 0.902, 0.875, 0.28), false, 1.0)
	if ghost != null and ghost > f:
		draw_rect(Rect2(x, y, w * clampf(ghost, 0.0, 1.0), h), T.C.ghost)
	draw_rect(Rect2(x, y, w * clampf(f, 0.0, 1.0), h), col)


func drawHUD() -> void:
	var C: Dictionary = T.C
	var P: Dictionary = G.P
	var B: Dictionary = G.B
	var L := maxf(16.0, safe.l + 12.0)
	var Tp := maxf(14.0, safe.t + 10.0)
	var bw := minf(W * 0.3, 240.0)
	bar(L, Tp, bw, 9, P.hp / P.maxHp, P.hpGhost / P.maxHp, C.hp)
	bar(L, Tp + 16, bw * 0.82, 6, P.st / T.p.st, null, C.st)
	for i in int(maxf(T.p.flasks, P.flasks)):
		var x := L + i * 15.0
		var y := Tp + 30.0
		var pts := [Vector2(x + 4, y), Vector2(x + 8, y + 6), Vector2(x + 4, y + 12), Vector2(x, y + 6)]
		if i < P.flasks:
			quad(pts, C.flask)
		else:
			draw_polyline(PackedVector2Array(pts + [pts[0]]), Color(C.flask, 0.45), 1.0, true)
	var bbw := minf(W * 0.46, 560.0)
	var bx := (W - bbw) / 2.0
	var by := H - maxf(18.0, safe.b + 14.0) - 8.0
	text(G.BK.name, bx, by - 6, int(round(clampf(W * 0.02, 14.0, 19.0))), C.ui, 0, "bottom", T.font_d)
	bar(bx, by, bbw, 8, B.hp / B.maxHp, B.hpGhost / B.maxHp, C.bossHp)
	if not touchUI:
		var r := W - maxf(16.0, safe.r + 12.0)
		var lines := ["A / D   run", "J   attack  (hold: heavy, keep holding: charge)", "K   heavy", "Space   roll  (no direction: backstep)",
			"Shift   block  (press as the hit lands: parry)", "E   heal", "Esc   pause"]
		for i in lines.size():
			text(lines[i], r, Tp + 56 + i * 17, 12, Color(C.ui, 0.5), 2, "top")
	if touchUI and portrait:
		text("Turn your phone sideways to play", W / 2, Tp + 60, 14, Color(C.ui, 0.8), 1, "top", T.font_bold)


func drawControls() -> void:
	if not touchUI:
		return
	var C: Dictionary = T.C
	var ink: Color = C.ui
	for b in btns:
		var c := Vector2(b.x, b.y)
		draw_circle(c, b.r, Color(ink, 0.28 if b.down else 0.08))
		draw_arc(c, b.r, 0.0, TAU, 48, Color(ink, 0.45), 1.5, true)
		if b.act == "light" and G.input.atk.down:   # hold progress towards a heavy
			var k: float = 1.0 if G.input.atk.heavy else clampf((G.now() - G.input.atk.at) / T.p.holdTime, 0.0, 1.0)
			if k > 0.0:
				draw_arc(c, b.r - 3.0, -PI / 2.0, -PI / 2.0 + k * TAU, 48, C.bladeHot if G.input.atk.heavy else Color(ink, 0.7), 4.0, true)
		var label: String = ("HEAL %d" % G.P.flasks) if b.act == "heal" else b.label
		var fs := int(round(clampf(b.r * 0.3, 10.0, 14.0)))
		text(label, b.x, b.y - 6.0 if b.sub != "" else b.y, fs, Color(ink, 0.88), 1, "middle", T.font_bold)
		if b.sub != "":
			text(b.sub, b.x, b.y + 10.0, int(round(clampf(b.r * 0.2, 9.0, 11.0))), Color(ink, 0.6), 1, "middle")
	var pad = null
	for p in ptrs.values():
		if p.has("pad"):
			pad = p
	var cx: float = pad.ox if pad != null else padHome.x
	var cy: float = pad.oy if pad != null else padHome.y
	var r: float = padHome.r
	draw_circle(Vector2(cx, cy), r, Color(ink, 0.06))
	draw_arc(Vector2(cx, cy), r, 0.0, TAU, 48, Color(ink, 0.35), 1.5, true)
	var kx: float = cx + (clampf(pad.dx, -r, r) if pad != null else 0.0)
	draw_circle(Vector2(kx, cy), r * 0.42, Color(ink, 0.4 if pad != null else 0.18))
	if pad == null:   # small arrows either side
		var ac := Color(ink, 0.6)
		for s in [-1.0, 1.0]:
			var tip := Vector2(cx + s * r * 0.68 + s * 4.0, cy)
			draw_primitive(PackedVector2Array([tip, tip + Vector2(-s * 8.0, -5.0), tip + Vector2(-s * 8.0, 5.0)]),
				PackedColorArray([ac, ac, ac]), PackedVector2Array())


func drawOverlay() -> void:
	var ended = G.ended
	if ended == null:
		return
	var a := clampf(ended.t / 0.8, 0.0, 1.0)
	var lose: bool = ended.kind == "lose"
	draw_rect(Rect2(0, 0, W, H), Color(8 / 255.0, 8 / 255.0, 10 / 255.0, 0.55 * a))
	var size := int(round(clampf(W * 0.075, 34.0, 84.0)))
	var tc := Color("#c0392e") if lose else Color("#d9b36a")
	text("YOU FELL" if lose else "VICTORY", W / 2.0, H * 0.4, size, Color(tc, a), 1, "middle", T.font_d)
	if ended.t > 0.6:
		var msg := "Tap to fight again" if touchUI else "Press R or click to fight again"
		text(msg, W / 2.0, H * 0.4 + size * 0.85, int(round(clampf(size * 0.24, 13.0, 18.0))), Color(T.C.ui, a), 1, "middle")


func _draw() -> void:
	var C: Dictionary = T.C
	draw_rect(Rect2(0, 0, W, H), C.bg)
	if G.P.is_empty():
		return
	var sx := 0.0
	var sy := 0.0
	if G.shakeMag > 0.0:
		sx = randf_range(-1.0, 1.0) * G.shakeMag * 0.6
		sy = randf_range(-1.0, 1.0) * G.shakeMag * 0.6
	var ox: float = W / 2.0 - G.camX * wscale + sx
	var oy: float = groundY + sy
	draw_set_transform(Vector2(ox, oy), 0.0, Vector2(wscale, wscale))
	drawBoss()
	drawPlayer()
	drawTrail(G.trails.b, 0.55, G.BK.trailCol, 0.32)
	drawTrail(G.trails.p, 0.38, Color8(206, 224, 255), 0.5)
	drawParts()
	# nothing shows below the ground line (the browser version clipped there)
	draw_rect(Rect2(-5000, 0, 12000, 5000), C.bg)
	drawGroundMarks()
	draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)
	if G.mode != "menu":
		drawHUD()
		if G.mode == "play":
			drawControls()
		drawOverlay()
