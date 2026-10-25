# PlanetMP3 — design audit, 25 October 2026: the shop floor

**Brief.** A digital record shop + MP3 player + radio station + music magazine + music-TV channel from an
alternate 2002. Audit first, preserve what works, don't redesign for its own sake. This pass was done
fresh — the earlier audit docs were set aside and every screen was looked at again from the running app.

**Method.** `npm start` at 390×844 (touch) and 1280×800, every dev preview route (`#broadcast-preview`,
`#player-preview`, `#explore-preview`, `#set-preview`, `#onboarding-preview`, `#chat-preview-open`,
`#site-preview` → Library / Charts / Artist / Album / Club / Search) plus `/` as a guest. Screens are in
`docs/audits/design-audit-2026-10-25/`. Judgments are marked **(judgment)**; everything else was read in
the code or measured in Chromium.

---

## The verdict in one paragraph

The station half of PlanetMP3 is real and good: the hero lower-third, the channel dial with printed inks,
the Today guide, the Board, the Set Builder arc, the Club card and the onboarding tuner are the product.
The *shop* half barely existed. Discover was a taxonomy page (New / Trending / Genres / Artists plus a
"TOOLS" tray) with the one genuinely strange idea — Dig — hidden in an 11px chip. Library was a
music-app library: KPI tiles that count things, and 2×2 cover mosaics. Neither screen said *record shop*,
*crate* or *mine*. That is the gap this pass closes, with four changes and no new chassis.

## What works — kept, untouched

| | Why |
|---|---|
| **Hero lower-third** | Red rule, condensed caps, `118 BPM · 8A · MP3 · AFTERGLOW · ELECTRONIC`. Broadcast grammar, not a card. |
| **Channel Surfing** | 14 pixel stations, each with a printed ink and a CH plate. The only colour-with-meaning in the product, and the best art it owns. |
| **Today guide** | A schedule with a LIVE block and hosts makes this a station. |
| **The Board** | Huge numerals, heat meters, one request key. Already a broadcast countdown. |
| **Set Builder** | The energy arc is the most distinctive graphic in the app. |
| **Immersive player** | Sleeve, lower-third, hardware keys, Slow/Fast animals, Up Next in the LCD. |
| **Club card / Artist ON FILE** | Ownership and catalogue facts made visible. |
| **Type system** | Barlow Condensed for posters and numerals, Outfit for reading, Plex Mono for firmware. Nothing here needed changing. |

## What was weak, generic or confusing **(judgment)**

1. **Discover was every music app's browse tab.** Four pill tabs, then a sunken tray labelled `TOOLS`
   holding Keys / Dig / Charts / Energy at 11px. Two navigation rows for one page. Dig — "no algorithm,
   no reason", the thing nobody else has — was the smallest control on the screen.
2. **Library was a dashboard.** "Your Crate" was three glowing stat tiles (`7 Singles · 3 Playlists ·
   7 Liked`). Playlists were Apple Music mosaics. Nothing on the screen was an object you own.
3. **Onboarding stations were all one grey.** Fourteen channels have fourteen inks; the first screen a
   new member sees used none of them and lit the selection in silver.
4. **The phone Home was a player and nothing else.** The square sleeve took the full width (362px on a
   390 phone), pushing the lower third, transport and crawl under the dock. The crawl — the one
   broadcast element that moves — was `display: none` at ≤430px, i.e. on every phone.
5. Smaller: "Your listening / Play a few tracks" is SaaS copy; the Profile page below the card is a
   pricing page (`INCLUDED` / `MEMBERSHIP` / `HOW IT WORKS`); the Discover masthead counted "26 tracks"
   like a database. Only the first and last were touched.

## What is unnecessary

- The second navigation row on Discover (the `TOOLS` tray). Removed.
- Stat tiles on Library. Removed.
- A Dig *mode*. Dig is a strip that is always there now, so the mode is gone.
- The `display: none` on the Home crawl for phones. Removed — the hero now fits instead.

