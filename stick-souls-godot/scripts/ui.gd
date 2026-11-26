extends CanvasLayer
## Stick Souls — menus, the settings panel and saved tuning. Ported from stick-souls/js/ui.js.
## Settings are saved to user://tuning.cfg on this device (the browser version also saved them
## with the claude.ai page; that store doesn't exist here).

const STORE := "user://tuning.cfg"

var INK := Color("#e9e6df")
var DIM := Color(0.913, 0.902, 0.875, 0.6)
var LINE := Color(0.913, 0.902, 0.875, 0.16)
var PANEL := Color("#15161b")
var ACCENT := Color("#b8382e")
var GOLD := Color("#d9a441")

var root: Control
var main_menu: Control
var choose: Control
var pause: Control
var settings: Control
var settings_panel: PanelContainer
var pause_btn: Button
var status_lbl: Label
var b_start: Button
var b_resume: Button
var b_back: Button
var b_reset: Button
var foe_btns := []
var rows := []
var grids := []
var settings_from := "main"
var save_pending := false


func _ready() -> void:
	layer = 10
	root = Control.new()
	root.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.theme = make_theme()
	add_child(root)
	build()


# ---------------------------------------------------------------- saved tuning
func save_local() -> void:
	var cf := ConfigFile.new()
	for s in T.SETTINGS:
		var key: String = s[1].replace(".", "_")
		cf.set_value("values", key, T.get_val(s[1]))
		cf.set_value("vers", key, T.ver_of(s[1]))
	cf.save(STORE)


func load_local() -> void:
	var cf := ConfigFile.new()
	if cf.load(STORE) != OK:
		return
	for s in T.SETTINGS:
		var key: String = s[1].replace(".", "_")
		var v = cf.get_value("values", key, null)
		if not (v is float or v is int):
			continue
		if cf.get_value("vers", key, -1) != T.ver_of(s[1]):
			continue
		T.set_val(s[1], clampf(v, s[3], s[4]))


func schedule_save() -> void:
	if save_pending:
		return
	save_pending = true
	get_tree().create_timer(0.5).timeout.connect(func():
		save_pending = false
		save_local())


func apply_live() -> void:
	if not G.P.is_empty():
		G.P.st = minf(G.P.st, T.p.st)
	Snd.set_volume(T.f.volume)


# ---------------------------------------------------------------- look
func box(bg: Color, border: Color, radius := 6, bw := 1) -> StyleBoxFlat:
	var s := StyleBoxFlat.new()
	s.bg_color = bg
	s.border_color = border
	s.set_border_width_all(bw)
	s.set_corner_radius_all(radius)
	s.content_margin_left = 18
	s.content_margin_right = 18
	s.content_margin_top = 10
	s.content_margin_bottom = 10
	return s


func make_theme() -> Theme:
	var th := Theme.new()
	th.default_font = T.font_ui
	th.default_font_size = 15
	th.set_color("font_color", "Label", INK)
	th.set_stylebox("normal", "Button", box(Color(INK, 0.06), Color(INK, 0.32)))
	th.set_stylebox("hover", "Button", box(Color(INK, 0.14), Color(INK, 0.32)))
	th.set_stylebox("pressed", "Button", box(Color(INK, 0.22), Color(INK, 0.45)))
	th.set_stylebox("disabled", "Button", box(Color(INK, 0.03), Color(INK, 0.15)))
	var focus := box(Color(0, 0, 0, 0), GOLD, 6, 2)
	focus.draw_center = false
	th.set_stylebox("focus", "Button", focus)
	for c in ["font_color", "font_hover_color", "font_pressed_color", "font_focus_color", "font_hover_pressed_color"]:
		th.set_color(c, "Button", INK)
	th.set_font("font", "Button", T.font_bold)
	th.set_font_size("font_size", "Button", 14)
	var panel := box(PANEL, LINE, 10, 1)
	panel.content_margin_left = 30
	panel.content_margin_right = 30
	panel.content_margin_top = 26
	panel.content_margin_bottom = 26
	panel.shadow_color = Color(0, 0, 0, 0.55)
	panel.shadow_size = 24
	th.set_stylebox("panel", "PanelContainer", panel)
	var track := StyleBoxFlat.new()
	track.bg_color = Color(INK, 0.18)
	track.set_corner_radius_all(3)
	track.content_margin_top = 3
	track.content_margin_bottom = 3
	th.set_stylebox("slider", "HSlider", track)
	var area: StyleBoxFlat = track.duplicate()
	area.bg_color = ACCENT
	th.set_stylebox("grabber_area", "HSlider", area)
	th.set_stylebox("grabber_area_highlight", "HSlider", area)
	var sbar := StyleBoxFlat.new()
	sbar.bg_color = Color(INK, 0.25)
	sbar.set_corner_radius_all(3)
	th.set_stylebox("grabber", "VScrollBar", sbar)
	return th


