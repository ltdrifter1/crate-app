# Crate App — Full Project Review

> **Status:** Review only. **No application code has been modified.**
> **Scope:** Architecture, UX/UI, performance, code quality, security, missing features, phased roadmap, and product vision.
> **Reviewed revision:** `main` @ `350bbf6` (`https://github.com/ltdrifter1/crate-app`)
>
> This document is a proposal. **No implementation should begin until the roadmap in §8 is approved.**

---

## 1. Executive Summary

**Crate** (branded in-app as **V Music** / `cratedigger.uk`) is a Firebase-backed React SPA for serious listeners: DJs, diggers, collectors, and mood-driven everyday listening. There is no custom server. Auth, catalog, user data, and hosting all sit on Firebase.

The product’s crown jewel is domain logic most streaming clones never attempt: **Camelot harmonic mixing**, **time-of-day energy windows**, a behavioral **“Aura” trait engine**, **session/route builders**, **Drift / Harmonic Map** exploration surfaces, and a dual-`Audio` **crossfading V Radio**. That idea layer is genuinely differentiated.

The engineering around it is fragile. Nearly the entire product lives in **one 3,945-line / ~231 KB `src/App.jsx`** (~30 components, audio engine, recommendations, admin, and inline styles). There are **no real tests**, **no CI on `main`**, **no Firestore/Storage rules in the repo**, a **~660 KB monolithic JS bundle**, and the **entire track catalog is loaded into memory on every launch**. The git log is dominated by “Fix App.jsx syntax and rebuild” — a symptom of the monolith, not a lack of ambition.

### Overall project health

**C+ — promising prototype with a strong product soul.**

Shippable for a curated catalog and a small user base. Not yet safe to scale catalog size, concurrency, team size, or feature count without foundational work.

### Strengths

- **Differentiated listening model** — keys, energy arcs, Aura traits, and sessions are features Spotify does not offer and that DJs/collectors actually care about.
- **Tasteful visual direction** — glass surfaces, artwork-driven ambient color, vinyl/expanded player, time-of-day gradients. It feels intentional, not template-generic.
- **Auth breadth** — email/password, Google, phone OTP, password reset, with friendly error mapping (Apple is implemented in `useAuth` but not exposed in the login UI).
- **Real radio crossfade** — dual HTML5 `Audio` elements with a timed volume ramp (~15s). More than most hobby players attempt.
- **Optimistic likes** with Firestore rollback on failure.
- **Low ops cost** at small scale — Firebase-only.

### Weaknesses

- **Monolith** — no module boundaries, no router, heavy prop drilling, duplicated mobile/desktop trees.
- **No automated quality gates** — boilerplate test will fail; no CI/lint on `main`; `build/` is committed by hand.
- **Security gaps on `main`** — no committed rules; client writes global counters; admin is client-gated (and **fully exposed on mobile bottom nav**).
- **In-memory catalog model** — search, recs, and UI all assume “load everything.”
- **Dead / half-wired features** — Hypno Vision, Afterglow, VerseFlipper, Apple login, several helpers.
- **Accessibility largely absent** — clickable `div`s, missing ARIA, no MediaSession, viewport blocks zoom.

### Biggest risks

1. **Security (critical).** No `firestore.rules` / `storage.rules` on `main`. Client code mutates shared `tracks` docs. Admin CRUD is only gated by a hardcoded UID in JS — and mobile nav shows Admin to **every** user. Scripts commit **live Discogs/Last.fm API keys**. Verify and harden production rules immediately.
2. **Scalability wall.** `getDocs(all tracks)` + in-memory search/recs degrade linearly. Fine at ~100 tracks; painful by ~1k; broken beyond that.
3. **Maintainability wall.** One file + duplicated layouts make every change risky (evident in the “syntax and rebuild” commit streak).
4. **Silent runtime bugs.** Undefined `suggestions` in SearchScreen; `DeepCutsCard` references unbound `tracks` — both can throw when those UI paths render.

