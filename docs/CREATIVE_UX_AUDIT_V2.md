# PlanetMP3 — Creative & UX Audit (V2)

**Date:** 18 September 2026  
**Chassis scored:** `STYLE_CHASSIS = aqua-device-20260918` (`src/theme.js`, `public/index.html`)  
**North star:** *A futuristic MP3 player from an alternate 2003* — playful, collectible, music-first, unmistakably PlanetMP3.  
**Method:** Code review of Home, Explore, Library, Club, Search, player surfaces, tokens, and motion; live inspection of `#broadcast-preview`, `#player-preview`, `#explore-preview`, and `#onboarding-preview`. **No product code was changed for this audit.**

**Related docs (do not treat as this scorecard):** `docs/CREATIVE_DIRECTION_AUDIT.md` (older category set; internally mixed acid vs Aqua), `docs/UX_AUDIT.md` (ergonomics/a11y), `docs/PLANETMP3_UI_AUDIT.md` (pre-Aqua MTV pass).

**Shipped since prior creative notes (still in scope here):** Phase 1 player-as-device + Turtle/Bunny (`#230`), crate spread + LCD meta + hardware radii (`#231`), coloured Channel Surfing pictograms (`#232`).

Screenshots from this pass: `docs/audits/creative-ux-v2/`.

---

## 1. Executive Summary

PlanetMP3 is no longer a generic dark Spotify skin, and it is no longer the light iPod/Aqua OS from mid-September. The listening object is real: a graphite chassis, IBM Plex firmware type, recessed LCD with BPM / Camelot / energy, hardware-shaped keys, Turtle/Bunny paddles, `PLANET / 003`, LIVE bugs, Channel Surfing, Club membership, and a crate spread on Home.

It is also **not yet the product the V2 brief describes.**

The brief asks for **modern product design × early digital music culture**, with a **signature acid-green** accent on black / graphite / silver / off-white. The shipped OS is **iTunes Aqua `#1E6FE8` on a night canvas**, with comments and tests that *intentionally retired* acid green. That is the single largest identity miss. Aqua reads as Apple Music / iTunes 7, not as PlanetMP3’s own LED. Combined with a YouTube Music–style four-tab dock, an iTunes source list, cream pictogram tiles, and equal discovery rails, the product still spends too many pixels looking like a **premium streaming client with a radio overlay**.

Culture lives in the *engine* (Camelot, BPM, energy shift, scene channels, Club) more than in the *page*. Artwork is strong on Explore and in the player window, then collapses to pictograms and 160px rails. The player is the best-designed object, but Home hides the dock when the hero is on screen (`hideDockPlayer`), desktop immersive still wastes stage around a phone drawing, and bitrate — a literal MP3-era tell — is absent from the entire UI.

**Verdict:** Keep the IA, engines, Club, and DeviceChrome. Do not rebuild. The next identity leap is **one signal colour (acid as LCD, not as Spotify paint), one player drawing at three sizes, and crate/editorial as the default discovery grammar** — not another token rename.

**Overall score: 65 / 100**

Band: **Improve** (the chassis can reach the brief incrementally; colour + player grammar + Home editorial are the levers).

Approximate mix today: **45% modern dark streaming shell · 25% hardware/LCD tokens · 15% broadcast/station vocabulary · 10% underground metadata · 5% Planet mascot/splash.**  
Target mix: **40 / 25 / 20 / 15** (modern × Y2K × underground × Planet).

---

## 2. Overall Score (/100)

| Category | Score (/10) | Weight | Weighted |
|---|---:|---:|---:|
| Brand Identity & Originality | 6.5 | 20 | 13.0 |
| Music Discovery & User Experience | 7.5 | 15 | 11.3 |
| Music Player & Playback Experience | 7.0 | 15 | 10.5 |
| Visual Language (Colour, Typography, Layout) | 5.0 | 15 | 7.5 |
| Interface & Interaction Design | 6.5 | 10 | 6.5 |
| Artwork & Editorial Presentation | 6.5 | 10 | 6.5 |
| Motion & Micro-interactions | 6.0 | 5 | 3.0 |
| Mobile & Responsive Experience | 6.5 | 5 | 3.3 |
| Design System Consistency | 6.5 | 3 | 2.0 |
| Technical Feasibility & Incremental Improvement | 8.5 | 2 | 1.7 |
| **TOTAL** | | **100** | **65** |

