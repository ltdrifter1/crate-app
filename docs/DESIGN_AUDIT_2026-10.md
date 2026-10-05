# PlanetMP3 — design & UX audit, October 2026

**Brief:** the internet's weird little music world — a record shop, MP3 player, radio station, music
magazine and music-TV channel from an alternate 2002. Audit first; preserve what works; don't redesign
for the sake of it.

**Method.** Ran the app (`npm start`, the committed production `build/`, and every `#…-preview` route),
screenshotted it at 390×844 and 1280×800, and read the code behind what I saw. Fonts were checked with
Chromium's own platform-font report (`CSS.getPlatformFontsForNode`), not by eye. Contrast is computed.
Behaviour claims were checked by grep or by a test that fails on the old code.
Judgments are marked **(judgment)**. What I could not check is listed at the end.

> **Follow-up (same month):** recommendation 1 (chart back on Home) and the "N locked in" half of
> recommendation 2 are done — see [`THE_BOARD.md`](THE_BOARD.md). The Charts page was rebuilt (≈75% of the
> old Charts code replaced), Home gained **The Board** below Channel Surfing, and every estimated
> "locked in" number was replaced with the track's real request and play counts. Seeded dedications
> (the other half of 2) and the Firestore rules caveat are still open.

---

## Verdict

**The product is better than it looks, and the gap is not style.** The voice, the channel dial, the
program guide, the pixel station art, the Set Builder energy arc, the Club card, and the "ON FILE" artist
card are the right ideas, written by someone who knows the music. The chassis (flat charcoal, pearl
plate, one broadcast red, condensed caps) is competent and calm.

What holds it back is (a) **correctness at the front door** — a stray `}` on Home, an unreadable sign-in
button, headings in the wrong font on a first visit; (b) **promises with no control behind them** —
"play & request to climb" had no Request button anywhere; (c) **its best features are hard to reach** —
Charts, Dig and History; and (d) **some of the "alive" feeling is simulated**, which is the one thing that
can't survive an audience that cares about authenticity.

Do **not** start another chassis. Between 18 and 30 Sep the visual system was re-skinned at least five
times (`git log`: DistroKid-blue steel → steel-ps1-glass → obsidian night radio → dark-premium →
graphite/Broadcast Glass); 30 files still carry translucent slate/silver literals from the light-steel
era (below). Finish screens on the current chassis.

---

## What works — preserve it

| Thing | Why (evidence) |
|---|---|
| **Channel dial + station inks** | 14 channels, each with a printed ink, a `CH-04` number plate and a divider-card rule. Pink Y2K Dance, gold House, green Local. The only place the product has *colour with meaning*. |
| **Pixel station art** (onboarding, Channel Surfing) | iPod + note, Strat + bolt, vinyl + palm, fir + radio mast, disco-ball house, planet chip. Distinctive, owned, not AI-looking. The single best visual asset. |
| **Program guide ("Today")** | A schedule with `LIVE` and host names is what makes this a *station*, not a feed. It is the strongest piece of the "radio/TV" claim. |
| **Hero lower-third** | Red rule, condensed caps title, `118 BPM · 8A · MP3 · AFTERGLOW`. Broadcast grammar, not a Spotify card. |
| **Landing page copy + structure** | "Open all night." / "Liner notes — what's on this disc" / `CH.01–04` rows / live-channels rail. Voice is right. |
| **Club card** | `NO. #000142`, JOINED, ON THE SHELF. Ownership made visible. |
| **Artist "ON FILE" card** | Station ink, years, spins. Facts the catalog actually holds; no invented bios. |
| **Crate Dig** | "One random pull from the crate. No algorithm. No reason." Best idea in Discover. |
| **Set Builder energy arc** | The most distinctive *graphic* in the product. |
| **Slow/Fast ("next picks")** | The turtle and rabbit are memorable and unique to the product. |

---

## What is weak, generic or confusing

### Verified defects (fixed in this pass unless noted)

