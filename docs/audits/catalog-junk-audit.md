# Planet MP3 catalog junk audit (dry-run)

**Status: no Firestore or Storage deletes were applied.**

Fetched: `2026-09-16T15:40:16.690Z`  
Source: `firestore-rest-public`  
Catalog size: **15164** tracks

## Counts

| Bucket | Count |
|---|---|
| Total tracks | 15164 |
| Candidate **deletes** | 38 |
| Long tracks (≥ 20 min) | 12 |
| Ambiguous **maybe keep** (DJ mix / continuous set) | 0 |
| Review (fix metadata / confirm, do not auto-delete) | 22 |
| App mixtape band (≥ 15 min, already excluded from singles) | 22 |
| All flagged rows (delete + review) | 60 |

### Reason codes

- `BROKEN_METADATA`: 10
- `DUPLICATE`: 2
- `FULL_ALBUM_DUMP`: 13
- `NON_MUSIC`: 20
- `TEASER`: 1
- `ULTRA_SHORT`: 2
- `UNKNOWN_ARTIST`: 10
- `VERY_LONG`: 12

## Criteria

- **Very long:** duration ≥ **20 minutes** (1200s). Album-length files that are not an obvious DJ mix / continuous set are recommended **delete**.
- **DJ mix / maybe keep:** same duration cutoff **and** mix language (`dj mix`, `dj set`, `continuous mix/set`, `essential mix`, `boiler room`, `mixtape`, `mixset`, `club set`, `radio set`). “Original Mix” / radio edits of singles do **not** count.
- **Full album/EP dump:** title looks like a full album/EP/cassette/vinyl stream **and** duration ≥ **10 minutes** (even if under 20 min).
- **Non-music:** high-confidence guides, gameplay, hotel tours, theory/history videos, nature docs, spoken marketing, alphabet drills, lyric-dump files. Generic words like “walkthrough” or “let’s play” are **not** used (too many real songs).
- **Teaser:** title contains “teaser” and duration < 90s.
- **Ultra-short:** duration < 30s → **review** only (grindcore / real micro-songs exist).
- **Unknown artist / broken metadata / duplicates:** **review** (fix tags or keep one copy). Not auto-delete.

The app already treats duration > 900s as a mixtape (hidden from artist/album “singles”). This audit’s delete cutoff is stricter (20 min) so André 3000 / KEXP medleys in the 15–20 min band stay unless they also match dump/non-music language.

## Top examples per reason

### NON_MUSIC (delete)

- `z9kYeKfeH85rGGOs3wpp` · **47:46** · Go Wild — Sky Hunters, The World of the Dragonfly · `delete`
- `tu5a48STjxNySf6RKgwQ` · **18:48** · Everything You NEED To Know — MapleStory BEST Familiars Guide 2024 · `delete`
- `s0E8IhlJLtQk7NvUngpP` · **18:03** · Ask a Spaceman! — The Dipole Repeller: The Void That’s Tearing Us Apart · `delete`
- `pQbd5EBwTyBiJfRZPn8n` · **16:34** · Mastering Multiple Stegadons in AoS — They're Moving in Herds! · `delete`
- `eesZ1p1aVMdyIygR2lgj` · **16:07** · Campfire Stories — Baloney Bob · `delete`
- `UyVKRLayQxgjzHOz7tz6` · **15:48** · Day Four - Crafting Your Marketing Message About Closure — The Bathrobe Chronicles · `delete`
- `dDOCFF9h4WHg8T9DwHpC` · **14:44** · Jack Sparrow is Dying... Of THIRST! — Film Theory · `delete`
- `vYaxWAmpMXOOf6rtlOLy` · **14:28** · USA Road Trip New Mexico — Santa Fe New Mexico's Historical La Fonda Hotel Tour · `delete`


### FULL_ALBUM_DUMP (delete)

- `zBfbAK934Z3gMzDyQfpu` · **1:17:57** · the miseducation of lauryn hill (full album) — lauryn hill · `delete`
- `K2scsQocoscCpUamsCG6` · **43:30** · Warmer Than Gold (Full Album Stream) — GUV · `delete`
- `S2jGHEdUq8hGGvAS9cZb` · **42:25** · Content Oscillator (2023, debut album) — TELEHEALTH · `delete`
- `yYF7gOTaM1QUXFZtYcbh` · **37:13** · Have An Idea (Full Album) 1980 — The Heats · `delete`
- `LSNpyhpRYmPc1fHhMI6B` · **33:58** · Venomous Nightshade (full album)[Jazz Fusion][USA, 2017] — Bad News Botanists · `delete`
- `mDU7wcEE4eVkoCQoWn51` · **31:21** · Glorious Game - Full Album Stream — El Michels Affair & Black Thought · `delete`
- `setpr5P9LVoMIXv5Ulnl` · **28:58** · ten cool ones [full] — the MONO MEN · `delete`
- `gYZavBj0I1BfTTwYlYeJ` · **19:32** · Melody Maker [FULL EP STREAM] — Supercrush · `delete`


