# Planet MP3 — Creative / UX audit (pre-change)

*Audited before the steel Y2K chassis, Channel Surfing icon swap, and Explore load work. Frontend only.*

## Product read

Planet MP3 already has a real identity: broadcast Home, Channel Surfing as the first destination, Club, stacks, and a device metaphor. The craft is concentrated in **look** (tokenized chassis, jewel-case art, LCD voice) more than in **speed of discovery**. Explore is the second tab and currently behaves like a full catalog report, not a browse surface.

Benchmark (principles, not pixels): early iTunes / iPod Mini aluminum, Winamp 2 chrome without costume skins, Apple Music Browse density, Mixmag editorial tiles without magazine scans.

## Visual identity (before)

| Token | Shipped | Problem |
|---|---|---|
| Canvas | `#090A0D` void | OLED streaming shell, not a 2001–2004 player |
| Accent | Acid LCD `#B8F24A` | Reads as gamer LED / “Spotify but chartreuse.” Brief for this pass: **no neon green** |
| Metal | Silver used as hairline only | Steel is garnish, not the body |
| Type | IBM Plex Sans + Mono | Keep — technical, not costume Lucida |
| Channel art | Pillow pictograms on saturated plates | Toy-flat, same “AI sticker sheet” energy on every tile |

**Score (pre-change visual):** distinctive but the wrong decade-feeling. Dark + acid is 2018 nightclub UI. Y2K premium was **brushed steel, pearl grey, graphite inscription**, with colour coming from **sleeves and genre drawings**, not a neon pip.

### Direction for this pass

- **Chassis:** light cool metal (`#E4E7EE` floor, pearl plates, graphite ink).
- **Signal:** steel `#5A6270` for progress, focus, selected pip. Live stays red.
- **No** acid, Aqua, purple wash, or neon glow.
- **1990s / early-2000s, premium:** iPod Mini / PowerBook G4 aluminum, not clip-art GeoCities and not 2024 OLED.

## Channel Surfing icons (before)

`scripts/render-channel-art.py` draws filled primitives (star + note, mohawk blob, machine grid). They do not read as **genre drawings**. Magenta dance / lime DnB / orange house fight the steel chassis.

**Replace with:** real published music pictograms (instrument / format drawings), composited on steel plates. Not model-generated art. License and attribution in `docs/IMAGE_CREDITS.md`.

## Explore tab — why it feels slow

1. **Hard wait on full catalog.** Home paints from `homeLite` (~48 tracks). Explore is gated with `!tracksLoading` **and** a full-screen `CatalogSkeleton` for every non-Home tab. First open of Explore is blocked until Firestore finishes the entire `tracks` query.
2. **Code-split with no prefetch.** `ExploreScreen` is `React.lazy`. First tap pays JS parse on top of the catalog wait.
3. **Main-thread report.** On first paint Explore computes stations (`decorateSceneChannels` → 14 pool builds), genre plates (browse rows **plus** a second lane scan), mood plates, **nested family × genre × scene** scans, for-you ranking, releases, charts, recents, Camelot rail, then Ken Burns on a 1024px icon.
4. **Heavy images.** Fourteen 1024px Channel PNGs (~600KB) sit on the Explore/Home art graph.
5. **Idle prefetch of ArtistPage** on Explore mount — extra JS that is not the tab.

**UX cost:** the tab that should feel like “flip the crate” opens as a blank skeleton, then a long hitch, then every shelf at once.

### Direction for this pass

- Paint Explore as soon as lite tracks exist (same as Home).
- Prefetch the Explore chunk after Home is up.
- First paint: header, search, hero, genres. Defer Camelot, moods, scenes, stations, crate, albums.
- Index the catalog once; stop nested scene scans.
- Ship smaller steel tiles (512).

## IA / UX notes (not all in this change)

- Four tabs (Home / Explore / Library / Club) are correct. Do not add tabs.
- Channel Surfing as Home’s first band is correct. Icons must carry genre, not decoration.
- Explore currently restates Home (stations + crate + charts). After speed work, keep the mosaic/moods as Explore’s job; stations can stay as a deferred rail.
- Vocabulary (cuts, stacks, on air) is identity — keep, still needs first-run gloss (out of scope here).

## What this change will not touch

Recommendation engine, Firestore schema, billing, auth, audio engine.
