# PlanetMP3 — Creative / UI Audit

**Date:** 17 Sep 2026  
**Scope:** Visual identity, typography, colour, player, artwork, motion, cohesion. Functionality is in good shape and is **out of scope** for this pass.  
**North star (this brief):** *“A futuristic MP3 player from an alternate 2003.”*  
**Mix:** 40% modern product design · 25% Y2K digital culture · 20% underground music culture · 15% PlanetMP3 weirdness.

This is **not** a UX/feature audit. See `docs/UX_AUDIT.md` for ergonomics. This is an art-direction audit against the new brief.

**Current shipped direction (main):** light iPod / iTunes / Music.app — see `src/theme.js` and recent commits *“Refresh Planet MP3 to a modern iPod / early-2000s iTunes look”* and *“Unify UI to modern iTunes / Music.app.”* That work is coherent. It is also the wrong chassis for this brief.

**Status:** Audit only. No visual implementation until this document is approved.

---

## 1. Scorecard

Scored against the **target feeling**, not against generic polish. Craft that is excellent *as iTunes* still scores low if it fights the brief.

| Category | Score | Band |
|---|---:|---|
| PlanetMP3 visual identity | **5** | Needs meaningful improvement |
| Y2K / early-digital influence | **5** | Needs meaningful improvement |
| Music / underground culture | **5** | Needs meaningful improvement |
| Typography | **5** | Needs meaningful improvement |
| Colour system | **3** | Redesign priority |
| Album artwork / imagery | **6** | Needs meaningful improvement |
| Music player experience | **6** | Needs meaningful improvement |
| UI originality | **4** | Redesign priority |
| Motion / interaction | **6** | Needs meaningful improvement |
| Overall cohesion | **5** | Needs meaningful improvement |
| **Overall average** | **5.0 / 10** | **Needs meaningful improvement** |

**9–10** Strong / preserve · **7–8** Good / refine · **5–6** Needs meaningful improvement · **0–4** Redesign priority

**Read of the mix today (approx.):** 55% Apple Music / App Store 2020s patterns · 30% iTunes / iPod 2003 consumer chrome · 10% broadcast station vocabulary · 5% underground / PlanetMP3 weirdness.

**Target mix:** 40 / 25 / 20 / 15. The product is currently over-indexed on Apple retail and under-indexed on dark digital, club culture, and PlanetMP3-specific strangeness.

---

## 2. Category notes

### PlanetMP3 visual identity — 5/10

**Works**
- Real brand objects exist: lockup (`BrandLockup` / `public/brand/`), mascot Lottie, tagline *YOUR WORLD, YOUR MUSIC.*, member numbers, station callsign.
- Product language is distinctive when it is allowed to speak: crate, stacks, cuts, on air, dedicate, energy shift, scene channels.
- Theme file is a genuine token system with a written point of view — identity is *specified*, not accidental.

**Generic / off-brand**
- The visual OS is iTunes, not Planet. `theme.js` opens: *“modern iPod / early-2000s iTunes. White-aluminum chassis, Aqua source-list blue.”*
- Primary accent is Aqua `#1E6FE8`. That is Apple’s 2003 *consumer* signal, not Planet’s.
- Home header is App Store large-title + calendar date (`HomeHeader.jsx`). Wordmark is italic Lucida, not a device / magazine masthead.
- Token names lie: `y2k.offWhite` is `#1C1F24` ink; `y2k.charcoal` is `#F4F5F7` pearl. The “Y2K” object is a light iPod, renamed.

**Should change**
- Stop treating iTunes as the brand. Keep Planet lockup, mascot, vocabulary, BPM/key/member metadata.
- Make **acid green on near-black** the signature, aluminum/silver as *hardware*, artwork as *colour*.
- Give the wordmark a device/magazine treatment (compact, tracking, PLANET / 003 energy) instead of App Store title.

**Implementation**
- Phase 1 token rewrite in `src/theme.js` + `public/index.html` theme-color / boot splash. Do not restyle every screen by hand first — swap canvas, ink, accent, primary buttons, dock, nav. Then hunt leftovers.

---

### Y2K / early-digital influence — 5/10

**Works**
- Period craft is real: Lucida Grande, click-wheel aluminum, LCD tokens (`radio.lcdFace`, `chrome.signal` `#6FBF3A`), Aqua selected-row wash, hardware key faces.
- Broadcast leftovers: LIVE LED, channel bugs, ticker CSS (`.pmp-ticker-track`), On Air plate in the immersive player.
- Motion tokens are “rhythm over bounce” — closer to devices than to Dribbble bounce.

