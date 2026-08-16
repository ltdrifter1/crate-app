# Channel Surfing dial map

Home **Channel Surfing** uses nine fixed dials (`src/lib/sceneChannels.js`).

| CH | Title | Match today | Source mapping |
|----|-------|-------------|----------------|
| 01 | Y2K Dance | Genre / house–garage–disco–trance scenes | **by genre** |
| 02 | Variety Mix | Curator `batch` (`variety-wave-N`) when set; else cross-genre mix | **curator** shelf / playlist |
| 03 | Local Pacific Northwest | PNW region/keywords + `batch` includes `audioasis` | **Audioasis** batch upload |
| 04 | Electronic | Techno/warehouse scenes + energy + `batch` includes `expansion` | **expansions** |
| 05 | Drum & Bass | DnB / jungle / liquid scenes | **by genre** |
| 06 | Emo & Shoegaze | Genre + emo/shoegaze keywords | **by genre** |
| 07 | Metal | `batch` includes `metal` (+ Metal genre / scene) | **metal** batch upload |
| 08 | Punk | `batch` includes `punk` (+ punk keywords) | **punk** batch upload |
| 09 | Country & Folk | `batch` includes `country-folk` / `country` / `folk` (+ genre) | **country-folk** batch upload |

## Batch uploads (Audioasis-style)

Set `batch` on each track (CSV column or Firestore field), same pattern as Audioasis:

| Channel | Example `batch` values |
|---------|------------------------|
| Variety Mix (CH-02) | `variety-wave-1`, `curator-wave-1` |
| Local PNW (CH-03) | `audioasis-wave-1`, `audioasis-wave-2` |
| Electronic (CH-04) | `expansions-wave-1` |
| Metal (CH-07) | `metal-wave-1`, `metal-wave-2` |
| Punk (CH-08) | `punk-wave-1`, `punk-wave-2` |
| Country & Folk (CH-09) | `country-folk-wave-1`, `country-wave-1`, `folk-wave-1` |

`upload-tracks.js` and Admin CSV import/export accept a `batch` column. Prefixes live in `CHANNEL_BATCH_PREFIXES`.
