# PlanetMP3 — Creative Audit (steel-ps1-glass)

**Date:** 21 September 2026  
**Chassis scored:** `STYLE_CHASSIS = steel-ps1-glass-20260919` (`src/theme.js`, `public/index.html`, committed `build/`)  
**HEAD:** `8618b16` — Mobile UX: one player, first-fold channels, Tabs-only More (`#265`)  
**North star:** *A futuristic MTV MP3 player from Y2K* — playful, collectible, music-first, unmistakably PlanetMP3. Not Spotify, Apple Music, DistroKid, or generic SaaS.  
**Method:** Code review of Home, Explore, Library, Club, Search, Charts, player surfaces, tokens, and motion; live inspection of `/`, `#broadcast-preview`, `#player-preview`, `#explore-preview`, `#onboarding-preview`, `#guide-preview-club`, `#set-preview`, and `#chat-preview` at desktop (~1280×900) and mobile (390×844). **No product code was changed for this audit.**

This scorecard replaces [`docs/CREATIVE_UX_AUDIT_V2.md`](CREATIVE_UX_AUDIT_V2.md) for the current chassis. Related but not this scorecard: [`docs/MOBILE_UX_AUDIT.md`](MOBILE_UX_AUDIT.md) (phone comprehension, 61/100, largely shipped in `#265`), [`docs/UX_AUDIT.md`](UX_AUDIT.md) (ergonomics), [`docs/PLANETMP3_UI_AUDIT.md`](PLANETMP3_UI_AUDIT.md) and [`docs/CREATIVE_DIRECTION_AUDIT.md`](CREATIVE_DIRECTION_AUDIT.md) (stale chassis notes).

**Recent chassis history (do not re-litigate blindly):** Aqua → Acid LCD (`#234`) → Steel Y2K (`#235`) → PS1 Discman costume (`#236`, reverted `#237`) → Steel-chrome (`#239`, V2 scored **64/100**) → DistroKid trim (`#246`) → PS1 glass deck (`#256`) → Explore crate directory (`#261`–`#262`) → Charts podium (`#259`) → Apple Music mini dock (`#263`) then one-player mobile (`#265`) → **this audit**.

---

## 1. Executive Summary

PlanetMP3 is no longer a Spotify clone. It is also not yet “a futuristic MTV MP3 player from Y2K.”

What the eye meets on `steel-ps1-glass-20260919` is a **cool aluminum Discman wearing DistroKid jewelry**. The listening object is real: jewel sleeve, smoked ice-cyan LCD (`118 BPM · 8A · MP3 · AFTERGLOW`), chamfered hardware keys, Slow/Fast pace, LIVE plate, `CH-04 LOCAL` bug, `PLANET / 003`. That is the brief, in one module.

Around that object the product still behaves like **iTunes 7 on the web**: canvas `#C5CBD6`, Lucide source list, Apple Music island dock, DistroKid lime→blue CTA plates (`theme.js` says so in comments), and Channel Surfing as **pixel pictograms on brushed plates** — iPod, guitar, house, skull — not records. Explore’s `.MP3` folder and Charts’ #1 podium are closer to magazine/Winamp culture. Library is Music.app. Club’s membership card is collectible and then empty.

The mix today is roughly **40% light iPod / iTunes shell · 25% PS1 glass device · 15% DistroKid SaaS trim · 10% broadcast/station vocabulary · 10% underground metadata / Planet lockup**.  
Target mix: **40 modern product · 25 Y2K device · 20 underground culture · 15 Planet**.

**Do not** ship another Discman costume (orange phosphor, purple CRT, display-font swap). `#236` already proved that path. **Do not** keep DistroKid blue as the brand signal. The next identity leap is: **steel as metal, ice LCD as the only chromatic voice, sleeves as culture, one player drawing at three sizes.**

**Verdict:** Keep IA, engines, Club card, DeviceChrome, labeled Pace, Explore folder, Charts podium. Do not rebuild. Put catalog sleeves on the first browse row, restyle the dock as a tiny faceplate, and stop borrowing DistroKid’s gradient.

