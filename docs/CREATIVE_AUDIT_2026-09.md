# PlanetMP3 — Creative & UX audit, September 2026

Reviewed against `docs/CREATIVE_DIRECTION.md`. **Every screen was seen running.**

Six surfaces (Library, Charts, Artist, Album, Club, Search) sat behind auth with no
preview hash, so they had never had a design pass. Rather than guess at them, this
audit added `#site-preview` — a switcher that mounts the real components against a
fixture catalog, no login and no Firestore. It is a permanent review tool, not
scaffolding for this pass.

```
npm start   →   localhost:3000/#site-preview
```

`src/preview/SitePreview.jsx`, `src/preview/fixtures.js`, route in `src/App.jsx`

---

## The headline finding

**The chassis is excellent. Nothing was allowed to sit on it.**

`src/theme.js` is a genuinely well-built, disciplined visual OS: cool steel, IBM
Plex, LCD wells, chamfered aluminum keys, engineered corners. It is not fake-retro
and it is not generic glassmorphism. That work should be protected — and
`styleShip.test.js` correctly protects it.

But the system had desaturated itself into monochrome. All fourteen `SCENE_CHANNELS`
shipped an `accent` field, and all fourteen were greys between `#4A4E56` and
`#8B95A4`. Live data wired to nothing.

The result read as a very nice grey hi-fi, not a digital record shop. A real Y2K
device has a steel chassis **and** a glowing display **and** printed colour labels.
PlanetMP3 had the first two.

The proof was already in the build: **Explore → Energy** was the one module with four
distinct hues, and it was the best-looking screen in the product.

### The fix is not to repaint the chassis

Colour enters through **content identity**, never through chrome. That is what a real
record shop does: the fixtures are grey steel, the divider cards and the sleeves are
colour. So:

- **Ink** = identity — which station or scene this is
- **Ice LCD** = state — what is tuned, live, playing
- **Red** = live only

That split is now implemented throughout and is the spine of this pass.

---

## What works — protect it

| Surface | Why it works |
|---|---|
| **Hero player card** | The LCD readout — `118 BPM · 8A · MP3 · AFTERGLOW` — is the most convincing expression of the brand. It is a device, not a card. |
| **Channel copy** | "Machines with intent — Detroit to Berlin", "Skip, shuffle, 2-step — late bus home". Written by someone who knows the music. Do not sand this down. |
| **Club membership card** | `NO. #000142`, JOINED, ON THE SHELF, the embossed disc. The most on-brand screen in the product — DISCOVER · COLLECT · PARTICIPATE made visible. |
| **Home IA** | Hero → Channel Surfing → Show guide → Countdown is a coherent radio station, not a content feed. |
| **Set Builder energy arc** | The most distinctive graphic in the product. |
| **Time-aware DJ greeting** | "Morning session. Office speakers. Open windows." You tuned in; you did not log in. |
| **Crate Dig concept** | The strongest idea here: "No algorithm. No reason." |
| **Charts ticker + stat chips** | `#1 WAREHOUSE — GRIDLOCK · PLAY & REQUEST TO CLIMB`. Pure radio. |

---

## Identity

### Fourteen identical grey stations → fourteen printed inks

Each channel now carries a printed-label ink from music-print culture — Chicago
warehouse gold for House, Detroit steel-cyan for Techno, Croydon purple for Dubstep,
jungle green for D&B, millennium magenta for Y2K Dance. Surfaced as the CH bug fill
and a divider-card rule under each tile, and as a left ink tab on the Explore chips.
The dial is colour-coded end to end, and the first-run tour teaches the system before
you meet it.

`src/lib/sceneChannels.js`, `components/home/ChannelCard.jsx`,
`components/explore/NewReleases.jsx`, `lib/newReleases.js`

### The front door contradicted the product

`LandingScreen` hardcoded eight channel colours that disagreed with the app — Y2K
Dance was the LIVE alert red there and magenta inside. Ink now comes from
`SCENE_CHANNELS`, so the shop window matches the shop.

The headline was a startup pitch: "Music should feel like something you discover"
over a value-prop subhead, in a voice the product uses nowhere else. Now **"Open all
night."** over "14 live channels, a monthly chart, and a crate that's actually yours"
(count read from the data). `Start for free` → `Tune in free`, the verb the product
already uses everywhere. This is the one pure copy change in the pass; it reverts in
one line.