> **Note:** Branch `cursor/architecture-review-819a` already prototypes several fixes (engine extract, rules, CI, MediaSession, PWA, a11y). This review is of **current `main`**, which does **not** include that work. Treat that branch as optional prior art, not shipped reality.

---

## 2. Architecture Review

### 2.1 Folder structure

```
/
├── src/
│   ├── App.jsx              # 3,945 lines — UI + engine + admin + styles
│   ├── App.js               # re-export shim → App.jsx
│   ├── App.css              # effectively unused (“styles in App.jsx”)
│   ├── index.js / index.css
│   ├── firebase.js          # Firebase init (web config committed)
│   ├── useAuth.js           # auth + profile bootstrap
│   ├── useUserData.js       # like / play / genres / settings writes
│   ├── App.test.js          # CRA boilerplate (“learn react”) — will fail
│   ├── v-logo-new.png       # used (~124 KB)
│   └── v-logo.png           # unused (~51 KB)
├── public/                  # index.html, favicon1.ico, default CRA manifest
├── build/                   # COMMITTED production output (should not be in VCS)
├── upload-tracks.js         # Admin SDK bulk uploader
├── build-crate-from-playlist.py / fix_genres.py / find_missing_covers.py / …
├── firebase.json / .firebaserc
├── package.json             # CRA + firebase; typescript listed but unused
└── README.md                # unmodified CRA boilerplate
```

**Findings**

- No `components/`, `hooks/`, `lib/`, `screens/`, `styles/`, or `services/` on `main`.
- Ingest scripts live at repo root with **hardcoded Windows paths** (`C:\Users\lpgut\...`) and secrets in source.
- `build/` is the Firebase Hosting root and is hand-committed — source and deploy artifact can drift.
- README does not document setup, data model, env vars, or deploy.

### 2.2 Tech stack

| Layer | Choice | Assessment |
|---|---|---|
| UI | React 18.3 (hooks) | Fine; no routing library |
| Build | `react-scripts` 5 (CRA) | **Unmaintained**; poor code-splitting story |
| Language | JSX; `typescript` in `devDependencies` unused | Dead dependency |
| State | Local `useState` / `useRef` in `App()` | No context/store; refs mirror state for audio closures |
| Styling | Inline objects + JS-injected `<style>` | No design tokens / CSS modules / Tailwind |
| Backend | Firebase Auth + Firestore + Storage | No Cloud Functions |
| Hosting | Firebase Hosting SPA rewrite | Deploys `build/` |
| Ingest | Node Admin SDK + Python (mutagen, Discogs, etc.) | Manual, machine-local |

Compared to modern music-streaming practice (CDN audio with signed URLs, edge/search indexes, server-side ranking, gapless Web Audio, observability), this is a **client-computed catalog app** — excellent for a curated crate, not for a large public catalog.

### 2.3 Data flow

```
Firebase Auth ──► useAuth() ──► { firebaseUser, profile }
                                     │
Firestore users/{uid} ◄────────────────┘
  fields: likedTracks, recentTracks, genres, playlists, settings, …

App mount ──► getDocs(tracks orderBy createdAt desc)   ← entire catalog
          └─► computeSignalTraits(all)                 ← O(n) in memory
          └─► merge liked flags from profile

Playback ──► HTML5 Audio ×2 (crossfade)
         └─► recordPlay → users.recentTracks + tracks.playCount++
         └─► toggleLike → users.likedTracks ± + tracks.likeCount±
         └─► skip → tracks.skipCount++
         └─► optional sessions/{id} flush

Search / Recs / Radio ──► pure client filters over in-memory array
```

No server ranking, no pagination, no aggregation pipeline. Popularity counters are **client-mutated on shared documents**.

### 2.4 API design

- There is **no API layer**. UI calls the Firebase SDK directly (including dynamic `import("firebase/firestore")` inside handlers).
- Collection names and document shapes are implicit; fields defaulted ad hoc (`energy || 5`, `duration || 0`).
- No Cloud Functions → no safe place for privileged writes (counters, admin ingest, signed URL minting).

### 2.5 State management