**Overall score: 69 / 100**

Band: **Improve / edge of Refine** (+5 vs steel-chrome V2 at 64). Player, Explore directory, Charts podium, and ice LCD moved. Originality is still capped by iTunes chrome, DistroKid CTAs, and pictogram stations.

---

## 2. Overall Score (/100)

| Category | Score (/10) | Weight | Weighted |
|---|---:|---:|---:|
| Brand Identity & Originality | 6.5 | 20 | 13.0 |
| Music Discovery & User Experience | 7.5 | 15 | 11.3 |
| Music Player & Playback Experience | 8.0 | 15 | 12.0 |
| Visual Language (Colour, Typography, Layout) | 6.0 | 15 | 9.0 |
| Interface & Interaction Design | 7.0 | 10 | 7.0 |
| Artwork & Editorial Presentation | 6.0 | 10 | 6.0 |
| Motion & Micro-interactions | 7.0 | 5 | 3.5 |
| Mobile & Responsive Experience | 7.5 | 5 | 3.8 |
| Design System Consistency | 7.0 | 3 | 2.1 |
| Technical Feasibility & Incremental Improvement | 9.0 | 2 | 1.8 |
| **TOTAL** | | **100** | **69** |

Scoring: **9–10 preserve · 7–8 refine · 5–6 improve · 0–4 redesign priority.**  
Weighted = `(score / 10) × weight`, rounded to one decimal. Total rounded to nearest integer.

---

## 3. Detailed Scorecard

### 3.1 Brand Identity & Originality — 6.5/10 · **13.0 / 20**

**Evidence**
- Lockup is a real mark: ringed planet, italic `PLANET` / `MP3`, tagline `YOUR WORLD, YOUR MUSIC.` Login is the most Planet screen in the product.
- Distinct nouns: Channel Surfing, On Air, cuts, stacks, Club, `PLANET / 003`, `CH-04 LOCAL`, Turtle-era Pace now labeled **Slow / Fast · Next picks**.
- `theme.js` header: “alternate-2003 MP3 device.” Also, explicitly: “DistroKid-like color trim — lime → teal → blue” and “DistroKid CTA blue — primary buttons only.”
- Channel plates (`/channels/*.png`) are original pixel drawings (iPod+planet, house+mirrorball, skull, radio tower) on aluminum — original, **iTunes genre-icon grammar**.
- Lucide strokes for Home / Explore / Library / Club. `IceOrbPlay` alias still exists. `glass-dock` / `pill-nav` class names describe a previous product.
- Planet mascot Lottie exists; after login it is a 26px pip on the hero.

**What's working**
- Nobody else says “Flip the dial,” ships `01  DEEP_FLOOR.MP3`, or numbers members `#000098`.
- Login + Club card + LCD firmware are collectible brand objects.
- Onboarding is a station tuner (“Tune the stations that sound like you”), not a Spotify genre survey.

**Creative gaps**
- DistroKid’s gradient is now the loudest chromatic identity. Play, Live plate, Sign in, Replay the tour, Play this chart, Play set all wear lime→blue. That is another company’s product language.
- Identity lives in chrome (lockup, LCD, bugs), not destinations. Library / Search / Club Guide are aluminum skins of SaaS.
- Channel Surfing — the first browse row — looks like a Game Icons pack, not a record shop.

**Specific recommendations**
- Keep steel. Keep ice LCD (`#E4F7FA` / `#B7E4EE`) as the **only** non-steel signal besides LIVE red.
- Restyle `BTN_PRIMARY` as a hardware key or LCD plate. Delete DistroKid comments and `trim.gradient` from identity use.
- Put the lockup or planet pip in persistent chrome (sidebar already has it; mobile Home still hides the wordmark behind a hamburger + Find).

---

### 3.2 Music Discovery & User Experience — 7.5/10 · **11.3 / 15**

