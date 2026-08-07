# Performance — deferred work

Shipped in the Aug 2026 pass: next-track audio preload + crossfade gated on `canplay`, equal-power fade curve, search debounce, catalog cache TTL, skip re-enrich when `_scene` is present, `trackById` Map lookups, VirtualList on genre dig / Library playlist + liked lists, storage preconnect.

This file tracks work that needs backend, infra, or larger refactors — not blocked on design tokens.

## Catalog & data

- **Versioned catalog CDN** — export Firestore → gzipped JSON (or protobuf) behind a cacheable URL; clients fetch by `catalogVersion` instead of full `getDocs` on every cold miss.
- **IndexedDB catalog store** — replace sync `localStorage` JSON (quota + main-thread parse) with IDB + worker parse; keep a tiny boot stub in memory.
- **Incremental sync** — `updatedAt` watermark / Firestore listeners for changed docs only; avoid full-shelf re-enrich on every background refresh.
- **Scene index at write time** — compute `_scene` / `_scenes` in Admin upload or a Cloud Function so clients don’t pay O(N×scenes) on load.

## Playback

- **True gapless / MSE** — Media Source Extensions or HLS segments with precise cue points; dual-element crossfade is a bridge, not gapless.
- **ABR / HLS (or DASH)** — adaptive bitrate for mobile networks; current model is one progressive MP3 URL per track.
- **Dedicated audio engine module** — lift A/B players, preload, and crossfade out of `App.jsx` into a testable store + engine (reduces App re-render coupling).
- **Deduped mobile/desktop trees** — one screen tree with responsive chrome instead of parallel Home/Search mounts.

## Trust & counters

- **Server-side play / like aggregation** — Cloud Functions + locked security rules so clients can’t invent `playCount` / `likeCount`.
- **Authoritative charts** — nightly job from trusted play events; client chart history becomes a cache, not source of truth.

## Monetization

- **Real Stripe Checkout + webhooks** — replace entitlements `PLACEHOLDER` with Checkout Session + customer portal; webhook → Firestore entitlement doc.

## Images & delivery

- **Cover `srcset` / AVIF-WebP pipeline** — resize on upload (Cloud Function or Imgix-style CDN); `CoverImage` already exists — feed it real variants.
- **Audio CDN edge cache** — long-cache immutable object names; signed URL short-TTL if needed for entitlement gating.

## App shell

- **Further App-root thrash cuts** — stabilize `playlistCtx`, avoid passing full `tracks` into hot station chrome where a selector suffices.
- **Worker for search / ranking** — move fold+score off the main thread for large catalogs.
- **Route-level data loaders** — prefetch catalog/profile per route instead of always warming everything at App mount.
