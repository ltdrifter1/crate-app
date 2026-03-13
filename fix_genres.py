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

# ── API keys ──────────────────────────────────────────────────────────────
DISCOGS_TOKEN = "mhrANiNVwVpTEfEfsuljWYMijVhCiseGePGyNFRC"
LASTFM_KEY    = "140694bd2e12b370905d290375d812a0"

# ── Allowed genres ────────────────────────────────────────────────────────
ALLOWED = [
    "Soul", "R&B", "Jazz", "Blues", "Funk",
    "Hip-Hop", "House", "Techno", "Ambient",
    "Reggae", "Drum & Bass", "UK Garage", "Metal", "Folk",
    "Rock", "Alternative", "Classical", "Experimental",
]

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
    "detroit emeralds": "Soul", "phony ppl": "R&B", "kool & the gang": "Funk",
    "phil-osophy": "Soul", "another taste": "Soul", "d.d. mirage": "Soul",
    "lady blackbird": "Soul", "bob & gene": "Soul", "blaze": "House",
    "dinnerparty": "Soul", "cise star": "Hip-Hop",
    # Jazz
    "ahmad jamal": "Jazz", "grant green": "Jazz", "butcher brown": "Jazz",
    "brandee younger": "Jazz", "polyrhythmics": "Jazz", "alfa mist": "Jazz",
    "emma-jean thackray": "Jazz", "dj cam": "Jazz",
    "jean-jacques perrey": "Experimental", "children of zeus": "Hip-Hop",
    "nubya garcia": "Jazz", "love me not": "Jazz",
    # Drum & Bass
    "calibre": "Drum & Bass", "alix perez": "Drum & Bass", "adam f": "Drum & Bass",
    "bcee": "Drum & Bass", "anile": "Drum & Bass", "break": "Drum & Bass",
    "mat zo": "Drum & Bass", "4am kru": "Drum & Bass", "coco bryce": "Drum & Bass",
    "deeb": "Drum & Bass", "q project": "Drum & Bass", "omni trio": "Drum & Bass",
    "bop & chime": "Drum & Bass", "archangel": "Drum & Bass",
    "askel & elere": "Drum & Bass", "anushka": "Drum & Bass",
    "roni size": "Drum & Bass", "hopper1000": "Drum & Bass",
    "echo shift": "Drum & Bass", "fox l-side": "Drum & Bass",
    "the chameleon": "Drum & Bass", "deeprot": "Drum & Bass",
    "dangerous goods": "Drum & Bass", "bop": "Drum & Bass",
    "sio": "Drum & Bass",
    # House / Electronic
    "dusky": "House", "chaos in the cbd": "House", "1-800 girls": "House",
    "dj koze": "House", "logic1000": "House", "daft punk": "House",
    "lazy deejay": "House", "username": "House", "barry can't swim": "House",
    # Ambient / Downtempo
    "maribou state": "Ambient", "the album leaf": "Ambient", "bobby lee": "Ambient",
    "dahlak band": "Ambient", "mr. yt": "Ambient", "casino versus japan": "Ambient",
    "charlie forrest": "Ambient", "bad tuner": "Ambient",
    # Rock / Alternative
    "radiohead": "Alternative", "big thief": "Alternative",
    "khruangbin": "Alternative", "night beats": "Rock", "la lom": "Rock",
    "tijuana panthers": "Rock", "chastity belt": "Alternative",
    "built to spill": "Rock", "stereolab": "Experimental",
    "cocteau twins": "Alternative", "clinic": "Rock", "can": "Experimental",
    "beak_": "Experimental", "haley heynderickx": "Folk",
    "atlas sound": "Alternative", "destroyer": "Alternative",
    "ra ra riot": "Alternative", "panda bear": "Experimental",
    "the lazy eyes": "Rock", "great grandpa": "Rock", "coral grief": "Rock",
    "roswit": "Alternative", "saya gray": "Alternative", "cool sounds": "Rock",
    "daniel romano": "Folk", "mereba": "Alternative", "dehd": "Alternative",
    "deftones": "Rock", "work money death": "Alternative",
    "healing gems": "Alternative", "hataalii": "Alternative", "iji": "Alternative",
    "abracadabra": "Rock", "unknown mortal orchestra": "Rock",
    # Reggae
    "bob marley": "Reggae", "chronixx": "Reggae", "ernest ranglin": "Reggae",
    # Funk
    "yin yin": "Funk", "the pro-teens": "Funk", "cymande": "Funk",
    "ocote soul Sounds": "Funk", "adrian younge": "Soul", "l'eclair": "Funk",
    # Experimental / Other
    "ela minus": "Experimental", "the avalanches": "Experimental",
    "depth charge": "Experimental", "confidence man": "Alternative",
    "tv girl": "Alternative", "george clanton": "Alternative",
    "sven wunder": "Alternative", "speaker louis": "Experimental",
    "charlie hilton": "Alternative", "bubble love": "Alternative",
    "bon iver": "Alternative", "billie eilish": "Alternative",
    "benee": "Alternative", "nilüfer yanya": "Alternative",
    "cindy lee": "Experimental", "suburban architecture": "Alternative",
    "art feynman": "Alternative", "chediak": "Experimental",
    "chrystal": "Alternative", "brien & ffolliott": "Alternative",
    "balthvs": "Alternative", "dan the automator": "Hip-Hop",
    "blade": "Classical", "ata records": "Experimental",
    "takeshi terauchi": "Experimental", "ape escape": "Experimental",
    "the natural yogurt band": "Experimental", "bob marley & the wailers": "Reggae",
    "zeds dead": "Experimental", "damedame_": "R&B", "a_s_l": "R&B",
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
    ("drum and bass", "Drum & Bass"), ("drum & bass", "Drum & Bass"),
    ("liquid dnb", "Drum & Bass"), ("neurofunk", "Drum & Bass"),
    ("jungle", "Drum & Bass"), ("dnb", "Drum & Bass"),
    ("uk garage", "UK Garage"), ("2-step", "UK Garage"), ("2 step", "UK Garage"),
    ("speed garage", "UK Garage"),
    ("deep house", "House"), ("bass house", "House"), ("tech house", "House"),
    ("chicago house", "House"), ("progressive house", "House"), ("house", "House"),
    ("techno", "Techno"),
    ("hip-hop", "Hip-Hop"), ("hip hop", "Hip-Hop"), ("rap", "Hip-Hop"),
    ("boom bap", "Hip-Hop"), ("trap", "Hip-Hop"), ("grime", "Hip-Hop"),
    ("neo soul", "Soul"), ("soul", "Soul"),
    ("rhythm and blues", "R&B"), ("r&b", "R&B"),
    ("acid jazz", "Jazz"), ("jazz funk", "Jazz"), ("nu jazz", "Jazz"),
    ("jazz", "Jazz"),
    ("blues", "Blues"),
    ("funk", "Funk"),
    ("dancehall", "Reggae"), ("reggae", "Reggae"), ("dub reggae", "Reggae"),
    ("ska", "Reggae"),
    ("heavy metal", "Metal"), ("metal", "Metal"), ("hardcore", "Metal"),
    ("americana", "Folk"), ("folk", "Folk"), ("country", "Folk"),
    ("classical", "Classical"), ("orchestral", "Classical"),
    ("ambient", "Ambient"), ("downtempo", "Ambient"), ("drone", "Ambient"),
    ("chillout", "Ambient"), ("chillwave", "Ambient"), ("new age", "Ambient"),
    ("trip-hop", "Experimental"), ("trip hop", "Experimental"),
    ("broken beat", "Experimental"), ("breakbeat", "Experimental"),
    ("krautrock", "Experimental"), ("noise", "Experimental"),
    ("electronica", "Experimental"), ("experimental", "Experimental"),
    ("garage rock", "Rock"), ("psychedelic rock", "Rock"), ("art rock", "Rock"),
    ("punk", "Rock"), ("grunge", "Rock"), ("rock", "Rock"),
    ("indie pop", "Alternative"), ("indie rock", "Alternative"),
    ("indie", "Alternative"), ("alternative", "Alternative"),
    ("synth-pop", "Alternative"), ("synthpop", "Alternative"),
    ("electropop", "Alternative"), ("art pop", "Alternative"),
    ("shoegaze", "Alternative"), ("post-punk", "Alternative"), ("pop", "Alternative"),
    ("electronic", "Experimental"), ("electro", "Experimental"),
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
    "electronic": "Experimental", "hip hop": "Hip-Hop", "hip-hop": "Hip-Hop",
    "soul": "Soul", "r&b": "R&B", "funk": "Funk", "jazz": "Jazz",
    "blues": "Blues", "reggae": "Reggae", "rock": "Rock", "pop": "Alternative",
    "classical": "Classical", "folk": "Folk", "country": "Folk",
    "latin": "Experimental", "world": "Experimental", "children's": "Alternative",
    "stage & screen": "Alternative", "brass & military": "Classical",
    "non-music": "Experimental",
}