`src/components/auth/LandingScreen.jsx`

### Sidebar was a generic settings menu

Now a source list with DIAL / TOOLS groups and a chassis silkscreen
(`PLANET MP3 / 14 CH · 320 KBPS · STEREO`, channel count read from the data) filling
what was dead space.

`src/components/layout/AppSidebar.jsx`

---

## Discovery

### Crate Dig — best idea, plainest execution

The anti-algorithm feature was a grey form: an empty dark well, a flat bar labelled
DIG, two equal-weight buttons. Rebuilt as a crate you pull from — a station-ink spine
down the slot, a printed stamp saying *why* the cut is a find ("Only 2 plays",
"Nobody's claimed it", surfacing the obscurity logic `pickDigTrack` already applied),
a pull counter so digging accumulates, a raised hardware key, and PLAY IT promoted to
primary once you have something.

`src/components/explore/CrateDig.jsx`

### History was a top-level door onto an empty room

All six eras rendered "NO TRACKS YET". `TimeMachine` reads `track.year`, which the
catalog largely does not carry — so a fifth of the discovery surface was a dead end
for every visitor. The tab is now hidden until the crate contains release years and
returns by itself once the data lands. **This is a data gap, not a code bug** —
backfilling years during ingest is what actually unlocks the feature.

`src/lib/explore.js`, `src/screens/ExploreScreen.jsx`

### The Camelot mix board was built and unreachable

`MixBoard` was imported, rendered behind `mode === "mix"`, styled, and pinned by
`styleShip.test.js` — but "mix" was not in `EXPLORE_MODES`, so no tab could ever
select it. Harmonic mixing by key is core to a crate-digging product. Restored as the
**Keys** tab.

### Explore tabs read as disabled

Unselected tabs were `color.muted` on transparent. They are now raised keys, the lit
LCD still marks the selection, and the grid sizes to however many tabs exist instead
of a hardcoded five. "New" was also the only mode without a heading — it now has one
like the others.

`src/components/explore/ExploreModes.jsx`, `components/explore/NewReleases.jsx`

---

## Legibility — three measured defects

All three were tokens used on the wrong surface. All now pass WCAG AA.

| Where | Was | Now |
|---|---|---|
| **Now-playing rows** (Search, Library, Artist, Album) | Dark diagonal gradient under dark grey text — **2.28:1** | A lit LCD row: even dark face, ice border, ice text — **10.15:1** title, **5.24:1** meta |
| **Home search** | Pale ice LCD text on a *light* well — ~1.5:1, read as disabled | A real recessed LCD well — **5.19:1** |
| **Player "Up next"** | `color.muted` / `color.accent` *inside* the dark LCD — invisible | `color.lcdMute` / `color.lcdSignal` with a hairline rule |

Making the active row a lit LCD row also means "now playing" reads as *tuned*, which
is the ice-equals-state rule the rest of the pass follows.

`components/listen/TrackRow.jsx`, `components/home/HomeHeader.jsx`,
`components/player/ImmersivePlayer.jsx`

---

## Layout

### The Charts podium was broken at desktop width

The #1 tile is a square that scales with its grid column, so on a wide board it forced
a 710px row — and #2 and #3, set to `flex: 1`, inflated to ~350px each to hold two
lines of text. Two enormous empty panels beside the leader. The board is now capped
and the side cuts sit at their own height: **350px → 90px**. It reads as a podium again.

### The countdown leader ate a whole phone screen

On Charts and on Home. A chart's job is the list. The leader's art is capped on
mobile — **343px square → 195px** — so the list starts above the fold.

`src/index.css`

### Feature tour — 60% empty, taught nothing

The first-run card forced `min-height: 680px` around three short lines, every step
text-only. It now sizes to content, and each step carries a small plate showing the
thing it describes — the channel rail, the sleeve grid, the library stack — drawn in
real station inks.

`src/components/guide/FeatureTour.jsx`

---

## Information architecture

### Club is now a dock destination

`nav.js` shipped Charts in the fourth slot while its own comment and six tests
specified Club. Club is the membership and collection surface — the most on-brand
screen in the product — and it was reachable on mobile only through the hamburger.
Dock is now **Home / Explore / Library / Club**; Charts moves to the source list and
More drawer beside Build a set.