**Evidence**
- Home: device hero → Channel Surfing (14 stations) → Tonight / Most Requested crate spread (`#01` 2×2 lead).
- Explore: Directory eyebrow, Worlds (sleeve-led House/Chicago, Techno/Detroit), Energy (After hours → Peak time LCD modules), Sleeves wallet, Mix Camelot wheel, Find LCD field.
- Folder view: `01  DEEP_FLOOR.MP3` / `02  HAZE.MP3` with `124 BPM · 9A` on the LCD list — the most Y2K-native discovery surface.
- Charts: podium `#01` jewel + climbers, `Play this chart`, LCD masthead `CHART · TOP 20 · PLAY & REQUEST TO CLIMB`.
- Search is a destination opened from Find, not a fifth tab (`#265`).
- Mix board: twelve keys, A/B, neighbors mix; empty pads stay dark (preview catalog lights 5, 8, 9).
- Tonight “Today · 2 blocks” TV-guide strip still sits between stations and the crate.

**What's working**
- Discovery has *modes* (dial, crate, keys, pressure, countdown) instead of one infinite feed.
- Editorial copy is cultural: “A crate, not a feed.” “Four-to-the-floor pressure and long blends.”
- Charts and Explore already treat sleeves as posters.

**Creative gaps**
- The first destination after Play is pictogram radio, so “music-first” breaks immediately.
- Mix wheel without a sleeve chip on every lit pad reads as a settings grid.
- Energy rooms are typography slabs — device-like, not collectible.
- Search empty state is still a utility field (`placeholder="Search"`).
- Home editorial is thin: `buildHomeCollections()` still only exposes “Played before.”

**Specific recommendations**
- Channel tiles: catalog sleeve (or 4-up mosaic) + `CH-04` LCD bug + play. Keep the pixel plates as *bugs*, not the tile.
- Mix: one sleeve in each lit pad; empty stays smoked metal.
- Energy: one sleeve bleed per zone, or a pressure meter, not four identical LCD cards.
- Kill or demote the Today/blocks strip. Program guide belongs inside the device, not as a TV schedule.

---

### 3.3 Music Player & Playback Experience — 8.0/10 · **12.0 / 15**

**Evidence**
- Shared `PlayerDeck`: LCD timeline with ticks, circular play with lime pip + cyan halo, chamfered prev/next/like/dislike, half-width Pace (`Next picks · Slow — Fast`), first-run hint “Slow and Fast change what plays next.”
- Hero LCD: `ON AIR`, title, artist, `118 BPM · 8A · MP3 · AFTERGLOW · ELECTRONIC`, Up Next glass row.
- Immersive: `PLANET / 003`, On Air, jewel sleeve, LCD `124 BPM · 8A · E6 · 320 KBPS`, volume groove, queue key, booth drawer.
- Dock (`#265`): collapsed mini — cover, title, play/skip; tap opens immersive. Home hero visible → tabs-only (`hideDockPlayer`).
- Desktop mini is a glass strip (`left: 244`) with the same DistroKid play ring.
- Desktop immersive is a **landscape split**: modest sleeve left, LCD right, deck below — phone theater stretched, not a poster stage.

**What's working**
- This is the product. A new user can press play without a tour.
- Metadata lives on firmware, where BPM/Camelot/bitrate belong.
- One transport grammar across hero and immersive. Pace is taught in place.
- Hardware keys feel tactile (raised bevel, press, lit cyan).

**Creative gaps**
- Play key’s DistroKid halo is the brand’s loudest pixel and the least Planet.
- Mobile dock still reads as Apple Music’s island (frosted pill + Lucide tabs + tiny 40px thumb).
- Desktop now-playing does not use the extra width for a collectible sleeve. Album art is secondary to empty aluminum.
- Shuffle/repeat vanish in radio with no explanation. Queue is a list icon.

