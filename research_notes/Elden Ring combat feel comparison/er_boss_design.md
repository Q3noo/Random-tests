# Elden Ring Melee Boss Design and Attack Timing (incl. Shadow of the Erdtree)

> **How these notes were made.** Full-page fetches were blocked in this session: eldenring.wiki.gg, pcgamer.com and automaton-media.com all failed DNS resolution, so I stopped trying other sites. Every finding below comes from web-search result summaries and snippets, not from full-page reads. The wording of quotes and their attribution to a specific URL are therefore less certain than usual, and the most important numbers should be re-checked against Fextralife or wiki.gg pages, or against Zullie the Witch datamines, before they are used in a design.
>
> **Confidence tags:** **[High]** means several independent sources agree, or the source is a primary or wiki source. **[Med]** means one reputable outlet or wiki, or community sources that agree with each other. **[Low]** means a single fan guide or forum post, or sources that conflict, or what may be SEO-style content. I found no developer-published frame data.

## 1. Telegraphs, windup (anticipation) durations, and how "delayed attacks" work

### Takeaway
Elden Ring's signature melee telegraph is the long, readable windup that sometimes holds at the apex (a weapon raised, or a body hanging in the air) for about 1.5–2 s before a fast strike. The few seconds-level figures I found come from fan guides. Community consensus is that the delays are fixed per animation rather than random. Their purpose is to punish "panic rolls" timed to the start of the windup, which is the habit Dark Souls 3 trained into players.

