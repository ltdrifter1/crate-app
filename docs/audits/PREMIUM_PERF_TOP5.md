# PlanetMP3 — Top 5 premium + speed upgrades

**Date:** 23 September 2026  
**Question:** What would make this feel like a Bugatti Veyron for music streaming — modern, expensive, and *fast as hell*?  
**Method:** Code + shipped `build/` inspection (bundle, boot path, player, images, chrome). Not a visual restyle. The steel chassis stays.

This is not another creative-direction pass. `docs/CREATIVE_DIRECTION.md` and `docs/CREATIVE_AUDIT_2026-09.md` already protect the visual OS. `docs/PERF_FUTURE.md` already lists deferred infra. This report **ranks five upgrades that move both axes at once**: perceived luxury *and* load/play speed.

---

## Snapshot (as shipped)

| Signal | Now | Bugatti bar |
|---|---|---|
| Main JS | **840 KB** raw / **248 KB gzip** | First paint under ~80 KB gzip of *app* JS |
| CSS | 12 KB (fine) | Keep it small |
| Boot | HTML planet splash → Firebase Auth splash → Home | Device chrome visible before auth settles |
| Catalog | IndexedDB warm-start + `homeLite` 48-track doc, then **full Firestore `getDocs(tracks)`** after 8s | Versioned gzip JSON on the CDN |
| Audio | Dual `<audio>` + progressive **MP3** + 15s radio crossfade | Instant skip, next cut already buffered, AAC/Opus at the edge |
| Covers | Cloudflare `/cdn-cgi/image` with a **session-wide kill switch** on first 404 | Always-display-sized AVIF/WebP; never originals in a rail |
| Navigation | `ScreenPane key={screen}` **remounts every tab**; desktop **reimplements the entire screen tree** | Keep-alive tabs, one tree |
| Fonts | Render-blocking Google Fonts (Plex Sans 400/500/600/700 + Mono 500/600/700) | Self-hosted latin subset, 400/600/700 |
| PWA | Manifest + apple-touch icons; **no service worker** | App-shell cache so return visits skip the splash |
| God object | `src/App.jsx` **4,055 lines** — catalog, auth, billing, radio engine, two UI trees | Player engine + catalog store outside React |

What already works (do not redo): steel/LCD tokens, `CoverImage` + srcset plumbing, homeLite + IDB cache, playback clock *outside* React (`playerPlaybackStore`), lazy routes, `content-visibility` on below-fold Home shelves, Channel cards that prefer catalog sleeves, CSS planet instead of Lottie on the critical path.

The product already *looks* like a device. It does not yet *launch or skip* like one.

---

## Ranked list

1. **Instant sound** — dedicated audio engine + CDN audio (the drivetrain)  
2. **Sub-second Home** — CDN catalog, guest shell, fonts, smaller first JS  
3. **Sleeves that snap in** — never-original covers, blur-up, LCP-only hero  
4. **One chassis, keep-alive tabs** — kill the dual tree + remount hitch  
5. **Material motion, not blur soup** — 60fps keys, contained glass, Media Session

Do these in order. 1 and 2 are the Veyron. 3–5 are the interior.

---

## 1. Instant sound — lift the engine out of App and make skip <100ms

**Why this is #1.** Premium streaming is judged in the first 300ms after Play and the first skip. Visual polish cannot cover a stall. PlanetMP3 still plays **one progressive MP3 URL** through **two HTMLAudioElements** living inside `App.jsx`, with a **15-second radio blend** that only starts once `duration - currentTime` is small enough.

**Evidence**

- Engine lives in `App.jsx` (~lines 1649–2177): A/B elements, silent-WAV iOS unlock, `RADIO_CROSSFADE_SECS = 15`, `QUEUE_CROSSFADE_SECS = 6`, `preload = "auto"`.
- Timeout is 10s (`AUDIO_LOAD_TIMEOUT_MS`). That is a budget airline, not a supercar.
- Preload of next starts ~20s before the blend, and only if `pendingNextRef` is empty. Manual skip of an un-preloaded cut hits Storage cold.
- `docs/PERF_FUTURE.md` already named this: true gapless / MSE / HLS, dedicated audio module. It is still open.
- `playlistCtx` is rebuilt as a **new object every App render** and passed into every screen. Track rows and menus re-render when billing, toasts, or catalog flags twitch — while the engine is still in the same component.

**What “premium + fast” looks like**

| Moment | Now | Target |
|---|---|---|
| Tap Play on a cold hero | Fetch MP3 from Firebase Storage, hope `canplay` | First audio bytes in &lt;400ms (edge AAC/Opus, Range requests) |
| Skip | May `load()` a new src | Instant: inactive element already at `HAVE_FUTURE_DATA` |
| Radio blend | 15s dual-element ramp on MP3 | Short equal-power fade **or** gapless cue points; never a hole |
| Background | Tab can lose the media session | Lock screen / headset skip via Media Session API |
| Code | Engine coupled to App state | `audioEngine` module + store; App only calls `play(id)` |

