# PlanetMP3 — Creative & UX Audit (V2)

**Date:** 18 September 2026  
**Chassis scored:** `STYLE_CHASSIS = steel-chrome-20260918` (`src/theme.js`, `public/index.html`, committed `build/`)  
**North star:** *A futuristic MP3 player from Y2K* — playful, collectible, music-first, unmistakably PlanetMP3. Not Spotify, Apple Music, or generic SaaS.  
**Method:** Code review of Home, Explore, Library, Club, Search, player surfaces, tokens, and motion; live inspection of `#broadcast-preview`, `#player-preview`, `#explore-preview`, `#onboarding-preview`, `#guide-preview-club`, `#chat-preview`, and `/` at desktop (~1280×900) and mobile (390×844). **No product code was changed for this audit.**

**This document replaces the earlier V2 scorecard**, which scored `steel-y2k-20260918` (61/100) before `#239` unified the OS onto cool chrome steel. Related but not this scorecard: `docs/STEEL_Y2K_AUDIT.md`, `docs/CREATIVE_DIRECTION_AUDIT.md` (stale acid/Aqua notes), `docs/UX_AUDIT.md` (ergonomics/a11y), `docs/PLANETMP3_UI_AUDIT.md`.

**Recent chassis history (do not re-litigate blindly):** Acid LCD (`#234`) → Steel Y2K (`#235`) → PS1 Discman costume (`#236`, orange phosphor + purple void + Space Grotesk) → **reverted** (`#237`) → Steel Y2K V2 scorecard (`#238`) → **Steel-chrome one-metal OS** (`#239`, this audit).

Screenshots from this pass: `docs/audits/creative-ux-v2-chrome/`.

---

## 1. Executive Summary

PlanetMP3 is not a Spotify clone. It is also not yet the product the V2 brief describes.

`#239` did the right *engineering* move: one cool steel chassis instead of a pearl page, a black Music.app rail, and a dark player object fighting each other. LCD titles now use `color.lcdInk` (`#D8DFE8`) on a smoked well. The sidebar is aluminum. Camelot KEYS render as real plates. Channel tiles *can* lead with catalog sleeves. Turtle / Bunny stay labeled. That is incremental progress.

What the eye actually meets is still **iPod Mini / iTunes 7 on the web**: canvas `#C5CBD6`, graphite accent `#5B6574`, Game Icons on brushed plates, a phone-width Home column in a three-pane desktop, and an immersive player that is a sleeve floating in a brushed-metal blur field. The listening object is real. The *culture* around it is pictogram OS, not record-shop / Winamp / early-web / underground magazine.

The brief asks for **modern product design × early digital music culture**, with **PS1 interface grammar** (panels, overlays, compact HUD, sharp radii), **bold type + technical metadata**, **device-inspired controls**, and **album artwork as the primary visual**. Steel-chrome delivered the *materials of a 2003 Apple player* and retired every LED. That is historically premium and culturally the wrong Planet. It reads as **iPod Mini night-and-day**, not as an alternate-2003 bootleg firmware.

**Do not** ship another Discman costume (orange phosphor, purple CRT, display-font swap). `#236` already proved that path. The next identity leap is **steel as metal, phosphor as LCD only, sleeves as culture, one player drawing at three sizes.**

**Verdict:** Keep IA, engines, Club, DeviceChrome, labeled paddles. Do not rebuild. Put a real phosphor readout on the existing well, fill the desktop stage with one device, and stop letting Game Icons impersonate album art.

**Overall score: 64 / 100**

Band: **Improve** (+3 vs the steel-y2k V2). Cohesion and LCD contrast moved; originality and artwork-as-culture did not.

Approximate mix today: **45% light iPod / iTunes 7 shell · 25% hardware/LCD tokens · 15% broadcast/station vocabulary · 10% underground metadata · 5% Planet lockup/splash.**  
Target mix: **40 / 25 / 20 / 15** (modern × Y2K device × underground × Planet).

---

## 2. Overall Score (/100)

| Category | Score (/10) | Weight | Weighted |
|---|---:|---:|---:|
| Brand Identity & Originality | 5.5 | 20 | 11.0 |
| Music Discovery & User Experience | 7.5 | 15 | 11.3 |
| Music Player & Playback Experience | 7.5 | 15 | 11.3 |
| Visual Language (Colour, Typography, Layout) | 5.5 | 15 | 8.3 |
| Interface & Interaction Design | 6.5 | 10 | 6.5 |
| Artwork & Editorial Presentation | 5.0 | 10 | 5.0 |
| Motion & Micro-interactions | 6.5 | 5 | 3.3 |
| Mobile & Responsive Experience | 7.0 | 5 | 3.5 |
| Design System Consistency | 6.5 | 3 | 2.0 |
| Technical Feasibility & Incremental Improvement | 9.0 | 2 | 1.8 |
| **TOTAL** | | **100** | **64** |

Scoring: **9–10 preserve · 7–8 refine · 5–6 improve · 0–4 redesign priority.**  
Weighted = `(score / 10) × weight`.

---

