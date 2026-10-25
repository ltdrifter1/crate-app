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

### 7. Fourth pass — Charts, Library, Discover, fresh

Every mode of all three pages was screenshotted again at 390 and 1280 and judged cold. Charts
was close to done; Library carried too much chrome; Discover had two generic modes and one that
hid its own labels. Five changes:

**7a. Charts: Past days opens a board.** The archive view asked you to "Pick a day" and showed a
`00` placeholder until you did — a dead end one tap from the best page in the app. It now opens on
the latest captured board, the day rail still switches between days, and the empty state is only
for a genuinely empty archive ("No boards yet · The archive fills as you listen — one board a day").
Climbers, Number ones, the channel and genre scopes, the crawl and the scoreboard were right and
are untouched.

**7b. Library: chrome diet.** Five rows stood between the title and the first record: a subtitle
that repeated the tabs, the shelf label, the tabs, a search field for three playlists, and a
"Playlists" heading that repeated the active tab with sort chips beside it. Now: title, shelf
label, tabs with the sort chips on the same row (they wrap under on a phone), then the discs. The
find field appears once a list has nine or more items, or while you type. The open-playlist header
shows the same CD-R as its tile instead of a mosaic. One word for the thing everywhere: *tracks*,
not songs.

**7c. Discover · Trending is a heat board.** It was a numbered list of track cards — the thing
every app has. It now speaks the Board's language: condensed rank numerals, a station-ink stripe,
sleeve, title in condensed caps, a ten-step heat meter against the hottest cut, plays and BPM · key
as firmware. Same component grammar as Charts, so Discover and Charts read as one station.

**7d. Discover · Artists is a wall of sleeves.** Round-avatar list cards became a grid of square
sleeves, each with its station ink along the foot — the same tile the artist page's Same shelf
uses — with name and `N TRACKS · GENRE` as firmware. "13 on file · by spins."

**7e. Discover · Energy rooms print their names; Keys says its hint once.** The four rooms showed
only `0–4` / `4–7` / `5–9` / `7–10` in tiny mono on the tile, with the names left to a caption below.
Each room now carries its name in condensed caps, an `ENERGY 0–4` plate and the count, over a
scrim that keeps the sleeve. The Keys mode printed "Twelve keys. Neighbors mix." twice; the page
hint is gone and the board's own line stays.

- Files: `components/station/ChartHistoryPanel.jsx`, `screens/FavoritesScreen.jsx`,
  `components/explore/TrendingCuts.jsx` (rewritten), `components/explore/ArtistIndex.jsx`
  (rewritten), `components/explore/EnergyRooms.jsx`, `screens/ExploreScreen.jsx`.
- Screens: `15`–`20` in `docs/audits/design-audit-2026-10-25/`.
- Tests: Past days opens on the latest board; Trending rows are heat rows; Artists render the wall.

### 8. Fifth pass — Search, Profile, Onboarding, fresh

**8a. Search is the shop's index card.** The find field now says what it is ("Find a track, artist or
scene", the same words as Home and Discover). Artist and album hits are one shelf of square sleeves
with the station ink along the foot, labelled `ARTIST` / `ALBUM` in firmware, instead of two stacks of
glass cards with round avatars. The empty state's genre list — eight full-width grey bars with a
number — is a grid of bins in condensed caps with the count as firmware, which also fixes the
desktop, where the bars ran the full 1100px. "No results" was a dead end; it now says *Nothing by
that name*, offers the crate (the same compact Dig as Discover) and keeps the keys and genres below.

**8b. Profile stops repeating itself.** The page header printed the planet glyph and "Planet MP3"
above the title (the third mark in the app), and on desktop the collapsed sticky bar was a light
silver gradient slab. Both gone: the header is the title and subtitle; the compact bar is a dark
hairline strip. The "Morning · listening hours / The room is open / Listen without limits" card is a
weather report when nothing is metered; it now appears only when a paywall meters plays. Tabs went
from 11px to 13px.

**8c. Interests says each thing once.** The tab opened with "SETTINGS · INTERESTS / YOUR INTERESTS"
under a header that already said *Settings · Your interests*, then printed the same genre
percentages twice (*Your taste* and *What you like*), then three KPI tiles (Liked / Recent / Albums)
and a shelf line the Library already carries. Now: Your taste, Energy, Recently played, Liked.