### VERY_LONG (delete)

- `zBfbAK934Z3gMzDyQfpu` · **1:17:57** · the miseducation of lauryn hill (full album) — lauryn hill · `delete`
- `K2scsQocoscCpUamsCG6` · **43:30** · Warmer Than Gold (Full Album Stream) — GUV · `delete`
- `S2jGHEdUq8hGGvAS9cZb` · **42:25** · Content Oscillator (2023, debut album) — TELEHEALTH · `delete`
- `yYF7gOTaM1QUXFZtYcbh` · **37:13** · Have An Idea (Full Album) 1980 — The Heats · `delete`
- `LSNpyhpRYmPc1fHhMI6B` · **33:58** · Venomous Nightshade (full album)[Jazz Fusion][USA, 2017] — Bad News Botanists · `delete`
- `mDU7wcEE4eVkoCQoWn51` · **31:21** · Glorious Game - Full Album Stream — El Michels Affair & Black Thought · `delete`
- `setpr5P9LVoMIXv5Ulnl` · **28:58** · ten cool ones [full] — the MONO MEN · `delete`
- `z9kYeKfeH85rGGOs3wpp` · **47:46** · Go Wild — Sky Hunters, The World of the Dragonfly · `delete`


### TEASER (delete)

- `VdLmnpdQx7PoKnpuOlS4` · **0:42** · Juega (Teaser) — Caribombo & Pahua · `delete`


### MAYBE_KEEP_MIX (review — do not delete)

_None._


### UNKNOWN_ARTIST (review)

- `sTankDZ1UhAVc498XYXA` · **9:14** · I'm In Love..(Justin Robertson's Deadstock 33S Remix) — Unknown · `review`
- `KXPNmB0IoUtvswzYUaJq` · **4:55** · Assembly (feat Maddy Fox) — Unknown · `review`
- `DjOenGlgMprzxgJGkz9r` · **4:34** · 'Go' feat. Jimmy James (Studio Session) — Unknown · `review`
- `nzufGUol3G1pfLnK4LgJ` · **4:30** · Love Is A Life That Lasts Forever (Feat. Molly Linen) (Official Visualiser) — Unknown · `review`
- `S5pkjghdWaTZT8LPsArl` · **4:11** · Mountains (ft. Clarissa Abadesco) — Unknown · `review`
- `2R9cwG2uz0hW20vQtWxZ` · **3:33** · 'Heat Check' (Studio Session) — Unknown · `review`
- `ejXeB6O50qJspQiPGZxu` · **3:24** · Manticore — Unknown · `review`
- `OTBVIoiquPqdZaQr52Pk` · **3:19** · trust me — Unknown · `review`


### BROKEN_METADATA (review)

- `vAOvQlf56elJhKnWCEsS` · **4:51** · Music Video — Aftermath · `review`
- `yjpXQw5uNRXiers3r4mQ` · **4:47** · Feel Alive — Ryan Barber & The Riches Official Music Video · `review`
- `js7ysVlnpGWTHK75njx8` · **4:35** · YouTube — Smoker Dad // Do Ya Want It (Official Music Video) · `review`
- `0wVvPllGfvmlKaITu7Ib` · **4:31** · Ana Lete — Footsteps [official music video] · `review`
- `28e9HtmNpu7dlnWdlIQL` · **3:54** · HeZza FeZza — Ancient Stars (prod. Gregory Stutzer) official music video · `review`
- `K9lAkC93sxE7enq9R5MK` · **3:46** · Katie Kuffel — 1999 Official Music Video · `review`
- `30I2ECtDLN1LbVIAOkSE` · **3:41** · Champagne Honeybee — Once in a Lifetime OFFICIAL Music Video · `review`
- `XjDlg0TrRDwW4hCcxI9F` · **3:22** · Tangerine — Nothing Better (Official Music Video) · `review`


### DUPLICATE (review)

- `gfPbUH7uP5dpQiazjlHK` · **4:46** · Yoshimi Battles the Pink Robots, Pt. 1 — The Flaming Lips · `review`
- `cs77gklk0uPnGzWbqaV5` · **3:07** · Sound & Color — Alabama Shakes · `review`


### ULTRA_SHORT (review)

- `mj1uE5jg0xtxdiKStWQY` · **0:21** · Great Wall: Quickest way down in cave — Tomb Raider 2 · `delete`
- `XyDdKDkEtDcU4LRhzydi` · **0:04** · FINISHLINE album lyrics — PARISALEXA · `delete`


