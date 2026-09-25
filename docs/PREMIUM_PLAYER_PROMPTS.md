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
01 Chassis tokens     ← start here
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

---

## PROMPT 01 — Dark premium chassis (tokens)

**Depends on:** audit approval  
**Branch:** `cursor/premium-dark-chassis-1dde`  
**Why first:** every later screen PR is painting on wet cement if tokens stay light steel.

**Do**

1. Invert `src/theme.js` to a dark charcoal OS while **keeping export names** (`color`, `y2k`, `radio`, `glass`, `hardware`, `APP_STYLE`, `BTN_*`).
2. Canvas ~`#14171C` (not `#090A0D`). Surfaces raised charcoal. Ink near-white. Accent neon green (not `#B8F24A` / mint). Secondary violet + electric blue. LCD well stays dark; phosphor is green.
3. Type: Outfit (or similar self-hosted rounded sans) as `font` / `fontDisplay`; optional Barlow Condensed as `fontPoster` for titles; **IBM Plex Mono stays** `fontLcd`. Keep `"IBM Plex Sans"` in the fallback stack so existing tests that scan the stack still pass, or update those tests in this PR.
4. Radius: cards 16–20px; chips/tabs/search/CTAs use `radius.pill`. Hardware keys can round to 12px — no chamfered aluminum.
5. Update `src/index.css` body, planet splash, `.pill-tab` / mini-progress to the new tokens.
6. Update `public/index.html` (`theme-color`, `pmp-chassis`, boot splash, font-face), `public/manifest.json`, `scripts/assert-shipped-style.js`, `src/styleShip.test.js`, `src/App.test.js`.
7. Self-host new woff2 under `public/fonts/`. No `fonts.googleapis`.
8. Rebuild `build/`.

**Do not**

- Redesign Home IA (Channel Surfing stays until Prompt 03).
- Restyle every screen’s hardcoded hex — only tokens + global CSS + tests + splash.
- Touch audio engine, Firestore, nav IDs, Turtle/Rabbit behaviour.

**Exit**

- App boots on dark charcoal; token-driven chrome (shell, buttons, cards using `glass`/`radio`) is dark.
- `npm test -- --watchAll=false` green for theme/styleShip/App tests.
- `npm run build` + assert-shipped-style OK.

---

## PROMPT 02 — Player surfaces (hero, immersive, mini, dock)

**Depends on:** 01  
**Branch:** `cursor/premium-player-surfaces-1dde`

**Do**

- Restyle `HeroPlayerCard`, `PlayerDeck`, `ImmersivePlayer`, `GlassDock`, `DesktopMiniPlayer`, `DeviceChrome`, `OrbitalControls`, `EnergyShiftButton` (RabbitTurtleSlot only — don’t revive Pace paddles).
- Large artwork, premium title/artist (condensed/rounded display), pill/round transport, green progress.
- Mini: cover + title + play/skip; tap still opens immersive; **no expanded mini sheet**.
- Turtle/Rabbit stay on hero + immersive only, labeled as next picks.
- Drop Live/Standby / On Air as page chrome if it fights “this is an MP3 player”; LCD may still show station bits.

**Do not:** Home shelf order, Discover, social, audio graph.

**Exit:** 390×844 Home hero and immersive look like a dark premium player. `styleShip` Turtle/Rabbit assertions still pass.

---

## PROMPT 03 — Home is the player + my listening

**Depends on:** 02  
**Branch:** `cursor/premium-home-player-first-1dde`

**Do**

- `HomeHeader`: wordmark / Now playing context + labeled Find. Kill DJ “Late signal / Prime time” as the primary title.
- Keep order: Hero → Recently played → Liked → one editorial shelf.
- Move **Channel Surfing** and **TonightDeck** off the first screen (Discover overflow or below a fold with a quiet “Stations” label). Update `styleShip` Home order assertions accordingly.
- Empty/error cards use the new container language.
- Copy: MP3 player English, not radio firmware.

**Do not:** new tabs, friends rail, rebuild ChannelCard art system (leave for later if it still looks like a station).

**Exit:** First screen communicates “this is an MP3 player.” Recents/likes sit under the deck.

---

## PROMPT 04 — Library text and containers

**Depends on:** 01 (can parallel 02–03 after 01)  
**Branch:** `cursor/premium-library-chrome-1dde`

**Do**