func label(txt: String, size := 15, col: Color = Color(0, 0, 0, 0), font: Font = null) -> Label:
	var l := Label.new()
	l.text = txt
	l.add_theme_font_size_override("font_size", size)
	if col.a > 0.0:
		l.add_theme_color_override("font_color", col)
	if font != null:
		l.add_theme_font_override("font", font)
	return l


func button(txt: String, primary := false) -> Button:
	var b := Button.new()
	b.text = txt.to_upper()
	b.custom_minimum_size = Vector2(0, 46)
	if primary:
		b.add_theme_stylebox_override("normal", box(ACCENT, Color("#d2493d")))
		b.add_theme_stylebox_override("hover", box(Color("#cc4236"), Color("#d2493d")))
		b.add_theme_stylebox_override("pressed", box(Color("#a8332a"), Color("#d2493d")))
	return b


func click(b: Button, fn: Callable) -> void:
	b.pressed.connect(func():
		Snd.sUI()
		fn.call())


## a dimmed full-screen layer with a centred panel; returns the panel's column
func scrim(width := 340.0) -> Array:
	var s := ColorRect.new()
	s.color = Color(8 / 255.0, 9 / 255.0, 11 / 255.0, 0.74)
	s.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	s.mouse_filter = Control.MOUSE_FILTER_STOP
	root.add_child(s)
	var cc := CenterContainer.new()
	cc.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	s.add_child(cc)
	var pc := PanelContainer.new()
	pc.custom_minimum_size = Vector2(width, 0)
	cc.add_child(pc)
	var vb := VBoxContainer.new()
	vb.add_theme_constant_override("separation", 12)
	pc.add_child(vb)
	return [s, vb]


