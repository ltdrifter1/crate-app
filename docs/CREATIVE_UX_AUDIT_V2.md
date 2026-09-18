# PlanetMP3 — Creative & UX Audit (V2)

**Date:** 18 September 2026  
**Chassis scored:** `STYLE_CHASSIS = steel-y2k-20260918` (`src/theme.js`, `public/index.html`)  
**North star:** *A futuristic MP3 player from an alternate 2003* — playful, collectible, music-first, unmistakably PlanetMP3.  
**Method:** Code review of Home, Explore, Library, Club, Search, player surfaces, tokens, and motion; live inspection of `#broadcast-preview`, `#player-preview`, `#explore-preview`, and `#onboarding-preview` at desktop (~1280) and mobile (390×844). **No product code was changed for this audit.**

**This document replaces the earlier V2 scorecard** (which scored the Aqua night chassis). Related but not this scorecard: `docs/STEEL_Y2K_AUDIT.md` (pre-change brief for this chassis), `docs/CREATIVE_DIRECTION_AUDIT.md` (acid-device notes, internally mixed), `docs/UX_AUDIT.md` (ergonomics/a11y), `docs/PLANETMP3_UI_AUDIT.md` (pre-Aqua MTV pass).

**Recent chassis history (do not re-litigate blindly):** Acid LCD (`#234`) → Steel Y2K (`#235`) → PS1 Discman costume (`#236`, orange phosphor + purple void + Space Grotesk) → **reverted** (`#237`). This audit scores **what is on `main` now**: light steel iPod/iTunes OS with a dark graphite player object.

Screenshots from this pass: `docs/audits/creative-ux-v2/`.

---

## 1. Executive Summary

PlanetMP3 is not a Spotify clone. It is also not yet the product the V2 brief describes.

The listening object is real: a graphite device on Home with artwork window, recessed LCD, Turtle / Prev / Play / Next / Bunny, `PLANET / 003`, LIVE, Channel Surfing, Club, crate spread, and IBM Plex firmware type. The engines are underground (Camelot, BPM, energy shift, scene channels). The nouns are Planet.

The **page** around that object is a **light iTunes / Music.app shell**: pearl canvas `#E4E7EE`, graphite inscription `#5A6270`, black source list, cream pictogram tiles, App Store rails, “See All.” Explore’s hero is a gray tree drawing, not a sleeve. The immersive player is a phone floating in a brushed-metal blur field. LCD titles sit as charcoal ink (`y2k.offWhite` was inverted to `#1C2028`) on a dark well — readable at display size, faint at metadata size.

The brief asks for **modern product design × early digital music culture**, with **PS1 interface grammar** (panels, overlays, compact HUD, sharp radii), **bold type + technical metadata**, **device-inspired controls**, and **album artwork as the primary visual**. Steel Y2K delivered the *materials of a 2003 Apple player* and retired every LED. That is historically premium and culturally the wrong Planet. It reads as **iPod Mini night-and-day**, not as an alternate-2003 bootleg firmware.

**Do not** ship another Discman costume (orange phosphor, purple CRT, display-font swap). `#236` already proved that path. The next identity leap is **steel as metal, phosphor as LCD only, sleeves as culture, one player drawing at three sizes**.

**Verdict:** Keep IA, engines, Club, DeviceChrome, Game Icons as *bugs*. Do not rebuild. Fix the token inversion on the LCD, put artwork in front of pictograms, and make desktop immersive a deck — not a blown-up phone.

**Overall score: 61 / 100**

Band: **Improve** (the chassis can reach the brief incrementally; LCD contrast + phosphor, artwork-first culture, and one desktop device are the levers).

Approximate mix today: **50% light iTunes / Music.app shell · 25% hardware/LCD tokens · 15% broadcast/station vocabulary · 8% underground metadata · 2% Planet mascot/splash.**  
Target mix: **40 / 25 / 20 / 15** (modern × Y2K device × underground × Planet).

---

## 2. Overall Score (/100)

