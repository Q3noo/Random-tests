# Elden Ring Player Movement, Evasion, Healing and Hit-Reaction Mechanics (quantitative notes)

Conventions used below:
- **Frame basis:** Fextralife, the main frame-data source found, measures dodge timings "in frames at 30 FPS". So 1 frame = 33.3 ms. Every frame-to-second conversion below assumes 30 fps unless a source says otherwise. One third-party guide (gamertagmythras) claims a 60 fps basis and gives different recovery numbers (see Q1).
- **Confidence tags:** [WIKI-CM] = community-measured value on a fan wiki (Fextralife), the best available here. [3P] = third-party guide or aggregator. [ANEC] = forum or anecdotal claim. [DERIVED] = my own arithmetic from cited numbers. [OFFICIAL] = official patch-note wording. **No data-mined (param-file) values were reachable in this session**, so nothing below is tagged data-mined.
- **Access limits:** WebFetch could not reach eldenring.wiki.fextralife.com, eldenring.fandom.com, docs.google.com (the "Elden Ring PvP Lexicon" doc) or gamertagmythras.com (DNS blocked in this sandbox). Wiki numbers below come from search-engine extracts of those pages, not from full-page reads. Tables could only be partly recovered.
- **Character height for "body heights per second":** about **1.70–1.75 m** (see Q4). Use 1.72 m as a midpoint. 1 m ≈ 0.58 body heights.

## Q1. Roll / dodge: duration, i-frames, distance and recovery by equip-load tier; patch changes

### Takeaway
Light (<30%) and medium (30–69.9%) rolls are identical in timing: **13 i-frames (433 ms) and 8 recovery frames (267 ms) at 30 fps**. Heavy rolls (70–99.9%) have **12 i-frames (400 ms) and 16 recovery frames (533 ms)** and travel less distance. Overloaded (≥100%) characters cannot roll at all. I found no patch through the Shadow of the Erdtree era that changed base roll frame data. The patches that touched evasion changed weapon-skill roll-cancel windows (1.04) and talisman-boosted backsteps (1.13).

