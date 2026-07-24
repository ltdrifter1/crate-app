"""
fix_genres_v4.py
─────────────────────────────────────────────────────────────────
Lookup chain:
  1. Known artist map (instant, no API)
  2. Existing tag mapping (if sensible)
  3. MusicBrainz recording → artist fallback
  4. Discogs search
  5. Last.fm track → artist fallback
  6. Experimental (final fallback)

Run: python fix_genres_v4.py
"""

import csv, re, time
import requests
import firebase_admin
from firebase_admin import credentials, firestore

# ── API keys (set via environment — never commit secrets) ─────────────────
import os
DISCOGS_TOKEN = os.getenv("DISCOGS_TOKEN", "").strip()
LASTFM_KEY    = os.getenv("LASTFM_KEY", "").strip()

# ── Allowed genres ────────────────────────────────────────────────────────
ALLOWED = [
    "Rock", "R&B", "Country", "Hip-Hop", "House",
    "Drum and Bass", "Soul", "Jazz", "Classical", "Metal",
]

LEGACY_TO_CANONICAL = {
    "Techno": "House", "Ambient": "House", "Electronic": "House", "Disco": "House",
    "UK Garage": "House", "Uk Garage": "House", "Funk": "Soul", "Blues": "Jazz",
    "Drum & Bass": "Drum and Bass", "Alternative": "Rock", "Indie": "Rock",
    "Folk": "Country", "Reggae": "Soul", "Afrobeat": "Soul", "Experimental": "Jazz",
    "Latin": "Jazz", "World": "Jazz", "Pop": "R&B", "Rap": "Hip-Hop",
}

def to_canonical(g):
    if not g:
        return ""
    g = str(g).strip()
    if g in ALLOWED:
        return g
    if g in LEGACY_TO_CANONICAL:
        return LEGACY_TO_CANONICAL[g]
    low = g.lower()
    for a in ALLOWED:
        if a.lower() == low:
            return a
    return LEGACY_TO_CANONICAL.get(g, "")