| Category | Score (/10) | Weight | Weighted |
|---|---:|---:|---:|
| Brand Identity & Originality | 5.5 | 20 | 11.0 |
| Music Discovery & User Experience | 7.5 | 15 | 11.3 |
| Music Player & Playback Experience | 7.0 | 15 | 10.5 |
| Visual Language (Colour, Typography, Layout) | 5.0 | 15 | 7.5 |
| Interface & Interaction Design | 6.0 | 10 | 6.0 |
| Artwork & Editorial Presentation | 5.5 | 10 | 5.5 |
| Motion & Micro-interactions | 6.0 | 5 | 3.0 |
| Mobile & Responsive Experience | 6.5 | 5 | 3.3 |
| Design System Consistency | 5.0 | 3 | 1.5 |
| Technical Feasibility & Incremental Improvement | 8.5 | 2 | 1.7 |
| **TOTAL** | | **100** | **61** |

Scoring: **9–10 preserve · 7–8 refine · 5–6 improve · 0–4 redesign priority.**  
Weighted = `(score / 10) × weight`.

---

## 3. Detailed Scorecard

### 3.1 Brand Identity & Originality — 5.5/10 · **11.0 / 20**

**Evidence**
- Distinct nouns: crate, stacks, cuts, Channel Surfing, On Air, dedicate, Club, member numbers, `PLANET / 003`, Turtle / Bunny (`EnergyShiftButton.jsx`).
- Tagline `YOUR WORLD, YOUR MUSIC.` (`src/brand/identity.js`); spinning planet boot splash; Lottie mascot exists (`PlanetMascot.jsx`) and barely appears after login (`CoverStage` only).
- Live Home (`#broadcast-preview`): **black iTunes source list** + pearl stage + messenger + **dark player slab**. Channel tiles are Game Icons on steel plates — original drawings, iTunes genre-icon grammar.
- Theme header: “Acid green and Aqua are retired.” Tests lock accent to `#5A6270` and forbid `#B8F24A` (`App.test.js`).
- `#236` PS1 Discman (orange `#FF6A2B`, purple void, Space Grotesk) shipped and was reverted (`#237`) because it read as costume, not Planet.

**What's working**
- The *words* are Planet. Nobody else says “Flip the dial. Music stays on this stage.”
- Hardware keys + LCD + catalog mark are a brand object in embryo.
- Club as a record club (membership card, credits, vinyl groove stamp) is closer to the brief than a settings dump.
- Onboarding (“Tune the stations that sound like you” + CH-01 plates) feels like programming a device, not picking Spotify genres.

**Creative gaps**
- Signature colour in the brief is a **phosphor** (acid LCD in earlier direction; PS1 orange was the failed costume). Shipped colour is **Apple graphite on pearl**. The product currently looks like **iTunes 7 / iPod Mini on the web**, not an alternate-2003 Planet device.
- Identity is chrome (header, splash, bugs), not destinations. Library is Music.app playlists. Explore is Apple Music Browse with gray pictogram posters.
- Dual visual OS: light page vs dark device vs black sidebar. Three machines, one brand.
- Mascot and planet are boot theatre. The listening OS does not carry them.

**Recommendations**
- Treat **steel as metal** (keys, bezels, page) and **phosphor as LCD only** (glyphs, pip, progress, focus). Do not flood CTAs and sidebar rows with green or orange paint. Do not revive `#236`.
- Put catalog firmware on the player and dock (`PLANET / 003`, member number), not only Home `h1`.
- One visual OS: sidebar should be steel, not a black Music.app rail; the device should be the same drawing everywhere.
- Keep pictograms as *channel bugs*; do not let them replace album art as the cultural object.

---

### 3.2 Music Discovery & User Experience — 7.5/10 · **11.3 / 15**

**Evidence**
- Home order: **device first** → one `CrateSpread` → Channel Surfing → Tonight EPG → Most Requested rail → remaining `buildHomeCollections` rails (`HomeScreen.jsx`). Preview Home skips the crate (no editorial tracks) and shows Channel Surfing immediately under the hero.
- Explore: Mixmag-scale `ExploreHero`, genre mosaic, mood/scene rails, search entry (`ExploreScreen.jsx`). Live preview hero is the **Local tree pictogram**, not a sleeve; Camelot “KEYS” renders as **three empty gray squares**.
- Power grammar: BPM / Camelot / energy search (`SearchScreen` hint chips, `harmony.js`, `EnergyRecommendationEngine.js`).
- Scene channels, countdown, hypno/near-this, dedicate, program guide — real differentiators.
- Search is not a dock tab; it hangs off Explore. Four primary tabs: Home / Explore / Library / Club (`nav.js`).