---

## What changed

All on the existing chassis (`broadcast-glass-20260930`). No tokens revalued, no data model changed,
no behaviour removed: every mode, callback and route Discover and Library had before still works.

### 1. Discover is a shop floor

- **The crate sits at the counter.** `CrateDig` gained a `compact` prop: one strip under the find field,
  on every section — ink spine, a slot, "THE CRATE — One random pull. No algorithm.", a `DIG` key. A pull
  lands inline in condensed caps with artist, the find stamp ("Never played here", "Nobody's claimed it")
  in the track's station ink, `AGAIN`, and a pearl play key.
- **One shelf of divider cards** replaces the tabs + tray: `01 NEW · 02 TRENDING · 03 GENRES ·
  04 ARTISTS · 05 KEYS · 06 ENERGY (· 07 HISTORY when tracks carry years)`, numbered like bins, Barlow
  Condensed caps, selected = pearl plate. Charts rides the same shelf as a door (a button, not a tab).
  Horizontal scroll with a gutter on phones; one row on desktop.
- Masthead subline: "26 tracks on the shelves".
- Files: `components/explore/ExploreModes.jsx` (rewritten), `components/explore/CrateDig.jsx`,
  `screens/ExploreScreen.jsx`, `lib/explore.js` (Dig removed from `EXPLORE_TOOLS`).

### 2. Library has a point of view

- **Shelf label.** One line of firmware where the tiles were: `▌ YOUR CRATE · 7 SINGLES · 3 PLAYLISTS ·
  7 LIKED ───`. Same numbers, no dashboard.
- **Playlists are burned CD-Rs.** `CdrDisc`: a flat pearl disc with a hub, a written title band in the
  station ink of the first track (same classifier as the dial and the Board), the real `N TRACKS · M:SS`
  under the hub, and the first sleeve sitting behind the disc at 32% so album art still supplies the hue.
  One diagonal highlight so it reads as a disc; nothing else. The play key, open, rename and delete are
  unchanged. `CoverMosaic` stays for the Liked tile and the open-playlist header.
- Files: `screens/FavoritesScreen.jsx`.

### 3. Onboarding stations print their ink

- Each `StationCard` carries a rule in its channel's ink along the bottom (3px, 5px when tuned); the
  tuned ring and the `TUNED` label use that ink instead of one silver for all fourteen.
- Files: `components/onboarding/TasteTuner.jsx`.

### 4. The phone Home shows the station

- The square hero sleeve is capped at `min(100%, 320px, 32dvh)` on phones via a CSS variable the sleeve
  reads (`--pmp-hero-art`); desktop and the split layout are untouched. Measured on 390×844: sleeve
  362px → 270px, so the lower third, seek and transport sit above the dock and the Today band is one
  short scroll away instead of a full one.
- The crawl is back on phones (it was `display: none`), tightened to 8px/5px spacing.
- Home empty shelf: "Your shelf — Nothing on it yet. What you play lands here; what you like goes in
  the Library."
- Files: `components/home/HeroPlayerCard.jsx`, `index.css`, `screens/HomeScreen.jsx`.

### 5. The Home screen (same day, second pass — "make it feel like MTV but modern")

**What was wrong.** Three brand marks in the first viewport on desktop (sidebar lockup, header
glyph + wordmark, planet pip on the hero) and two on a phone. The hero was a glass bezel holding a
square sleeve with the title beside or under it — a card, not a channel.

**What it is now.** Home is a channel and the hero is *the screen*:

- The header is one slim row — More (phone) and Find. No glyph, no wordmark. The desktop source
  list carries the lockup once; nothing else repeats the name.
- The sleeve fills a broadcast frame like a music-video still — cropped (`object-position: 50% 32%`),
  never blurred — portrait 4:5 on a phone, 16:9 on a tablet, a 2:1 wide frame on desktop.