**Specific recommendations**
- One player drawing: jewel sleeve + LCD + hardware deck. Dock is a **tiny faceplate** (LCD title + hardware play), not a streaming pill.
- Desktop immersive: sleeve as the stage (min 42vw / 520px, already sketched in `.pmp-device-stage` at 860px and unused by ImmersivePlayer).
- Play key: steel + ice pip. Glow = `lcdSignal`, not lime+blue.

---

### 3.4 Visual Language (Colour, Typography, Layout) — 6.0/10 · **9.0 / 15**

**Evidence**
- Canvas `#C5CBD6`, ink `#3D4654`, accent graphite `#5B6574`, LCD ice `#E4F7FA` / `#B7E4EE`, LIVE `#E0314A`, CTA `#367FC7`, lime `#B8C430`.
- IBM Plex Sans + Mono. Type scale: largeTitle 34/700, lcd 11/700 uppercase. No costume display face (Syne retired; tests lock this).
- Radii: hardware 6, LCD 6, dock 16, glassStage 22, leftover `radius.pill = 980`.
- Home `maxWidth: 960`. Explore `1120`. Artist/Album `640`. Desktop: 232px iTunes source list + remaining pane.
- Glass: frosted hero (`.pmp-glass-stage`), deck plate with overlay scan, LCD scanlines at 14% overlay.

**What's working**
- One metal. Ice LCD contrast is solved (no more graphite-on-graphite titles).
- Bold sans + compact mono metadata matches the brief when it appears.
- Glass is used as *frosted device glass*, not as a generic card skin — on the hero.

**Creative gaps**
- Colour is iPod Mini graphite, not MTV heat, not Winamp amber, not a bootleg firmware LED. Ice cyan is the right phosphor; DistroKid blue is the wrong one.
- Layout is streaming: left rail, content column, bottom island. Not panels, overlays, HUD.
- Typography is product-UI throughout. No magazine poster moment except Charts #1 type on the sleeve.
- `y2k.offWhite` is `#3D4654`. `y2k.cyan` / `neon` / `techBlue` are graphite. Names lie.

**Specific recommendations**
- Keep Plex. Keep steel. Promote LCD cyan; demote DistroKid blue to zero.
- Desktop Home: drop the 960 cage around the hero. Let the device be the page.
- One editorial poster band (Charts already does this) — don’t turn every shelf into App Store rails.

---

### 3.5 Interface & Interaction Design — 7.0/10 · **7.0 / 10**

**Evidence**
- Four tabs: Home / Explore / Library / Club. More drawer = Charts + Build a set only (`#265`).
- Find is a labeled LCD field on Home and Explore.
- Hardware keys 40–44px. `pmp-press` / `pmp-lift`. Reduced motion honored globally.
- Mix A/B pads, set-builder length/vibe chips, Club haptic, deck hint.
- Chat preview: AIM-style `Live chat` window over Home — early-internet, on-brief, currently a preview.
- Library: Stacks/Liked, Search stacks, RECENT / A–Z / SIZE, mosaic tiles, Lucide plus.

**What's working**
- Device controls (keys, LCD fader, Find well) beat generic buttons on the player.
- IA is learnable: four destinations. Search is a tool, not a tab.
- Set builder is a booth: length keys, vibe plates, energy arc, one Play set.

**Creative gaps**
- Sidebar is Music.app: uppercase Lucide rows, left rule on active.
- Library interaction is playlist admin.
- Mix pads are small and unlabeled as Camelot until you already know.
- Home has no visible title; identity is the device (good) but also no Planet wordmark on mobile.

**Specific recommendations**
- Source list as a device selector (LCD selected row, not inset graphite bar).
- Mix: caption “Camelot — neighbors mix” already exists; enlarge A/B; sleeve chip.
- Keep four tabs. Do not add Search as a fifth.

---

### 3.6 Artwork & Editorial Presentation — 6.0/10 · **6.0 / 10**

