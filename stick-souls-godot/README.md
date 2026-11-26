# Stick Souls (Godot 4.5)

The Godot version of Stick Souls: a 2D souls-like boss fight with stick figures. This is **stage 1, a straight port**
of the browser version in `../stick-souls/`, which stays frozen as the reference. The rules, timings, AI and
animation are the same; only the engine changed. Stage 2 (Godot bone rigs and timeline animation) comes later.

## Open and play

1. Install **Godot 4.5 or newer** (the standard build, not .NET).
2. In Godot's Project Manager, choose **Import** and pick `stick-souls-godot/project.godot`.
3. Press **F5** (Run Project). The first open takes a moment while Godot imports the font and sounds.

Controls: A/D run, J attack (hold for heavy, keep holding to charge), K heavy, Space roll (no direction: backstep),
Shift block (press as the hit lands: parry), E heal, Esc pause. On a phone: stick on the left, buttons on the right.

## Where things are

| File | What it holds | Browser file |
|---|---|---|
| `scripts/tuning.gd` (autoload `T`) | every gameplay number, the settings list, colours, fonts | `js/tuning.js` |
| `scripts/core.gd` (autoload `Core`) | keyframes, IK skeleton, foot planting and the secondary-motion layer | `js/core.js` |
| `scripts/player_moves.gd` | the player's rig, poses and moves (greatsword timings) | `js/player.js` |
| `scripts/game.gd` (autoload `G`) | fight state, player logic, shared boss logic, shockwaves, input state, frame loop | `js/fight.js`, `player.js`, `boss-common.js`, `input.js`, `main.js` |
| `scripts/boss_warden.gd` | Gaunt Warden: rig, moves, AI, drawing | `js/boss-warden.js` |
| `scripts/boss_duelist.gd` | Twinfang Duelist: rig, moves, AI, drawing | `js/boss-duelist.js` |
| `scripts/main.gd` | layout, keyboard and touch input, camera, all drawing | `js/render.js`, `input.js` |
| `scripts/ui.gd` | menus, settings panel, saved settings | `js/ui.js` |
| `scripts/sound.gd` (autoload `Snd`) | plays the sound effects | `js/sound.js` |
| `tools/make_sounds.js` | renders the sound recipes to `sounds/*.wav` (`node tools/make_sounds.js`) | `js/sound.js` |
| `tests/checks.gd` | automated checks | the browser test suites |

Function and variable names match the browser code, so the two can be compared line by line.

## Adjusting the game

- **While playing:** the in-game **Settings** sliders (same as the browser version). They save to this device.
- **In the editor:** numbers live in `scripts/tuning.gd`; moves and timings in `player_moves.gd` and the boss files.
- **While the game runs from the editor:** the Remote tree in the Scene dock shows the `T` autoload; its values can be
  changed live in the Inspector.

## Automated checks

```
godot --headless --path . --import          # once, on a fresh copy (or open the project in the editor once)
godot --headless --path . res://tests/checks.tscn
```

Prints a PASS/FAIL line per check; the exit code is the number of failures. They never touch your saved settings.

## Differences from the browser version

- Sounds are pre-rendered WAV files from the same recipes, not live synthesis. Each plays the same every time, and
  stereo panning is not ported.
- Settings save only on the device (`user://tuning.cfg`). The browser version could also save them with the claude.ai page.
- On phones the game locks to landscape instead of asking you to turn the phone.
- Glows (eyes, charged blade) are drawn with soft circles instead of canvas shadow blur.