---

## 3. Detailed Scorecard

Scoring: **9–10 preserve · 7–8 refine · 5–6 improve · 0–4 redesign priority.**  
Weighted = `(score / 10) × weight`.

---

### 3.1 Brand Identity & Originality — 6.5/10 · **13.0 / 20**

**Evidence**
- Distinct nouns: crate, stacks, cuts, Channel Surfing, On Air, dedicate, Club, member numbers, `PLANET / 003`, Turtle / Bunny (`EnergyShiftButton.jsx`).
- Tagline `YOUR WORLD, YOUR MUSIC.` (`src/brand/identity.js`); spinning planet boot splash; Lottie mascot exists (`PlanetMascot.jsx`) and barely appears after login.
- `nav.js` documents “YouTube Music–style four dock destinations.” Desktop `AppSidebar` paints the active row as a full Aqua capsule (`linear-gradient(#6FB4F8 → #1E6FE8)`).
- Theme header: “iTunes Aqua signal” / “Acid green is retired” (`theme.js`). Tests lock accent to `#1E6FE8` (`App.test.js`).
- Channel tiles are original pictograms (iTunes/MTV lineage, now coloured in `#232`) — not Spotify tiles, but also not sleeves or flyers.

**What's working**
- The *words* are Planet. Nobody else says “Flip the dial. Music stays on this stage.”
- Hardware keys + LCD + catalog mark (`DeviceCatalogMark`) are a brand object in embryo.
- Club as a record club (membership card, credits) is culturally closer to the brief than a settings dump.

**Creative gaps**
- Signature colour in the brief is acid-green. Shipped colour is Apple Aqua. The product currently looks like **iTunes night mode**, not an alternate-2003 Planet device.
- Identity is chrome (header, splash, bugs), not destinations. Library / Search / Club still read as the same dark streaming shell.
- Mascot and planet are boot theatre. The listening OS does not carry them.
- Dual nav on desktop (source list + floating pill dock) is Apple Music / YouTube Music, not a handheld.

**Recommendations**
- Treat **acid `#B8F24A` as LCD signal** (glyphs, pip, progress, focus, selected) and **metal for keys**. Do not flood CTAs and sidebar rows with green paint (that is how it becomes “Spotify, different hex”).
- Put catalog firmware on the player and dock (`PLANET / 003`, member number), not only Home `h1`.
- One visual OS: same bezel language on Home hero, immersive, dock, Club card.
- Keep pictograms as *channel bugs*; do not let them replace album art as the cultural object.

---

### 3.2 Music Discovery & User Experience — 7.5/10 · **11.3 / 15**

**Evidence**
- Home order: Channel Surfing → Hero device → Tonight EPG → **one `CrateSpread`** → Most Requested rail → remaining `buildHomeCollections` rails (`HomeScreen.jsx`).
- Explore: Mixmag-scale `ExploreHero`, genre mosaic, mood/scene rails, search entry (`ExploreScreen.jsx`).
- Power grammar: BPM / Camelot / energy search (`SearchScreen` hint chips, `harmony.js`, `EnergyRecommendationEngine.js`).
- Scene channels, countdown, hypno/near-this, dedicate, program guide — real differentiators.
- Search is not a dock tab; it hangs off Explore. Four primary tabs: Home / Explore / Library / Club.

**What's working**
- Discovery is **station-first**, which is the right Planet model (not an infinite For You feed).
- Crate spread is the first true record-shop module: lead sleeve + stacked cuts + LCD bits on the lead.
- Explained picks, empty-state voice, and “Listen in this lane” keep trust high.
- Onboarding (“Tune the stations that sound like you”) is on-brand.

