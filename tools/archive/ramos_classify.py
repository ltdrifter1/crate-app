# -*- coding: utf-8 -*-
"""Classify the Ramos crate. Existing evie map first, then the Ramos-specific
map, then default to Electronic."""
import os, sys, json, re, csv, unicodedata
from collections import Counter
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from genres import ARTIST_GENRE
from ramos_genres import RAMOS_GENRE, DEFAULT

SP = os.path.dirname(os.path.abspath(__file__))
VALID = ['Electronic', 'Hip-Hop', 'R&B & Soul', 'Rock', 'Metal',
         'Jazz', 'Classical', 'Country & Folk']
DJ = re.compile(r'\s*-\s*\d{1,2}[AB]\s*-\s*\d{2,3}$')
DUP = re.compile(r'-\d+$')


def fold(s):
    s = unicodedata.normalize('NFKD', (s or '').lower())
    s = ''.join(c for c in s if not unicodedata.combining(c))
    return re.sub(r'\s+', ' ', s).strip()


LOOKUP = {}
for src in (ARTIST_GENRE, RAMOS_GENRE):
    for k, v in src.items():
        LOOKUP.setdefault(fold(k), v)
# Ramos map wins where the two disagree (crate-specific context)
for k, v in RAMOS_GENRE.items():
    LOOKUP[fold(k)] = v

rows = json.load(open(os.path.join(SP, 'ramos_tags.json'), encoding='utf-8'))


def artist_of(r):
    if r['artist']:
        return r['artist'].strip()
    stem = DJ.sub('', r['file'][:-4])
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
    for part in re.split(r'\s*(?:&|,|\bfeat\.?\b|\bft\.?\b|\bx\b|\bvs\.?\b|\bpresents\b)\s*', f):
        part = part.strip()
        if part and part in LOOKUP:
            return LOOKUP[part]
    return None


out = []
for r in rows:
    a = artist_of(r)
    g = lookup(a)
    out.append({'file': r['file'], 'artist': a, 'title': r['title'],
                'genre': g or DEFAULT, 'src': 'artist' if g else 'default'})
    assert out[-1]['genre'] in VALID

json.dump(out, open(os.path.join(SP, 'ramos_plan.json'), 'w', encoding='utf-8'),
          ensure_ascii=False, indent=0)
with open(os.path.join(SP, 'ramos_plan.csv'), 'w', encoding='utf-8', newline='') as f:
    w = csv.writer(f)
    w.writerow(['genre', 'artist', 'title', 'file', 'matched_by'])
    for o in sorted(out, key=lambda x: (x['genre'], x['artist'].lower())):
        w.writerow([o['genre'], o['artist'], o['title'], o['file'], o['src']])

print(f'TOTAL {len(out)}\n--- GENRE DISTRIBUTION ---')
for g, c in Counter(o['genre'] for o in out).most_common():
    print(f'{c:5d}  {100*c/len(out):5.1f}%  {g}')
print('\n--- MATCH SOURCE ---')
for s, c in Counter(o['src'] for o in out).most_common():
    print(f'{c:5d}  {s}')
d = Counter(o['artist'] for o in out if o['src'] == 'default' and o['artist'])
print(f'\ndistinct artists defaulted to Electronic: {len(d)}')
print('--- TOP 45 DEFAULTED (sanity check) ---')
for a, c in d.most_common(45):
    print(f'{c:4d}  {a}')
