#!/usr/bin/env python3
"""
prep-folder-upload.py
──────────────────────────────────────────────────────────────────────────────
Scan a folder of Mixed In Key–tagged audio, clean metadata, write tracks.csv,
and optionally copy files into ./audio with slug filenames for upload-tracks.js.

  python3 prep-folder-upload.py "/path/to/expansions 2024"
  python3 prep-folder-upload.py "/path/to/expansions 2024" --copy
  python3 prep-folder-upload.py "/path/to/expansions 2024" --copy --limit 50

Outputs (gitignored-friendly):
  tracks.csv              — ready for node upload-tracks.js
  upload-review.csv       — rows needing human eyes (unknown artist, no bpm, etc.)
  prep-folder-report.json — summary counts

Requires: pip install mutagen
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import shutil
import sys
from pathlib import Path

try:
    from mutagen import File as MutagenFile
    from mutagen.id3 import ID3
except ImportError:
    print("Install mutagen first:  pip install mutagen", file=sys.stderr)
    sys.exit(1)

AUDIO_EXTS = {".mp3", ".m4a", ".flac", ".wav", ".aiff", ".aif", ".ogg"}
APP_ROOT = Path(__file__).resolve().parent
AUDIO_DIR = APP_ROOT / "audio"
CSV_PATH = APP_ROOT / "tracks.csv"
REVIEW_PATH = APP_ROOT / "upload-review.csv"
REPORT_PATH = APP_ROOT / "prep-folder-report.json"
DEFAULT_COLOR = "#6a7a8a"
DEFAULT_GENRE = "Electronic"

# Musical key → Camelot (for when MIK wrote traditional key instead of Camelot)
KEY_TO_CAMELOT = {
    "ab minor": "1A", "g# minor": "1A", "b major": "1B",
    "eb minor": "2A", "d# minor": "2A", "f# major": "2B", "gb major": "2B",
    "bb minor": "3A", "a# minor": "3A", "db major": "3B", "c# major": "3B",
    "f minor": "4A", "ab major": "4B", "g# major": "4B",
    "c minor": "5A", "eb major": "5B", "d# major": "5B",
    "g minor": "6A", "bb major": "6B", "a# major": "6B",
    "d minor": "7A", "f major": "7B",
    "a minor": "8A", "c major": "8B",
    "e minor": "9A", "g major": "9B",
    "b minor": "10A", "d major": "10B",
    "f# minor": "11A", "gb minor": "11A", "a major": "11B",
    "c# minor": "12A", "db minor": "12A", "e major": "12B",
}


def slugify(s: str) -> str:
    s = (s or "").lower().strip()
    s = s.replace("&", " and ")
    s = re.sub(r"[^\w\s-]+", "", s, flags=re.UNICODE)
    s = re.sub(r"[\s_]+", "-", s).strip("-")
    return s[:80] or "track"


def clean_text(s: str) -> str:
    t = str(s or "").strip()
    t = re.sub(r"^\s*\d{1,4}\s*[\.\-\)\:–—_]+\s*", "", t)
    t = re.sub(r"^AUDIO:\s*", "", t, flags=re.I)
    t = re.sub(
        r"\s*[\(\[\{]?\s*(official\s+)?(music\s+)?(video|audio|lyric(s)?|visualizer)\s*[\)\]\}]?\s*$",
        "",
        t,
        flags=re.I,
    )
    t = re.sub(
        r"\s*[\(\[\{]?\s*(lyrics?|4k|hd|hq|free\s+download)\s*[\)\]\}]?\s*$",
        "",
        t,
        flags=re.I,
    )
    t = re.sub(r"\s*[-–—]\s*(official\s+)?(music\s+)?(video|audio|lyric(s)?)\s*$", "", t, flags=re.I)
    t = re.sub(r"\s+", " ", t).strip()
    t = re.sub(r"\(\s*\)", "", t).replace("[]", "").strip()
    return t


def is_unknown_artist(artist: str) -> bool:
    a = (artist or "").strip().lower()
    return (not a) or a in {"unknown", "unknown artist", "n/a", "na", "-", "none", "various", "various artists"}


def split_artist_title(title: str, artist: str):
    a = clean_text(artist)
    t = clean_text(title)
    if a and not is_unknown_artist(a):
        return t, a
    m = re.match(r"^(.+?)\s+[-–—:]\s+(.+)$", t)
    if m:
        return clean_text(m.group(2)), clean_text(m.group(1))
    # filename-style "Artist_Title" already cleaned elsewhere
    return t, a or "Unknown"


def tag_text(audio, *keys) -> str:
    if not audio or not getattr(audio, "tags", None):
        return ""
    tags = audio.tags
    for key in keys:
        try:
            val = tags.get(key)
        except Exception:
            val = None
        if val is None:
            continue
        if hasattr(val, "text"):
            parts = list(val.text or [])
            if parts:
                return str(parts[0]).strip()
        if isinstance(val, list) and val:
            return str(val[0]).strip()
        s = str(val).strip()
        if s and s != "None":
            return s
    return ""


def read_txxx(audio, desc_match: str) -> str:
    """Read ID3 TXXX frame by description (Mixed In Key often uses these)."""
    try:
        tags = ID3(audio.filename)
    except Exception:
        return ""
    needle = desc_match.lower()
    for frame in tags.values():
        if getattr(frame, "FrameID", "") != "TXXX":
            continue
        desc = str(getattr(frame, "desc", "") or "").lower()
        if needle in desc:
            texts = list(getattr(frame, "text", []) or [])
            if texts:
                return str(texts[0]).strip()
    return ""


def parse_camelot(raw: str) -> str:
    s = (raw or "").strip()
    if not s:
        return ""
    m = re.match(r"^(\d{1,2})\s*([ABab])$", s)
    if m:
        n = int(m.group(1))
        if 1 <= n <= 12:
            return f"{n}{m.group(2).upper()}"
    # Traditional key → Camelot
    key = re.sub(r"\s+", " ", s.lower().replace("maj", "major").replace("min", "minor"))
    key = key.replace("major", "major").replace("minor", "minor")
    if key in KEY_TO_CAMELOT:
        return KEY_TO_CAMELOT[key]
    # "8A - A minor" style
    m = re.search(r"\b(\d{1,2})\s*([ABab])\b", s)
    if m:
        n = int(m.group(1))
        if 1 <= n <= 12:
            return f"{n}{m.group(2).upper()}"
    return ""


def parse_energy(raw: str) -> str:
    s = (raw or "").strip()
    if not s:
        return ""
    m = re.search(r"(\d{1,2})", s)
    if not m:
        return ""
    n = int(m.group(1))
    if 1 <= n <= 10:
        return str(n)
    return ""


def parse_bpm(raw: str) -> str:
    s = (raw or "").strip().replace(",", ".")
    if not s:
        return ""
    try:
        n = int(round(float(s)))
    except ValueError:
        m = re.search(r"(\d{2,3})", s)
        n = int(m.group(1)) if m else 0
    if 60 <= n <= 220:
        return str(n)
    return ""


def infer_electronic_subgenre(bpm: str, energy: str, filename: str, title: str) -> str:
    """
    Soft subgenre guess for Electronic crates when no genre tag exists.
    Prefer leaving Electronic if unsure — scenes can still use BPM later.
    """
    blob = f"{filename} {title}".lower()
    keywords = [
        ("drum and bass", "Drum and Bass"),
        ("drum & bass", "Drum and Bass"),
        ("dnb", "Drum and Bass"),
        ("jungle", "Jungle"),
        ("uk garage", "UK Garage"),
        ("2-step", "UK Garage"),
        ("2step", "UK Garage"),
        ("garage", "UK Garage"),
        ("tech house", "Tech House"),
        ("deep house", "Deep House"),
        ("house", "House"),
        ("techno", "Techno"),
        ("trance", "Trance"),
        ("dubstep", "Dubstep"),
        ("amapiano", "Amapiano"),
        ("ambient", "Ambient"),
        ("breakbeat", "Breakbeat"),
        ("breaks", "Breakbeat"),
        ("hardgroove", "Techno"),
        ("hard techno", "Techno"),
    ]
    for key, label in keywords:
        if key in blob:
            return label

    try:
        b = int(bpm) if bpm else 0
    except ValueError:
        b = 0
    try:
        e = int(energy) if energy else 5
    except ValueError:
        e = 5

    if not b:
        return DEFAULT_GENRE
    if 165 <= b <= 180:
        return "Drum and Bass"
    if 138 <= b <= 150 and e >= 7:
        return "Techno"
    if 128 <= b <= 135 and e >= 7:
        return "Tech House"
    if 118 <= b <= 126 and e <= 6:
        return "Deep House"
    if 120 <= b <= 130:
        return "House"
    if b < 100 and e <= 4:
        return "Ambient"
    return DEFAULT_GENRE


def extract_meta(path: Path) -> dict:
    audio = MutagenFile(path, easy=False)
    easy = MutagenFile(path, easy=True)

    title = ""
    artist = ""
    album = ""
    genre = ""
    bpm = ""
    key_raw = ""
    energy = ""

    if easy and easy.tags:
        title = (easy.tags.get("title") or [""])[0] if easy.tags.get("title") else ""
        artist = (easy.tags.get("artist") or [""])[0] if easy.tags.get("artist") else ""
        album = (easy.tags.get("album") or [""])[0] if easy.tags.get("album") else ""
        genre = (easy.tags.get("genre") or [""])[0] if easy.tags.get("genre") else ""
        bpm = (easy.tags.get("bpm") or [""])[0] if easy.tags.get("bpm") else ""

    # Non-easy frames for Mixed In Key
    if not title:
        title = tag_text(audio, "TIT2", "\xa9nam")
    if not artist:
        artist = tag_text(audio, "TPE1", "\xa9ART")
    if not album:
        album = tag_text(audio, "TALB", "\xa9alb")
    if not genre:
        genre = tag_text(audio, "TCON", "\xa9gen")
    if not bpm:
        bpm = tag_text(audio, "TBPM") or read_txxx(audio, "bpm")

    key_raw = (
        tag_text(audio, "TKEY")
        or read_txxx(audio, "initialkey")
        or read_txxx(audio, "key")
        or read_txxx(audio, "camelot")
        or read_txxx(audio, "mixed in key")
    )
    energy = (
        read_txxx(audio, "energy")
        or read_txxx(audio, "energy level")
        or read_txxx(audio, "mik energy")
    )

    # Comment scan for "Energy 7" / "8A"
    comment = tag_text(audio, "COMM::eng", "COMM", "\xa9cmt")
    if comment:
        if not energy:
            m = re.search(r"energy\s*[:=]?\s*(\d{1,2})", comment, re.I)
            if m:
                energy = m.group(1)
        if not key_raw:
            m = re.search(r"\b(\d{1,2})\s*([ABab])\b", comment)
            if m:
                key_raw = f"{m.group(1)}{m.group(2)}"

    # Filename fallback for title/artist
    stem = path.stem
    stem_clean = clean_text(stem.replace("_", " "))
    if not title:
        title = stem_clean
    title, artist = split_artist_title(title, artist)

    camelot = parse_camelot(key_raw)
    bpm_n = parse_bpm(bpm)
    energy_n = parse_energy(energy)

    genre_clean = clean_text(genre)
    if not genre_clean or genre_clean.lower() in {"electronic", "electronica", "dance", "other", "unknown"}:
        genre_clean = infer_electronic_subgenre(bpm_n, energy_n, path.name, title)

    return {
        "title": title,
        "artist": artist,
        "album": clean_text(album),
        "genre": genre_clean,
        "energy": energy_n,
        "camelot": camelot,
        "bpm": bpm_n,
        "sourceFile": str(path),
        "sourceName": path.name,
    }


def unique_audio_name(artist: str, title: str, ext: str, used: set) -> str:
    base = f"{slugify(artist)}-{slugify(title)}{ext.lower()}"
    if base not in used:
        used.add(base)
        return base
    i = 2
    while True:
        candidate = f"{slugify(artist)}-{slugify(title)}-{i}{ext.lower()}"
        if candidate not in used:
            used.add(candidate)
            return candidate
        i += 1


def main():
    parser = argparse.ArgumentParser(description="Prep a Mixed In Key folder for Planet MP3 upload")
    parser.add_argument("folder", help="Path to folder of audio files (flat or nested)")
    parser.add_argument("--copy", action="store_true", help=f"Copy/rename files into {AUDIO_DIR}")
    parser.add_argument("--limit", type=int, default=0, help="Only process first N files (debug)")
    parser.add_argument("--default-genre", default=DEFAULT_GENRE, help="Fallback genre label")
    args = parser.parse_args()

    src = Path(args.folder).expanduser().resolve()
    if not src.is_dir():
        print(f"Folder not found: {src}", file=sys.stderr)
        sys.exit(1)

    files = sorted(
        p for p in src.rglob("*")
        if p.is_file() and p.suffix.lower() in AUDIO_EXTS
    )
    if args.limit:
        files = files[: args.limit]

    print(f"Found {len(files)} audio files in {src}")
    if not files:
        sys.exit(1)

    if args.copy:
        AUDIO_DIR.mkdir(exist_ok=True)

    rows = []
    review = []
    used_names = set()
    stats = {
        "files": len(files),
        "with_bpm": 0,
        "with_camelot": 0,
        "with_energy": 0,
        "unknown_artist": 0,
        "inferred_subgenre": 0,
        "copied": 0,
        "errors": 0,
    }

    for i, path in enumerate(files, 1):
        try:
            meta = extract_meta(path)
        except Exception as e:
            stats["errors"] += 1
            print(f"  [{i}/{len(files)}] ERROR {path.name}: {e}")
            continue

        if meta["bpm"]:
            stats["with_bpm"] += 1
        if meta["camelot"]:
            stats["with_camelot"] += 1
        if meta["energy"]:
            stats["with_energy"] += 1
        if is_unknown_artist(meta["artist"]):
            stats["unknown_artist"] += 1

        # Track if we inferred beyond blank/Electronic
        if meta["genre"] and meta["genre"] != args.default_genre:
            stats["inferred_subgenre"] += 1

        audio_file = unique_audio_name(meta["artist"], meta["title"], path.suffix, used_names)
        row = {
            "title": meta["title"],
            "artist": meta["artist"],
            "album": meta["album"],
            "genre": meta["genre"] or args.default_genre,
            "energy": meta["energy"],
            "camelot": meta["camelot"],
            "bpm": meta["bpm"],
            "audioFile": audio_file,
            "coverFile": "",
            "color": DEFAULT_COLOR,
        }
        rows.append(row)

        flags = []
        if is_unknown_artist(meta["artist"]):
            flags.append("unknown_artist")
        if not meta["bpm"]:
            flags.append("missing_bpm")
        if not meta["camelot"]:
            flags.append("missing_camelot")
        if not meta["energy"]:
            flags.append("missing_energy")
        if not meta["title"]:
            flags.append("missing_title")
        if flags:
            review.append({**row, "flags": "|".join(flags), "sourceName": meta["sourceName"]})

        if args.copy:
            dest = AUDIO_DIR / audio_file
            if not dest.exists():
                shutil.copy2(path, dest)
                stats["copied"] += 1

        if i % 100 == 0 or i == len(files):
            print(f"  [{i}/{len(files)}] processed…")

    # Write tracks.csv
    fieldnames = ["title", "artist", "album", "genre", "energy", "camelot", "bpm", "audioFile", "coverFile", "color"]
    with CSV_PATH.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames, quoting=csv.QUOTE_MINIMAL)
        w.writeheader()
        for row in rows:
            w.writerow(row)

    with REVIEW_PATH.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(
            f,
            fieldnames=fieldnames + ["flags", "sourceName"],
            quoting=csv.QUOTE_MINIMAL,
            extrasaction="ignore",
        )
        w.writeheader()
        for row in review:
            w.writerow(row)

    REPORT_PATH.write_text(json.dumps(stats, indent=2), encoding="utf-8")

    print("\n── Summary ──")
    for k, v in stats.items():
        print(f"  {k}: {v}")
    print(f"\nWrote {CSV_PATH} ({len(rows)} rows)")
    print(f"Wrote {REVIEW_PATH} ({len(review)} rows need review)")
    print(f"Wrote {REPORT_PATH}")
    if args.copy:
        print(f"Copied {stats['copied']} files → {AUDIO_DIR}")
    else:
        print("\nRe-run with --copy to stage files into ./audio for upload-tracks.js")
    print("\nNext (after serviceAccountKey.json is present):")
    print("  1. Review/fix unknown artists in upload-review.csv → tracks.csv")
    print("  2. node upload-tracks.js")


if __name__ == "__main__":
    main()
