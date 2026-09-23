# PlanetMP3 — Top 3 speed upgrades (Sep 2026)

Strictly performance. Visual OS stays. Previous drivetrain (audio engine, CDN catalog, keep-alive tabs, self-hosted Plex) is shipped; this pass is what still made the chassis feel heavy.

## What was slow, page by page

| Surface | Hitch | Why |
|---|---|---|
| **Boot / Login** | Second planet after HTML splash | `authLoading` returned `null` until Firebase Auth + IndexedDB persistence resolved. Catalog IDB was already in memory. |
| **Home** | Skip / like rebuilt Channel Surfing | `App` re-renders on track change; inline handlers busted `memo(HomeScreen)`. Home also subscribed to the transport store at the root, so the whole page (sleeves included) reconciled on every skip. Hydrate cloned every track object. |
| **Explore** | Tab felt cold after skip | Unused props (`recentTrackIds` new array every render, inline `onListenIntent`) defeated `memo`. Full `tracks` identity churn from hydrate. |
| **Library** | Same | Inline `onPlay` / `recentTrackIds` / `onOpenMenu`. Keep-alive did not help if props were new. |
| **Club** | Same | Inline play / mix / genre handlers. |
| **Search / Charts / Mix / Artist / Album** | Fine when visited; search already virtual + debounced | Still pay full-catalog identity churn if hydrate lands while the pane is open. |
| **Player / skip** | Instant when next is warm | Unchanged drivetrain. Rails were the remaining stall: one CF miss still allowed **original JPEGs** on 80–336px tiles. |
| **Admin** | VirtualList already | Not on the consumer path. |

## Top 3 (this pass)

1. **Paint before Auth** — `main` already paints guest Home from IDB/CDN (`bootBlocked`, Club/Library gated). This pass keeps that and adds `peekAuthSession()` so returning members drop the HTML splash even if the shelf is empty while Auth hydrates.
2. **Frozen screen plane** — `useCallback` for play/skip/like/nav; identity-preserving `adoptCatalogTracks` / `patchTrackById` so hydrate and likes do not clone the shelf; Home hero + editorial subscribe themselves so Channel Surfing does not reconcile on skip.
3. **Rails never fetch masters** — after CF → Firebase thumb, tiles under 640px go to the color-well disc. Immersive 960px stage may still use the original.

## Intentionally not this pass

Service worker / Vite / Firestore SDK split from `main.js` (~253 KB gzip) / HLS. Those are still the next infra rung (`docs/PERF_FUTURE.md`).