**Generic / off-brand**
- This is **Apple Store 2003**, not **Winamp / Napster / club-CD / LCD handheld / early-web** 2003.
- `ScanlineWash.jsx` is a stub: *“Hairline CRT wash — disabled. Music.app has no scanlines.”* Y2K digital was explicitly removed to match Music.app.
- Aqua blue + pearl aluminum + circular glass orbs = consumer electronics brochure, not underground digital culture.
- Pill nav active state is iTunes Aqua gradient (`BottomNavigation.jsx`: `#6FB4F8` → `#1E6FE8`).

**Should change**
- Keep LCD, hardware bevels, LIVE, tickers, technical metadata.
- Drop Aqua as identity. Drop Music.app “no scanlines / no dark studio” rules.
- Re-enable *subtle* digital artifacts (scanlines on LCDs only, marquee metadata, pulsing play pip) — not a fake Windows 95 website, not CRT-over-everything.

**Implementation**
- Restore LCD as the dark rectangle on the player (tokens already exist: `radio.lcdFace`). Put scanlines **inside the LCD**, not across the whole Home.
- Replace Aqua tab/CTA with acid-green indicator + silver hardware.

---

### Music / underground culture — 5/10

**Works**
- The *product* is underground-capable: Camelot keys, BPM, energy 1–10, rabbit/turtle pacing, scene channels, Club, mixes, dedicate, liner notes, charts, Harmonic search grammar (`124bpm`, `8A`).
- Scene/channel photography and Explore mosaics give a path to editorial culture.
- Empty-state voice (“Pulling the station”, crate language) is closer to a record shop than to Spotify.

**Generic / off-brand**
- `TrackCard.jsx` and `ChannelCard.jsx` document themselves as *“App Store / Apple Music square tile.”*
- Scene accents in `sceneChannels.js` are muted greys (`#9AA3B0`, `#8A919C`) — record-shop flyers they are not.
- Genre colours in `genres.js` are near-black browns. Artwork is not allowed to stain the UI except a faint hero wash.
- Club / Mix / Charts still sit in the same pearl chassis. Culture is a feature, not a room.

**Should change**
- Treat BPM / key / bitrate / member ID as **visible identity**, not 10px faint captions.
- Let sleeves colour the environment (already started on dock tint — push it).
- Editorial layouts for Explore/Home: magazine spread + crate grid, not infinite equal rails.

**Implementation**
- Meta chips: `124 BPM` · `8A` · `320 KBPS` · `PLANET / 003` in `fontMono`, acid on dark, hairline boxes — not white pills (`HeroPlayerCard` `MetaChip` is a rounded white capsule).
- One featured editorial band on Home (countdown or release) at poster scale; keep other rails.

---

### Typography — 5/10

**Works**
- One stack, consistently applied: Lucida Grande / Helvetica Neue / Inter. Tight tracking on large titles. Tabular mono for times.
- Type scale in `theme.js` (`type.largeTitle` → `caption`) is real and Apple-like in a good structural way.
- Mono appears on On Air, times, energy labels — a seed of “technical metadata.”

**Generic / off-brand**
- Lucida Grande *is* iTunes. As the only display voice it reads as costume Apple, not Planet.
- Inter is loaded from Google Fonts and is the web fallback — default SaaS.
- Micro labels 9–11px, weight 600, colour `faint` `#8E96A3` on `#E6E9EF` — weak contrast, not a magazine masthead.
- Home title is sentence-case product name at 34px, not compact technical identity.
- Italic wordmark (`BrandMark`) is lifestyle, not device firmware.

**Should change**
- Keep a humanist/technical sans for UI (modern 40%). Add a **compact bold** display for titles and a **mono** layer for all music metadata (Y2K 25% + underground 20%).
- Stop italicizing the wordmark. Use letterspacing and a catalog number instead.

**Implementation (recommended faces — web-safe first)**
- **UI:** keep Lucida/Helvetica *or* swap Inter load for **IBM Plex Sans** (or Geist) — compact, technical, not costume.
- **Meta / LCD:** IBM Plex Mono or the existing `fontMono` stack, 11–13px, tracking `0.08–0.16em`, uppercase only on *device* labels (`ON AIR`, `BPM`), not on track titles.
- **Never** costume headline fonts (Comic, Papyrus, fake pixel display for body). LCD type stays on the LCD.