**Evidence**
- `artFrameStyle`: 6px radius, dual-tone chrome edge, raised jewel shadow, DistroKid-blue active ring.
- Home crate spread: `#01` spans 2×2, `#02–05` fill — magazine grid. BPM/key on the lead.
- Explore Worlds: large House sleeve, Techno beside. Sleeves tab: open case + spine wallet.
- Charts podium: huge #1 with play in the well.
- Channel / onboarding: pixel plates, no catalog photography.
- Energy: no art. DefaultSleeve: disc glyph. CoverFlow exists in Library and is not the default.
- Preview sleeves are generated color fields (`Afterglow`, `Night Shift`) — production uses Storage covers; the *chrome* is what we score.

**What's working**
- When a sleeve is allowed to be large, the product feels like a record shop.
- Jewel frame + scanline on LCD is the right physical metaphor.
- Folder filenames are editorial, not UI chrome.

**Creative gaps**
- The brief: “Album artwork as a primary visual element.” Channel Surfing violates this on the first fold.
- Active art ring is DistroKid blue, not ice.
- Artist/Album pages cap at 140px album rails, 640px page — Apple Music destination, small.
- Library mosaics are four-up streaming tiles, not a crate.

**Specific recommendations**
- Sleeve-led channels (P0). Ice active ring. Artist page: one poster hero, then a crate — reuse Explore folder chrome.
- CoverFlow or wallet as a Library view, not only a buried mode.

---

### 3.7 Motion & Micro-interactions — 7.0/10 · **3.5 / 5**

**Evidence**
- Tokens: rhythm over bounce; 0.08–0.35s chrome; atmosphere slower (`src/motion/tokens.js` + `theme.motion`).
- Live: `pmp-live-led`, `stageLiveDot`, LCD pip 1.6s, planet pip breathe 4.2s, play glow, trackSwap 0.32–0.45s, dockRise 0.45s, lcd marquee 8s, planet spin 16s on boot.
- ScanlineWash on LCD only (ice, 14% overlay) — not a full-screen CRT costume.
- `prefers-reduced-motion` kills animations globally.

**What's working**
- Motion is fast and quiet. Firmware blinks; pages do not bounce.
- Track change is a crossfade, not a route animation.

**Creative gaps**
- The play-key halo is the only “wow” and it is DistroKid.
- Channel active state is a static blue ring.
- No tactile seek-tick, no platter, no click on hardware keys beyond CSS scale.

**Specific recommendations**
- Ice pip pulse on play, not lime. Optional 1px seek ticks already exist — keep.
- Do not add Lottie to every tile. One extra: sleeve settle on track change (already `coverSettle`).

---

### 3.8 Mobile & Responsive Experience — 7.5/10 · **3.8 / 5**

**Evidence**
- `#265` shipped: collapsed mini taps to now-playing, Channel Surfing on the first fold, More = overflow only, labeled Find, Pace caption, BPM/key on rows and `.MP3` files.
- 390×844 Home: hamburger + Find, glass hero (Live, CH bug, sleeve, LCD, seek, play, Pace), then stations, then Tonight, glass tab bar. Channel row still clips a fourth tile.
- Hero sleeve shrinks to `min(34vw, 120px)` under 430px — metadata wins, art loses.
- Desktop: 3-pane iTunes. Home stays 960. Immersive stays phone-proportioned.
- `.pmp-device-stage` (860px+) already wants sleeve + LCD side-by-side at poster scale and is unused by the live immersive layout.

**What's working**
- Phone can start music on first fold. Tabs are the map. Safe areas, 44px Find, reduced motion.
- Explore mobile: Directory title, LCD Find, Worlds sleeves stacking — crate, not a feed.

**Creative gaps**
- Hero is dense; art is small. The “MTV stage” is a card, not a screen.
- Dock is still a streaming island under the device.
- Desktop wastes the brief. A Y2K player on a desk should be the object, not a column.

**Specific recommendations**
- Mobile hero: one bigger sleeve *or* LCD, not both cramped — prefer sleeve + stacked LCD.
- Desktop: one device stage (existing CSS). Sidebar stays; content becomes the player + crate, full pane.

