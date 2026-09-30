# -*- coding: utf-8 -*-
"""Prepare audioasis:
  * move the 667 artist-less files to _review_audioasis  (your call later)
  * move hand-checked non-music to _junk_audioasis
  * move the 1 duplicate to _duplicates_audioasis
  * clean titles and write genre tags on everything that stays

  python audioasis_prep.py            # dry run
  python audioasis_prep.py --commit   # apply
"""
import os, re, sys, json, csv, shutil, unicodedata
from collections import Counter
from mutagen.id3 import ID3, TCON, TIT2, ID3NoHeaderError

SP = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, SP)
from genres import ARTIST_GENRE
from ramos_genres import RAMOS_GENRE
from promb_genres import PROMB_GENRE
from morgan_genres import MORGAN_GENRE
from audioasis_genres import AUDIOASIS_GENRE, DEFAULT

ROOT = r'E:\04_MP3_Library\audioasis'
REVIEW = r'E:\04_MP3_Library\_review_audioasis'
JUNK = r'E:\04_MP3_Library\_junk_audioasis'
DUPQ = r'E:\04_MP3_Library\_duplicates_audioasis'
COMMIT = '--commit' in sys.argv
VALID = {'Electronic', 'Hip-Hop', 'R&B & Soul', 'Rock', 'Metal',
         'Jazz', 'Classical', 'Country & Folk'}

# hand-checked non-music that DOES have an artist tag. The keyword sweep
# flagged 29; 20 were real bands ("Advertisement", "Bad News Botanists",
# "Built To Spill - The Weather") and are deliberately NOT here.
JUNK_TITLES = [
    ('1966 Fastback', 'Total Parts Review'),
    ('Can’t Sleep? Try This ASMR Trigger', None),
    ('HOW to CROCHET a CARNATION FLOWER', None),
    ('How to read an architectural scale', None),
    ('My Mucha Inspired APOLLO Is Here!', None),
    ('"My Parents Don\'t Know": Unpacking', None),
    ('Oblé Reed', 'Treefort Interview'),
    ('Was There a 4 Hour Cut interview', None),
    ('Braden Blake and The Oh Wells', 'Album Trailer'),
]

JUNK_PAREN = re.compile(
    r'\s*[\(\[]\s*(official\s*(music\s*)?(video|audio)?|music\s*video|'
    r'lyrics?\s*video|lyrics?|hq|hd|4k|audio|visualizer|remaster(ed)?\s*\d*|'
    r'\d{4}|hd widescreen)\s*[\)\]]', re.I)
JUNK_TAIL = re.compile(
    r'\s*(\[?(official\s*)?(music\s*)?video\]?|\[hq\]|\[hd\]|music\s*video|'
    r'\b(hd|hq|4k)\b|\.mp4|\.avi)\s*$', re.I)


def clean_title(t):
    if not t:
        return t
    prev = None
    while prev != t:
        prev = t
        t = JUNK_PAREN.sub('', t)
        t = JUNK_TAIL.sub('', t)
    return re.sub(r'\s{2,}', ' ', t).strip(' -–_.,|')


def fold(s):
    s = unicodedata.normalize('NFKD', (s or '').lower())
    s = ''.join(c for c in s if not unicodedata.combining(c))
    return re.sub(r'\s+', ' ', s).strip()


LOOKUP = {}
for src in (ARTIST_GENRE, RAMOS_GENRE, PROMB_GENRE, MORGAN_GENRE):
    for k, v in src.items():
        LOOKUP.setdefault(fold(k), v)
for k, v in AUDIOASIS_GENRE.items():
    LOOKUP[fold(k)] = v


def lookup(a):
    f = fold(a)
    if not f:
        return None
    if f in LOOKUP:
        return LOOKUP[f]
    if f.startswith('the ') and f[4:] in LOOKUP:
        return LOOKUP[f[4:]]
    if 'the ' + f in LOOKUP:
        return LOOKUP['the ' + f]
    for part in re.split(r'\s*(?:&|,|\bfeat\.?\b|\bft\.?\b|\bx\b)\s*', f):
        part = part.strip()
        if part and part in LOOKUP:
            return LOOKUP[part]
    return None


rows = {r['file']: r for r in
        json.load(open(os.path.join(SP, 'audioasis.json'), encoding='utf-8'))}
dupes = json.load(open(os.path.join(SP, 'audioasis_dupes.json'), encoding='utf-8'))['dupes']

dup_move = set()
for grp in dupes:
    grp = [f for f in grp if f in rows]
    if len(grp) > 1:
        best = max(grp, key=lambda f: (0 if re.search(r'-\d+', f) else 1, -len(f)))
        dup_move.update(f for f in grp if f != best)


def is_junk(r):
    a = (r['artist'] or '').strip()
    t = (r['title'] or '').strip()
    for ja, jt in JUNK_TITLES:
        if fold(a) == fold(ja) and (jt is None or fold(jt) in fold(t)):
            return True
    return False


stats, plan, moves = Counter(), [], []
for fn, r in rows.items():
    if fn in dup_move:
        moves.append((fn, DUPQ, 'duplicate')); stats['duplicate'] += 1; continue
    if not r['artist']:
        moves.append((fn, REVIEW, 'no artist')); stats['-> review (no artist)'] += 1; continue
    if is_junk(r):
        moves.append((fn, JUNK, 'not music')); stats['-> junk (not music)'] += 1; continue

    g = lookup(r['artist'])
    genre = g or DEFAULT
    assert genre in VALID
    stats['genre ' + ('matched' if g else 'DEFAULT Rock')] += 1
    nt = clean_title(r['title'])
    if nt != r['title']:
        stats['title cleaned'] += 1
    plan.append({'file': fn, 'artist': r['artist'], 'title': nt, 'genre': genre})

    if COMMIT:
        p = os.path.join(ROOT, fn)
        try:
            try:
                tags = ID3(p)
            except ID3NoHeaderError:
                tags = ID3()
            if nt and nt != r['title']:
                tags.setall('TIT2', [TIT2(encoding=3, text=[nt])])
            tags.setall('TCON', [TCON(encoding=3, text=[genre])])
            tags.save(p, v2_version=3)
        except Exception:
            stats['WRITE ERROR'] += 1

if COMMIT:
    for fn, dest, _ in moves:
        os.makedirs(dest, exist_ok=True)
        try:
            shutil.move(os.path.join(ROOT, fn), os.path.join(dest, fn))
        except Exception:
            pass

with open(os.path.join(SP, 'audioasis_plan.csv'), 'w', encoding='utf-8', newline='') as f:
    w = csv.writer(f)
    w.writerow(['genre', 'artist', 'title', 'file'])
    for x in sorted(plan, key=lambda r: (r['genre'], r['artist'].lower())):
        w.writerow([x['genre'], x['artist'], x['title'], x['file']])

print(f"{'APPLIED' if COMMIT else 'DRY RUN'}\n")
print(f'  keep + tag : {len(plan)}')
print(f'  moved out  : {len(moves)}\n')
for k, c in stats.most_common():
    print(f'  {c:5d}  {k}')
print('\n--- GENRE DISTRIBUTION ---')
for g, c in Counter(x['genre'] for x in plan).most_common():
    print(f'  {c:5d}  {100*c/max(len(plan),1):5.1f}%  {g}')
print(f'\n--- MOVED TO JUNK ---')
for fn, dest, why in moves:
    if why == 'not music':
        print(f'  {fn[:72]}')
