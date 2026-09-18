# PlanetMP3 — Creative & UX Audit (V2, acid chassis)

**Date:** 18 September 2026  
**Chassis scored:** `STYLE_CHASSIS = acid-device-20260918`  
**North star:** *A futuristic MP3 player from an alternate 2003* — playful, collectible, music-first, unmistakably PlanetMP3. PS1-modern interface. Not Spotify, Apple Music, or generic SaaS.  
**Method:** Code review of Home, Explore, Library, Club, Search, player, dock, sidebar, tokens, motion, boot HTML, and style-lock tests. **No product logic was changed for this audit.**

---

## 1. Executive Summary

PlanetMP3 already has the *right nouns*: crate, Channel Surfing, LCD metadata (BPM / Camelot / energy), Turtle/Bunny paddles, Club membership, `PLANET / 003`, hardware keys, jewel-case art frames. The listening object exists.

It does **not** yet look like a device from an alternate 2003. The shipped OS is a **cool graphite studio with acid-lime `#B8F24A`**, IBM Plex (SaaS-firmware), 12–16px rounded glass docks, and YouTube Music four-tab IA. Acid green on near-black is the default “dark app, one neon accent” pattern — Spotify-adjacent even when the hex is not Spotify green. IBM Plex Sans reads as dashboard, not magazine, not PlayStation BIOS, not Winamp.

The player and crate are the cultural core. Home still dumps equal App Store rails after one crate. Dual nav (source list + pill dock) is Apple Music. Glass blur and pill radii fight the brief’s “device panels, lists, overlays.” Scanlines are 4.5% opacity theatre. The mascot dies after splash.

**Verdict:** Keep IA, engines, Club, DeviceChrome. Restyle the OS: **PS1 Discman** — CRT purple-black, memory-card orange signal, cream paper ink, warm metal, Space Grotesk display, IBM Plex Mono LCD, boxier bezels, artwork first.

**Overall score: 62 / 100**

Band: **Improve** (identity is locked in tokens; one chassis swap moves colour, type, and chrome together).

Mix today: **48% dark streaming shell · 22% acid-device tokens · 15% broadcast vocabulary · 10% underground metadata · 5% planet/splash.**  
Target mix: **35 modern product / 30 early-digital device / 20 underground editorial / 15 Planet.**

---

## 2. Overall Score (/100)

| Category | Score (/10) | Weight | Weighted |
|---|---:|---:|---:|
| Brand Identity & Originality | 5.5 | 20 | 11.0 |
| Music Discovery & User Experience | 7.5 | 15 | 11.3 |
| Music Player & Playback Experience | 7.0 | 15 | 10.5 |
| Visual Language (Colour, Typography, Layout) | 4.5 | 15 | 6.8 |
| Interface & Interaction Design | 6.0 | 10 | 6.0 |
| Artwork & Editorial Presentation | 6.5 | 10 | 6.5 |
| Motion & Micro-interactions | 6.0 | 5 | 3.0 |
| Mobile & Responsive Experience | 6.5 | 5 | 3.3 |
| Design System Consistency | 7.0 | 3 | 2.1 |
| Technical Feasibility & Incremental Improvement | 8.5 | 2 | 1.7 |
| **TOTAL** | | **100** | **62.2 → 62** |

---

## 3. Detailed Scorecard

Scoring: **9–10 preserve · 7–8 refine · 5–6 improve · 0–4 redesign priority.**  
Weighted = `(score / 10) × weight`.

### 3.1 Brand Identity & Originality — 5.5/10 · **11.0 / 20**

**Evidence**
- Distinct product language: crate, stacks, Channel Surfing, Club, Turtle/Bunny, `PLANET / 003` (`HomeScreen`, `DeviceChrome`, `EnergyShiftButton`).
- Tagline `YOUR WORLD, YOUR MUSIC.` Spinning-planet boot. Mascot Lottie barely appears after login.
- `nav.js`: four dock destinations documented as YouTube Music–style. Desktop `AppSidebar` still a source list; Club row still uses leftover `rgba(10, 132, 255)` (Aqua ghost).
- Theme: “acid LCD” `#B8F24A` on `#090A0D`. Tests and `assert-shipped-style.js` lock that chassis. Primary CTAs are solid acid plates (`BTN_PRIMARY`) — the exact “Spotify, different hex” failure the last audit warned against.
- Bottom nav active tab is a filled acid wash (`BottomNavigation.jsx`).

**What's working**
- Named objects (crate, LCD bits, member numbers) are not generic streaming.
- Hardware keys + recessed LCD are a brand object in embryo.
- Club-as-record-club is closer to the brief than a settings dump.

**Creative gaps**
- Lime-on-graphite is a 2020s dark-mode cliché, not PS1 / Discman / Winamp.
- Identity lives in splash and tokens, not in destinations. Library / Search / Club share one shell.
- Mascot and planet are boot theatre.
- Dual nav is Apple/YouTube, not a handheld selector.

