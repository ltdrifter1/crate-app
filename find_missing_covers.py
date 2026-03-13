"""
find_missing_covers.py
──────────────────────────────────────────────────────────────────────────────
1. Reads tracks.csv to find tracks with no coverFile
2. Tries to fuzzy-match against your existing covers/ folder
3. For still-missing tracks, searches Discogs for cover art
4. Downloads images to covers/ folder
5. Updates Firestore coverUrl field directly (uploads to Firebase Storage)

Requirements:
  pip install firebase-admin requests pillow thefuzz python-levenshtein

Place in crate-app/ folder alongside serviceAccountKey.json and tracks.csv
Run: python find_missing_covers.py
"""

import csv, os, re, time, requests, json, io
import firebase_admin
from firebase_admin import credentials, firestore, storage
from thefuzz import fuzz
from PIL import Image

# ── Config ────────────────────────────────────────────────────────────────
DISCOGS_TOKEN  = "mhrANiNVwVpTEfEfsuljWYMijVhCiseGePGyNFRC"
LASTFM_KEY     = "140694bd2e12b370905d290375d812a0"
COVERS_DIR     = "covers"
CSV_PATH       = "tracks.csv"
BUCKET_NAME    = "crate-app-58494.firebasestorage.app"
DRY_RUN        = False  # Set True to preview without uploading

# ── Init Firebase ─────────────────────────────────────────────────────────
cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred, {"storageBucket": BUCKET_NAME})
db     = firestore.client()
bucket = storage.bucket()

# ── Load CSV ──────────────────────────────────────────────────────────────
with open(CSV_PATH, encoding="utf-8-sig") as f:
    rows = list(csv.DictReader(f))

missing = [r for r in rows if not r.get("coverFile", "").strip()]
print(f"Tracks missing covers: {len(missing)}")

# ── Load existing cover filenames ─────────────────────────────────────────
existing_covers = set(os.listdir(COVERS_DIR)) if os.path.exists(COVERS_DIR) else set()
existing_lower  = {f.lower(): f for f in existing_covers}
print(f"Existing covers in folder: {len(existing_covers)}")

# ── Load Firestore tracks (to get doc IDs) ────────────────────────────────
print("Loading Firestore tracks...")
fs_docs = {}
for doc in db.collection("tracks").stream():
    d = doc.to_dict()
    fs_docs[doc.id] = d

# Build lookup by normalised title
def norm(s):
    return re.sub(r'\s+', ' ', (s or '').lower().strip())

fs_by_title = {}
for doc_id, data in fs_docs.items():
    fs_by_title.setdefault(norm(data.get('title', '')), []).append(doc_id)

# ── Helper: clean artist/title ────────────────────────────────────────────
def clean_track(row):
    artist = row.get('artist', '').strip()
    title  = row.get('title', '').strip()
    if artist.lower() in ('unknown', '', 'n/a'):
        m = re.match(r'^(.+?)\s*[-–]\s*(.+)$', title)
        if m:
            artist = m.group(1).strip()
            title  = m.group(2).strip()
    # Strip junk suffixes from title
    title = re.sub(r'\s*[\(\[]?(Official\s*(Video|Audio|Lyric)|Visualizer|feat\..+)[\)\]]?\s*$', '', title, flags=re.IGNORECASE).strip()
    title = re.sub(r'\s+', ' ', title).strip()
    return artist.strip(), title.strip()

# ── Helper: fuzzy match against existing covers ───────────────────────────
def fuzzy_match_cover(artist, title):
    query = f"{artist} {title}".lower()
    best_score = 0
    best_file  = None
    for fname_lower, fname in existing_lower.items():
        name = re.sub(r'\.(jpg|jpeg|png|webp)$', '', fname_lower)
        name = re.sub(r'[-_]', ' ', name)
        score = fuzz.token_set_ratio(query, name)
        if score > best_score:
            best_score = score
            best_file  = fname
    if best_score >= 72:
        return best_file, best_score
    return None, best_score

# ── Helper: Discogs search ────────────────────────────────────────────────
DGH = {"Authorization": f"Discogs token={DISCOGS_TOKEN}",
       "User-Agent": "CrateApp/2.0"}