**Creative gaps**
- After the crate, Home reverts to **equal snapping rails** and “See All” — App Store / Music.app grammar (`MusicSection` `type.seeAll`).
- Channel Surfing is still a **horizontal equal-tile strip** (`ChannelSurfingSection` comment still says “Equal App Store tiles”). No featured station, no flyer, no mosaic on Home.
- Browse / harmonic map live in Search empty state — strong for power users, easy to miss from Home.
- Vocabulary (stacks, cuts, Near this) still under-glossed for first session (`docs/UX_AUDIT.md`).
- Dual transport: Home hero owns play; dock hides (`App.jsx` `hideDockPlayer`). Muscle memory breaks the moment you leave Home.

**Recommendations**
- One crate or mosaic per destination; rails become overflow, not the page.
- Channel Surfing: one featured dial (art-forward) + compact bugs; keep equal tiles as the rest of the strip.
- Surface Camelot / BPM browse as a Home or Explore “crate index” chip row (data already exists).
- Keep four tabs. Gloss Stacks once. Do not add destinations.

---

### 3.3 Music Player & Playback Experience — 7.0/10 · **10.5 / 15**

**Evidence**
- Shared `DeviceChrome`: `LcdPanel`, `LcdSeek`, `LcdMetaLine` (`trackLcdBits` → BPM, Camelot, `E#`), `HardwareIconButton`, scanlines, catalog mark.
- Transport row: Turtle · Prev · `PlayKey` · Next · Bunny, with `±10 BPM` labels on immersive (`ImmersivePlayer.jsx`). Home hero uses the same paddles **unlabeled** at 40px.
- LCD marquee CSS (`.pmp-lcd-marquee`); desktop `.pmp-device-stage` two-column from 860px (`index.css`).
- Plumbing is excellent: crossfade, Media Session, unlock, playback store, shuffle/repeat/volume, session resume (UX audit).
- Dock (`GlassDock`) and `DesktopMiniPlayer` share LCD bits; dock still packs like / more / play; `hideDockPlayer` on Home.
- `PlayKey` is an 8px hardware key; deprecated alias `IceOrbPlay` remains. `OrbitalArtRing` is leftover click-wheel language.
- **No bitrate** anywhere in `src/` (no `kbps` / bitrate field in UI).
- Seek *track* is 2px LCD groove; the **native range thumb still reads as iOS capsule** in the live hero (round blue knob).

**What's working**
- This is the closest surface to the brief. Firmware metadata, paddles, LIVE, catalog mark, hardware play key.
- Energy shift as a first-class transport gesture is original and underground (DJ-adjacent, not a smart shuffle).
- Artwork window + LCD stack is the right canonical drawing.

**Creative gaps**
- Three drawings, not one: Home **card**, immersive **phone theater** (even with a desktop row, it still floats in a blur void), dock **streaming strip**.
- Home paddles are cryptic icons; only immersive says TURTLE / BUNNY.
- Flask remains as `EnergyShiftControl` / taste (`FlaskTasteButton`) — two metaphors.
- Player still maxes like a phone (`maxWidth: 420` on booth/transport). Desktop should feel like a deck, not a blown-up iPhone.
- Seek thumb + blue fill = iOS Music, not a MiniDisc/MP3 progress groove.

**Recommendations**
- Canonical device (see §11) reused at immersive / hero / dock / mini — tokens only, no new IA.
- Label paddles everywhere; keep flask on Interests only.
- Custom seek thumb (2–4px square or none); fill = acid (or Aqua until the swap) inside the groove only.
- Persist a mini-device when the hero is visible, **or** make the hero *be* the dock visually so hiding it is not a second machine.
- Add optional `kbps` when the catalog has it; even a static `MP3` / `320` badge on LCD is period-correct.

---

### 3.4 Visual Language (Colour, Typography, Layout) — 5.0/10 · **7.5 / 15**