DISCOGS_STYLE_MAP = {
    "drum n bass": "Drum & Bass", "drum & bass": "Drum & Bass",
    "dnb": "Drum & Bass", "jungle": "Drum & Bass", "neurofunk": "Drum & Bass",
    "liquid funk": "Drum & Bass", "liquid dnb": "Drum & Bass",
    "uk garage": "UK Garage", "2-step": "UK Garage", "garage": "UK Garage",
    "house": "House", "deep house": "House", "tech house": "House",
    "techno": "Techno", "minimal techno": "Techno",
    "hip-hop": "Hip-Hop", "rap": "Hip-Hop", "trap": "Hip-Hop",
    "boom bap": "Hip-Hop", "grime": "Hip-Hop",
    "soul": "Soul", "neo soul": "Soul",
    "r&b": "R&B", "contemporary r&b": "R&B",
    "jazz": "Jazz", "acid jazz": "Jazz", "nu jazz": "Jazz",
    "blues": "Blues",
    "funk": "Funk",
    "reggae": "Reggae", "dub": "Reggae", "dancehall": "Reggae", "ska": "Reggae",
    "metal": "Metal", "heavy metal": "Metal", "hardcore": "Metal",
    "folk": "Folk", "americana": "Folk",
    "classical": "Classical",
    "ambient": "Ambient", "downtempo": "Ambient", "drone": "Ambient",
    "trip hop": "Experimental", "trip-hop": "Experimental",
    "breakbeat": "Experimental", "experimental": "Experimental",
    "electronica": "Experimental", "electro": "Experimental",
    "indie rock": "Alternative", "indie pop": "Alternative",
    "alternative rock": "Alternative", "shoegaze": "Alternative",
    "post-punk": "Alternative", "synth-pop": "Alternative",
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

    # 6. Experimental fallback
    if not genre:
        genre  = "Experimental"
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
        db.collection("tracks").document(doc_ids[0]).update({"genre": res['genre']})
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
