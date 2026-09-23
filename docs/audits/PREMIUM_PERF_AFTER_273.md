# PlanetMP3 — remaining gaps after #273 (premium drivetrain)

**Date:** 23 September 2026  
**Base:** `main` @ `e502556` (`Implement the premium drivetrain… (#273)`)  
**Method:** Code + shipped `build/` inspection. Not a restyle. Steel chassis stays. No Next.js.

Companion: `docs/audits/PREMIUM_PERF_TOP5.md` (pre-#273 plan), `docs/PERF_FUTURE.md` (infra backlog — **not updated** for #273).

---

## Snapshot table

| Signal | Now after #273 | Still open |
|---|---|---|
| Main JS | **852 KB** raw / **247 KB gzip** (`build/static/js/main.15b7b008.js`) | First paint under ~80 KB gzip of *app* JS; Firebase still static in main |
| CSS | 12 KB raw / 3.6 KB gzip | Fine |
| Boot | HTML `#boot-splash` planet only; React `authLoading` → `return null` (no second splash); dismiss via `dismissBootSplash` | Splash holds until Auth resolves; **login gate**; no guest Home |
| Catalog | IDB warm-start + homeLite → CDN `catalog/v1.json` (800ms abort) → Firestore fallback; full refresh still delayed 8s | Payload is **plain JSON** (comment claims gzip); `version: 1` forever; hydrate rebuilds track arrays; full `tracks` prop into Home/Explore |
| Audio | Helpers in `src/lib/audioEngine.js` (162 lines); **orchestration still in App.jsx** (~364 lines); dual `<audio>`, progressive **MP3**, 15s radio / 6s queue fade; preload-on-play + warm promote | MSE/HLS absent; no audio edge CDN beyond Storage object `cacheControl` on upload; `AUDIO_LOAD_TIMEOUT_MS = 10000`; `createAudioPair()` unused |
| Covers | CF → Firebase thumb → **original** last; color wells; Channel Surfing `priority={i===0}` / `eager={i<3}` | Upload pipeline does **not** mint thumbs; originals still reachable; hero can compete for LCP |
| Navigation | **One** `innerApp` tree; desktop = sidebar + `{innerApp}`; dock tabs `ScreenPane keepAlive` + `warmTabs` | `isDesktop` still JS (`innerWidth >= 768`); Charts/Search remount; `playlistCtx` deps incomplete |
| Fonts | Self-hosted Plex latin woff2 (~97 KB total), `font-display: optional`, no Google Fonts | Done for v1 |
| Motion | `glass.blur = "none"`; dock faceplate solid steel; `screenIn` **0.08s**; `Pulse` is a no-op | `blurSoft`/`blurHeavy`/`blurEdge` still on sheets; MessengerWindow **blur(40px)**; `.pmp-deck-plate` blur(16px); `BgMist` filter blur |
| PWA / Media | Manifest + icons; Media Session metadata + play/pause/next/prev/seekto + `playbackState` | **No service worker**; **no `setPositionState`** |
| God object | `App.jsx` **3,659** lines (was ~4,055) | Engine + catalog + two chrome modes still in App |
| Icons | `lucide-react` **removed** from `package.json` | Done |
| Lottie | Off critical path (`PlanetMascot` lazy); CSS planet on boot | `lottie-react` still a dependency for optional mascot |

What already works (do **not** redo): steel/LCD tokens (`steel-ps1-glass-20260919`), PS1 Channel Surfing plates (#271), no desktop queue rail, `CoverImage` + srcset, homeLite + IDB, `playerPlaybackStore` clock outside React, lazy routes, `content-visibility` shelves, self-hosted fonts, keep-alive dock tabs, one chassis tree.

---

## Ranked remaining upgrades (5–7)

### 1. Finish the drivetrain — CDN audio + real engine ownership (not more helpers)

**Why.** Skip and first-play are still judged against progressive Firebase Storage MP3. #273 extracted *math* into `audioEngine.js`; the A/B deck, timeupdate loop, crossfade ramp, and load timeout still live in `App.jsx`.

**Evidence**

```1759:1768:src/App.jsx
  const preloadNextAudio = useCallback((track) => {
    if (!track?.audioUrl || isCrossfading.current) return;
    const fadeIn = nextAudioRef.current;
    if (!fadeIn) return;
    const url = String(track.audioUrl).trim();
    // ...
    preloadSrc(fadeIn, url);
  }, []);
```

```1857:1867:src/App.jsx
  useEffect(() => {
    const a = new Audio();
    const b = new Audio();
    configureAudioElement(a);
    configureAudioElement(b);
    // ...
    deckPairRef.current = { primary: a, standby: b };
```

`createAudioPair()` exists in `audioEngine.js:154–162` but App still `new Audio()` itself.

```14:21:src/lib/audioEngine.js
export const RADIO_CROSSFADE_SECS = 15;
export const QUEUE_CROSSFADE_SECS = 6;
/** Kick preload this many seconds before the blend window. */
export const PRELOAD_LEAD_SECS = 20;
```

```9:9:src/lib/audioUnlock.js
export const AUDIO_LOAD_TIMEOUT_MS = 10000;
```

Upload sets long cache on Storage objects:

```89:89:upload-tracks.js
    metadata: { contentType, cacheControl: "public, max-age=31536000" },
```

…but playback is still a single progressive MP3 URL; no Range/ABR path; no MSE/HLS (`MediaSource` / `.m3u8` absent from `src/`).

**Do next:** Move bind/preload/crossfade/promote into a non-React engine that App only commands; serve hashed audio behind a cacheable hostname (Cloudflare in front of Storage is enough for v1); keep MP3, add AAC later. **Do not** start MSE until that lands (`PERF_FUTURE` + TOP5 “what I would not spend on”).

---

### 2. Guest / cache-first Home — stop holding the planet on Auth

**Why.** #273 fixed the *double* splash. It did not fix waiting on Firebase Auth before any device chrome.

**Evidence**

```3156:3176:src/App.jsx
  // HTML boot planet stays until auth resolves — do not remount a second splash.
  if (authLoading) {
    return null;
  }

  // Not logged in — show login screen
  if (!firebaseUser) return (
    <Suspense fallback={<div style={{ minHeight: "100dvh", display: "grid", placeItems: "center" }} />}>
      <LoginScreen
```

```3062:3064:src/App.jsx
  useEffect(() => {
    if (!authLoading) dismissBootSplash();
  }, [authLoading]);
```

Catalog already warms from IDB on mount (`App.jsx` 1365–1400) **while** splash is still up — that work is invisible until Auth finishes.

Main chunk barely moved: **851,694 B / 253,416 B gzip** vs audit’s 840 / 248. Firebase is still a static import on the critical path:

```7:9:src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth }       from "firebase/auth";
import { getFirestore }  from "firebase/firestore";
```

`catalogLoad.js` statically imports Firestore too (line 6), so CDN path still pulls Firestore into the graph.

**Do next:** If IDB/homeLite exists, dismiss splash and paint Home (or a guest radio shell) before `onAuthStateChanged`; dynamic-import Auth/Billing; keep Club/Library gated. Optional SW for `index.html` + `main.js` + fonts on return visits.

---

### 3. Catalog CDN is real — make it trustworthy (gzip, version, identity)

**Why.** Client prefers CDN (`fetchCatalogTracks` → `fetchCatalogCdn` with **800ms** timeout) then Firestore. Publish path exists. The “gzip JSON” claim is aspirational.

**Evidence**

```79:81:src/lib/catalogLoad.js
/** Published by functions/lib/catalogJson.js — gzip JSON, long CDN cache. */
export const CATALOG_CDN_OBJECT = "catalog/v1.json";
export const CATALOG_CDN_TIMEOUT_MS = 800;
```

```55:71:functions/lib/catalogJson.js
  const payload = {
    version: 1,
    ts: Date.now(),
    trackCount: tracks.length,
    tracks,
  };
  const body = JSON.stringify(payload);
  // ...
  await file.save(body, {
    resumable: false,
    metadata: {
      contentType: "application/json; charset=utf-8",
      cacheControl: "public, max-age=120, s-maxage=3600",
    },
  });
```

No `contentEncoding: "gzip"` / `.json.gz`. Object name is forever `catalog/v1.json`. Client does not store `catalogVersion` for conditional refetch.

Hydrate always returns a **new** enriched array (`catalogHydrate.js`), then `startTransition(() => setTracks(hydrated))` — every Home/Explore consumer gets a new `tracks={tracks}` (11 call sites in `App.jsx`).

**Do next:** Gzip (or brotli) at publish; bump `catalog/v{n}.json` or ETag/`If-None-Match`; hydrate in place / Map identity so unchanged rows keep references; pass shelf selectors into Home, not the full crate, where possible.

---

### 4. Sleeves — mint thumbs at upload; never put masters on rails

**Why.** Circuit breaker now falls to Firebase thumbs first (good). Third tier is still the Storage original.

**Evidence**

```117:128:src/components/ui/CoverImage.jsx
        onError={(e) => {
          if (!raw && tier === "cf" && displaySrc !== src) {
            markCloudflareResizeUnavailable();
            setTier("thumb");
            return;
          }
          if (!raw && tier === "thumb" && displaySrc !== src) {
            setTier("original");
            return;
          }
```

`CoverImage.test.js` 50–55 asserts the original URL after thumb failure. `upload-tracks.js` uploads `covers/{file}` only — no `_200x200` generation. `REACT_APP_COVER_RESIZE=firebase` requires the Resize Images extension (optional).

Channel Surfing LCP is intentional:

```68:69:src/components/home/ChannelSurfingSection.jsx
              priority={i === 0}
              eager={i < 3}
```

Hero sleeve uses `priority={eager}` (`HeroPlayerCard.jsx` 197) — can steal LCP from the first channel tile when both are on screen.

**Do next:** Write 200/400/800 (+ AVIF/WebP) beside originals on upload; on thumb miss → color well / disc, **not** master (reserve master for immersive ~960); keep channel-0 as sole `fetchpriority=high` on Home.

---

### 5. Motion allowlist — kill remaining large-surface blur

**Why.** Primary token `glass.blur` is `"none"` (enforced by `styleShip.test.js`). Soft/heavy/edge blurs and hard-coded 40px chat glass remain.

**Evidence**

```390:393:src/theme.js
  blur: "none",
  blurSoft: "blur(12px) saturate(1.08)",
  blurHeavy: "blur(18px) saturate(1.1)",
  blurEdge: "blur(14px) saturate(1.08)",
```

```258:259:src/index.css
  backdrop-filter: blur(16px) saturate(1.12);
  -webkit-backdrop-filter: blur(16px) saturate(1.12);
```
(`.pmp-deck-plate`)

```364:365:src/components/chat/MessengerWindow.jsx
        backdropFilter: "blur(40px) saturate(1.2)",
        WebkitBackdropFilter: "blur(40px) saturate(1.2)",
```

`App.jsx` injectStyles still assigns `glass.blurHeavy` on `.glass-dock` (577–578) even though the dock faceplate is already opaque steel (`GlassDock.jsx` 82–85). `Pulse` returns `null` (`AppChrome.jsx` 158–161) — done. `BgMist` still paints a `filter: blur(40px)` orb behind content.

Highest backdrop-filter density: `theme.js` (11), `EnergyShiftButton` (7), `AdminScreen` (6), `ImmersivePlayer` (5), `MessengerWindow` (2 hard-coded 40/20).

**Do next:** Allowlist LCD / immersive sheet / dock only; replace Messenger + large Admin/Club panes with `glass.plate` / `ice.pane` opacity; drop or shrink `BgMist`.

---

### 6. Media Session position + tiny PWA shell (optional but high “real player” feel)

**Why.** Lock-screen transport works; scrubber on the lock screen does not track.

**Evidence**

```44:59:src/lib/mediaSession.js
export function syncMediaSession(track, { playing = false } = {}) {
  // metadata + playbackState only — no setPositionState
}
```

```2544:2553:src/App.jsx
  useEffect(() => {
    if (!("mediaSession" in navigator)) return undefined;
    const apply = (state) => {
      try {
        navigator.mediaSession.playbackState = state.isPlaying ? "playing" : "paused";
      } catch { /* ignore */ }
    };
```

No `navigator.serviceWorker` / workbox anywhere under `src/` or `public/`. Manifest exists (`public/manifest.json`). Hosting already immutable-caches `/static/**` and fonts (`firebase.json` 28–46).

**Do next:** `setPositionState({ duration, position, playbackRate })` from the playback store (outside React); SW precache shell + fonts only — do not SW-cache audio or the full catalog.

---

### 7. Stabilise hot props — `playlistCtx` deps + catalog selectors

**Why.** Partial win: `playlistCtx` is `useMemo`’d. Deps are only `[ownPlaylists]` while handlers close over live functions — stale risk *and* still a giant bag. Full `tracks` still fans out.

**Evidence**

```3032:3043:src/App.jsx
  const playlistCtx = useMemo(() => ({
    playlists: ownPlaylists,
    onCreate:  createPlaylist,
    onAdd:     addToPlaylist,
    // ...
    onOpenAlbum: (track) => openAlbum(track),
  }), [ownPlaylists]);
```

`isDesktop` remains a React layout mode:

```883:888:src/App.jsx
  const [isDesktop, setIsDesktop]     = useState(() => window.innerWidth >= 768);
  useEffect(() => {
    const handle = () => setIsDesktop(window.innerWidth >= 768);
```

Keep-alive coverage is solid for dock tabs (`nav.js` `KEEP_ALIVE_SCREENS` = home/explore/favorites/profile; `warmTabs` grows on visit). Charts/Search still use remounting `ScreenPane` (`App.jsx` 3513–3517).

**Do next:** Stable handler refs or a tiny context store; CSS sidebar visibility instead of `isDesktop` early return; leave Charts remount unless measured.

---

## What is DONE and should not be redone

| Shipped in #273 | Proof |
|---|---|
| Dual-tree deleted | Single `<HomeScreen` (`styleShip.test.js`); desktop `return` wraps `{innerApp}` only (`App.jsx` 3642–3657) |
| Keep-alive dock tabs | `ScreenPane keepAlive` + `warmTabs` (`App.jsx` 902–911, 3503–3579); `nav.js` `KEEP_ALIVE_SCREENS` |
| Self-hosted Plex | `public/index.html` 35–76; no `fonts.googleapis`; ~97 KB woff2 |
| Single HTML splash | `#boot-splash` outside `#root`; `authLoading → null`; `SplashScreen` not on auth path |
| `audioEngine` + Media Session modules | Imports + tests; handlers bound in App 2528–2542 |
| CDN catalog client + publisher | `catalogLoad.js` / `functions/lib/catalogJson.js`; preferred over `getDocs` |
| Cover CF → thumb (not master-first) | `coverUrl.js` 134–136; `CoverImage` tier ladder |
| lucide removed | `package.json` / `styleShip` assertion |
| Glass primary blur off | `theme.js` `blur: "none"` |
| Tab transition 80ms | `AppChrome.jsx` `screenIn 0.08s` |
| #271 PS1 plates / no queue rail / Explore idle prefetch | Preserved; `runWhenIdle(loadExploreScreen, { timeout: 400 })` |

---

## Traps (do not undo)

| Temptation | Why skip |
|---|---|
| Restyle steel chassis / new color OS | Strongest product asset; lock `steel-ps1-glass-20260919` |
| Bring back desktop **queue rail** | Explicitly removed in #271; #273 preserved |
| Replace Channel Surfing PS1 plates with photo sleeves | #271 restored `covers.find` / plate path — leave it |
| Next.js migration | Does not fix MP3 skip, Storage audio, or Auth gate; months of risk |
| True gapless MSE as the *first* audio project | Engine ownership + CDN first |
| Second splash / more Lottie on boot | Critical path is Auth + main.js, not charm |
| Re-add lucide or another icon kit | Hand-drawn `Icon.jsx` is the brand |
| Theatrical tab remount / Framer page wraps | Keep-alive + 80ms opacity is the bar |

From TOP5 “what I would not spend on” — still correct after #273.

---

## File map (where to cut next)

| Upgrade | Primary files |
|---|---|
| 1 Audio CDN + engine ownership | `src/App.jsx` (~1759–2120), `src/lib/audioEngine.js`, `src/lib/audioUnlock.js`, `upload-tracks.js` / Storage+CF headers |
| 2 Guest / Auth-deferred boot | `src/App.jsx` 3156–3176, `src/useAuth.js`, `src/firebase.js`, `src/lib/bootSplash.js`, `public/index.html` |
| 3 Catalog gzip + version + identity | `functions/lib/catalogJson.js`, `src/lib/catalogLoad.js`, `src/lib/catalogHydrate.js`, `src/App.jsx` `reloadCatalog` |
| 4 Upload thumbs / no master rails | `upload-tracks.js` or Resize extension, `src/lib/coverUrl.js`, `src/components/ui/CoverImage.jsx`, `ChannelSurfingSection.jsx` / `HeroPlayerCard.jsx` |
| 5 Blur allowlist | `src/theme.js` `glass.blur*`, `src/index.css` `.pmp-deck-plate`, `MessengerWindow.jsx`, `ImmersivePlayer.jsx`, `App.jsx` injectStyles `.glass-dock` |
| 6 Position state + SW | `src/lib/mediaSession.js`, `src/lib/playerPlaybackStore.js`, new SW + `public/manifest.json` |
| 7 Prop / layout thrash | `src/App.jsx` `playlistCtx`, `isDesktop`, screen prop bags |

Related: update `docs/PERF_FUTURE.md` so “dedicated audio engine” / “versioned catalog CDN” / “deduped trees” reflect partial ship vs remaining work.

---

## Quick numbers cheat-sheet

| Artifact | Size |
|---|---|
| `main.15b7b008.js` | 851,694 B raw · 253,416 B gzip |
| `main.ea5e1b83.css` | 11,883 B raw · 3,558 B gzip |
| Self-hosted fonts (5× woff2) | ~99,616 B |
| `src/App.jsx` | 3,659 lines |
| `src/lib/audioEngine.js` | 162 lines |
| Largest lazy chunks (gzip) | Explore-ish ~13 KB (`19.*`), ~12 KB (`241.*`) |

---

## Suggested sequence (one pass)

```text
1. CDN audio hostname + move crossfade/promote out of App render
2. Guest/IDB paint before Auth; dynamic Firebase where safe
3. Gzip + version catalog JSON; stabilize hydrate identity
4. Upload thumbs; CoverImage stops at thumb/well
5. Blur allowlist (Messenger 40px first)
6. mediaSession.setPositionState; optional app-shell SW
7. playlistCtx / selector props (cheap, anytime)
```

**Acceptance (Veyron checklist, post-#273 delta)**

1. Cold LTE with warm IDB: Home visible **without** waiting on Auth.  
2. Play → audible &lt;400ms on CDN audio hit.  
3. Skip with warm standby: no spinner.  
4. Home → Explore → Home: still no sleeve reload (already true).  
5. Chat open + scroll Channel Surfing: no 40px full-pane blur jank.  
6. Lock screen scrubber tracks position.  
7. `styleShip.test.js` green; chassis meta unchanged.
