# Channel Surfing dial map

Home **Channel Surfing** uses nine fixed dials (`src/lib/sceneChannels.js`).

| CH | Title | Match today | Source mapping (later) |
|----|-------|-------------|------------------------|
| 01 | Y2K Dance | Genre / house–garage–disco–trance scenes | **by genre** |
| 02 | Variety Mix | Full-shelf variety pad | **curator** shelf / playlist |
| 03 | Local Pacific Northwest | PNW region/keywords (+ `audioasis` batch hint) | **Audioasis** batch upload |
| 04 | Electronic | Techno/warehouse scenes + energy (+ `expansions` batch hint) | **expansions** |
| 05 | Drum & Bass | DnB / jungle / liquid scenes | **by genre** |
| 06 | Emo & Shoegaze | Genre + emo/shoegaze keywords | **by genre** |
| 07 | Metal | Metal genre / metal scene / keywords | **by genre** |
| 08 | Punk | Punk keywords (punk normalizes into Rock) | **by genre** |
| 09 | Country & Folk | Country & Folk genre / folk scene / keywords | **by genre** |

When curator / Audioasis / expansions metadata lands on tracks (`curator`, `batch`, `source`, etc.), tighten CH-02/03/04 to those sources and stop soft pads where noted in `CHANNEL_SOURCE_NOTES`.