# ---------------------------------------------------------------- menus
func build() -> void:
	# main menu
	var m := scrim()
	main_menu = m[0]
	var title := label("Stick Souls", 56, INK, T.font_d)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	var tag := label("TWO BOSSES. ONE GREATSWORD.", 12, DIM)
	tag.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	b_start = button("Start", true)
	var b_set := button("Settings")
	for c in [title, tag, b_start, b_set]:
		m[1].add_child(c)

	# Start → choose a boss
	var ch := scrim()
	choose = ch[0]
	choose.visible = false
	var h2 := label("Choose your foe", 28, INK, T.font_d)
	h2.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	ch[1].add_child(h2)
	for id in G.BOSSES:
		var k = G.BOSSES[id]
		var b := Button.new()
		b.custom_minimum_size = Vector2(0, 84)
		var mc := MarginContainer.new()
		mc.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
		mc.mouse_filter = Control.MOUSE_FILTER_IGNORE
		for side in ["left", "right"]:
			mc.add_theme_constant_override("margin_" + side, 16)
		for side in ["top", "bottom"]:
			mc.add_theme_constant_override("margin_" + side, 10)
		var vb := VBoxContainer.new()
		vb.mouse_filter = Control.MOUSE_FILTER_IGNORE
		vb.add_theme_constant_override("separation", 2)
		var nm := label(k.name, 22, INK, T.font_d)
		var bl := label(k.blurb, 13, DIM)
		bl.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		nm.mouse_filter = Control.MOUSE_FILTER_IGNORE
		bl.mouse_filter = Control.MOUSE_FILTER_IGNORE
		vb.add_child(nm)
		vb.add_child(bl)
		mc.add_child(vb)
		b.add_child(mc)
		ch[1].add_child(b)
		foe_btns.append([b, id])
	var b_back2 := button("Back")
	ch[1].add_child(b_back2)

	# pause
	var pz := scrim()
	pause = pz[0]
	pause.visible = false
	var ph := label("Paused", 28, INK, T.font_d)
	ph.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	b_resume = button("Resume", true)
	var b_set2 := button("Settings")
	var b_restart := button("Restart fight")
	var b_menu := button("Main menu")
	for c in [ph, b_resume, b_set2, b_restart, b_menu]:
		pz[1].add_child(c)

	# settings
	settings = ColorRect.new()
	settings.color = Color(8 / 255.0, 9 / 255.0, 11 / 255.0, 0.74)
	settings.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	settings.mouse_filter = Control.MOUSE_FILTER_STOP
	settings.visible = false
	root.add_child(settings)
	settings_panel = PanelContainer.new()
	var sp_box := box(PANEL, LINE, 10, 1)
	sp_box.set_content_margin_all(0)
	settings_panel.add_theme_stylebox_override("panel", sp_box)
	settings.add_child(settings_panel)
	var col := VBoxContainer.new()
	col.add_theme_constant_override("separation", 0)
	settings_panel.add_child(col)
	var head := HBoxContainer.new()
	var head_m := pad_box(head, 16, 12)
	var sh := label("Settings", 26, INK, T.font_d)
	sh.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	b_back = button("Back")
	b_back.custom_minimum_size = Vector2(0, 40)
	head.add_child(sh)
	head.add_child(b_back)
	col.add_child(head_m)
	col.add_child(hline())
	status_lbl = label("Changes save automatically on this device.", 12, DIM)
	col.add_child(pad_box(status_lbl, 16, 8))
	var scroll := ScrollContainer.new()
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	col.add_child(scroll)
	var body := VBoxContainer.new()
	body.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.add_child(pad_box(body, 16, 4))
	var grid: GridContainer = null
	var last_group := ""
	for s in T.SETTINGS:
		if s[0] != last_group:
			last_group = s[0]
			var gl := label(String(s[0]).to_upper(), 11, GOLD, T.font_bold)
			body.add_child(spacer(14))
			body.add_child(gl)
			body.add_child(hline())
			grid = GridContainer.new()
			grid.columns = 2
			grid.add_theme_constant_override("h_separation", 28)
			grid.add_theme_constant_override("v_separation", 4)
			grids.append(grid)
			body.add_child(grid)
		grid.add_child(setting_row(s))
	col.add_child(hline())
	var foot := HBoxContainer.new()
	foot.alignment = BoxContainer.ALIGNMENT_END
	foot.add_theme_constant_override("separation", 10)
	b_reset = button("Reset to defaults")
	var b_done := button("Done", true)
	foot.add_child(b_reset)
	foot.add_child(b_done)
	col.add_child(pad_box(foot, 16, 12))

	# pause button (top right, in play)
	pause_btn = Button.new()
	pause_btn.text = "II"
	pause_btn.focus_mode = Control.FOCUS_NONE
	pause_btn.tooltip_text = "Pause"
	var round_box := box(Color(13 / 255.0, 14 / 255.0, 17 / 255.0, 0.55), Color(INK, 0.32), 22, 1)
	round_box.set_content_margin_all(0)
	for st in ["normal", "hover", "pressed"]:
		pause_btn.add_theme_stylebox_override(st, round_box)
	pause_btn.add_theme_font_size_override("font_size", 13)
	pause_btn.set_anchors_preset(Control.PRESET_TOP_RIGHT)
	pause_btn.visible = false
	root.add_child(pause_btn)

	# behaviour
	click(b_start, func():
		main_menu.visible = false
		choose.visible = true
		foe_btns[0][0].grab_focus())
	for fb in foe_btns:
		var fid: String = fb[1]
		click(fb[0], func():
			G.BK = G.BOSSES[fid]
			choose.visible = false
			start_game())
	click(b_back2, func():
		choose.visible = false
		main_menu.visible = true
		b_start.grab_focus())
	click(b_set, func(): open_settings("main"))
	click(b_resume, func(): resume_game())
	click(b_set2, func(): open_settings("pause"))
	click(b_restart, func():
		G.reset()
		resume_game())
	click(b_menu, func(): to_menu())
	click(b_back, func(): close_settings())
	click(b_done, func(): close_settings())
	click(b_reset, func():
		for s in T.SETTINGS:
			T.set_val(s[1], T.default_val(s[1]))
		refresh_sliders()
		apply_live()
		schedule_save())
	click(pause_btn, func(): pause_game())
	b_start.call_deferred("grab_focus")


