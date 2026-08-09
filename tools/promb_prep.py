# -*- coding: utf-8 -*-
"""Prepare PromB: write genre tags + quarantine duplicates.
Artwork is handled separately by promb_art.py (needs network).

  python promb_prep.py            # dry run
  python promb_prep.py --commit   # write tags + move duplicates
"""
import os, re, sys, json, csv, shutil, unicodedata
from collections import Counter
from mutagen.id3 import ID3, TCON, ID3NoHeaderError

SP = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, SP)
from genres import ARTIST_GENRE
from ramos_genres import RAMOS_GENRE
from promb_genres import PROMB_GENRE, DEFAULT

ROOT = r'E:\04_MP3_Library\PromB'
QUAR = r'E:\04_MP3_Library\_duplicates_promb'
COMMIT = '--commit' in sys.argv
DJ = re.compile(r'\s*-\s*\d{1,2}[ABab]\s*-\s*\d{2,3}\s*$')
VALID = ['Electronic', 'Hip-Hop', 'R&B & Soul', 'Rock', 'Metal',
         'Jazz', 'Classical', 'Country & Folk']


def fold(s):
    s = unicodedata.normalize('NFKD', (s or '').lower())
    s = ''.join(c for c in s if not unicodedata.combining(c))
    return re.sub(r'\s+', ' ', s).strip()


LOOKUP = {}
for src in (ARTIST_GENRE, RAMOS_GENRE):
    for k, v in src.items():
        LOOKUP.setdefault(fold(k), v)
for k, v in PROMB_GENRE.items():        # crate-specific wins
    LOOKUP[fold(k)] = v

rows = json.load(open(os.path.join(SP, 'promb.json'), encoding='utf-8'))


def artist_of(r):
    if r['artist']:
        return r['artist'].strip()
    stem = DJ.sub('', os.path.splitext(r['file'])[0])
    p = re.split(r'\s+-\s+', stem, maxsplit=1)
    return p[0].strip() if len(p) == 2 else ''


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
    for part in re.split(r'\s*(?:&|,|\bfeat\.?\b|\bft\.?\b|\bx\b|\bvs\.?\b)\s*', f):
        part = part.strip()
        if part and part in LOOKUP:
            return LOOKUP[part]
    return None


plan, dist, src_c = [], Counter(), Counter()
for r in rows:
    a = artist_of(r)
    g = lookup(a)
    genre = g or DEFAULT
    assert genre in VALID
    plan.append({'file': r['file'], 'artist': a, 'genre': genre,
                 'src': 'artist' if g else 'default'})
    dist[genre] += 1
    src_c['artist' if g else 'default'] += 1

# ---- write genre tags ----
written, errors = 0, []
for p in plan:
    path = os.path.join(ROOT, p['file'])
    if not os.path.exists(path):
        continue
    if COMMIT:
        try:
            try:
                t = ID3(path)
            except ID3NoHeaderError:
                t = ID3()
            t.setall('TCON', [TCON(encoding=3, text=[p['genre']])])
            t.save(path, v2_version=3)
            written += 1
        except Exception as e:
            errors.append(f"{p['file']}\t{e}")
    else:
        written += 1

# ---- duplicates ----
dupes = json.load(open(os.path.join(SP, 'promb_dupes.json'), encoding='utf-8'))['dupes']
DL = re.compile(r'-\d+(?=\s*-\s*\d{1,2}[ABab]\s*-\s*\d{2,3}\.mp3$)|-\d+\.mp3$', re.I)
moved = []
for grp in dupes:
    grp = [f for f in grp if os.path.exists(os.path.join(ROOT, f))]
    if len(grp) < 2:
        continue
    best = max(grp, key=lambda f: (0 if DL.search(f) else 1, -len(f)))
    for f in grp:
        if f == best:
            continue
        moved.append((f, best))
        if COMMIT:
            os.makedirs(QUAR, exist_ok=True)
            shutil.move(os.path.join(ROOT, f), os.path.join(QUAR, f))

with open(os.path.join(SP, 'promb_plan.csv'), 'w', encoding='utf-8', newline='') as f:
    w = csv.writer(f)
    w.writerow(['genre', 'artist', 'file', 'matched_by'])
    for p in sorted(plan, key=lambda x: (x['genre'], x['artist'].lower())):
        w.writerow([p['genre'], p['artist'], p['file'], p['src']])

mode = 'WROTE' if COMMIT else 'WOULD WRITE (dry run)'
print(f'{mode} genre on {written} files, errors {len(errors)}\n')
print('--- GENRE DISTRIBUTION ---')
for g, c in dist.most_common():
    print(f'  {c:5d}  {100*c/len(plan):5.1f}%  {g}')
print('\n--- MATCH SOURCE ---')
for k, c in src_c.most_common():
    print(f'  {c:5d}  {k}')
print(f"\n{'MOVED' if COMMIT else 'WOULD MOVE'} {len(moved)} duplicate(s) -> {QUAR}")
for f, b in moved:
    print(f'   - {f}\n       keep: {b}')
if errors:
    print('\nERRORS:')
    for e in errors[:10]:
        print('  ' + e)