**Recommendations**
- Retire acid as identity. Signal = **PS1 memory-card orange**. Metal stays warm silver. Live stays red. Selected = hairline + pip, not a filled capsule.
- Same bezel language on hero, immersive, dock, Club card.
- Catalog firmware (`PLANET / 003`) on player and dock, not only Home.

### 3.2 Music Discovery & User Experience — 7.5/10 · **11.3 / 15**

**Evidence**
- Home: Channel Surfing → Hero device → Tonight → one `CrateSpread` → rails (`HomeScreen.jsx`).
- Explore hero + genre mosaic. Search carries BPM / Camelot / energy.
- Scene channels, countdown, dedicate, program guide.

**What's working**
- Station-first discovery. Crate spread is the record-shop module. Onboarding voice is on-brand.

**Creative gaps**
- After the crate, equal snapping rails + “See All” (App Store grammar).
- Channel Surfing is still an equal-tile strip.
- Dual transport: hero owns play; dock hides on Home.

**Recommendations (style-only this pass)**
- Do not change IA. Restyle rails as device shelves, not SaaS cards. Keep four tabs.

### 3.3 Music Player & Playback Experience — 7.0/10 · **10.5 / 15**

**Evidence**
- `ImmersivePlayer` + `DeviceChrome`: artwork window, LCD (title, BPM, Camelot, seek), hardware transport, Turtle/Bunny.
- Dock mini-player with LCD bits and bitrate when present.
- Home `HeroPlayerCard` is a second drawing of the same object.

**What's working**
- Player is the best-designed object. Metadata is firmware, not captions.

**Creative gaps**
- Acid LCD + cool metal still reads as “gamer HUD,” not Discman/PS1.
- Desktop immersive still frames a phone-shaped object.
- Glass dock + 16px radius = iOS floating bar, not a chassis.

**Recommendations**
- Orange LCD phosphor, tighter radii (6–10px), less backdrop-blur, sleeve-tinted bloom only.

### 3.4 Visual Language — 4.5/10 · **6.8 / 15**

**Evidence**
- Canvas `#090A0D`, ink `#E8EAEE`, acid `#B8F24A`, IBM Plex Sans + Mono.
- Cool silver `#C5CAD3`. Heavy glass blur (28–48px). Radius up to 16 / pill 980.
- Type scale is compact and good; display face is not bold-culture.

**What's working**
- LCD type recipe (`type.lcd` 11px / tracking / uppercase) is the right *role*.
- Artwork frames exist (`artFrameStyle`).

**Creative gaps**
- Colour is Spotify-night + lime, not 2003 device.
- IBM Plex Sans is product-sans, not magazine/PS1 grotesque.
- Too much iOS glass. Corners too round. Cream paper / CRT purple / orange phosphor unused.

**Recommendations**
- Space Grotesk (bold UI) + IBM Plex Mono (LCD). CRT `#110E16`, cream `#F3EDE4`, orange `#FF6A2B`, warm metal `#C4BDB4`. Boxier radii. Hardware plates over blur.

### 3.5 Interface & Interaction Design — 6.0/10 · **6.0 / 10**

**Evidence**
- Hardware keys (`hardwareKey`) correctly skip backdrop-filter. Many other controls still `glassPill`.
- Dock + sidebar duplicate destinations. Focus rings use accent (good).

**What's working**
- Press scale, seek groove, reduced-motion global.

**Creative gaps**
- Pills and glass cards. Sidebar Club row Aqua leftover. Active tabs painted as capsules.

**Recommendations**
- Device selector: pip + inscription, not filled pill. Fix Aqua leftover.

### 3.6 Artwork & Editorial Presentation — 6.5/10 · **6.5 / 10**

**Evidence**
- Jewel-case frames, crate lead sleeve, Explore mosaic. Channel tiles still pictograms.

**What's working**
- Art-first on player and crate.

**Creative gaps**
- 160px equal rails. Acid glow on active art competes with the sleeve.

**Recommendations**
- Active sleeve: warm hairline, not neon halo. Keep crate as the editorial hero.

### 3.7 Motion & Micro-interactions — 6.0/10 · **3.0 / 5**

**Evidence**
- `src/motion/tokens.js`: rhythm over bounce. Splash planet spin. likePop, dockRise, CRT pip.

**What's working**
- Calm, music-adjacent easings. Reduced motion honored.

**Creative gaps**
- Scanlines too shy. Few tactile bevel presses. Planet is splash-only.

**Recommendations**
- Stronger LCD scan. Tune-key press inset. No new animation libraries.

### 3.8 Mobile & Responsive Experience — 6.5/10 · **3.3 / 5**

**Evidence**
- Floating dock, `dock-xtra` hidden under 430px, safe-area insets, `pmp-device-stage` row at 860px.

**What's working**
- Thumb reach and clearance tokens (`dock.clearPlayer`).

**Creative gaps**
- Dual chrome on desktop. Pill dock still reads as mobile web, not device.