## 3. Detailed Scorecard

### 3.1 Brand Identity & Originality — 5.5/10 · **11.0 / 20**

**Evidence**
- Distinct nouns: crate, stacks, cuts, Channel Surfing, On Air, dedicate, Club, member numbers, `PLANET / 003`, Turtle / Bunny (`EnergyShiftButton.jsx`).
- Tagline `YOUR WORLD, YOUR MUSIC.` (`src/brand/identity.js`). Login is the most Planet surface in the product: spinning-planet lockup, wordmark, Beta chip, steel card (`docs/audits/creative-ux-v2-chrome/login-desktop.png`).
- Live Home (`#chat-preview`): steel source list + pearl-steel stage + messenger + aluminum hero. Channel tiles are Game Icons on steel plates — original drawings, **iTunes genre-icon grammar**.
- Theme header: “Acid green, Aqua, and black/white splits are retired.” Tests lock accent to `#5B6574` and canvas to `#C5CBD6` (`App.test.js`).
- `#236` PS1 Discman (orange `#FF6A2B`, purple void, Space Grotesk) shipped and was reverted (`#237`) because it read as costume, not Planet.
- Lottie mascot exists (`PlanetMascot.jsx`) and barely appears after login. Club Guide still says “The beaker guides what plays next” (`src/lib/featureGuide.js`) while transport is Turtle/Bunny.

**What's working**
- The *words* are Planet. Nobody else says “Flip the dial. Music stays on this stage.”
- Login / splash carry a collectible mark. Hardware keys + LCD + catalog mark are a brand object in embryo.
- Club as a record club (membership card, vinyl groove stamp, credits) is closer to the brief than a settings dump.
- Onboarding (“Tune the stations that sound like you” + CH-01 plates) feels like programming a device, not picking Spotify genres.

**Creative gaps**
- Signature colour in the brief is a **phosphor**. Shipped colour is **Apple graphite on aluminum**. The product currently looks like **iTunes 7 / iPod Mini on the web**, not an alternate-2003 Planet device.
- Identity is chrome (header, splash, bugs), not destinations. Explore is Apple Music Browse with gray pictogram posters. Library is Music.app playlists.
- Dual personality leftover: firmware voice on the device vs App Store “See All” / “Pick a genre” on the page.
- Mascot and planet are boot theatre. The listening OS does not carry them. Guide copy still narrates a flask that the Home hero no longer shows.

**Recommendations**
- Treat **steel as metal** (keys, bezels, page) and **phosphor as LCD only** (glyphs, pip, progress, focus). Do not flood CTAs and sidebar rows with green or orange paint. Do not revive `#236`.
- Put catalog firmware on the player and dock (`PLANET / 003`, member number), not only Home `h1`.
- Pictograms are *channel bugs*, never the hero image and never `albumCover`.
- Replace “beaker” Guide copy with Turtle / Bunny so the product tells one story.

---

### 3.2 Music Discovery & User Experience — 7.5/10 · **11.3 / 15**

**Evidence**
- Home order: **device first** → one `CrateSpread` (skipped in broadcast preview when editorial is empty) → Channel Surfing → Tonight EPG → Most Requested rail → remaining `buildHomeCollections` rails (`HomeScreen.jsx`).
- Explore: Mixmag-scale `ExploreHero`, genre mosaic, mood/scene rails, search entry (`ExploreScreen.jsx`). Live preview hero is the **Local tree pictogram**, not a sleeve (`explore-desktop.png`). Camelot **KEYS** now render as **5A / 8A / 9A LCD plates** — the empty-square bug from the steel-y2k V2 is gone.
- Power grammar: BPM / Camelot / energy search (`SearchScreen` hint chips, `harmony.js`, `EnergyRecommendationEngine.js`).
- Scene channels, countdown, hypno/near-this, dedicate, program guide — real differentiators.
- Search is not a dock tab; it hangs off Explore. Four primary tabs: Home / Explore / Library / Club (`nav.js`).

**What's working**
- Discovery is **station-first**, which is the right Planet model (not an infinite For You feed).
- Crate spread is the first true record-shop module: lead sleeve + stacked cuts + LCD bits on the lead.
- Explained picks, empty-state voice, and “Listen in this lane” keep trust high.
- Onboarding is on-brand. Four tabs is the right count. KEYS on Explore is the right power-user affordance.

**Creative gaps**
- After the crate, Home reverts to **equal snapping rails** and “See All” — App Store / Music.app grammar (`MusicSection` `type.seeAll`).
- Channel Surfing is still a **horizontal equal-tile strip**. First tile is slightly larger (`featured`), but the visual is still iTunes genre icons. Preview fixtures set `albumCover` to `CHANNEL_ART`, so mosaics are drawings of drawings.
- Harmonic map lives as three tiny KEYS chips above a pictogram hero — easy to miss, unfinished as a crate index.
- Vocabulary (stacks, cuts, Near this) still under-glossed for first session (`docs/UX_AUDIT.md`). Library does gloss “Stacks — your playlists” (good). Club Guide still mentions the beaker.
- Dual chrome on desktop: source list *and* (on mobile) a floating pill dock. Muscle memory differs by breakpoint.

