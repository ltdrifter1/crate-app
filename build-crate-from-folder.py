"""
build-crate-from-folder.py
─────────────────────────────────────────────────────────────────────────────
Prep an entire local folder of audio files for `node upload-tracks.js`,
no M3U playlist needed.

USAGE (Windows example):
    python build-crate-from-folder.py "E:\\04_MP3_Library\\Ramos Jan 2025 - Mar 26"

What it does:
    1. Recursively finds audio files (.mp3 .m4a .wav .flac) in the folder
    2. Reads tags (title / artist / album / genre / bpm) with mutagen
    3. Cleans titles (strips "01 -" prefixes, splits "Artist - Title")
    4. Extracts embedded cover art to covers/
    5. Copies audio to audio/ with safe filenames
    6. Appends rows to tracks.csv (creates it with a header if missing),
       skipping anything already listed in tracks.csv

Then run:  node upload-tracks.js   (dedupes again against Firestore/Storage)

Optional: set DISCOGS_TOKEN in your environment to gap-fill blank genres.
Requires:  pip install mutagen pillow requests
"""

import argparse
import csv
import io
import json
import os
import re
import shutil
import sys
import time
from pathlib import Path
from urllib.parse import quote

from mutagen import File
from mutagen.id3 import ID3
from PIL import Image

try:
    import requests
except ImportError:
    requests = None

# ===== CONFIG =====
APP_ROOT = Path(__file__).resolve().parent
AUDIO_DIR = APP_ROOT / "audio"
COVERS_DIR = APP_ROOT / "covers"
CSV_PATH = APP_ROOT / "tracks.csv"

DEFAULT_COLOR = "#9090b0"
AUDIO_EXTS = {".mp3", ".m4a", ".wav", ".flac"}

DISCOGS_TOKEN = os.getenv("DISCOGS_TOKEN", "").strip()
CACHE_PATH = APP_ROOT / "discogs_cache.json"
REQUEST_DELAY_SEC = 1.2
# ==================

CSV_HEADER = ["title", "artist", "album", "genre", "energy", "camelot", "bpm",
              "audioFile", "coverFile", "color", "uploadBatch"]

# Stamped onto every row so channels can filter by ingest batch
# (CH-04 Local plays only uploadBatch == "audioasis").
# Set with --batch <name>, or UPLOAD_BATCH in the environment.
UPLOAD_BATCH = os.getenv("UPLOAD_BATCH", "").strip()


def sanitize_filename(name: str) -> str:
    name = (name or "").replace(",", "")
    name = re.sub(r"[^\w\- ]+", "", name)
    name = re.sub(r"\s+", " ", name).strip().replace(" ", "-")
    return name


def strip_leading_number_prefix(s: str) -> str:
    if not s:
        return s
    return re.sub(r"^\s*\d{1,4}\s*[\.\-\)\:–—_]+\s*", "", s).strip()


# ── Mixed In Key fields ───────────────────────────────────────────────────
# MIK writes: TKEY = Camelot ("10A"), TBPM = bpm, TXXX:EnergyLevel = 1-10.
# mutagen's easy=True view exposes none of TKEY/TXXX, so read raw ID3.
# Some libraries instead carry "Artist - Title - 8A - 126" in the filename;
# that is used as a fallback.

CAMELOT_RE = re.compile(r"^\s*(\d{1,2})\s*([ABab])\s*$")
DJ_SUFFIX_RE = re.compile(r"\s*-\s*(\d{1,2}[ABab])\s*-\s*(\d{2,3})\s*$")

# musical key -> Camelot, in case TKEY holds "Abm" / "F#" rather than "10A"
_CAMELOT_FROM_KEY = {
    "abm": "1A", "g#m": "1A", "b": "1B", "ebm": "2A", "d#m": "2A", "f#": "2B",
    "gb": "2B", "bbm": "3A", "a#m": "3A", "db": "3B", "c#": "3B", "fm": "4A",
    "ab": "4B", "g#": "4B", "cm": "5A", "eb": "5B", "d#": "5B", "gm": "6A",
    "bb": "6B", "a#": "6B", "dm": "7A", "f": "7B", "am": "8A", "c": "8B",
    "em": "9A", "g": "9B", "bm": "10A", "d": "10B", "f#m": "11A",
    "gbm": "11A", "a": "11B", "c#m": "12A", "dbm": "12A", "e": "12B",
}