**What's working**
- Discovery is **station-first**, which is the right Planet model (not an infinite For You feed).
- Crate spread is the first true record-shop module: lead sleeve + stacked cuts + LCD bits on the lead.
- Explained picks, empty-state voice, and “Listen in this lane” keep trust high.
- Onboarding is on-brand. Four tabs is the right count.

**Creative gaps**
- After the crate, Home reverts to **equal snapping rails** and “See All” — App Store / Music.app grammar (`MusicSection` `type.seeAll`).
- Channel Surfing is still a **horizontal equal-tile strip** of pictograms. No featured station sleeve, no flyer, no mosaic of catalog art.
- Browse / harmonic map live in Search empty state and a broken KEYS row on Explore — strong for power users, easy to miss or look unfinished.
- Vocabulary (stacks, cuts, Near this) still under-glossed for first session (`docs/UX_AUDIT.md`). Library does gloss “Stacks — your playlists” (good).
- Dual chrome on desktop: source list *and* (on mobile) a floating pill dock. Muscle memory differs by breakpoint.

**Recommendations**
- One crate or mosaic per destination; rails become overflow, not the page.
- Channel Surfing: one featured dial (art-forward) + compact bugs; keep equal tiles as the rest of the strip.
- Surface Camelot / BPM browse as real LCD plates (data already exists); do not ship empty KEYS squares.
- Keep four tabs. Gloss Stacks once (already started). Do not add destinations.

---

### 3.3 Music Player & Playback Experience — 7.0/10 · **10.5 / 15**

**Evidence**
- Shared `DeviceChrome`: `LcdPanel`, `LcdSeek`, `LcdMetaLine` (`trackLcdBits` → BPM, Camelot, `E#`, **MP3 / bitrate**), `HardwareIconButton`, scanlines, catalog mark.
- Transport row: Turtle · Prev · `PlayKey` · Next · Bunny, with `showLabel` / `±10 BPM` on Home hero, dock, and immersive. Live preview confirms labels.
- `hideDockPlayer = false` (`App.jsx`) — dock is always on. Desktop `.pmp-device-stage` two-column from 860px (`index.css`).
- Plumbing is excellent: crossfade, Media Session, unlock, playback store, shuffle/repeat/volume, session resume (UX audit).
- Seek: custom 3×12px LCD thumb on `.chrome-seek`; generic `input[type=range]` still has a **14px round iOS thumb** (volume, taste). Live immersive seek is a faint groove in a void.
- LCD title colour is `y2k.offWhite` (`#1C2028`) on `radio.lcdFace` (`#3A414C` → `#1C2028`). Live: title is muddy charcoal; `118 BPM · MP3 · AFTERGLOW · ELECTRONIC` is graphite-on-graphite (~1.8:1).
- Idle / preview art is often the lockup or a music-note pictogram, not a sleeve.
- PlayKey unlit: dark plate (`#2A2E38`) with `color.ink` — nearly invisible glyph on the dark hero.

**What's working**
- Closest surface to the brief. Firmware metadata, labeled paddles, LIVE, catalog mark, hardware play key.
- Energy shift as a first-class transport gesture is original and underground (DJ-adjacent, not a smart shuffle).
- Artwork window + LCD stack is the right canonical drawing. Bitrate/MP3 mark is now in the LCD bits.

**Creative gaps**
- Three drawings, not one: Home **dark card**, immersive **phone theater in a gray bloom**, dock **streaming strip** (light `radio.stripFace` inline over a dark `.glass-dock` class).
- Desktop immersive wastes ~60% of the stage around a 320px sleeve and a small LCD (live `#player-preview`).
- LCD is a device well with page-ink tokens — the readout does not glow.
- Seek *track* is an LCD groove; volume still reads iOS.