**How**

1. Extract A/B players, preload, crossfade, unlock into `src/lib/audioEngine.js` (testable; no React). App subscribes; Home never sits in the same render as `timeupdate` writers (clock store already does this — finish the job).
2. Memoize `playlistCtx`. One line, huge INP win while you extract.
3. On `play(track)`, immediately `preload(next)` — not 20s before end. Skip uses the warm element.
4. Serve audio from Cloudflare (or Storage behind a cacheable hostname) with **immutable hashed object names** and long `Cache-Control`. Progressive MP3 is fine as a v1 CDN; add **AAC 256** (or Opus WebM) as the display format and keep MP3 as fallback.
5. HLS/ABR is the v2 drivetrain (mobile 3G). Do not block v1 on MSE.

**Do not:** redesign the immersive deck while the engine is still in App.jsx.

---

## 2. Sub-second Home — stop waiting on Auth + Firestore to show the device

**Why.** First-visit speed is the other half of “fast as hell.” Today the sequence is:

1. `public/index.html` boot splash (good).
2. CRA **248 KB gzip** `main.js` — Firebase client is **276 of 380 source-map files**.
3. `authLoading` → **second** `SplashScreen` (same planet).
4. Login gate. No guest radio.
5. Catalog: IDB if warm; else `fetchHomeLite` (one doc — good); then **8s later** `getDocs(collection(db, "tracks"))` for the full shelf.

A return visitor with IDB is decent. A cold phone on LTE is not a Veyron.

**Evidence**

- `App.jsx` 3138–3158: splash until auth, then login if no user.
- `reloadCatalog` 1316–1356: lite path then `fetchCatalogTracks` = ordered full collection scan.
- `public/index.html` 35–40: **render-blocking** Google Fonts stylesheet. Weights include 400/500/600/700 Sans and 500/600/700 Mono — `PERF_FUTURE` claimed a slimmer set; HTML did not follow.
- Unused `lucide-react` still in `package.json` (custom `Icon.jsx` is the real set).
- No service worker. Every cold load re-pays JS + font CSS.
- Fonts.gstatic + Firestore + Storage are preconnected (good). That cannot hide 248 KB of JS.

**What “premium + fast” looks like**

- **0ms:** HTML already looks like the steel canvas (already true).
- **~200ms:** IBM Plex from **same-origin woff2**, latin only, `font-display: optional` or `swap` with metric-matched fallback so the LCD does not jump.
- **~400ms:** Hero device skeleton + Channel Surfing placeholders from **cached homeLite JSON**, playable without waiting for Auth.
- Auth hydrates in the background. Club/Library still require sign-in.
- Full catalog is `GET /catalog/v{n}.json.gz` (or protobuf) from Cloudflare, not a Firestore fan-out. Firestore remains the write path (Admin, likes, plays).

**How**

1. Export `catalog/homeLite` (already published by `functions/lib/homeLite.js`) and a versioned full shelf to a **cacheable URL**. Client stores `catalogVersion`; only refetch on bump.
2. Paint Home **before** `onAuthStateChanged` resolves when IDB/lite exists. Splash only on true first pixel with empty cache.
3. Self-host Plex: 3 files, not a CSS round-trip to Google. Drop unused weights.
4. Split Firebase: dynamic `import()` for Auth/Firestore after first paint; keep a tiny boot that reads IDB.
5. Optional but high-leverage: **Vite** (or CRA eject only if you must) so the player engine and firebase are real async chunks. Do not rewrite to Next.js just for this — the product is a signed-in SPA player, not a content site. A service worker that precaches `index.html` + `main.js` + fonts is the PWA piece.

**Do not:** add a fancier Lottie splash. The planet is enough; **showing it twice** (HTML then React) is the bug.

---

## 3. Sleeves that snap in — display-sized art, no original-JPEG rails

**Why.** A record shop is judged by the sleeves. Slow, blurry, or popping-in art makes steel chrome feel like a mock. Fast, color-correct sleeves make the same chrome feel expensive.

**Evidence**

- `CoverImage` is correctly lazy + srcset. Then this landmine (`CoverImage.jsx` 97–101): **one Cloudflare 404 calls `markCloudflareResizeUnavailable()`** and every later cover in the session loads the **Firebase original**. One misconfigured zone nukes Home.
- `coverUrl.js` still documents “Firebase originals are too heavy for 168px tiles.” The fallback path puts those originals back on the rail.
- Brand lockup display sizes exist (256/512 + WebP) — good. Masters still sit in `public/brand/` at **730 KB** and **513 KB**. Harmless if unused in chrome; keep them off the critical path (already mostly true).
- No blurhash / LQIP. Tiles go empty → disc fallback → photo. Premium players flash the **album color well** first (you already store `track.color`).
- Home hero can LCP the idle PNG; Channel Surfing then requests a row of sleeves. First two channel tiles should be `priority`; the rest `lazy`. Check `ChannelSurfingSection` so only the first 2–3 get `eager`.