**Evidence**
- Canvas `#090A0D`, ink `#E8EAEE`, silver `#C5CAD3`, graphite modules — **matches the brief’s metal studio.**
- Accent `#1E6FE8` everywhere play/progress/nav/CTA (`color.accent`, `BTN_PRIMARY` Aqua gradient). Brief asks for **acid-green**.
- Type: IBM Plex Sans + Mono (`public/index.html`). `type.lcd` 11px / tracking 0.12 / uppercase. Home `h1` still `type.largeTitle` 34px “Planet MP3” under `PLANET / 003`.
- Layout: Home `maxWidth: 960`; Explore hero `borderRadius: 18`; dock `borderRadius: 16`; `radius.pill = 980` still used (search chips, liner notes, bumper, video badge, energy popovers).
- Channel tiles: cream/silver plates with black pictograms — a **second paper OS** sitting on the dark studio.
- Live inspection: sidebar Home = solid Aqua pill; bottom nav = Aqua wash; LCD numerals = Aqua; like heart = Aqua square.

**What's working**
- Dark + Plex + compact meta is the right *stack*. Not Inter-SaaS, not costume Lucida.
- Hairline bezels and metal key faces (`hardware.keyRaised`) already describe a device.
- Artwork is allowed to tint the dock (`dockTintStyle`) — correct idea.

**Creative gaps**
- **Colour is the brief’s primary brand lever and it is pointed at Apple.** Aqua + graphite = iTunes. Acid + graphite = Planet.
- 34px product title competes with firmware eyebrow — App Store large title with a catalog sticker.
- Pill radius 980 vs hardware 6–8px = two products.
- Cream pictogram squares bleach the night studio (especially Channel Surfing on Home).

**Recommendations**
- Token swap: `color.accent` → `#B8F24A`, `onAccent` → `#0C1008`. Keep live red. Keep silver metal. **Do not** Aqua-wash sidebar rows after the swap — selected = hairline + pip, not a filled capsule.
- Masthead: compact wordmark + `PLANET / 003` as the title; drop competing 34px.
- Channel plates: dark metal + coloured pictogram, or sleeve mosaic; stop cream iTunes icons as the first Home impression.
- Radius floor: 4 / 6 / 8 / 12. Kill pills on transport, search chips, energy menus.

---

### 3.5 Interface & Interaction Design — 6.5/10 · **6.5 / 10**

**Evidence**
- Hardware keys (`hardwareKey`, `chromeIconButton`) vs leftover glass pills (`glassPill`, `.pill-nav`, `.pill-tab`).
- Bottom nav: 11px labels, Aqua active, radius 14 container (`BottomNavigation.jsx`).
- Keyboard shortcuts, queue editing, like-pop, press classes — UX audit items shipped.
- Hero is a giant `role="button"` opening the player; inner controls `stopPropagation` — workable, easy to mis-hit on mobile (dock overlaps hero in 390px preview).
- Admin can join the dock (`primaryNavItems`).

**What's working**
- Pressed metal keys feel tactile. Reduced motion is global.
- Four consumer destinations is the right count.
- Long-press on Bunny/Turtle for ±5/10/20 BPM is a power-user gift.

**Creative gaps**
- Desktop shows **sidebar + floating dock + messenger** — three chrome systems. Reads SaaS, not device.
- Nav is still a phone tab bar, even on desktop.
- Energy menus and search hints still use capsule chips.
- Hit-target density on Home hero (paddles + seek + like + open-player card).

**Recommendations**
- Desktop: source list + persistent mini-device; hide the phone pill dock above a breakpoint.
- Mobile: keep the dock; make it the mini-device, not a second tab chrome glued to a player strip.
- Move Admin fully behind Club/profile.
- Search chips as LCD plates (radius 4), not pills.

---

### 3.6 Artwork & Editorial Presentation — 6.5/10 · **6.5 / 10**

**Evidence**
- Shared `ArtFrame` / `artFrameStyle` — 6px jewel, Aqua active ring.
- Explore hero: full-bleed photography, Ken Burns, Tune In (`ExploreHero.jsx`).
- Home crate: 220px lead + 56px stacked cuts + optional 120px overflow (`CrateSpread.jsx`).
- Hero sleeve 240px (`JewelSleeve`); immersive sleeve `min(72vw, 320px)` / desktop up to 380px.
- Channel Surfing: pictograms, not catalog sleeves (`ChannelCard` + `channelArt`).
- TrackCard now prints LCD bits under title (`TrackCard.jsx`). Rank/video badges radius 4.
- Club: membership card / collector panel — collectible in concept.

