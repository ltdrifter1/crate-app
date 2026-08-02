# PlanetMP3 — Full Product & UX Audit

*Frontend-only audit. No recommendation touches backend logic, APIs, auth, the recommendation engine, Firestore schema, the audio/crossfade engine, subscriptions, or payments. Everything below is UX, interaction design, visual design, information architecture, accessibility, and frontend performance.*

*Benchmarked against the principles (not the pixels) of Apple Music, Spotify, Linear, Raycast, Teenage Engineering, Arc, A24, Are.na, Notion, and Nothing: one opinionated aesthetic, ruthless reduction, motion in service of orientation, keyboard-first power paths, and states (empty/loading/error) treated as first-class design surfaces.*

---

## 1. Executive Summary — Top 15 Highest-Impact Improvements

| # | Improvement | Impact | Where |
|---|---|---|---|
| 1 | **Global keyboard shortcuts** (Space play/pause, ←/→ seek, ↑/↓ volume, M mute, L like, Q queue, / focus search) | High | `App.jsx` root — only per-row Enter/Space exists today (`App.jsx:1542`) |
| 2 | **Resume last session** ("Continue listening" — restore last track, position, and pool on launch) | High | Player state is never persisted; every launch is a cold start |
| 3 | **Slim the mobile mini-dock** — 9 tap targets in a 64px row (`GlassDock`, `App.jsx:4638–4669`), most ~24px. Keep art/title, like, play; move the rest to the immersive player | High | `GlassDock` |
| 4 | **Playlist ("Stack") editing basics**: rename, reorder (drag on desktop, handles on mobile), remove-from-stack inline, delete confirmation + undo toast | High | `FavoritesScreen`, `App.jsx:3370–3378` deletes with zero confirmation |
| 5 | **Queue management**: remove and reorder items in `QueueSheet` (`App.jsx:2562`) and the desktop sidebar queue | High | Queue is view-only today |
| 6 | **Stop re-rendering the whole app every second** — `setProgress` lives in the root `App` (`App.jsx:5314`) and cascades through every screen. Isolate progress into the transport components (context or store like the existing `playerEnergyStore`) | High | Perf/scroll smoothness |
| 7 | **Memoize search + entity derivation** — `searchResults` (`App.jsx:5888`) and `searchEntities` → `buildArtists`/`buildAlbums` (`catalog.js:154`) rebuild the entire catalog aggregation on every keystroke *and every unrelated render* | High | Search feels slower as the catalog grows |
| 8 | **Ranked, typo-tolerant search** — today it's unranked `String.includes` (`App.jsx:5904–5909`). Add prefix > word-start > substring scoring, diacritic folding, and recent searches | High | Search |
| 9 | **Surface volume, shuffle, repeat** — all three are buried in the "···" overflow of the immersive player (`App.jsx:2283–2354`). Put shuffle/repeat on the transport row; give desktop a persistent volume slider | High | `ImmersivePlayer`, desktop shell |
| 10 | **Code-split heavy, rarely-used screens** — `AdminScreen` (~600 lines), `MixScreen`, `PaywallScreen`, onboarding ship in the single bundle inside a 7,000-line `App.jsx`. `React.lazy` these + extract components into files | High | Initial load |
| 11 | **Raise micro-type + contrast floor** — 9–11px mono uppercase labels in `#9AA1AB` on `#E6E9EF` (≈2.6:1) appear throughout (BoothHud, shelf reasons, dock labels). Set a 11px/4.5:1 floor | High | Accessibility |
| 12 | **URL-address playlists and browse states** — opening a Stack is local state (`openPlaylistId`, `App.jsx:3324`); back button and deep links don't work for the most personal object in the app | Medium | Routing (`lib/routes.js` already exists — extend it) |
| 13 | **One transport, not two** — on Home the dock player hides and the CoverStage hero owns playback (`hideDockPlayer`, `App.jsx:6117`); everywhere else the dock owns it. Keep the hero as *display*, keep the dock as the single always-present transport | Medium | Home / dock |
| 14 | **Add-to-stack flow from the player and rows** with instant feedback ("Filed to Late Nights — View") instead of burying it in ⋯ context menus only | Medium | `TrackActionsMenu` |
| 15 | **`loading="lazy" decoding="async"` + sized image variants for artwork** — `AlbumArt` (`App.jsx:380`) loads full-size covers eagerly everywhere, including 40px thumbnails | Medium | Artwork pipeline (frontend attrs are a 10-min win) |