**8d. Onboarding you can read.** The station tiles and the Energy / Stretch choice tiles never
showed their names: the art wrapper sat in normal flow, pushed the label below the card and the card
clipped it — so a new member picked stations by pixel art alone and chose "Peak floor" / "Late booth"
blind. Fixed at the root (the art is positioned, not flowed) and the label now sits on a solid dark
plate under the art, condensed caps with the `CH-11` or `TUNED` in ink. Headings moved to Barlow
Condensed caps ("TUNE THE STATIONS THAT SOUND LIKE YOU", "HOW SHOULD THE MIX FEEL?") so the first
screen speaks in the station's voice; the "Starting on" card prints the station name at 40px.

- Files: `screens/SearchScreen.jsx`, `components/search/GenreSceneBrowse.jsx`,
  `components/layout/CollapsingHeader.jsx`, `components/club/ClubScreen.jsx`,
  `components/listen/InterestsPanel.jsx`, `components/onboarding/TasteTuner.jsx`.
- Screens: `21`–`26` in `docs/audits/design-audit-2026-10-25/`.

### 9. Sixth pass — the Landing page and the Set Builder, fresh

**9a. The landing is the front door of the station, not a neon lobby.** It carried three pulsing
"neon bloom" radial gradients (silver, purple, red), a fixed scanline overlay, an auto-scrolling
marquee of glowing channel pills with randomised blink delays, LCD headers in the retired ice-cyan
(`#B7E4EE`), and the old light-steel borders — the one screen still on a chassis the app left in
September. On desktop it printed the lockup a second time next to the sidebar's. Now: the canvas
is flat; the headline is `OPEN ALL NIGHT.` in Barlow Condensed up to 96px; the lockup prints only
on a phone (beside the desktop source list it is already on screen); the channel pills are the real
dial — eight station tiles with their pixel art and ink, each a door to sign-up; the Top 5 is a
Board-style card (rank numeral, station-ink stripe, condensed title) under a masthead strip with
the red square; the liner notes card shares the masthead; the auth form is unchanged in behaviour
with its underline in pearl. The honest *Sample board · NOT LIVE DATA* rule still holds.

**9b. The Set Builder loses its costume and keeps its instrument.** The energy arc is the most
distinctive graphic in the app and stays. Gone: the `BOOTH` badge pulsing in the header for no
reason, the blurred-sleeve atmosphere (the stage already shows the sleeves sharp), the lime-tinted
steel LCD well under the arc, and the silver-gradient selected chips. Now: `BUILD A SET` in
condensed caps, a flat vibe-tint wash on the canvas, the set title as a lower third
(`NIGHT OUT · 1 HOUR` at 34/48px), `IN THE BOOTH` as a pearl plate, the arc on a near-black well so
the tint reads, and selected Length / Vibe / Genre chips as pearl plates ringed in the vibe's colour.

- Files: `components/auth/LandingScreen.jsx`, `components/set/SetBuilderScreen.jsx`,
  `components/set/EnergyArc.jsx`.
- Screens: `27`–`30` in `docs/audits/design-audit-2026-10-25/`.

### Docs

- `CREATIVE_DIRECTION.md` no longer asks for glassmorphism; the shipped chassis is flat and the brief
  says no generic glass. One sentence.

## Tests

Baseline 98 suites / 645 tests → **98 / 651**, all passing. New or rewritten:

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
| 1 | Navigation | Four-tab dock is right. Discover has one nav row; Search's empty state and no-results both lead somewhere (8a). |
| 2 | Discovery | Dig at the front door; numbered bins; Trending is a heat board, Artists a sleeve wall, rooms named (7c–e). |
| 3 | Personal library | Now owns an object (the disc) and a label. Liked and Recents are still lists — fine. |
| 4 | Player | Home hero and the immersive player are one broadcast screen (sections 5, 6a). |
| 5 | Playlists | Discs read as yours; the Set Builder keeps its arc and drops its costume (9b). |
| 6 | Charts | The Board is right; Past days opens a board (7a). Reachable from Home, the shelf, the sidebar. |
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