- Almost all state lives in `App()`: screen, tracks, player, queue, radio flag, playlists, toasts, admin edit state, Aura signal state, plus ~10 refs for audio listeners.
- **Prop drilling** everywhere (`playlistCtx`, `onLike`, `currentTrack`, …). `PlaylistCtx` is a plain object constant, not React Context — dead scaffolding.
- Navigation is `useState("home")` — **no router**, no deep links, no browser back, no shareable URLs.
- Refs mirroring React state (`tracksRef`, `currentRef`, `isRadioModeRef`) are a valid stale-closure fix, but signal that the audio engine should be its own module (reducer / state machine).

### 2.6 Scalability

| Concern | Today | Breaks when… |
|---|---|---|
| Catalog load | Full `getDocs` | Hundreds–thousands of tracks; slow cold start on mobile |
| Search | `Array.filter` substring | Large n; no ranking/typos/faceting |
| Recommendations | O(n) scans + random weighted arrays | Large n; `Array(w).fill(t)` can allocate heavily |
| Counters | Hot docs (`tracks/{id}`) | Many concurrent listeners → contention |
| Playlists | Embedded array on user doc | Large playlists → document size / rewrite cost |
| Audio CDN | Public Storage URLs (`makePublic`) | No signed URLs, no adaptive bitrate, no DRM |
| Bundle | ~660 KB main JS | Slow first paint on mid-tier phones |

**Verdict:** Architecture fits a **personal / boutique crate**. It is not a high-performance streaming architecture yet. The path forward is modularization + rules + Functions for privileged ops + progressive catalog loading — not a premature microservices rewrite.

---

## 3. UX/UI Review

### 3.1 Navigation

- **Mobile:** bottom nav with Home / Drift / Search / Library / Profile / **Admin**. Admin should not be a primary tab for all users; six icons without labels crowd the bar.
- **Desktop:** 72px icon rail + main column + 320px now-playing / up-next panel. Clearer hierarchy than mobile.
- **Drift / Map / Session builder** are powerful but entry points are split (nav vs desktop-only session button). Cognitive load is high for new users.
- No routing → lost state on refresh; cannot deep-link to a track, playlist, or mode.

### 3.2 Player

- Mini bar + expanded now-playing are polished; expanded art + metadata (BPM, Camelot, Aura label) fit the brand.
- Crossfade in radio mode is a signature moment.
- Gaps: no MediaSession (lock screen / headset), no queue history for “previous,” prev always restarts, no volume UI, no gapless non-radio playback, no waveform scrubbing.
- Desktop mini-player and mobile `NowPlayingBar` duplicate similar UI with divergent behavior.

### 3.3 Library

- Favorites screen doubles as Discover / Saved / Genres / Playlists — dense but useful.
- Mood taxonomy (Meditative → Chaotic) is a strong collector/DJ affordance.
- Playlists stored on the user document work for small libraries; no collaborative or public crates.
- Empty states are thin; Discover can feel like a second Home.

### 3.4 Discovery

- Home section budget (max ~4 shelves) is a good constraint.
- V Radio hero is the right focal point.
- “Mixes well with this,” crate shelf, mixtapes, top played — solid for a digger app.
- Half-built ideas (Hypno Vision, Afterglow, VerseFlipper) never surface cleanly → product feels unfinished in places that should feel magical.

### 3.5 Search

- Power operators (`e7`, `120bpm`) are excellent for DJs — under-documented.
- Genre chips are fine; **`suggestions` is referenced but never defined** → runtime crash on empty-query “Try” section.
- No relevance ranking, no recent searches, no artist/album grouping, no Camelot-aware “mix with” despite stub state.

### 3.6 Responsiveness

- Breakpoint at 900px with a phone-column layout on small screens is reasonable.
- Desktop three-column shell is thoughtful.
- `user-scalable=no` + `maximum-scale=1` hurts accessibility and some mobile UX.
- Heavy `backdrop-filter` stacks may jank on low-end Android.

### 3.7 Accessibility