## 2. Overall Product Score: **72 / 100**

**Why it's high:** this is *not* a generic music app. The platinum/early-iTunes design language is genuinely distinctive and consistently executed (`theme.js` is a real token system with a written point of view). Motion has documented principles (`motion/tokens.js:54`). Brand voice ("cuts," "stacks," "crate," "on air") is coherent from empty states to liner notes. Reduced motion *and* reduced transparency are handled (`App.jsx:262–271`). Media Session, iOS audio unlock, safe-area insets, crossfade — the hard plumbing is done and done carefully.

**Why it's not higher:** the craft is concentrated in *look and feel*; *control* lags. Long-session ergonomics (keyboard, queue editing, volume access, resume) are missing; playlists are administrative rather than joyful; search is a filter, not a ranking; and architecture choices (root-level per-second re-renders, one 7k-line file, no code splitting) will erode the perceived polish as the catalog grows.

| Category | Score |
|---|---|
| Visual design & identity | 88 |
| Motion | 82 |
| Trust & polish (states, feedback) | 74 |
| Home & discovery | 74 |
| Player experience | 68 |
| Navigation & IA | 68 |
| Accessibility | 62 |
| Search | 58 |
| Playlist experience | 55 |
| Performance headroom | 58 |

---

## 3. UX Audit (First Impression, Ease of Use, Delight)

### Strengths
- **First impression is strong.** Login → genre-taste onboarding → a Home hero that starts music with one press. The "one big obvious play" (CoverStage orb) answers "where do I begin listening" immediately.
- **Explained recommendations.** `lib/explain.js` reasons appear under shelf tiles — the Spotify-grade trust move most apps skip.
- **Empty states have voice**: "Nothing on the shelf" (`App.jsx:3184`), "Stack's empty — press ⋯ to file cuts" (`App.jsx:3381`), "Nothing in the crate for query" (`App.jsx:3269`). Excellent.

### Issues

