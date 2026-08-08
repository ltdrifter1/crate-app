# PlanetMP3 — Premium MTV / Y2K UI Audit

*Visual & interaction audit only. Preserve existing functionality, branding, architecture, and user flows. No full redesign.*

**Benchmark:** MTV 1990s–2000s broadcast chrome × Apple Music polish × NTS editorial restraint × futuristic glass/digital interface — not a Spotify clone.

**Codebase reviewed:** Home (`HomeScreen` + home components), GlassDock / BottomNavigation, Search, Library, Artist/Album pages, ImmersivePlayer, DesktopMiniPlayer, `theme.js` / `y2k` tokens, motion system.

---

## 1. Executive summary

PlanetMP3 already has a **real point of view** — broadcast vocabulary, glass dock, jewel-case shadows, channel dial, LIVE chrome, and a Y2K home pass with purple signal + neon zap. That is rare and worth protecting.

What holds it back from feeling like a **premium futuristic music destination** is not missing features. It is:

1. **Two visual operating systems** fighting across surfaces (Home purple/Y2K vs Player/Artist/Library ice-blue aluminum).
2. **A slim Home** that underuses existing editorial data and leans on same-size tile rails.
3. **Artwork treated as thumbnails** instead of cultural objects — MTV and Apple Music win on sleeve presence.

Fix those three, and the app reads as one polished PlanetMP3 world without rebuilding anything.

| Feels… | Where |
|---|---|
| **Empty / slim** | Home after the hero — uniform 138px rails, `maxWidth: 720`, unused `buildHomeCollections` |
| **Generic** | Repeated horizontal “shelf of squares”; Search empty state as utility; Inter body as default UI voice |
| **Outdated / split** | Dual accent systems; Channel cards as CH numbers without art; inset square hero vs broadcast full-bleed ideal |
| **Unclear** | Home hides transport in dock while hero owns play; Library chrome language ≠ Home language |
| **Unpolished** | Dock control density; artist hero ice-blue vs home purple; micro-type contrast on faint labels |

**Overall premium feel:** strong foundation (~7.5/10 craft), held back by consistency and Home density — not by identity.

---

## 2. Full UI audit (by surface)

### Homepage
- **Strengths:** `HeroPlayerCard` is the right idea (art-dominant, LIVE, transport, request). Section voice (“Surf the dial”, “Tonight’s countdown”) is on-brand. Explained discover reasons exist.
- **Gaps:** Hero is an **inset rounded square card**, not a broadcast stage. Below it: near-identical rails. `buildHomeCollections()` (`Played before`, `Late booth`) and `highPressure` exist in `lib/homeCollections.js` but are **not wired into HomeScreen** — Library uses trending; Home does not. Channels are typography-only CH plates with no sleeve mosaic.
- **Verdict:** Slim. Destination potential is there; density and editorial variety are not.

### Navigation
- **Strengths:** Floating glass dock + purple active capsule; clear 5-tab model (Home / Charts / Library / Search / Club).
- **Gaps:** Five destinations + Admin crowds the pill. Active glow is good Y2K; inactive tabs stay generic. Artist/Album highlight Search even when entered from Home.

### Search
- **Strengths:** Glass field, recent searches, hint chips, genre/scene browse, harmonic grammar.
- **Gaps:** Empty state still reads as **utility**, not discovery theater. Entity rows are quiet glass plates — fine functionally, low MTV presence. No large scene posters.

### Discover (channels / scenes / charts)
- **Strengths:** Scene channels + countdown are genuine differentiators.
- **Gaps:** Discovery surfaces don’t look like discovery — they look like labeled carousels. Charts/Library chrome (aluminum) vs Home (purple) splits the mental model of “where culture lives.”

### Artist & Album pages
- **Strengths:** Full-bleed blurred sleeve heroes, story copy, play CTAs, album-as-object rails — closest to Apple Music destination quality.
- **Gaps:** Still on the **ice-blue / aluminum** language, so leaving Home feels like entering a different product. Album art in rails is sharp but small; no chrome plate / jewel bevel system shared with Home tiles.

### Player
- **Strengths:** Immersive player is the craft peak — aluminum seek, jewel sleeve, station chrome, energy controls. Dock art ring + glass shell are premium.
- **Gaps:** Visual language ≠ Home hero (purple orbs vs ice chrome). Dock still packs many controls. Home hides dock player while hero owns transport — muscle memory break.

### Library
- **Strengths:** Custom mix plate, CoverFlow, stacks mosaic, chrome frame details.
- **Gaps:** Densest “product admin” feel; least MTV theater. Stacks mosaic is good — should set the bar for all discovery tiles.

### Mobile
- **Strengths:** Safe areas, dock rise motion, press/lift micro-classes, reduced motion.
- **Gaps:** Hero + many rails + dock clearance = scroll fatigue without enough *visual events*. Touch density in dock remains high.