- Most interactive rows are `div` + `onClick` (no keyboard, no roles).
- Icon-only buttons lack `aria-label`s.
- Images often `alt=""`.
- Focus outlines suppressed (`input:focus { outline: none }`).
- No `prefers-reduced-motion` on `main`.
- Emoji as avatar / profile image is not accessible naming.

### 3.8 Consistency

- Brand naming drifts: Crate / V Music / Verse / cratedigger.uk / Deep Cuts.
- Login is dark glass; main app is light glass — intentional split, but tokens aren’t shared.
- Style constants (`APP_STYLE`, `INPUT_ST`, `BTN_*`) exist but hundreds of one-off inline styles still diverge (radii, opacities, grays).
- Unused `VerseFlipper` vs used `CrateShelf` suggests iterative UI experiments left in place.

---

## 4. Performance Review

### 4.1 Rendering

- `App` owns catalog + player; many child updates re-render large trees. No memoization strategy (and CRA has no React Compiler).
- Home and Library recompute sorts/filters every render (mood maps, genre maps, top tracks).
- Desktop and mobile trees **duplicate** screen components → double maintenance and risk of divergent mounts.

### 4.2 Network requests

- One full catalog fetch on mount (good for small n; bad for large n).
- Every play / like / skip hits Firestore (acceptable; no batching/debounce for rapid skips).
- Audio/covers are direct public Storage URLs — simple, but no range-aware player strategy beyond browser defaults.
- No prefetch of “next” audio outside the crossfade path (crossfade does preload the next clip — good).

### 4.3 Caching

- No service worker / offline cache on `main`.
- No IndexedDB / local catalog cache.
- Storage upload script sets long `cacheControl` on objects (good for CDN caching of audio/art).
- Profile/playlists always live-read; no stale-while-revalidate pattern.

### 4.4 Bundle size

- Production main JS ≈ **660 KB** (single chunk; only a tiny CRA leftover chunk).
- Logo PNG (~124 KB) is bundled into JS via webpack import.
- No route-based `React.lazy`, no admin code-splitting (admin ships to every user).
- CRA limits modern chunking / CSS extraction of the injected mega-style block.

### 4.5 Database efficiency

- `orderBy("createdAt","desc")` full scan of collection.
- Client increments on popular tracks create hot documents.
- Playlists as arrays on `users/{uid}` rewrite the whole array per change.
- Sessions `addDoc` is fine; no retention/aggregation job.
- Aura `computeSignalTraits` uses global play/skip/like counts — not per-user — so “personality” is partly global popularity in disguise.

### 4.6 Lazy-loading opportunities

1. Split Admin, Drift, Harmonic Map, Route Builder behind `React.lazy`.
2. Paginate / window catalog (`limit` + cursor, or Algolia/Typesense for search).
3. Lazy-load cover images (native `loading="lazy"` / blur-up).
4. Defer Aura enrichment until after first paint.
5. Don’t ship Python/Node ingest or admin UI in the listener bundle.

---

## 5. Code Quality Review

### 5.1 Duplicate logic

- Mobile `innerApp` vs desktop main column: near-duplicate screen switches and player chrome.
- CSV parsing duplicated (`upload-tracks.js` vs AdminScreen `parseCSVLine`).
- Time-of-day energy + greeting + gradient logic repeated in multiple components.
- Glass card style objects copied dozens of times instead of a primitive.

### 5.2 Dead / half-wired code

| Item | Status |
|---|---|
| `VerseFlipper` | Defined, never rendered |
| `AfterglowOverlay` / `setAfterglow` | Render gated; never set non-null |
| `HypnoVisionOverlay` / `setResonanceTrack` | Never opened; `playlistCtx.onResonance` not provided |
| `getRecentGenres`, `wasPlayedRecently`, `buildRoute` | Defined unused (route UI uses `buildSession`) |
| `signInWithApple` | In `useAuth`, not in LoginScreen |
| `v-logo.png`, `App.css` | Unused |
| `PlaylistCtx` constant | Not real Context |
| Search `mixWith` / `mixResults` | Stubbed empty |
| Afterglow save playlist | `/* TODO: add tracks */` |

### 5.3 Naming

