# -*- coding: utf-8 -*-
import json, os, re, sys, csv, unicodedata
from collections import Counter
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from genres import (ARTIST_GENRE, DEFAULT, VALID, SKIP_SUBSTRINGS,
                    FILENAME_GENRE, FILE_OVERRIDES)

SP = os.path.dirname(os.path.abspath(__file__))
rows = json.load(open(os.path.join(SP, 'tags_raw.json'), encoding='utf-8'))


def fold(s):
    """lowercase, strip diacritics, collapse space/punct for fuzzy key match"""
    s = unicodedata.normalize('NFKD', s.lower())
    s = ''.join(c for c in s if not unicodedata.combining(c))
    s = re.sub(r'\s+', ' ', s).strip()
    return s


# folded lookup built once
FOLDED = {}
for k, v in ARTIST_GENRE.items():
    FOLDED.setdefault(fold(k), v)


def artist_of(r):
    if r['artist']:
        return r['artist'].strip()
    parts = re.split(r'\s+-\s+', r['file'][:-4], maxsplit=1)
    return parts[0].strip() if len(parts) == 2 else ''


def lookup_artist(a):
    if not a:
        return None
    f = fold(a)
    if f in FOLDED:
        return FOLDED[f]
    # strip leading "the "
    if f.startswith('the ') and f[4:] in FOLDED:
        return FOLDED[f[4:]]
    if 'the ' + f in FOLDED:
        return FOLDED['the ' + f]
    # collaboration: try each side of & / , / feat / x
    for part in re.split(r'\s*(?:&|,|\bfeat\.?\b|\bft\.?\b|\bvs\.?\b|\bwith\b)\s*', f):
        part = part.strip()
        if part and part in FOLDED:
            return FOLDED[part]
    return None


out = []
skipped = []
for r in rows:
    fn_l = fold(r['file'])
    if any(s in fn_l for s in (fold(x) for x in SKIP_SUBSTRINGS)):
        skipped.append(r['file'])
        continue

    a = artist_of(r)
    if r['file'] in FILE_OVERRIDES:
        out.append({'file': r['file'], 'artist': a,
                    'genre': FILE_OVERRIDES[r['file']], 'src': 'override'})
        continue

    g = lookup_artist(a)
    src = 'artist' if g else ''

    if not g and not a:
        # ONLY for files with no parseable "Artist - Title". Applying these
        # loose substrings to files that already have an artist would let
        # generic keys ("boys", "wild", "trust") match song titles.
        best = None
        for key, gg in FILENAME_GENRE.items():
            if fold(key) in fn_l and (best is None or len(key) > len(best[0])):
                best = (key, gg)
        if best:
            g, src = best[1], 'filename'

    if not g:
        g, src = DEFAULT, 'default'

    assert g in VALID, g
    out.append({'file': r['file'], 'artist': a, 'genre': g, 'src': src})

with open(os.path.join(SP, 'plan.json'), 'w', encoding='utf-8') as f:
    json.dump(out, f, ensure_ascii=False, indent=0)
with open(os.path.join(SP, 'skipped.txt'), 'w', encoding='utf-8') as f:
    f.write('\n'.join(skipped))

with open(os.path.join(SP, 'plan.csv'), 'w', encoding='utf-8', newline='') as f:
    w = csv.writer(f)
    w.writerow(['genre', 'artist', 'file', 'matched_by'])
    for o in sorted(out, key=lambda x: (x['genre'], x['artist'].lower())):
        w.writerow([o['genre'], o['artist'], o['file'], o['src']])

print(f'TOTAL {len(rows)}  tagged {len(out)}  skipped(non-music) {len(skipped)}\n')
print('--- GENRE DISTRIBUTION ---')
for g, c in Counter(o['genre'] for o in out).most_common():
    print(f'{c:5d}  {100*c/len(out):5.1f}%  {g}')
print('\n--- MATCH SOURCE ---')
for s, c in Counter(o['src'] for o in out).most_common():
    print(f'{c:5d}  {s}')

# artists that fell through to the Rock default, by track count — review aid
dflt = Counter(o['artist'] for o in out if o['src'] == 'default' and o['artist'])
with open(os.path.join(SP, 'defaulted.txt'), 'w', encoding='utf-8') as f:
    for a, c in dflt.most_common():
        f.write(f'{c}\t{a}\n')
print(f'\ndistinct artists defaulted to Rock: {len(dflt)}')
print('\n--- TOP 60 DEFAULTED-TO-ROCK ARTISTS (sanity check) ---')
for a, c in dflt.most_common(60):
    print(f'{c:3d}  {a}')