### Desktop
- **Strengths:** Sidebar + mini-player architecture; wider canvas available.
- **Gaps:** Home stays `maxWidth: 720` — desktop wastes the stage. No poster-scale featured band. Immersive player stays phone-proportioned.

---

## Evaluation axes (short)

| Axis | Assessment |
|---|---|
| Layout | Mobile-first column is clear; Home too narrow/sparse on desktop |
| Spacing | `homeSpace` tokens help; section rhythm is even → feels thin, not cinematic |
| Typography | Space Grotesk display works; Inter body + 9–11px mono caps overused; faint contrast weak |
| Hierarchy | Hero wins; everything below competes equally |
| Cards | Home leans card-heavy (hero, channels, request); discovery should be art-first, chrome-second |
| Artwork | Good when large (player/artist); Home tiles undersized and uniform |
| Buttons | Purple play orb vs aluminum keys — two control dialects |
| Icons | Consistent `Icon` set; dock icons small for comfort |
| Animations | Strong principles (`motion/tokens.js`); rise/stagger/LIVE dot present; need fewer ambient loops, more intentional track/section moments |
| Responsiveness | Solid phone shell; desktop Home not “destination scale” |
| Premium feel | High craft locally; inconsistent globally |

---

## 3. Top 3 UI upgrades (ranked)

### Upgrade 1 — One visual OS (unify Home Y2K ↔ Player/Catalog chrome)

| | |
|---|---|
| **Current problem** | Home ships `y2k` purple/neon/off-white; ImmersivePlayer, Artist/Album, much of Library ship ice-blue `#A9C7E4` + aluminum. `theme.js` claims one accent; the product shows two. |
| **Why it matters** | Premium apps feel like one machine. Split accents make PlanetMP3 feel mid-redesign — the fastest way to kill “Apple Music-level polish.” |
| **Recommended upgrade** | Keep **aluminum / glass / hardware structure** (NTS restraint, machined controls). Make **purple the single brand signal** (LIVE, active, primary play, dock radio stripe). Retire ice-blue as competing accent; keep it only as optional cool metal highlight if needed. Propagate `y2k` tokens into ImmersivePlayer CTAs, EntityHero accents, and dock active states. |
| **Visual direction** | Dark studio canvas + chrome plates + purple signal + neon only for LIVE/ON AIR zap. MTV bug energy without purple-on-everything. |
| **Complexity** | **M** — token consolidation + targeted component accent swaps; no flow changes. |
| **Expected impact** | **Very high** — instantly reads as one premium brand. Foundation for every other visual win. |

### Upgrade 2 — Home as broadcast destination (density + unused editorial)

| | |
|---|---|
| **Current problem** | Home is hero + same-height rails. Editorial helpers (`buildHomeCollections`, energy shelves) exist but Home doesn’t use them. Feels slim and feed-like. |
| **Why it matters** | Home is the brand’s first 5 seconds. MTV/NTS destinations feel *programmed*; Spotify clones feel *listed*. |
| **Recommended upgrade** | Keep structure; enrich content: (a) elevate hero toward broadcast stage, (b) wire existing collections as 1–2 editorial bands, (c) one featured/art-forward row (countdown or channels) with larger sleeves. Cap total shelves so it stays curated, not endless. |
| **Visual direction** | Lower-thirds chrome, sleeve posters, CH bugs over real art, section titles like on-air blocks — not dashboard widgets. |
| **Complexity** | **M** — mostly Home composition using existing libs/components. |
| **Expected impact** | **Very high** on discovery, engagement, and “music destination” feel. |

### Upgrade 3 — Artwork elevation system (jewel-case + asymmetric featured)

| | |
|---|---|
| **Current problem** | Discovery art is mostly 138–150px equal tiles with soft purple glow. Player/artist already know how to make sleeves feel precious; Home/Search don’t share that system. |
| **Why it matters** | Music UIs are judged by how covers feel. Larger, framed, uneven art = premium + faster scanning + more taps. |
| **Recommended upgrade** | Shared `ArtFrame` treatment: hairline chrome edge, `artShadow.raised`, optional bevel, active neon pip. Use **one featured size** (e.g. 200–240px or 2× poster) per major Home band; keep secondary tiles smaller. Channel cards: 2×2 mosaic from channel tracks + CH bug overlay (PlaylistCard pattern). |
| **Visual direction** | Physical media in a digital booth — MiniDisc/jewel case, not rounded marketing cards. |
| **Complexity** | **S–M** — shared style helper + ChannelCard/TrackCard size variants. |
| **Expected impact** | **High** — perceived quality and discovery engagement without new features. |

---

## 4. Top 3 homepage improvements (ranked)

### 1. Broadcast hero (MTV lower-thirds stage)
- **What it adds:** Edge-to-edge (or full content-width) art plane; chrome lower-third for title/artist/transport; consolidated LIVE + channel bug; less “card in a phone,” more “on air.”
- **Where it goes:** Replace/upgrade `HeroPlayerCard` presentation at top of `HomeScreen` (keep all existing play/like/request/visibility contracts).
- **Why it improves:** Fixes slim first viewport; brand + now-playing become the destination. Aligns with MTV/Apple Music full-bleed sleeve culture.