**What “premium + fast” looks like**

- Every tile is a **168 / 336 / 640** AVIF (WebP fallback) generated at **upload**, not guessed at request time.
- Failed CF resize falls back to the **thumb**, never the master.
- Dominant `track.color` fills the jewel well for 50ms; photo fades 120ms. No layout jump (`width`/`height` already set).
- Channel Surfing is sleeve-led (already the intent in `ChannelCard.jsx`). Make the first row the LCP image, not the spinning planet.

**How**

1. Cloud Function (or Resize Images extension, `REACT_APP_COVER_RESIZE=firebase`) writes `_200x200` / `_400x400` / `_800x800` **and** AVIF/WebP beside the original. Point `coverDisplayUrl` at those files as the primary path; CF resize becomes an optional extra, not the only line of defense.
2. Change the circuit breaker: disable CF, **do not** disable thumbs. Originals only for the immersive 960px stage.
3. `DefaultSleeve` / well background = `track.color` or station ink.
4. `fetchpriority="high"` on hero sleeve only. Drop `priority` from offscreen channel art.

**Do not:** add CSS 3D coverflow on Home. `CoverFlow.jsx` is a toy; the wallet on Explore is enough spectacle. Speed of the grid is the luxury.

---

## 4. One chassis — delete the dual tree and stop remounting tabs

**Why.** This is the hitch you feel between Home and Explore. It is also why desktop and mobile drift (Home on desktop already drops `onOpenMenu`). Fast UI is **stable DOM**. Premium UI is **one object** you walk around, not two apps glued at `innerWidth >= 768`.

**Evidence**

- `App.jsx` 3464–3578 builds `innerApp` (mobile).
- Line 3581: `if (!isDesktop) return innerApp`.
- Lines 3598–3694 **copy-paste the same screen switch** for desktop, plus sidebar + queue column. Two sources of truth, two Suspense boundaries, two `ScreenPane` remounts.
- Both trees use `<ScreenPane key={screen}>`. Changing tabs **destroys Home** (hero, IntersectionObserver for dock hide, scroll — patched via `scrollPosRef` on a shared scroller). You pay `screenIn 0.38s` every time. That animation is the opposite of instant.
- `isDesktop` is `useState(window.innerWidth >= 768)` + resize listener — a layout mode in JS instead of one responsive tree.
- Passing the full `tracks` array into Home, Explore, Charts, Search, Library, Club, Mix, Artist, Admin means any catalog hydrate (`startTransition(setTracks)`) re-renders **whatever is on screen** with a new array of new objects after `hydrateCatalogTracks`.

**What “premium + fast” looks like**

- One screen tree. Sidebar and right queue are CSS columns (`display: none` under 768), not a second React mount.
- Tabs **hide** (`hidden` / `display:none` + `aria-hidden`) instead of unmount. Home hero stays warm; Channel Surfing does not reload sleeves.
- Screen changes: **instant** opacity 80ms, no 380ms rise. The device does not “boot” between tabs.
- Catalog is a store. Screens select slices (`homeLite`, `searchHits`) so hydrate does not rebuild Explore.

**How**

1. Delete the desktop duplicate. Wrap `innerApp` with sidebar + optional queue; move padding into CSS.
2. Replace `key={screen}` remount with visibility toggling for the four dock tabs (Home / Explore / Library / Club). Stack/artist/album can still mount on demand.
3. Stabilize catalog identity: hydrate should **mutate maps in place** or keep the same array references for unchanged tracks.
4. `useMemo` the giant prop bags or, better, context/store so Home is not a 40-prop satellite of App.

**Do not:** add React Router page transitions or Framer page-wraps. You already have `parsePath` / `buildPath`. Keep hash/path, drop the theatrical remount.

---

## 5. Material motion — 60fps hardware, glass only on LCD, Media Session

**Why.** After sound and first paint, luxury is **weight**. Keys that press. LCD that is the only blur. Skip that updates the lock screen. Backdrop-filter `blur(40px) saturate(1.16)` on large panels is the cheapest way to look “premium” and the fastest way to miss 60fps on a phone.

**Evidence**