# ── Known artist → genre ──────────────────────────────────────────────────
KNOWN_ARTISTS = {
    # Hip-Hop
    "j dilla": "Hip-Hop", "kendrick lamar": "Hip-Hop", "common": "Hip-Hop",
    "freddie gibbs": "Hip-Hop", "de la soul": "Hip-Hop", "slum village": "Hip-Hop",
    "the alchemist": "Hip-Hop", "evidence": "Hip-Hop", "luh tyler": "Hip-Hop",
    "metro boomin": "Hip-Hop", "future": "Hip-Hop", "aj tracey": "Hip-Hop",
    "bishop nehru": "Hip-Hop", "black moon": "Hip-Hop", "digable planets": "Hip-Hop",
    "fly anakin": "Hip-Hop", "earthquake": "Hip-Hop", "count bass d": "Hip-Hop",
    "bj the chicago kid": "Hip-Hop", "dinner party": "Hip-Hop",
    "blacksmith music": "Hip-Hop", "aj suede": "Hip-Hop", "doechii": "Hip-Hop",
    "luh tyler": "Hip-Hop",
    # Soul / R&B
    "sade": "Soul", "aaliyah": "R&B", "d'angelo": "Soul", "cleo sol": "Soul",
    "greentea peng": "Soul", "steve lacy": "R&B", "blood orange": "R&B",
    "kaytranada": "R&B", "angie stone": "Soul", "fousheé": "R&B",
    "ravyn lenae": "R&B", "the delfonics": "Soul", "the dramatics": "Soul",
    "detroit emeralds": "Soul", "phony ppl": "R&B", "kool & the gang": "Soul",
    "phil-osophy": "Soul", "another taste": "Soul", "d.d. mirage": "Soul",
    "lady blackbird": "Soul", "bob & gene": "Soul", "blaze": "House",
    "dinnerparty": "Soul", "cise star": "Hip-Hop",
    # Jazz
    "ahmad jamal": "Jazz", "grant green": "Jazz", "butcher brown": "Jazz",
    "brandee younger": "Jazz", "polyrhythmics": "Jazz", "alfa mist": "Jazz",
    "emma-jean thackray": "Jazz", "dj cam": "Jazz",
    "jean-jacques perrey": "Jazz", "children of zeus": "Hip-Hop",
    "nubya garcia": "Jazz", "love me not": "Jazz",
    # Drum & Bass
    "calibre": "Drum and Bass", "alix perez": "Drum and Bass", "adam f": "Drum and Bass",
    "bcee": "Drum and Bass", "anile": "Drum and Bass", "break": "Drum and Bass",
    "mat zo": "Drum and Bass", "4am kru": "Drum and Bass", "coco bryce": "Drum and Bass",
    "deeb": "Drum and Bass", "q project": "Drum and Bass", "omni trio": "Drum and Bass",
    "bop & chime": "Drum and Bass", "archangel": "Drum and Bass",
    "askel & elere": "Drum and Bass", "anushka": "Drum and Bass",
    "roni size": "Drum and Bass", "hopper1000": "Drum and Bass",
    "echo shift": "Drum and Bass", "fox l-side": "Drum and Bass",
    "the chameleon": "Drum and Bass", "deeprot": "Drum and Bass",
    "dangerous goods": "Drum and Bass", "bop": "Drum and Bass",
    "sio": "Drum and Bass",
    # House / Electronic
    "dusky": "House", "chaos in the cbd": "House", "1-800 girls": "House",
    "dj koze": "House", "logic1000": "House", "daft punk": "House",
    "lazy deejay": "House", "username": "House", "barry can't swim": "House",
    # Ambient / Downtempo
    "maribou state": "House", "the album leaf": "House", "bobby lee": "House",
    "dahlak band": "House", "mr. yt": "House", "casino versus japan": "House",
    "charlie forrest": "House", "bad tuner": "House",
    # Rock / Alternative
    "radiohead": "Rock", "big thief": "Rock",
    "khruangbin": "Rock", "night beats": "Rock", "la lom": "Rock",
    "tijuana panthers": "Rock", "chastity belt": "Rock",
    "built to spill": "Rock", "stereolab": "Jazz",
    "cocteau twins": "Rock", "clinic": "Rock", "can": "Jazz",
    "beak_": "Jazz", "haley heynderickx": "Country",
    "atlas sound": "Rock", "destroyer": "Rock",
    "ra ra riot": "Rock", "panda bear": "Jazz",
    "the lazy eyes": "Rock", "great grandpa": "Rock", "coral grief": "Rock",
    "roswit": "Rock", "saya gray": "Rock", "cool sounds": "Rock",
    "daniel romano": "Country", "mereba": "Rock", "dehd": "Rock",
    "deftones": "Rock", "work money death": "Rock",
    "healing gems": "Rock", "hataalii": "Rock", "iji": "Rock",
    "abracadabra": "Rock", "unknown mortal orchestra": "Rock",
    # Reggae
    "bob marley": "Soul", "chronixx": "Soul", "ernest ranglin": "Soul",
    # Funk
    "yin yin": "Soul", "the pro-teens": "Soul", "cymande": "Soul",
    "ocote soul Sounds": "Soul", "adrian younge": "Soul", "l'eclair": "Soul",
    # Experimental / Other
    "ela minus": "Jazz", "the avalanches": "Jazz",
    "depth charge": "Jazz", "confidence man": "Rock",
    "tv girl": "Rock", "george clanton": "Rock",
    "sven wunder": "Rock", "speaker louis": "Jazz",
    "charlie hilton": "Rock", "bubble love": "Rock",
    "bon iver": "Rock", "billie eilish": "Rock",
    "benee": "Rock", "nilüfer yanya": "Rock",
    "cindy lee": "Jazz", "suburban architecture": "Rock",
    "art feynman": "Rock", "chediak": "Jazz",
    "chrystal": "Rock", "brien & ffolliott": "Rock",
    "balthvs": "Rock", "dan the automator": "Hip-Hop",
    "blade": "Classical", "ata records": "Jazz",
    "takeshi terauchi": "Jazz", "ape escape": "Jazz",
    "the natural yogurt band": "Jazz", "bob marley & the wailers": "Soul",
    "zeds dead": "Jazz", "damedame_": "R&B", "a_s_l": "R&B",
}