**Recommendations**
- One crate or mosaic per destination; rails become overflow, not the page.
- Channel Surfing: one featured dial (art-forward sleeve) + compact bugs; keep equal tiles as the rest of the strip.
- Stop using Game Icons as `albumCover` in previews and idle states. Sleeve-first code already exists (`ChannelCard`, `sleeveFirstVisual`).
- Keep four tabs. Gloss Stacks / cuts / Near this once. Do not add destinations.

---

### 3.3 Music Player & Playback Experience — 7.5/10 · **11.3 / 15**

**Evidence**
- Shared `DeviceChrome`: `LcdPanel`, `LcdSeek`, `LcdMetaLine` (`trackLcdBits` → BPM, Camelot, `E#`, **MP3 / bitrate**), `HardwareIconButton`, scanlines, catalog mark.
- Transport row: Turtle · Prev · `PlayKey` · Next · Bunny, with `showLabel` / `±10 BPM` on Home hero. Immersive shows TURTLE / BUNNY without the ±10 caption (`player-desktop.png`).
- `hideDockPlayer = false` (`App.jsx`) — dock is always on. Desktop `.pmp-device-stage` two-column from 860px (`index.css`) — live `#player-preview` uses it, but the stage is still a modest sleeve + LCD strip in a huge metal bloom.
- Plumbing is excellent: crossfade, Media Session, unlock, playback store, shuffle/repeat/volume, session resume (UX audit).
- Seek: custom 3×12px LCD thumb on `.chrome-seek`. Generic `input[type=range]` still has a **14px round iOS thumb** (volume, taste). Live immersive volume is that round groove at the bottom.
- LCD title colour is `color.lcdInk` on `radio.lcdFace`. Live Home/Explore: **Night Drive** is readable; metadata `118 BPM · MP3 · AFTERGLOW · ELECTRONIC` hits. Immersive **artist** still uses `color.body` (`#4E5866`) on the dark well — muddy “Signal” (`ImmersivePlayer.jsx`).
- `LcdMetaLine` always paints `lcdInk` (`#D8DFE8`). On the **light** dock / desktop mini (`radio.stripFace`) that inverts to light-on-light.
- Idle / preview art is the lockup or a music-note pictogram, not a sleeve (`HERO_IDLE_ART`, `PlayerPreview` `SAMPLE_COVER`).

**What's working**
- Closest surface to the brief. Firmware metadata, labeled paddles, LIVE, catalog mark, hardware play key.
- Energy shift as a first-class transport gesture is original and underground (DJ-adjacent, not a smart shuffle).
- Artwork window + LCD stack is the right canonical drawing. Bitrate/MP3 mark is in the LCD bits.
- LCD *title* contrast on the well is fixed vs steel-y2k V2. That was the highest-severity readout bug; it is no longer graphite-on-graphite for titles.

**Creative gaps**
- Three drawings, not one: Home **aluminum card**, immersive **phone theater in a metal bloom**, dock **streaming strip**.
- Desktop immersive wastes ~50% of the stage around a ~320px sleeve and a detached transport (`player-desktop.png`).
- LCD is a device well without a **signal colour**. Glyphs are chrome-on-graphite, not phosphor. Artist line on immersive is page ink on the well.
- Dock meta line and dock times can vanish against the light strip.
- PlayKey unlit is a silver plate (readable). Glowing play is filled graphite — looks like a selected iOS control, not a lit hardware key.

**Recommendations**
- Canonical device reused at immersive / hero / dock / mini — tokens only, no new IA. Desktop: art | LCD+keys filling ~80% width, transport attached to the chassis, not a separate footer in a void.
- LCD glyphs: off-white / phosphor on the dark well. Artist uses `lcdMute`, never `color.body`. Accent on LCD = signal, not `#5B6574` filling a key.
- `LcdMetaLine` needs a surface-aware ink (well vs strip).
- Custom seek thumb already exists for `.chrome-seek`; keep it 2–4px. Do not let the generic round thumb leak onto volume.
- Playing sleeve colours the bloom; phosphor should not compete with the cover.

---

### 3.4 Visual Language (Colour, Typography, Layout) — 5.5/10 · **8.3 / 15**

**Evidence**
- Canvas `#C5CBD6`, ink `#3D4654`, silver `#A8B2C0` / `#D8DFE8`, graphite accent `#5B6574`. **Matches 2003 Apple aluminum. Fights the brief’s PS1 × playful × collectible mix.**
- Type: IBM Plex Sans + Mono (`public/index.html`). `type.lcd` 11px / tracking 0.12 / uppercase. Home `h1` is 22px under `PLANET / 003`.
- Layout: Home `maxWidth: 960`; Explore hero `borderRadius: 10`; dock `borderRadius: 12`; `radius.pill = 980` still in the API.
- Channel tiles: steel plates with black pictograms — a **paper/iTunes OS** sitting under a device.
- Live inspection: sidebar = steel module (improved vs black Music.app); page = cool aluminum; player = same metal + smoked LCD. One material, still Apple.