---

### 3.9 Design System Consistency — 7.0/10 · **2.1 / 3**

**Evidence**
- Single `theme.js`. Tests lock chassis stamp, canvas, IBM Plex, no mint phosphor, Pace not energy paddles (`src/styleShip.test.js`).
- DeviceChrome is shared (hero, immersive, dock, desktop mini).
- Leftovers: `y2k.cyan` = graphite, `IceOrbPlay`, `glass-dock`, `pill-nav`, `radius.pill`, DistroKid comments, `OnboardingRitual` (rooms) vs `TasteTuner` (stations).
- Club Guide is help-center cards. Library is Music.app. Explore is a crate. Home is a device. Four dialects, one metal.

**What's working**
- One token file can restyle the OS. LCD semantics (`lcdInk`, `lcdSignal`) are correct.
- Hardware key helper + jewel frame are reusable.

**Creative gaps**
- Names and comments still describe Aqua, ice orbs, DistroKid, Apple Music.
- CTA grammar fights hardware grammar.

**Specific recommendations**
- One PR to rename leftovers and point `BTN_PRIMARY` at hardware/LCD. No new dependency.

---

### 3.10 Technical Feasibility & Incremental Improvement — 9.0/10 · **1.8 / 2**

**Evidence**
- All P0/P1 are token, layout, and existing-component work: `ChannelCard` already has `covers`; `artFrameStyle`; `PlayerDeck`; `.pmp-device-stage`; `catalogSleeveUrl`.
- No new libraries required. Lucide is already there; custom marks exist for timed mix / planet.
- Engines, billing, Club, routing, recommendation Pace are preserved.

**What's working**
- The product can leap in identity without an IA rewrite. `#265` proved incremental UX shipping.

**Creative gaps**
- None that are technical. Risk is costume-chasing (`#236`). Stay on steel + ice.

**Specific recommendations**
- Implement against this scorecard in small PRs: channels, dock/CTA, desktop stage. Do not restyle the whole OS again.

---

## 4. Top 10 Strengths

1. **The hero is a player, not a banner.** Live LED, planet pip, CH bug, jewel sleeve, ice LCD, hardware deck, Pace. This is the brief in one object.
2. **Firmware metadata is real.** BPM, Camelot, energy, bitrate, album, format sit on a smoked LCD with scanlines — not chips on a SaaS card.
3. **Login lockup is collectible.** Ringed planet, italic MP3, `YOUR WORLD, YOUR MUSIC.` First impression is Planet, not a streaming signup.
4. **Explore’s `.MP3` folder is instantly legible** and unmistakably early-digital (`01  DEEP_FLOOR.MP3`).
5. **Charts podium treats the #1 sleeve as a poster** — MTV countdown, not a table.
6. **Crate spread (`#01` 2×2)** is a magazine grid, not an App Store rail.
7. **Club membership card** (name, `#000098`, joined, shelf, vinyl stamp) is a record-club object.
8. **Onboarding is a tuner.** CH-01… plates, “Tap up to three,” drop onto the first station.
9. **Shared DeviceChrome** means hero and immersive speak one hardware language. `#265` made the mini open the real player.
10. **One steel chassis** with ice LCD contrast fixed, reduced motion honored, no extra animation libraries.

---

## 5. Top 10 Creative Gaps

1. **Channel Surfing is pictogram OS.** The first browse row is iTunes genre icons, not records. Music-first fails here.
2. **DistroKid lime→blue is the brand signal.** Play, Live, Sign in, Play set, Play this chart. That is another company’s trim on Planet’s metal.
3. **Desktop is iTunes 7.** Source list + 960px Home + phone immersive. The extra canvas is unused aluminum.
4. **Dock is Apple Music.** Frosted island, Lucide tabs, 40px thumb. Documented historically as such; `#265` fixed behavior, not costume.
5. **Library is Music.app.** Mosaic playlists, search field, sort chips, plus button. Least Planet surface.
6. **Album art is not primary on Home’s first shelf, Energy, Mix empties, or desktop now-playing.**
7. **Planet mark is splash-only.** Mobile Home has hamburger + Find; no wordmark. Mascot is a 26px pip.
8. **Tonight “2 blocks” TV guide** is broadcast leftover that fights the MP3-player metaphor.
9. **Token names lie** (`y2k.cyan` = graphite, `IceOrbPlay`, `glass-dock`) so the team keeps designing the previous movie.
10. **Mix wheel and Energy rooms under-use sleeves**, so the most original discovery modes look like settings.

