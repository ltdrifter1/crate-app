import re
import csv
import shutil
import time
import json
import os
import io
from pathlib import Path
from urllib.parse import quote

import requests
from mutagen import File
from mutagen.id3 import ID3
from PIL import Image

# ===== CONFIG =====
PLAYLIST = Path(r"C:\Users\lpgut\Desktop\CRATE.m3u")
APP_ROOT = Path(r"C:\Users\lpgut\crate-app")
AUDIO_DIR = APP_ROOT / "audio"
COVERS_DIR = APP_ROOT / "covers"
CSV_PATH = APP_ROOT / "tracks.csv"

DEFAULT_COLOR = "#9090b0"

# Discogs (optional but recommended for blank genres)
DISCOGS_TOKEN = os.getenv("DISCOGS_TOKEN", "").strip()
CACHE_PATH = APP_ROOT / "discogs_cache.json"
REQUEST_DELAY_SEC = 1.2  # safe-ish pace for Discogs API
# ==================

AUDIO_DIR.mkdir(exist_ok=True)
COVERS_DIR.mkdir(exist_ok=True)

ALLOWED_GENRES = {
    "Soul","R&B","Jazz","Blues","Funk",
    "Hip-Hop","House","Techno","Ambient",
    "Reggae","Drum & Bass","Uk Garage","Metal","Folk",
    "Rock","Alternative","Classical","Experimental"
}

def sanitize_filename(name: str) -> str:
    # remove commas, then keep letters/numbers/_/-/space, convert spaces to dashes
    name = (name or "").replace(",", "")
    name = re.sub(r"[^\w\- ]+", "", name)
    name = re.sub(r"\s+", " ", name).strip().replace(" ", "-")
    return name

def read_m3u(path: Path):
    lines = path.read_text(encoding="utf-8", errors="ignore").splitlines()
    return [Path(l.strip()) for l in lines if l.strip() and not l.startswith("#")]

def extract_cover(mp3_path: Path, cover_output_path: Path) -> bool:
    # MP3 embedded art via ID3 APIC
    try:
        tags = ID3(mp3_path)
        for tag in tags.values():
            if getattr(tag, "FrameID", "") == "APIC":
                image = Image.open(io.BytesIO(tag.data))
                image.save(cover_output_path, format="JPEG")
                return True
    except:
        pass
    return False

def strip_leading_number_prefix(s: str) -> str:
    """
    Removes leading numeric prefixes like:
    '143 - ', '01. ', '12) ', '545 — ', etc.
    """
    if not s:
        return s
    return re.sub(r"^\s*\d{1,4}\s*[\.\-\)\:–—_]+\s*", "", s).strip()

def split_artist_title_from_title(raw_title: str):
    """
    If Artist tag is missing, try to parse from title:
    'Artist - Title' or 'Artist: Title' (after stripping number prefix).
    """
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

GENRE_KEYWORDS = [
    # Drum & Bass / Jungle
    ("drum & bass", "Drum & Bass"),
    ("drum and bass", "Drum & Bass"),
    ("dnb", "Drum & Bass"),
    ("jungle", "Drum & Bass"),

    # UK Garage / 2-step
    ("uk garage", "Uk Garage"),
    ("2-step", "Uk Garage"),
    ("2step", "Uk Garage"),
    ("garage", "Uk Garage"),

    # Hip-Hop
    ("hip hop", "Hip-Hop"),
    ("hip-hop", "Hip-Hop"),
    ("rap", "Hip-Hop"),
    ("boom bap", "Hip-Hop"),

    # House / Techno / Ambient
    ("house", "House"),
    ("techno", "Techno"),
    ("ambient", "Ambient"),
    ("drone", "Ambient"),

    # Soul / R&B / Jazz / Blues / Funk
    ("r&b", "R&B"),
    ("rnb", "R&B"),
    ("neo soul", "Soul"),
    ("soul", "Soul"),
    ("jazz", "Jazz"),
    ("blues", "Blues"),
    ("funk", "Funk"),

    # Reggae family
    ("reggae", "Reggae"),
    ("dub", "Reggae"),
    ("dancehall", "Reggae"),

    # Metal / Folk / Rock / Alt / Classical / Experimental
    ("metal", "Metal"),
    ("folk", "Folk"),
    ("alternative", "Alternative"),
    ("alt", "Alternative"),
    ("rock", "Rock"),
    ("classical", "Classical"),
    ("orchestral", "Classical"),
    ("experimental", "Experimental"),
    ("industrial", "Experimental"),
    ("noise", "Experimental"),
    ("idm", "Experimental"),
    ("electronica", "Experimental"),
]