- `FavoritesScreen`, `TrackRow`, `TrackCard`, `CardContainer`, playlist mosaics, stack detail.
- Dark crate header, rounded playlist cards, large titles, 13px+ meta, BPM · Camelot already on rows — keep.
- Guest gate uses the same cards; CTA still Profile.

**Do not:** user uploads, collab playlists, moving Charts onto Library.

---

## PROMPT 05 — Discover + Search chrome

**Depends on:** 01  
**Branch:** `cursor/premium-discover-chrome-1dde`

**Do**

- `ExploreScreen`, modes, NewReleases, WorldAtlas, EnergyRooms, MixBoard, CrateDig, Find field, `SearchScreen`.
- One H1, rounded section cards, pill mode tabs, Search LCD → dark pill field.
- Do **not** yet rename/remove Worlds/Energy/Keys (that is Prompt 08). This is visual + type only.
- Verify Explore folder rows print BPM/key.

**Do not:** new Discover IA, Charts redesign.

---

## PROMPT 06 — Profile, landing, onboarding chrome

**Depends on:** 01  
**Branch:** `cursor/premium-profile-chrome-1dde`

**Do**

- `ClubScreen` chrome (still the Profile tab), `LandingScreen`, `TasteTuner`, `GuestMemberGate`, paywall/free-plays banner.
- Dark premium type/containers. Membership card can stay collectible — retune for dark, don’t make it a settings dump.
- Replace leftover consumer “Club” as the **tab name** only if it still says Club in nav (dock already says Profile). Playlist save toasts that say “Sign in from Club” → Profile.

**Do not:** rebuild Profile as music identity (Prompt 09). No Friends.

---

## PROMPT 07 — Remaining chrome + consistency sweep

**Depends on:** 02–06  
**Branch:** `cursor/premium-chrome-sweep-1dde`

**Do**

- Charts, Set Builder, Artist/Album, Queue sheet, drawers, sidebar, toasts, empty/error leftover hardcoded steel hex (`#C5CBD6`, `#3D4654`, `#5B6574` on light plates).
- One card / one title / one list row. 44px hits. Dock pills already dark from 01–02 — fix stragglers.
- Delete or stop importing unused `LoginScreen.jsx` / `OnboardingRitual` / `ScenesBrowser` / `PlaylistCard` only if safe (no behaviour change).

**Do not:** P1 IA, P2 social.

**Exit:** No light-steel pages left. Grep for `#C5CBD6` as a **page fill** is empty (docs/audits excepted).

---

## PROMPT 08 — Discover information architecture (P1)

**Depends on:** 05 + 07  
**Do:** Lead with New / Trending / Genres / Artists. Keys + Dig become tools, not equal peer tabs. Charts link from Discover. History stays gated on `year`.  
**Do not:** friends, Spotify-like home mixes.

---

## PROMPT 09 — Profile as music identity (P1)

**Depends on:** 06 + 07  
**Do:** Profile lands on avatar, now playing / recents, liked, playlists. Club membership card nested. Interests/Guide behind.  
**Do not:** public URLs or friends (needs data in 11).

---

## PROMPT 10 — Catalog years + empty/error (P1)

**Depends on:** 07  
**Do:** Ingest/`year` backfill plan + scripts; empty/error states on the new cards; optional light `App.jsx` splits only if a screen PR is blocked.  
**Do not:** user file upload.

---

## PROMPT 11 — Friends + presence (P2)

**Do:** Firestore public presence (listening now), rules, Friends screen from Profile, optional Home rail. Users stay private by default until opt-in.  
**Do not:** make social the product. No fifth dock tab.

---

## PROMPT 12 — Requests + comments (P2)

**Do:** Requests destination (promote `requestCount` + Dedicate). Track comments/reactions.  
**Do not:** generic social feed.

---

## PROMPT 13 — Owned files + collaborative playlists (P2)

**Do:** User MP3 upload (Storage rules + ingest UX) if product wants a true personal library. Multi-owner playlist writes.  
**Do not:** start this before 01–09; it is a different product surface.

---

## How to run the next prompt

Paste this into a new agent after the previous PR is green:

```text
Follow docs/PREMIUM_PLAYER_PROMPTS.md Prompt NN only.
Do not start the next prompt. Branch cursor/<name>-1dde off the latest approved premium branch (or main if merged).
Keep Turtle/Rabbit, four tabs, and the audio engine. Rebuild build/ if you change visuals.
```