---

### Colour system — 3/10

**Works**
- Palette is internally consistent: pearl `#E6E9EF`, ink `#1C1F24`, Aqua `#1E6FE8`, LCD green `#6FBF3A`, live red `#E0314A`.
- Artwork tint on the dock (`dockTintStyle`) is the right idea: music brings colour.
- LCD green already exists as `chrome.signal` / `y2k.cyan` / `y2k.neon` — the signature accent is in the file, not on the product.

**Generic / off-brand**
- Brief: *dark digital environment, black / near-black / dark grey / off-white silver, acid green.* Shipped: *“Not a dark studio. White chassis.”* (`theme.js`)
- Primary CTAs, focus rings, selected rows, nav, likes-on-desktop, seek gradient all run **Aqua**. Seek in immersive is even `#6FBF3A` → `#1E6FE8` (lime-to-blue SaaS progress).
- `timeOfDayGradient()` is *“always light, never OLED.”* Opposite of the brief.
- Boot splash, `theme-color`, `index.css` body: `#E6E9EF`.

**Should change**
- Invert the environment. Silver becomes metal highlight, not the page.
- Acid green becomes the *only* brand accent (play pip, progress, live-adjacent digital, focus). Red stays LIVE/destructive only.
- Artwork supplies the rest of the colour. No second brand hue (retire Aqua).

**Implementation**
See Design System below. First files: `theme.js`, `index.css`, `public/index.html`, `BTN_PRIMARY`, `BottomNavigation`, `IceOrbPlay`, `glassPill`.

---

### Album artwork / imagery — 6/10

**Works**
- Shared `ArtFrame` / `artFrameStyle` / jewel shadows. Tile sizes 160 / 168 / 200.
- Immersive player and Artist/Album heroes treat sleeves as objects (blur bloom, full-bleed).
- Explore lead release + mosaic; channel photography; CoverImage lazy/priority pipeline.
- Video stage is a real dark rectangle when a clip exists.

**Generic / off-brand**
- Default discovery is still a **row of equal squares with two lines of caption** — Apple Music shelf.
- Home hero sleeve is ~148px inside an 18px-radius light card, not a device screen or a magazine cover.
- Rank/video badges are generic black pills.
- Art frames use 8–12px rounding and pearl fallback gradients — jewel case as iTunes widget, not crate.

**Should change**
- One large artwork moment per destination (Home hero, Explore hero, player, album page). Rails can stay, but they cannot all be the same size.
- Sharper corners on sleeves (2–6px) so they read as CD/jewel, not app icons.
- Let the playing sleeve stain the dark canvas (already in immersive at 0.22 opacity — raise it on dark).

**Implementation**
- Hero: artwork as the primary panel (min ~240px / full-width on mobile), chrome *around* it like a player bezel.
- Explore already has Ken Burns hero + lead release — keep; restyle chrome, don’t rebuild IA.

---

### Music player experience — 6/10

**Works**
- Player is the most designed object in the app: immersive booth, dock, desktop mini, energy shift, seek, shuffle/repeat/volume, On Air, BPM/key/energy in `metaBits`.
- Rabbit / Turtle is a real differentiator with tap vs long-press BPM steps — the *idea* is Planet.
- Transport plumbing (crossfade, Media Session, unlock) is not the problem.

**Generic / off-brand**
- Immersive comment: *“premium Y2K listening booth… aluminum transport… no ice-blue.”* It is still a **light iPod theater**: pearl canvas, circular aluminum play (`IceOrbPlay`), circular icon buttons, iOS-style 3px rounded seek.
- Dock is a frosted mini-bar with ~10 controls — Spotify/Apple mini-player density, not a device.
- Bunny/Turtle are 30px glass circles jammed beside skip. They read as gimmick icons, not hardware.
- Home hides the dock player when the hero is visible (`hideDockPlayer`) — two players, neither feels like *the* machine.
- Desktop immersive stays phone-column. Mini-player is a glass strip, not a deck.

**Should change**
- Make one **device**: dark chassis, LCD (title/artist/BPM/key/time), artwork window, hardware transport, rabbit/turtle as labeled paddles with BPM delta.
- Progress = LCD bar + optional hardware thumb, not a white-dot iOS slider.
- Keep one persistent mini-device (dock) that looks like a smaller version of the same object.