---

## 6. P0 — Essential

Highest identity + usability impact. No new dependencies. Preserve engines, IA, Club, billing.

### P0.1 — Sleeve-led Channel Surfing

The first browse row must look like music. Use catalog sleeves (or a 4-up mosaic) as the tile; keep pixel plates as a `CH-04` LCD bug only. `ChannelCard` already accepts covers; `catalogSleeveUrl` already exists. Active ring = ice, not DistroKid blue.

### P0.2 — Play + dock as a faceplate, not DistroKid / Apple Music

Restyle `BTN_PRIMARY` and `PlayKey` as steel + ice (hardware key / LCD pip). Mini dock: LCD title strip + hardware play + jewel 40px, tabs as device selector keys. Same `PlayerDeck` DNA at 56px tall. Do not expand a second deck.

### P0.3 — One listening object on desktop

Honor `.pmp-device-stage`: sleeve poster + LCD + deck as the Home/immersive stage. Stop boxing Home at 960px while the sidebar pretends to be iTunes. Sidebar can stay; it should look like a source *device*, not Music.app.

### P0.4 — Ice LCD is the only chromatic brand voice

Keep LIVE red. Retire lime→teal→blue as identity. Phosphor already exists (`color.lcdSignal`, `radio.lcdFill`). Point trim, active art, play glow, and primary CTAs at it — or at steel with ice inscription.

---

## 7. P1 — Important

1. Mix wheel: sleeve chip on lit pads; caption stays “Twelve keys. Neighbors mix.”
2. Energy rooms: one sleeve or pressure meter per zone.
3. Library default: wallet / CoverFlow / crate — keep list as a mode.
4. Search empty: LCD directory (scenes + keys), not a blank utility field.
5. Mobile Home: Planet lockup or `PLANET / 003` in the header beside Find.
6. Artist/Album: poster hero in the same jewel+LCD grammar as Explore folder.
7. Demote or fold Tonight’s “2 blocks” into the hero LCD (“ON AIR · MOST REQUESTED”).
8. Chat: ship the AIM window as a station messenger *on* the device, not a floating SaaS card.

---

## 8. P2 — Polish

1. Rename leftovers: `IceOrbPlay`, `glass-dock`, `pill-nav`, `y2k.cyan`, DistroKid comments.
2. Hardware key click (scale already there) + seek-tick haptic.
3. Jewel-case thickness on `ArtFrame` (spine light, not more shadow).
4. Club card: print a sleeve or member glyph in the vinyl well when the shelf is `0`.
5. Scanline opacity only on LCD; never on sleeves.
6. Sidebar selected row as LCD well, matching Explore mode tabs.

---

## 9. If I could only implement five changes, they would be:

1. **Make Channel Surfing sleeve-led** (catalog art + CH LCD bug) so the first browse row is music, not Game Icons.
2. **Restyle play + the mini dock as one tiny steel/LCD faceplate** — ice pip, no DistroKid halo, no Apple Music island.
3. **Retire DistroKid lime→blue as brand trim**; ice phosphor is the only signal besides LIVE.
4. **Put one poster-scale listening object on desktop** (existing `.pmp-device-stage`) instead of iTunes 7 + a 960px card.
5. **Put sleeves on Mix pads and Energy zones** so the most original discovery modes look collectible, not like settings.

---

*No product code was changed for this audit. Implement against P0 in small PRs; do not restyle the chassis again.*