| # | Finding | Evidence |
|---|---|---|
| 1 | **A literal `}` printed on Home and Discover.** `App.jsx` had `<HomeScreen …/>}` and `…</Suspense>}` in the pane markup (since #275). | In the shipped bundle: `onOpenMenu:V}),"}"`. Stray text nodes in the DOM of HEAD's committed build: `["}"]` on `/`, `/discover`, `/you`, `/charts` and `["}","}"]` on `/explore` (panes stay mounted; only Home's and Discover's are visible). Rebuilt: `[]` on all five. A test now fails on the old code. |
| 2 | **"Continue with Google" was invisible.** Label colour `color.ink` (pearl `#F4F7FB`) on a pearl→white button face. | Contrast **1.00–1.13 : 1**. It is the primary sign-up path. Now dark ink. |
| 3 | **Sign-in card, "Log in" button, "or email" / tab text were light-steel leftovers** (mid-grey slab on a charcoal page). | Screenshot. On the old slab `color.faint` ("or email", inactive tab) was **1.92 : 1** and `color.muted` ("Show", "Forgot password?") **2.92 : 1**. Card is now the module surface (muted on it: 5.1 : 1); secondary button is `BTN_SECONDARY`. |
| 4 | **First-time visitors got system fonts for headings.** `font-display: optional` skips any face not ready at first paint, and only Outfit 400/700 + Barlow 800 were preloaded. | Fresh context, 2 / 2 runs on the **committed production build**: "Open all night." (Outfit 800) → *Liberation Sans*; "Log in", "Today" (Outfit 600) → *Liberation Sans*; "Channel Surfing" (Barlow 700) → *Outfit*. On the dev server the LCD line `118 BPM · 8A` rendered in *DejaVu Sans Mono*. After the fix, on the rebuilt production build every probed heading renders in its brand face; the LCD line renders in IBM Plex Mono (dev server). |
| 5 | **Rails lost their gutter.** Cards snap to `start` with no `scroll-padding`, so the first card sat flush against the screen edge under a title indented 20px; the Today strip's first label touched x=0. | Screenshot (Chromium mobile emulation). Fixed in `Rail`, `ShowGuideRail`, `SceneSurfRail`. |
| 6 | **Landing "This Month's Chart · Top 5" was hard-coded** (Drexciya, Autechre, Burial…) **with ▲2 ▲5 ▼1 ▲8 movement arrows** — not the real chart. The raw countdown the landing can reach carries no week-over-week data (its labels are `NEW / ↑ HOT / ↑ / ● / ·`; history is a separate enrichment on the Charts screen), so arrows would be invented. | `CHART_TEASERS` in `LandingScreen.jsx`; `buildCountdown` in `lib/station.js`. Now shows the real top 5 when the catalog has loaded, otherwise a card that says **"Sample board · NOT LIVE DATA"** with no arrows. |
| 7 | **"Play & request to climb" had no Request control.** `markRequestedToday` / `hasRequestedToday` existed, with a test, and **no component called them**; nothing in `src/` or `functions/` writes `requestCount`. Charts header, ticker, landing and the "Most Requested Live" show block all promise it. | `grep`. Now: **Request it** in every track `⋯` menu and the player's `⋯` menu — one per track per day, optimistic, rolled back if the write fails. See caveats. |
| 8 | **The track `⋯` menu ghosted page text through it and ran off the bottom of a phone.** Translucent plate with `blur: none`; clamp assumed 320px for a menu capped at 420px. | Screenshot: "Play this cha[rt]" visible through the menu header; the bottom ~90px of the menu was below the viewport. Now opaque and clamped by its real height. |
| 9 | **Channel number badges failed contrast on 11 of 14 inks** (fixed white label: House gold 2.27 : 1, UK Garage 3.03, D&B 3.09). | Computed. `onInk()` picks pearl or near-black per ink; all 14 now ≥ 4.26 : 1 (three — Y2K Dance, Variety, Punk — are 4.26–4.47, still just under AA for 11px). |
| 10 | **Signed-out Library was a blank page with one button** — one of four dock tabs, for every logged-out visitor. | Screenshot. Now previews what the page holds (Playlists / Liked / Recents) using the real tab names. |

### Judgment calls (not changed unless noted)

- **Home is a radio station that has lost its chart.** Landing sells "a monthly chart" as one of three
  things; signed-in Home shows hero → Today → Channel Surfing → recents. `CountdownRail` ("Most
  Requested", "TRL / MuchMusic chart energy") is **unreferenced**, and `HomeScreen` receives `countdown`
  and `onOpenCharts` and renders neither. Charts is two taps from Home on a phone (Discover → the 11px mono
  `CHARTS` chip, or ☰ → Charts) and is never on Home itself. **(judgment)** This is the biggest structural gap against the brief.
- **Discover's front door is generic.** `New / Trending / Genres / Artists` is what every music app
  says. Dig, Keys and Energy — the distinctive ones — are small mono chips under a `TOOLS` label
  (measured: 11px, 32px tall, against 14px / 38px for the generic tabs above them).
- **Library reads as Apple Music** (cover mosaics, "Singles / Playlists / Liked"). Nothing says *my
  crate*. The Set Builder's energy arc would make a far better playlist cover.
- **Slow/Fast carries no verb on the control itself.** A wedge between two animals; the explanation is an
  11px mono caption beneath it ("Slow or Fast changes what plays next") and one line in the first-run tour.
  On a phone the caption sits under the dock in the first viewport. (The Sept audit says the tour no
  longer teaches it; that is out of date — the current Home step does.)
- **Almost everything is grey.** By design ("album art supplies all hue"), and inks fix part of it, but
  most screens are silver on charcoal. The hero's CH plate now carries its station ink (done, below).
- **Vocabulary splits:** Save / Like / Liked / favourites; Library vs `/discover` (path) vs Discover
  (tab); `LoginScreen.jsx` is dead while `LandingScreen` is imported *as* `LoginScreen`.
- **Dock text ghosts through the bar** mid-scroll (no blur by design). Minor; not changed.

### Honesty risks — simulated liveness

These are the only items I'd call risky to the brief ("not fake nostalgia"), because they present
simulation as community:

1. ~~**"N locked in"**~~ *(removed in the follow-up — now real counts)* (player booth, and the Charts stat pill `217 now LOCKED IN`) was
   `estimateLockedIn()`: a number from the time of day, plays, likes and the current minute. Its own
   comment says "Feels alive without inventing fake live infra." It is shown beside real counts
   ("10 TRACKS", "4 CLIMBING") with no "est.".
2. **The dedication crawl is seeded** with five invented dedications from invented people (Mira, Jae, Theo,
   Sam, Riley), in every visitor's localStorage.
3. **Real dedications never reach anyone else.** They are written to Firestore `stationDedications`; no
   code reads that collection. The crawl reads only the local, seeded list.
4. The landing sample board (item 6 above) — fixed.

Station chat itself is real (Firestore messages + presence) — provided the rules in `firestore.rules`
are deployed, which the README still lists as outstanding.

---

## What is unnecessary

- **16 component files have no production importer** (verified by name across `src/`): `LoginScreen`,
  `SplashScreen`, `HomeMessenger`, `CommunityMixBanner`, `ExploreHero`, `GenreMosaic`, `SleeveWallet`,
  `PlaylistCard`, `CoverFlow`, `ListenInsightsSheet`, `GenreTasteOnboarding`, `OnboardingRitual`,
  `PlaybackProgressHairline`, `ScenesBrowser`, `CountdownRail`, `CoverStage`. They don't ship (tree-shaken),
  but each is a place a new contributor can restyle the wrong file. `CountdownRail` is the exception — see
  above. Not deleted here: some have tests, and one may be wanted back.
- **Legacy colour names that lie:** `y2k.cyan` is graphite, `trim.lime` is steel, `neons.*` are greys, `y2k.offWhite` is pearl.
  Left alone (`App.test.js` pins some); rename, don't revalue.
- **Light-steel-era literals:** `rgba(91,101,116,…)` / `rgba(208,214,224,…)` appear 70 times in 31 files at
  HEAD, 63 times in 30 after this pass (mostly borders and shadows tuned for a light page; ShowGuide 7,
  App 6, LandingScreen 5).
- **`CREATIVE_DIRECTION.md` still says "rebuilt with modern technology and glassmorphism".** The shipped
  chassis is flat, and this brief says no generic glassmorphism. One line to change; I left the
  "single source of truth" alone.

---

## The ten priorities

| # | Priority | State | What's there / what's missing |
|---|---|---|---|
| 1 | Navigation | **OK** | Four-tab dock is right. Search is three surfaces (Home field, Discover field, `/search`). Charts and Build a set are overflow. |
| 2 | Discovery | **Strong ideas, weak front door** | Worlds, Energy, Keys, Dig are good. Taxonomy up front is generic. |
| 3 | Personal library | **Thin** | Likes/playlists/recents over a shared catalog. No ownership story; looks like a streaming library. |
| 4 | Player | **Strongest area** | Hero, immersive, lower-third. Fonts now load; Slow/Fast is caption-only. |
| 5 | Playlists | **OK** | Owner-only; no collaboration. Cover mosaics are generic. |
| 6 | Charts | **Real engine, buried** | Countdown, history, climbers, #1s. Not on Home; request had no control (fixed). |
| 7 | Artist discovery | **Good** | "ON FILE" card is right. Artists tab is a plain index. |
| 8 | Music history | **Dark** | History tool is hidden unless tracks carry release years; the Sept audit says the catalog mostly doesn't. **Not re-verified against the live catalog.** Data work, not design. |
| 9 | Requests | **Was missing; now a menu item** | Needs a visible control on chart rows and a Requests surface to feel like a feature. |
| 10 | Mobile | **Good bones** | Safe areas, 44px targets, dock. Gutter, menu overflow fixed. |

## Screen check — intuitive / fun / distinctive / feels like PlanetMP3 / makes me explore (judgment)

| Screen | I | F | D | P | E | Note |
|---|---|---|---|---|---|---|
| Landing | ● | ◐ | ◐ | ● | ◐ | Right voice; sign-in was broken (fixed). |
| Home — playing | ● | ◐ | ● | ● | ◐ | Hero is the best surface. |
| Home — below the hero | ◐ | ● | ● | ● | ◐ | Dial + guide are the product; chart missing. |
| Immersive player | ● | ◐ | ◐ | ◐ | ○ | Desktop right column is sparse (Sept audit says the same). |
| Discover | ◐ | ○ | ○ | ◐ | ◐ | Generic names; best ideas hidden in chips. |
| Dig | ● | ● | ● | ● | ● | Tiny entry point for the best idea. |
| Charts | ◐ | ◐ | ◐ | ● | ◐ | Good bones; hard to reach. |
| Library | ● | ○ | ○ | ○ | ○ | Competent, anonymous. |
| Artist | ● | ◐ | ● | ● | ● | "ON FILE" is the right culture move. |
| Club / Profile | ◐ | ● | ● | ● | ○ | Card is great; page is billing-shaped. |
| Set Builder | ● | ● | ● | ● | ● | Preserve. |
| Onboarding | ● | ● | ● | ● | ● | Pixel stations. Preserve. |

● strong ◐ ok ○ weak

---

## What changed in this pass

All on the Broadcast Glass chassis (`broadcast-glass-20260930`, unchanged). No tokens revalued, no
layout rebuilt, no data model changed. Before/after: `docs/audits/design-audit-2026-10/`.

| Change | Files |
|---|---|
| Remove the stray `}` ×2; regression test that fails on the old code | `App.jsx`, `App.mount.test.js` |
| Google label, sign-in card, secondary button, low-contrast text | `LandingScreen.jsx` |
| Landing chart: real top 5, or an honest "Sample board" | `LandingScreen.jsx`, `App.jsx`, `LandingScreen.test.js` |
| Rail / guide / scene-rail gutters (`scroll-padding`) | `MusicSection.jsx`, `ShowGuide.jsx`, `SceneSurfRail.jsx` |
| Preload Outfit 600/800, Barlow 700, Plex Mono 700; precache the faces actually used; `/fonts/*` 30-day cache | `public/index.html`, `public/sw.js`, `public/_headers` |
| Home "Today" gets the same band header as Channel Surfing; "7 blocks" no longer 3.9 : 1 | `ShowGuide.jsx` |
| Hero CH plate prints in the station's ink; ink-aware label colour (`onInk`) for the plate and the dial badges | `HeroPlayerCard.jsx`, `ChannelCard.jsx`, `lib/mtvChannel.js` |
| **Request it** (menu + player `⋯`), once per track per day | `TrackRow.jsx`, `ImmersivePlayer.jsx`, `App.jsx`, `lib/station.js` |
| Track menu: opaque, clamped by real height | `TrackRow.jsx` |
| Signed-out Library previews Playlists / Liked / Recents | `GuestMemberGate.jsx`, `App.jsx` |

**Tests:** 95 suites / 612 tests at baseline → **96 / 624**, all passing. `npm run build` + the
shipped-style assertion pass; `build/` is regenerated (the repo serves it to Cloudflare Pages).

### Caveats on what I shipped

- **Request writes `requestCount` from the browser** with `increment(1)`, the same pattern as likes, and
  `firestore.rules` already allow it. I could not test it against live Firestore here. **The rule allows
  any signed-in client to set `requestCount` (and `likeCount`) to any value**, and the chart score
  weights a request ×12. A one-line console call can put any track at #1. This is the existing design
  ("Clients may nudge likes / skips / requests") but it is now exercised. A bounded rule — an update may
  only change `requestCount` by exactly `+1` — or a Cloud Function like `playCount` is the fix. I did not
  edit the rules: I can't run the emulator here, and a mistake in that file breaks every like and skip.
- **The one-per-day limit is per browser and the "day" is UTC** (`localStorage`, `stationDayKey`), so it limits honest users, not abuse.
- `onInk` leaves three inks at 4.26–4.47 : 1 for 11px text. Closer, not perfect.
- The `font-display: optional` + preload approach is the repo's own choice; preloading seven small faces
  (~110 KB) trades some first-load bandwidth for correct type. If that's too much, `font-display: swap`
  is the alternative at the cost of a visible swap.

---

## Recommended next, in order — your call

1. ~~**Put the chart back on Home.**~~ **Done** — The Board (Top 5) sits below Channel Surfing.
2. **Simulated liveness — half done.** "Locked in" is gone. Still open: read `stationDedications` (the
   collection already exists and is write-only) and drop the five invented dedications.
3. **Lead Discover with Dig and Charts.** They are what no other app has. Rename `TOOLS`.
4. **Backfill `year` at ingest.** Turns the hidden History tab into a discovery mode, and gives
   Artist pages and Library real culture.
5. **Bound the request/like rule** (above), then give Request a visible key on chart rows.
6. **Library with a point of view.** Use the energy arc as the playlist label; say *crate*, *mix*, *shelf*.
7. **Put a verb on Slow/Fast.** A two-word label on the control ("NEXT PICKS") beats a caption under it.
8. **Delete or revive the 16 orphans; rename `LoginScreen`; fix the `CREATIVE_DIRECTION` glassmorphism line;
   retire the remaining light-steel literals screen by screen.**

## Not verified

- Anything against the **live catalog, live Firestore, or real audio** (the sandbox has no Firebase
  access; screens were checked on fixtures and the empty guest state). Preview sleeves are flat colour
  placeholders, so I made no art judgments from them.
- **Safari / iOS / Android.** Gutter and font findings are Chromium. The scroll-snap padding fix is
  standard CSS but I haven't seen it on a device.
- Keyboard and screen-reader behaviour of the new menu item beyond `role="menuitem"` (matches its siblings).
- Anything behind an admin login.
- Image-load `ERR_CERT_AUTHORITY_INVALID` console noise in the sandbox is the egress proxy, not the app.