**Implementation**
- Restyle `ImmersivePlayer`, `HeroPlayerCard`, `GlassDock`, `DesktopMiniPlayer`, `OrbitalControls`, `EnergyShiftButton` against the same device drawing. Do not merge the files; share a `PlayerChassis` visual language from tokens.

---

### UI originality — 4/10

**Works**
- Energy rabbit/turtle, station/channel surfing, dedicate, member numbers, harmonic search, Club credits — original *product*.
- Broadcast vocabulary on Home is not a Spotify clone in IA.

**Generic / off-brand**
- Visual comments and components repeatedly cite App Store, Apple Music, iPod click-wheel, iTunes Aqua, Music.app.
- Patterns: large title + date, horizontal snapping rails, circular chrome icon buttons (`chromeIconButton` = 50% radius), pill chips (`radius.pill` 980), frosted glass sheets, Aqua selected states, 14–18px card radii.
- Bottom nav is a generic 5-tab bar with a bright filled pill.
- Primary button is Aqua gloss. Secondary is aluminum capsule.

**Should change**
- Prefer **panels, modules, lists, grids, dividers, overlays, editorial spreads**. Tight radii (4–10px). Hairline silver borders. No pill soup.
- Nav can stay 4–5 destinations; it should look like a device selector, not iOS tabs.

**Implementation**
- `radius`: sm 4, md 8, lg 10, xl 12; retire pill except true FABs if any.
- `glassPill` / Aqua active tabs → inset LCD selected state or acid underline/pip.

---

### Motion / interaction — 6/10

**Works**
- Documented principles (`src/motion/tokens.js`): fast, no elastic bounce, reduced motion honored globally.
- Dock rise, like pop, live LED pulse, press/lift classes, art load fade, Explore Ken Burns, buffering spinner.
- Player progress already updates independently of App root (playback store) — the UI can animate without jank if we keep that.

**Generic / off-brand**
- Scanlines and CRT intentionally off. Marquee/ticker present in CSS but not a brand moment.
- Seek is a utilitarian width animation. Artwork transitions are slow bloom (12s transform) — Apple Music, not a deck.
- Energy control uses a slightly bouncy cubic-bezier (`0.34, 1.4, 0.64, 1`) — fights “rhythm over bounce.”
- Too many equal micro-lifts on every tile (`.pmp-lift`) — App Store hover, not a machine.

**Should change**
- Fast digital: LCD digits, progress fill, pip pulse, panel slide, metadata marquee when titles overflow, sleeve crossfade on track change.
- Less tile-lift. More device feedback (key press inset, LED, bar).

**Implementation**
- Keep duration tokens. Add `lcdPulse`, `marquee`, `pip`. Re-enable scanlines as a 2–3% opacity overlay **on LCD surfaces only**.

---

### Overall cohesion — 5/10

**Works**
- After the iTunes unification, Home / Player / Library / Login actually share one chassis. Previous purple-vs-ice split is largely gone. That cohesion is valuable — we should **repoint it**, not fragment it again.

**Generic / off-brand**
- Cohesive around the wrong movie. Explore hover CSS still uses `rgba(255,255,255,0.04)` (dark-UI leftovers) on a light product — small proof of incomplete eras.
- `y2k.*` tokens are light-theme aliases. New work will keep fighting old names until tokens are renamed or documented.
- Mascot / lockup / acid-green-capable LCD vs Aqua CTAs vs App Store header = three brands in one app.

**Should change**
- One environment: dark studio. One accent: acid green. One metal: silver. One player object. One type stack. Artwork for hue.
- Preserve IA, playback, Club, billing. Restyle the shell.

**Implementation**
- Token-first. Then player. Then Home/nav. Then remaining screens. No third accent “just for Club.”

---

## 3. Top 10 changes (highest impact first)