- Product: Crate / V Music / Verse / Deep Cuts / Aura / Hypno Vision — evocative but inconsistent.
- `_signal` / Aura / “human state” / `signalLabel` — internal jargon leaks into UI without a glossary.
- `FavoritesScreen` is really Library + Discover.
- Camelot helper compares **numeric wheel position only**, ignoring A/B (minor/major) mode — naming implies full Camelot compatibility it doesn’t fully implement.

### 5.4 Component organization

- ~30 components in one file; root `App` is ~900 lines alone.
- Presentational UI, Firestore I/O, and recommendation math are interleaved.
- Prior art on `cursor/architecture-review-819a` (`src/lib/engine.js`, `harmony.js`, theme tokens) shows the right extraction direction.

### 5.5 Reusable patterns worth keeping

- `AlbumArt`, `TrackRow`, `Icon`, shelf components, `EnergyBar`, toast, optimistic like.
- Pure functions: `pickNextTrack`, `buildSession`, `computeHumanState`, `findResonant` — ideal `src/lib/` candidates with unit tests.
- Dual-audio crossfade engine — extract to `src/audio/engine.js`.

### 5.6 Technical debt (priority)

1. Monolith + committed `build/` + CRA.
2. Missing security rules & secret hygiene.
3. Runtime bugs (`suggestions`, `DeepCutsCard`/`tracks`).
4. Admin exposed on mobile; delete is **local-only** (doesn’t delete Firestore doc).
5. `addTrack` in admin uses `id: Date.now()` locally and may not persist audio.
6. `useEffect` for session flush runs every render (missing dependency array) — subtle performance/correctness smell.
7. Weighted picker `Array(w).fill(t)` — correctness OK for small weights, poor under load.
8. No Error Boundary on `main` → white screen on throw.

---

## 6. Security Review

### 6.1 Authentication

- Firebase Auth is appropriate; password reset and OTP flows exist.
- Profile created on first sign-in; `onboarded` flag exists but no onboarding gate in UI.
- Apple provider implemented server-side in hook but unused in UI.
- Session is Firebase-managed; no custom token path.

### 6.2 Authorization

- **Admin UID hardcoded** in client: `5lPAI9N1jkMbVkUyIqLTqBvBf1t1`.
- Desktop hides Admin behind that check; **mobile BottomNav always includes Admin** — any user can open AdminScreen and attempt CSV import / track edits.
- Track delete in Admin updates local state only — inconsistent, but import/edit call Firestore directly from the client.

### 6.3 API protection

- **No `firestore.rules` or `storage.rules` in `main`.** Production may be open, locked, or unknown — must be verified in Firebase Console and checked into the repo.
- Clients write `playCount` / `skipCount` / `likeCount` on shared track docs → trivial to inflate/deflate metrics if rules allow.
- Audio/cover URLs are made **public** by the uploader (`makePublic()`).

### 6.4 Secrets

| Secret | Location | Risk |
|---|---|---|
| Firebase web config | `src/firebase.js` | Expected for client apps; still should prefer env build-time injection |
| `serviceAccountKey.json` | gitignored (good) | Required locally for upload script |
| **Discogs token** | Hardcoded in `fix_genres.py` | **Rotate immediately** |
| **Last.fm API key** | Hardcoded in `fix_genres.py` | **Rotate / move to env** |
| Firebase Hosting token in agent remotes | CI/agent context | Ensure no long-lived PATs in git |

### 6.5 Validation

- Little schema validation on writes; CSV import trusts columns.
- Energy/BPM parsed with `parseInt` fallbacks; Camelot batch-assign invents keys from BPM heuristics (data quality risk more than security).
- Phone OTP relies on Firebase reCAPTCHA — good — but container cleanup is manual/global on `window`.

### 6.6 Common vulnerabilities