`src/lib/nav.js`

### Artist pages contradicted themselves, and had no culture on them

The header printed the specific genre ("Ashcan · PUNK") while every row underneath
printed the broad lane ("Ashcan · Rock") — `displaySceneLabel` let scene inference
overrule the label the track already carried. Explicit data now outranks inference.

The page itself was hero / Albums / Tracks — a generic list, for a product whose
fourth principle is Music Culture. It now carries an **ON FILE** liner-notes card:
the station and its ink, years active, tempo range, Camelot keys, spins, and how many
crates the artist sits in. Every line is read off the catalog. The file's existing
rule — "No generated copy" — still holds: no invented biographies, only facts the
crate already knows.

`src/lib/scenes.js`, `src/lib/genres.js` (new `displayGenre`),
`components/catalog/ArtistPage.jsx`

### Library printed the same number twice

"7 SINGLES / 7 TRACKS". "Singles" is a release format; the other stat was liked
tracks. Worse, it counted `savedTracks(…, 80)`, so anyone past 80 likes saw "80".
Now labelled **Liked**, counted uncapped.

`src/screens/FavoritesScreen.jsx`

---

## Test suite: 16 failures → 0

All 84 suites and 553 tests pass. Every failure was a real signal, not noise:

- **`nav.test.js`, `AppSidebar.test.js`, `HomeBroadcast.test.js`** (6) — encoded the
  intended dock IA the code had drifted from. Fixed by moving Club into the dock.
- **`ExploreScreen.test.js`, `ExplorePreview.test.js`** (4) — expected a "New Releases"
  tab and a "Mix" tab. Both were real gaps.
- **`ClubScreen.test.js`** (1) — demanded "Pace + dislike" in the guide while
  `featureGuide.test.js` demanded its *absence*. The removal was deliberate and newer;
  the Club assertion was stale.
- **`ui.test.js`** (1) — imported `TimedMixMark`, deleted when icons were consolidated.
- **`homeCollections.test.js`** (1) — **depended on the calendar.** `recommendedPicks`
  rotates on a `dayKey` seed defaulting to today; measured across 60 day keys it passes
  59, so it failed roughly one day in sixty. Seed pinned.
- **`engine.test.js`** (1, intermittent) — drew 80 weighted-random samples and required
  a bare majority. Measured true rate 57.2%, which flakes about one run in eight.
  Raised to 4,000 draws against a 53% floor; five consecutive clean runs.

The last two were latent time bombs that would have failed CI at random.

Also: every image logged a console error — `CoverImage` and `BrandGlyphs` passed
camelCase `fetchPriority`, which React 18 does not forward. The console is now
completely clean, so real errors are visible again.

---

## Open — your call, not mine

**The Pace slider is still unexplained.** The `Slow ── Fast` control sits on the Home
hero and the player with no label beyond "NEXT PICKS". The tour step that explained it
was deliberately removed (`featureGuide.test.js` pins its absence), so nothing teaches
it. Either the control needs a self-evident label or the guide step comes back.

**`y2k.cyan` is misleadingly named, not dead.** It resolves to `#5B6574` — graphite,
not cyan — and roughly twenty call sites depend on that (TasteTuner's whole selected
state, EnergyArc's gradient, the Set Builder). `App.test.js` pins the value, so the
greyness is deliberate and tested. Left alone. If the name bothers you, rename the
token; do not revalue it, or onboarding and the booth repaint themselves.

**Release years are missing from the catalog.** History stays hidden until they land.
Backfilling `year` during ingest turns a hidden tab into a whole discovery mode — the
highest-value data work available right now.

**The immersive player's right column is still sparse.** Up next now fills some of it
legibly, but the composition is a 520px sleeve beside a short readout. Worth a look
when you next touch the player.

---

## Verification

- **553/553 tests pass, 84/84 suites.** Baseline was 537 passing / 16 failing.
- `styleShip.test.js` passes — the steel chassis lock is intact, no retired palette
  values reintroduced.
- Contrast measured, not eyeballed — see the Legibility table.
- Browser console clean on every screen.
- `build/` regenerated, so Cloudflare Pages serves this pass.