- Corner bugs: a pulsing red `● LIVE` plate top-left when something is playing, the CH ident
  (in its station ink) top-right, a `VIDEO` plate beside it when the cut has a video.
- The lower third is cut into the picture: red rule, `NOW PLAYING` / `UP FIRST`, the title in Barlow
  Condensed 800 at up to 72px, artist, one line of firmware (BPM · key · format · album · genre).
- The station callsign `PMP3` watermarks the bottom-right of every frame — the bug every channel
  carries, in type, not a logo.
- Below the frame, a flat control strip: timeline, transport, Slow / Fast, Up next, the crawl.
  No glass halo, no scanlines, no bezel highlight.
- Files: `components/home/HeroPlayerCard.jsx` (rewritten), `components/home/HomeHeader.jsx`,
  `components/player/DeviceChrome.jsx` (`LcdMetaLine inline`), `index.css` (`.pmp-hero-screen`,
  `.pmp-live-dot`; `.pmp-planet-pip` and the split-stage rules removed).
- Screens: `08`–`11` in `docs/audits/design-audit-2026-10-25/`.

**Trade-off, stated.** Square covers are cropped to the frame. On a phone that loses a sliver each
side; on desktop it keeps the middle half. The full sleeve is one tap away in the immersive player
and in Up next. Over the real catalog (Yung Bae, Zari Alexandria, XFLEX) it reads as broadcast; over
a text-heavy cover the lower third may sit on lettering — the scrim is tuned for that but check it.

### 6. Third pass — the immersive player and the rest of the app

Looked at again fresh: the immersive player, the phone dock and desktop mini player, Profile,
Artist, Search, Charts, Set Builder, Onboarding, the chat. Charts, Set Builder, Onboarding and
Search were left alone. Four areas changed:

**6a. The immersive player is the channel, full screen.** It was an "alternate-2003 device": a
blurred, saturated copy of the cover as a backdrop, eighteen fake visualiser bars behind the
title, a `NOW PLAYING` pill and a `PLANET / 003` plate in the top bar, a square sleeve floating in
the middle, and the crawl at 8px. Now it is the Home screen at full size: the sleeve fills the frame
(it takes whatever height the deck leaves, capped at 58dvh), `● LIVE` and the CH ident in the
corners, the lower third cut in with the title up to 68px, `PMP3` watermark, then a flat deck —
timeline, transport, Slow / Fast, one row with Up next and volume, and the same crawl as Home at
the foot. Booth tools stay in their drawer; the `⋯` menu keeps Request, Liner notes, Near this,
Crossfade. Removed: the blur backdrop, the bars, the pill, the plate, the title marquee.
`ChannelIdent` moved to `components/station/ChannelIdent.jsx` so Home and the player share it.

**6b. Mini players are broadcast strips.** The phone dock bar had five neon VU bars pulsing beside
the title — decoration with nothing behind it — and an app-icon sleeve (12px radius). Now: sleeve
with square corners, title, play, skip, the progress hairline. The desktop mini player drops the
tinted frosted glass for the same flat near-black plate.