**Recommendations**
- Canonical device reused at immersive / hero / dock / mini — tokens only, no new IA. Desktop: art | LCD+keys filling ~80% width.
- LCD glyphs: off-white / phosphor on the dark well. Accent on LCD = signal, not `#1C2028`.
- Custom seek thumb already exists for `.chrome-seek`; keep it 2–4px. Do not let the generic round thumb leak onto transport.
- Persist a mini-device that is a sibling of the hero (already always-on — restyle it to match).
- Playing sleeve colours the bloom; phosphor should not compete with the cover.

---

### 3.4 Visual Language (Colour, Typography, Layout) — 5.0/10 · **7.5 / 15**

**Evidence**
- Canvas `#E4E7EE`, ink `#1C2028`, silver `#C5CAD3`, graphite accent `#5A6270`. **Matches 2003 Apple aluminum. Fights the brief’s PS1 × playful × collectible mix.**
- Type: IBM Plex Sans + Mono (`public/index.html`). `type.lcd` 11px / tracking 0.12 / uppercase. Home `h1` is 22px under `PLANET / 003` (improved vs 34px App Store title).
- Layout: Home `maxWidth: 960`; Explore hero `borderRadius: 10`; dock `borderRadius: 16`; `radius.pill = 980` still in the API.
- Channel tiles: cream/silver plates with black pictograms — a **paper/iTunes OS** sitting under a dark device.
- Live inspection: sidebar = near-black Music.app rail; page = pearl; player = graphite slab; nav = dark hardware bar.

**What's working**
- Dark-metal *device* + Plex + compact meta is the right *stack* for firmware. Not Inter-SaaS, not costume Lucida (Discman Space Grotesk correctly reverted).
- Hairline bezels and metal key faces (`hardware.keyRaised`) already describe a device.
- Onboarding typography (bold Plex, CH-xx) is the most Planet layout in the product.

**Creative gaps**
- **Colour is the brief’s primary brand lever and it is pointed at Apple.** Pearl + graphite = iPod Mini. Acid-on-LCD + steel metal = Planet. Orange-on-purple = the Discman that got reverted — do not go there.
- 22px product title still competes with firmware eyebrow — better, not solved.
- Pill radius 980 vs hardware 6–8px = two products.
- Cream pictogram squares bleach the first cultural impression (Home Channel Surfing, Explore hero, genre mosaic).

**Recommendations**
- Keep steel metal. Add **LCD phosphor** (`#B8F24A` or a quieter lime) on glyphs, pip, progress, focus **only**. `onAccent` near-black. Live stays red. **Do not** fill sidebar/tabs with green.
- Masthead: compact wordmark + `PLANET / 003` as the title; drop competing marketing-size type.
- Channel plates: dark metal + coloured pictogram *bug*, or sleeve mosaic; stop cream iTunes icons as the first Home/Explore impression.
- Radius floor: 4 / 6 / 8 / 12. Kill pills on transport, search chips, energy menus.

---

### 3.5 Interface & Interaction Design — 6.0/10 · **6.0 / 10**

**Evidence**
- Hardware keys (`hardwareKey`, `chromeIconButton`) vs leftover glass pills (`glassPill`, `.pill-nav`, `.pill-tab`).
- Bottom nav: 11px labels, graphite wash, radius 14 container — **dark bar on a light page** (`App.jsx` `.pill-nav`).
- Keyboard shortcuts, queue editing, like-pop, press classes — UX audit items shipped.
- Hero is a giant `role="button"` opening the player; inner controls `stopPropagation`. On 390px, the dock covers the Channel Surfing title (`home-mobile.webp`).
- Desktop: sidebar + content + messenger + mini-player. Admin is off the consumer dock (`nav.js`) — good.
- Energy long-press menu: `color.ink` on `rgba(12,14,18,0.96)` — token inversion, dark labels on a dark menu.

**What's working**
- Pressed metal keys feel tactile. Reduced motion is global.
- Four consumer destinations is the right count.
- Long-press on Bunny/Turtle for ±5/10/20 BPM is a power-user gift.
- Desktop sidebar selected row is a pip + wash, not a filled Aqua capsule (improved vs prior Aqua audit).