**What's working**
- When sleeves are large (Explore, crate lead, player), the product feels like a shop.
- Mosaic language exists for stacks and genres.
- Video stage is a real dark rectangle, not a rounded thumbnail.

**Creative gaps**
- Default discovery after one crate is still **square rails**.
- Home’s first cultural image is a **pictogram**, not a record.
- Player preview/idle often shows the lockup instead of a sleeve — logo-as-art flattens the crate.
- No magazine spread (pull quote, liner, credits) on Home; liner notes exist as a sheet (`LinerNotesSheet`).
- Rank badges still dark glass rectangles, not channel bugs.

**Recommendations**
- Lead every destination with one oversized sleeve or photo.
- Channel row: mosaic of *track* art inside the bug, or a single editorial still (Explore already does this).
- Pull one liner/credit line onto the crate lead.
- Playing sleeve colours the chassis; acid/Aqua should not compete with the cover.

---

### 3.7 Motion & Micro-interactions — 6.0/10 · **3.0 / 5**

**Evidence**
- Documented principles: rhythm over bounce, reduced motion (`src/motion/tokens.js`, `index.css`).
- Live LED, dock rise, like pop, trackSwap 320ms, LCD pip pulse, planet spin, Explore Ken Burns 32s, sleeve crossfade class.
- LCD marquee 14s linear — exists; not yet a signature moment on every now-playing title.
- Native range thumb + width animation still feels iOS.
- Energy control historically used bounce; `PRESS_EASE` is now `motion.ease`.

**What's working**
- Motion is mostly calm and music-adjacent. Reduced motion is respected.
- Scanline wash on LCD is the right *kind* of artifact (subtle, local).

**Creative gaps**
- Ambient loops (planet, Ken Burns, live dot) can out-talk the track.
- No tactile *click* on hardware keys beyond shadow invert.
- Marquee is slow (14s) and easy to miss; seek lacks LCD digit ticking.

**Recommendations**
- Fast digital: progress fill, pip, 200–350ms sleeve crossfade, overflow marquee ~8s.
- Gate ambient animation to playing + visible.
- Key press = 1px inset, not scale.

---

### 3.8 Mobile & Responsive Experience — 6.5/10 · **3.3 / 5**

**Evidence**
- Safe areas, dock insets, compact dock extras, Home 960 / Explore breakpoints 720 / 1100.
- 390px preview: masthead + Channel Surfing + hero; **bottom nav covers Up Next / transport**; hero becomes a poster with truncated LCD.
- Desktop broadcast preview: sidebar + 960 stage + messenger + **also** the mobile pill dock — cramped, not “destination scale.”
- Immersive two-column CSS exists; live `#player-preview` still felt like a phone floating in a blur field with empty black around it.

**What's working**
- Phone shell is considered (safe area, tap sizes, dock rise).
- Explore actually uses the wide canvas (hero + mosaic).

**Creative gaps**
- Home on desktop is a phone column with extra gutters.
- Dock collision with hero on small phones.
- Mini-player “show bar” preview collapsed to a thin strip in a void — not a device.

**Recommendations**
- `<720`: one column, persistent mini-device, Channel Surfing as peeking rail.
- `≥860`: Home as stage (hero device full width) + crate grid; no pill dock.
- Immersive desktop: art | LCD+keys filling ~80% width, less blur void.

---

### 3.9 Design System Consistency — 6.5/10 · **2.0 / 3**

**Evidence**
- Real token file: `color`, `radio`, `hardware`, `type`, `homeSpace`, `broadcast`, `BTN_PRIMARY`.
- Names lie: `y2k.cyan` / `neon` / `techBlue` = Aqua; `IceOrbPlay` alias; `glass-dock`; `pmp-home-mtv`; tests named “acid chassis” (`styleShip.test.js`) while locking Aqua.
- `CREATIVE_DIRECTION_AUDIT.md` still narrates `acid-device-20260918` and flask-demoted Bunny in the same file that claims Aqua phases 1–3 shipped.
- Pill + hardware + cream pictogram + Aqua fill = four component dialects.