1. **Invert the environment to dark digital** — canvas, chrome, boot splash, theme-color. Highest identity swing; tokens first.
2. **Replace Aqua with acid / computer green** as the only brand accent (progress, play pip, focus, selected, primary CTA).
3. **Treat the player as a physical MP3 / DJ device** — LCD + artwork window + hardware keys; restyle immersive + dock + hero as one object.
4. **Promote Bunny / Turtle to labeled hardware paddles** with BPM readout (not 30px glass icons in a crowded dock).
5. **Make metadata typographic identity** — `124 BPM` / `8A` / `320 KBPS` / `PLANET / 003` in compact mono, on dark, everywhere a track appears.
6. **Artwork at poster/device scale** — hero and player first; sharper sleeve corners; art-driven ambient colour.
7. **Kill App Store / Music.app layout tropes** — date+large title header, Aqua pill tabs, circular chrome orbs, pill chips, equal square rails as the only rhythm.
8. **Editorial Home/Explore modules** — one magazine/crate spread per page plus lists/grids; keep existing data (`buildHomeCollections`, countdown, scenes).
9. **Restore digital motion on LCDs** — scanline inside LCD, title marquee, pip pulse, fast sleeve crossfade. Do not restore a fake OS desktop.
10. **Align wordmark and chrome with Planet, not iTunes** — compact lockup, no italic lifestyle title, silver bezels, member/catalog numbers in the header.

---

## 4. Quick wins (no IA / no rewrites)

These can ship by token and CSS-class swaps. Playback, routing, Club, billing untouched.

| Win | Where | Notes |
|---|---|---|
| Dark canvas + light ink | `theme.js` `color.canvas/ink`, `index.css`, `index.html` | Instant environment flip |
| Accent `#B8F24A` (or punchier `#C8F241`) | `color.accent`, `BTN_PRIMARY`, focus rings | Retire `#1E6FE8` |
| Nav active = acid pip, not Aqua fill | `BottomNavigation.jsx` | Keep 5 tabs |
| Meta chips: square, mono, acid | `HeroPlayerCard` `MetaChip`, immersive `metaBits` | Drop `borderRadius: 980` |
| Seek bar: single acid fill, no blue | `ImmersivePlayer` `ChromeSeek`, range CSS in `App.jsx` | |
| Re-enable LCD scanlines (LCD only) | `ScanlineWash` as child of LCD, 2% opacity | Do not wash the whole Home |
| Header: drop calendar date; add `PLANET /` catalog line | `HomeHeader.jsx` | |
| Sleeve radius 4–6px | `artFrameStyle`, `TrackCard`, `JewelSleeve` | |
| Primary play: square-ish hardware key, not Aqua glow orb | `IceOrbPlay` | Can stay circular *if* it looks like a device button on dark metal |
| Dock like-heart uses ink/acid, not Aqua | `DesktopMiniPlayer` | Desktop currently tints like with `color.accent` |

---

## 5. Design system (target)

### Colour

| Role | Hex | Use |
|---|---|---|
| Void | `#07080A` | App canvas |
| Chassis | `#101218` | Panels, dock, player body |
| Raised | `#181B22` | Modules, lists |
| Hairline | `rgba(232,234,238,0.12)` | Dividers, bezels |
| Silver | `#C5CAD3` | Metal edges, secondary labels, hardware |
| Off-white | `#E8EAEE` | Primary text |
| Mute | `#8B939F` | Secondary text |
| **Acid** | `#B8F24A` | Play, progress, focus, selected, LCD glyphs |
| Acid dim | `rgba(184,242,74,0.16)` | Selection wash |
| Live | `#E0314A` | ON AIR / destructive only |
| Artwork | track colour | Washes, dock tint — never a second brand hue |

**Do not:** Aqua `#1E6FE8` as identity. Purple. Gradients on primary buttons that go blue. Light gray page.

### Typography

- **UI / titles:** compact technical sans, weight 600–700, tracking −0.02em to −0.04em on large type. Lucida/Helvetica is acceptable for the “modern 40%” if the *environment* goes dark; otherwise IBM Plex Sans.
- **Metadata / LCD:** mono, 11–13px, tracking 0.08–0.14em. `124 BPM` · `8A` · `320 KBPS` · `E7` · `PLANET / 003`.
- **Track titles:** sentence case, high contrast, no uppercase shouting.
- **Device labels only** in uppercase: `ON AIR`, `REC`, `BPM`, `SEEK`.

### Borders / spacing / radius

- Radius: **4 / 8 / 10 / 12**. Player hardware **4**. Sleeves **4–6**. Sheets **12** top only.
- Borders: 1px silver hairline. Inset highlight on metal keys (`hardware.keyRaised` already good — recolor for dark).
- Space: keep `space(n)` 4px grid and `homeSpace.gutter` 20.

### Buttons