**Creative gaps**
- Desktop shows **sidebar + messenger + mini-player** — three chrome systems. Reads SaaS/iTunes, not a handheld.
- Nav is still a phone tab bar glued onto a light iOS page.
- Energy menus and some search hints still use leftover dark-glass chips (`SearchScreen` `hintChip`).
- Hit-target density on Home hero (paddles + seek + like + open-player card) plus dock overlap on small phones.

**Recommendations**
- Desktop: steel source list + persistent mini-device; no black Music.app rail; messenger as a *module*, not a third OS.
- Mobile: keep the dock; make it the mini-device, not a second tab chrome covering the next band.
- Search/energy chips as LCD plates (radius 4), with ink that matches the plate.
- Energy menu: light glyphs on the dark plate (same LCD rule).

---

### 3.6 Artwork & Editorial Presentation — 5.5/10 · **5.5 / 10**

**Evidence**
- Shared `ArtFrame` / `artFrameStyle` — 6px jewel.
- Explore hero: full-bleed photography *intended* (`ExploreHero.jsx`); live preview shows a **gray pictogram poster** (Local tree) because channel art is Game Icons, not sleeves.
- Home crate: 220px lead + stacked cuts + LCD bits (`CrateSpread.jsx`) — present in product Home, absent from broadcast preview when editorial is empty.
- Hero sleeve 240px (`JewelSleeve`); immersive sleeve `min(72vw, 320px)` / desktop up to 380px — then drowned in blur.
- Channel Surfing: pictograms, not catalog sleeves (`ChannelCard` + `channelArt`).
- TrackCard prints LCD bits under title. Rank/video badges radius 4.
- Club: membership card / collector panel — collectible in concept.
- Player idle often shows lockup (`/brand/planet-mp3-lockup-on-black.png`) or a music-note plate.

**What's working**
- When sleeves are large (crate lead, artist/album pages, player with a real cover), the product feels like a shop.
- Mosaic language exists for stacks and genres.
- Video stage is a real dark rectangle, not a rounded thumbnail.

**Creative gaps**
- Default discovery is **pictogram culture**, not record culture. First image on Home and Explore is a drawing, not a sleeve.
- Player preview/idle logo-as-art flattens the crate.
- No magazine spread (pull quote, liner, credits) on Home; liner notes exist as a sheet (`LinerNotesSheet`).
- Library stack mosaics in preview are pictogram collages on white tiles — iTunes playlist icons.

**Recommendations**
- Lead every destination with one oversized **sleeve or photo**. Pictograms are bugs, not heroes.
- Channel row: mosaic of *track* art inside the bug, or a single editorial still.
- Pull one liner/credit line onto the crate lead.
- Playing sleeve colours the chassis; phosphor only on LCD/progress/pip.

---

### 3.7 Motion & Micro-interactions — 6.0/10 · **3.0 / 5**

**Evidence**
- Documented principles: rhythm over bounce, reduced motion (`src/motion/tokens.js`, `index.css`).
- Live LED, dock rise, like pop, trackSwap 320ms, LCD pip pulse, planet spin, Explore Ken Burns 32s, sleeve crossfade class.
- LCD marquee 14s linear — exists; easy to miss.
- Energy `PRESS_EASE` is `motion.ease` (bounce retired).
- `.pmp-lift:hover { transform: none }` — lift is press-only.

**What's working**
- Motion is mostly calm and music-adjacent. Reduced motion is respected.
- Scanline wash on LCD is the right *kind* of artifact (subtle, local).
- Key press language is closer to hardware than to App Store bounce.

**Creative gaps**
- Ambient loops (planet, Ken Burns, live dot) can out-talk the track.
- No tactile *click* on hardware keys beyond shadow invert.
- Marquee is slow (14s); seek lacks LCD digit ticking.
- 12s art bloom on immersive is Apple Music, not a deck.

**Recommendations**
- Fast digital: progress fill, pip, 200–350ms sleeve crossfade, overflow marquee ~8s.
- Gate ambient animation to playing + visible.
- Key press = 1px inset, not scale.

---

