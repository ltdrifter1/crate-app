"""Read a folder of audio and write a run manifest. Copies NOTHING and never
edits your original files.

  python ingest/prep.py "<folder>" <channel-id> [--no-discogs]

Writes ingest/runs/<timestamp>/manifest.json and prints its path on the last line.
Covers embedded in the files are extracted into ingest/cache/covers/.
"""
import argparse
import importlib.util
import json
import os
import re
import sys
import unicodedata
from datetime import datetime
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.insert(0, str(ROOT))

# Reuse the tested tag/title/MIK helpers from the existing folder script.
_spec = importlib.util.spec_from_file_location("bcff", ROOT / "build-crate-from-folder.py")
bcff = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(bcff)

from mutagen import File  # noqa: E402

COVER_CACHE = HERE / "cache" / "covers"
AUDIO_EXTS = {".mp3", ".m4a", ".wav", ".flac"}

# Default genre only when nothing else identifies the track. Flagged in the preview.
CHANNEL_DEFAULT_GENRE = {
    "y2k-dance": "Electronic", "house": "Electronic", "techno": "Electronic",
    "uk-garage": "Electronic", "dubstep": "Electronic", "drum-and-bass": "Electronic",
    "downtempo": "Electronic", "psychedelic-rock": "Rock", "shoegaze": "Rock",
    "punk": "Rock", "metal": "Metal", "country-folk": "Country & Folk",
}

JUNK = re.compile(
    r"\bted\s*x|\btedx|interview|podcast|trailer|\bepisode\b|unboxing|reaction|"
    r"\breview\b|tutorial|full match|highlights|press conference|"
    r"\.avi\b|\.mp4\b|sound effect|air horn|asmr|how to |vlog|"
    r"commercial|advert|\bnews\b|weather|lecture|sermon|audiobook", re.I)
# Real acts/songs the keyword list wrongly hits (see tools/README.md).
JUNK_OK = re.compile(
    r"advertisement|bad news botanists|world news|windchime weather|the weather", re.I)


def fold(s):
    s = unicodedata.normalize("NFKD", (s or "").lower())
    s = "".join(c for c in s if not unicodedata.combining(c))
    return re.sub(r"\s+", " ", s).strip()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("folder")
    ap.add_argument("channel")
    ap.add_argument("--no-discogs", action="store_true")
    args = ap.parse_args()

    src = Path(args.folder)
    files = sorted(p for p in src.rglob("*") if p.suffix.lower() in AUDIO_EXTS)
    if not files:
        print(f"No audio files found in {src}")
        sys.exit(1)

    amap = json.loads((HERE / "artist_genres.json").read_text(encoding="utf-8"))
    default_genre = CHANNEL_DEFAULT_GENRE.get(args.channel, "")
    COVER_CACHE.mkdir(parents=True, exist_ok=True)

    rows, seen_names, seen_files = [], set(), set()
    print(f"Scanning {len(files)} file(s) in {src}")
    for i, path in enumerate(files, 1):
        audio = File(path, easy=True)
        if audio is None:
            continue
        g = lambda k: (audio.get(k, [""])[0] or "").strip()  # noqa: E731
        title, artist, album, genre_raw, bpm = g("title"), g("artist"), g("album"), g("genre"), g("bpm")
        energy, camelot, mik_bpm = bcff.read_mik_fields(path)
        bpm = mik_bpm or bpm

        title = bcff.DJ_SUFFIX_RE.sub("", bcff.strip_leading_number_prefix(title)).strip()
        stem = bcff.DJ_SUFFIX_RE.sub("", path.stem).strip()
        if not artist:
            a, t = bcff.split_artist_title_from_title(title or stem)
            if a:
                artist, title = a, t
        title = title or bcff.strip_leading_number_prefix(stem) or stem
        artist = artist or "Unknown"

        # genre: known artist -> file tag -> (Discogs) -> channel default
        key = fold(artist)
        genre, source = amap.get(key) or (amap.get(key[4:]) if key.startswith("the ") else None), "artist-map"
        if not genre:
            genre, source = bcff.map_genre(genre_raw), "tag"
        if not genre and not args.no_discogs:
            genre, source = bcff.discogs_lookup_genre(artist, title), "discogs"
        if not genre:
            genre, source = default_genre, ("channel-default" if default_genre else "none")

        base = bcff.sanitize_filename(f"{artist}-{title}").lower()
        audio_file = base + path.suffix.lower()
        n = 2
        while audio_file in seen_files:
            audio_file = f"{base}-{n}{path.suffix.lower()}"
            n += 1
        seen_files.add(audio_file)

        cover_file = Path(audio_file).stem + ".jpg"
        cover_path = COVER_CACHE / cover_file
        if not (cover_path.exists() or bcff.extract_cover(path, cover_path)):
            cover_file = ""

        flags = []
        blob = f"{title} {artist} {path.name}"
        if JUNK.search(blob) and not JUNK_OK.search(blob):
            flags.append("junk")
        name_key = f"{bcff.norm(title)}|||{bcff.norm(artist)}"
        if name_key in seen_names:
            flags.append("dupe-in-folder")
        seen_names.add(name_key)

        rows.append({
            "title": title, "artist": artist, "album": album, "genre": genre,
            "genreSource": source, "energy": energy, "camelot": camelot, "bpm": bpm,
            "audioFile": audio_file, "audioPath": str(path),
            "coverFile": cover_file, "coverPath": str(cover_path) if cover_file else "",
            "color": bcff.DEFAULT_COLOR, "flags": flags,
        })
        if i % 25 == 0 or i == len(files):
            print(f"  {i}/{len(files)}")

    bcff.save_cache(bcff.discogs_cache)
    run_dir = HERE / "runs" / datetime.now().strftime("%Y%m%d-%H%M%S")
    run_dir.mkdir(parents=True)
    manifest = run_dir / "manifest.json"
    manifest.write_text(json.dumps({"channel": args.channel, "source": str(src), "rows": rows},
                                   ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"MANIFEST {manifest}")


if __name__ == "__main__":
    main()
