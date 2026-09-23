# Performance — deferred work

Shipped in the Aug 2026 pass: next-track audio preload + crossfade gated on `canplay`, equal-power fade curve, search debounce, catalog cache TTL, skip re-enrich when `_scene` is present, `trackById` Map lookups, VirtualList on genre dig / Library playlist + liked lists, storage preconnect.

Shipped in #273 (Sep 2026 premium drivetrain): `audioEngine` helpers + Media Session metadata/actions, CDN `catalog/v1.json` client + publisher (Firestore fallback), self-hosted Plex, single HTML boot splash, one chassis tree + keep-alive dock tabs, cover CF→thumb fallback, `lucide-react` removed. Remaining gaps: `docs/audits/PREMIUM_PERF_AFTER_273.md`.

This file tracks work that needs backend, infra, or larger refactors — not blocked on design tokens.

## Catalog & data

- **Versioned catalog CDN** — ✅ client prefers `catalog/v1.json` (800ms) over `getDocs`; still TODO: **gzip/brotli body**, bump `v{n}` / ETag, client `catalogVersion`, not forever plain `v1.json`.
- **IndexedDB catalog store** — ✅ primary warm-start path shipped; still TODO: worker parse + tiny boot stub only in memory (no sync localStorage for large shelves beyond the small stub).
- **Incremental sync** — `updatedAt` watermark / Firestore listeners for changed docs only; avoid full-shelf re-enrich on every background refresh.
- **Scene index at write time** — compute `_scene` / `_scenes` in Admin upload or a Cloud Function so clients don’t pay O(N×scenes) on load.

## Playback

- **True gapless / MSE** — Media Source Extensions or HLS segments with precise cue points; dual-element crossfade is a bridge, not gapless. Do **not** start here before CDN audio + engine ownership.
- **ABR / HLS (or DASH)** — adaptive bitrate for mobile networks; current model is one progressive MP3 URL per track.
- **Dedicated audio engine module** — ✅ helpers in `src/lib/audioEngine.js`; still TODO: move A/B bind / crossfade / promote **orchestration** out of `App.jsx` (~364 lines still there); use `createAudioPair()`.
- **Deduped mobile/desktop trees** — ✅ one `innerApp` + sidebar wrap; still TODO: CSS layout instead of `isDesktop` JS mode.

## Trust & counters

- **Server-side play / like aggregation** — Cloud Functions + locked security rules so clients can’t invent `playCount` / `likeCount`.
- **Authoritative charts** — nightly job from trusted play events; client chart history becomes a cache, not source of truth.

## Monetization

- **Real Stripe Checkout + webhooks** — replace entitlements `PLACEHOLDER` with Checkout Session + customer portal; webhook → Firestore entitlement doc.

## Images & delivery

- **Cover `srcset` / AVIF-WebP pipeline** — ✅ CF resize + thumb fallback in `CoverImage`; still TODO: mint `_200x200` / AVIF at **upload**; never fall through to Storage masters on rails.
- **Audio CDN edge cache** — upload-tracks already sets `cacheControl: public, max-age=31536000` on objects; still TODO: cacheable edge hostname + Range-friendly delivery (progressive MP3 OK for v1).

## App shell

- **Further App-root thrash cuts** — `playlistCtx` is `useMemo`’d (deps incomplete); still avoid passing full `tracks` into hot chrome; guest/IDB paint before Auth.
- **Worker for search / ranking** — move fold+score off the main thread for large catalogs.
- **Route-level data loaders** — prefetch catalog/profile per route instead of always warming everything at App mount.
- **App-shell service worker** — still absent; precache `index.html` + main JS + fonts only (not audio/catalog).
- **Media Session position** — metadata + transport shipped; `setPositionState` still TODO.

## Shipped (follow-ups from Aug 2026 audit)

- Display-sized brand lockups (256/512 + WebP) instead of 1MB+ masters in chrome/splash.
- Self-hosted IBM Plex latin woff2 (`font-display: optional`) — Google Fonts link removed (#273).
- Lazy `LoginScreen` + IndexedDB-first catalog cache (localStorage stub only for small shelves).
- Explore tab hosts Discover; Home Channel surfing is its own section under Most requested.