**What's working**
- One token file is enough to restyle the OS without a new dependency.
- DeviceChrome is the start of a real component kit.

**Creative gaps**
- Stale docs/tests will cause the next PR to design the previous movie.
- `radius.pill` still in the public API.

**Recommendations**
- One pass: align comments/tests to the chosen accent. Keep alias exports until a later rename PR.
- Document the kit: Panel, LCD, Key, Sleeve, Bug, Crate, Nav selector.
- Deprecate `radius.pill` for product UI (keep internally if a third-party control needs it).

---

### 3.10 Technical Feasibility & Incremental Improvement — 8.5/10 · **1.7 / 2**

**Evidence**
- Player restyle, crate, LCD, pictogram colour already landed as incremental PRs without an IA rewrite.
- Shared chrome means an accent swap is mostly `theme.js` + assert script + a few leftover hexes.
- No new libraries required. Constraints (preserve playback, routing, Club, billing, engine) are compatible with this audit.
- Remaining risk: `App.jsx` size, Home dock visibility, native range styling, catalog bitrate field (may not exist in Firestore).

**What's working**
- The team can ship identity in place. That is rare and should dictate the roadmap.

**Creative gaps**
- None that justify a rewrite. The gap is *choosing the signal colour and sticking to one player drawing.*

**Recommendations**
- Highest impact, lowest risk: accent → acid as LCD; seek thumb; paddle labels; stop `hideDockPlayer` mismatch; crate-first Home; desktop hide pill dock.
- Do not add animation libraries, new fonts, or a component framework.

---

## 4. Top 10 Strengths

1. **Station-first product** — Channel Surfing, On Air, program guide, not a faceless For You feed.
2. **DJ-grade engine in the UI** — BPM, Camelot, energy 1–10, Turtle/Bunny actually change upcoming picks.
3. **DeviceChrome is real** — LCD, scanlines, hardware keys, catalog mark, shared across hero / immersive / dock.
4. **IBM Plex Sans + Mono** — firmware voice, not Inter, not costume Lucida.
5. **Dark metal studio** — `#090A0D` / graphite / silver hairlines match the brief’s materials (even when the LED colour does not).
6. **Crate spread** — first magazine/shop layout on Home; LCD bits on the lead sleeve.
7. **Explore hero** — editorial photography at a scale Home still lacks.
8. **Club as a record club** — membership, credits, collectible card — culture, not SaaS billing-only.
9. **Motion principles + reduced motion** — rhythm over bounce, already coded.
10. **Original vocabulary** — crate, cuts, stacks, dedicate, PLANET/003 — protect this; gloss it, don’t kill it.

---

## 5. Top 10 Creative Gaps

1. **Aqua instead of acid-green** — the brief’s signature LED is retired in tokens; the UI reads iTunes, not Planet.
2. **Streaming shell layout** — four-tab dock + iTunes source list + App Store rails.
3. **Three player drawings** — card vs phone theater vs strip; Home hides the dock.
4. **Pictograms as the first cultural image** — Channel Surfing cream/silver icons beat album art to the punch.
5. **Turtle/Bunny under-labeled** on Home/dock — the most Planet control looks like shuffle/repeat.
6. **iOS seek thumb** — round Aqua knob on a capsule track.
7. **No bitrate / MP3 artifact** — the category is in the name; the LCD never says MP3/kbps.
8. **Mascot/planet splash-only** — personality does not survive into the listening OS.
9. **Pill leftovers** — search chips, energy menus, `radius.pill` 980 vs 8px keys.
10. **Desktop waste** — 960 phone column, pill dock + sidebar together, immersive blur void.

---

## 6. P0 (Essential) Improvements

Preserve playback, routing, Club, billing, recommendation engine. No new dependencies.

