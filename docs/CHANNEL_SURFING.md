# Channel Surfing dial map

Home **Channel Surfing** uses ten fixed dials (`src/lib/sceneChannels.js`).

Membership is `track.batch` / `track.source` (wave tags) plus scene/keyword fallbacks. Live Firestore rows uploaded before the CSV `batch` column have **no tag** — use Admin import or `scripts/backfill-channel-batch.js` with `tracks.csv`.

| CH | Title | Batch prefixes | Fallback if no batch |
|----|-------|----------------|----------------------|
| 01 | Y2K Dance | `y2k-wave`, `y2k-dance-wave` | House / garage / disco / trance scenes (not the whole Electronic lane) |
| 02 | Variety Mix | `variety-wave`, `variety-mix`, `curator-wave` | Cross-genre pad when no curator tags exist |
| 03 | Local PNW | `audioasis` | PNW region flags, artist/location cities, live/venue context — featured Home tile |
| 04 | Electronic | `expansions-wave`, `expansion-wave`, `expansions` | Techno / warehouse / industrial / acid scenes only (strict, no catalog pad) |
| 05 | Drum & Bass | `dnb-wave`, `drum-and-bass-wave`, `jungle-wave` | DnB / jungle / liquid / breakbeat scenes |
| 06 | Emo & Shoegaze | `shoegaze-wave`, `emo-wave` | Emo/shoegaze genre + keywords |
| 07 | Metal | `metal-wave` | Metal genre / scene |
| 08 | Punk | `punk-wave` | Punk keywords (not “Daft Punk”) |
| 09 | Country & Folk | `country-folk-wave`, `country-wave`, `folk-wave` | Country & Folk genre |
| 10 | Downtempo | `downtempo-wave`, `trip-hop-wave` | Trip-hop / ambient / chill scenes |

## Batch uploads

Set `batch` on each track (CSV column or Firestore field). Use a **wave token**, not a bare word (`metal-wave-1`, not `metal`), so prefixes do not collide.

| Channel | Example `batch` values |
|---------|------------------------|
| Y2K Dance (CH-01) | `y2k-wave-1` |
| Variety Mix (CH-02) | `variety-wave-1`, `curator-wave-1` |
| Local PNW (CH-03) | `audioasis-wave-1`, `audioasis-wave-2` |
| Electronic (CH-04) | `expansions-wave-1` |
| Drum & Bass (CH-05) | `dnb-wave-1`, `jungle-wave-1` |
| Emo & Shoegaze (CH-06) | `shoegaze-wave-1`, `emo-wave-1` |
| Metal (CH-07) | `metal-wave-1` |
| Punk (CH-08) | `punk-wave-1` |
| Country & Folk (CH-09) | `country-folk-wave-1`, `country-wave-1`, `folk-wave-1` |
| Downtempo (CH-10) | `downtempo-wave-1` |

`upload-tracks.js` writes `batch` on create and **patches** `batch` / `genre` / `source` on existing title+artist matches. Admin CSV import/export accepts the same column. Prefixes live in `CHANNEL_BATCH_PREFIXES`.

Store a **culture label** in `genre` (Techno, UK Garage, Drum and Bass). The app still maps those to the 11 taste lanes; Channel Surfing scenes read the specific string. `normalize-genres.js` no longer collapses those labels into Electronic/Rock/etc.