def map_to_allowed(raw_genre: str) -> str:
    g = norm(raw_genre)
    if not g:
        return ""
    for key, target in GENRE_KEYWORDS:
        if key in g:
            return target
    for a in ALLOWED_GENRES:
        if norm(a) == g:
            return a
    return ""

def load_cache():
    if CACHE_PATH.exists():
        try:
            return json.loads(CACHE_PATH.read_text(encoding="utf-8"))
        except:
            return {}
    return {}

def save_cache(cache: dict):
    CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")

discogs_cache = load_cache()

def discogs_headers():
    h = {"User-Agent": "crate-app-genre-cleaner/1.0"}
    if DISCOGS_TOKEN:
        h["Authorization"] = f"Discogs token={DISCOGS_TOKEN}"
    return h

def discogs_search_release(artist: str, title: str):
    q = f"{artist} {title}".strip()
    if not q:
        return None
    url = f"https://api.discogs.com/database/search?q={quote(q)}&type=release&per_page=1"
    r = requests.get(url, headers=discogs_headers(), timeout=20)
    r.raise_for_status()
    data = r.json()
    results = data.get("results") or []
    if not results:
        return None
    return results[0].get("id")

def discogs_get_release(release_id: int):
    url = f"https://api.discogs.com/releases/{release_id}"
    r = requests.get(url, headers=discogs_headers(), timeout=20)
    r.raise_for_status()
    return r.json()

def discogs_lookup_genre_mapped(artist: str, title: str) -> str:
    """
    Returns one of your ALLOWED_GENRES or "" if not found.
    Uses cache + throttling.
    """
    key = f"{artist}|||{title}".lower().strip()
    if key in discogs_cache:
        return discogs_cache[key]

    # If no token, you might hit rate limits sooner; cache helps either way.
    time.sleep(REQUEST_DELAY_SEC)

    try:
        rid = discogs_search_release(artist, title)
        if not rid:
            discogs_cache[key] = ""
            return ""

        time.sleep(REQUEST_DELAY_SEC)
        rel = discogs_get_release(rid)

        genres = rel.get("genres") or []
        styles = rel.get("styles") or []
        combined = " ".join([*genres, *styles])

        mapped = map_to_allowed(combined)
        discogs_cache[key] = mapped
        return mapped
    except:
        discogs_cache[key] = ""
        return ""

tracks = read_m3u(PLAYLIST)
rows = []
processed = 0
skipped = 0

for track_path in tracks:
    if not track_path.exists():
        skipped += 1
        continue

    audio = File(track_path, easy=True)
    if audio is None:
        print(f"Skipping unsupported file: {track_path}")
        skipped += 1
        continue

    title = (audio.get("title", [""])[0]).strip()
    artist = (audio.get("artist", [""])[0]).strip()
    album = (audio.get("album", [""])[0]).strip()
    genre_raw = (audio.get("genre", [""])[0]).strip()
    bpm = (audio.get("bpm", [""])[0]).strip()

    # Always remove leading numeric prefixes from title
    title = strip_leading_number_prefix(title)

    # If artist missing, try parsing from title
    if not artist:
        extracted_artist, cleaned_title = split_artist_title_from_title(title)
        if extracted_artist:
            artist = extracted_artist
            title = cleaned_title

    # Fallbacks
    if not title:
        title = track_path.stem
    if not artist:
        artist = "Unknown"

    # Genre cleanse (map existing -> allowed)
    genre = map_to_allowed(genre_raw)

    # If blank/unmappable, try Discogs (only if token present or you still want to try without)
    if not genre:
        looked = discogs_lookup_genre_mapped(artist, title)
        genre = looked or ""

    safe_base = sanitize_filename(f"{artist}-{title}")
    audio_filename = safe_base + ".mp3"
    cover_filename = safe_base + ".jpg"

    shutil.copy2(track_path, AUDIO_DIR / audio_filename)

    cover_extracted = extract_cover(track_path, COVERS_DIR / cover_filename)
    if not cover_extracted:
        cover_filename = ""

    row = [
        title,
        artist,
        album,
        genre,
        "",          # energy (leave blank)
        "",          # camelot (leave blank)
        bpm,         # bpm (blank ok)
        audio_filename,
        cover_filename,
        DEFAULT_COLOR
    ]
    rows.append(row)
    processed += 1

with open(CSV_PATH, "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow([
        "title","artist","album","genre","energy","camelot","bpm","audioFile","coverFile","color"
    ])
    writer.writerows(rows)

save_cache(discogs_cache)

print("\nDone.")
print(f"Processed: {processed}")
print(f"Skipped: {skipped}")
print(f"tracks.csv: {CSV_PATH}")
print(f"Discogs cache: {CACHE_PATH}")