**What's working**
- One cool-metal *stack* is the right chassis for firmware. Not Inter-SaaS, not costume Lucida, not the reverted Discman Grotesk.
- Hairline bezels and metal key faces (`hardware.keyRaised`) already describe a device.
- Onboarding typography (bold Plex, CH-xx) is the most Planet layout in the product.
- `#239` killed the light-page / dark-device / black-rail split. That cohesion is real.

**Creative gaps**
- **Colour is the brief’s primary brand lever and it is pointed at Apple.** Cool steel + graphite = iPod Mini. Acid-on-LCD + steel metal = Planet. Orange-on-purple = the Discman that got reverted — do not go there.
- 22px product title still competes with firmware eyebrow — better, not solved.
- Pill radius 980 vs hardware 6–8px = two products in the token file.
- Cream/steel pictogram squares bleach the first cultural impression (Home Channel Surfing, Explore hero, genre mosaic, onboarding).
- Explore search field is a rounded iOS capsule (`radius.lg`) with leftover `rgba(28,32,40,…)` hover.

**Recommendations**
- Keep steel metal. Add **LCD phosphor** (`#B8F24A` or a quieter lime) on glyphs, pip, progress, focus **only**. `onAccent` near-black. Live stays red. **Do not** fill sidebar/tabs with green.
- Masthead: compact wordmark + `PLANET / 003` as the title; drop competing marketing-size type.
- Channel plates: dark metal + coloured pictogram *bug*, or sleeve mosaic; stop iTunes icons as the first Home/Explore impression.
- Radius floor: 4 / 6 / 8 / 12. Kill pills on transport, search chips, energy menus.

---

### 3.5 Interface & Interaction Design — 6.5/10 · **6.5 / 10**

**Evidence**
- Hardware keys (`hardwareKey`, `chromeIconButton`) vs leftover glass pills (`.pill-nav`, `.pill-tab`, `glassPill`).
- Bottom nav: 11px labels, steel wash, radius 14 container — **iOS tab bar on a Discman page** (`App.jsx` `.pill-nav`). On 390px it sits on top of Channel Surfing (`home-mobile.png`).
- Keyboard shortcuts, queue editing, like-pop, press classes — UX audit items shipped.
- Hero is a giant `role="button"` opening the player; inner controls `stopPropagation`.
- Desktop: sidebar + content + messenger + mini-player. Admin is off the consumer dock (`nav.js`) — good.
- Selected sidebar row is a pip + wash, not a filled Aqua capsule. Sidebar face is `radio.moduleFace`, not black.

**What's working**
- Pressed metal keys feel tactile. Reduced motion is global.
- Four consumer destinations is the right count.
- Long-press on Bunny/Turtle for ±5/10/20 BPM is a power-user gift.
- Desktop source list is finally the same metal as the page (steel-y2k V2’s black rail is gone).

**Creative gaps**
- Desktop shows **sidebar + messenger + mini-player** — three chrome systems. Reads iTunes 7 / SaaS, not a handheld (`home-desktop.png`).
- Nav is still a phone tab bar glued onto a light iOS page.
- Hit-target density on Home hero (paddles + seek + like + open-player card) plus dock overlap on small phones.
- Club settings strip is a segmented iOS control. Fine, not a device selector.
- Energy flask animations and `IceOrbPlay` alias still describe a previous product.

**Recommendations**
- Desktop: steel source list + persistent mini-device; messenger as a *module*, not a third OS.
- Mobile: keep the dock; make it the mini-device, not a second tab chrome covering the next band.
- Search/energy chips as LCD plates (radius 4), with ink that matches the plate.
- Energy menu: light glyphs on the dark plate (same LCD rule).

---

### 3.6 Artwork & Editorial Presentation — 5.0/10 · **5.0 / 10**

**Evidence**
- Shared `ArtFrame` / `artFrameStyle` — 6px jewel.
- `ChannelCard` comments: “Catalog sleeves first; Channel Surfing pictogram is a corner bug.” Live preview: **every sleeve is a Game Icon**, because fixtures set `albumCover` to `CHANNEL_ART` (`BroadcastPreview.jsx`, `ExplorePreview.jsx`).
- Explore hero: full-bleed photography *intended* (`ExploreHero.jsx`); live preview shows **Local tree** with scanline wash.
- Home crate: 220px lead + stacked cuts + LCD bits (`CrateSpread.jsx`) — present in product Home, absent from broadcast preview when editorial is empty.
- Hero sleeve 240px (`JewelSleeve`); immersive sleeve `min(72vw, 320px)` — then drowned in blur. Idle art is `HERO_IDLE_ART` (iPod music-note pictogram).
- Club: membership card / collector panel / vinyl groove stamp — collectible in concept (`ClubScreen.jsx`). Guide tab is a settings list, not a card (`club-guide-desktop.png`).
- Player idle often shows lockup (`/brand/planet-mp3-lockup-on-black.png`).

