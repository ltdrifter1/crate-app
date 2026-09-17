# Channel Surfing dial map

Home **Channel Surfing** uses fourteen fixed dials (`src/lib/sceneChannels.js`).

| CH | Title | Match today | Source mapping |
|----|-------|-------------|----------------|
| 01 | Y2K Dance | Genre / millennial house–garage–disco mix | **by genre** |
| 02 | Psychedelic Rock | Psych / acid / space-rock keywords + artists (not the whole Rock lane) | **by genre** |
| 03 | Variety Mix | Curator `batch` (`variety-wave-N`) when set; else cross-genre mix | **curator** shelf / playlist |
| 04 | Local | PNW region/keywords + `batch` includes `audioasis` | **Audioasis** batch upload — featured Home tile (larger broadcast bezel; pinned first when listing decorated dials) |
| 05 | House | House / deep / tech-house / disco scenes | **by genre** |
| 06 | Techno | `batch` includes `expansion` / `techno`, else techno–warehouse scenes | **expansions** (was Electronic) |
| 07 | UK Garage | UKG / 2-step / broken-beat | **by genre** |
| 08 | Dubstep | Dubstep keywords + UK bass artists (not a 140bpm dump) | **by genre** |
| 09 | Drum & Bass | DnB / jungle / liquid scenes | **by genre** |
| 10 | Emo & Shoegaze | Genre + emo/shoegaze keywords | **by genre** |
| 11 | Metal | `batch` includes `metal` (+ Metal genre / scene) | **metal** batch upload |
| 12 | Punk | `batch` includes `punk` (+ punk keywords) | **punk** batch upload |
| 13 | Country & Folk | `batch` includes `country-folk` / `country` / `folk` (+ genre) | **country-folk** batch upload |
| 14 | Ambient / Downtempo | Downtempo / trip-hop / ambient scenes | **by genre** |

Electronic (the old catch-all CH-04) is split into House, Techno, UK Garage, Dubstep, Drum & Bass, and Ambient / Downtempo. Y2K Dance stays as the millennial floor mix. Saved station id `electronic-underground` still tunes Techno.

## Batch uploads (Audioasis-style)

Set `batch` on each track (CSV column or Firestore field), same pattern as Audioasis:

| Channel | Example `batch` values |
|---------|------------------------|
| Variety Mix (CH-03) | `variety-wave-1`, `curator-wave-1` |
| Local (CH-04) | `audioasis-wave-1`, `audioasis-wave-2` |
| House (CH-05) | `house-wave-1` |
| Techno (CH-06) | `expansions-wave-1`, `techno-wave-1` |
| UK Garage (CH-07) | `ukg-wave-1`, `uk-garage-wave-1` |
| Dubstep (CH-08) | `dubstep-wave-1` |
| Psychedelic Rock (CH-02) | `psych-wave-1`, `psychedelic-wave-1` |
| Metal (CH-11) | `metal-wave-1`, `metal-wave-2` |
| Punk (CH-12) | `punk-wave-1`, `punk-wave-2` |
| Country & Folk (CH-13) | `country-folk-wave-1`, `country-wave-1`, `folk-wave-1` |
| Ambient / Downtempo (CH-14) | `downtempo-wave-1` |

`upload-tracks.js` and Admin CSV import/export accept a `batch` column. Prefixes live in `CHANNEL_BATCH_PREFIXES`.