### 3.8 Mobile & Responsive Experience — 6.5/10 · **3.3 / 5**

**Evidence**
- Safe areas, dock insets, compact dock extras (`dock-xtra` hidden below 430px), Home 960 / Explore breakpoints 720 / 1100.
- 390px preview: masthead + hero device; **bottom nav covers Channel Surfing**; LCD meta is cramped but present; Turtle/Bunny labels still fit.
- Desktop broadcast preview: sidebar + 960 stage + messenger — iTunes three-pane, not “destination scale.”
- Immersive two-column CSS exists; live `#player-preview` still felt like a phone floating in a gray field.

**What's working**
- Phone shell is considered (safe area, tap sizes, dock rise). The *device* actually fits a phone better than a desktop.
- Explore uses the wide canvas (hero + mosaic).
- `hideDockPlayer` split is gone — one always-on mini transport.

**Creative gaps**
- Home on desktop is a phone column with extra gutters + a black rail.
- Dock collision with the next Home band on small phones.
- Mini-player / immersive not a smaller drawing of the same device.

**Recommendations**
- Below 720px: one column, persistent mini-device, Channel Surfing as a peeking rail that isn’t covered.
- `≥860`: Home as stage (hero device full width) + crate grid; steel sidebar; no black rail.
- Immersive desktop: art | LCD+keys filling ~80% width, less blur void.

---

### 3.9 Design System Consistency — 5.0/10 · **1.5 / 3**

**Evidence**
- Real token file: `color`, `radio`, `hardware`, `type`, `homeSpace`, `broadcast`, `BTN_PRIMARY`.
- Names lie: `y2k.offWhite` = `#1C2028`; `y2k.cyan` / `neon` / `techBlue` = graphite; `IceOrbPlay` alias; `glass-dock` class is dark while `radio.stripFace` is pearl.
- `CREATIVE_DIRECTION_AUDIT.md` still narrates acid-device in places; previous V2 scored Aqua. Tests named for steel, locking graphite, forbidding acid.
- Pill + hardware + cream pictogram + dark leftover modules (`EmptyShelfCard` still paints `#101218`; Club settings tab strip is dark glass on pearl) = four component dialects.

**What's working**
- One token file is enough to restyle the OS without a new dependency.
- DeviceChrome is the start of a real component kit.
- Style assert script stamps `steel-y2k-20260918` into boot HTML + committed `build/`.

**Creative gaps**
- Token inversion is the highest-severity system bug: semantic “off-white” is now ink, so every LCD that trusted the name went dark-on-dark.
- Stale docs will cause the next PR to design the previous movie (Aqua, acid-everywhere, or Discman).
- `radius.pill` still in the public API.

**Recommendations**
- One pass: LCD ink tokens (`lcdInk`, `lcdMute`) that are actually light. Keep `y2k.offWhite` alias mapped correctly *or* stop using it on dark wells.
- Document the kit: Panel, LCD, Key, Sleeve, Bug, Crate, Nav selector.
- Deprecate `radius.pill` for product UI.
- Align this V2 doc as the current scorecard so the next PR does not re-introduce Aqua, Discman orange, or flask-as-tempo.

---

### 3.10 Technical Feasibility & Incremental Improvement — 8.5/10 · **1.7 / 2**

**Evidence**
- Player restyle, crate, LCD, pictogram plates, always-on dock already landed as incremental PRs without an IA rewrite.
- Accent / LCD ink is mostly `theme.js` + assert script + leftover hexes.
- No new libraries required. Constraints (preserve playback, routing, Club, billing, engine) are compatible with this audit.
- Remaining risk: `App.jsx` size, native range styling, catalog bitrate field (UI already falls back to `MP3`), and **not repeating `#236`**.

**What's working**
- The team can ship identity in place. That is rare and should dictate the roadmap.

**Creative gaps**
- None that justify a rewrite. The gap is *choosing LCD phosphor on steel metal, fixing contrast, and one player drawing.*

**Recommendations**
- Highest impact, lowest risk: LCD ink contrast; optional acid-as-LCD-only; desktop immersive fill; artwork-first Channel/Explore heroes; steel sidebar.
- Do not add animation libraries, new fonts, or a component framework.
- Do not re-implement Discman orange / purple void / Space Grotesk.