**6c. Profile in beta is the card, not a pricing page.** The numbered `INCLUDED` plan list, the
`MEMBERSHIP / Membership` block and the empty `YOUR COLLECTION` box ("When Club Copy editions
arrive…") are gone while `BETA_LAUNCH` is on; the card already says *Full access is included during
this trial period*. Review the guide and Sign out stay. Off beta, the plan sections return unchanged.

**6d. Artist pages lead somewhere: Same shelf.** Under the ON FILE card, a rail of the other
artists the dial files on this artist's channel (same classifier the stations and the Board use),
labelled with the channel number and ink. Tap one, you are on their page — the rabbit hole the brief
asked for, built from catalog facts. Hidden when nobody else is on the shelf. `App` and the site
preview now pass `tracks` and `onOpenArtist`.

- Files: `components/player/ImmersivePlayer.jsx` (rewritten), `components/station/ChannelIdent.jsx`
  (new), `components/player/GlassDock.jsx`, `components/player/DesktopMiniPlayer.jsx`,
  `components/club/ClubScreen.jsx`, `components/club/CollectorPanel.jsx`,
  `components/catalog/ArtistPage.jsx`, `App.jsx`, `preview/SitePreview.jsx`, `index.css`
  (`.pmp-player-screen`; the old device-stage rules removed).
- Screens: `12`–`14` in `docs/audits/design-audit-2026-10-25/`.
- Tests: Same shelf rail (lists same-channel artists, not itself or other channels, opens on tap;
  hidden when empty); ship assertions for the player (framed screen, callsign, ident, none of the
  removed chrome).

### Docs

- `CREATIVE_DIRECTION.md` no longer asks for glassmorphism; the shipped chassis is flat and the brief
  says no generic glass. One sentence.

## Tests

Baseline 98 suites / 645 tests → **98 / 650**, all passing. New or rewritten:

- Discover: one tablist of six (`New Trending Genres Artists Mix Energy`), no `TOOLS`, Charts is a
  `role="button"` on the shelf, the Crate Dig section precedes the shelf and has a `Dig` key.
- Library: the shelf label prints the counts; the playlist tile is a `.pmp-cdr` with the title and
  `2 tracks · 6:30`; `Play <name>` still exists.
- Onboarding: two stations render two different inks; tuning uses that ink for the ring.
- Ship assertions: the hero is a `.pmp-hero-screen` with 4:5 and 2:1 frames, no glass halo, no
  planet pip, callsign present; the header carries no `BrandGlyph` or `BRAND_NAME`; no
  `display: none` on `.pmp-hero-ticker`; `ExploreScreen` mounts `CrateDig compact`.
- Home: the live hero has a `.pmp-live-bug`, a `PMP3` callsign, and the lower third inside the
  screen; the header renders no image and no brand text.

`npm run build` + `assert-shipped-style` pass and `build/` is regenerated (Cloudflare Pages serves it).

## The ten priorities, as I read them now **(judgment)**

| # | Priority | State |
|---|---|---|
| 1 | Navigation | Four-tab dock is right. Discover now has one nav row instead of two. |
| 2 | Discovery | Dig is at the front door; sections are numbered bins. Genres/Keys/Energy unchanged and good. |
| 3 | Personal library | Now owns an object (the disc) and a label. Liked and Recents are still lists — fine. |
| 4 | Player | Home hero and the immersive player are one broadcast screen (sections 5, 6a). |
| 5 | Playlists | Discs read as yours; building is unchanged. |
| 6 | Charts | The Board is right. Reachable from Home, the shelf, the sidebar. |
| 7 | Artist discovery | ON FILE card is right; Same shelf now leads to the next artist (6d). |
| 8 | Music history | Still dark until tracks carry `year`. Data work, not design. |
| 9 | Requests | Key on every Board row. A Requests surface of its own is the next step. |
| 10 | Mobile | Hero fits, crawl is back. Discover and Library tested at 390px. |

## Recommended next, in order **(judgment)**

1. **A Requests surface.** The request key exists; a "Requests tonight" strip on Home or the Board,
   fed from real `requestCount` deltas, would make participation visible.
2. ~~**Profile below the card.**~~ Done in beta (6c); revisit the plan sections when pricing goes live.
3. **Backfill `year`** at ingest so History opens and the disc data line can print an era.
4. ~~**Artist page: a "Same shelf" rail.**~~ Done (6d).
5. **Dedications.** Read `stationDedications` back; the crawl should carry real ones.

## Not verified

- Live Firestore, live audio, real cover art (previews use flat placeholder sleeves — check the CD-R
  band and the Dig slot over busy real covers).
- Safari / iOS: `dvh` has a `vh` fallback declared first; the scroll-snap shelf is standard CSS but
  unseen on a device.
- Keyboard order on the new shelf beyond native button focus.