## Next step for Luke

1. Skim this report and the CSV (`docs/audits/catalog-junk-candidates.csv`).
2. Reply **yes / approve deletes** on the PR (or list ids to drop / keep).
3. A follow-up run can apply Firestore deletes (and optional Storage purge) **only after that approval**.

This script has **no `--apply` path**. Do not invent one locally unless you are in the approved follow-up.

Local re-run (public catalog read; no service account required):

```bash
npm run catalog:audit-junk
```

If Firestore REST is blocked, put `serviceAccountKey.json` in the repo root (gitignored) and re-run; the script will use Admin SDK read.

## Appendix — every track ≥ 15 min

| Duration | Title | Artist | Flag | id |
|---|---|---|---|---|
| 1:17:57 | the miseducation of lauryn hill (full album) | lauryn hill | delete/FULL_ALBUM_DUMP | `zBfbAK934Z3gMzDyQfpu` |
| 1:08:49 | This Timeless Turning | Sky Cries Mary | delete/VERY_LONG | `bqAOOt2UXUCHZYRZGNyn` |
| 47:46 | Go Wild | Sky Hunters, The World of the Dragonfly | delete/NON_MUSIC | `z9kYeKfeH85rGGOs3wpp` |
| 43:30 | Warmer Than Gold (Full Album Stream) | GUV | delete/FULL_ALBUM_DUMP | `K2scsQocoscCpUamsCG6` |
| 42:25 | Content Oscillator (2023, debut album) | TELEHEALTH | delete/FULL_ALBUM_DUMP | `S2jGHEdUq8hGGvAS9cZb` |
| 37:13 | Have An Idea (Full Album) 1980 | The Heats | delete/FULL_ALBUM_DUMP | `yYF7gOTaM1QUXFZtYcbh` |
| 33:58 | Venomous Nightshade (full album)[Jazz Fusion][USA, 2017] | Bad News Botanists | delete/FULL_ALBUM_DUMP | `LSNpyhpRYmPc1fHhMI6B` |
| 31:21 | Glorious Game - Full Album Stream | El Michels Affair & Black Thought | delete/FULL_ALBUM_DUMP | `mDU7wcEE4eVkoCQoWn51` |
| 28:58 | ten cool ones [full] | the MONO MEN | delete/FULL_ALBUM_DUMP | `setpr5P9LVoMIXv5Ulnl` |
| 24:11 | Wet Lands | Source Of Labor | delete/VERY_LONG | `KJvFup82xlF7tV4rzJWk` |
| 21:06 | Men And Their Work | ALL HITS | delete/VERY_LONG | `DqFokkCudaOVBFQwyFBz` |
| 20:02 | TRUE-ISMS | Gifted Youngstaz and RA Scion | delete/VERY_LONG | `W5GRh8SeBA6lgWByspmB` |
| 19:32 | Melody Maker [FULL EP STREAM] | Supercrush | delete/FULL_ALBUM_DUMP | `gYZavBj0I1BfTTwYlYeJ` |
| 18:48 | Everything You NEED To Know | MapleStory BEST Familiars Guide 2024 | delete/NON_MUSIC | `tu5a48STjxNySf6RKgwQ` |
| 18:16 | Listen Up / Synopsis (Full Vinyl) | Erule | delete/FULL_ALBUM_DUMP | `hWAISmi4JpZPCfh6EE29` |
| 18:03 | Ask a Spaceman! | The Dipole Repeller: The Void That’s Tearing Us Apart | delete/NON_MUSIC | `s0E8IhlJLtQk7NvUngpP` |
| 17:15 | Dreams Once Buried Beneath The Dungeon Floor Slowly Sprout Into Undying Gardens | André 3000 | keep | `nfaxK0weVH6GS8Rb4RfD` |
| 16:34 | Mastering Multiple Stegadons in AoS | They're Moving in Herds! | delete/NON_MUSIC | `pQbd5EBwTyBiJfRZPn8n` |
| 16:32 | nothing is real [Full EP] | VIQ | delete/FULL_ALBUM_DUMP | `lZ5zHiVhrvrhZTe7DIIW` |
| 16:07 | Campfire Stories | Baloney Bob | delete/NON_MUSIC | `eesZ1p1aVMdyIygR2lgj` |
| 15:48 | Day Four - Crafting Your Marketing Message About Closure | The Bathrobe Chronicles | delete/NON_MUSIC | `UyVKRLayQxgjzHOz7tz6` |
| 15:31 | Alter Me / Altered Beast I-IV (Live on KEXP) | King Gizzard & The Lizard Wizard | keep | `f3G6okj74y3BE6zAkNcS` |
