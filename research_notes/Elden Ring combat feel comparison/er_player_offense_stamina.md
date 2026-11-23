# Elden Ring player offense and stamina: two-handed greatswords (Claymore class) vs colossal swords

Read this first (applies to every section):
- **Frame rate.** Elden Ring's player animations (TAE/HKX) are authored at **30 fps**: `frameDuration` is 1/30 s in 2805 of 2999 player clips sampled (191 are 1/60 s). Community frame data is therefore quoted in **30 fps frames (1 f = 33.3 ms)**. The game itself renders at up to 60 fps; the 30 fps unit is a convention, not the game loop rate. All seconds below = frames / 30. — [Banon-Labs er-mechanics attacks.md §4](https://github.com/Banon-Labs/er-mods-rs/blob/main/docs/er-mechanics/attacks.md)
- **Primary data sources actually read.** (1) The data behind Emilia's "Elden Ring Frame Data Explorer" (er-frame-data.nyasu.business). It is decoded TAE events per animation: hit windows, hyperarmor windows, cancel windows, SpEffects, play-speed gradients. Its newest folder is **regulation 1.08 (Jan 2023, pre-Shadow of the Erdtree)**, so treat its values as HISTORICAL. Its frames are already converted to real time with play speed applied: its colossal 2H R1 #1 hit f16-20 matches the 1.17.1 real-time figure f16.7-20.7. — [sovietspaceship/elden-ring-frame-data-explorer-data, folder 108](https://github.com/sovietspaceship/elden-ring-frame-data-explorer-data/tree/main/108). (2) A 2026 GitHub reverse-engineering write-up that reads the **1.17.1** `regulation.bin`, the TAE and the executable. It labels claims VERIFIED / INFERRED / COMMUNITY. It is a single, unaffiliated, very detailed source, so treat it as third-party data-mined. — [Banon-Labs/er-mods-rs docs/er-mechanics](https://github.com/Banon-Labs/er-mods-rs/tree/main/docs/er-mechanics). (3) SpEffect row names. — [soulsmods Paramdex ER SpEffectParam names](https://github.com/soulsmods/Paramdex/blob/master/ER/Names/SpEffectParam.txt)
- **Cross-check.** For the colossal "Greatsword" 2H R1 #1, 1.08 explorer frames (hit 16-20, R1 chain 32, roll 37, guard 44, walk 53) match the 1.17.1 real-time frames (16.7-20.7, 32.7, 37.7, 44.7, 53.7). So the core R1 timings appear unchanged from 1.08 to 1.17.1. The Claymore-class R1 timings were not re-verified on 1.17.1.
- **Blocked sites.** Fextralife, Fandom, wiki.gg, Reddit and Google Sheets could not be fetched from this environment. Claims attributed to them come from search-result summaries only and are marked [WIKI-snippet].
- **Confidence tags:** [DM] data-mined from game files (TAE or regulation) by a named tool or source. [DM-EXE] read from the executable by Banon-Labs. [MEAS] community stopwatch or in-game measurement. [WIKI-snippet] wiki claim seen only through a search summary. [EST] my own arithmetic or inference from the above.
- **Naming trap.** "Greatsword" is both a weapon class (Claymore, Bastard Sword, Flamberge, Lordsworn's...; TAE category **a025**) and a single colossal sword named "Greatsword" (Guts-style; colossal category **a026**). Below, "GS-class" means a025 (Claymore family) and "colossal" means a026.

## Light attacks (R1), two-handed greatsword: chain length, startup, active, recovery, chain input, roll-cancel

### Takeaway
The GS-class two-handed R1 is a **4-hit chain**. Each swing hits at about **0.53-0.60 s** (f16-18), is active for **4 frames (0.13 s)**, and can chain into the next R1 about **0.33 s after the hit starts** (f26 / 0.87 s for R1 #1). Rolling out is possible **0.47 s after the hit starts** (f30 / 1.0 s), but full idle is only reached at about **2.9 s**. Colossal R1s hit at the same time (f16) but chain later (f32), are only a **3-hit chain**, and take about **0.7 s after the hit** before you can roll.

### Cited Findings
- **GS-class 2H R1 chain (regulation 1.08, real 30 fps frames, from the animation's first frame) [DM, historical]**. Shared by 18 weapons: Bastard Sword, Claymore, Iron Greatsword, Lordsworn's, Forked, Flamberge, Gargoyle's (both), Sword of Milos, Marais Executioner's, Ordovis's, Alabaster Lord's, Death's Poker, Helphen's Steeple, Blasphemous Blade, Golden Order GS, Dark Moon GS, Sacred Relic Sword. — [explorer data 108/data-bundle.json, keys a025_032000-032030](https://github.com/sovietspaceship/elden-ring-frame-data-explorer-data/tree/main/108)

  | GS-class 2H | hit (active) | next R1 (chain) | R2 | roll | guard | walk | anim end | hit-start to roll |
  |---|---|---|---|---|---|---|---|---|
  | R1 #1 | f16-19 (0.53-0.67 s) | f26 (0.87 s) | f35 (1.17) | f30 (1.00) | f38 (1.27) | f44 (1.47) | f87 (2.90) | 14 f (0.47 s) |
  | R1 #2 | f18-21 (0.60-0.73) | f30 (1.00) | f38 (1.27) | f32 (1.07) | f41 (1.37) | f48 (1.60) | f95 (3.17) | 14 f (0.47) |
  | R1 #3 | f16-19 (0.53-0.67) | f24 (0.80) | f31 (1.03) | f29 (0.97) | f38 (1.27) | f44 (1.47) | f90 (3.00) | 13 f (0.43) |
  | R1 #4 (finisher) | f24-27 (0.80-0.93) | f48 (1.60), loops to #1 | f45 (1.50) | f38 (1.27) | f48 (1.60) | f57 (1.90) | f99 (3.30) | 14 f (0.47) |

  - The R1 #1-#3 chain-input windows are short "LightAttackOnly" windows (#1: f26-35; #2: f30-38; #3: f24-31). After them, a generic "RightAttack" window opens (any R1/R2).
  - R1 #4 has no light-chain window; R1 after #4 restarts the chain. — same source
- **Motion values (2H GS-class) [DM]**: R1 #1-#4 = 103 / 104 / 105 / 115. All R1s are damage level 2 ("middle" stagger). — [explorer data a025_0320x0](https://github.com/sovietspaceship/elden-ring-frame-data-explorer-data/tree/main/108)
- **1H GS-class R1 #1 for contrast [DM, historical]**: hit f16-19, R1 chain f28, roll f30, walk f43, end f92. It has **no hyperarmor**. — [explorer data a025_030000](https://github.com/sovietspaceship/elden-ring-frame-data-explorer-data/tree/main/108)
- **Colossal sword 2H R1 chain (regulation 1.08, real frames) [DM, historical]**. It is a **3-hit chain**; R1 #3 has no light-chain window. — [explorer data a026_032000-032020](https://github.com/sovietspaceship/elden-ring-frame-data-explorer-data/tree/main/108)

  | Colossal 2H | hit | next R1 | R2 | roll | guard | walk | end | hit-start to roll |
  |---|---|---|---|---|---|---|---|---|
  | R1 #1 | f16-20 (0.53-0.70 s) | f32 (1.07) | f38 (1.27) | f37 (1.23) | f44 (1.47) | f53 (1.77) | f85 (2.83) | 21 f (0.70) |
  | R1 #2 | f20-24 (0.67-0.83) | f37 (1.23) | f42 (1.40) | f40 (1.33) | f49 (1.63) | f60 (2.00) | f88 (2.93) | 20 f (0.67) |
  | R1 #3 | f21-25 (0.70-0.87) | f59 (1.97) | f59 (1.97) | f44 (1.47) | f61 (2.03) | f67 (2.23) | f93 (3.10) | 23 f (0.77) |

  - The colossal 2H R1 MVs are 114 / 117 / 125, damage level 3 ("large").
- **1.17.1 real-time cross-check, colossal "Greatsword" 2H R1 #1 [DM-EXE]**: hit f16.7-20.7, R1 32.7, R2 38.7, roll 37.7, guard 44.7, walk 53.7, clip length 78.7.
  - The animation plays at **1.34x** over clip frames 0-17. This sped-up startup is part of how heavy swings are tuned: the clip frame-22 hit lands at real frame 17.7.
  - Giant-Crusher (colossal weapon) 2H R1 #1: hit f17.9-20.9, chain 30.3, roll 35.9. Uchigatana 2H R1 #1 for contrast: hit f14-17, chain f17 (0 frames after the hit ends), roll f26. — [Banon-Labs attacks.md §4 table](https://github.com/Banon-Labs/er-mods-rs/blob/main/docs/er-mechanics/attacks.md)
- **"Every regular R1/R2/running/rolling/backstep/jump/counter attack ... is one hit"** (one damaging hitbox event per swing) [DM-EXE]. — [Banon-Labs attacks.md §4](https://github.com/Banon-Labs/er-mods-rs/blob/main/docs/er-mechanics/attacks.md)
- **Windows open about 2 frames early.** Most cancel windows have an "early activation" TAE event (type 2) that opens the same action 2 frames before the listed window. Because `weaponWeightRate` is 0 on every weapon, the early open applies to all weapons, so real availability is about 2 f (0.067 s) earlier than the type-0 windows above [DM-EXE]. — [Banon-Labs attacks.md §4 "Early activation"](https://github.com/Banon-Labs/er-mods-rs/blob/main/docs/er-mechanics/attacks.md)
- **R1 chains are not true combos.** No R1 chain link was found to be a true combo against a staggered player: the defender can roll or guard out before the next hit [DM-EXE]. — [Banon-Labs combo.md §0](https://github.com/Banon-Labs/er-mods-rs/blob/main/docs/er-mechanics/combo.md); [frame-advantage.md §5](https://github.com/Banon-Labs/er-mods-rs/blob/main/docs/er-mechanics/frame-advantage.md)

### Inferences
- [EST] GS-class 2H R1 #1 timing shape: about 0.53 s startup, 0.13 s active, then the swing is committed for 0.2 s after the active frames end before the chain window opens (f20 to f26). Roll is available at 0.47 s after the hit starts. That is about **1.0 s of commitment** before you can defend, out of 2.9 s total animation. The tail after about f44 is cosmetic: walking cancels it.
- [EST] A 4-hit 2H R1 string with chaining as early as possible takes about 26 + 30 + 24 = 80 f to reach R1 #4's start, with R1 #4 hitting at f24 of its own clip. That is about **3.5 s for all 4 hits**, or roughly one hit every 0.85-0.9 s.
- [EST] GS-class and colossal R1s have nearly identical startup (about 0.53 s). The colossal's extra "weight" is in recovery: chain 1.07 s vs 0.87 s, roll 0.70 s vs 0.47 s after the hit. Colossal also has higher poise, damage level and hyperarmor (see below).

### Gaps
- Claymore-class frames on 1.17.1 (current patch) were not independently re-extracted; only the colossal R1 was cross-checked across patches.
- The exact R1 input-window opening frames (as opposed to cancel windows) for GS-class were not in either source, so how far ahead a chained R1 can be pressed is unknown (see the input-buffering section).

## Heavy attacks (R2): uncharged vs charged startup, max charge, multipliers, follow-ups

### Takeaway
A GS-class 2H uncharged R2 hits about **0.80 s** after the press. Releasing is only possible from about f8 (0.27 s). A full charge auto-releases around **f23 (0.77 s)** and hits at **f38 (1.27 s)**. Charging raises MV by only about **1.3x** but poise (stance) damage by about **2.5x**, and stamina by about 1.33x. R2 #1 chains into R2 #2. Claymore has a faster, unique R2: uncharged about 0.70 s, charged hit about 1.20 s.

### Cited Findings
- **How R2 works (two clips) [DM-EXE + COMMUNITY HKS]**:
  - An R2 press plays a "Heavy Start" clip (TAE 0325x0, labeled "Charged R2" in the explorer). If R2 is released while SpEffect 100280 "[HKS] Is Charging Heavy Attack" is active, the game switches to the "Heavy End" clip (0325x5), which is the uncharged swing.
  - If R2 is still held when that window closes, the Start clip plays on into the charged swing.
  - So an uncharged R2's startup = release lead-in (first frame of 100280) + the End clip's hit frame. Charging is binary (uncharged or fully charged); no partial-charge tier was found.
  — [Banon-Labs attacks.md §4 "Uncharged R2 lead-in"](https://github.com/Banon-Labs/er-mods-rs/blob/main/docs/er-mechanics/attacks.md); [frame-advantage.md §5](https://github.com/Banon-Labs/er-mods-rs/blob/main/docs/er-mechanics/frame-advantage.md); [Paramdex SpEffect names (100280)](https://github.com/soulsmods/Paramdex/blob/master/ER/Names/SpEffectParam.txt)
- **GS-class generic 2H R2 (1.08, real frames, from the R2 press) [DM, historical; EST for the summed rows]**:
  - Charge window (100280): f8-23 (0.27-0.77 s). The Start clip runs at 1.25x speed over f11-23.
  - **Uncharged R2 #1**: 8 f lead-in + End-clip hit f16-19 = **hit f24-27 (0.80-0.93 s)**. R2 #2 input from f35 (1.17 s); roll f37 (1.23); walk f50 (1.67). MV 130 / 138 (two variants).
  - **Charged R2 #1**: **hit f38-41 (1.27-1.40 s)**. Charged R2 #2 follow-up from f53 (1.77); roll f56 (1.87); walk f71 (2.37); end f124 (4.13 s). MV 165 (Alabaster Lord's 215).
  - Charged R2 #2 hits f37-41 of its own clip; uncharged R2 #2 hits f13-17 of its End clip.
  — [explorer data a025_032500/032505/032510/032515](https://github.com/sovietspaceship/elden-ring-frame-data-explorer-data/tree/main/108)
- **Claymore's unique R2 (a125, Claymore only) [DM, historical]**:
  - Charge window f11-22; 1.2x speed over f12-22.
  - Uncharged: 11 f lead-in + hit f10-14 = **f21-25 (0.70-0.83 s)**; roll f36 (1.20).
  - Charged: **hit f36-41 (1.20-1.40 s)**; roll f55 (1.83); walk f69 (2.30).
  - MV: uncharged 130, charged 170.
  — [explorer data a125_032500/032505](https://github.com/sovietspaceship/elden-ring-frame-data-explorer-data/tree/main/108)
- **Colossal 2H R2 (1.08) [DM, historical]**:
  - Charge window f9-20; speed 1.3x over f0-11, then 1.8x over f11-23.
  - Uncharged: 9 f lead-in + hit f15-18 = about **f24-27 (0.80-0.93 s)**; roll about f43 (1.43).
  - Charged: **hit f43-46 (1.43-1.57 s)**; roll f61 (2.03); end f116 (3.87).
  - MV: 141 uncharged, 180 charged.
  - The 1.17.1 analysis gives the colossal "Greatsword" a 4 f lead-in + hit f17 = first hit f21. The 1.08 and 1.17.1 numbers differ here, possibly a patch change.
  — [explorer data a026_032500/032505](https://github.com/sovietspaceship/elden-ring-frame-data-explorer-data/tree/main/108); [Banon-Labs attacks.md §4](https://github.com/Banon-Labs/er-mods-rs/blob/main/docs/er-mechanics/attacks.md)
- **Multipliers and costs (regulation 1.17.1) [DM]**. Poise is in internal units (x10 = menu-poise units). Columns are MV / poise / stamina:

  | 2H | R1 #1 | R2 | charged R2 | running R1 | running R2 | jump R1 | jump R2 | HA R1 / charged R2 |
  |---|---|---|---|---|---|---|---|---|
  | Claymore | 103 / 13.2 / 18 | 130 / 14.52 / 30 | 170 / 36.3 / 40 | 110 / 13.2 / 22 | 125 / 12.1 / 30 | 110 / 13.2 / 15 | 135 / 24.2 / 30 | +5.9 / +11.8 |
  | colossal "Greatsword" | 114 / 18.72 / 27 | 136 / 18.72 / 40 | 176 / 39.6 / 54 | 122 / 18.72 / 31 | 138 / 18.72 / 40 | 112 / 18.72 / 22 | 135 / 26.4 / 40 | +9.0 / +18.0 |
  | Giant-Crusher (colossal weapon) | 114 / 23.4 / 31 | 137 / 16.5 / 51 | 187 / 45.75 / 67 | 124 / 23.4 / 36 | 137 / 23.4 / 46 | 112 / 23.4 / 25 | 135 / 30.75 / 46 | +9.9 / +19.8 |
  | Longsword (contrast) | 103 / 6.5 / 15 | 130 / 11.0 / 24 | 165 / 33.0 / 36 | 110 / 6.5 / 18 | 125 / 11.0 / 24 | 112 / 9.75 / 12 | 132 / 22.0 / 24 | none |

  — [Banon-Labs attacks.md §5](https://github.com/Banon-Labs/er-mods-rs/blob/main/docs/er-mechanics/attacks.md)
- Banon-Labs summary: "Uncharged and charged R2 differ mostly in poise (x3 on light weapons, x2.3-2.8 on heavy ones), and MV rises by about 30%." The GS/colossal R1s carry poise corrections of 185-240%, so their R1 poise can match or exceed their uncharged R2. — [Banon-Labs attacks.md §5](https://github.com/Banon-Labs/er-mods-rs/blob/main/docs/er-mechanics/attacks.md)

### Inferences
- [EST] Claymore 2H ratios, charged vs uncharged: MV 170/130 = **1.31x**, poise 36.3/14.52 = **2.5x**, stamina 40/30 = 1.33x. Colossal "Greatsword": MV 1.29x, poise 2.1x, stamina 1.35x. **Charging trades about 0.4-0.6 s of extra windup for a large stance-damage gain, not mainly for HP damage.**
- [EST] "Max charge time" in ER is the end of the 100280 window: about 0.73-0.77 s after the press for GS-class (f22-23) and about 0.67 s for colossal (f20). There is no longer hold and no damage ramp; the charged swing then plays automatically.

### Gaps
- The 1.17.1 release lead-in for the Claymore R2 was not extracted. The source flags the lead-in as INFERRED (an earliest-release bound).
- Charged R2 #2 timing as a chained follow-up and R2 to R1 transitions (SpEffect 133/134 "[HKS] Switch Heavy to Heavy Sub" windows) were not decoded in detail.

## Hyperarmor (poise during attacks): which swings, when, how it works, what breaks it

### Takeaway
Hyperarmor is a TAE window that temporarily adds `100 x ToughnessParam.correctionRate x weapon.toughnessCorrectRate` to the player's poise pool and refills poise to at least 80% of the boosted max. **GS-class (Claymore family) has it only when two-handed; colossal swords and colossal weapons have it on every 1H and 2H attack.** The windows start about **0.23-0.37 s** into the swing and end about 6-10 frames after the hit. Enough poise damage during the window breaks it; there is no unconditional immunity.

### Cited Findings
- **Mechanism [DM-EXE]**:
  - TAE event 795 is the hyperarmor window. While it is open, max toughness = 100 x (armor sum x proCorrectionRate + correctionRate x weapon `toughnessCorrectRate`).
  - On entering the window, current poise becomes newMax minus damage already taken, clamped to at least `minToughness%` (80% for rows 100-151) of the new max. When the window closes, the weapon term is removed.
  — [Banon-Labs attacks.md §2 "Hyperarmor"](https://github.com/Banon-Labs/er-mods-rs/blob/main/docs/er-mechanics/attacks.md)
- **Row multipliers (correctionRate) [DM]**: R1 1.0; uncharged R2 1.0; **charged R2 2.0**; running/rolling/backstep R1 0.75; running R2 1.0; jump R1 0.75; jump R2 1.0; **guard counter 0.5**; skills 0.3. — same source
- **Weapon toughnessCorrectRate [DM]**: dagger 0.011, straight sword/katana 0.015, **Claymore 0.059**, colossal "Greatsword" 0.09, Giant-Crusher 0.099. So the Claymore 2H R1 gets **+5.9 internal (+59 menu poise)** and its charged R2 **+11.8 (+118)**. The colossal "Greatsword" gets +9.0 / +18.0. — same source
- **Which attacks [DM]**: "a25 greatsword has it on 2H attacks only (rows 100-150), plus skills. a26 colossal sword and a31 colossal weapon have it on every 1H and 2H attack." Daggers have none; straight swords and katanas only on skills. — [Banon-Labs attacks.md §2](https://github.com/Banon-Labs/er-mods-rs/blob/main/docs/er-mechanics/attacks.md). The 1.08 explorer data agrees: a025 1H R1 has no window; a025 2H R1 does. — [explorer data](https://github.com/sovietspaceship/elden-ring-frame-data-explorer-data/tree/main/108)
- **GS-class 2H windows (1.08, real frames) [DM, historical]**:
  - R1 #1 **f9-25 (0.30-0.83 s)**, against a hit at f16-19.
  - R1 #2 f9-27; R1 #4 f11-31.
  - Running R1 f10-28; rolling R1 f10-25; backstep R1 f10-25.
  - Uncharged R2: End-clip f2-24, which is about **f10-32 from the press** [EST].
  - Charged R2 **f22-47 (0.73-1.57 s)**. Note it starts about 14 f after the charge begins, so the first part of the charge is not covered.
  - Guard counter f13-32; jump R1 landing f11-24; jump R2 landing f10-27.
  — [explorer data a025](https://github.com/sovietspaceship/elden-ring-frame-data-explorer-data/tree/main/108)
- **Colossal 2H windows (1.08) [DM, historical]**: R1 #1 **f7-25 (0.23-0.83 s)**; charged R2 f22-52; uncharged R2 End-clip f0-24; guard counter f6-32. 1.17.1 Greatsword 1H R1: +9.0 over real f7.5-25.7. — [explorer data a026](https://github.com/sovietspaceship/elden-ring-frame-data-explorer-data/tree/main/108); [Banon-Labs attacks.md §5](https://github.com/Banon-Labs/er-mods-rs/blob/main/docs/er-mechanics/attacks.md)
- **What breaks it [DM-EXE]**: a hit subtracts poise damage x cut rates. "At 0 or below the stagger fires." While poise holds, the defender's reaction is remapped by SpEffect 6352 so that small, middle and large hits play **no reaction**, though blow and launch levels still play. The pool refills fully after a break, two updates later.
  - **PvP only**: incoming poise damage during hyperarmor is x0.65 (GS 2H rows x0) or x0.45 (colossal rows x1), and incoming HP damage is x0.925 / x0.825.
  — [Banon-Labs attacks.md §2](https://github.com/Banon-Labs/er-mods-rs/blob/main/docs/er-mechanics/attacks.md); [frame-advantage.md §1](https://github.com/Banon-Labs/er-mods-rs/blob/main/docs/er-mechanics/frame-advantage.md)
- **Patch history (low confidence) [WIKI-snippet]**: some fan wikis list a two-handed poise-during-attacks buff for Colossal Swords and others under 1.07 or 1.09; sources disagree on the version. **1.12 (SotE launch patch)** reportedly lists "Greatswords: Decreased poise on some attack animations" alongside poise-damage buffs. — [Fextralife Patch Notes (search snippet)](https://eldenring.wiki.fextralife.com/Patch_Notes); [Steam 1.07 notes thread](https://steamcommunity.com/app/1245620/discussions/0/5533260453820917999/); [Fandom Version 1.12](https://eldenring.fandom.com/wiki/Game_Version/1.12)

### Inferences
- [EST] For the prototype: GS-class 2H hyperarmor covers roughly from 0.3 s (about 55% of the way into the windup) to about 0.2 s after the active frames end. **The first ~0.3 s of every heavy swing is interruptible.** This matters for trading: the attacker must commit before armor turns on.
- [EST] Hyperarmor in ER is a poise boost ("tank N poise worth of hits"), not an on/off flag. A Claymore R1's +59 menu poise survives one light hit but not a heavy one. This keeps trades readable: heavy beats light, and heavy vs heavy can interrupt.

### Gaps
- Exact per-patch history of the hyperarmor windows (1.07, 1.09, 1.10, 1.12, SotE) could not be verified from primary patch notes; the official site was not fetched.

## Jump attacks, running attacks, rolling attacks, guard counters: timing and role

### Takeaway
These are ER's main "special entry" attacks. Running and rolling R1s are about the same speed as a standing R1 (0.47-0.67 s to hit) and roll-cancel at 1.0-1.13 s. The **guard counter** (R2 after a blocked hit) hits about **0.73 s** after it starts and carries **charged-R2-level poise damage**. **Jump R2** carries about 1.8x R1 poise for the stamina of an uncharged R2, and jump attacks and guard counters **cannot be parried**. FromSoftware said stance-breaking was designed to give melee more depth, with guard counters and jump attacks built to work with it.

### Cited Findings
- **GS-class 2H running/rolling/backstep (1.08, real frames from attack start) [DM, historical]**:
  - Running R1: hit f20-23 (0.67-0.80 s); chain f35; roll f34 (1.13).
  - Running R2: hit f21-25 (0.70-0.87); roll f38 (1.27).
  - Rolling R1: hit **f14-18 (0.47-0.63 s)**, the fastest GS-class 2H hit; chain f28; roll f30 (1.00).
  - Backstep R1: hit f17-21; roll f31.
  - MVs: running R1 110, running R2 125, rolling R1 95, backstep R1 95.
  — [explorer data a025_0322x0/032300/032400](https://github.com/sovietspaceship/elden-ring-frame-data-explorer-data/tree/main/108)
- **Jump attacks (1.08) [DM, historical]**: a jump attack is an airborne clip plus a landing clip.
  - GS-class 2H jump R1: airborne hitbox at f16-21 of the attack clip (HA f11-24). The landing clip has hitbox f16-19 (MV 110), then roll at landing+f34 (1.13 s), R1 follow-up from landing+f27, walk landing+f43.
  - Jump R2: airborne hitbox **f17-40**, active while falling. Landing clip hit f20-23 (MV 135, damage level 3), then roll at landing+f45 (1.50 s).
  - Colossal jump R2 landing: MV 135, hit f18-21, roll f46.
  — [explorer data a025_0330x0/0332x0](https://github.com/sovietspaceship/elden-ring-frame-data-explorer-data/tree/main/108)
- **Jump costs (1.17.1) [DM]**:
  - The jump itself costs **10 stamina** (HKS `STAMINA_REDUCE_JUMP` -10).
  - Claymore 2H jump R1 = 15 stamina / 13.2 poise; jump R2 = **30 stamina / 24.2 poise** (vs R1 13.2, uncharged R2 14.52, charged R2 36.3).
  — [Banon-Labs exchange.md §3a](https://github.com/Banon-Labs/er-mods-rs/blob/main/docs/er-mechanics/exchange.md); [attacks.md §5](https://github.com/Banon-Labs/er-mods-rs/blob/main/docs/er-mechanics/attacks.md)
- **Jump attacks and guard counters are not parryable [DM]**: neither opens the "get-parried" window (JumpTable 5). Two-handed colossal and greatsword (a026/a031) attacks are never parryable; GS-class (Claymore family) ground attacks are parryable in both grips. — [Banon-Labs crits.md §4](https://github.com/Banon-Labs/er-mods-rs/blob/main/docs/er-mechanics/crits.md)
- **Guard counter (1.08, real frames from the counter's start) [DM, historical]**:
  - GS-class 2H: **hit f22-25 (0.73-0.87 s)**; HA f13-32; roll f35 (1.17); walk f51. The clip plays at 1.2x over f0-10. MV 130. PvP poise 490.05, **the same value as the GS-class charged R2 (490.05)**.
  - Colossal 2H guard counter: hit f21-26, MV 143, poise 534.6, also equal to its charged R2.
  - The explorer's poise column matches PvP poise units; see the stance section.
  — [explorer data a025_032700/a026_032700](https://github.com/sovietspaceship/elden-ring-frame-data-explorer-data/tree/main/108)
- **Guard counter is a normal attack, not a critical**: judge 180 (1H) / 380 (2H). It does not use the crit multiplier. The Curved Sword Talisman adds x1.2 to guard counters [DM-EXE]. A guard counter is an R2 out of a small or middle guard reaction. — [Banon-Labs crits.md §2](https://github.com/Banon-Labs/er-mods-rs/blob/main/docs/er-mechanics/crits.md); [talismans.md](https://github.com/Banon-Labs/er-mods-rs/blob/main/docs/er-mechanics/talismans.md); [powerstance-guard.md](https://github.com/Banon-Labs/er-mods-rs/blob/main/docs/er-mechanics/powerstance-guard.md)
- **Wiki/guide claims [WIKI-snippet]**: guard counters "quickly deplete a target's Stance"; their stance damage is "comparable to a fully-charged strong attack". The blocked hit is still taken on the guard, so you need stamina to survive it. — [Fandom Guard Counter](https://eldenring.fandom.com/wiki/Guard_Counter); [Fextralife About Guard Counters](https://eldenring.wiki.fextralife.com/About_Guard_Counters)
- **Design intent (secondhand interview summaries)**:
  - The stance-break system "came from the idea that they wanted to give the melee combat from the Dark Souls series more depth, and guard counters and jump attacks having synergy with this system" (Miyazaki, Famitsu summary). — [frontlinejp, Mar 2022 interview summary](https://www.frontlinejp.net/2022/03/08/discussing-design-philosophy-elden-ring-release-interview-with-director-miyazaki-part-2-2/)
  - A 2021 summary says jump attacks are heavy and jumping can avoid low attacks, and gives "the ability to counter directly from a shield block" as a new option. — [frontlinejp, Jun 2021](https://www.frontlinejp.net/2021/06/17/elden-ring-director-interview-part-2-miyazaki-discusses-the-gameplay/)
  - Commentary that the guard counter rewards defensive play while drawing players out from behind shields. — [GamesRadar](https://www.gamesradar.com/elden-ring-is-miyazakis-most-successful-attempt-to-get-players-out-from-behind-their-shields/)

### Inferences
- [EST] The design pattern is high-value, low-risk "entry" options: jump R2 gives charged-level stance pressure without charge windup and cannot be parried; the guard counter turns a successful block into a charged-R2 stance hit in about 0.73 s. Both give big poise payoffs to positioning or defense instead of to standing and charging. A prototype without jump attacks or block-to-counter lacks ER's two main stance-break routes.

### Gaps
- Total jump-attack time from the jump press to the hit could not be computed: it depends on when the attack is pressed in the air, and the jump clip's own timing was not extracted.
- The guard-counter input window after a block (how long after the guard reaction R2 is accepted) was not found as a number.

## Stamina: pool, Endurance growth, regen, delays, costs, zero-stamina behavior

### Takeaway
The stamina bar runs from **80 to 170** (Endurance 1 to 99; 130 at END 30, 155 at END 50). It regenerates at a **flat 45/s (1.5 per 30 fps frame)**. There is no timer delay; instead **each animation sets a regen percent**. Attacks hold regen at **0%** for most of their clip (about 1.3 s for a Claymore 2H R1), rolls for about 1.0 s, and guarding runs at **20% (9/s)**. Sprinting stops regen entirely. A Claymore 2H R1 costs 18, R2 30, charged R2 40, and a roll 12. You can start an action with any stamina above 0, and stamina can dip to -50. Rolling and guarding need stamina above 0. A guard breaks when a blocked hit's stamina damage is greater than or equal to your remaining stamina.

### Cited Findings
- **Max stamina [DM]**: CalcCorrectGraph row 104, breakpoints END 1/15/30/50/99 = **80/105/130/155/170**, linear between them; soft caps at 50.
  - Selected values: END 8 = 92, 10 = 96, 15 = 105, 20 = 113, 25 = 121, 30 = 130, 40 = 142, 50 = 155, 60 = 158, 99 = 170.
  — [Banon-Labs resources.md §2](https://github.com/Banon-Labs/er-mods-rs/blob/main/docs/er-mechanics/resources.md). The Endurance soft caps "at 15, 30, and 50" agree. — [Fandom Stamina (search snippet)](https://eldenring.fandom.com/wiki/Stamina)
- **Regen rate [DM-EXE]**: `PlayerIns::GetStaminaRecoverySpeed` returns a constant **45.0** plus SpEffect `staminaRecoverChangeSpeed`. Talisman values: Green Turtle +8, Two-Headed Turtle +10. Spell values: Greenburst +15, Flame Grant Me Strength +5, Braggart's Roar +10. The NpcParam value (21) is enemy-only. "Per second" is INFERRED from FD4Time, so 45/s = 1.5 per 30 fps frame. — [Banon-Labs exchange.md §3b](https://github.com/Banon-Labs/er-mods-rs/blob/main/docs/er-mechanics/exchange.md); [talismans.md](https://github.com/Banon-Labs/er-mods-rs/blob/main/docs/er-mechanics/talismans.md); [buffs.md](https://github.com/Banon-Labs/er-mods-rs/blob/main/docs/er-mechanics/buffs.md)
  - [MEAS] A Steam user measured about 4.17 s to refill 0 to 192 without the Two-Headed Turtle (about 46/s) and 3.30 s with it (about 58/s). The first figure is consistent with 45/s; the second is somewhat above 55/s. — [Steam discussion surfaced by search; thread not opened](https://steamcommunity.com/app/1245620/discussions/0/3421062490358366775/)
- **No timer delay; per-animation regen percent [DM-EXE]**:
  - TAE event 225 `SetSPRegenRatePercent` sets the regen percent for the frames it covers; the percent resets to 100 each frame when no event covers it.
  - **Attacks:** every 2H R1 read has 0% from clip frame 0, until real frame 39.0 for the Claymore, 51.7 for the colossal "Greatsword", 54.9 for Giant-Crusher.
  - "Each window runs past the slot's cancel frame, so chained attacks regenerate nothing."
  - **Rolls:** 0% for 30 clip frames. **Backsteps:** 0% for 26 frames.
  - **Guard clips:** 20%. Guard-hit reactions: 0% for their first 10 / 27 / 49 frames (small / middle / large).
  - **Stopped outright** while sprinting, in guard-damage states, and on the HKS `AddStamina` paths (rolls, backsteps, jumps).
  — [Banon-Labs exchange.md §3b](https://github.com/Banon-Labs/er-mods-rs/blob/main/docs/er-mechanics/exchange.md); [powerstance-guard.md §3](https://github.com/Banon-Labs/er-mods-rs/blob/main/docs/er-mechanics/powerstance-guard.md)
- **Costs [DM]**:
  - Formula: cost = trunc(BehaviorParam_PC.stamina x SpEffect rate x EquipParamWeapon.staminaConsumptionRate x 1.5 if stat requirements are unmet).
  - Heavy weapons have `staminaConsumptionRate` above 1 (colossal "Greatsword" 1.135, Giant-Crusher 1.295).
  - **The cost is charged when the hitbox spawns (TAE AttackBehavior), not at animation start.**
  - Entry costs: **roll 12, backstep 8, jump 10**.
  - Claymore 2H: R1 18, R2 30, charged R2 40, running R1 22, running R2 30, jump R1 15, jump R2 30. Claymore 1H: R1 15 / R2 25 / charged 35. Colossal "Greatsword" 2H: 27 / 40 / 54.
  — [Banon-Labs attacks.md §3, §5](https://github.com/Banon-Labs/er-mods-rs/blob/main/docs/er-mechanics/attacks.md); [exchange.md §3a](https://github.com/Banon-Labs/er-mods-rs/blob/main/docs/er-mechanics/exchange.md)
  - Fextralife's Equip Load page agrees that rolls and backsteps cost 12 regardless of load [WIKI-snippet]. Banon's 1.17.1 data gives the backstep as 8, which conflicts. — [Fextralife Equip Load](https://eldenring.wiki.fextralife.com/Equip_Load)
- **Zero / negative stamina [DM-EXE]**:
  - `SetStamina` clamps to **[-50, max]**: "an action started with 1 stamina left can end at -49".
  - Evasion and guard requests are refused at stamina <= 0, so "a roll needs stamina above 0, not above 12".
  - Attacks reset the combo at <= 0; that an attack needs > 0 is INFERRED.
  — [Banon-Labs exchange.md §3b](https://github.com/Banon-Labs/er-mods-rs/blob/main/docs/er-mechanics/exchange.md)
- **Guard break [DM-EXE]**: a blocked hit drains (1 - guardBoost/100) x the attack's stamina damage. If **stamina <= that drain, the guard breaks**. The breaking hit itself still counts as guarded (chip damage applies). — [Banon-Labs powerstance-guard.md §3](https://github.com/Banon-Labs/er-mods-rs/blob/main/docs/er-mechanics/powerstance-guard.md)

### Inferences
- [EST] Budget example, END 30 (130 SP), Claymore 2H, no talismans:
  - About **7 R1s back to back** (7 x 18 = 126), and the 8th can still start at 4 SP and end at -14.
  - About 4 charged R2s (4 x 40 = 160 > 130, so 3 plus one dip into negative).
  - Refill from 0 takes about 2.9 s of non-attacking time. With R1 #1's regen block lasting to 1.3 s, a lone R1 then walking off costs about 1.3 + 18/45 = 1.7 s of "stamina time".
- [EST] The key feel rule for a prototype: **regen is gated by animation state, not by a cooldown timer**. Spamming attacks yields zero regen, and only idling or walking (100%) or guarding (20%) refills. A rest of about 0.4 s fully pays back one Claymore R1 once the animation ends.

### Gaps
- Regen while walking vs standing (no evidence of a difference beyond the 100% default), and in the air, were not explicitly confirmed.
- The exact BehaviorParam stamina for every Claymore-family weapon (e.g., Flamberge, Bastard Sword) was not enumerated; they share the Claymore movesets, so values are likely similar [EST].

## Input buffering for attacks

### Takeaway
ER does not have a single global buffer window. Each animation has separate **input windows** (when a press is accepted and queued) and **cancel windows** (when a queued action may start), both defined per frame in the TAE. A press before the input window opens is **dropped**. A press inside the input window is **held and fires on the first frame the cancel window opens**.

### Cited Findings
- **Mechanism [DM-EXE, 1.16.2]**:
  - Input-accept JumpTable ids: 1 = R1/R2, 25 = dodge, 21 = guard, 87 = all.
  - Cancel ids: 4 = R1+R2, 115 = R1 chain only, 116 = R2 only, 26 = dodge, 22 = guard, 11/78 = walk.
  - Both masks are rebuilt every frame from active TAE events. "A press made before the input window opens is dropped, not buffered; a press made inside the input window but before the cancel window is held and fires when the cancel window opens."
  - Early-activation events open most cancel windows 2 frames ahead of the listed window.
  — [Banon-Labs attacks.md §4 "Recovery"](https://github.com/Banon-Labs/er-mods-rs/blob/main/docs/er-mechanics/attacks.md)
- Out of a stagger, the roll is additionally gated by a consecutive-stagger counter. After the 1st/2nd/3rd/4th consecutive small stagger, roll unlocks at frame 10/7/4/0 of the reaction clip. — [Banon-Labs frame-advantage.md §3](https://github.com/Banon-Labs/er-mods-rs/blob/main/docs/er-mechanics/frame-advantage.md)
- The explorer data exposes the cancel windows as typed ranges ("LightAttackOnly", "HeavyAttackOnly", "RightAttack", "Dodge", "Block", "Move"). GS-class 2H R1 #1's R1-only window is f26-35, then any right-hand attack from f35. — [explorer data](https://github.com/sovietspaceship/elden-ring-frame-data-explorer-data/tree/main/108)

### Inferences
- [EST] In practice the "buffer" is the gap between the input-window opening and the cancel-window opening. In Souls TAEs the input window typically opens shortly before the cancel window. A prototype matching ER should have a per-attack "accept input from frame X; execute at frame Y" pair, not a global N-ms buffer, and should drop presses made before X. Drop them silently: never chain from a press made during startup.

### Gaps
- No source gave GS-class input-window-open frames (JT 1/87) as numbers, so the buffer length in ms for a Claymore R1 to R1 is unknown. The Banon-Labs tool reports `input_open_frame`, but the docs do not list it for the Claymore.

## Hit feedback: hitstop, camera shake, sound

### Takeaway
Vanilla ER has a small, mostly uniform hitstop. `AtkParam.hitStopTime` = **0.08 s (2.4 frames at 30 fps)** on nearly every melee row. It freezes the attacker, scaled by the target's `hitStopType`, and player targets appear to get none. Weight is expressed mainly through animation speed, stagger level and poise, not through longer freezes. Camera shake exists for heavy impacts. No sound data was found.

### Cited Findings
- `AtkParam.hitStopTime` is VERIFIED as a field; "the value is 0.08 s = 2.4 frames on nearly every melee row". Whether hitstop stops the attacker, the defender or both was "not traced" in that doc [DM]. — [Banon-Labs combo.md §2](https://github.com/Banon-Labs/er-mods-rs/blob/main/docs/er-mechanics/combo.md)
- "Hit stop freezes the attacker, scaled by the defender's `NpcParam.hitStopType` (FUN_14044fce0). Rows 0 and 1 have type 0, so a player target is taken to cause none (INFERRED)" [DM-EXE]. — [Banon-Labs ashes-of-war.md](https://github.com/Banon-Labs/er-mods-rs/blob/main/docs/er-mechanics/ashes-of-war.md)
- The paramdefs confirm `hitStopTime` (f32) and `hitStopType` (u8) fields in AtkParam/NpcParam [DM]. — [soulsmods Paramdex ER Defs](https://github.com/soulsmods/Paramdex/tree/master/ER/Defs)
- A popular PC mod, "Impactful Hitstop", adds hitstop and camera shake tunable per light/medium/heavy weapon, with two-handing raising intensity and repeat hits within 0.8 s weakened by a third. This implies players perceive vanilla hitstop as weak or uniform [WIKI-snippet, mod page]. — [Nexus Mods: Impactful Hitstop](https://www.nexusmods.com/eldenring/mods/11289)
- A 2024 Steam thread reports "a screen shake effect every time something heavy hits the ground" [WIKI-snippet / player report]. — [Steam discussion](https://steamcommunity.com/app/1245620/discussions/0/3729575905272002927/)

### Inferences
- [EST] For a prototype comparison: ER's per-hit freeze is about 80 ms and does not scale with weapon class at the param level. Ripping in long, weight-scaled hitstop (e.g., 150-250 ms for greatswords) would be more "Monster Hunter" than "Elden Ring". ER sells weight through 0.5 s+ windups, sped-up then slowed animation curves (TAE 608 play-speed windows, e.g., 1.34x over the start of a colossal R1), enemy stagger animations and heavy sound.

### Gaps
- Per-weapon-class hitstop rows (whether colossal rows differ from 0.08 s) were not enumerated.
- Which enemy `hitStopType` values scale the freeze, and by how much, is unknown.
- Camera-shake params, hit sound design and controller rumble: no reliable source found.

## Stance damage, enemy stance breaks, and the critical (riposte) on a stance-broken enemy

### Takeaway
The same "poise damage" value that staggers players also depletes NPC stance (the super-armor bar). It equals the weapon base (`saWeaponDamage`: Claymore 5.5, colossal "Greatsword" 6.0) x the attack's correction. Charged R2s, guard counters and jump R2s are the high-stance attacks. GS-class 2H values are about 2.75x R1 for both charged R2 and guard counter, and about 1.8x for jump R2. A stance break opens a riposte-type critical. For the colossal/greatsword crit family the riposte is a two-hit throw of MV 263 (53 + 210), vs 420 for daggers.

### Cited Findings
- **Poise damage formula [DM-EXE]**: poise = `saWeaponDamage x ReinforceParamWeapon.saWeaponAtkRate (1.0 always) x atkSuperArmorCorrection x 0.01` (+ flat if `isAddBaseAtk`). It feeds both the NPC super-armor bar and player toughness (the shared value is INFERRED). Upgrades do not change it. Base values: dagger 3.0, straight sword/katana 5.0, **Claymore 5.5**, colossal "Greatsword" 6.0, Giant-Crusher 7.5. — [Banon-Labs attacks.md §2](https://github.com/Banon-Labs/er-mods-rs/blob/main/docs/er-mechanics/attacks.md)
- **Units**: internal toughness is menu poise / 10, so the Claymore 2H R1 = 13.2 internal = 132 in menu units. Between players, poise damage is further multiplied by `FinalDamageRateParam.saRate`. The explorer's "poiseDamage" column matches these PvP values (dagger 1H R1 40.5), so Claymore 2H R1 = 178.2, charged R2 = 490.05, guard counter = 490.05, jump R2 = 326.7 (PvP units) [DM]. — [Banon-Labs attacks.md §2](https://github.com/Banon-Labs/er-mods-rs/blob/main/docs/er-mechanics/attacks.md); [explorer data](https://github.com/sovietspaceship/elden-ring-frame-data-explorer-data/tree/main/108)
- **Riposte/critical [DM]**:
  - Ripostes and backstabs are throws (ThrowParam 30000000 riposte, range 1.5 m; 10000000 backstab).
  - Colossal sword / "greatsword" crit family (rows 100400xxx): **riposte MV 53 + 210 = 263** (two hits); backstab 52 + 168 = 220. Daggers: riposte 420, backstab 294. Katana: riposte 345.
  - Crit damage = AR x MV x (100 + throwAtkRate)/100. throwAtkRate is 0 on most weapons; Lordsworn's Greatsword +10; Dagger 30; Misericorde 40.
  - Attacker crit animation (a032 family) is 171 frames (**5.7 s**) for a riposte and 135 f for a backstab. The victim's riposte animation is 195 f (6.5 s).
  — [Banon-Labs crits.md §1-2](https://github.com/Banon-Labs/er-mods-rs/blob/main/docs/er-mechanics/crits.md)
- **Counter hits [DM]**:
  - The GS-class 2H R1 #1 applies SpEffect 45 "[HKS] Counter Frames" from f16 to f36, i.e., from the active frames through about 0.7 s of recovery. A hit landing on someone in that window gets bonus damage.
  - Per regulation the bonus is **pierce-only x1.15** when SpEffect 45 is on the victim (players), and x1.3 for SpEffect 31. Spear Talisman: 1.15 x 1.15 = 1.3225.
  - Poise damage on counter: not traced.
  — [explorer data](https://github.com/sovietspaceship/elden-ring-frame-data-explorer-data/tree/main/108); [Paramdex names](https://github.com/soulsmods/Paramdex/blob/master/ER/Names/SpEffectParam.txt); [Banon-Labs defense.md §2b](https://github.com/Banon-Labs/er-mods-rs/blob/main/docs/er-mechanics/defense.md)
  - Wiki: enemies take +30% pierce and players +15% pierce on counter hits [WIKI-snippet]. — [wiki.gg Counter Hit](https://eldenring.wiki.gg/wiki/Counter_Hit)
- **Hit reactions on players [DM]**:
  - GS-class 2H R1s are damage level 2 (middle); colossal R1s and charged R2s are level 3 (large).
  - When poise breaks, a middle reaction clip is 57 f (1.9 s). The victim can R1 at f24 and roll at f25 on the first stagger. Large: 60 f, R1 f30, roll f35.
  - With poise intact, levels 1-3 play only an additive flinch with no lockout.
  — [explorer data](https://github.com/sovietspaceship/elden-ring-frame-data-explorer-data/tree/main/108); [Banon-Labs frame-advantage.md §1-2](https://github.com/Banon-Labs/er-mods-rs/blob/main/docs/er-mechanics/frame-advantage.md)
- **Wiki/guide claims [WIKI-snippet]**:
  - Yellow sparkles mark the critical point after a stance break.
  - Many bosses need several parries before a critical.
  - Parry criticals deal less total damage than jump-attack or guard-counter routes, because those also deal damage before the critical.
  — [Fextralife Parrying](https://eldenring.wiki.fextralife.com/Parrying); [Gamerant: How stance break works](https://gamerant.com/elden-ring-how-stance-break-works/)

### Inferences
- [EST] Claymore 2H stance-damage ladder (internal units): R1 13.2 / running R1 13.2 / uncharged R2 14.52 / jump R2 24.2 / charged R2 36.3. Guard counter is about 36.3 by the PvP-unit equality with charged R2.
  - Relative to R1: **charged R2 about 2.75x, guard counter about 2.75x, jump R2 about 1.8x**, uncharged R2 about 1.1x.
  - Per stamina: R1 0.73/SP, jump R2 0.81/SP (30 SP, plus the jump's 10 SP), charged R2 0.91/SP. The guard counter's stamina cost was not found, so its value per SP is unknown.
- [EST] On a poise break the GS-class 2H R1 #1 gives the attacker about +14 frames of advantage. The attacker can act 10 f after the hit starts (f26 - f16), while a middle-staggered defender needs 24 f. That is still not enough for R1 #2 (which hits 28 f later) to be a true combo.

### Gaps
- Enemy (NPC) stance bar sizes and stance regen delays for representative enemies were not collected; this research covered the player side only.
- The window to land the critical after a stance break, the stance-break crit's damage vs a standard riposte, and Claymore-specific crit MVs (as opposed to the colossal-family rows) were not found.

## Guarding and parry (context for what the prototype lacks)

### Takeaway
Blocking costs stamina equal to (1 - guard boost%) x the attack's stamina damage, scaled x0.9 when two-handing a weapon to guard. Guard breaks when stamina <= that cost. Regen while guarding is 20%. Parry skills have about a 3-6 frame (0.1-0.2 s) active window starting at frame 4 (0.13 s). An attack is parryable only on its first active frame, and two-handed colossal attacks are never parryable.

### Cited Findings
- **Guard-boost classes (1.17.1)** [DM]. Higher guard boost means less stamina lost per blocked hit:

  | class | guard boost (`staminaGuardDef`) | physical block % |
  |---|---|---|
  | small shield | 38-51 | 74-89 |
  | medium shield | 48-61 | 90-100 |
  | greatshield | 60-82 | 91-100 |
  | colossal sword / colossal weapon | 56 / 58 | 84 / 88 |
  | dagger / straight sword | 15 / 30 | 35 / 45 |

  - Two-handed guard multiplies the stamina loss by 0.9 (0.7 for shields).
  - PvP: stamina damage x1.25 on nearly all rows.
  - A repelled hit deals half chip damage but still costs full stamina.
  - Attacker `attackBaseRepel`: greatsword 70, colossal 80.
  — [Banon-Labs powerstance-guard.md §3](https://github.com/Banon-Labs/er-mods-rs/blob/main/docs/er-mechanics/powerstance-guard.md)
- **Parry windows (TAE, 30 fps) [DM]**: Parry f4-6 to f4-9 depending on variant; **Buckler Parry f4-9**; Carian Retaliation f4-10; Golden Parry f4-7 (contact window to f10). "In every weapon animation read, JT5 [get-parried] is the first frame of the hitbox", so the attacker is exposed for one TAE frame per swing. Nothing in the parry code sets a riposte timer. — [Banon-Labs crits.md §4-5](https://github.com/Banon-Labs/er-mods-rs/blob/main/docs/er-mechanics/crits.md)
- **Roll for comparison [DM/MEAS]**:
  - Medium roll i-frames **f0-13 (0-0.43 s)**; first R1 out of a roll at f20 (0.67 s).
  - Travel about 3.2-3.6 m. Run 4.01 m/s; sprint 6.04 m/s.
  - Roll costs 12 stamina and pauses regen for about 1.0 s.
  — [Banon-Labs neutral.md §1](https://github.com/Banon-Labs/er-mods-rs/blob/main/docs/er-mechanics/neutral.md); [exchange.md §3](https://github.com/Banon-Labs/er-mods-rs/blob/main/docs/er-mechanics/exchange.md)

### Inferences
- [EST] A prototype without guarding loses ER's guard-counter loop and the stamina-pressure dynamic (attacker spends ~18-30 SP per swing; blocker loses (1-g/100) x stamina damage per hit at 20% regen). Without parry it loses only a niche tool for greatsword users: GS-class swings are parryable, colossal 2H swings are not.

### Gaps
- Perfect guard / "just guard" timing was not covered. The guard-counter input window (time after the block during which R2 triggers the counter) was not found as a number.
- Per-shield guard-boost values at specific upgrade levels beyond the class ranges were not collected.
