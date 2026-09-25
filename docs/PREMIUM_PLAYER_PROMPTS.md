# PlanetMP3 — implementation prompts (sequenced)

Run **one prompt per PR**. Do not combine P0 + P1 + P2. Each prompt is a Cursor agent task: implement, test, rebuild `build/` if visuals changed, open/update that prompt’s PR.

**Principle:** MP3 player first → discovery second → social third.  
**Visual north star:** dark charcoal, bold condensed titles + rounded body, rounded cards, pill controls, neon green trim, quiet purple/blue. Not Spotify. Not a costume Discman.

**Locked across every prompt**

- Keep Turtle / Rabbit (next-picks BPM, not playback speed).
- Keep LCD BPM / Camelot / energy / MP3.
- Keep four dock tabs: Home / Library / Discover / Profile.
- Keep dual-deck audio, queue, likes, playlists.
- Do not add Friends/Charts/Requests as dock tabs.
- Forbidden leftovers: Syne Google font, `#7ED9B8`, `#4E9A7A`, `#C8F5E4`, `#090A0D`, DistroKid blue `#367FC7`, acid `#B8F24A`.
- After visual PRs: bump `STYLE_CHASSIS` if not already, run tests, `npm run build` (committed Pages `build/`).

**Order:** 01 → 02 → 03 → 04 → 05 → 06 → 07, then P1 08–10, then P2 11–13.

```text
01 Chassis tokens     ← this PR (dark-premium-mp3-20260925)
02 Player surfaces
03 Home IA (player first)
04 Library text/cards
05 Discover + Search
06 Profile + auth
07 Remaining chrome + Club copy
08 Discover IA (P1)
09 Profile as music identity (P1)
10 Catalog years + empty states (P1)
11 Friends + presence (P2)
12 Requests + comments (P2)
13 User MP3s + collab playlists (P2)
```

Main already shipped **obsidian night radio** (`obsidian-ps1-glass-20260925`). Prompt 01 keeps that dark canvas and replaces ice/Plex-as-display with **neon green + Outfit / Barlow Condensed + rounded cards/pills**.

---

## PROMPT 01 — Dark premium chassis (tokens)

**Depends on:** audit approval + obsidian night chassis  
**Branch:** `cursor/premium-dark-chassis-1dde`

**Do**

1. Keep the dark charcoal canvas (`#1C222B`). Do not revert to light steel. Do not use `#090A0D`.
2. Signal trim: neon green (`#A8FF6A`, not `#B8F24A` / mint). Quiet violet + electric blue.
3. Type: Outfit as `font` / `fontDisplay`; Barlow Condensed as `fontPoster`; **IBM Plex Mono stays** `fontLcd`. Self-host woff2. No `fonts.googleapis`. Keep `"IBM Plex Sans"` in the fallback stack.
4. Radius: cards ~18px; chips/tabs/search/CTAs use pills. Hardware keys ~12px, not chamfered aluminum.
5. Update `src/index.css` dock pills + mini progress, `public/index.html` chassis stamp + splash, tests, `scripts/assert-shipped-style.js`.
6. Rebuild `build/`.

**Do not:** Home IA, Channel Surfing, audio engine, nav IDs, Turtle/Rabbit behaviour, per-screen restyles (Prompt 02+).

**Exit:** Chassis `dark-premium-mp3-20260925`. Tests green. Pages bundle matches.

---

## PROMPT 02 — Player surfaces (hero, immersive, mini, dock)

**Depends on:** 01  
**Branch:** `cursor/premium-player-surfaces-1dde`

Restyle `HeroPlayerCard`, `PlayerDeck`, `ImmersivePlayer`, `GlassDock`, `DesktopMiniPlayer`, `DeviceChrome`, `OrbitalControls`, `EnergyShiftButton` (RabbitTurtleSlot only). Large artwork, premium titles, green progress. Mini stays collapsed. Turtle/Rabbit stay on hero + immersive.

**Do not:** Home shelf order, Discover, social, audio graph.

---

## PROMPT 03 — Home is the player + my listening

**Depends on:** 02  
**Branch:** `cursor/premium-home-player-first-1dde`

Hero → recents → liked → one editorial. Move Channel Surfing / Tonight off the first screen. Kill DJ “Late signal” as the primary header. Update `styleShip` Home order assertions.

---

## PROMPT 04 — Library text and containers

**Depends on:** 01 (can follow 02–03)  
**Branch:** `cursor/premium-library-chrome-1dde`

`FavoritesScreen`, `TrackRow`, `TrackCard`, `CardContainer`, playlist mosaics. Keep BPM · Camelot on rows.

---

## PROMPT 05 — Discover + Search chrome

**Depends on:** 01  
**Branch:** `cursor/premium-discover-chrome-1dde`

Visual + type only. Do not rename Worlds/Energy/Keys (Prompt 08). Search becomes a dark pill field.

---

## PROMPT 06 — Profile, landing, onboarding chrome

**Depends on:** 01  
**Branch:** `cursor/premium-profile-chrome-1dde`

`ClubScreen` chrome, landing, TasteTuner, guest gate. Consumer “Club” copy → Profile. Do not rebuild Profile as music identity (Prompt 09).

---

## PROMPT 07 — Remaining chrome + consistency sweep

**Depends on:** 02–06  
**Branch:** `cursor/premium-chrome-sweep-1dde`

Charts, Set Builder, Artist/Album, Queue sheet, leftover ice-cyan hex. One card / one title / one list row.

---

## PROMPT 08 — Discover information architecture (P1)

Lead with New / Trending / Genres / Artists. Keys + Dig as tools. Charts from Discover.

---

## PROMPT 09 — Profile as music identity (P1)

Avatar, recents, liked, playlists first. Club card nested.

---

## PROMPT 10 — Catalog years + empty/error (P1)

`year` backfill + empty/error cards. Optional light `App.jsx` splits.

---

## PROMPT 11 — Friends + presence (P2)

Public presence, Friends from Profile. No fifth dock tab.

---

## PROMPT 12 — Requests + comments (P2)

Requests destination + track comments/reactions.

---

## PROMPT 13 — Owned files + collaborative playlists (P2)

User MP3 upload + multi-owner playlist writes. Last, not first.

---

## How to run the next prompt

```text
Follow docs/PREMIUM_PLAYER_PROMPTS.md Prompt NN only.
Do not start the next prompt. Branch cursor/<name>-1dde off the latest approved premium branch (or main if merged).
Keep Turtle/Rabbit, four tabs, and the audio engine. Rebuild build/ if you change visuals.
```