### Cited Findings
- **Margit, staff+hammer one-two.** He "wind[s] up his hammer and staff for a second and a half or so," then swings both "in quick succession." The staff hit is "deviously fast" and needs precise timing; "if the first attack hits, the second will as well." **[Low–Med: single fan guide, approximate]** — [GameSkinny](https://www.gameskinny.com/tips/elden-ring-boss-guide-how-to-beat-margit-the-fell-omen/)
- **Margit, three-hit staff/hammer string.** Two staff sweeps are followed by a vertical hammer strike; "the third strike will have a delay of 2 seconds before impact." **[Low: single guide estimate]** — [VGKAMI](https://vgkami.com/elden-ring-how-to-beat-margit-the-fell-omen/)
- **Counter-advice for delayed finishers:** roll when the attack visibly commits, not at the start of the windup. "If you roll early, your invincibility frames end and the hit lands at the exact moment your roll finishes." **[Med: consistent with most community advice]** — [Boostroom](https://boostroom.com/blog/boss-guide-margit-the-fell-omen-easy-strategy-for-any-build)
- **Delays are deterministic, not random.** A GameFAQs poster argues that "all of his attacks have specific frame data for start up frames and active frames." On this view the long windups are fixed animation data built to punish early rolls, not random holds. **[Low–Med: forum; matches how the engine's animation-driven attacks generally work]** — [GameFAQs](https://gamefaqs.gamespot.com/boards/265987-elden-ring/79960604?page=31)
- **Malenia, Waterfowl Dance (the "airborne hold" telegraph).** She "will leap up into the air and hover for a couple of seconds before the onslaught begins." The attack runs as three flurries. The first is an in-place spin whose "timing is slightly slower than the second flurry, so if you roll too early, you'll get hit on recovery." The timing also changes with distance at the moment she jumps ("close range is much harder"). **[Low–Med: guides; no frame count found]** — [GamingTipHub](https://www.gamingtiphub.com/elden-ring/malenia-waterfowl-dance-dodge-timing-elden-ring/); [Game Rant](https://gamerant.com/elden-ring-dodge-malenia-waterfowl-dance-attack/); [TechBloat](https://www.techbloat.com/how-to-dodge-malenia-waterfowl-dance.html)
- **The dodge for Waterfowl depends on the player's roll stats.** A widely shared method (roll back immediately, then roll back again for the penultimate strike) "is only viable with a Light Load" (under 30% equip load), because load "changes how many frames the player is invincible for as well as how far they can travel." **[Med]** — [Game Rant](https://gamerant.com/elden-ring-dodge-malenia-waterfowl-dance-attack/)
- **Hanging in the air is a defining Elden Ring telegraph.** A ResetEra poster said they died to Iudex Gundyr (DS3) after Elden Ring "because they forgot that before Elden, not every boss floated at the peak of their jumps for a second." **[Low: anecdote, but illustrative]** — [ResetEra](https://www.resetera.com/threads/after-150-hours-i-think-that-elden-ring-has-the-worst-bosses-of-any-soulsborne.564490/page-14)
- **The delayed attack became a meme at launch.** Automaton (March 2022) reported that the topic became a meme of bosses "trying to bait out punishable moves." Many players believed the increase was inspired by DS3's Nameless King, and Starscourge Radahn was cited as a hard example combining "delayed attacks, high attack power, and extensive range." **[Med: press, pre-DLC]** — [Automaton Media](https://automaton-media.com/en/news/20220316-10577/)
- **Defense of the telegraphs:** enemies "have movements beforehand that act as a tell, such as large windups or flashy effects." **[Low: forum]** — [Steam discussion](https://steamcommunity.com/app/1245620/discussions/0/4337599680247222437). A Tomb Raider: Legacy of Atlantis boss-fight lead cited Elden Ring as a "stellar example" of making boss fights fair through clear telegraphs. **[Med: developer quote via press]** — [GamesRadar](https://www.gamesradar.com/games/action-rpg/tomb-raider-legacy-of-atlantis-boss-fight-lead-points-to-elden-ring-as-a-stellar-example-of-how-to-make-sure-theyre-fair/)

### Inferences
- In practice a "delayed attack" is (a) a long, exaggerated anticipation pose, (b) held at the apex for longer than the player's trained reaction expects (about 1–2 s by guide estimates), then (c) a very fast active phase. The fast active phase is what makes the hold dangerous: once the swing starts, there is no time to react, so the player must time the roll to the commit cue rather than the start cue.
- Many of these attacks are fixed per animation. The "variable" feel comes from the mix: the same boss has a fast version and a delayed version of a similar-looking windup, and it chains them in combos. The variance is between attacks, not within one attack. For a 2D prototype, one option is a delayed variant that shares its first few frames with a normal attack and then extends the hold. This is a design suggestion, not a sourced claim.
- Because the right dodge timing depends on roll i-frames (and in ER on equip load), a delayed attack tests the player's i-frame window. A prototype should set the hold-plus-active timing against its own roll i-frame length.

### Gaps
- No frame-accurate (60 fps) windup or active-frame data for any named boss was retrievable. Frame-data resources and the Fextralife or wiki.gg move lists could not be fetched.
- I found no timings for Godrick, Morgott, Maliketh, Godfrey/Hoarah Loux or Messmer windups specifically.
- I found no FromSoftware statement on the design intent behind delayed attacks; Automaton noted the same.

## 2. Tracking: rotation during windups and swings, and its effect on dodge timing and direction

### Takeaway
Players widely see Elden Ring bosses as tracking hard during windups, and on some attacks into the swing itself. This shifts the burden from "dodge sideways at any time" to "dodge at the right moment," usually into or across the attack, with positioning mattering more than in earlier games. I found no measured turn-rate data. All the evidence is community observation.

### Cited Findings
- **Margit's delayed attacks are cited as also tracking.** One Steam user said "the tracking of all the enemies is bonkers," which made rolling feel less useful. **[Low: forum opinion]** — [Steam discussions](https://steamcommunity.com/app/1245620/discussions/0/3729575504108842499/?l=danish); [Steam discussions](https://steamcommunity.com/app/1245620/discussions/0/3719440044270966891)
- **Attack and movement "compositions" are read as designed to "catch" the player** rather than obstruct them, which the poster saw as a departure from Dark Souls. **[Low: forum]** — [Steam discussion](https://steamcommunity.com/app/1245620/discussions/0/3801650156483407969)
- **Delay timings are described as "intended to catch a misroll and punish you, ideally repeatedly."** **[Low: forum]** — [Steam discussion](https://steamcommunity.com/app/1245620/discussions/0/3183487594854402163)
- **Position matters more in Elden Ring than in earlier games,** and this is "a common source of confusion." **[Low: forum summary]** — [Steam discussion](https://steamcommunity.com/app/1245620/discussions/0/5706632550006617965)
- **Waterfowl Dance shows distance-dependent tracking and the counter-strategies.** Guides advise shifting left during the hover "to see her back," or rolling toward her to make the attack overshoot. The timing "changes slightly based on your distance when she jumps." **[Low–Med]** — [GamingTipHub](https://www.gamingtiphub.com/elden-ring/malenia-waterfowl-dance-dodge-timing-elden-ring/); [TechBloat](https://www.techbloat.com/how-to-dodge-malenia-waterfowl-dance.html)

### Inferences
- Strong tracking during the hold, combined with a fast commit, is what makes the delay lethal. The player cannot pre-position out of the arc, so the only answer is an i-frame roll at the commit moment. Rolling toward or through the boss, or to the boss's off-hand side, is common advice because tracking usually stops (or turn speed drops) once the active frames begin.
- A 2D side-view prototype only has left and right facing, so "tracking" becomes (a) when the boss locks its facing or target X position (for example, a leap aimed at the player's X at the apex), and (b) whether the boss can turn around mid-windup if the player crosses under it. One way to reproduce ER's feel is to keep re-aiming through the hold and lock at the commit frame. This is a suggestion, not sourced.

### Gaps
- I found no datamined turn speeds and no description of when tracking locks for any specific attack. Zullie the Witch or a frame-analysis video may cover this but could not be reached.
- I found no source quantifying how much ER tracking differs from DS3 or Sekiro tracking.

## 3. Punish windows, recovery after big attacks, combo length, and differences from Dark Souls 3

### Takeaway
I found no measured recovery-frame numbers. Qualitatively, players report that Elden Ring, and even more Shadow of the Erdtree, bosses run longer combos with fewer obvious openings than DS3. Defenders note that openings still mostly come during recovery animations, but the player has to bait specific attacks to get them.

### Cited Findings
- **The DS3 vs ER mental model.** In DS3, "delayed attacks were mainly used as a way to test a player's dodge timing." In ER, "most openings still take place during a boss's recovery animation, it's just that players have to actively bait out those attacks." The post's title argues players are "forcing the Dark Souls III playstyle" onto ER. **[Low–Med: popular Reddit post]** — [r/Eldenring (mirror)](https://lr.mint.lgbt/r/Eldenring/comments/wrpx9v/the_bosses_arent_badly_designed_players_are_just/)
- **You can attack during combos "if you know the openings."** **[Low: forum]** — [Steam discussion](https://steamcommunity.com/app/1245620/discussions/0/3758852682826102941)
- **Delayed attacks have increased with each game.** One Steam user argued their number grew with each game from Dark Souls 1 to Elden Ring. Another said more ER bosses have more delayed attacks than regular ones, and that the DLC continues the trend. **[Low: opinion]** — [Steam discussion](https://steamcommunity.com/app/1245620/discussions/0/4343240481094127820); [Steam discussion](https://steamcommunity.com/app/1245620/discussions/0/4337599680247222437)
- **Shadow of the Erdtree combos.** A blog argues the DLC bosses are overtuned, with combo strings that "seem endless" and small punish windows. A Steam poster says Rellana, Messmer and Bayle have rapid combos with little recovery and hard-to-read patterns. A GameFAQs post adds that the combos are long enough to drain the stamina used for dodging or blocking, so players get hit anyway. **[Low: opinion]** — [canbuyornot Substack](https://canbuyornot.substack.com/p/fromsoftwares-balancing-act); [Steam discussion](https://steamcommunity.com/app/1245620/discussions/0/4343240316586839479/); [GameFAQs](https://gamefaqs.gamespot.com/boards/398082-elden-ring-shadow-of-the-erdtree/80799597)
- **Rellana is read as built to force parries,** since dodging is unreliable and blocking stops working in her second phase. **[Low: single forum post]** — [Steam discussion](https://steamcommunity.com/app/1245620/discussions/0/4343240316586839479/)
- **ER's systems are framed as encouraging greed.** The PC Gamer article title is "Elden Ring's mechanics encourage greed on a whole new level." I could see the title only, not the content. **[Low: title only]** — [PC Gamer](https://pcgamer.com/elden-rings-mechanics-encourage-greed-on-a-whole-new-level)

### Inferences
- ER's structure appears to be: a long combo with mixed timing (fast and delayed), then one clear "big finisher" (slam, leap or grab) with an extended recovery. That finisher is the main punish window. Mid-combo openings exist but are boss-specific knowledge. For a 2D prototype, the knobs are the length of the combo before a guaranteed window and how long the recovery after the finisher lasts.
- In ER the player also has jump attacks and charged attacks (see section 5). These need a recovery window long enough for a charged heavy or jump attack, which pushes designers toward longer recoveries after finishers and a few short windows elsewhere. This is my inference; I found no source stating it.

### Gaps
- I found no recovery-frame or second-level punish-window numbers for any boss, and no measured combo-length statistics comparing DS3 and ER.
- I found no Messmer-specific analysis beyond the forum mentions above.

## 4. Input reading: do bosses react to heal or attack inputs?

### Takeaway
Yes, bosses react, but according to Zullie the Witch's datamining, the trigger is the player's in-game animation (for example, the flask-drink animation starting), not the raw button press. Because the reaction is instant and backed by fast "punish" attacks, it feels like input reading, and players still complain about it, especially in the DLC.

### Cited Findings
- **The AI watches animations, not inputs.** A dataminer and Souls YouTuber Zullie the Witch showed that "enemy AI is keyed to watch for the in-game animation of your moves," not controller input. PC Gamer explains "why enemies smack you when you reach for a potion." **[Med–High: datamine reported by multiple outlets]** — [PC Gamer](https://www.pcgamer.com/elden-ring-dataminer-explains-why-enemies-smack-you-when-you-reach-for-a-potion); [GamesRadar](https://gamesradar.com/heres-why-elden-ring-enemies-stab-you-every-time-you-try-to-heal); [Mein-MMO](https://mein-mmo.de/en/elden-ring-one-of-the-most-unfair-mechanics-in-the-game-works-differently-than-you-thought,1103223)
- **The punish is deliberate.** GamePro's German headline says enemies attacking you immediately when healing is "pure intent" (*pure Absicht*). **[Med]** — [GamePro](https://www.gamepro.de/artikel/elden-ring-gegner-heilen-sofort,3383768.html)
- **This is not true input reading.** One article notes that with true input reading you would be punished even before you start to heal. Heals can also be queued near the end of other animations such as dodges, so a reaction can fire as soon as the heal animation begins. **[Med]** — [PC Gamer](https://www.pcgamer.com/elden-ring-dataminer-explains-why-enemies-smack-you-when-you-reach-for-a-potion); [GamesRadar](https://gamesradar.com/heres-why-elden-ring-enemies-stab-you-every-time-you-try-to-heal)
- **The estus flask is flagged.** A Steam thread describes a flagged estus/flask appearing in the arena (that is, the item becoming visible during the animation) as the trigger. **[Low]** — [Steam discussion](https://steamcommunity.com/app/1245620/discussions/0/4343240316593160796)
- **At least one boss has an attack tied to the healing flask.** GamesRadar's title reads: "This Elden Ring boss' most annoying attack is bound directly to your healing flask." I did not retrieve which boss. **[Med: title only]** — [GamesRadar](https://gamesradar.com/this-elden-ring-boss-most-annoying-attack-is-bound-directly-to-your-healing-flask)
- **Players say the distinction feels academic.** A Reddit commenter says bosses sometimes react whether or not an animation starts. In the DLC, they say, "there's an NPC boss with the most blatant input reading on dodges. It's kind of funny to watch them react before an attack is even visible." **[Low: single comment]** — [Reddit r/Games comment (mirror)](https://lr.in.psf.lt/r/Games/comments/1dotcok/elden_ring_calibration_update_1122/lad4dvq/?context=3)
- **Malenia's healing is a related but separate issue.** Malenia heals when her attacks connect, and Digital Trends covered a heal-on-hit bug separately. I did not retrieve the details. **[Low]** — [Digital Trends](https://digitaltrends.com/?p=3049734)

### Inferences
- Reacting to animation starts is "fair" in a technical sense: the player has committed to an observable action. It feels unfair because the boss's reaction (a dash, a thrown dagger, a gap closer) comes out faster than the heal animation finishes. For a 2D prototype: have the AI react to the start of the player's heal or attack state, give it a short reaction delay (a tuning value; I found no ER number), and keep the punish attack short enough to land before the heal resolves only when the player healed within a set threat range.

### Gaps
- I found no measured AI reaction latency (frames between the heal animation starting and the boss's reaction).
- I found no confirmed list of which bosses have heal-specific punish behaviours. The GamesRadar article's boss name was not retrieved.

## 5. Stance and posture: break threshold, stun duration, critical hit, and regeneration

### Takeaway
Bosses have a hidden stance meter, separate from the poise that governs flinching. Community figures put Margit and Morgott at about 80 stance and late bosses at about 120–160. Breaking it puts the boss into a kneeling stun, and a critical (riposte-style) hit can be landed from the front. The meter regenerates after several seconds without stance damage, some bosses can "cancel" a near-break with dodges or leaps, and stance damage taken is reportedly reduced when summons are present. Most of the numbers are low-confidence community figures that conflict with each other.

### Cited Findings
- **Stance is a hidden meter that builds with hits.** Breaking it opens a critical-hit window, and the boss recovers unless pressure continues ("his stance does regen, so you do need to keep up the pressure"). **[High: wiki, official guide, many forums]** — [Fextralife: Stance](https://eldenring.wiki.fextralife.com/Stance); [wiki.gg: Stance](https://eldenring.wiki.gg/wiki/Stance); [Steam discussion](https://steamcommunity.com/app/1245620/discussions/0/3758852249526224241)
- **Two systems run at once.** Non-player enemies "run both systems at once, a regular poise system that governs hitstun, and a separate stance system that governs the critical-hit opening." **[Med]** — [GamertagMythras guide](https://gamertagmythras.com/blog/elden-ring/elden-ring-stance-break-guide); [ProGameGuides](https://progameguides.com/elden-ring/how-poise-stance-breaking-and-super-armor-works-in-elden-ring/)
- **Charged attacks and jump attacks are the main stance-breaking tools.** "Charged attacks and the new jump attacks are great ways to break an enemy's stance," and some weapon arts are also effective. **[High: official intro and guides]** — [Bandai Namco combat guide](https://www.bandainamcoent.com/pt_br/news/elden-ring-introduction-part-4-combat-guide); [Windows Central](https://www.windowscentral.com/elden-ring-melee-combat-guide)
- **Boss stance values from community guides (conflicting):**
  - Margit 80, Morgott 80, Godfrey 120. The same guide lists Margit at 4,174 HP with "2 parries per break" and puts the Elden Beast at 150. **[Low]** — [GamertagMythras](https://gamertagmythras.com/blog/elden-ring/elden-ring-stance-break-guide)
  - Margit 80, Malenia 150, Elden Beast 160. **[Low]** — [Zosygo](https://www.zosygo.com/elden-ring/walkthroughs/stance-break-explained)
  - Another guide lists Margit, Morgott, Malenia and Maliketh all at 80, which contradicts Malenia at 150. **[Low]** — per search summary of [GamertagMythras](https://gamertagmythras.com/blog/elden-ring/elden-ring-stance-break-guide)/[Zosygo](https://www.zosygo.com/elden-ring/walkthroughs/stance-break-explained)
  - A forum post independently gives Margit "80 stance damage to be staggered/stance-broken." Margit at 80 is the most consistently reported figure. **[Med for Margit = 80]** — [Steam discussion](https://steamcommunity.com/app/1245620/discussions/0/3791506981621748154)
- **Regeneration and reset (conflicting community estimates):**
  - Recovery starts after a gap with no stance damage. Estimates of that gap are 6–15 s, 8–20 s "depending on the enemy," and about 6–8 s. **[Low: sources disagree]** — [GamertagMythras](https://gamertagmythras.com/blog/elden-ring/elden-ring-stance-break-guide); [Zosygo](https://www.zosygo.com/elden-ring/walkthroughs/stance-break-explained)
  - Estimates of the regen rate are about 13 stance per second and about 5–10 per second. **[Low: conflicting]** — same sources
  - The guides agree that any stance damage restarts the countdown ("even 1 point of stance damage restarts the countdown"). **[Low–Med]** — [Zosygo](https://www.zosygo.com/elden-ring/walkthroughs/stance-break-explained)
  - Players describe stance as decaying if stance damage is not built "fast enough." **[Low]** — [Steam discussion](https://steamcommunity.com/app/1245620/discussions/0/3758852249526224241); [Steam discussion](https://steamcommunity.com/app/1245620/discussions/0/4406291873011406509)
- **Parry and stance are independent.** "Parrying an enemy won't reset its stance damage meter, and stance-breaking an enemy won't reset its parry counter." **[Med: wiki snippet]** — [Fextralife: Stance](https://eldenring.wiki.fextralife.com/Stance); [Fextralife ES: About Stance-Breaking](https://eldenring-es.wiki.fextralife.com/About+Stance-Breaking)
- **Stance-break cancels.** "Many enemies have stance break cancelling moves, mostly their side step and back step maneuvers," and "Morgott's big back leaps work the same way." **[Med: wiki snippet]** — [Fextralife: Stance](https://eldenring.wiki.fextralife.com/Stance). For Malenia, "if she does her kick, jump, or side dash to hyperarmor through your attack, her stance meter will reset without a stance break occurring." **[Low: forum]** — [Steam discussion](https://steamcommunity.com/app/1245620/discussions/0/5706632550002709330)
- **Transitional animations block breaks.** There are "certain transitional animations during which you can't break their poise." One boss was reported to have higher-than-normal poise with an invisible meter that "recovers faster than normal." **[Low]** — [Steam: Poise break](https://steamcommunity.com/app/1245620/discussions/0/3729575042620520686/)
- **Summons reduce stance damage.** With a co-op phantom or NPC summon present, the boss reportedly takes 40% less stance damage. **[Low: single source]** — [GamertagMythras](https://gamertagmythras.com/blog/elden-ring/elden-ring-stance-break-guide)
- **Critical hit damage.** One guide says "a standard critical hit: 2.5x weapon damage"; daggers sit at the bottom of the stance table (18) and the top of the critical table (4x). It also says patch 1.10 raised critical damage and cut the recovery after a whiffed critical. **[Low: unverified guide, which the search tool itself flagged]** — [Zosygo](https://www.zosygo.com/elden-ring/walkthroughs/stance-break-explained)
- **Swapping weapons to maximize the critical.** Players pair a heavy stance-breaker with a high-critical dagger ("hammer alongside misericorde, i switch to dagger after i get a stance break"). **[Low]** — [Steam discussion](https://steamcommunity.com/app/1245620/discussions/0/3791506981621748154)
- **A combo can beat the critical.** Some players find a combo on a stance-broken boss beats the critical. A wiki says the highest-damage approach is to land as many attacks as possible during the stun, then riposte for the final hit. **[Med]** — [Fextralife ES: About Stance-Breaking](https://eldenring-es.wiki.fextralife.com/About+Stance-Breaking); [Steam discussion](https://steamcommunity.com/app/1245620/discussions/0/3758852249526224241)
- **The break threshold is hard to read.** The only way to gauge how close a boss is to breaking is by countering or evading its attacks immediately; there is no visible meter. **[Low]** — per search summary of [Fextralife: Stance](https://eldenring.wiki.fextralife.com/Stance)/[Steam](https://steamcommunity.com/app/1245620/discussions/0/4406291873011406509)

### Inferences
- Elden Ring stance works like Sekiro's posture, but hidden and without a deflect-centric economy. It rewards heavy, charged and jump attacks (the high-commitment tools) with an occasional big payoff. That rewards the player for using the very recovery windows the boss gives them.
- In a 2D prototype, a visible or semi-visible stance bar, a reset timer of a few seconds after the last stance hit, and boss "escape" moves (back-leaps that reset stance) would reproduce the ER loop. The specific values remain tuning work, because ER's own numbers are unverified.
- The kneeling stun lasts long enough to walk up and land a critical. Whether combo-then-critical fits in one stun suggests a window of roughly 2–3+ s, but this is not sourced; see Gaps.

### Gaps
- **Stun duration after a stance break:** I found no source giving seconds or frames.
- **The trigger for the critical on a broken boss** (from the front, near the head or weak point, in a specific window) was not retrieved from a primary source. It is widely known as the "riposte-style critical" but is not confirmed here.
- No datamined (Zullie or Paramdex) boss stance, regen-delay or regen-rate values could be accessed. All the numbers above come from possibly SEO-generated guides that conflict with each other.

## 6. Phase 2: HP threshold, transition, and moveset changes

### Takeaway
Most major melee bosses change phase at about 50–60% HP: Margit about 60%, Godrick about 50–60% (sources conflict), Morgott about 50%, Maliketh 50%, Godfrey 50%, Shadow of the Erdtree Radahn about 60%. Each transition plays a set-piece animation (a coughing fit, an arm graft, a reveal), adds an elemental or AoE layer (holy, bloodflame, a dragon head, destined death), and adds new or faster attacks. Malenia is the exception: she has two separate health bars.

### Cited Findings
- **Margit:** phase change "at 60 percent health." **[Low–Med: community guide]** — [TheGamer](https://www.thegamer.com/elden-ring-best-boss-second-phases/)
- **Godrick the Grafted:** one wiki says he chops off his own arm at about 60%. Push Square says the phase begins "at roughly 50 per cent," and Gamer Guides says "around half health." In phase 2 one arm is replaced with a dragon head; the phase is "very similar to his first, although he gets some new attacks as well." **[Med on the mechanic; Low on the exact %]** — [wiki.gg: Godrick](https://eldenring.wiki.gg/wiki/Godrick_the_Grafted); [Fextralife: Godrick](https://eldenring.wiki.fextralife.com/Godrick+the+Grafted); [Push Square](https://www.pushsquare.com/guides/elden-ring-how-to-beat-godrick-the-grafted); [Gamer Guides](https://gamerguides.com/elden-ring/guide/stormveil-castle/bosses/how-to-beat-elden-lord-godrick-the-grafted-in-stormveil-castle)
- **Morgott, the Omen King:** "at about 50% health, Morgott will fall to his knees and start to cough," which starts phase 2. Phase 2 adds geysers and bloodflame attacks, plus a rapid weapon change "only available when he's below 30% HP." **[Med]** — [GameSpot](https://Gamespot.com/articles/elden-ring-how-to-beat-morgott-the-omen-king/1100-6504046/); [Fextralife: Morgott](https://eldenring.wiki.fextralife.com/Morgott+The+Omen+King)
- **Maliketh, the Black Blade:** "at half health, the second phase begins, revealing Maliketh." **[Med–High: wiki]** — [Fextralife: Maliketh](https://eldenring.wiki.fextralife.com/Maliketh,_the_Black_Blade)
- **Godfrey, First Elden Lord:** at half health he is revealed as Hoarah Loux, Warrior. **[Med]** — [TheGamer](https://www.thegamer.com/elden-ring-best-boss-second-phases/); [GamesRadar Godfrey guide](https://gamesradar.com/elden-ring-godfrey-boss-fight-first-elden-lord-hoarah-loux-warrior)
- **Radahn (Shadow of the Erdtree, Promised Consort):** forum posts put the second phase at 60% HP, and one complains it "should start at 40% not 60%." The fight was criticized for visual clutter and hitboxes, and a 2024 patch reduced his power. **[Low–Med on 60%; Med on the patch]** — [Steam: phase 2](https://steamcommunity.com/app/1245620/discussions/0/4406291166505450989/); [Steam: phase transition](https://steamcommunity.com/app/1245620/discussions/0/4406292068722522429/); [Wikipedia: Starscourge Radahn](https://en.wikipedia.org/wiki/Starscourge_Radahn)
- **Malenia, Blade of Miquella:** phase 2 begins once her first health bar is depleted; the boss reveals a second bar. The Fextralife page summary contained the conflicting phrasing "heal 80% and enter phase 2." **[Med on the two-bar structure; the exact wording conflicts]** — [Fextralife: Malenia](https://eldenring.wiki.fextralife.com/Malenia_Blade_of_Miquella)
- **Messmer:** I found no result on his phase-2 threshold or changes.

### Inferences
- The transition is itself a pacing beat: a 50–60% trigger plus a cinematic or semi-interruptible animation gives the player a breather and a "heal now" moment. Phase 2 then layers AoE or elemental follow-ups onto the existing melee strings rather than replacing the moveset (Godrick, Morgott). For a 2D prototype, phase 2 can keep most phase-1 strings and append an AoE extension to finishers, which lengthens combos and shrinks punish windows. Players perceive that as "harder" without new animation work.

### Gaps
- I found no transition durations in seconds, no data on whether bosses are invulnerable during transitions, and no documented speed multipliers for phase 2.
- Messmer's phase 2 details were not found, and Godrick's exact % is unresolved (50% vs 60%).

## 7. Boss movement: approach, gap closers, keeping pressure, idle and back-off moments

### Takeaway
Little measured data was retrievable. What exists points to gap closers and leaps (Malenia's leap into Waterfowl, Morgott's back-leaps, Margit's delayed leaps) and dodge or back-step moves. Those moves also serve as defensive resets of the stance meter, and players see them as part of a "catch the player" movement design.

### Cited Findings
- **Back-steps and side-steps cancel stance breaks.** Many bosses have these; Morgott's "big back leaps" do the same. They double as spacing or reset moves. **[Med]** — [Fextralife: Stance](https://eldenring.wiki.fextralife.com/Stance)
- **Malenia's kick, jump and side dash** hyperarmor through player attacks and reset stance. **[Low]** — [Steam discussion](https://steamcommunity.com/app/1245620/discussions/0/5706632550002709330)
- **Attack and movement compositions are framed as designed to "catch" rather than obstruct** the player. **[Low]** — [Steam discussion](https://steamcommunity.com/app/1245620/discussions/0/3801650156483407969)
- **Waterfowl Dance is itself a gap-closer.** The leap and hover lead into flurries that travel, so its timing depends on distance at the moment of the jump. **[Low–Med]** — [GamingTipHub](https://www.gamingtiphub.com/elden-ring/malenia-waterfowl-dance-dodge-timing-elden-ring/)
- **Radahn's attacks are cited for "extensive range"** together with delays. **[Med]** — [Automaton Media](https://automaton-media.com/en/news/20220316-10577/)

### Inferences
- Pressure in ER appears to come from (a) gap closers that keep the player from resting at range, (b) reactive punishes on heals (section 4), and (c) evasive back-leaps that both reset stance and create distance. Gap closers then start the next string. A 2D prototype can map this to a state machine: approach (walk) → mid-range gap closer → combo → finisher → recovery window → occasional back-off or strafe "breather."

### Gaps
- I found no data on walk speeds, how often bosses idle, strafe or back off, how long an idle lasts, or AI decision weights. Paramdex or AI-script datamines exist in the community but could not be accessed.
- I found no specific breakdowns of the gap closers of Godrick, Maliketh, Godfrey or Messmer.

## 8. Hit reactions on bosses: flinching, hyperarmor, and hitstop

### Takeaway
Bosses generally do not flinch from ordinary hits. Their poise and hyperarmor let them attack through player hits, and the main "reaction" a player can force is the stance break (section 5). The search turned up nothing on hitstop on big bosses.

### Cited Findings
- **Poise and stance are separate.** Poise governs hitstun (flinching), and stance governs the critical-hit opening; enemies run both. **[Med]** — [GamertagMythras](https://gamertagmythras.com/blog/elden-ring/elden-ring-stance-break-guide)
- **Bosses hyperarmor through player attacks during certain moves,** for example Malenia's kick, jump and side dash. **[Low]** — [Steam discussion](https://steamcommunity.com/app/1245620/discussions/0/5706632550002709330)
- **Transitional animations cannot be poise-broken,** and at least one boss's poise is "higher than normal" and recovers faster. **[Low]** — [Steam: Poise break](https://steamcommunity.com/app/1245620/discussions/0/3729575042620520686/)
- **Superarmor and poise are explained in mainstream guides.** **[Med]** — [ProGameGuides](https://progameguides.com/elden-ring/how-poise-stance-breaking-and-super-armor-works-in-elden-ring/); [Windows Central](https://www.windowscentral.com/elden-ring-melee-combat-guide)

### Inferences
- The lack of flinching on bosses makes trading hits dangerous and keeps the "attack only in windows" rhythm. Feedback on a hit comes from sound, effects and health-bar chunks, not from the boss reacting. The stance break is the one large hit reaction that rewards accumulated pressure. A 2D prototype might want small cosmetic hit feedback (flash or shake, plus a short hitstop) without interrupting the boss's animation; I found no ER data on this.

### Gaps
- I found no sources on hitstop or hit-pause on bosses, on partial flinches (for example, head or limb flinches on large bosses), or on poise values for bosses.

## 9. Criticism and design analysis: aggression, delayed attacks, input reading, fair vs unfair

### Takeaway
The criticism is consistent. Players fault (1) the increased number of delayed attacks, built to catch early rolls; (2) heavy tracking; (3) long combos with small windows, especially in Shadow of the Erdtree (Rellana, Messmer, Bayle, Promised Consort Radahn); and (4) reactive "input-reading" behaviour. Defenders argue the openings are real but must be learned and baited, and that the telegraphs are readable. FromSoftware's public line, through Miyazaki, is that difficulty is intentional and that the DLC deliberately "pushed the envelope." I found no FromSoftware GDC talk or formal design statement on delayed attacks.

### Cited Findings
- **Miyazaki on Shadow of the Erdtree difficulty:** the team "pushed the envelope in terms of what we think can be withstood by the player" (via The Guardian). **[High: widely reported quote]** — [GamesRadar](https://www.gamesradar.com/games/action-rpg/how-hard-is-shadow-of-the-erdtree-hidetaka-miyazaki-says-fromsoftware-has-pushed-the-envelope-in-terms-of-what-we-think-can-be-withstood-by-the-player); [PC Gamer](https://pcgamer.com/games/rpg/elden-ring-shadow-of-the-erdtree-is-hard-as-nails-says-miyazaki-weve-really-pushed-the-envelope-in-terms-of-what-we-think-can-be-withstood-by-the-player)
- **Miyazaki on post-launch feedback:** the team looked at what Elden Ring players found fun and what they found stressful about boss fights after release to find the difficulty sweet spot for the DLC (CNET, via secondary coverage). **[Med]** — [Mein-MMO](https://mein-mmo.de/en/elden-ring-interview-ign-auswertung,1094095); [Game Informer](https://gameinformer.com/interview/2024/06/24/from-softwares-hidetaka-miyazaki-discusses-the-studios-approach-to-difficulty)
- **Miyazaki on why the games are hard:** "if we really wanted the whole world to play the game we could just crank the difficulty down." Elsewhere he says he feels "apologetic" toward frustrated players while keeping difficulty central. **[High]** — [GamesRadar](https://www.gamesradar.com/games/action-rpg/hidetaka-miyazaki-says-games-like-elden-ring-have-to-be-hard-if-we-really-wanted-the-whole-world-to-play-the-game-we-could-just-crank-the-difficulty-down); [PC Gamer](https://www.pcgamer.com/elden-ring-creator-feels-apologetic-to-anyone-frustrated-by-his-games)
- **Delayed attacks:** launch-era meme coverage and the Nameless King-origin theory. **[Med]** — [Automaton Media](https://automaton-media.com/en/news/20220316-10577/)
- **A critic on fatigue with the formula:** a fog-gate boss with "the same airborne swings, long combos, and delayed AoE attacks" is less exciting than it used to be, framed as FromSoftware "starting to betray its own boss design philosophy." **[Med: opinion piece]** — [eXputer](https://exputer.com/exputer/fromsoftware-boss-design); see also [eXputer on Shadow of the Erdtree](https://exputer.com/features/elden-ring-shadow-of-the-erdtree-is-difficult/)
- **Defense of the delays:** some fans argue delayed attacks work when used sparingly, citing DS3's Dancer of the Boreal Valley, whose "irregular rhythm and delayed attacks" surprise the player. **[Low]** — [Steam discussion](https://steamcommunity.com/app/1245620/discussions/0/3719440044270966891)
- **An industry developer cites Elden Ring as a fair example:** the Tomb Raider: Legacy of Atlantis boss-fight lead. **[Med]** — [GamesRadar](https://www.gamesradar.com/games/action-rpg/tomb-raider-legacy-of-atlantis-boss-fight-lead-points-to-elden-ring-as-a-stellar-example-of-how-to-make-sure-theyre-fair/)
- **The DLC debate repeats a cycle:** these complaints recur with every FromSoftware release, and other players answer that the difficulty reflects their own skill. **[Low–Med]** — [canbuyornot Substack](https://canbuyornot.substack.com/p/fromsoftwares-balancing-act)
- **Community "worst bosses" threads** cite long windups, tracking and fewer obvious openings than DS3. **[Low]** — [ResetEra](https://www.resetera.com/threads/after-150-hours-i-think-that-elden-ring-has-the-worst-bosses-of-any-soulsborne.564490/page-14); [TV Tropes: That One Boss (Elden Ring)](https://www.tvtropes.org/pmwiki/pmwiki.php/ThatOneBoss/EldenRing)
- **Video essays:** the Game Maker's Toolkit Elden Ring video (Nov 2022) is about world design, not bosses. It touches on enemy balance, meant to challenge players without getting them stuck. **[High that it is world-focused]** — [80.lv summary](https://80.lv/articles/a-look-at-the-world-design-of-elden-ring). Boss-focused analyses exist, but I could not summarize them: the three-part "An Over-Analysis of FROM Software Boss Design: Elden Ring" ([Part 1](https://www.youtube.com/watch?v=Yyy7RjrOX_U), [Part 2](https://www.youtube.com/watch?v=g0ZXQISMQqs), [Part 3](https://www.youtube.com/watch?v=rvnkiQQ0-JU)) and "Elden Ring Bosses: A Game Design Discussion" ([YouTube](https://www.youtube.com/watch?v=bSLaMTObv3w)).

### Inferences
- From the criticism, the line between "fair" and "unfair" seems to be:
  - Fair: the delay is readable from the pose and consistent per attack, and the commit cue is visible.
  - Unfair: the delay is combined with full tracking, which removes positional answers; or chained into long strings that drain stamina, so the player cannot reach a window; or triggered by animation-reactive punishes that feel like input reading; or obscured by visual clutter, as with Promised Consort Radahn.
- For a 2D prototype, the useful guardrails are: one delayed variant per attack family; tracking that locks at commit; a guaranteed recovery window after each finisher; and a stance-break payoff for players who use those windows aggressively.

### Gaps
- I found no FromSoftware GDC talk or developer design document on boss timing or delayed attacks; Miyazaki's interviews discuss difficulty, not mechanics.
- I could not retrieve a GMTK "Boss Keys"-style analysis of Elden Ring bosses, nor any written summary of a boss-focused video essay. Measured studies of delayed-attack frequency (for example, counts per boss by game) were also not found.
