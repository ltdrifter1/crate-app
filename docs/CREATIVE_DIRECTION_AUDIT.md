# PlanetMP3 — Creative / UI Audit (current chassis)

**Date:** 18 Sep 2026  
**Scope:** Visual identity, Y2K, underground culture, typography, colour, artwork, player, originality, motion, cohesion. Functionality is out of scope except where it *reads* as identity (Bunny/Turtle, metadata, dual transports).  
**North star:** *A futuristic MP3 player from an alternate 2003* — not a Spotify clone, not a fake-retro website, not Apple Music in a dark skin.  
**Mix:** 40% modern product design · 25% Y2K digital culture · 20% underground music culture · 15% PlanetMP3 personality.

This is **not** a UX/feature audit. See `docs/UX_AUDIT.md` for ergonomics, search, stacks, and a11y.

**Status:** Phases 1–3 implemented on the shipped Aqua chassis (`STYLE_CHASSIS = aqua-device-20260918`). Preserve playback, routing, Club, billing, and recommendation engine. Reuse existing components; no IA rewrite.

---

## What changed since the 17 Sep audit

The 17 Sep document scored the **light iPod / Aqua** OS. That chassis is gone.

Shipped on main (`STYLE_CHASSIS = acid-device-20260918`):

- Dark canvas `#090A0D`, acid accent `#B8F24A`, IBM Plex Sans + Mono (`src/theme.js`, `public/index.html`, `src/index.css`)
- Boot splash / spinning planet with acid bloom
- Home masthead `PLANET / 003` (no calendar date)
- Bottom nav acid pip (not Aqua fill)
- Hero meta chips: hairline boxes, mono, acid
- Play control restyled as a 8px hardware key (`IceOrbPlay` — name leftover)
- Jewel-case `artFrameStyle` + acid active ring
- Home width 960, featured tiles 200, collections wired

**The environment flipped. The product grammar did not.** Home is still App Store rails. The player is still a phone theater with a Spotify-density dock. Bunny/Turtle were demoted to a chemistry flask slider. Light-pearl leftovers remain in ImmersivePlayer booth chrome.

This audit scores **today’s dark chassis against the brief**, not against generic polish.

---

## 1. Scorecard

| Category | Score | Band | vs 17 Sep |
|---|---:|---|---|
| Visual identity | **6** | Improve | +1 |
| Y2K influence | **6** | Improve | +1 |
| Underground music culture | **5** | Improve | 0 |
| Typography | **7** | Refine | +2 |
| Colour system | **7** | Refine | +4 |
| Artwork treatment | **6** | Improve | 0 |
| Music player | **5** | Improve | −1 |
| UI originality | **5** | Improve | +1 |
| Motion & interaction | **6** | Improve | 0 |
| Overall cohesion | **6** | Improve | +1 |
| **Overall average** | **5.9 / 10** | **Improve** | was 5.0 |

**9–10 Preserve · 7–8 Refine · 5–6 Improve · 0–4 Redesign priority**

**Read of the mix today (approx.):** 50% modern dark streaming shell · 20% acid-device tokens · 15% broadcast/station vocabulary · 10% leftover iTunes/App Store comments and patterns · 5% Planet weirdness (flask, PLANET/003, spinning planet).

**Target mix:** 40 / 25 / 20 / 15. Colour and type moved. Layout, player object, and culture surfaces still read as a dark Apple Music clone with a green LED.

---

## 2. Category notes

### Visual identity — 6/10

**Working**
- Tokens now *say* Planet: dark studio, silver metal, acid signal (`theme.js` header).
- Brand objects: lockup, mascot Lottie, tagline *YOUR WORLD, YOUR MUSIC.*, member numbers, `PLANET / 003` masthead, station callsign, spinning-planet splash.
- Vocabulary still distinctive: crate, stacks, cuts, on air, dedicate, channel bugs, energy shift.
- Primary CTA is acid plate + dark inscription (`BTN_PRIMARY`).

**Generic / off-brand**
- Component comments still cite App Store, Music.app, iTunes source list (`TrackCard`, `ChannelCard`, `CardContainer`, `HomeScreen`, `App.jsx` desktop shell, `ArtFrame`).
- `IceOrbPlay` / `glassPill` / `pill-nav` names describe a previous product.
- Identity lives in chrome (header, accent, splash) more than in destinations. Library / Search / Club are dark skins of the same streaming shell.
- Mascot and planet are splash-only; they barely appear in the listening OS.