---

## 4. Top 10 Strengths

1. **Station-first product** — Channel Surfing, On Air, program guide, not a faceless For You feed.
2. **DJ-grade engine in the UI** — BPM, Camelot, energy 1–10, Turtle/Bunny actually change upcoming picks.
3. **DeviceChrome is real** — LCD, scanlines, hardware keys, catalog mark, shared across hero / immersive / dock.
4. **Labeled Turtle / Bunny** — the most Planet control is now first-class on Home, dock, and immersive (`±10 BPM`).
5. **IBM Plex Sans + Mono** — firmware voice, not Inter, not costume Lucida, not the reverted Discman Grotesk.
6. **Crate spread** — magazine/shop layout on Home; LCD bits on the lead sleeve.
7. **MP3 / bitrate on the LCD** — the category is in the name; the readout finally says it.
8. **Club as a record club** — membership, credits, collectible card — culture, not SaaS billing-only.
9. **Always-on mini transport** — `hideDockPlayer` split is gone; one muscle memory.
10. **Original vocabulary** — crate, cuts, stacks, dedicate, PLANET/003 — protect this; gloss it, don’t kill it.

---

## 5. Top 10 Creative Gaps

1. **iPod Mini / iTunes 7 as the OS** — pearl page + graphite + black source list. Unmistakably Apple, not Planet.
2. **No phosphor** — acid retired, Aqua retired, Discman orange reverted; LCD has no LED. Metadata is graphite-on-graphite.
3. **Token inversion** — `y2k.offWhite` is `#1C2028`, so LCD titles and energy menus use page ink on dark wells.
4. **Pictograms as the first cultural image** — Channel Surfing, Explore hero, genre mosaic, idle player art.
5. **Three player drawings** — dark Home card vs blur-void theater vs strip; desktop immersive wastes the stage.
6. **Streaming shell layout** — four-tab dock + iTunes source list + App Store rails + messenger column.
7. **Empty KEYS row on Explore** — three gray squares where Camelot should be a crate index.
8. **Mascot/planet splash-only** — personality does not survive into the listening OS.
9. **Pill / dark-glass leftovers** — search chips, Club settings strip, `EmptyShelfCard` still paints `#101218` on a pearl page.
10. **Mobile dock collision** — hardware tab bar covers Channel Surfing on 390px.

---

## 6. P0 (Essential) Improvements

Preserve playback, routing, Club, billing, recommendation engine. No new dependencies. **Do not revive `#236` Discman costume.**

1. **LCD as a real readout** — light glyphs on the dark well. Add `lcdInk` / `lcdMute` (or map phosphor). Fix `y2k.offWhite` on LCD, PlayKey, energy menu. Metadata must hit ≥4.5:1.
2. **Phosphor on LCD only** — `color.accent` for *LCD roles* (glyphs, pip, progress fill, focus, selected pip) can be acid `#B8F24A` without painting the pearl page or sidebar green. Metal keys stay silver. Live stays red. This is not “Spotify green” if it never fills a capsule.
3. **One player drawing** — art window + LCD (title, BPM, Camelot, time, MP3) + Turtle / Prev / Play / Next / Bunny. Apply to immersive, hero, dock, desktop mini via existing `DeviceChrome`. Desktop immersive fills ~80% width.
4. **Artwork-first culture** — Home/Explore lead with a sleeve or photo; Channel pictograms become bugs. Stop logo-as-art and tree-as-hero.
5. **One chrome system on desktop** — steel source list (not black Music.app) + persistent mini-device. Messenger as a module.
6. **Mobile dock vs content** — the next Home band must remain visible; dock is the mini-device, not a lid.

---

## 7. P1 (Important) Improvements