1. **Signal colour = acid LCD** — `color.accent` `#B8F24A`, `onAccent` near-black. Use on LCD glyphs, pip, progress fill, focus, selected row **pip**. Metal keys stay silver. Live stays red. **Do not** fill the whole sidebar/tab with green.
2. **One player drawing** — art window + LCD (title, BPM, Camelot, time, optional kbps) + Turtle / Prev / Play / Next / Bunny. Apply to immersive, hero, dock, desktop mini via existing `DeviceChrome`.
3. **Seek groove, not iOS capsule** — hide/replace the native round thumb; 2–4px fill in `radio.lcdTrack`.
4. **Always-on mini-device** — stop the Home hero from teaching a different transport than the rest of the app (`hideDockPlayer`), *or* restyle the dock as a true sibling of the hero before hiding it.
5. **Label Turtle / Bunny** on Home and dock (`showLabel` or adjacent ±BPM). Flask stays on Interests.
6. **Home first screen = device + crate**, not pictogram strip + rails. Demote Channel Surfing to a compact dial under the hero *or* make the first channel a featured sleeve.

---

## 7. P1 (Important) Improvements

1. Masthead: firmware lockup over 34px “Planet MP3.”
2. Channel Surfing: dark plates; featured station; mosaic of sleeves inside bugs.
3. Crate/mosaic as default on Explore genres and Library stacks (pattern exists).
4. Desktop: hide pill dock; sidebar as source list; mini-device full width of content.
5. Immersive desktop: fill `.pmp-device-stage`; reduce blur void.
6. Search/energy chips → LCD plates (radius 4).
7. Bitrate or `MP3` badge on LCD when data exists; don’t block on a schema change — static format mark is enough at first.
8. Camelot/BPM index chips on Explore empty/browse.
9. Gloss “Stacks — your playlists” once.
10. Align `CREATIVE_DIRECTION_AUDIT.md` / `styleShip` test names with the actual chassis so the next PR does not re-introduce Aqua-as-identity *or* flask-as-tempo.

---

## 8. P2 (Polish) Improvements

1. LCD marquee ~8s when title overflows; tabular time ticks.
2. Key press 1px inset; no tile `.pmp-lift` bounce on crate rows.
3. Rank/video as hairline bugs, not dark pills.
4. Mascot as a small dock pip or Club card stamp — not a second splash.
5. Liner sentence on crate lead.
6. Gate Ken Burns / planet / LIVE pulse to playing + on-screen.
7. Rename leftovers in a dedicated PR: `IceOrbPlay`, `glass-dock`, `pill-nav`, `y2k.cyan`.
8. Club without a second hue — same metal + acid.
9. Admin off the consumer dock.
10. Optional scanline only inside LCD (already the intent; keep opacity ~0.04).

---

## 9. Ideal Homepage & Navigation

**Keep:** Home / Explore / Library / Club. Search from Explore/header. Charts + Build a set in the source list. No new tabs.

**Home (mobile)**  
1. Compact firmware masthead (`PLANET / 003` + mark).  
2. **Now-playing device** (the same drawing as the dock, large).  
3. **Crate of the session** (lead sleeve + 3–4 cuts with BPM/key).  
4. Compact Channel Surfing (bugs, one featured).  
5. Tonight / Most Requested as secondary.  
6. Persistent mini-device + device-selector tabs.

**Home (desktop)**  
- Left: source list (not a filled Aqua capsule — pip + hairline).  
- Center: wide device stage + crate grid.  
- Optional station chat as a *module*, not a third OS.  
- No floating iOS dock.

**Nav chrome**  
- Mobile: hardware selector, 11px+ labels, acid pip on active, metal inactive.  
- Desktop: sidebar + mini-device only.

---

## 10. Ideal Music Player

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

- Immersive = this at deck scale (two columns from 860px).  
- Hero = this as the Home module.  
- Dock/mini = art 48–56px | LCD stack | play | paddles.  
- Booth (dedicate, queue, scene surf, volume) stays a drawer.  
- Artwork colours the bloom; acid only on LCD/progress/pip.