| Issue | Severity |
|---|---|
| Missing / unverified Firestore & Storage rules | **Critical** |
| Client-side admin + privileged writes | **High** |
| Committed third-party API keys | **High** |
| Public audio URLs (hotlinking / scraping) | Medium (acceptable for public catalog; bad for licensed exclusives) |
| Metric tampering via counter fields | Medium–High |
| XSS | Relatively low (React escapes text); URL fields for covers/audio could be abused if rendered unsafely later |
| Dependency / CRA age | Medium (unmaintained toolchain) |
| `user-scalable=no` | a11y, not classic vuln |

**Immediate actions (before feature work):** confirm live rules → commit rules → rotate leaked API keys → hide Admin on mobile → move counter increments to Cloud Functions (or tightly scoped rules).

---

## 7. Missing Features

Ranked by impact for the stated audience (collectors, DJs, audiophiles, producers, everyday listeners):

| Rank | Feature | Why it matters |
|---|---|---|
| 1 | **Security rules + admin hardening** | Without this, nothing else is safe to grow |
| 2 | **MediaSession + reliable background/lock-screen playback** | Table stakes for a phone music app |
| 3 | **Modular architecture + tests for the rec engine** | Protects the product’s unique IP |
| 4 | **Previous-track history + real queue management** | Core listening UX gap |
| 5 | **Deep links / routing** | Share a track, crate, session, or Drift state |
| 6 | **Catalog pagination + real search** | Required before library growth |
| 7 | **Wire or cut Hypno Vision / Afterglow / Apple login** | Finish the magic or delete the weight |
| 8 | **PWA install + offline for saved/recent** | “Crate in your pocket” expectation |
| 9 | **Per-user Taste model** (not global counters) | Makes Aura personal |
| 10 | **Gapless / Web Audio engine** | Audiophile & DJ transition quality |
| 11 | **Collaborative / shareable crates** | Social digger behavior |
| 12 | **High-res / lossless optional path + honest quality meter** | Audiophile trust |
| 13 | **Producer tools** (cue points, stems later, key/BPM confidence) | Differentiator vs Spotify |
| 14 | **Onboarding genre/crate picker** | Uses existing `onboarded` field |
| 15 | **Observability** (errors, play success rate, Core Web Vitals) | Operate like a product |

---

## 8. Improvement Roadmap

**Principles for when implementation starts (per your brief):** small commits; never break listening; leave the codebase simpler; clean architecture over cleverness; do not chase Spotify feature parity — deepen the digger/DJ/audiophile experience.

Effort labels are relative engineering effort (not calendar estimates).

---

### Phase 1 — Quick Wins

Ship safety, stop the bleeding, fix crashes. Prefer docs/rules/bugs over refactors.

| # | Recommendation | Why it matters | Expected impact | Effort | Dependencies |
|---|---|---|---|---|---|
| 1.1 | **Verify & commit Firestore + Storage security rules**; deploy them | Prevents data loss / abuse | Critical risk removed | S | Firebase project access |
| 1.2 | **Rotate Discogs/Last.fm keys**; move to env; scrub git history if needed | Secrets are live in repo | Stops key abuse | S | Provider dashboards |
| 1.3 | **Hide Admin on mobile** (same UID / custom claim check as desktop) | Stops casual privilege probing | High security UX | XS | None |
| 1.4 | **Fix Search `suggestions` crash** (define list or remove block) | Empty search can white-screen | Stability | XS | None |
| 1.5 | **Fix `DeepCutsCard` unbound `tracks`** (pass prop or remove preview) | Radio idle state can throw | Stability | XS | None |
| 1.6 | **Add Error Boundary** | Friendly recovery vs blank page | Reliability | S | None |
| 1.7 | **Stop committing `build/`**; add to `.gitignore`; CI/CD deploy | Ends source/artifact drift | DX + correctness | S | Hosting deploy pipeline |
| 1.8 | **Replace README** with real setup (Node version, Firebase, ingest) | New contributors (and future you) unblocked | DX | S | None |
| 1.9 | **Gate Admin writes** with custom claims or remove client CSV create until rules land | Defense in depth | Security | S | 1.1 |
| 1.10 | **Delete or quarantine dead UI** (VerseFlipper) / mark TODOs | Reduces noise before bigger splits | Maintainability | XS | None |