def discogs_cover(artist, title):
    queries = []
    if artist and title:
        queries.append({"artist": artist, "track": title, "type": "release"})
        queries.append({"q": f"{artist} {title}", "type": "release"})
    if title:
        queries.append({"q": title, "type": "release"})

    for params in queries:
        try:
            r = requests.get("https://api.discogs.com/database/search",
                             params=params, headers=DGH, timeout=10)
            if r.status_code == 429:
                time.sleep(5); continue
            if r.status_code != 200:
                continue
            results = r.json().get("results", [])
            for res in results[:3]:
                img = res.get("cover_image", "") or res.get("thumb", "")
                if img and "spacer" not in img and img.endswith(('.jpg','.jpeg','.png','.gif')):
                    return img
        except:
            pass
        time.sleep(0.5)
    return None

# ── Helper: MusicBrainz Cover Art Archive ────────────────────────────────
MBH = {"User-Agent": "crate-cover-fix/2.0 (crate@example.com)"}

def musicbrainz_cover(artist, title):
    clean_title = re.sub(r'\s*[\(\[].*?[\)\]]', '', title).strip()
    queries = []
    if artist and title:
        queries.append(f'recording:"{clean_title}" AND artistname:"{artist}"')
    if title:
        queries.append(f'recording:"{clean_title}"')
    for q in queries:
        try:
            r = requests.get("https://musicbrainz.org/ws/2/recording",
                params={"query": q, "limit": 3, "fmt": "json", "inc": "releases"},
                headers=MBH, timeout=10)
            if r.status_code == 429:
                time.sleep(3); continue
            if r.status_code != 200:
                continue
            for rec in r.json().get("recordings", []):
                for release in rec.get("releases", [])[:2]:
                    mbid = release.get("id")
                    if not mbid:
                        continue
                    ca = requests.get(
                        f"https://coverartarchive.org/release/{mbid}",
                        headers=MBH, timeout=8)
                    if ca.status_code == 200:
                        for img in ca.json().get("images", []):
                            if img.get("front"):
                                url = img.get("image") or img.get("thumbnails", {}).get("large")
                                if url:
                                    return url
            time.sleep(0.8)
        except:
            pass
    return None

# ── Helper: Last.fm cover ─────────────────────────────────────────────────
def lastfm_cover(artist, title):
    PLACEHOLDER = "2a96cbd8b46e442fc41c2b86b821562f"
    if artist and title:
        try:
            r = requests.get("http://ws.audioscrobbler.com/2.0/", params={
                "method": "track.getInfo", "artist": artist, "track": title,
                "api_key": LASTFM_KEY, "format": "json"
            }, timeout=10)
            if r.status_code == 200:
                images = r.json().get("track", {}).get("album", {}).get("image", [])
                for img in reversed(images):
                    url = img.get("#text", "")
                    if url and PLACEHOLDER not in url:
                        return url
        except:
            pass
    if artist:
        try:
            r = requests.get("http://ws.audioscrobbler.com/2.0/", params={
                "method": "artist.getInfo", "artist": artist,
                "api_key": LASTFM_KEY, "format": "json"
            }, timeout=10)
            if r.status_code == 200:
                images = r.json().get("artist", {}).get("image", [])
                for img in reversed(images):
                    url = img.get("#text", "")
                    if url and PLACEHOLDER not in url:
                        return url
        except:
            pass
    return None

# ── Helper: download + resize image ──────────────────────────────────────
def download_image(img_url, artist, title):
    try:
        r = requests.get(img_url, timeout=15, headers={"User-Agent": "CrateApp/2.0"})
        if r.status_code == 200 and len(r.content) > 5000:
            img = Image.open(io.BytesIO(r.content)).convert("RGB")
            img = img.resize((600, 600), Image.LANCZOS)
            safe  = re.sub(r'[^\w\-]', '_', f"{artist}-{title}")[:80]
            fname = f"{safe}.jpg"
            local_path = os.path.join(COVERS_DIR, fname)
            img.save(local_path, "JPEG", quality=88)
            return local_path, fname
    except:
        pass
    return None, None

# ── Helper: upload to Firebase Storage + update Firestore ─────────────────
def upload_and_update(local_path, filename, doc_ids):
    if DRY_RUN:
        print(f"    [DRY RUN] Would upload {filename}")
        return True
    try:
        blob = bucket.blob(f"covers/{filename}")
        blob.upload_from_filename(local_path, content_type="image/jpeg")
        blob.make_public()
        url = blob.public_url
        for doc_id in doc_ids:
            db.collection("tracks").document(doc_id).update({"albumCover": url})
        return True
    except Exception as e:
        print(f"    ✗ Upload failed: {e}")
        return False