**Should change**
- Treat the **player chassis** as the brand object, not the splash.
- One visual OS from Home → Explore → Library → Club → Player (already one *palette*; not yet one *grammar*).
- Keep vocabulary; put catalog numbers and firmware labels on the device, not only the Home h1.

**Implementation**
- Do not rename every component in Phase 1. Restyle `HeroPlayerCard` / `ImmersivePlayer` / `GlassDock` as one device drawing. Hunt leftover pearl fills. Leave `IceOrbPlay` name until a later rename PR.

---

### Y2K influence — 6/10

**Working**
- Hardware keys, hairline bezels, LCD tokens (`radio.lcdFace`, `broadcast.lcdFill`), LIVE LED, channel ident, ticker CSS, `ScanlineWash` restored on LCD-adjacent surfaces.
- IBM Plex reads as firmware, not costume Lucida.
- Motion: “rhythm over bounce” still documented.

**Generic / off-brand**
- Y2K here is **token flavour**, not **interface archaeology**. Winamp / MiniDisc / early-web / club-CD energy is not the layout.
- `ScanlineWash` exists; it is not a branded LCD readout (title/BPM/key/time in a recessed green window).
- Seek bars remain iOS capsules (`borderRadius: 999`).
- Channel Surfing uses original iTunes/MTV pictograms (commit `#227`) — period-correct *illustration*, still not a crate or flyer.
- Desktop shell comment: “iTunes-style source list.”

**Should change**
- LCD as a real rectangle: title marquee, BPM, Camelot, elapsed — acid glyphs on olive-black, scanlines *inside*.
- Hardware transport row, not a row of soft glass icons.
- Subtle digital artifacts only on LCDs and progress. No fake OS desktop, no full-page CRT.

**Implementation**
- Apply existing `radio.lcd*` tokens to hero + immersive + dock readouts. Replace capsule seek with `broadcast.lcdTrack` / `lcdFill` (already defined, underused).

---

### Underground music culture — 5/10

**Working**
- Product is DJ-grade: Camelot, BPM, energy 1–10, harmonic search (`124bpm`, `8A`), scene channels, Club, mixes, dedicate, liner notes, countdown.
- Empty-state voice is closer to a shop than to Spotify.
- Explore has Mixmag-scale hero photography and mosaics — the most cultural surface.

**Generic / off-brand**
- Metadata is still a caption, not identity. Hero chips include album/genre/BPM/Stereo; **Camelot is missing** on the Home hero (`HeroPlayerCard` MetaChip row). Immersive `metaBits` has BPM/key/energy but at footnote size.
- `TrackCard` is “App Store / Apple Music square tile” with rank/video as black pills.
- Scene/channel presentation is equal tiles, not flyers.
- Club / Mix / Charts sit in the same module language as Home rails — culture as a tab, not a room.
- **Bunny/Turtle — the most underground-player gesture — are no longer first-class on the transport.** Player, dock, desktop mini, CoverStage, and hero use `EnergyShiftControl` (chemistry flask + hidden slider). Rabbit/Turtle SVGs still exist in `EnergyShiftButton` but are unused on those surfaces.

**Should change**
- Restore Bunny / Turtle as labeled hardware paddles with ±BPM. Flask can remain for *taste* (`FlaskTasteButton` on interests), not tempo.
- Show `124 BPM · 8A · E7` as LCD type on every now-playing surface.
- One editorial/crate spread per destination (Explore already closest; Home still rail-stack).

**Implementation**
- Swap `EnergyShiftControl` back to a pair of `EnergyShiftButton`s (or a new paddle wrapper using those icons) on hero, immersive, dock, desktop. Keep `setEnergyBias` / long-press menu. Restyle buttons: radius 8, `hardwareKey`, labels `TURTLE` / `BUNNY` or `EASE` / `LIFT`, `±10 BPM`.

---

### Typography — 7/10

**Working**
- IBM Plex Sans + Mono is the right stack for the brief (technical, compact, not Inter-SaaS, not costume Lucida).
- Type scale in `theme.js` is real (`largeTitle` → `caption`). Tight tracking on titles.
- Device labels exist: `PLANET / 003`, `ON AIR`, Live plate, channel ident.
- Mono used for times, energy labels, meta chips.