| Issue | Why it weakens the experience | Impact | Recommendation |
|---|---|---|---|
| No session resume | A returning listener starts from zero every time; kills the "pick up where I left off" habit loop that drives daily use | **High** | Persist `{trackId, position, poolContext, isRadioMode}` to `localStorage` (prefix helper already exists: `brandStoragePrefix()`); on launch show the dock player paused at position with a "Resume" affordance. No autoplay (browser policy anyway). |
| Vocabulary tax | "Stacks," "cuts," "On air," "Near this," "Booth," "Mixtape Club" are charming but *never glossed*. New users must decode 6 proprietary nouns before feeling competent | **Medium** | Keep the vocabulary (it's the identity), but gloss on first exposure: subtitle "Stacks — your playlists" the first time Library renders; a one-time tooltip on "Near this." One line each, dismissed forever. |
| Feedback asymmetry | Like/file-to-stack actions succeed silently in most surfaces; the toast (`ToastEl`, `App.jsx:4781`) exists but is used sparsely | **Medium** | Toast every mutating action with the object name and an action link: "Filed to *Late Nights* — Open". |
| Admin tab visible in main nav for admin user | Mixes operator tooling into the consumer IA; also `ADMIN_UID` is a hardcoded client constant (`theme.js:226`) | **Low** | Move Admin behind the profile screen rather than a top-level tab. (Leave the auth mechanism alone — flagged as smell only.) |

## 4. Information Architecture Audit

Current model: 4 tabs — **Home / Library / Search / Club** — plus stateful sub-screens (artist, album, mix) parsed via `lib/routes.js`.

- **The 4-tab model is right.** Don't add tabs. It matches the "fewer, better" principle from Linear/Arc.
- **Browse lives inside Search's empty state** (`GenreSceneBrowse` renders only when `!query`, `App.jsx:3281`). This is actually a good consolidation (Spotify does the same) but it's undiscoverable from Home. **Fix:** add a small "Browse the crate →" link in Home's last section pointing to Search-with-no-query. *Medium.*
- **Stacks aren't URLs.** `openPlaylistId` is component state (`App.jsx:3324`), so back gestures exit the whole Library, and stacks can't be linked. Artist/album/mix already have paths — extend `lib/routes.js` with `/stack/:id`. *Medium-High.*
- **Two content hierarchies for the same thing:** the Community Mix appears as a banner on Home *and* Library *and* a Club link. Once is enough (Home), twice is tolerable; three placements reads as promotion, which erodes trust. *Low.*
- **Breadcrumbs:** back labels are inconsistent — "‹ Library" (`App.jsx:3350`), "‹ Genres" (`GenreSceneBrowse.jsx:46`), chevron-"Back" in the player (`App.jsx:2274`). Standardize on `‹ {Parent name}`. *Low.*

## 5. Music Discovery Audit

### Strengths
- The energy/BPM/Camelot engine is a real differentiator; "Near this" (similar-track radio) and the harmonic map are features Spotify doesn't have.
- Genre lanes with editorial one-liners (`genreStory`) and "Listen in this lane" (`GenreSceneBrowse.jsx:97`) turn browsing into listening in one tap — exactly right.
- Power-user search grammar (`e7`, `120bpm` — `App.jsx:5892–5902`) is a delightful Raycast-style touch.

### Issues

| Issue | Impact | Recommendation |
|---|---|---|
| The power grammar is invisible | **Medium** | Show hint chips under the empty search field: `energy 7` · `124 bpm` · `8A`. Tap inserts the query. ~20 lines. |
| No Camelot browsing surface | **Medium** | The data and `camelotCompatible` (`lib/harmony.js`) exist. Add a "Keys" row to `GenreSceneBrowse`: 12 wheel-position chips → compatible-key pool. DJ users will love this; it's a marquee differentiator. |
| Similar-artist navigation dead-ends | **Medium** | `ArtistPage` shows the artist's own tracks/albums but no lateral moves. Add "Near this artist" (same top genre, adjacent avg energy — all computable from `buildArtists`). |
| BPM number queries hijack | **Low** | `"99"` matches the BPM branch (`App.jsx:5898`) before title search — a track called "99 Problems" is unfindable by number. Run both branches and *rank* BPM matches under a labeled "Around 99 BPM" section instead of returning early. |
| Recommendation reasons are inconsistent | **Low** | Reasons show on `CoverShelf` when `reasons` is passed but most shelves pass none. Pass reasons wherever `recommendedPicks` supplies them. |

## 6. Player Experience Audit

### Strengths
- The immersive player (`App.jsx:2194`) is beautiful: full-bleed sleeve, jewel-case float animation, tasteful metadata line, session-arc sparkline, artist name is a link.
- Crossfade with A/B elements + iOS unlock + Media Session handlers (`App.jsx:5679–5698`) — genuinely hard plumbing, done right. Lock-screen controls work.
- iOS interruption sync (`onPause`/`onPlay` listeners, `App.jsx:5345–5352`) shows real care.

### Issues

| Issue | Why it hurts | Impact | Recommendation |
|---|---|---|---|
| **No keyboard control at all** | Desktop users can't pause without a click; disqualifying for "hours of use" and for accessibility | **High** | One `keydown` listener at App root (skip when `e.target` is input/textarea/contentEditable): Space toggle, ←/→ ±10s, ↑/↓ volume, M mute, L like, Q queue, F immersive, / focus search, Esc close overlays. Show a `?` shortcut sheet. |
| Volume buried in overflow menu | Adjusting volume — the most common act after play/pause — takes 3 taps (`App.jsx:2345–2353`) | **High** | Mobile: rely on hardware buttons but add a slider directly on the immersive transport. Desktop: persistent slider in the dock/right column. Add mute toggle. |
| Shuffle/repeat hidden + stateless glance | In the "···" menu (`App.jsx:2308–2323`); no way to see repeat state without opening it | **High** | Move to the transport row as icon toggles with accent-tint active state; keep crossfade in overflow (it's a set-and-forget). |
| Two transports (hero vs dock) | On Home the dock player disappears (`hideDockPlayer`, `App.jsx:6117`) and playback moves into the CoverStage; muscle memory breaks every time you change tabs | **Medium** | Always render the dock player when a track exists. Let the CoverStage mirror state (big art, play state) without being the only transport. |
| Progress bar is a native range with 1s steps and no buffer indication | Seek feels coarse; no sense of loading on slow networks | **Medium** | Keep `<input type=range>` (accessible) but style a buffered-ranges track underlay from `audio.buffered`; step `0.1`; add a time-preview bubble on drag. |
| Queue tap = immediate play, no remove/reorder | `QueueSheet` (`App.jsx:2609`) offers only Play; mistaps destroy your place | **High** | Add per-row ⋯ (Play next / Remove); drag handles for manual queues; "swipe to remove" on mobile. |
| Mini-dock control density | 9 controls at ~24px targets (`App.jsx:4638–4669`); like/queue/more/energy×2/prev/play/next; WCAG target minimum is 24px, comfortable is 44px | **High** | Mobile: art + titles + like + play (+ swipe-left/right on the row for prev/next). Everything else lives one tap away in the immersive player. Desktop can keep the full row. |
| No fullscreen/desktop "theater" | The immersive player is phone-proportioned on desktop | **Low** | Add a two-column desktop layout (art left, queue right) — mostly CSS. |

## 7. Playlist ("Stacks") Experience Audit

This is the weakest area of the product. Creation is a name-only inline input (`App.jsx:3580–3615`); after that, everything is administrative.

| Gap | Impact | Recommendation |
|---|---|---|
| No rename, no reorder, no remove-inline | **High** | Stack detail: title becomes editable on tap; rows get drag handles (desktop DnD + mobile long-press) and a remove action visible on hover/swipe. Order is just an array write the app already controls. |
| Delete is instant and irreversible (`App.jsx:3373`) | **High** | Confirm sheet + 6s undo toast (keep the deleted object in memory until the toast expires). |
| Adding tracks is hidden in ⋯ menus | **High** | In stack detail add "Add cuts" → search-in-place picker with one-tap add. Also surface "File to stack" in the immersive player. |
| Mosaic artwork only appears at 2+ covers | **Low** | Good foundation (`App.jsx:3476`); generate a branded color-field placeholder from the stack name for empty stacks instead of a lone letter. |
| Creation feels like a form | **Medium** | On create, deep-link straight into the new stack with the add-cuts picker open — "name it, fill it" in one flow. Delight beats admin. |
| Sharing exists but is quiet | **Low** | After `shareOrCopy` succeeds, toast "Link copied — anyone in the club can open it." |

*Collaborative editing would require backend changes — out of scope; not recommended here.*

## 8. Search Audit

- **Unranked substring filter** (`App.jsx:5904–5909`): a query "no" returns every title containing "no" in catalog order. **Rank:** exact > title-prefix > word-start > artist > album > genre substring; boost liked/recently played. Pure frontend, ~40 lines. *High.*
- **No typo tolerance.** Add diacritic folding (reuse `slugify`'s NFKD trick, `catalog.js:7`) and a cheap adjacency: also match when one token is within edit distance 1 for tokens ≥5 chars. *Medium.*
- **Recomputed on every render, not just query changes** — `searchResults` is an IIFE in the component body (`App.jsx:5888`), and `searchEntities` rebuilds *all* artists+albums per keystroke (`catalog.js:157–166`). `useMemo` the results on `[tracks, searchQuery]`, and memoize `buildArtists`/`buildAlbums` on `tracks`. *High (perf).*
- **No recent searches / no zero-query suggestions beyond genres.** Store last 8 queries in localStorage; render as chips above `GenreSceneBrowse`. *Medium.*
- **No keyboard navigation of results** (↑/↓ + Enter to play, Cmd+Enter to queue). *Medium.*
- **`autoFocus` on the search input** (`App.jsx:3214`) pops the keyboard instantly on mobile tab-switch, covering the browse content that is the tab's best feature. Only autofocus on desktop. *Medium.*
- Results render *all* matches as full `TrackRow`s — cap visible results (e.g. 50 + "Show all") or virtualize. *Medium.*

## 9. Navigation Audit

- **Dock (mobile)** is well-crafted: animated active indicator (`App.jsx:4691`), `aria-current`, labels + icons. Keep.
- **Desktop sidebar** (`App.jsx:6242`): clean source-list. But `NAV_BOTTOM` is empty scaffolding and user's Stacks aren't listed — a desktop source list *wants* pinned playlists (iTunes memory the theme explicitly invokes). Add a "Stacks" group with the user's playlists. *Medium.*
- **Active-state mapping**: artist/album highlight the Search tab (`App.jsx:4542–4544`) even when reached from Home shelves — mild disorientation. Track the originating tab. *Low.*
- **Tab indicator doesn't recompute on resize/font-load** (`App.jsx:4547` effect deps) — indicator drifts after rotation. Add a resize observer. *Low.*
- **Scroll position is lost between tabs** — switching Home → Search → Home returns to top. Cache `scrollTop` per tab. *Medium.*

## 10. Visual Design Audit

The strongest area. `theme.js` is a real design system with taste: platinum palette, one accent, jewel-case shadows, glass tokens, documented intent comments.

| Issue | Impact | Recommendation |
|---|---|---|
| Micro-type below legibility floor: 9px (`App.jsx:2369`), 10px (`App.jsx:2346, 4737`) mono uppercase in `faint` gray | **High** | Floor at 11px; bump `faint` usage on canvas to `muted` (#6B7380, ~4.9:1). Letterspaced caps *feel* smaller — compensate. |
| Type scale is ad hoc — 9, 10, 11, 12, 12.5, 13, 14, 15, 16, 17, 20, 22, 28 all appear | **Medium** | Add `text = {micro:11, caption:12, body:14, emphasis:15, title:17, heading:22, display:28}` to `theme.js`; migrate opportunistically. |
| Radius values bypass tokens — literal `14`, `24`, `980`, `borderRadius: 6` alongside `radius.*` | **Low** | Use `radius.*` + a `radius.pill` token. |
| Buttons: at least 5 one-off pill/chip styles (`chromeBtn` `App.jsx:2217`, `BTN_SECONDARY` variants, inline chips) | **Medium** | Extract `Button` with `variant={primary|glass|ghost|pill}` — consistency compounds everywhere. |
| The letter-monogram artwork fallback (`App.jsx:371`) is solid; the immersive fallback uses a *different* single-letter design (`App.jsx:2420`) | **Low** | Unify on the two-letter monogram. |
| Loading: one global "Pulling records from the shelf…" spinner (`App.jsx:6124`) then full content pop | **Medium** | Skeleton shelves (art-sized shimmer tiles — `shimmer` keyframes already exist, `App.jsx:120`) so the layout is stable and load feels faster. |
| `!important` hover hacks in injected CSS (`App.jsx:207–222`) fighting inline styles | **Low** | Symptom of styling-in-JS-without-classes; when extracting components, move hoverable surfaces to classes. |

## 11. Motion & Interaction Audit

- **Principles exist and are honored** ("Rhythm over bounce," `motion/tokens.js:54`). Durations/easings are consistent. Rare and admirable.
- **Reduced motion**: global kill-switch (`App.jsx:262`, duplicated in `index.css:34`). Works, though it also kills opacity fades — consider allowing pure-opacity transitions ≤200ms for orientation. *Low.*
- **`coverFloat` idle bobbing** on the playing sleeve (`App.jsx:2403`) runs forever; infinite ambient motion on the *content* (not chrome) can read as restless during hours-long sessions and burns battery on mobile. Make it a one-time settle, or pause after ~30s. *Medium.*
- **Tab switches remount via `ScreenPane`** with a rise animation — good, but combined with scroll-position loss it makes tabs feel like page loads. Keep the fade, kill the 8–14px translate for tab (not push) navigation. *Low.*
- **Missing feedback moments** (highest-delight wins): like button has no pop (scale 1→1.2→1 spring, 250ms); add-to-stack has no fly/confirm animation; queue add has no acknowledgment. These three micro-animations are the cheapest delight in the backlog. *Medium.*
- Continuous `spin`/`planetRing` animations run even when paused/offscreen in some surfaces — gate on `isPlaying` and visibility. *Low.*

## 12. Accessibility Audit

Present and good: `focus-visible` outlines (`App.jsx:100`), `aria-label`s on icon buttons throughout, `aria-current` on tabs, `role="status"` toast (`App.jsx:4782`), `aria-live` on energy feedback (`EnergyShiftButton.jsx:214`), labeled sliders, `role="switch"` on crossfade.

| Gap | Impact | Fix |
|---|---|---|
| Contrast: `faint` #9AA1AB on canvas #E6E9EF ≈ 2.6:1; `muted` on glass fills also borderline at small sizes | **High** | Reserve `faint` for decorative/disabled; use `muted`+ for information. Audit `alert` #C45C3E on canvas (~4.4:1) for small text. |
| No keyboard transport (see §6) | **High** | Global shortcuts double as the a11y fix. |
| Touch targets in mini-dock ~24px (`padding: 4` + 16px icons) | **High** | 44×44 minimum via padding (visual size can stay). Same for `TrackMoreButton` and heart buttons in rows. |
| Track changes are not announced | **Medium** | One visually-hidden `aria-live="polite"` region at root: "Now playing {title} by {artist}." |
| Modals/sheets lack focus trapping (`QueueSheet`, `TrackActionsMenu`, session builder) — focus stays behind the overlay; Escape handling is inconsistent | **Medium** | Small `useFocusTrap` hook: trap, Esc to close, restore focus to invoker. |
| Decorative canvases/SVGs mostly have `aria-hidden` but sparklines (`EnergySparkline`, session arc) convey data with no text alternative | **Low** | `role="img"` + label ("Energy rises from 4 to 8"). |
| Uppercase+letterspacing on mono microtext hurts dyslexic readers | **Low** | Part of the §10 type floor fix. |

## 13. Performance Audit

| Issue | Impact | Fix |
|---|---|---|
| Root-level `setProgress` every `timeupdate` (`App.jsx:5314`) re-renders the entire app ~1×/s while playing — Home shelves, library, everything | **High** | Move progress into a subscription store (pattern already exists: `lib/playerEnergyStore.js`) consumed only by transports; or a `PlaybackProgressContext` around the dock/immersive player. |
| Single-bundle, single-file app: `App.jsx` is 6,993 lines; Admin/Mix/Paywall/Onboarding ship to every visitor; no `React.lazy` anywhere | **High** | Split screens into files (pure refactor, no behavior change) and lazy-load Admin, Mix, Paywall, Onboarding, ImmersivePlayer overlays. |
| Full catalog fetched on boot (`fetchCatalogTracks` gets *all* docs, `catalogLoad.js:31`) with no local cache — every visit refetches everything before anything renders | **High** | Frontend-only mitigation: cache the mapped catalog in IndexedDB/localStorage, render instantly from cache, refresh in background (stale-while-revalidate). No schema/API change. |
| Derivations rebuilt per render: `buildArtists`/`buildAlbums` in `findArtist`/`findAlbum` (`catalog.js:125–133`) and `searchEntities`; `savedTracks(tracks, 40)` in Favorites body (`App.jsx:3321`) | **Medium** | Memoize on `tracks` at App level; pass down. |
| Artwork: full-size covers loaded eagerly at every size (40px queue thumbs → 360px sleeves) via `AlbumArt` (`App.jsx:380`) | **Medium** | Add `loading="lazy" decoding="async"` + `fetchpriority="high"` only for the hero/immersive sleeve. (Server-side variants would help more but touch the pipeline — the attributes alone are frontend and cheap.) |
| Long unvirtualized lists (search results, genre pools, 40-item CoverFlow) | **Medium** | Cap + "Show all", or a light windowing hook; avoid a dependency if possible. |
| Backdrop-filter blur on many stacked surfaces is GPU-expensive on low-end Android | **Low** | Already mitigated by `prefers-reduced-transparency`; consider a perf heuristic (`navigator.deviceMemory < 4` → solid fills). |

## 14. Trust & Polish Audit

- **Good:** catalog error/empty/depleted states with retry (`HomeCatalogStatus`, `App.jsx:2959`); ErrorBoundary wraps the app (`index.js:12`); auth errors mapped to human copy (`authErrorMessage`); billing refresh feedback; membership card is a lovely trust artifact.
- **Gaps:**
  - **Offline is silent.** No `navigator.onLine` listener; a dropped connection mid-session just stalls. Add an unobtrusive "Offline — playback may pause" banner + auto-retry on `online`. *Medium.*
  - **Playback failure is silent.** `audio.play().catch(() => {})` swallows errors; a track with a dead URL looks like a frozen player. Toast "Couldn't play {title} — skipping" and auto-advance. *High.*
  - **No buffering indication** anywhere (`waiting`/`stalled` events unused). Pulse the play orb or show a subtle spinner on the sleeve. *Medium.*
  - **Settings surface is thin**: crossfade toggle hides in the player overflow; no account management (email/password change), no way to re-run genre taste from Profile (the `GenreTasteSheet` exists but entry points are sparse). Consolidate a small "Settings" group on Profile: crossfade, taste, sign-out, membership. *Medium.*
  - Toast has no dismiss and single-slot queue — fine, but add `pointer-events` dismissal on tap. *Low.*

---

## 15. Quick Wins (under ~30 minutes each)

1. Global keyboard shortcut handler for Space/←/→ (subset of #1 — the rest can follow).
2. `loading="lazy" decoding="async"` on `AlbumArt`'s `<img>`.
3. `useMemo` around `searchResults` and `entityHits`.
4. Remove `autoFocus` on mobile search input (gate on `isDesktop`).
5. Delete-stack confirmation (`window.confirm` today, styled sheet later).
6. Search hint chips (`energy 7` · `124 bpm`) under the empty field.
7. Like-button pop animation (one keyframe, one class).
8. Toast on file-to-stack / share success.
9. Raise 9–10px text to 11px and swap `faint`→`muted` for informational text.
10. `aria-live` now-playing announcer region.
11. "Browse the crate →" link at the bottom of Home.
12. Show shuffle/repeat as transport icons in the immersive player.

## 16. High-ROI Improvements (1–3 hours each)

1. **Session resume** (persist + restore playback context).
2. **Queue editing** — remove/reorder in `QueueSheet` + desktop sidebar queue.
3. **Ranked search** with scoring, diacritic folding, recent searches, capped results.
4. **Mini-dock slimming** + 44px touch targets everywhere.
5. **Progress-state isolation** (store/context) to stop whole-app re-renders.
6. **Stack rename + remove-track inline + undo delete.**
7. **Skeleton loading shelves** for Home/Library.
8. **Volume slider on immersive transport + desktop persistent volume.**
9. **Playback error handling + offline banner + buffering indicator.**
10. **Recent-searches + keyboard navigation in search results.**
11. **Camelot key browse row** in `GenreSceneBrowse`.
12. **Focus trapping hook for sheets/menus.**

## 17. Transformational Improvements (half-day to multi-day)

1. **Decompose `App.jsx`** into `screens/` + `player/` modules with `React.lazy` splitting — the enabler for every other change, and the biggest bundle/perf win.
2. **Playlist experience rebuild**: URL-routed stacks, drag-and-drop reorder, add-cuts picker, editable titles, undo system — turns the weakest surface into a flagship one.
3. **Unified transport architecture**: one player state store (progress, queue, modes) consumed by dock, hero, and immersive surfaces; dock always present; hero becomes a display of the same state.
4. **Catalog cache layer** (IndexedDB stale-while-revalidate) for instant warm starts.
5. **Desktop-native pass**: stacks in the sidebar source list, two-pane immersive player, hover-revealed row actions, resizable columns — pay off the iTunes homage the theme promises.
6. **Personalized Home v2**: "Continue listening" shelf (resume + in-progress stacks), time-of-day lane framing ("Tuesday, late — low pressure picks", the `timeOfDayGradient` hour logic already exists), recently-discovered shelf from `recentTracks` deltas. All computable client-side from existing profile data — no engine changes.

## 18. Prioritized Roadmap (highest → lowest impact)

| Phase | Contents | Rationale |
|---|---|---|
| **1. Control** | Keyboard shortcuts → queue editing → volume/shuffle/repeat surfacing → mini-dock slimming + touch targets | The gap between "pretty" and "effortless" is control. Everything here is pure frontend and immediately felt. |
| **2. Confidence** | Session resume → playback-error/offline/buffering feedback → delete confirmations + undo → toasts on mutations | Eliminates uncertainty; makes long sessions and daily return habitual. |
| **3. Findability** | Ranked search + recent searches + hint chips → memoization → capped results → Camelot browse row | Search is the highest-traffic utility surface with the lowest current quality. |
| **4. Structure** | `App.jsx` decomposition + lazy loading → progress-state isolation → catalog cache → skeleton loading | Invisible individually, transformational collectively — this is where "feels fast" comes from. |
| **5. Playlists** | Routed stacks → rename/reorder/add-picker → creation flow that lands you inside the new stack | Turns the most personal feature from administrative to enjoyable. |
| **6. Refinement** | Type scale + contrast floor → button component → focus traps → a11y announcements → motion micro-delights (like pop, file-to-stack confirm) → desktop-native pass | The Teenage-Engineering-grade detail layer, done on a stable base. |

---

### Closing opinion

PlanetMP3's identity is its moat — the platinum library, the crate vocabulary, the DJ-grade metadata. None of the recommendations above dilute it; nearly all of them are about matching the *feel* of the interface with equivalent *control and confidence*. Ship Phase 1 and 2 and the product crosses the line from "beautiful demo" to "the app I leave open all day." The rest is compounding polish.