**What's working**
- Sleeve-first *code* is in place. When production covers are real Discogs/Last.fm art, Channel tiles and genre plates can mosaic them.
- Mosaic language exists for stacks and genres.
- Video stage is a real dark rectangle, not a rounded thumbnail.
- Club card (vinyl rings + embossed member number) is the collectible object the brief wants.

**Creative gaps**
- Default discovery — including the designed idle and the shipped preview catalog — is **pictogram culture**, not record culture. First image on Home, Explore, onboarding, and the player is a drawing.
- Using channel icons as `albumCover` teaches the OS that a tree *is* a sleeve. That will leak into mosaics even when some real covers exist.
- No magazine spread (pull quote, liner, credits) on Home; liner notes exist as a sheet (`LinerNotesSheet`).
- Explore subtitle promises “Stations, scenes, and sleeves” and then shows a tree.

**Recommendations**
- Lead every destination with one oversized **sleeve or photo**. Pictograms are bugs, not heroes, not `albumCover`.
- Preview fixtures must use distinct sleeve images (even placeholders), or the next designer will ship drawings as culture.
- Pull one liner/credit line onto the crate lead.
- Playing sleeve colours the chassis; phosphor only on LCD/progress/pip.

---

### 3.7 Motion & Micro-interactions — 6.5/10 · **3.3 / 5**

**Evidence**
- Documented principles: rhythm over bounce, reduced motion (`src/motion/tokens.js`, `index.css`).
- Live LED, dock rise, like pop, trackSwap 320ms, LCD pip pulse, planet spin, Explore Ken Burns 32s, sleeve crossfade class.
- LCD marquee **8s** linear (`index.css` `.pmp-lcd-marquee`) — steel-y2k V2 asked for this; it is shipped.
- Energy `PRESS_EASE` is `motion.ease` (bounce retired).
- `.pmp-lift:hover { transform: none }` — lift is press-only.
- Flask steam/bubble loops still live in `App.jsx` for leftover flask buttons.

**What's working**
- Motion is mostly calm and music-adjacent. Reduced motion is respected.
- Scanline wash on LCD / Explore hero is the right *kind* of artifact (subtle, local).
- Key press language is closer to hardware than to App Store bounce.
- Marquee speed is now in the digital-display range.

**Creative gaps**
- Ambient loops (planet, Ken Burns, live dot, flask steam) can out-talk the track.
- No tactile *click* on hardware keys beyond shadow invert.
- Seek lacks LCD digit ticking.
- 12s art bloom on immersive is Apple Music, not a deck.

**Recommendations**
- Fast digital: progress fill, pip, 200–350ms sleeve crossfade, overflow marquee ~8s (keep).
- Gate ambient animation to playing + visible.
- Key press = 1px inset, not scale.
- Retire flask loop CSS if Turtle/Bunny is the control.

---

### 3.8 Mobile & Responsive Experience — 7.0/10 · **3.5 / 5**

**Evidence**
- Safe areas, dock insets, compact dock extras (`dock-xtra` hidden below 430px), Home 960 / Explore breakpoints 720 / 1100.
- 390px Home: masthead + hero device actually **reads as a handheld** (`home-mobile.png`). LCD, LIVE, PLANET/003, CH-04 LOCAL, Turtle/Bunny all fit. This is the best Planet composition in the product.
- Bottom nav covers the Channel Surfing title in the first viewport. Full-page capture shows the band is reachable after scroll (`broadcast-mobile-full`).
- Desktop broadcast: sidebar + 960 stage + messenger — iTunes three-pane, not “destination scale.”
- Immersive two-column CSS exists; live `#player-preview` still felt like a phone floating in a gray field. Mobile immersive is a stacked Discman and works.

**What's working**
- Phone shell is considered (safe area, tap sizes, dock rise). The *device* actually fits a phone better than a desktop.
- Explore uses the wide canvas (hero + mosaic) without breaking.
- `hideDockPlayer` split is gone — one always-on mini transport.
- Crate collapses to one column below 560px.

**Creative gaps**
- Home on desktop is a phone column with extra gutters + a source list + a chat column.
- Dock collision with the next Home band on small phones (title clipped).
- Mini-player / immersive not a smaller drawing of the same device.

**Recommendations**
- Below 720px: one column, persistent mini-device, Channel Surfing as a peeking rail that isn’t covered (raise `paddingBottom` / shrink dock / peek the next title).
- `≥860`: Home as stage (hero device full width) + crate grid; steel sidebar; messenger as overlay.
- Immersive desktop: art | LCD+keys filling ~80% width, less blur void.

---

### 3.9 Design System Consistency — 6.5/10 · **2.0 / 3**

**Evidence**
- Real token file: `color` (including `lcdInk` / `lcdMute`), `radio`, `hardware`, `type`, `homeSpace`, `broadcast`, `BTN_PRIMARY`.
- Names still lie: `y2k.offWhite` = `#3D4654`; `y2k.cyan` / `neon` / `techBlue` = graphite; `IceOrbPlay` alias; `glass-dock` class on a metal strip; `.pill-nav` is a steel bar.
- `CREATIVE_DIRECTION_AUDIT.md` still narrates acid-device in places; previous V2 scored steel-y2k. Tests named for steel-chrome, locking graphite, forbidding acid.
- `#239` aligned EmptyShelfCard, Club settings strip, and Search chips onto steel plates. The four-dialect split (pill / hardware / cream pictogram / dark leftover) is narrower.