1. Masthead: firmware lockup over competing marketing title.
2. Channel Surfing: featured station sleeve; mosaic of catalog art inside bugs.
3. Crate/mosaic as default on Explore genres and Library stacks (pattern exists).
4. Camelot/BPM index as LCD plates on Explore — no empty KEYS squares.
5. Search/energy chips → LCD plates (radius 4) with matching ink.
6. Club settings strip + leftover `#101218` empty shelves restyled to steel.
7. Gloss “Stacks — your playlists” is started; extend to cuts / Near this once.
8. PlayKey unlit: metal face + dark inscription, or phosphor when playing — never black-on-black.
9. Volume/taste range: LCD thumb, not 14px iOS capsule.
10. Align `CREATIVE_DIRECTION_AUDIT.md` comments so the next PR does not re-introduce Aqua, Discman orange, or flask-as-tempo.

---

## 8. P2 (Polish) Improvements

1. LCD marquee ~8s when title overflows; tabular time ticks.
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

The V2 brief asks for **PS1 interface with modern influence**. `#236` interpreted that as **orange phosphor, purple CRT void, Space Grotesk Discman**. That shipped and was reverted because it looked like a skin, not a product.

Use PS1 as **grammar**, not costume:

| Take | Leave |
|---|---|
| Overlay panels, HUD metadata, sharp 4–8px radii | Full-page CRT purple |
| Compact technical line (BPM / key / kbps) | Display-font swap |
| Device as the screen, not a card in a feed | Orange paint on every CTA |
| Pause / status as a bug in the corner | Fake BIOS boot every session |

Steel metal + dark LCD well + phosphor glyphs + sleeve window **is** that grammar. iTunes pearl + cream pictograms **is not**.

---

## 10. Recommended Design System (incremental)

### Colour

| Role | Hex | Use |
|---|---|---|
| Void / page | `#E4E7EE` (keep) or slightly cooler steel | App floor — metal, not nightclub |
| Chassis | `#D8DCE4` / `#F4F5F7` | Player body, dock, panels |
| LCD well | `#1C2028` → `#2A2E38` | Recessed readout only |
| **LCD phosphor** | `#B8F24A` (or dimmer `#C6E86A`) | LCD glyphs, pip, progress, focus |
| On-phosphor | `#0C1008` | Text on glowing play key |
| Silver | `#C5CAD3` | Metal keys, secondary |
| Ink | `#1C2028` | Page text only — **not** LCD text |
| LCD ink | `#E8EAEE` | Titles on the well |
| Live | `#E0314A` | ON AIR / destructive |
| Artwork | track colour | Bloom / dock tint |

Until phosphor ships, **still paint LCD titles `#E8EAEE`**. Graphite-on-graphite is the current failure.

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
- **Bug** — LIVE / CH ident.
- **Crate** — `CrateSpread`.
- **Nav** — device selector, steel, not a black Music.app list.

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
LCD ink contrast; optional phosphor on LCD roles; PlayKey contrast; immersive two-column actually filled; dock visually twins the hero.

**Pass 2 — Culture in front (P0/P1)**  
Artwork-first Channel/Explore heroes; crate remains Home’s second module; pictograms as bugs; Explore KEYS as real plates.

**Pass 3 — One OS (P1)**  
Steel sidebar; leftover dark glass on pearl gone; chips as plates; desktop hide black-rail energy.

**Non-goals:** new fonts, animation libs, extra tabs, Discman orange/purple, fake CRT wallpaper, IA rewrite, Spotify-style For You.

---

## If I could only implement five changes, they would be:

1. **Make the LCD a real phosphor readout** (light glyphs, BPM / Camelot / MP3 at contrast, optional acid as LCD-only signal) on the existing steel metal — stop graphite-on-graphite and stop looking like a mute iPod.
2. **One player-as-device drawing** shared by immersive, Home hero, and dock (art + LCD + Turtle/Prev/Play/Next/Bunny), filling the desktop stage instead of a phone in a blur void.
3. **Lead with album artwork** on Home and Explore (crate/sleeve/photo); demote Channel Surfing pictograms from hero to bugs so the first cultural image is a record, not an iTunes genre icon.
4. **One desktop chrome system** — steel source list + persistent mini-device; retire the black Music.app rail and treat station chat as a module, not a third OS.
5. **Fix the token inversion and leftover dark glass** (`y2k.offWhite` on LCD, energy menus, Search chips, Club settings strip, empty shelves) so the light steel page and the dark device stop stealing each other’s ink.
