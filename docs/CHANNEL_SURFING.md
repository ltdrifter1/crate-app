# Channel Surfing dial map

Home **Channel Surfing** uses thirteen fixed dials (`src/lib/sceneChannels.js`).

| CH | Title | Match today | Source mapping |
|----|-------|-------------|----------------|
| 01 | Y2K Dance | Genre / millennial house–garage–disco mix | **by genre** |
| 02 | Variety Mix | Curator `batch` (`variety-wave-N`) when set; else cross-genre mix | **curator** shelf / playlist |
| 03 | Local | PNW region/keywords + `batch` includes `audioasis` | **Audioasis** batch upload — featured Home tile (larger broadcast bezel; pinned first when listing decorated dials) |
| 04 | House | House / deep / tech-house / disco scenes | **by genre** |
| 05 | Techno | `batch` includes `expansion` / `techno`, else techno–warehouse scenes | **expansions** (was Electronic) |
| 06 | UK Garage | UKG / 2-step / broken-beat | **by genre** |
| 07 | Dubstep | Dubstep keywords + UK bass artists (not a 140bpm dump) | **by genre** |
| 08 | Drum & Bass | DnB / jungle / liquid scenes | **by genre** |
| 09 | Emo & Shoegaze | Genre + emo/shoegaze keywords | **by genre** |
| 10 | Metal | `batch` includes `metal` (+ Metal genre / scene) | **metal** batch upload |
| 11 | Punk | `batch` includes `punk` (+ punk keywords) | **punk** batch upload |
| 12 | Country & Folk | `batch` includes `country-folk` / `country` / `folk` (+ genre) | **country-folk** batch upload |
| 13 | Ambient / Downtempo | Downtempo / trip-hop / ambient scenes | **by genre** |

Electronic (the old catch-all CH-04) is split into House, Techno, UK Garage, Dubstep, Drum & Bass, and Ambient / Downtempo. Y2K Dance stays as the millennial floor mix. Saved station id `electronic-underground` still tunes Techno.

## Batch uploads (Audioasis-style)

Set `batch` on each track (CSV column or Firestore field), same pattern as Audioasis:

| Channel | Example `batch` values |
|---------|------------------------|
| Variety Mix (CH-02) | `variety-wave-1`, `curator-wave-1` |
| Local (CH-03) | `audioasis-wave-1`, `audioasis-wave-2` |
| House (CH-04) | `house-wave-1` |
| Techno (CH-05) | `expansions-wave-1`, `techno-wave-1` |
| UK Garage (CH-06) | `ukg-wave-1`, `uk-garage-wave-1` |
| Dubstep (CH-07) | `dubstep-wave-1` |
| Metal (CH-10) | `metal-wave-1`, `metal-wave-2` |
| Punk (CH-11) | `punk-wave-1`, `punk-wave-2` |
| Country & Folk (CH-12) | `country-folk-wave-1`, `country-wave-1`, `folk-wave-1` |
| Ambient / Downtempo (CH-13) | `downtempo-wave-1` |

`upload-tracks.js` and Admin CSV import/export accept a `batch` column. Prefixes live in `CHANNEL_BATCH_PREFIXES`.