**What's working**
- One token file is enough to restyle the OS without a new dependency. `lcdInk` is the correct semantic after the steel-y2k inversion.
- DeviceChrome is the start of a real component kit.
- Style assert script stamps `steel-chrome-20260918` into boot HTML + committed `build/`.
- Hardware radii (6–12) are mostly honored on keys and LCD.

**Creative gaps**
- `LcdMetaLine` assumes a dark well. Dock/mini are light. Surface-blind tokens will keep regressing contrast.
- Stale docs (`CREATIVE_DIRECTION_AUDIT.md`) will cause the next PR to design the previous movie (Aqua, acid-everywhere, or Discman).
- `radius.pill` still in the public API.
- Flask / IceOrb / pill class names describe three retired products.

**Recommendations**
- Keep `lcdInk` / `lcdMute` for wells. Add `stripInk` for the dock, or pass a tone into `LcdMetaLine`.
- Document the kit: Panel, LCD, Key, Sleeve, Bug, Crate, Nav selector.
- Deprecate `radius.pill` for product UI.
- Align this V2 doc as the current scorecard so the next PR does not re-introduce Aqua, Discman orange, or flask-as-tempo.

---

### 3.10 Technical Feasibility & Incremental Improvement — 9.0/10 · **1.8 / 2**

**Evidence**
- `#239` restyled the entire OS onto one metal without an IA rewrite. Player restyle, crate, LCD, pictogram plates, always-on dock already landed as incremental PRs.
- Accent / LCD ink is mostly `theme.js` + assert script + leftover hexes (`ExploreScreen` still has `rgba(28,32,40,…)`).
- No new libraries required. Constraints (preserve playback, routing, Club, billing, engine) are compatible with this audit.
- Remaining risk: `App.jsx` size, native range styling, catalog bitrate field (UI already falls back to `MP3`), **not repeating `#236`**, and not treating Game Icons as album art in fixtures.

**What's working**
- The team can ship identity in place. That is rare and should dictate the roadmap. Steel-chrome proved the chassis can move in one PR.

**Creative gaps**
- None that justify a rewrite. The gap is *choosing LCD phosphor on steel metal, one player drawing, and sleeves as culture.*

**Recommendations**
- Highest impact, lowest risk: phosphor as LCD-only signal; immersive two-column actually filled; artwork-first Channel/Explore heroes; dock as mini-device; `LcdMetaLine` surface tone.
- Do not add animation libraries, new fonts, or a component framework.
- Do not re-implement Discman orange / purple void / Space Grotesk.

---

## 4. Top 10 Strengths

1. **Station-first product** — Channel Surfing, On Air, program guide, not a faceless For You feed.
2. **DJ-grade engine in the UI** — BPM, Camelot, energy 1–10, Turtle/Bunny actually change upcoming picks.
3. **DeviceChrome is real** — LCD, scanlines, hardware keys, catalog mark, shared across hero / immersive / dock.
4. **Labeled Turtle / Bunny** — the most Planet control is first-class on Home (`±10 BPM`).
5. **IBM Plex Sans + Mono** — firmware voice, not Inter, not costume Lucida, not the reverted Discman Grotesk.
6. **One cool-metal OS** — `#239` killed the pearl/black/dark split; sidebar, page, and hero share aluminum.
7. **LCD title contrast is fixed** — `lcdInk` on the well. Metadata finally says `118 BPM · MP3 · AFTERGLOW`.
8. **Camelot KEYS on Explore** — real LCD plates (5A / 8A / 9A), not empty gray squares.
9. **Phone hero is a handheld** — LIVE, PLANET/003, CH ident, sleeve window, LCD, paddles. This is the brief, at 390px.
10. **Original vocabulary + Club card** — crate, cuts, stacks, dedicate, PLANET/003, vinyl membership stamp. Protect this; gloss it, don’t kill it.

---

## 5. Top 10 Creative Gaps

1. **iPod Mini / iTunes 7 as the OS** — cool steel + graphite + Game Icons. Unmistakably Apple, not Planet.
2. **No phosphor** — acid retired, Aqua retired, Discman orange reverted; LCD has chrome glyphs, not a signal LED.
3. **Pictograms as the first cultural image** — Channel Surfing, Explore hero, genre mosaic, onboarding, idle player. Fixtures even set `albumCover` to `CHANNEL_ART`.
4. **Three player drawings** — aluminum Home card vs blur-void theater vs strip; desktop immersive wastes the stage.
5. **Streaming shell layout** — four-tab dock + iTunes source list + App Store rails + messenger column.
6. **Surface-blind LCD meta** — `LcdMetaLine` light ink on the light dock; immersive artist uses `color.body` on the well.
7. **Mobile dock collision** — hardware tab bar covers Channel Surfing on 390px first viewport.
8. **Mascot/planet splash-only** — personality does not survive into the listening OS.
9. **Guide still says “beaker”** — leftover flask story while transport is Turtle/Bunny.
10. **Pill / alias leftovers** — `radius.pill = 980`, `IceOrbPlay`, `glass-dock`, `y2k.cyan` = graphite.