- **Primary:** acid fill, near-black label, radius 8, no Aqua gloss.
- **Secondary:** dark metal plate, silver hairline, off-white label.
- **Icon keys:** hardware bevel, 40–44px, radius 8 (not 50% unless it is a click-wheel *quote* used once).
- **Pressed:** inset shadow, 1px translate, no bounce.

### Cards / panels

- Dark modules with hairline + optional top silver edge.
- Lists and grids over stacked rounded white cards.
- Editorial: one large sleeve + column of metadata, not a card-in-card.

### Icons

- Keep the existing `Icon` set (stroke). Recolor to silver / acid / off-white.
- Rabbit/Turtle stay custom SVGs — enlarge, label `LIFT` / `EASE`, show `±10 BPM`.

### Player

```
┌─────────────────────────────────────────┐
│  ON AIR · CH03              PLANET/003  │
│  ┌──────────┐  TITLE                    │
│  │          │  Artist                   │
│  │  ARTWORK │  124 BPM  8A  320 KBPS    │
│  │          │  ────────●──────── SEEK   │
│  └──────────┘  01:14 / 03:42            │
│  [TURTLE]  [PREV] [PLAY] [NEXT] [RABBIT]│
└─────────────────────────────────────────┘
```

Mini-dock = the same drawing at 64–72px height, not a different component language.

---

## 6. Implementation plan

Preserve playback, auth, Club, billing, routing, recommendation engine. Restyle; don’t rewrite.

### Phase 1 — Highest impact (tokens + player + shell)

1. Rewrite `color`, `y2k`, `glass`, `chrome`, `BTN_*`, `dock`, `artShadow` for dark + acid. Keep token *names* where possible so 200+ inline styles flip.
2. Boot splash, `theme-color`, `index.css`.
3. `IceOrbPlay`, `BottomNavigation`, `glassPill`, range-input CSS, focus rings.
4. `ImmersivePlayer` + `HeroPlayerCard` + `GlassDock` + `DesktopMiniPlayer` as one device.
5. Energy paddles: size, labels, BPM, placement on the transport row.
6. `HomeHeader` masthead.

**Risk:** inline styles that hardcode `#1E6FE8`, `#FFFFFF`, `borderRadius: 980`, `rgba(255,255,255,…)`. Grep and replace after tokens.

### Phase 2 — Refinement (surfaces)

1. Home rails / `TrackCard` / `ChannelCard` / `MusicSection` — darker modules, sharper art, metadata line.
2. Explore, Search, Library, Club, Login, Paywall — same tokens, no new IA.
3. Artist/Album heroes: dark already-friendly (blurred art); retune accents.
4. Meta chips + Catalog numbers + member line in profile.
5. Desktop: wider editorial Home; immersive two-column (art + LCD stack).

### Phase 3 — Polish

1. LCD scanline + title marquee + pip pulse + sleeve crossfade.
2. Artwork-driven ambient colour on dark (dock tint + player bloom).
3. Icon/hardware consistency pass; kill leftover Aqua and white pills.
4. Motion: remove bounce on energy; keep reduced-motion.
5. Screenshot pass: mobile player, Home, Explore, Library, Login.

---

## 7. Preserve vs. kill

| Preserve | Kill / demote |
|---|---|
| Lockup, mascot, tagline, member numbers | Aqua as brand colour |
| Crate / stacks / cuts / on air vocabulary | App Store date + large title as Home identity |
| BPM, Camelot, energy, rabbit/turtle *behavior* | Music.app “no scanlines / no dark studio” rule |
| Scene channels, countdown, Club, dedicate | Pill chips and 980px radii as default |
| Token file, motion principles, reduced motion | Equal square rails as the only Home rhythm |
| ArtFrame pipeline, CoverImage, dock tint | Dual player languages (hero vs dock) |
| 4–5 tab IA | iTunes source-list blue selected states |

---

## 8. Approval gate

No major structural changes until this direction is approved.

**Please confirm:**

1. Dark canvas + acid green as the new OS (retire light iTunes chassis).
2. Player-as-device is Phase 1, not a later polish.
3. Type: keep Lucida for UI **or** introduce IBM Plex Sans + Mono (recommend Plex/Geist if we are allowed one font change).
4. Scope of Phase 1: tokens + player + nav/header only, vs. full-app recolor in the same PR.

Until then, this document is the only change on the branch.
