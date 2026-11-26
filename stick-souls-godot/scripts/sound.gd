extends Node
## Stick Souls — sound effects. Autoload: Snd.
## The browser version synthesized these live; here they are WAV files rendered from the same
## recipes by tools/make_sounds.js, at half level (so loud mixes don't clip) and played back at
## double gain through a compressor and limiter on the master bus. Stereo panning is not ported.

const NAMES := ["whoosh_light", "whoosh_heavy", "impact_light", "impact_heavy", "impact_charged", "hurt", "clang",
	"parry", "crit", "roll", "step", "heal", "charge", "roar", "quake", "death", "victory", "ui"]

var streams := {}
var players := []
var next_player := 0


func _ready() -> void:
	for n in NAMES:
		var path := "res://sounds/%s.wav" % n
		if ResourceLoader.exists(path):
			streams[n] = load(path)
	for i in 16:
		var pl := AudioStreamPlayer.new()
		add_child(pl)
		players.append(pl)
	# the browser mixed through a compressor (threshold -24 dB, ratio 12) whose automatic make-up
	# gain lifted quiet sounds by about 10 dB; this does the same, then a limiter stops clipping
	var comp := AudioEffectCompressor.new()
	comp.threshold = -24.0
	comp.ratio = 12.0
	comp.attack_us = 2000.0
	comp.release_ms = 250.0
	comp.gain = 10.0
	AudioServer.add_bus_effect(0, comp)
	if ClassDB.class_exists("AudioEffectHardLimiter"):
		AudioServer.add_bus_effect(0, ClassDB.instantiate("AudioEffectHardLimiter"))
	set_volume(T.f.volume)


func play(n: String, gain := 1.0) -> void:
	if T.f.volume <= 0.0 or not streams.has(n) or gain <= 0.0:
		return
	var pl: AudioStreamPlayer = players[next_player]
	next_player = (next_player + 1) % players.size()
	pl.stream = streams[n]
	pl.volume_db = linear_to_db(2.0 * gain)
	pl.play()


func set_volume(v: float) -> void:
	AudioServer.set_bus_volume_db(0, linear_to_db(maxf(v, 0.0001)))
	AudioServer.set_bus_mute(0, v <= 0.0)


func sWhoosh(_x: float, heavy: bool) -> void:
	play("whoosh_heavy" if heavy else "whoosh_light")


## w: 0.25 light, 0.6 heavy, 1 charged (and poise breaks)
func sImpact(_x: float, w: float) -> void:
	if w > 0.8:
		play("impact_charged")
	elif w > 0.4:
		play("impact_heavy")
	else:
		play("impact_light")


func sHurt(_x: float) -> void:
	play("hurt")


func sClang(_x: float) -> void:
	play("clang")


func sParry(_x: float) -> void:
	play("parry")


func sCrit(_x: float) -> void:
	play("crit")


func sRoll(_x: float) -> void:
	play("roll")


## footsteps and thuds; w scales the level exactly as in the original recipe
func sStep(_x: float, w: float) -> void:
	play("step", w)


func sHeal() -> void:
	play("heal")


func sCharge(_x: float) -> void:
	play("charge")


func sRoar(_x: float) -> void:
	play("roar")


func sQuake(_x: float) -> void:
	play("quake")


func sDeath() -> void:
	play("death")


func sVictory() -> void:
	play("victory")


func sUI() -> void:
	play("ui")