func pad_box(c: Control, h: int, v: int) -> MarginContainer:
	var mc := MarginContainer.new()
	mc.add_theme_constant_override("margin_left", h)
	mc.add_theme_constant_override("margin_right", h)
	mc.add_theme_constant_override("margin_top", v)
	mc.add_theme_constant_override("margin_bottom", v)
	mc.add_child(c)
	return mc


func hline() -> ColorRect:
	var r := ColorRect.new()
	r.color = LINE
	r.custom_minimum_size = Vector2(0, 1)
	return r


func spacer(h: int) -> Control:
	var c := Control.new()
	c.custom_minimum_size = Vector2(0, h)
	return c


func fmt_val(v: float, fmt, stp: float) -> String:
	if fmt == "pct":
		return "%d%%" % int(round(v * 100.0))
	if fmt == "x":
		return "%.2f×" % v
	var dec := 2 if stp < 0.1 else (1 if stp < 1.0 else 0)
	return String.num(v, dec) if dec > 0 else str(int(round(v)))


func setting_row(s: Array) -> Control:
	var id: String = s[1]
	var row := VBoxContainer.new()
	row.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_theme_constant_override("separation", 2)
	var top := HBoxContainer.new()
	var lab := label(s[2], 14)
	lab.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	lab.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	var out := label("", 13, DIM)
	top.add_child(lab)
	top.add_child(out)
	var sl := HSlider.new()
	sl.min_value = s[3]
	sl.max_value = s[4]
	sl.step = s[5]
	sl.custom_minimum_size = Vector2(0, 28)
	sl.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	sl.value_changed.connect(func(v: float):
		T.set_val(id, v)
		out.text = fmt_val(T.get_val(id), T.fmt_of(s), s[5])
		apply_live()
		schedule_save())
	row.add_child(top)
	row.add_child(sl)
	if T.restart_of(s):
		row.add_child(label("Applies when the fight restarts", 11, DIM))
	rows.append({"s": s, "slider": sl, "out": out})
	return row


func refresh_sliders() -> void:
	for r in rows:
		var v: float = T.get_val(r.s[1])
		r.slider.set_value_no_signal(v)
		r.out.text = fmt_val(v, T.fmt_of(r.s), r.s[5])


func on_resize(safe: Dictionary) -> void:
	if settings_panel == null:
		return
	var vs := get_viewport().get_visible_rect().size
	var w := minf(760.0, vs.x - 32.0)
	settings_panel.position = Vector2((vs.x - w) / 2.0, 16.0)
	settings_panel.size = Vector2(w, vs.y - 32.0)
	for g in grids:
		g.columns = 2 if w >= 560.0 else 1
	var top := maxf(12.0, safe.t)
	var right := maxf(12.0, safe.r)
	pause_btn.offset_left = -right - 44.0
	pause_btn.offset_right = -right
	pause_btn.offset_top = top
	pause_btn.offset_bottom = top + 44.0


func open_settings(from: String) -> void:
	settings_from = from
	main_menu.visible = false
	pause.visible = false
	settings.visible = true
	refresh_sliders()
	b_back.grab_focus()


func close_settings() -> void:
	settings.visible = false
	if settings_from == "main":
		main_menu.visible = true
		b_start.grab_focus()
	else:
		pause.visible = true
		b_resume.grab_focus()


# ---------------------------------------------------------------- game flow
func start_game() -> void:
	G.reset()
	G.mode = "play"
	main_menu.visible = false
	choose.visible = false
	pause_btn.visible = true
	get_viewport().gui_release_focus()


func pause_game() -> void:
	if G.mode != "play":
		return
	G.mode = "pause"
	G.releaseAll()
	pause.visible = true
	pause_btn.visible = false
	b_resume.grab_focus()


func resume_game() -> void:
	G.mode = "play"
	G.releaseAll()
	pause.visible = false
	settings.visible = false
	pause_btn.visible = true
	get_viewport().gui_release_focus()


func to_menu() -> void:
	G.mode = "menu"
	G.releaseAll()
	G.reset()
	pause.visible = false
	settings.visible = false
	choose.visible = false
	main_menu.visible = true
	pause_btn.visible = false
	b_start.grab_focus()
