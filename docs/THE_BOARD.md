# The Board — Charts page and Home Top 5

**What it is.** A broadcast countdown, not a leaderboard: huge condensed rank numerals, a station-ink
stripe on every row, a ten-step heat meter, one vote key, and a red-square crawl. Charts and Home share
one row language, so the five rows on Home *are* the top of the Charts page.

**Where it lives**

| Surface | Component | Notes |
|---|---|---|
| Home, below Channel Surfing | `components/home/HomeBoard.jsx` | Top 5, request key, *Full chart*, *Play the countdown* |
| Charts page | `components/station/ChartsScreen.jsx` | masthead, crawl, scoreboard |
| Charts body | `components/station/ChartHistoryPanel.jsx` | views, scope, NO. 1, posters, list |
| Shared atoms | `components/station/BoardParts.jsx` | numeral, movement stamp, heat meter, request key, CH bug, `BoardRow` |
| Features | `components/station/BoardFeature.jsx` | `BoardLead` (NO. 1), `BoardPodiumCard` (#2/#3), skeleton, empty |
| Logic | `lib/board.js` | ink per track, heat, stats, crawl — pure, tested |
| Styles | `index.css` → `.pmp-board-*`, `.pmp-chart-podium` | |

**Why the chart sits *below* Channel Surfing.** Today (what's on) and Channel Surfing (change the
channel) are a pair: the schedule gives context, the dial is the action, and it's where the colour is.
The countdown is the programme you land on after you've picked a station, and its vertical list breaks
two horizontal rails in a row before Recents.

## The rules

- **Ink = identity.** Each row's stripe, heat meter and CH bug use the colour of the dial channel the
  track sits on (`channelForTrack` — the same classifier the stations use). Pick a channel on the
  Charts page and the whole board turns that station's colour. Tracks no station claims get neutral silver.
- **Red = live.** The only red on the Board is the crawl's square separators, the live pip, and the
  row that is playing right now (three-bar meter, red stripe).
- **One semantic colour.** A track that climbed is green (`CLIMB_GREEN`). Falling is quiet grey.
- **Type does the work.** Barlow Condensed 800 for numerals and titles; Outfit for artists; Plex Mono
  for firmware (BPM · key, counts, labels). The #1 numeral is a misregistered print — pearl over an
  offset ink plate. #2/#3 are outlined, cut into the sleeve.
- **Only real numbers.**
  - Heat = the station's own score (requests ×12, plays ×1.4, likes ×3.2) relative to the hottest row.
  - The scoreboard counts what's on the board; *Climbing* and *New* show `–` until there is a
    previous board to compare to (`enrichCountdownWithHistory` returns `movement: "none"` rather than
    calling every row a debut).
  - The old "N locked in" estimate was removed everywhere (Charts, player booth, station heat bar) and
    replaced with the track's actual request and play counts.

## Behaviour that was kept

Views (This month · Climbers · #1s · Past days), scopes (Overall · Channel · Genre), *Play this chart*,
add-to-queue (`+` on wide screens; **Add to queue** in the row menu on phones), the row `⋯` menu,
right-click menu, now-playing highlight, archive, empty/loading states, reduced-motion.

**New:** the request key on every live row (`playlistCtx.onRequest` / `hasRequested`) and *Add to
queue* in the shared track menu.

## Screens

`docs/audits/design-audit-2026-10/` — `06` before → after (phone), `07` channel scope / climbers /
number ones, `08` Home, `09` desktop.

## Previewing

`npm start` → `localhost:3000/#site-preview` → **Charts** (a yesterday board is seeded so you see
climbers, fallers and a debut), and `#broadcast-preview` for Home.

## Known limits

- Request writes `requestCount` from the browser; see `docs/DESIGN_AUDIT_2026-10.md` for the rules caveat.
- Movement is vs the previous day's snapshot, which is stored per browser (`localStorage`), not
  server-side. A new visitor has no history, so they see no arrows — by design.
- The preview sleeves are flat colour placeholders; real cover art will change how the numerals read
  over the poster corners. Check #2/#3 on pale covers.