# ── Main loop ─────────────────────────────────────────────────────────────
os.makedirs(COVERS_DIR, exist_ok=True)

results = {"fuzzy_match": 0, "discogs": 0, "musicbrainz": 0, "lastfm": 0, "default": 0, "not_found": 0, "no_firestore": 0}
not_found = []

for i, row in enumerate(missing):
    artist, title = clean_track(row)
    print(f"\n[{i+1:3d}/{len(missing)}] {artist[:25]:<25} | {title[:35]}")

    # Find Firestore doc
    key     = norm(row.get('title', ''))
    doc_ids = fs_by_title.get(key, [])
    if not doc_ids:
        # Try partial match
        for fk, fids in fs_by_title.items():
            if len(key) > 10 and key[:20] in fk:
                doc_ids = fids; break
    if not doc_ids:
        print(f"    ⚠ No Firestore doc found")
        results["no_firestore"] += 1
        continue

    # Check if Firestore doc already has a coverUrl
    doc_data = fs_docs.get(doc_ids[0], {})
    if (doc_data.get("albumCover") or "").startswith("http"):
        print(f"    ✓ Already has albumCover in Firestore, skipping")
        continue

    # Step 1: fuzzy match existing covers
    match_file, score = fuzzy_match_cover(artist, title)
    if match_file:
        local_path = os.path.join(COVERS_DIR, match_file)
        safe_name  = re.sub(r'[^\w\-.]', '_', f"{artist}-{title}")[:80] + ".jpg"
        print(f"    ✓ Fuzzy match ({score}): {match_file}")
        upload_and_update(local_path, match_file, doc_ids)
        results["fuzzy_match"] += 1
        continue

    # Step 2: Discogs
    print(f"    → Discogs…")
    img_url = discogs_cover(artist, title)
    if img_url:
        local_path, fname = download_image(img_url, artist, title)
        if local_path:
            print(f"    ✓ Discogs")
            upload_and_update(local_path, fname, doc_ids)
            results["discogs"] += 1
            time.sleep(0.8)
            continue

    # Step 3: MusicBrainz Cover Art Archive
    print(f"    → MusicBrainz…")
    img_url = musicbrainz_cover(artist, title)
    if img_url:
        local_path, fname = download_image(img_url, artist, title)
        if local_path:
            print(f"    ✓ MusicBrainz")
            upload_and_update(local_path, fname, doc_ids)
            results["musicbrainz"] = results.get("musicbrainz", 0) + 1
            time.sleep(0.8)
            continue

    # Step 4: Last.fm
    print(f"    → Last.fm…")
    img_url = lastfm_cover(artist, title)
    if img_url:
        local_path, fname = download_image(img_url, artist, title)
        if local_path:
            print(f"    ✓ Last.fm")
            upload_and_update(local_path, fname, doc_ids)
            results["lastfm"] = results.get("lastfm", 0) + 1
            time.sleep(0.5)
            continue

    # Step 3: default fallback
    DEFAULT_URL = f"https://storage.googleapis.com/{BUCKET_NAME}/covers/default.avif"
    default_path = os.path.join(COVERS_DIR, "default.avif")
    if os.path.exists(default_path) or not DRY_RUN:
        if not DRY_RUN:
            for doc_id in doc_ids:
                db.collection("tracks").document(doc_id).update({"albumCover": DEFAULT_URL})
        print(f"    → Set to default.avif")
        results["default"] = results.get("default", 0) + 1
    else:
        print(f"    ✗ Not found")
        not_found.append({"artist": artist, "title": title})
        results["not_found"] += 1
    time.sleep(0.3)

# ── Summary ───────────────────────────────────────────────────────────────
print(f"\n{'='*60}")
print(f"✅ Fuzzy matched from local: {results['fuzzy_match']}")
print(f"✅ Found on Discogs:         {results['discogs']}")
print(f"✅ Found on MusicBrainz:     {results['musicbrainz']}")
print(f"✅ Found on Last.fm:         {results['lastfm']}")
print(f"✅ Set to default.avif:      {results['default']}")
print(f"⚠  No Firestore doc:        {results['no_firestore']}")
print(f"✗  Not found anywhere:      {results['not_found']}")

if not_found:
    with open("covers_not_found.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["artist", "title"])
        w.writeheader()
        w.writerows(not_found)
    print(f"\nSaved {len(not_found)} unfound tracks to covers_not_found.csv")