def known_artist_genre(artist):
    a = artist.lower().strip()
    if a in KNOWN_ARTISTS:
        return KNOWN_ARTISTS[a]
    for key, genre in KNOWN_ARTISTS.items():
        if len(key) > 4 and (key in a or a in key):
            return genre
    return None

# ── Tag → genre rules ─────────────────────────────────────────────────────
TAG_RULES = [
    ("drum and bass", "Drum and Bass"), ("drum & bass", "Drum and Bass"),
    ("liquid dnb", "Drum and Bass"), ("neurofunk", "Drum and Bass"),
    ("jungle", "Drum and Bass"), ("dnb", "Drum and Bass"),
    ("uk garage", "House"), ("2-step", "House"), ("2 step", "House"),
    ("speed garage", "House"),
    ("deep house", "House"), ("bass house", "House"), ("tech house", "House"),
    ("chicago house", "House"), ("progressive house", "House"), ("house", "House"),
    ("techno", "House"),
    ("hip-hop", "Hip-Hop"), ("hip hop", "Hip-Hop"), ("rap", "Hip-Hop"),
    ("boom bap", "Hip-Hop"), ("trap", "Hip-Hop"), ("grime", "Hip-Hop"),
    ("neo soul", "Soul"), ("soul", "Soul"),
    ("rhythm and blues", "R&B"), ("r&b", "R&B"),
    ("acid jazz", "Jazz"), ("jazz funk", "Jazz"), ("nu jazz", "Jazz"),
    ("jazz", "Jazz"),
    ("blues", "Jazz"),
    ("funk", "Soul"),
    ("dancehall", "Soul"), ("reggae", "Soul"), ("dub reggae", "Soul"),
    ("ska", "Soul"),
    ("heavy metal", "Metal"), ("metal", "Metal"), ("hardcore", "Metal"),
    ("americana", "Country"), ("folk", "Country"), ("country", "Country"),
    ("classical", "Classical"), ("orchestral", "Classical"),
    ("ambient", "House"), ("downtempo", "House"), ("drone", "House"),
    ("chillout", "House"), ("chillwave", "House"), ("new age", "House"),
    ("trip-hop", "Jazz"), ("trip hop", "Jazz"),
    ("broken beat", "Jazz"), ("breakbeat", "Jazz"),
    ("krautrock", "Jazz"), ("noise", "Jazz"),
    ("electronica", "Jazz"), ("experimental", "Jazz"),
    ("garage rock", "Rock"), ("psychedelic rock", "Rock"), ("art rock", "Rock"),
    ("punk", "Rock"), ("grunge", "Rock"), ("rock", "Rock"),
    ("indie pop", "Rock"), ("indie rock", "Rock"),
    ("indie", "Rock"), ("alternative", "Rock"),
    ("synth-pop", "Rock"), ("synthpop", "Rock"),
    ("electropop", "Rock"), ("art pop", "Rock"),
    ("shoegaze", "Rock"), ("post-punk", "Rock"), ("pop", "Rock"),
    ("electronic", "Jazz"), ("electro", "Jazz"),
]

BAD_TAGS = {'other','[unknown]','n;a','','data & other','1–4 wochen',
            '1–9 wochen','3/5','alliteration','funk3','instrumental',
            'unknown','n/a','psychedelic'}

def tags_to_genre(tags):
    for tag in [t.lower().strip() for t in tags]:
        if tag in BAD_TAGS:
            continue
        for pattern, genre in TAG_RULES:
            if pattern in tag:
                return genre
    return None