### 2. Editorial “Tonight’s wall” from existing collections
- **What it adds:** 1–2 story-led bands — e.g. `Late booth` / `Played before` via `buildHomeCollections`, or a heat shelf via `trendingTracks` / `highPressure` — with larger art and short mono subtitles.
- **Where it goes:** After Featured channels / On tonight; before generic Discover rail. Reuse `MusicSection` + `TrackCard` (larger `size`) or a single poster+rail pattern.
- **Why it improves:** Home stops being only “what’s playing + more tiles.” Uses code you already have; personalization and underground discovery without new backend.

### 3. Cover-driven Featured Channels (+ one Featured Releases band)
- **What it adds:** Channel tiles with real sleeve mosaics + CH·XX bug; optional “Featured releases” band of largest album covers from catalog heat/recency.
- **Where it goes:** Upgrade `ChannelCard` in the existing Featured channels section; add one releases band near Most requested / Discover.
- **Why it improves:** Dial surfing becomes visual culture, not outline numbers. Highest discovery ROI for lowest IA change.

---

## 5. Premium visual direction

| Element | Direction |
|---|---|
| **Glass** | Keep dark glass dock/sheets (`glass.*`). Prefer hardware faces for transport keys (already good on immersive). Avoid frosting everything — glass = panels, chrome = controls. |
| **Chrome** | Aluminum gradients, inset highlights, hairline borders — Teenage Engineering / MiniDisc. Use on seek, dock shell, section rules. |
| **Typography** | Keep Space Grotesk for display/wordmark. Raise informational floor to ≥11px; reserve mono caps for bugs (LIVE, CH, ON AIR). Consider slightly less Inter dominance on Home headlines (display already carries brand). |
| **Motion** | Keep rise/trackSwap/likePop. Gate ambient loops to playing + visible. Add 2–3 intentional moments: sleeve crossfade on track change, section rule draw, CH zap on channel tune (keyframes already exist in `App.jsx`). |
| **Color** | Canvas `#0B0C0F`; off-white ink; **purple signal**; neon zap for LIVE only; broadcast red only if LIVE needs hotter than neon. Stop dual-accent drift. |
| **Album art** | Jewel-case shadow + chrome edge; larger featured sizes; mosaics for channels/stacks; blur-bleed only on destination heroes (artist/album/player). |
| **Micro-interactions** | Press scale on keys, active purple glow on dock/tab, neon pip when playing — already started; extend consistently. |

**Avoid:** Spotify green-card grids; corporate SaaS blues; purple-everything gradients; cream/serif “editorial AI” tropes; endless pill clusters and stat strips.

---

## 6. Quick wins (under 1 day)

1. **Pick accent winner** — map ImmersivePlayer primary accents + EntityHero eyebrow/play tint to `y2k.purpleBright` (or reverse: cool Home to ice — **prefer purple brand signal**).
2. **Wire `buildHomeCollections` into HomeScreen** — one `MusicSection` per returned collection.
3. **Bump Home tile size** — `TrackCard` default 138 → 168; ChannelCard width → ~170.
4. **Widen Home on desktop** — `maxWidth` 720 → 960 (or full content column).
5. **Channel mosaic** — reuse PlaylistCard 2×2 cover logic with CH bug overlay.
6. **Unify art chrome** — apply `artShadow.raised` + shared border token to TrackCard/ChannelCard/PlaylistCard.
7. **Hero badge cleanup** — single LIVE+channel bug row (less dual-pill clutter).
8. **Dock radio stripe + Home purple** already aligned — extend neon ON AIR treatment to Charts active rows for one-hop consistency.

---

## 7. Final priority roadmap

| Priority | Work | Outcome |
|---|---|---|
| **P0** | Unify visual OS (Upgrade 1) | One premium PlanetMP3 machine |
| **P0** | Homepage editorial density (Upgrade 2 + Home improvements 1–3) | Destination Home; better discovery |
| **P1** | Artwork elevation system (Upgrade 3) | Sleeves feel valuable everywhere |
| **P1** | Quick wins 2–8 | Visible in a day; compounds P0 |
| **P2** | Desktop Home stage + immersive two-pane | Pay off wide screens |
| **P2** | Search empty → scene posters | Discovery theater without new IA |
| **P3** | Dock density / always-on mini transport | Control polish (see also `docs/UX_AUDIT.md`) |

**Do not do now:** Full redesign, new nav IA, Spotify-style “Made for you” product surface, or replacing Rooms/station metaphors.

---

## Closing

PlanetMP3’s identity — dial, crate, stacks, LIVE, glass booth — is already the moat. The highest-impact path to a **futuristic MTV-inspired premium streamer** is consistency + Home density + sleeve presence. Ship P0 and the product stops feeling like a stylish prototype and starts feeling like a place you leave open all night.
