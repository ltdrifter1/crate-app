# New Releases

**Status:** decided and shipping  
**Date:** 21 September 2026  
**Name:** New Releases  
**Layout:** simplest bay — channel signs + sleeve grid  
**Where:** Explore (default mode)

The competing floors (Aisle / Endcap / Bay / Crate) are archived in [`docs/new-releases/chooser.html`](new-releases/chooser.html). We are not building those. This is the one we shipped.

---

## Decision

Call it **New Releases**. Keep it as simple as possible.

| Call | Why |
|---|---|
| Name | New Releases — the HMV wall, no invented noun |
| Place | Explore, first tab. Home stays the radio. No fifth dock tab. |
| Layout | One filter row of channel signs. One grid of sleeves. Newest first. |
| New | Catalog arrival (`createdAt`), not Billboard street date |
| Not this | Magazine end-cap, 14 stacked aisles, Home teaser, Sleeves wallet, extra Explore tab |

Replaced the old **Sleeves** mode (jewel-case wallet). Worlds / Energy / Mix stay.

```text
 Explore
 [New Releases]  Worlds  Energy  Mix
 Newest sleeves, by channel.

 [All] [CH-04 LOCAL] [CH-05 HOUSE] [CH-11 METAL] →

 [sleeve] [sleeve] [sleeve] [sleeve]
 [sleeve] [sleeve] [sleeve] [sleeve]
```

Tap a sleeve → album. Tap a sign → that channel’s newest albums. Empty channels do not get a sign.

---

## Code

- `src/lib/newReleases.js` — `newReleaseAlbums`, `newReleaseBays`
- `src/components/explore/NewReleases.jsx`
- Explore default mode `releases`