# ── Clean artist/title ────────────────────────────────────────────────────
def clean(raw_title, raw_artist):
    artist = re.sub(r'^\d{2,4}[-_.\s]+', '', raw_artist.strip()).strip()
    title  = raw_title.strip()
    if artist.lower() in ('unknown', '', 'n/a', '[unknown]'):
        m = re.match(r'^(.+?)\s*[-–]\s*(.+)$', title)
        if m and not re.match(r'^\d+$', m.group(1).strip()) and len(m.group(1).strip()) > 2:
            artist = m.group(1).strip()
            title  = m.group(2).strip()
        else:
            artist = ""
    artist = re.sub(r'^\d{2,4}[-_.\s]+', '', artist).strip()
    title  = re.sub(r'^\d{2,4}[-_.\s]+', '', title).strip()
    title  = re.sub(r'^AUDIO:\s*', '', title, flags=re.IGNORECASE)
    title  = re.sub(r'\s*[\(\[]?(Official\s*(Video|Audio|Lyric)|Lyrics?|4K|HD)[\)\]]?\s*$', '', title, flags=re.IGNORECASE)
    title  = re.sub(r'\s+', ' ', title).strip()
    return artist.strip(), title.strip()

def strip_title(title):
    """Remove remix/feat noise for simpler searches."""
    t = re.sub(r'\s*[\(\[].*?[\)\]]', '', title).strip()
    t = re.sub(r'\s*(feat\.?|ft\.?).+$', '', t, flags=re.IGNORECASE).strip()
    return t

# ── MusicBrainz ───────────────────────────────────────────────────────────
MB = "https://musicbrainz.org/ws/2"
MBH = {"User-Agent": "crate-genre-fix/4.0 (crate@example.com)"}

def mb_tags(obj):
    tags = [t["name"] for t in obj.get("tags", [])]
    for rel in obj.get("releases", [])[:2]:
        tags += [t["name"] for t in rel.get("release-group", {}).get("tags", [])]
    for ac in obj.get("artist-credit", [])[:1]:
        tags += [t["name"] for t in ac.get("artist", {}).get("tags", [])]
    return tags

def mb_lookup(artist, title):
    queries = []
    if artist and title:
        queries.append(f'recording:"{title}" AND artistname:"{artist}"')
        st = strip_title(title)
        if st and st != title:
            queries.append(f'recording:"{st}" AND artistname:"{artist}"')
    if title:
        queries.append(f'recording:"{title}"')
    if artist:
        queries.append(f'recording:"{strip_title(title)}"') if title else None

    for q in queries:
        try:
            r = requests.get(f"{MB}/recording",
                params={"query": q, "limit": 3, "fmt": "json",
                        "inc": "tags+artist-credits+releases"},
                headers=MBH, timeout=10)
            if r.status_code in (429, 503):
                time.sleep(3); continue
            if r.status_code != 200:
                continue
            recs = r.json().get("recordings", [])
            if recs:
                g = tags_to_genre(mb_tags(recs[0]))
                if g:
                    return g
        except:
            pass
    # Artist-only fallback
    if artist:
        try:
            r = requests.get(f"{MB}/artist",
                params={"query": f'artist:"{artist}"', "limit": 1,
                        "fmt": "json", "inc": "tags"},
                headers=MBH, timeout=10)
            if r.status_code == 200:
                artists = r.json().get("artists", [])
                if artists:
                    g = tags_to_genre([t["name"] for t in artists[0].get("tags", [])])
                    if g:
                        return g
        except:
            pass
    return None

# ── Discogs ───────────────────────────────────────────────────────────────
DG = "https://api.discogs.com"
DGH = {"Authorization": f"Discogs token={DISCOGS_TOKEN}",
       "User-Agent": "CrateApp/1.0"}

DISCOGS_GENRE_MAP = {
    "electronic": "Jazz", "hip hop": "Hip-Hop", "hip-hop": "Hip-Hop",
    "soul": "Soul", "r&b": "R&B", "funk": "Soul", "jazz": "Jazz",
    "blues": "Jazz", "reggae": "Soul", "rock": "Rock", "pop": "Rock",
    "classical": "Classical", "folk": "Country", "country": "Country",
    "latin": "Jazz", "world": "Jazz", "children's": "Rock",
    "stage & screen": "Rock", "brass & military": "Classical",
    "non-music": "Jazz",
}