def _norm_camelot(v: str) -> str:
    if not v:
        return ""
    m = CAMELOT_RE.match(v)
    if m:
        n = int(m.group(1))
        if 1 <= n <= 12:
            return f"{n}{m.group(2).upper()}"
        return ""
    return _CAMELOT_FROM_KEY.get(v.strip().lower().replace(" ", ""), "")


def read_mik_fields(path: Path):
    """Return (energy, camelot, bpm) as strings; '' when unavailable."""
    energy = camelot = bpm = ""
    try:
        tags = ID3(str(path))

        def txt(frame):
            v = tags.get(frame)
            try:
                return str(v.text[0]).strip() if (v and v.text) else ""
            except Exception:
                return ""

        camelot = _norm_camelot(txt("TKEY"))
        bpm = txt("TBPM")

        for k, v in tags.items():
            if k.startswith("TXXX") and getattr(v, "desc", "").lower() in (
                "energylevel", "energy level", "energy"
            ):
                try:
                    energy = str(v.text[0]).strip()
                except Exception:
                    pass
                break

        # MIK sometimes mirrors Camelot into the comment
        if not camelot:
            for k, v in tags.items():
                if k.startswith("COMM"):
                    try:
                        camelot = _norm_camelot(str(v.text[0]).strip())
                    except Exception:
                        pass
                    break
    except Exception:
        pass

    # fallback: "... - 8A - 126.mp3" in the filename
    if not camelot or not bpm:
        m = DJ_SUFFIX_RE.search(path.stem)
        if m:
            camelot = camelot or _norm_camelot(m.group(1))
            bpm = bpm or m.group(2)

    if bpm:
        try:
            b = round(float(bpm))
            bpm = str(b) if 30 <= b <= 300 else ""
        except Exception:
            bpm = ""
    if energy:
        try:
            e = int(round(float(energy)))
            energy = str(e) if 1 <= e <= 10 else ""
        except Exception:
            energy = ""
    return energy, camelot, bpm


def split_artist_title_from_title(raw_title: str):
    if not raw_title:
        return None, raw_title
    t = strip_leading_number_prefix(raw_title)
    t_norm = t.replace("—", "-").replace("–", "-")
    m = re.match(r"^\s*(?P<artist>.+?)\s*-\s*(?P<title>.+?)\s*$", t_norm)
    if m:
        return m.group("artist").strip(), m.group("title").strip()
    m = re.match(r"^\s*(?P<artist>.+?)\s*:\s*(?P<title>.+?)\s*$", t_norm)
    if m:
        return m.group("artist").strip(), m.group("title").strip()
    return None, t.strip()


def norm(s: str) -> str:
    return re.sub(r"\s+", " ", (s or "").strip()).lower()


# Store specific culture labels; upload-tracks.js normalizes to the 11 lanes.
GENRE_KEYWORDS = [
    ("drum & bass", "Drum and Bass"),
    ("drum and bass", "Drum and Bass"),
    ("dnb", "Drum and Bass"),
    ("jungle", "Drum and Bass"),
    ("uk garage", "UK Garage"),
    ("2-step", "UK Garage"),
    ("2step", "UK Garage"),
    ("garage", "UK Garage"),
    ("hip hop", "Hip-Hop"),
    ("hip-hop", "Hip-Hop"),
    ("rap", "Hip-Hop"),
    ("boom bap", "Hip-Hop"),
    ("trap", "Trap"),
    ("grime", "Grime"),
    ("deep house", "Deep House"),
    ("house", "House"),
    ("techno", "Techno"),
    ("ambient", "Ambient"),
    ("amapiano", "Amapiano"),
    ("r&b", "R&B"),
    ("rnb", "R&B"),
    ("neo soul", "Neo-Soul"),
    ("soul", "Soul"),
    ("funk", "Funk"),
    ("jazz", "Jazz"),
    ("blues", "Blues"),
    ("afrobeat", "Afrobeats"),
    ("k-pop", "K-Pop"),
    ("pop", "Pop"),
    ("country", "Country"),
    ("folk", "Folk"),
    ("metal", "Metal"),
    ("punk", "Punk"),
    ("indie", "Indie Rock"),
    ("alternative", "Alternative"),
    ("rock", "Rock"),
    ("classical", "Classical"),
    ("orchestral", "Classical"),
    ("soundtrack", "Soundtrack"),
    ("reggaeton", "Reggaeton"),
    ("dancehall", "Dancehall"),
    ("dub", "Dub"),
    ("reggae", "Reggae"),
    ("salsa", "Salsa"),
    ("latin", "Latin"),
]