---

## 11. Recommended Design System

### Colour

| Role | Hex | Use |
|---|---|---|
| Void / canvas | `#07080A` / `#090A0D` | App floor |
| Chassis | `#101218` | Player body, dock, panels |
| Raised | `#181B22` | Lists, modules |
| Hairline | `rgba(232,234,238,0.12)` | Bezels |
| Silver | `#C5CAD3` | Metal, secondary |
| Off-white | `#E8EAEE` | Primary text |
| Mute | `#8B939F` | Secondary text |
| **Acid** | `#B8F24A` | LCD, pip, progress, focus |
| Acid dim | `rgba(184,242,74,0.16)` | Selection wash only |
| On-acid | `#0C1008` | Text on primary CTA |
| Live | `#E0314A` | ON AIR / destructive |
| Artwork | track colour | Bloom / dock tint |

Until acid ships, the *roles* above still apply with Aqua — but Aqua should be treated as a **stopgap LED**, not the brand.

### Typography

- UI / titles: IBM Plex Sans 600–700, tight tracking on large type.  
- LCD / meta: IBM Plex Mono 11–13px, tracking 0.08–0.14em.  
- Track titles: sentence case, never all-caps.  
- Uppercase only on device labels: `ON AIR`, `BPM`, `BUNNY`, `TURTLE`, `PLANET / 003`.

### Spacing / radius / motion

- 4px grid; `homeSpace.gutter` 20.  
- Radius **4 / 6 / 8 / 12**. Sleeves 4–6. Keys 8. Sheets 12 top. **No 980 on product controls.**  
- Motion: 80–200ms chrome, 300–350ms sleeve, linear progress, no bounce.

### Components

- **Panel** — `radio.moduleFace` + hairline.  
- **LCD** — `radio.lcdFace` + `ScanlineWash` + mono glyphs.  
- **Key** — `hardwareKey`. **PlayKey** when glowing = acid plate.  
- **Sleeve** — `ArtFrame`.  
- **Bug** — LIVE / CH ident (already on hero).  
- **Crate** — `CrateSpread`.  
- **Nav** — device selector, not pill tabs.

---

## 12. 90-Day Incremental Implementation Roadmap

No rebuild. No new deps. Each phase is a PR-sized restyle on existing components.

**Days 1–21 — Signal & the device (P0)**  
Accent → acid LCD roles; seek thumb; paddle labels; hero/dock/immersive share one drawing; fix Home transport split; assert script + tests updated so Aqua cannot silently return.

**Days 22–45 — Crate as default (P0/P1)**  
Home: device first, crate second, channels as bugs; Channel plates darkened; desktop hide pill dock; immersive two-column actually filled.

**Days 46–70 — Culture surfaces (P1)**  
Explore/Library crate language; Camelot/BPM index; MP3/kbps LCD; search chips as plates; Club card in the same metal OS.

**Days 71–90 — Polish (P2)**  
Marquee, leftover renames, mascot as stamp, liner on crate, motion gating, Admin off dock. Measure: does a cold screenshot still look like Apple Music? If yes, cut another rail.

**Non-goals:** new fonts, animation libs, extra tabs, purple/cyan second accent, fake CRT wallpaper, IA rewrite.

---

## If I could only implement five changes, they would be:

1. **Make acid-green the LCD signal** (progress, glyphs, pip, focus) on the existing dark metal chassis — stop looking like iTunes Aqua night mode.  
2. **One player-as-device drawing** shared by immersive, Home hero, and dock (art + LCD + Turtle/Prev/Play/Next/Bunny).  
3. **Replace the iOS seek capsule** with a true LCD groove and labeled Turtle/Bunny on every transport, not only the full-screen player.  
4. **Lead Home with the device + one crate spread** (sleeves, BPM/Camelot); demote equal Channel Surfing pictogram rails from the first impression.  
5. **One desktop chrome system** — source list + persistent mini-device; remove the floating phone tab bar from large screens so PlanetMP3 feels like a deck, not a streaming web app.