DISCOGS_STYLE_MAP = {
    "drum n bass": "Drum and Bass", "drum & bass": "Drum and Bass",
    "dnb": "Drum and Bass", "jungle": "Drum and Bass", "neurofunk": "Drum and Bass",
    "liquid funk": "Drum and Bass", "liquid dnb": "Drum and Bass",
    "uk garage": "House", "2-step": "House", "garage": "House",
    "house": "House", "deep house": "House", "tech house": "House",
    "techno": "House", "minimal techno": "House",
    "hip-hop": "Hip-Hop", "rap": "Hip-Hop", "trap": "Hip-Hop",
    "boom bap": "Hip-Hop", "grime": "Hip-Hop",
    "soul": "Soul", "neo soul": "Soul",
    "r&b": "R&B", "contemporary r&b": "R&B",
    "jazz": "Jazz", "acid jazz": "Jazz", "nu jazz": "Jazz",
    "blues": "Jazz",
    "funk": "Soul",
    "reggae": "Soul", "dub": "Soul", "dancehall": "Soul", "ska": "Soul",
    "metal": "Metal", "heavy metal": "Metal", "hardcore": "Metal",
    "folk": "Country", "americana": "Country",
    "classical": "Classical",
    "ambient": "House", "downtempo": "House", "drone": "House",
    "trip hop": "Jazz", "trip-hop": "Jazz",
    "breakbeat": "Jazz", "experimental": "Jazz",
    "electronica": "Jazz", "electro": "Jazz",
    "indie rock": "Rock", "indie pop": "Rock",
    "alternative rock": "Rock", "shoegaze": "Rock",
    "post-punk": "Rock", "synth-pop": "Rock",
    "punk": "Rock", "grunge": "Rock",
}

def discogs_lookup(artist, title):
    queries = []
    if artist and title:
        queries.append({"artist": artist, "track": strip_title(title), "type": "release"})
        queries.append({"artist": artist, "track": title, "type": "release"})
    if title:
        queries.append({"track": strip_title(title), "type": "release"})

    for params in queries:
        try:
            r = requests.get(f"{DG}/database/search", params=params,
                             headers=DGH, timeout=10)
            if r.status_code == 429:
                time.sleep(5); continue
            if r.status_code != 200:
                continue
            results = r.json().get("results", [])
            if not results:
                continue
            res = results[0]
            # Check styles first (more specific)
            for style in res.get("style", []):
                g = DISCOGS_STYLE_MAP.get(style.lower())
                if g:
                    return g
            # Then genres
            for genre in res.get("genre", []):
                g = DISCOGS_GENRE_MAP.get(genre.lower())
                if g:
                    return g
        except:
            pass
    return None

# ── Last.fm ───────────────────────────────────────────────────────────────
LFM = "http://ws.audioscrobbler.com/2.0/"

def lastfm_lookup(artist, title):
    """Try track.getTopTags then artist.getTopTags."""
    if artist and title:
        try:
            r = requests.get(LFM, params={
                "method": "track.getTopTags", "artist": artist,
                "track": title, "api_key": LASTFM_KEY, "format": "json"
            }, timeout=10)
            if r.status_code == 200:
                tags = [t["name"] for t in
                        r.json().get("toptags", {}).get("tag", [])[:10]]
                g = tags_to_genre(tags)
                if g:
                    return g
        except:
            pass

    if artist:
        try:
            r = requests.get(LFM, params={
                "method": "artist.getTopTags", "artist": artist,
                "api_key": LASTFM_KEY, "format": "json"
            }, timeout=10)
            if r.status_code == 200:
                tags = [t["name"] for t in
                        r.json().get("toptags", {}).get("tag", [])[:10]]
                g = tags_to_genre(tags)
                if g:
                    return g
        except:
            pass
    return None