**Generic / off-brand**
- Home h1 is still 34px product name — App Store large title with a firmware eyebrow taped on.
- Nav labels 10px (`BottomNavigation`) — below the 11px floor from `docs/UX_AUDIT.md`.
- Energy paddle captions 9px when `showLabel`.
- Track titles are good; section titles still Music.app “See All” grammar (`type.seeAll`).
- Charts tests may still assert Lucida (`ChartsScreen.test.js`) — drift vs shipped Plex.

**Should change**
- Masthead: compact wordmark + catalog line as *the* title; drop competing 34px “Planet MP3” if the catalog line is doing the job (or invert: wordmark compact, catalog larger).
- Metadata always mono 11–13px, tracking 0.08–0.14em. Uppercase only on device labels.
- Floor informational type at 11px.

**Implementation**
- Token: add `type.lcd` / `type.bug`. Raise nav caption to 11. No new webfont.

---

### Colour system — 7/10

**Working**
- Brief palette is specified and mostly shipped: void/chassis/raised, silver hairlines, off-white ink, acid `#B8F24A`, live red `#E0314A` only.
- Aqua `#1E6FE8` / pearl `#E6E9EF` are **build-gated out** (`scripts/assert-shipped-style.js`).
- Artwork tint on dock (`dockTintStyle`) is the right idea.
- Focus/selected/play/progress share acid.

**Generic / off-brand**
- Acid is used as *paint* (active tab wash, glowing play key, CTA) more than as *signal* (LCD glyphs, pip, progress). Easy to look like “Spotify green, different hex.”
- Immersive booth drawer is still **light pearl**: `linear-gradient(... rgba(255,255,255,0.94) ... rgba(232,236,242,0.9))` — a hole in the OS.
- `y2k.cyan` / `techBlue` / `neon` all alias to acid — names still lie.
- Flask/energy popovers use mid-grey glass `rgba(56,62,72,0.95)` that reads as leftover aluminum, not LCD.
- Seek fill is acid; the *track* is still a 3px iOS capsule.

**Should change**
- Acid = play pip, progress, focus ring, LCD text, selected row. Metal = keys. Artwork = atmosphere. Red = LIVE only.
- Kill remaining light panels in ImmersivePlayer.
- Do not introduce a second brand hue for Club.

**Implementation**
- Grep `255,255,255,0.94`, `232,236,242`, `borderRadius: 999`, `borderRadius: 980`. Recolor booth to `radio.moduleFace`. Keep token names to avoid a 200-file rename.

---

### Artwork treatment — 6/10

**Working**
- Shared `ArtFrame` / `artFrameStyle` / jewel shadows; active acid pip.
- Tile sizes 160 / 168 / 200; mosaics for channels/stacks.
- Immersive + artist/album + Explore hero treat sleeves as large objects (blur bloom, Ken Burns).
- CoverImage lazy/priority pipeline.
- Video stage is a real dark rectangle.

**Generic / off-brand**
- Default discovery is still **equal square rails with two caption lines**.
- Hero sleeve is 220px inside a padded card — better than 148px, still not a device window or magazine cover.
- `ArtFrame` default radius 8; comment still “Music.app sleeve… no jewel bevel” while `artFrameStyle` *does* bevel.
- Rank/video badges are generic black pills (`borderRadius: 11–12`).
- Playing-state stain is timid (immersive art opacity 0.38 with heavy dark veil).

**Should change**
- One oversized artwork moment per destination. Rails OK as secondary.
- Sleeve corners 4–6px. Badges = hairline bugs, not pills.
- Let the playing sleeve colour the chassis (dock tint + player bloom). Do not let acid compete with the cover.

**Implementation**
- Hero: art as primary panel (~full width on mobile / 280–320px device window). `ArtFrame` default radius 6. Featured Home band stays 200; secondary 160.

---

### Music player — 5/10

**Working**
- Player is still the most designed object: immersive theater, dock, desktop mini, seek, shuffle/repeat/volume, On Air, session arc, dedicate, video.
- Transport plumbing (crossfade, Media Session, unlock, playback store) is solid.
- Home hero is now a two-column art + meta + transport module — closest to “device.”
- Play key is hardware-shaped (8px), acid when playing.

**Generic / off-brand**
- Immersive is **phone theater**: full-bleed blur, circular-era comments, iOS seek, 6+ icon buttons, energy flask jammed at the end. Not a physical MP3/DJ unit.
- Dock is a 66px streaming mini-bar (art ring + title + like + play + flask). Spotify/Apple density.
- `hideDockPlayer` on Home when hero is visible — two machines, split muscle memory (`App.jsx`).
- Desktop mini is a glass strip, not a smaller drawing of the same device. Immersive stays single-column on desktop.
- `OrbitalArtRing` is click-wheel residue — clever, off-brief if the player is a 2003 handheld.
- **Bunny/Turtle demoted.** Flask + range slider is lab UI, not a player. The brief: *preserve and elevate* them.