**Recommendations**
- Same chassis drawing, smaller; do not add a fifth tab.

### 3.9 Design System Consistency — 7.0/10 · **2.1 / 3**

**Evidence**
- Central `theme.js`. Many call sites still hardcode `#B8F24A` / `rgba(184,242,74)`. Legacy names `y2k.cyan` = acid.

**What's working**
- Chassis stamp + `assert-shipped-style.js` prevent silent rollback.

**Creative gaps**
- Hardcoded accents. Alias names lie. One Apple-blue leftover.

**Recommendations**
- Token-only accent. Keep aliases mapped to the new signal so call sites follow.

### 3.10 Technical Feasibility — 8.5/10 · **1.7 / 2**

**Evidence**
- Style is token-driven. Google Fonts already in `index.html`. No new npm deps required. Build assert exists.

**What's working**
- Incremental chassis bump is the intended lever.

**Creative gaps**
- Committed `build/` must be regenerated or Pages serves the old OS.

**Recommendations**
- One chassis id. Rebuild `build/`. Update tests. No new dependencies.

---

## 4. Top 10 Strengths

1. Hardware player grammar (LCD, keys, Turtle/Bunny) is real, not a skin.
2. Crate spread is culturally specific.
3. BPM / Camelot / energy are first-class metadata.
4. Channel Surfing + Club membership are not streaming clones.
5. Token + chassis-lock pipeline can ship a new OS safely.
6. Motion system is rhythmic and reduced-motion aware.
7. Four-tab IA is learnable; do not expand it.
8. Jewel-case art frames exist and can carry the cover.
9. Boot planet is memorable (even if it vanishes after login).
10. Voice (“Flip the dial…”) is Planet, not SaaS.

## 5. Top 10 Creative Gaps

1. Acid lime + cool graphite = generic dark app.
2. IBM Plex Sans is firmware-SaaS, not bold culture type.
3. Glass + pill radii = iOS, not PS1/Discman.
4. Active nav painted as filled capsules (Spotify/YouTube).
5. Home rails after the crate are App Store shelves.
6. Mascot/planet absent from the listening OS.
7. Aqua leftover on Club sidebar row.
8. Hardcoded acid hexes will fight a token swap.
9. Scanlines and bevels too polite to read as a device.
10. Dual desktop nav still Apple Music source list + floating dock.

## 6. P0 (Essential)

1. New signal colour: PS1 orange `#FF6A2B` on CRT `#110E16`, cream ink, warm metal. Acid retired as identity.
2. Type: Space Grotesk UI + IBM Plex Mono LCD.
3. Boxier device radii; hardware plates; less blur.
4. Selected nav = pip + hairline, not acid/orange flood.
5. Stamp new `STYLE_CHASSIS`, boot HTML, tests, committed `build/`.

## 7. P1 (Important)

1. Tokenize remaining hardcoded accents.
2. Stronger LCD scan + orange phosphor fill.
3. Active art: hairline, not neon halo.
4. Fix Club row Aqua leftover.
5. Same bezel on dock / hero / immersive.

## 8. P2 (Polish)

1. Time-of-day washes in the new CRT key.
2. Alias cleanup (`y2k.cyan` names) in a later pass.
3. Mascot cameo on Club card.
4. Dither on LCD only.
5. Editorial type on Explore hero only (no third font).

## 9. Ideal Homepage & Navigation

Keep current IA. Visual: CRT floor, Channel Surfing as dial strip, hero as Discman, crate as the shop table, rails as labeled shelves. Dock: metal selector with orange pip. Sidebar: same pip, no filled rows.

## 10. Ideal Music Player

One device: sleeve window, orange LCD (title marquee + BPM · Camelot · bitrate · time), square transport, Turtle/Bunny paddles, LIVE bug in red only. Cover colours the bloom; orange is the phosphor, not a wash over the art.

## 11. Recommended Design System

| Role | Value |
|---|---|
| Void | `#110E16` |
| Raised chassis | `#1C1824` |
| Ink | `#F3EDE4` |
| Metal | `#C4BDB4` |
| **Signal / LCD** | `#FF6A2B` |
| On-signal | `#1A0A06` |
| Live | `#E0314A` |
| UI type | Space Grotesk 500–700 |
| LCD type | IBM Plex Mono 11px, tracking 0.12em, uppercase |
| Radius | 4 / 6 / 8 / 10 — never pill for chrome |
| Motion | existing tokens; press 80ms; no bounce |

No new npm dependencies. Google Fonts swap only.

---

If I could only implement five changes, they would be:

1. Replace acid-lime identity with PS1 orange phosphor on a CRT purple-black canvas.  
2. Swap IBM Plex Sans for Space Grotesk; keep IBM Plex Mono for LCD metadata.  
3. Tighten radii and replace glass pills with beveled device plates.  
4. Restyle selected nav as a pip + hairline, not a filled streaming tab.  
5. Stamp a new chassis, rebuild the shipped `build/`, and lock it in tests.