- `theme.js` `glass.blur` / `blurHeavy` (40px / 56px). Applied to injected global classes in `App.jsx` and the desktop right rail (`backdropFilter: glass.blur` ~line 3730).
- `.pmp-deck-plate` uses `blur(28px) saturate(1.18)` plus a repeating scanline overlay (`index.css`). Fine on a 320px deck; toxic if the same recipe hits full-width panels.
- `BgMist` + `Pulse` follow `currentTrack.color` on the desktop main column — extra paints on every track change.
- `styleShip.test.js` already **bans** `will-change: transform` — good discipline. Use compositor-friendly `transform`/`opacity` only, without the will-change leak.
- No Media Session / hardware media keys in src. A Discman that does not talk to the phone’s lock screen is a toy.
- Scanline wash on the hero LCD is scoped (good). Keep it there; do not put CRT on the whole canvas.

**What “premium + fast” looks like**

- **Glass = LCD wells and the dock faceplate only.** Chassis, sidebar, rails: opaque steel gradients (already the brand). Phones stay at 60fps while scrolling Channel Surfing.
- Hardware keys: `transform: scale(0.97)` 80ms on `:active`, no filter animations on the planet during use (splash only).
- Track change: sleeve **crossfade 120ms**; title ticks on the LCD; no full-page radial glow catch-up.
- Lock screen: artwork, title, artist, play/pause/next. Headset skip = same engine as the on-screen key.
- Reduced motion already global — keep it.

**How**

1. Audit `backdrop-filter` call sites. Allowlist: LCD, dock, immersive sheet. Replace the rest with solid `color.canvas` / `glass.plate` (no live blur).
2. Wire `navigator.mediaSession` in the audio engine (metadata + action handlers). This is a small patch with outsized “this is a real player” feel.
3. Hero/immersive already share `PlayerDeck` — keep one physical language. Mini stays collapsed (cover, title, play, skip). Do not bring back an expanded mini sheet (`MOBILE_UX_AUDIT` P0.1).
4. Drop `Pulse` / full-column glow on desktop, or confine it to a 120px orb behind the sleeve.

**Do not:** introduce a new palette, glassmorphism page backgrounds, or “modern SaaS dark mode.” Premium here is **machined**, not generic 2026 dark UI.

---

## What I would not spend on

| Temptation | Why skip |
|---|---|
| Repaint the chassis / new color OS | Already the strongest part of the product |
| Next.js migration | Does not fix MP3 skip, dual trees, or cover originals; months of risk |
| True gapless MSE as the *first* audio project | Extract engine + preload + CDN first; MSE after |
| More Lottie / mascot on boot | Critical path is JS + fonts + auth, not charm |
| Lucide or another icon kit | Hand-drawn `Icon.jsx` is on-brand; delete the unused dependency |
| 8-step feature tour polish | Teach Pace on the deck; tour is not speed |

---

## Suggested sequence (one pass, not a rewrite)

```text
Week-scale slices, not a framework rewrite
├── 1a. Memo playlistCtx + preload-next-on-play + Media Session     (feel: skip)
├── 1b. Extract audioEngine out of App.jsx
├── 2a. Self-host Plex subset; splash only if cache empty
├── 2b. Gzip catalog JSON on CDN; Firestore becomes writer
├── 3.  Upload thumbs + kill CF session breaker; color wells
├── 4.  One tree + keep-alive dock tabs
└── 5.  backdrop-filter allowlist; drop desktop dual glow
```

**Acceptance tests (the Veyron checklist)**

1. Cold LTE: Home hero **visible and tappable** in under 1.5s after HTML (cached fonts).  
2. Play → audible in under 400ms on a warm CDN hit.  
3. Skip feels **immediate** (no spinner) when next was preloaded.  
4. Home → Explore → Home: **no sleeve reload**, no 380ms boot animation.  
5. Scroll Channel Surfing on a mid Android: **no blur jank**; dock stays 60fps.  
6. Lock screen shows the cut and skips it.  
7. `styleShip.test.js` still green — chassis lock intact.

---

## File map (where to cut)

| Upgrade | Primary files |
|---|---|
| 1 Audio | `src/App.jsx` (extract), new `src/lib/audioEngine.js`, `src/lib/audioUnlock.js`, Storage/CDN headers |
| 2 Boot | `public/index.html`, `src/lib/catalogLoad.js`, `functions/lib/homeLite.js`, `src/useAuth.js`, `src/App.jsx` splash gate |
| 3 Sleeves | `src/components/ui/CoverImage.jsx`, `src/lib/coverUrl.js`, upload pipeline / Resize extension |
| 4 Chassis | `src/App.jsx` desktop duplicate (~3581–3694), `src/components/layout/AppChrome.jsx` `ScreenPane` |
| 5 Motion | `src/theme.js` `glass.blur*`, `src/index.css` `.pmp-deck-plate`, desktop glow in `App.jsx`, Media Session in engine |

Related: `docs/PERF_FUTURE.md` (infra backlog), `docs/MOBILE_UX_AUDIT.md` (one player, three sizes — still the right UX rule).