**Should change**
- One device drawing, three sizes: immersive / hero / dock.
- LCD + artwork window + hardware keys + turtle/prev/play/next/bunny.
- Progress = LCD bar (tokens exist). Times in mono.
- Persistent mini-device that matches the hero (do not hide dock *or* make dock a true sibling of the hero visually).

**Implementation**
- Restyle in place: `ImmersivePlayer`, `HeroPlayerCard`, `GlassDock`, `DesktopMiniPlayer`, `OrbitalControls`. Do not merge files. Share tokens only (`radio.*`, `hardware.*`). Restore paddles. Fix pearl booth. Desktop immersive: CSS two-column (art | LCD+keys) without a new IA.

---

### UI originality — 5/10

**Working**
- Original *product*: energy shift, channel surfing, dedicate, member numbers, harmonic search, Club credits, countdown, scene channels.
- Broadcast bugs and PLANET/003 are not Spotify.
- Hardware key language is more original than glass orbs were.

**Generic / off-brand**
- Layout tropes: snapping horizontal rails, See All, equal tiles, frosted sheets, pill leftovers (`radius.pill` 980, energy chips, VideoStage, StationBumper, LinerNotes).
- Bottom nav is still a 5-tab bar (acid wash instead of Aqua fill).
- Home comment: “clean App Store stage card.”
- Flask as the energy metaphor collides with Planet’s animal paddles and with taste-flask — two flasks, zero bunnies on the player.

**Should change**
- Panels, modules, lists, grids, overlays, editorial spreads. Radius 4–12. Hairlines. No pill soup.
- Nav can stay 4–5 destinations; look like a device selector (closer now) not iOS tabs (labels still tiny, capsule container `borderRadius: 14`).
- Originality should come from **the player + metadata + paddles + crate layouts**, not from a new mascot on the splash.

**Implementation**
- Phase 1 does not redesign Home IA. It restyles the player object and kills pills on transport. Phase 2 introduces one magazine/crate module using existing `buildHomeCollections` / Explore mosaics as the pattern.

---

### Motion & interaction — 6/10

**Working**
- Documented principles; reduced motion global kill-switch.
- Dock rise, like pop, live LED, press/lift, trackSwap, Explore Ken Burns, buffering spinner, planet spin on splash.
- Progress isolated in playback store — good.

**Generic / off-brand**
- Energy still uses bounce easing `cubic-bezier(0.34, 1.4, 0.64, 1)` and `scale(1.06)` hover — fights “rhythm over bounce.”
- Seek is a width animation on a capsule; not an LCD fill.
- Title marquee / ticker is not a brand moment on the player LCD.
- 12s art bloom on immersive is Apple Music, not a deck.
- `.pmp-lift` on every tile = App Store hover.

**Should change**
- Fast digital: LCD digits, progress fill, pip pulse, panel slide, overflow marquee, sleeve crossfade (~200–350ms).
- Key press = 1px inset, not elastic scale.
- Gate ambient loops (planet, Ken Burns, live dot) to visible + playing.

**Implementation**
- Replace `PRESS_EASE` with `motion.ease`. Add CSS `lcdPulse` / `pmp-ticker` on player title when truncated. Keep `ScanlineWash` opacity ~0.04 on LCD only.

---

### Overall cohesion — 6/10

**Working**
- One dark + acid token file. Home / nav / splash / primary buttons agree.
- Previous purple-vs-ice and Aqua-vs-LCD splits are largely dead. That is valuable — **do not fragment it again.**

**Generic / off-brand**
- Cohesive *palette*, split *objects*: hero card vs immersive theater vs dock strip vs flask popover vs pearl booth vs Explore 18px-radius poster.
- Token aliases (`y2k.cyan` = green) and component names (`IceOrbPlay`) keep the team designing the previous movie.
- Tests/docs still mention Lucida, iTunes, Music.app in places.

**Should change**
- One environment, one accent, one metal, **one player object**, one type stack, artwork for hue.
- Preserve IA and engines. Restyle the shell and player.

---

## 3. Top 10 highest-impact improvements