def map_genre(raw_genre: str) -> str:
    g = norm(raw_genre)
    if not g:
        return ""
    for key, target in GENRE_KEYWORDS:
        if key in g:
            return target
    # Keep whatever specific label the file already had
    return raw_genre.strip()


def load_cache():
    if CACHE_PATH.exists():
        try:
            return json.loads(CACHE_PATH.read_text(encoding="utf-8"))
        except Exception:
            return {}
    return {}


def save_cache(cache: dict):
    CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")


discogs_cache = load_cache()


def discogs_lookup_genre(artist: str, title: str) -> str:
    if requests is None or not DISCOGS_TOKEN:
        return ""
    key = f"{artist}|||{title}".lower().strip()
    if key in discogs_cache:
        return discogs_cache[key]
    headers = {"User-Agent": "crate-app-folder-ingest/1.0",
               "Authorization": f"Discogs token={DISCOGS_TOKEN}"}
    try:
        time.sleep(REQUEST_DELAY_SEC)
        q = quote(f"{artist} {title}".strip())
        r = requests.get(f"https://api.discogs.com/database/search?q={q}&type=release&per_page=1",
                         headers=headers, timeout=20)
        r.raise_for_status()
        results = r.json().get("results") or []
        if not results:
            discogs_cache[key] = ""
            return ""
        time.sleep(REQUEST_DELAY_SEC)
        r = requests.get(f"https://api.discogs.com/releases/{results[0]['id']}",
                         headers=headers, timeout=20)
        r.raise_for_status()
        rel = r.json()
        combined = " ".join([*(rel.get("genres") or []), *(rel.get("styles") or [])])
        mapped = map_genre(combined)
        discogs_cache[key] = mapped
        return mapped
    except Exception:
        discogs_cache[key] = ""
        return ""


def extract_cover(audio_path: Path, cover_output_path: Path) -> bool:
    # MP3 embedded art (ID3 APIC)
    try:
        tags = ID3(audio_path)
        for tag in tags.values():
            if getattr(tag, "FrameID", "") == "APIC":
                image = Image.open(io.BytesIO(tag.data))
                image.convert("RGB").save(cover_output_path, format="JPEG")
                return True
    except Exception:
        pass
    # MP4/M4A/FLAC embedded art via mutagen generic
    try:
        f = File(audio_path)
        pics = getattr(f, "pictures", None)
        if pics:
            image = Image.open(io.BytesIO(pics[0].data))
            image.convert("RGB").save(cover_output_path, format="JPEG")
            return True
        covr = f.tags.get("covr") if f and f.tags else None
        if covr:
            image = Image.open(io.BytesIO(bytes(covr[0])))
            image.convert("RGB").save(cover_output_path, format="JPEG")
            return True
    except Exception:
        pass
    return False


def load_existing_csv():
    """Return (rows, set of audioFile names, set of title|artist keys)."""
    if not CSV_PATH.exists():
        return set(), set()
    audio_files, name_keys = set(), set()
    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            if row.get("audioFile"):
                audio_files.add(row["audioFile"].strip())
            name_keys.add(f"{norm(row.get('title'))}|||{norm(row.get('artist'))}")
    return audio_files, name_keys


