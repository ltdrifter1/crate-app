# Crate prep tools

Scripts for cleaning an MP3 folder and getting it into the crate app.
Run them from anywhere — they resolve their own imports.

Requires: `pip install mutagen pillow requests`

---

## The reusable ones

These take a folder argument and work on any crate:

| Script | What it does |
|---|---|
| `crate_audit.py "<folder>"` | Read-only. Tags, genre, artwork, Mixed In Key data, duplicates, probable junk. Writes `<name>.json` + `<name>_dupes.json`. **Always run this first.** |
| `crate_art.py "<folder>"` | Fetches real album art and embeds it. iTunes → Deezer → MusicBrainz. Resumable. Add `--test 40` for a random sample first. |

## Shared modules (don't run directly)

| File | Purpose |
|---|---|
| `fetch_art.py` | iTunes search + strict artist/title matching + image download |
| `fetch_art2.py` | Query variant generation, title cleaning |
| `deezer.py` | Deezer source |
| `mb_fallback.py` | MusicBrainz + Cover Art Archive source |

## Genre maps — these accumulate

| File | Crate | Default |
|---|---|---|
| `genres.py` | evie | Rock |
| `ramos_genres.py` | Ramos | Electronic |
| `promb_genres.py` | PromB | Hip-Hop |
| `morgan_genres.py` | Morgan | Rock |
| `audioasis_genres.py` | audioasis | Rock |

**Each new crate reuses all the earlier maps**, so coverage improves over time —
audioasis matched 714 tracks from the previous four crates before adding its own.
A new crate needs a new `<name>_genres.py` listing only the artists that differ
from its default.

## Per-crate prep (templates for the next folder)

`audioasis_prep.py`, `morgan_prep.py`, `promb_prep.py` — clean titles, recover
artists, write genre tags, quarantine junk/duplicates. Copy the closest one and
adjust the paths, default genre and junk list.

---

## Standard order for a new folder

```
python tools/crate_audit.py "E:\04_MP3_Library\<folder>"
# review output, write <name>_genres.py, adapt a *_prep.py
python tools/<name>_prep.py --commit
python tools/crate_art.py "E:\04_MP3_Library\<folder>"
python build-crate-from-folder.py "E:\04_MP3_Library\<folder>"
node upload-tracks.js
```

## Things learned the hard way

- **Every script defaults to a dry run.** Pass `--commit` / `--apply` to write.
- **Keyword junk detection produces false positives.** `Advertisement`,
  `Bad News Botanists`, `World News` and `Windchime Weather` are real bands;
  `Built To Spill - The Weather` is a real song. Always hand-check the flags
  before deleting anything.
- **Artist matching must stay strict, title matching can be fuzzy.** Loosening
  the artist check makes iTunes return a different album by the same artist —
  that's how Tame Impala's "'Cause I'm A Man" nearly got *The Slow Rush* art
  instead of *Currents*.
- **Fetched art must be square and ≥300px**, or you just swap one video
  thumbnail for another.
- **Test on a random sample, not the first N.** Alphabetical head samples
  over-estimated a match rate by 3x once.
- **Mixed In Key writes** `TKEY` (Camelot), `TBPM`, and `TXXX:EnergyLevel`.
  `mutagen`'s `easy=True` view exposes none of them — read raw ID3.
- `build-crate-from-folder.py` **copies** audio into `crate-app/audio`. Run
  `node prune-uploaded-audio.js --apply` afterwards to reclaim the space once
  the files are safely in Storage.