1. **One player-as-device** — LCD + artwork window + hardware transport, shared by immersive / hero / dock / desktop mini. Highest identity swing now that colour already flipped.
2. **Restore and elevate Bunny / Turtle** — labeled metal paddles with ±BPM on the transport row; demote flask to taste, not tempo.
3. **LCD metadata as identity** — `124 BPM · 8A · E7 · time` in Plex Mono on every now-playing surface (add Camelot to Home hero).
4. **Kill light-pearl leftovers** — Immersive booth drawer and any white modules; they puncture the OS.
5. **Acid as signal, not Spotify paint** — progress/LCD/pip/focus; metal keys; artwork atmosphere.
6. **Artwork at device/poster scale** on Home hero + player; sharper 4–6px sleeves; bug badges not pills.
7. **Persistent mini-device** — stop hiding the dock on Home *or* make hero/dock the same object so muscle memory holds.
8. **Editorial module on Home/Explore** — one magazine/crate spread using existing collections/mosaics; rails become secondary.
9. **Digital motion on LCDs** — scanline-in-LCD, title marquee, pip pulse, fast sleeve crossfade; remove energy bounce.
10. **Nav + masthead as firmware** — 11px+ labels, catalog lockup, device-selector tabs; stop App Store large-title competition.

---

## 4. Quick wins (minimal code, no IA)

| Win | Where | Notes |
|---|---|---|
| Recolor immersive booth to `radio.moduleFace` | `ImmersivePlayer.jsx` ~860 | Removes pearl hole |
| Camelot + energy chips on hero | `HeroPlayerCard` MetaChip row | Data already on track |
| Seek: `radio.lcdFill` + radius 2–4 | `ChromeSeek`, hero bar | Tokens exist |
| `ArtFrame` / TrackCard radius 6 | `ArtFrame.jsx`, `TrackCard` | Jewel not app-icon |
| Nav label 11px | `BottomNavigation.jsx` | Contrast/legibility |
| Energy bounce → `motion.ease` | `EnergyShiftButton.jsx` `PRESS_EASE` | One constant |
| Restyle flask control as two paddles | Player/dock/hero call sites | Reuse `EnergyShiftButton` + Rabbit/Turtle SVGs |
| Meta chip radius 4 (already ~4) + add `8A` | Hero | Tiny |
| Badge pills → 4px bugs | `TrackCard` rank/video | |
| Update stale comments | TrackCard, ArtFrame, HomeScreen | Stops the next PR from designing iTunes |

Playback, routing, Club, billing untouched.

---

## 5. Recommended design system

### Colour

| Role | Hex | Use |
|---|---|---|
| Void | `#07080A` / canvas `#090A0D` | App floor |
| Chassis | `#101218` | Player body, dock, panels |
| Raised | `#181B22` | Modules, lists |
| Hairline | `rgba(232,234,238,0.12)` | Bezels, dividers |
| Silver | `#C5CAD3` | Metal, secondary labels |
| Off-white | `#E8EAEE` | Primary text |
| Mute | `#8B939F` | Secondary |
| **Acid** | `#B8F24A` | LCD glyphs, play pip, progress, focus, selected |
| Acid dim | `rgba(184,242,74,0.16)` | Selection wash only |
| On-acid | `#0C1008` | Text on primary CTA |
| Live | `#E0314A` | ON AIR / destructive |
| Artwork | track colour | Bloom, dock tint — never a second brand hue |

Do not: Aqua, purple, light gray page, acid-everywhere gradients on keys.

### Typography

- **UI / titles:** IBM Plex Sans, 600–700, tracking −0.02 to −0.04em on large type.
- **Metadata / LCD:** IBM Plex Mono, 11–13px, tracking 0.08–0.14em. `124 BPM` · `8A` · `E7` · `PLANET / 003`.
- **Track titles:** sentence case, high contrast, never all-caps.
- **Device labels only** uppercase: `ON AIR`, `BPM`, `SEEK`, `BUNNY`, `TURTLE`.

### Spacing / radius / borders

- 4px grid (`space(n)`). `homeSpace.gutter` 20.
- Radius: **4 / 8 / 10 / 12**. Sleeves **4–6**. Hardware keys **8**. Sheets **12** top. **No 980 pills** on transport.
- 1px silver hairline. Inset highlight on metal (`hardware.keyRaised`).

### Icons / buttons

- Keep `Icon` stroke set. Recolor silver / acid / off-white.
- Primary: acid fill, dark label, radius 8.
- Secondary: dark metal plate.
- Icon keys: 40–44px, radius 8, pressed inset.
- **Bunny/Turtle:** custom SVGs already in `EnergyShiftButton.jsx` — enlarge, label, show `±10 BPM`.