---

### Phase 2 — Major Improvements

Make the app maintainable, testable, and phone-grade without rewriting the product.

| # | Recommendation | Why it matters | Expected impact | Effort | Dependencies |
|---|---|---|---|---|---|
| 2.1 | **Extract `src/lib/engine.js` + `harmony.js`** (pickNext, session, Aura, Camelot) + unit tests | Protects crown-jewel logic | Confidence to change recs | M | None |
| 2.2 | **Extract audio engine** (dual players, crossfade, play/pause/seek) | Isolates hardest imperative code | Fewer playback bugs | M | 2.1 helpful |
| 2.3 | **Design tokens + primitives** (`GlassSurface`, `Button`, `TrackRow`) | Consistency without restyling by hunting 4k lines | UX coherence | M | None |
| 2.4 | **Split screens into `src/screens/*` + `src/components/*`** | Ends monolith tax | Velocity | L | 2.1–2.3 ideal first |
| 2.5 | **React Router (or hash routes)** for screens + track deep links | Shareability + back button | Product feel | M | 2.4 |
| 2.6 | **Collapse mobile/desktop duplication** into one composition with layout shells | One behavior everywhere | Maintainability | M | 2.4–2.5 |
| 2.7 | **MediaSession** metadata + play/pause/next/prev | Lock screen / headset | Perceived quality | S–M | 2.2 |
| 2.8 | **Previous-track stack** + visible queue editor | Fixes broken “prev” mental model | Core UX | S–M | 2.2 |
| 2.9 | **Cloud Functions for counter increments** (play/like/skip) | Stops metric tampering; simplifies rules | Integrity | M | 1.1 |
| 2.10 | **Admin via custom claims** + server-side ingest only | Real authorization | Security | M | 1.1, Functions |
| 2.11 | **CI**: test + build on PR; drop unused TypeScript dep or adopt TS gradually | Quality gate | Regression safety | S | 2.1 tests |
| 2.12 | **Fix Camelot A/B handling**; surface key confidence | Harmonic mixing correctness | DJ trust | S | 2.1 |
| 2.13 | **a11y pass**: roles, labels, focus rings, reduced motion, scalable viewport | Inclusive + store-quality | Reach | M | 2.3 |
| 2.14 | **Wire or remove** Hypno Vision / Afterglow / Apple login | Finish promise or cut weight | Clarity | S–M | Product call |
| 2.15 | **PWA**: real manifest, icons, service worker for shell + recent audio metadata | Installable crate | Retention | M | Hosting HTTPS |

---

### Phase 3 — World-Class Features

Become the app serious music lovers wish Spotify was — not a Spotify clone.

| # | Recommendation | Why it matters | Expected impact | Effort | Dependencies |
|---|---|---|---|---|---|
| 3.1 | **External search index** (Typesense/Algolia) + faceted digger search (key, BPM, energy, mood) | Scales past in-memory filter | Catalog growth | L | Catalog size pressure |
| 3.2 | **Paginated catalog + smart home shelves via queries/Functions** | Cold start & memory | Scale | L | Data model |
| 3.3 | **Per-user Taste graph** (from sessions, skips, likes, time-of-day) feeding Aura | Personal radio that feels psychic | Differentiation | L | Sessions + 2.1 |
| 3.4 | **Web Audio gapless engine** + optional beat/bar aligned fades | Audiophile/DJ transitions | Signature feel | L | 2.2 |
| 3.5 | **Waveform scrubbing** in expanded player | Signature interaction | Delight | M | Audio decode strategy |
| 3.6 | **Shareable crates & listening routes** (public links, embed) | Social digging | Growth | L | 2.5, rules |
| 3.7 | **Offline saved crate** (licensed/cached subset) | True mobile companion | Retention | L | 2.15, legal |
| 3.8 | **Quality tiers** (AAC/Opus → FLAC where rights allow) + honest UI | Audiophile trust | Premium positioning | L | Storage + rights |
| 3.9 | **DJ tools**: harmonic path planner export (Rekordbox/M3U), cue notes | Pro workflow bridge | Moat | L | Metadata quality |
| 3.10 | **Migrate off CRA** (Vite) when splitting is underway | Modern DX/perf | Build health | M | 2.4 |
| 3.11 | **Producer mode** (private uploads, watermarked shares) later | Expand ICP without losing soul | New revenue | XL | Legal + storage rules |