### Cited Findings
- **Equip-load tiers:** Light ≤29.9% of max load, Medium 30.0–69.9%, Heavy 70.0–99.9%, Overloaded ≥100% — [Fextralife: Equip Load](https://eldenring.wiki.fextralife.com/Equip_Load); same brackets repeated in [gamertagmythras equip-load guide](https://gamertagmythras.com/blog/elden-ring/elden-ring-equip-load-guide) [WIKI-CM]
- **Frame basis and definitions:** Fextralife measures dodge timings "in frames at 30 FPS". "Delay" is frames from button press to becoming invulnerable. "I-Frames" is invulnerable frames after the delay. "Recovery" is frames after the i-frames end before you can roll again — [Fextralife: Dodging](https://eldenring.wiki.fextralife.com/Dodging) [WIKI-CM]
- **Light and medium rolls:** both show **13 i-frames and 8 recovery frames** (weight ratio ≤29.9% and 30.0–69.9% rows). The Equip Load page says the medium tier has "the same iframes and recoveries as Light Load" — [Fextralife: Dodging](https://eldenring.wiki.fextralife.com/Dodging), [Fextralife: Equip Load](https://eldenring.wiki.fextralife.com/Equip_Load) [WIKI-CM]
- **Heavy roll:** **12 i-frames (400 ms) and 16 recovery frames (533 ms)**, with a shorter roll distance — [Fextralife: Equip Load](https://eldenring.wiki.fextralife.com/Equip_Load) [WIKI-CM]
- **Millisecond conversions as extracted:** "13 (433ms)" i-frames and "8 (233ms)" recovery for light — [Fextralife: Equip Load](https://eldenring.wiki.fextralife.com/Equip_Load). **Internal inconsistency:** 8 frames at 30 fps is 267 ms, not 233 ms (233 ms = 7 frames). Either the frame count or the ms figure on the page is off by one frame.
- **Overloaded:** you cannot roll or backstep at 100% or more, and are restricted to a slow walk — [gamertagmythras equip-load guide](https://gamertagmythras.com/blog/elden-ring/elden-ring-equip-load-guide) (via search extract) [3P]
- **Conflicting third-party numbers:** Light 13 i-frames / 8 recovery, **Medium 13 / 15 recovery, Heavy 12 / 26 recovery**, with a claimed 60 fps basis — one guide in search results (attributed in the search extract to [gamertagmythras](https://gamertagmythras.com/blog/elden-ring/elden-ring-equip-load-guide) / [KnowGamePlay](https://knowgameplay.blog/elden-ring-invincibility-frames-guide); the extract did not say exactly which of the two). Contradicted by [Fextralife: Dodging](https://eldenring.wiki.fextralife.com/Dodging), which gives medium 8 recovery and heavy 16, at 30 fps [3P, conflicting]
- **Light vs medium, forum claims:** forum users disagree. One says light rolls "get their i frames 2 frames faster and last 2 frames longer", another that the "Light roll has 3 more I frames", and another that light and medium recovery is the same — Steam Elden Ring discussions surfaced in search (e.g. [thread](https://steamcommunity.com/app/1245620/discussions/0/3183488149022368269); exact thread per quote not confirmed) [ANEC, contradicted by wiki]
- **I-frame start timing:** one Steam user claims Elden Ring roll i-frames start "~30% into the roll" (unlike DS3, where they start immediately) — [Steam discussion](https://steamcommunity.com/app/1245620/discussions/0/5330626144526873743/?ctp=2) [ANEC]. A user comment on Fextralife's Quickstep page claims a mid roll has "1 or 2 startup frames" with no invincibility — [Fextralife: Quickstep](https://eldenring.wiki.fextralife.com/Quickstep) [ANEC]
- **I-frame buffs that reveal total roll length:** Windy Crystal Tear gives "Light/Medium Roll Invulnerability Duration +19% (+5 iframes, 31 Total)" — [Fextralife: Windy Crystal Tear](https://eldenring.wiki.fextralife.com/Windy_Crystal_Tear). Crucible Feather Talisman gives "+23% (+6 iframes, 32 Total)" — [Fextralife: Crucible Feather Talisman](https://eldenring.wiki.fextralife.com/Crucible_Feather_Talisman) [WIKI-CM]
- **Distance:** light load mainly buys distance ("the roll travels farther"). The i-frame difference from medium is small — [gamertagmythras equip-load guide](https://gamertagmythras.com/blog/elden-ring/elden-ring-equip-load-guide) [3P]. Forum users disagree on whether light rolls go farther than medium — Steam discussions in search results [ANEC]
- **Only metric distance found:** "the character covers approximate 3–3.5 meters" in a frame-by-frame dash comparison against AC: Valhalla. The roll type and load were not stated — [Medium: Frame-by-frame Elden Ring vs AC Valhalla](https://medium.com/@nesterenkodmitry96/frame-by-frame-elden-ring-vs-ac-valhalla-dash-and-enemy-attacks-7ff7138b718e) [3P, low confidence]
- **Unrelated tiers (do not use for vanilla):** a fandom page lists "Nimble 13, Balanced 12, Solid 11" i-frames. It is the Elden Ring *Reforged* mod wiki, not vanilla — [ERR wiki: Combat Mechanics](https://err.fandom.com/wiki/Combat_Mechanics)
- **Patch 1.04 (2022):** added roll-cancel windows to several weapon skills, e.g. Familial Rancor ("Added a window to roll during the attack to cancel the animation"), Sea of Magma, Flame Dance and Black Flame Tornado — [GamerGuides 1.04 summary](https://www.gamerguides.com/elden-ring/guide/gameplay/patch-notes/elden-ring-patch-1-04-all-nerfs-buffs-and-bug-fixes); [Sportskeeda 1.04 official-notes reprint](https://www.sportskeeda.com/esports/news-elden-ring-patch-1-04-official-notes-new-event-phases-patches-sorcery-colossal-weapon-updates) [OFFICIAL, reprinted]
- **Patch 1.03 (2022):** the notes found cover the Hoarfrost Stomp nerf, quest phases and bug fixes. No roll-frame change is listed — [Sportskeeda 1.03 notes](https://www.sportskeeda.com/esports/elden-ring-patch-v1-03-official-notes-massive-hoarfrost-stomp-nerf-new-quest-phases-bug-fixes) [OFFICIAL, reprinted]
- **Patch 1.13 (Sept 11, 2024, SotE era):** "Decreased the backstep invulnerability window when the Fine Crucible Feather Talisman or the Talisman of All Crucibles are equipped". Miriam's Vanishing: "Decreased invulnerability window against other players' attacks" — [Maxroll 1.13 notes](https://maxroll.gg/elden-ring/news/elden-ring-patch-notes-version-1-13); [Shacknews 1.13](https://www.shacknews.com/article/140752/elden-ring-shadow-of-erdtree-update-113-patch-notes); [PCGamesN 1.13](https://www.pcgamesn.com/elden-ring/patch-notes-1-13) [OFFICIAL, reprinted]
- **Patch 1.14:** changed Crucible Aspects and Lelana's Cameo, per an auto-translated Steam relay of the notes — [Steam post](https://steamcommunity.com/app/1245620/discussions/0/4755326933232370131) [3P, secondary]

### Inferences
- [DERIVED] **Base light/medium roll cycle ≈ 26 frames = 0.87 s at 30 fps.** Windy Crystal Tear adds 5 i-frames for "+19%" and a "31 Total". Crucible Feather adds 6 for "+23%" and a "32 Total". Both imply a base total of 26 frames (5/26 = 19.2%, 6/26 = 23.1%). Then delay = 26 − 13 − 8 = **≈5 frames (≈167 ms) before i-frames start**, i-frames cover frames ~6–18 (0.17–0.60 s), and recovery runs to ~0.87 s. This sits between the "1–2 startup frames" comment and the "~30% into the roll" forum claim (≈8 frames). Treat ±2 frames as the uncertainty.
- [DERIVED] **Heavy roll cycle ≈ 33 frames ≈ 1.1 s**, if the ~5-frame delay is the same as for light/medium (5 + 12 + 16). Not directly sourced.
- [DERIVED] **Distance in body heights:** taking the 3–3.5 m figure at face value (load unknown) and a 1.72 m character, a roll covers ≈ **1.7–2.0 body heights**. Low confidence.
- For a 2D prototype, the core numbers are: roll ≈ 0.87 s total, invulnerable ≈ 0.17–0.60 s, actionable again ≈ 0.87 s (light/medium). Heavy: ≈ 1.1 s total, shorter travel, 1 fewer i-frame.

### Gaps
- No data-mined (TAE/param) roll values were reachable, and the Fextralife "Delay" column for each tier did not come through in extracts. Heavy-roll startup is therefore unconfirmed.
- No reliable per-tier roll distance in metres, and no measured light-vs-medium distance ratio.
- No source found stating the base roll frame data changed in any patch from 1.02 to the current (late 2026) version. I could not verify the full notes for 1.12, 1.14, 1.15 or later directly (official Bandai Namco pages not fetched). Treat "unchanged" as likely but unconfirmed.
- The light vs medium i-frame/recovery equality (Fextralife) conflicts with forum claims and one guide. A frame-by-frame capture would settle it.

## Q2. Acting out of a roll (attack, roll again, heal); roll attacks

### Takeaway
After a light/medium roll's i-frames end, it takes **8 frames (~0.27 s) at 30 fps before you can roll again**, and 16 frames (~0.53 s) for a heavy roll. A heal can be queued near the end of a dodge. I found no sourced frame data for when attacks become available, or for roll-attack startup.

### Cited Findings
- **Recovery definition:** "Recovery" is frames after the i-frames end before "you're able to roll again". Light/medium = 8, heavy = 16 (30 fps) — [Fextralife: Dodging](https://eldenring.wiki.fextralife.com/Dodging); [Fextralife: Equip Load](https://eldenring.wiki.fextralife.com/Equip_Load) [WIKI-CM]
- **Queued heals:** "You can queue up a heal action near the end of certain other animations, like dodging" — reported in [TheGamer on Zullie's analysis](https://www.thegamer.com/elden-ring-enemies-attack-before-use-healing-flask/) / [GamesRadar](https://www.gamesradar.com/heres-why-elden-ring-enemies-stab-you-every-time-you-try-to-heal/) [3P]
- **Roll-cancels from skills:** patch 1.04 added roll-cancel windows to many weapon skills, so you can roll out of those attack animations — [GamerGuides 1.04](https://www.gamerguides.com/elden-ring/guide/gameplay/patch-notes/elden-ring-patch-1-04-all-nerfs-buffs-and-bug-fixes) [OFFICIAL, reprinted]

### Inferences
- Elden Ring, like earlier Souls games, has a dedicated "rolling attack" (pressing light attack out of a roll). Its startup could not be sourced in this session (see Gaps). In a prototype, the roll-to-attack window should likely open no later than the roll-again window (~0.87 s after input for light/medium), because "recovery" is defined against rolling again.

### Gaps
- No sourced frame data for: (a) the first frame an attack can be input out of a roll, (b) rolling-attack startup or active frames by weapon class, (c) the earliest heal-out-of-roll frame. Fextralife weapon pages and the community "Elden Ring frame data" spreadsheets would have these, but they were unreachable (Fextralife and Google Docs blocked).

## Q3. Backstep / backhop and Quickstep

### Takeaway
With no directional input, the dodge button gives a backstep. In Elden Ring it has **no i-frames by default** but recovers faster than a roll: **~12 / 10 / 21 recovery frames (light / medium / heavy) = 0.40 / 0.33 / 0.70 s at 30 fps**. The Crucible Feather talismans gave backsteps **7 i-frames (8 with weapon over the shoulder)** before patch 1.13 cut that window (historical). The Quickstep Ash of War gives **15 i-frames (0.50 s)** on first use and 13 (14 at light load) on chained uses.

### Cited Findings
- **Load affects backsteps:** load governs roll and backstep performance — [Fextralife: Equip Load](https://eldenring.wiki.fextralife.com/Equip_Load) [WIKI-CM]
- **No base i-frames:** "Backsteps have no i-frames by default, but recover faster than rolls" — [Fextralife: Talisman of All Crucibles](https://eldenring.wiki.fextralife.com/Talisman_of_All_Crucibles) / [Fine Crucible Feather Talisman](https://eldenring.wiki.fextralife.com/Fine_Crucible_Feather_Talisman) (search extract) [WIKI-CM]
- **Backstep recovery by load (30 fps):** Light 12, Medium 10, Heavy 21 frames — same Fextralife talisman pages [WIKI-CM]. **Note:** medium recovering faster than light is odd and could not be cross-checked against the Equip Load page's medium row.
- **Talisman-boosted backstep:** Crucible talismans add "7 Immunity frames, or 8 with weapons held over the shoulder" (historical/pre-1.13). The Feather talisman raises damage taken by 15%, Talisman of All Crucibles by 45% — [Fextralife: Fine Crucible Feather Talisman](https://eldenring.wiki.fextralife.com/Fine_Crucible_Feather_Talisman); [Maxroll 1.13](https://maxroll.gg/elden-ring/news/elden-ring-patch-notes-version-1-13) [WIKI-CM / OFFICIAL]
- **Patch 1.13 (Sept 2024):** "Decreased the backstep invulnerability window" with those talismans. New frame count not published — [Maxroll 1.13](https://maxroll.gg/elden-ring/news/elden-ring-patch-notes-version-1-13); [Sportskeeda 1.13](https://www.sportskeeda.com/esports/elden-ring-patch-1-13-official-notes-major-buffs-weapons-ashes-war-spells) [OFFICIAL]
- **Quickstep:** "15 invulnerability frames" (30 fps) for a single use, dropping to "13 i-frames (14 with light Equip Load)" on repeated uses — [Fextralife: Quickstep](https://eldenring.wiki.fextralife.com/Quickstep) [WIKI-CM]

### Inferences
- [DERIVED] Backstep recovery in seconds: light 0.40 s, medium 0.33 s, heavy 0.70 s. The backstep is a short, vulnerable spacing tool, not an invulnerable dodge (unless talismans are equipped).
- [DERIVED] Quickstep: 0.50 s invulnerability on first use, 0.43 s (0.47 s light load) on chained uses. That is longer than a normal roll's 0.43 s.

### Gaps
- Backstep total duration, distance and startup frames were not found. Post-1.13 talisman backstep i-frame counts are unknown.
- Quickstep recovery and distance were not found. Bloodhound's Step data surfaced in search but its numbers did not come through.

## Q4. Walking, running and sprinting speeds; sprint stamina; turning; lock-on strafing

### Takeaway
**I found no sourced metres-per-second values** for on-foot walk, run or sprint. What is sourced: sprinting **costs no stamina outside combat but drains it in combat**, overloaded characters can only slow-walk, and Torrent's walk roughly equals the player's run. The character is about **1.70–1.75 m** tall, a fan estimate.

### Cited Findings
- **Character height:** Zullie the Witch's measurements put FromSoftware protagonists before Nightreign at "roughly 1.7 metres, or 5 foot 7 inches". Playable characters vary somewhat in height but share one player model, and height does not affect movement actions like running or jumping — [Yahoo, reporting Zullie](https://www.yahoo.com/lifestyle/articles/surprised-delighted-learn-every-fromsoft-130000863.html) [3P, measured by a well-known data-miner]
- **Second height estimate:** a fan pixel estimate scaled against Blaidd (taken as 2.63 m) gives ≈1.75 m — [VS Battles blog](https://vsbattles.fandom.com/wiki/User_blog:ArbitraryNumbers/Elden_Ring:_Tarnished's_Height) [ANEC/EST]
- **Sprint stamina:** sprinting in the open world, out of combat, does not deplete stamina. In combat it does. At zero stamina the character slows to a walk with a short period of delayed stamina regeneration — [GamingRebellion](https://gamingrebellion.com/game-guides/elden-ring/how-to-sprint-in-elden-ring/); [NintendoSmash](https://nintendosmash.com/elden-ring-sprinting/) [3P]
- **Stamina regeneration:** a secondhand wiki test quoted on Steam: regen from 0 to 192 stamina took **4.17 s without** the turtle talisman and **3.30 s with** it. The talismans themselves are listed as +8/s (Green Turtle) and +10/s (Two-Headed Turtle) — [Steam discussion](https://steamcommunity.com/app/1245620/discussions/0/4406291873006594116); [Fextralife: Endurance](https://eldenring.wiki.fextralife.com/Endurance) [ANEC/WIKI]
- **Torrent:** Torrent's walking speed is "about as fast as your running speed on foot", and repeatedly dashing doubles his speed again — [Fextralife: Torrent](https://eldenring.wiki.fextralife.com/Torrent_(Spirit_Steed)) [WIKI-CM]
- **Overload:** at full capacity you cannot sprint or roll and are restricted to a slow walk — [gamertagmythras](https://gamertagmythras.com/blog/elden-ring/elden-ring-equip-load-guide) (via search extract) [3P]
- **Mod multipliers (not vanilla units):** mod pages describe multipliers ("by default, only sprinting is 50% faster"; Torrent speed "set to 1.5"). These almost certainly describe the mods' default settings, not vanilla ratios — [Nexus: Simple Adjustable Movement Speed](https://www.nexusmods.com/eldenring/mods/8408); [Nexus: Surge Sprint Speed](https://www.nexusmods.com/eldenring/mods/9506) [not usable as vanilla data]

### Inferences
- [DERIVED] Base stamina regen ≈ **192 / 4.17 ≈ 46 stamina/s** (and ≈58/s with the talisman, which is consistent with the talisman adding about 8–10/s plus rounding). This rests on a secondhand figure. Note that stamina regen in Souls games usually has a short delay after an action before refill starts, which would make the true steady-state rate somewhat higher.
- For body-height conversion: 1 body height ≈ 1.72 m. Any m/s figure the writer obtains elsewhere should be divided by ~1.7 to get body heights per second.

### Gaps
- **No m/s figures for walk, run, sprint, lock-on strafe or walk-while-healing were found.** No source covered turning rate (deg/s) or lock-on strafing speeds. These would need data-mined values (e.g. player animation root-motion in Smithbox/DSAnimStudio) or video measurement against known map distances. Neither was possible here.
- No sourced value for sprint stamina drain per second in combat.

## Q5. Jumping

### Takeaway
A jump gives **partial (lower-body) invulnerability for roughly 25 frames (~0.83 s) at 30 fps**. It reliably clears low sweeps and ground shockwaves, but overhead or vertical attacks still hit the upper body. It is not a full i-frame dodge.

### Cited Findings
- **Jump invulnerability:** partial protection covering the jump animation, about **25 frames at 30 FPS** — [Fextralife: Dodging](https://eldenring.wiki.fextralife.com/Dodging) (via search extract) [WIKI-CM]
- **Lower body only:** the lower body stops registering hits, while overhead attacks can still hit the upper body — [Steam: Jump I-frames](https://steamcommunity.com/app/1245620/discussions/0/3458220484825047715/) [ANEC]
- **Low sweeps:** jumping avoids low horizontal sweeps and ground shockwave AoEs — [MMOSO](https://www.mmoso.com/news/mastering-invincibility-frames-mechanic-in-elden-ring). A sweep is "reliably avoided by jumping", though some sweep-looking attacks still hit — [GameFAQs](https://gamefaqs.gamespot.com/boards/323053-elden-ring/80057613?page=1) [3P/ANEC]
- **Mechanism:** a modder-driven thread claims the hurtbox shifts upward during a jump, with some sub-volumes disabled. This is community interpretation, not developer documentation — [Steam discussion](https://steamcommunity.com/app/1245620/discussions/0/3279192886584619380) [ANEC]

### Inferences
- For a 2D prototype: jumping ≈ 0.83 s of "low-hit immunity" (shrink or disable the lower hurtbox) rather than full invulnerability.

### Gaps
- No sourced numbers for total jump airtime, jump height or distance, or jump-attack startup and landing recovery.

## Q6. Healing (Flask of Crimson Tears)

### Takeaway
One flask restores a **flat amount: 250 HP at +0, 670 HP at +6 and 810 HP at +12**. That can be raised 20% (Crimson Seed), 30% (Crimson Seed +1) or 10% (Crimson Tear Scarab). Charges are capped at **14, shared** with the Cerulean (FP) flask. Enemies react to the *start* of the drink animation. **I found no frame data** for heal timing, walk speed while drinking, or whether an interrupted drink consumes the charge.

### Cited Findings
- **Heal amounts:** one charge restores 250 HP at +0 and 810 HP at +12 — [Fextralife: Flask of Crimson Tears](https://eldenring.wiki.fextralife.com/Flask_of_Crimson_Tears); [GamerGuides SotE database](https://www.gamerguides.com/elden-ring-shadow-of-the-erdtree/database/tools/flask/flask-of-crimson-tears) [WIKI-CM]. A +6 flask heals 670 HP — [Fextralife](https://eldenring.wiki.fextralife.com/Flask_of_Crimson_Tears) [WIKI-CM]
- **Upgrades:** Sacred Tears raise flask potency one level at a time at a Site of Grace, up to +12 — [Fextralife](https://eldenring.wiki.fextralife.com/Flask_of_Crimson_Tears) [WIKI-CM]
- **Modifiers:** Crimson Seed Talisman "Boosts HP restoration from the Flask of Crimson Tears by 20%", and 30% for the +1 version. Crimson Tear Scarab +10% HP restored, at the cost of taking more damage — [Fextralife: Crimson Seed Talisman](https://eldenring.wiki.fextralife.com/Crimson_Seed_Talisman) [WIKI-CM]
- **Charges:** Golden Seeds add charges, up to 14 total shared with the Flask of Cerulean Tears — [Fextralife](https://eldenring.wiki.fextralife.com/Flask_of_Crimson_Tears) [WIKI-CM]
- **Enemy reactions:** Zullie the Witch argues that enemies react to the start of the heal animation ("as soon as your character starts reaching behind their back for the flask"), not to the heal itself. She calls it partly "conjecture" — [GamesRadar](https://www.gamesradar.com/heres-why-elden-ring-enemies-stab-you-every-time-you-try-to-heal/); [TheGamer](https://www.thegamer.com/elden-ring-enemies-attack-before-use-healing-flask/) [3P, data-miner analysis]
- **Queued heals:** a heal can be queued near the end of animations like dodging — [TheGamer](https://www.thegamer.com/elden-ring-enemies-attack-before-use-healing-flask/) [3P]

### Inferences
- [DERIVED] The flask scales steeply early and flattens late: +0→+6 adds 420 HP (+168%), +6→+12 adds only 140 HP (+21%).
- Healing is a flat HP amount, not a percentage. So the share of max HP restored depends on the Vigor build (see Gaps for HP totals). For a prototype, a single +12 flask is roughly "a large chunk but not all" of an endgame HP bar.

### Gaps
- **Not found in any source reached:** total drink animation duration, the frame HP is applied, walking speed while drinking, whether an interrupted drink consumes the charge, and whether healing is instant or applied over time.
- HP-vs-Vigor values were not retrieved, so "% of max HP" cannot be sourced here. Unverified recollection, for the writer to check before use: endgame HP is roughly 1,450 at 40 Vigor, ~1,900 at 60 and ~2,100 at 99, which would make a +12 flask ≈ 40–55% of max HP.
- Starting flask count and the typical crimson/cerulean split were not sourced. The 14-charge cap is sourced.

## Q7. Hit reactions: flinch/stagger vs poise, knockdown, ground time, wake-up i-frames, i-frames after being hit

### Takeaway
The player's displayed Poise works as a hidden "toughness" pool (≈1/10 of the displayed number). An incoming hit only causes hitstun once it exceeds the remaining pool. Poise resets fully rather than regenerating gradually (one guide says after **30 s** without being hit). Hyper-armor during attacks multiplies effective poise. **No frame data was found** for flinch/stagger/knockdown durations or wake-up i-frames. Community accounts say the player is mostly invulnerable while knocked down until able to act, cannot roll while flat on the ground, and can roll once the stand-up animation starts.

### Cited Findings
- **Poise as toughness:** player poise "Determines a player's Toughness value", roughly a tenth of the displayed stat. An attack must exceed remaining poise before hitstun applies. NPC hitstun is governed by a separate effect mapping hit damage levels to stagger types, and is not affected by poise — [Fextralife: Poise](https://eldenring.wiki.fextralife.com/Poise) [WIKI-CM]
- **Hyper-armor:** poise temporarily rises during specific attack frames, and heavier weapons such as colossal swords get more of it ("hyper-armor multiplies effective Poise based on the weapon's innate resilience") — [Fextralife: Poise](https://eldenring.wiki.fextralife.com/Poise); [EpicDope](https://www.epicdope.com/what-is-poise-and-how-to-increase-it-in-elden-ring/) [WIKI-CM/3P]
- **Poise reset:** poise does not regenerate gradually. One guide says it fully resets after 30 seconds without taking a hit, and another describes an instant reset on stagger — [Elden Ring Fans poise explainer](https://www.eldenringfans.com/articles/elden-ring-poise-explained-how-to-avoid-getting-staggered-in-2026.html); [gameoffers / Press Start](https://gameoffers.org/elden-ring-poise-and-stagger-system-explained-how-it-works/) (search extract did not say which guide said which) [3P]
- **Enemy stance:** enemies have a separate hidden stance meter that regenerates after a pause of about 6–15 s depending on the enemy, per forum claims — [gamertagmythras stance guide](https://gamertagmythras.com/blog/elden-ring/elden-ring-stance-break-guide); Steam threads [ANEC]
- **Knockdown invulnerability:** knockdowns give invincibility "until you can act", though some attacks still connect. Bigger enemies can smash you while prone if you don't roll to recover — [GameFAQs: OTG](https://gamefaqs.gamespot.com/boards/265987-elden-ring/79949790) [ANEC]. Certain hits give i-frames while getting up, and combo attacks are usually the ones that hit twice — [GameFAQs](https://gamefaqs.gamespot.com/boards/265987-elden-ring/79967392) [ANEC]
- **Rolling out of a knockdown:** you can't roll while flat on the ground (during the down i-frames). Rolling works once the character starts the stand-up animation — [Steam: input buffering](https://steamcommunity.com/app/1245620/discussions/0/3183488149023495553/) [ANEC]. Another post says players lose i-frames once they start to get up, while enemies have i-frames both while down and on wake-up — [Steam](https://steamcommunity.com/app/1245620/discussions/0/3183486955461523688) (search extract; exact thread uncertain) [ANEC, conflicting]
- **Buffered rolls during hitstun:** a roll pressed a few frames after being hit can be stored and executed on recovery, because hitstun on some attacks is shorter than the buffer — [Steam: input buffering](https://steamcommunity.com/app/1245620/discussions/0/3183488149023495553/) [ANEC]

### Inferences
- Getting up is a vulnerable moment: invulnerable while flat, with (by most accounts) a roll available from the start of the stand-up. A prototype could model "down" as invulnerable, then "rising" as partially vulnerable with the roll cancel available.
- No source mentions general post-hit invulnerability (mercy i-frames) for the player. Most reports of being "combo'd" suggest normal flinches carry no i-frames, but this is unconfirmed.

### Gaps
- **No frame data** for: light flinch duration, stagger duration, knockdown/launch ground time, wake-up i-frame count, or roll-out-of-knockdown timing. No source quantified "hit strength vs poise" categories (small/medium/large/knockdown) in frames.
- Whether the player gets any post-hit i-frames is not confirmed by any source reached.

## Q8. Input buffering

### Takeaway
Elden Ring **buffers** dodge and attack inputs pressed during another animation (attack, hitstun, roll) and runs them when that animation allows. The dodge triggers on **button release** (the button is shared with sprint), which adds an estimated 1–4 frames. **No source gave the buffer window length in frames.**

### Cited Findings
- **Roll on release:** the dodge roll "occurs when you release the B button not when you press it", estimated to add "1-4 frames of input lag on top of render lag" — [Nexus Mods: roll-on-press mod](https://www.nexusmods.com/eldenring/mods/101) [ANEC, modder estimate]
- **Why it buffers:** the dodge button is also used for sprinting, so the input is buffered and "the roll is never going to be instantaneous" — [Steam discussion](https://steamcommunity.com/app/1245620/discussions/0/3183486320473496446) [ANEC]
- **Queued presses:** the game saves a button press during another action and executes it afterwards. Rolls pressed during hitstun fire after recovery — [Steam: input buffering](https://steamcommunity.com/app/1245620/discussions/0/3183488149023495553/); [Steam: Egregious input buffer / Roll on button release](https://steamcommunity.com/app/1245620/discussions/0/3183486320471863024/); [ResetEra thread](https://www.resetera.com/threads/the-input-buffer-in-elden-ring-is-the-worst-ive-ever-experienced.564406/) [ANEC]
- **Punishes panic rolls:** roll-catch timing punishes panic rolls and queued inputs, so a late-pressed roll can resolve after a hit at the wrong moment — Steam thread surfaced in search ([e.g.](https://steamcommunity.com/app/1245620/discussions/0/3177859358957418375/?ctp=2)) [ANEC]
- **Reported delay:** players reported a dodge input delay of "around half a second" (player reports, not measurements, 2022) — [PiunikaWeb](https://piunikaweb.com/2022/03/10/elden-ring-dodge-roll-button-input-delay-or-lag-reported-by-many) [ANEC, low confidence]

### Inferences
- For a prototype: (1) trigger the dodge on release, or on press if dodge and sprint are on separate keys, and (2) keep a buffer that stores the most recent dodge/attack input during locked animations and replays it at the first cancelable frame. The buffer length is unsourced. A commonly used design value is ~0.2–0.33 s, but that is not Elden Ring data.

### Gaps
- **No sourced frame count for the input buffer window.** The specific "10 frames" claim was searched for and **not** confirmed by any source. The most likely sources would be the "Elden Ring PvP Lexicon" Google Doc and TAE (animation event) data-mines, both unreachable here.