### Components

- **Panel:** dark module, hairline, optional top silver edge (`radio.moduleFace`).
- **LCD:** `radio.lcdFace` + `ScanlineWash` + mono glyphs.
- **Tile:** ArtFrame + title + one meta line (BPM/key), not two generic captions only.
- **Nav:** device selector, acid pip, 11px labels.

### Player (canonical drawing)

```
┌──────────────────────────────────────────────┐
│  ON AIR · CH03                    PLANET/003 │
│  ┌────────────┐  TITLE (marquee if overflow) │
│  │            │  Artist                      │
│  │  ARTWORK   │  124 BPM   8A   E7           │
│  │            │  ████████░░░░  SEEK          │
│  └────────────┘  01:14 / 03:42               │
│  [TURTLE] [PREV] [ PLAY ] [NEXT] [BUNNY]     │
│           −10 BPM                    +10 BPM │
└──────────────────────────────────────────────┘
```

Dock = same drawing at ~72px (art | LCD stack | play | paddles). Not a different component language.

---

## 6. Phased implementation plan

Preserve functionality. Reuse components. No App.jsx decomposition, no new IA, no engine changes.

### Phase 1 — Highest impact (player object + leftovers)

1. Restyle `ImmersivePlayer` + `HeroPlayerCard` + `GlassDock` + `DesktopMiniPlayer` to the drawing above (tokens, not new architecture).
2. Restore Bunny/Turtle paddles on those four surfaces; keep long-press BPM menu + `playerEnergyStore`.
3. LCD readout: title, artist, BPM, Camelot, energy, time; scanline inside LCD.
4. Recolor pearl booth; LCD seek; hardware keys; no bounce.
5. Optional: stop hiding dock **or** visually twin hero/dock — pick one in implementation, don’t invent a third player.

**Risk:** control density on small phones. If dock can’t fit paddles, keep play + art + LCD meta on dock; paddles on hero/immersive only — but they must be *visible brand*, not a flask.

### Phase 2 — Refinement (surfaces)

1. Home/Explore: one editorial/crate module; sharper tiles; meta line on `TrackCard`.
2. Search, Library, Club, Login, Paywall: same tokens, kill pill leftovers.
3. Artist/Album: already art-forward; retune badges and LCD-style meta.
4. Desktop: two-column immersive (CSS); Home stays 960 unless a featured poster needs 1120.
5. Masthead/nav type floor.

### Phase 3 — Polish

1. Title marquee, pip pulse, sleeve crossfade, gated ambient loops.
2. Stronger art-driven bloom on dark (without washing acid LCDs).
3. Comment/name cleanup (`IceOrbPlay` → `PlayKey` in a dedicated PR).
4. Screenshot pass: mobile player, Home, Explore, Library, Login.
5. Motion audit vs `prefers-reduced-motion`.

---

## 7. Preserve vs. kill

| Preserve | Kill / demote |
|---|---|
| Dark + acid token chassis | Flask as the *player* energy control |
| Lockup, mascot, tagline, member numbers, PLANET/003 | Pearl/light booth leftovers |
| Crate / stacks / cuts / on air vocabulary | App Store rail as the only Home rhythm |
| BPM, Camelot, energy *data* and search grammar | iOS capsule seek as the progress language |
| Rabbit/Turtle *behavior* and SVGs | Dual player languages (theater vs strip vs flask) |
| Scene channels, countdown, Club, dedicate | `radius.pill` on transport and badges |
| ArtFrame, CoverImage, dock tint, playback stores | Aqua / purple / second brand hue |
| 4–5 tab IA, existing screens | Full rewrite of App.jsx / new architecture |

---

## 8. Approval gate

No major structural or architectural changes until confirmed.

**Please confirm:**

1. Phase 1 is **player-as-device + Bunny/Turtle restoration** (tokens already dark/acid — do not re-litigate the environment).
2. Flask stays on **taste/interests** only; tempo uses paddles.
3. Dock: keep always-on mini-device vs keep `hideDockPlayer` but match hero visually — recommend **match visually first**, always-on dock as a follow-up if density allows.
4. Type: **keep IBM Plex** (already shipped). No third display font.
5. Scope of first implementation PR: player + hero + dock + pearl leftover + meta chips — **not** a full Home IA redesign.

Until then, this document is the only change on the branch.