---

## 6. P0 (Essential) Improvements

Preserve playback, routing, Club, billing, recommendation engine. No new dependencies. **Do not revive `#236` Discman costume.**

1. **Phosphor on LCD only** — `color.accent` for *LCD roles* (glyphs, pip, progress fill, focus, selected pip) can be acid `#B8F24A` without painting the aluminum page or sidebar green. Metal keys stay silver. Live stays red. This is not “Spotify green” if it never fills a capsule.
2. **One player drawing** — art window + LCD (title, BPM, Camelot, time, MP3) + Turtle / Prev / Play / Next / Bunny. Apply to immersive, hero, dock, desktop mini via existing `DeviceChrome`. Desktop immersive fills ~80% width; transport stays on the chassis.
3. **Artwork-first culture** — Home/Explore lead with a sleeve or photo; Channel pictograms become bugs. Stop logo-as-art, tree-as-hero, and `CHANNEL_ART` as `albumCover`.
4. **LCD ink that matches the surface** — artist on the well = `lcdMute`; dock meta = page ink or a recessed mini-well. Titles already work — don’t regress them.
5. **Mobile dock vs content** — the next Home band title must remain visible; dock is the mini-device, not a lid.
6. **One chrome system on desktop** — steel source list + persistent mini-device. Messenger as a module / overlay, not a third OS.

---

## 7. P1 (Important) Improvements

1. Masthead: firmware lockup over competing marketing title.
2. Channel Surfing: featured station sleeve; mosaic of catalog art inside bugs.
3. Crate/mosaic as default on Explore genres and Library stacks (pattern exists).
4. KEYS as a crate index, not three chips above a pictogram hero.
5. Search/energy chips stay LCD plates (radius 4) with matching ink.
6. Gloss “Stacks — your playlists”; extend to cuts / Near this once; replace Guide “beaker” with Turtle/Bunny.
7. PlayKey glowing: phosphor plate + dark inscription, not a filled graphite iOS control.
8. Volume/taste range: LCD thumb, not 14px iOS capsule.
9. Align `CREATIVE_DIRECTION_AUDIT.md` comments so the next PR does not re-introduce Aqua, Discman orange, or flask-as-tempo.
10. Preview fixtures: distinct sleeve images so designers cannot mistake Game Icons for covers.

---

## 8. P2 (Polish) Improvements

1. Keep LCD marquee ~8s; add tabular time ticks.
2. Key press 1px inset; no tile bounce on crate rows.
3. Rank/video as hairline bugs, not dark pills.
4. Mascot as a small dock pip or Club card stamp — not a second splash.
5. Liner sentence on crate lead.
6. Gate Ken Burns / planet / LIVE pulse to playing + on-screen.
7. Rename leftovers in a dedicated PR: `IceOrbPlay`, `glass-dock`, `pill-nav`, `y2k.offWhite`, `y2k.cyan`.
8. Club without a second hue — same metal + phosphor LCD.
9. Optional scanline only inside LCD (already the intent; keep opacity ~0.04).
10. Admin stays off the consumer dock (already true — protect it).

---

## 9. What “PS1 influence” means here (and what it does not)

The V2 brief asks for **PS1 interface with modern glassmorphism**. `#236` interpreted that as **orange phosphor, purple CRT void, Space Grotesk Discman**. That shipped and was reverted because it looked like a skin, not a product.

Use PS1 as **grammar**, not costume:

| Take | Leave |
|---|---|
| Overlay panels, HUD metadata, sharp 4–8px radii | Full-page CRT purple |
| Compact technical line (BPM / key / kbps) | Display-font swap |
| Device as the screen, not a card in a feed | Orange paint on every CTA |
| Pause / status as a bug in the corner | Fake BIOS boot every session |

Steel metal + dark LCD well + phosphor glyphs + sleeve window **is** that grammar. iTunes aluminum + cream pictograms **is not**.

---

## 10. Recommended Design System (incremental)

### Colour

| Role | Hex | Use |
|---|---|---|
| Void / page | `#C5CBD6` (keep) | App floor — metal, not nightclub |
| Chassis | `#D0D6E0` / `#D8DFE8` | Player body, dock, panels |
| LCD well | `#4A5360` → `#6A7482` | Recessed readout only |
| **LCD phosphor** | `#B8F24A` (or dimmer `#C6E86A`) | LCD glyphs, pip, progress, focus |
| On-phosphor | `#0C1008` | Text on glowing play key |
| Silver | `#A8B2C0` | Metal keys, secondary |
| Ink | `#3D4654` | Page text only — **not** LCD text |
| LCD ink | `#D8DFE8` | Titles on the well (already shipped) |
| LCD mute | `#A7B1BE` | Artist / secondary on the well |
| Strip ink | `#3D4654` | Meta on the light dock |
| Live | `#E0314A` | ON AIR / destructive |
| Artwork | track colour | Bloom / dock tint |

