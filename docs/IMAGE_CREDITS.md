# Image credits

Planet MP3 Channel Surfing tiles are **PS1-style pixel plates** on brushed aluminum — small 256px PNGs served from `/channels/` so Home Channel Surfing paints without fetching album sleeves.

Style: dithered 1-bit silhouettes on steel, matching the inserted PS1 / iTunes-genre set. No photographs, no type burned into the artwork.

**Not in this set:** catalog album covers from Firebase, brand lockups/mascot (original drawings), or user-uploaded art.

**Not used:** Mixmag, XLR8R, DJ Mag, MTV, Rolling Stone, or any magazine/TV page scans. Those titles are copyrighted. Channel art does not reproduce the MTV logo or any third-party mark.

## License summary

| Source | License | Commercial app UI | Attribution |
|--------|---------|-------------------|-------------|
| Split plates from the PS1 genre insert (Pop, Rock, Metal, Punk, Reggae vinyl, Electronic) | Original product art | Yes | Planet MP3 |
| Additional plates (House, Local, UK Garage, Dubstep, Drum & Bass, Shoegaze, Country & Folk, Downtempo) | Original PS1-style plates | Yes | Planet MP3 |
| Steel plates | Original compositing in this repo | Yes | Planet MP3 |

## Channel Surfing

| Slot | File | Drawing |
|------|------|--------|
| CH-01 Y2K Dance | `y2k-dance.png` | Pixel iPod + notes (Pop plate) |
| CH-02 Psychedelic Rock | `psychedelic-rock.png` | Pixel guitar + bolt (Rock plate) |
| CH-03 Variety Mix | `variety-mix.png` | Vinyl + palm (mix crate) |
| CH-04 Local | `local-pnw.png` | Pine + radio tower |
| CH-05 House | `house.png` | House + disco ball |
| CH-06 Techno | `techno.png` | CPU with planet (Electronic plate) |
| CH-07 UK Garage | `uk-garage.png` | Mic + record |
| CH-08 Dubstep | `dubstep.png` | Bass cab + bolt |
| CH-09 Drum & Bass | `drum-and-bass.png` | Drum kit |
| CH-10 Emo & Shoegaze | `shoegaze.png` | Guitar in haze |
| CH-11 Metal | `metal.png` | Horned skull |
| CH-12 Punk | `punk.png` | Mohawk + anarchy |
| CH-13 Country & Folk | `country-folk.png` | Acoustic guitar + hat |
| CH-14 Ambient / Downtempo | `downtempo.png` | Headphones + moon |

Files live in `public/channels/` (copied to `src/assets/channels/` for the repo). Home tiles request the public URL, not a webpack image graph.

## Home idle hero

| Slot | File | Notes |
|------|------|--------|
| Idle hero (no sleeve yet) | `src/assets/editorial/hero-idle.png` | `audio-cassette` on steel |

The brand lockup still sits on top of this frame. Once a catalog track is on air, the hero uses that track’s cover — not this icon.

## Explore

Explore does not add new artwork. Genre mosaic, mood plates, and scene rail use catalog sleeves. Channel Surfing on Home (and the Stations rail on Explore) uses the PS1 plates above.

## Charts

Charts rows and the #1 hero sleeve are **catalog covers** (Firebase). Explore no longer hosts a Most Requested teaser.

## Brand chrome (unchanged)

`public/brand/*`, `public/favicon*`, `public/icon-*`, and `public/assets/premium-planet-placeholder.png` are original Planet MP3 marks / simple illustration, not stock photography.