---

## 9. Vision

**Crate should not become Spotify.** Spotify optimized for infinite lean-back pop inventory and playlist marketing. Crate should optimize for **intention**: the feeling of standing at a record shop wall, headphones on, building a night — whether you’re a DJ warming up, a producer studying transitions, an audiophile chasing a pressing’s ghost, or a listener who just wants the room to feel right.

### What “ultimate” looks like for each audience

- **Collectors** — crates as first-class objects: annotated, cover-forward, provenance-aware, shareable, offline-capable. Discovery by mood, era, label energy — not only “fans also liked.”
- **DJs** — Camelot-true harmonic routing, BPM/energy arcs, session builders that export to the booth, skip/grip analytics that teach what *actually* holds a floor.
- **Audiophiles** — honest quality, gapless playback, beautiful now-playing as a ritual (vinyl presence without skeuomorphic kitsch), quiet UI that doesn’t shout chrome.
- **Producers** — study mode: what precedes/follows a track in real sessions; tonal neighbors; private sketches beside the public crate.
- **Everyday listeners** — one hero action (“start this evening’s radio”), then depth available on demand — never a dashboard of widgets.

### Product north star

> **A beautifully lit late-night listening room in your pocket** — one clear focal point, glass that’s crisp and legible, harmonic intelligence underneath, and motion that only moves when it means something. Ultra-minimal on the surface; quietly deep underneath.

The concept (crates, keys, energy, journeys, Aura) is already unique. The job is to **harden the foundation**, **finish or cut half-built magic**, and **scale the catalog model** without sanding off the digger soul.

---

## Appendix A — Concrete bugs observed on `main`

1. `SearchScreen` maps `suggestions` but **no `suggestions` binding exists** → runtime `ReferenceError` when query is empty.
2. `DeepCutsCard` calls `tracks.filter(...)` though `tracks` is **not a prop** and not in closure → `ReferenceError` on idle radio card path.
3. Mobile `BottomNav` always offers **Admin**.
4. Admin “Delete” removes from local React state only — **does not delete** the Firestore document.
5. Admin “Add Track” may only update local state (no `audioUrl` upload path in UI).
6. `handlePrev` never walks history — always restarts.
7. Session-flush `useEffect` has **no dependency array** (runs every render).
8. Hypno Vision menu calls `ctx.onResonance` but `playlistCtx` never defines it.
9. Default CRA test expects “learn react” — **fails** if run.
10. `manifest.json` still says “Create React App Sample”; `logo192/512` referenced but missing from `public/` on `main`.

## Appendix B — Comparison to modern streaming practice

| Practice | Crate today | Target |
|---|---|---|
| CDN audio + signed URLs | Public GCS URLs | Signed / rule-gated as needed |
| Adaptive bitrate | Single file per track | Optional ladder later |
| Server-side personalization | Client heuristics + global counters | Per-user taste + Functions |
| Search | In-memory substring | Indexed faceted search |
| Client architecture | Single SPA file | Modular screens + audio module |
| Observability | `console.error` / web-vitals unused | Error reporting + funnels |
| Offline / PWA | Not on `main` | Installable + saved crate |
| Secure multi-tenant data | Rules not in repo | Least-privilege rules + claims |

## Appendix C — Approval gate

**No application code changes have been made in this pass.** Only this review document is proposed for merge as documentation.

When you approve a phase (or a subset of numbered items), implementation should proceed in small commits on a feature branch, keeping playback working after every step, and preferring deletion/simplification over clever abstraction.

---

*Reviewed against `main` @ `350bbf6`. Prior experimental work exists on `origin/cursor/architecture-review-819a` and may accelerate Phase 1–2 if you choose to cherry-pick — but it is not the baseline of this review.*