# ── Init Firebase ─────────────────────────────────────────────────────────
with open('tracks.csv', encoding='utf-8-sig') as f:
    rows = list(csv.DictReader(f))
print(f"Loaded {len(rows)} tracks\n")

cred = credentials.Certificate('serviceAccountKey.json')
firebase_admin.initialize_app(cred)
db = firestore.client()

print("Loading Firestore docs...")
fs_docs = {doc.id: doc.to_dict() for doc in db.collection("tracks").stream()}
print(f"Found {len(fs_docs)} Firestore docs\n")

def norm(s):
    return re.sub(r'\s+', ' ', (s or '').lower().strip())

fs_by_title = {}
for doc_id, data in fs_docs.items():
    fs_by_title.setdefault(norm(data.get('title', '')), []).append(doc_id)

# ── Process ───────────────────────────────────────────────────────────────
results = []

for i, row in enumerate(rows):
    raw_genre = row.get('genre', '').strip()
    artist, title = clean(row.get('title', ''), row.get('artist', ''))
    genre  = None
    source = ""

    # 1. Known artist
    genre = known_artist_genre(artist)
    if genre: source = "known_artist"

    # 2. Existing tag (if not garbage)
    if not genre and raw_genre.lower() not in BAD_TAGS:
        genre = tags_to_genre([raw_genre])
        if genre: source = "existing_tag"

    # 3. MusicBrainz
    if not genre:
        genre = mb_lookup(artist, title)
        if genre: source = "musicbrainz"
        time.sleep(0.8)

    # 4. Discogs
    if not genre:
        genre = discogs_lookup(artist, title)
        if genre: source = "discogs"
        time.sleep(0.5)

    # 5. Last.fm
    if not genre:
        genre = lastfm_lookup(artist, title)
        if genre: source = "lastfm"
        time.sleep(0.3)

    # 6. Fallback — leave blank rather than invent a banned genre
    if not genre:
        genre  = ""
        source = "fallback"

    flag = "⚠️ " if source == "fallback" else "✓  "
    print(f"[{i+1:3d}/{len(rows)}] {flag}{source:<14} {artist[:22]:<22} | {title[:32]:<32} | {raw_genre[:12]:<12} → {genre}")

    results.append({
        "title":     title,
        "artist":    artist,
        "raw_genre": raw_genre,
        "genre":     genre,
        "source":    source,
    })

# ── Write to Firestore ────────────────────────────────────────────────────
print("\nWriting to Firestore...")
updated = no_match = 0
for res in results:
    key = norm(res['title'])
    doc_ids = fs_by_title.get(key, [])
    if not doc_ids:
        for fk, fids in fs_by_title.items():
            if len(key) > 8 and key[:20] in fk:
                doc_ids = fids; break
    if doc_ids:
        db.collection("tracks").document(doc_ids[0]).update({"genre": to_canonical(res['genre'])})
        updated += 1
    else:
        no_match += 1

print(f"✅ Updated: {updated}  |  ⚠️  No Firestore match: {no_match}")

# ── Review CSV (fallbacks first) ──────────────────────────────────────────
results.sort(key=lambda r: (0 if r['source'] == 'fallback' else 1, r['artist'].lower()))
with open('genres_review.csv', 'w', newline='', encoding='utf-8') as f:
    w = csv.DictWriter(f, fieldnames=['source','artist','title','raw_genre','genre'])
    w.writeheader()
    w.writerows(results)

from collections import Counter
print("\nGenre distribution:")
for g, c in sorted(Counter(r['genre'] for r in results).items(), key=lambda x: -x[1]):
    print(f"  {c:3d}  {g}")
print("\nSource breakdown:")
for s, c in sorted(Counter(r['source'] for r in results).items(), key=lambda x: -x[1]):
    print(f"  {c:3d}  {s}")
print("\n✅ genres_review.csv saved — fallbacks sorted to top for easy review")