Until phosphor ships, **keep LCD titles `#D8DFE8`**. Do not put them on the light strip.

### Typography

- UI / titles: IBM Plex Sans 600–700. **No new webfont.**
- LCD / meta: IBM Plex Mono 11–13px, tracking 0.08–0.14em.
- Track titles: sentence case, never all-caps.
- Uppercase only on device labels: `ON AIR`, `BPM`, `BUNNY`, `TURTLE`, `PLANET / 003`.

### Spacing / radius / motion

- 4px grid; `homeSpace.gutter` 20.
- Radius **4 / 6 / 8 / 12**. Sleeves 4–6. Keys 8. Sheets 12 top. **No 980 on product controls.**
- Motion: 80–200ms chrome, 300–350ms sleeve, linear progress, no bounce.

### Components

- **Panel** — steel `radio.moduleFace` + hairline.
- **LCD** — `radio.lcdFace` + `ScanlineWash` + phosphor/light glyphs.
- **Key** — `hardwareKey`. **PlayKey** when glowing = phosphor plate.
- **Sleeve** — `ArtFrame`.
- **Bug** — LIVE / CH ident / pictogram corner.
- **Crate** — `CrateSpread`.
- **Nav** — device selector, steel, not an iOS tab bar covering the next band.

### Canonical player

```
┌─────────────────────────────────────────────────────┐
│  ON AIR · CH03                         PLANET / 003 │
│  ┌──────────────┐  TITLE (marquee if overflow)      │
│  │              │  Artist                           │
│  │   ARTWORK    │  124 BPM  ·  8A  ·  E7  ·  320K   │
│  │   (6px)      │  ████████████░░░░░  SEEK          │
│  └──────────────┘  01:14 / 03:42                    │
│  [TURTLE]  [PREV]  [ PLAY ]  [NEXT]  [BUNNY]        │
│   −10 BPM                                  +10 BPM  │
└─────────────────────────────────────────────────────┘
```

---

## 11. Highest-impact path (no rebuild)

**Pass 1 — Readout & one device (P0)**  
Phosphor on LCD roles; artist/`LcdMetaLine` surface tone; PlayKey contrast; immersive two-column actually filled; dock visually twins the hero and stops covering Channel Surfing.

**Pass 2 — Culture in front (P0/P1)**  
Artwork-first Channel/Explore heroes; crate remains Home’s second module; pictograms as bugs; preview fixtures use sleeves; Explore KEYS as a crate index.

**Pass 3 — One OS (P1)**  
Desktop hide three-pane energy; leftover flask/beaker copy gone; chips as plates.

**Non-goals:** new fonts, animation libs, extra tabs, Discman orange/purple, fake CRT wallpaper, IA rewrite, Spotify-style For You.

---

## 12. Screenshots (this pass)

| File | Surface |
|---|---|
| `docs/audits/creative-ux-v2-chrome/login-desktop.png` | Login / lockup — strongest Planet mark |
| `docs/audits/creative-ux-v2-chrome/home-desktop.png` | Home + sidebar + messenger |
| `docs/audits/creative-ux-v2-chrome/home-mobile.png` | 390px hero + dock covering Channel Surfing |
| `docs/audits/creative-ux-v2-chrome/player-desktop.png` | Immersive two-column in a metal bloom |
| `docs/audits/creative-ux-v2-chrome/player-mobile.png` | Immersive stacked Discman |
| `docs/audits/creative-ux-v2-chrome/explore-desktop.png` | Local tree hero + KEYS plates + genre icons |
| `docs/audits/creative-ux-v2-chrome/explore-mobile.png` | Explore at 390px |
| `docs/audits/creative-ux-v2-chrome/onboarding-desktop.png` | CH-xx station plates |
| `docs/audits/creative-ux-v2-chrome/club-guide-desktop.png` | Club Guide (beaker copy) |

---

## If I could only implement five changes, they would be:

1. **Make the LCD a phosphor readout on the existing steel metal** — acid (or a quieter lime) on glyphs, pip, progress, and the glowing Play key only; keep titles `#D8DFE8`; put artist on `lcdMute`; never paint the page or sidebar green; never revive Discman orange.
2. **One player-as-device drawing** shared by immersive, Home hero, and dock (art + LCD + Turtle/Prev/Play/Next/Bunny), filling the desktop stage instead of a phone in a brushed-metal void.
3. **Lead with album artwork** on Home and Explore (crate/sleeve/photo); demote Channel Surfing pictograms from hero to bugs; stop using Game Icons as `albumCover` so the first cultural image is a record, not an iTunes genre icon.
4. **Make the dock a mini-device twin** and keep Channel Surfing’s title visible on 390px — one transport object, not an iOS tab lid covering the next band.
5. **One desktop chrome system** — steel source list + persistent mini-device; treat station chat as a module, not a third OS, so the product reads as a handheld firmware instead of iTunes 7 in a browser.