def main():
    parser = argparse.ArgumentParser(description="Prep a folder of audio for upload-tracks.js")
    parser.add_argument("folder", help="Folder containing audio files (scanned recursively)")
    parser.add_argument("--batch", default="",
                        help="Value for the uploadBatch column, e.g. audioasis. "
                             "Falls back to $UPLOAD_BATCH.")
    parser.add_argument("--no-discogs", action="store_true",
                        help="Skip Discogs genre lookups even if DISCOGS_TOKEN is set")
    args = parser.parse_args()

    src = Path(args.folder)
    if not src.is_dir():
        print(f"\nFolder not found: {src}")
        sys.exit(1)

    AUDIO_DIR.mkdir(exist_ok=True)
    COVERS_DIR.mkdir(exist_ok=True)

    files = sorted(p for p in src.rglob("*") if p.suffix.lower() in AUDIO_EXTS)
    if not files:
        print(f"\nNo audio files found in {src}")
        sys.exit(1)

    existing_audio, existing_names = load_existing_csv()
    csv_is_new = not CSV_PATH.exists()

    print(f"\nFound {len(files)} audio file(s) in {src}")
    print(f"tracks.csv: {'creating new' if csv_is_new else f'appending ({len(existing_audio)} rows present)'}\n")

    rows, processed, skipped, no_genre = [], 0, 0, 0

    for i, track_path in enumerate(files, 1):
        audio = File(track_path, easy=True)
        if audio is None:
            print(f"  [{i}/{len(files)}] SKIP unsupported: {track_path.name}")
            skipped += 1
            continue

        title = (audio.get("title", [""])[0]).strip()
        artist = (audio.get("artist", [""])[0]).strip()
        album = (audio.get("album", [""])[0]).strip()
        genre_raw = (audio.get("genre", [""])[0]).strip()
        bpm = (audio.get("bpm", [""])[0]).strip()

        # Mixed In Key data (energy / camelot / bpm) -- not visible via easy=True
        energy, camelot, mik_bpm = read_mik_fields(track_path)
        if mik_bpm:
            bpm = mik_bpm

        title = strip_leading_number_prefix(title)
        # drop a trailing " - 8A - 126" if it leaked into the title tag
        title = DJ_SUFFIX_RE.sub("", title).strip()
        # ...and from the filename, which is where MIK puts it
        stem_clean = DJ_SUFFIX_RE.sub("", track_path.stem).strip()
        if not artist:
            extracted_artist, cleaned_title = split_artist_title_from_title(title or stem_clean)
            if extracted_artist:
                artist = extracted_artist
                title = cleaned_title
        if not title:
            title = strip_leading_number_prefix(stem_clean) or stem_clean
        if not artist:
            artist = "Unknown"

        name_key = f"{norm(title)}|||{norm(artist)}"
        if name_key in existing_names:
            print(f"  [{i}/{len(files)}] SKIP already in tracks.csv: {artist} - {title}")
            skipped += 1
            continue

        genre = map_genre(genre_raw)
        if not genre and not args.no_discogs:
            genre = discogs_lookup_genre(artist, title)
        if not genre:
            no_genre += 1

        safe_base = sanitize_filename(f"{artist}-{title}").lower()
        ext = track_path.suffix.lower()
        audio_filename = safe_base + ext
        # Avoid clobbering a different file that sanitized to the same name
        n = 2
        while audio_filename in existing_audio or (
            (AUDIO_DIR / audio_filename).exists() and
            (AUDIO_DIR / audio_filename).stat().st_size != track_path.stat().st_size
        ):
            audio_filename = f"{safe_base}-{n}{ext}"
            n += 1

        shutil.copy2(track_path, AUDIO_DIR / audio_filename)

        cover_filename = Path(audio_filename).stem + ".jpg"
        if not extract_cover(track_path, COVERS_DIR / cover_filename):
            cover_filename = ""

        rows.append([title, artist, album, genre, energy, camelot, bpm,
                     audio_filename, cover_filename, DEFAULT_COLOR,
                     args.batch or UPLOAD_BATCH])
        existing_audio.add(audio_filename)
        existing_names.add(name_key)
        processed += 1
        print(f"  [{i}/{len(files)}] OK  {artist} - {title}"
              f"{'  [genre: ' + genre + ']' if genre else '  [no genre]'}")

    if rows:
        # If tracks.csv predates the uploadBatch column, widen it in place
        # first — otherwise the new 11-field rows misalign against a
        # 10-field header and every value after coverFile shifts.
        if not csv_is_new:
            with open(CSV_PATH, newline="", encoding="utf-8") as f:
                old = list(csv.reader(f))
            if old and old[0] and old[0][-1] != "uploadBatch":
                print(f"tracks.csv: adding 'uploadBatch' column to "
                      f"{len(old) - 1} existing row(s)")
                old[0].append("uploadBatch")
                for r in old[1:]:
                    if r:
                        r.append("")
                with open(CSV_PATH, "w", newline="", encoding="utf-8") as f:
                    csv.writer(f).writerows(old)

        write_header = csv_is_new
        with open(CSV_PATH, "a", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            if write_header:
                writer.writerow(CSV_HEADER)
            writer.writerows(rows)

    save_cache(discogs_cache)

    print("\nDone.")
    print(f"  Prepped:  {processed}")
    print(f"  Skipped:  {skipped}")
    print(f"  No genre: {no_genre}" + ("  (set DISCOGS_TOKEN to gap-fill, or run fix_genres.py later)" if no_genre else ""))
    print(f"  CSV:      {CSV_PATH}")
    print("\nNext:  node upload-tracks.js")


if __name__ == "__main__":
    main()
