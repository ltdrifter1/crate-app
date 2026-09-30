# -*- coding: utf-8 -*-
"""Full pre-upload verification of PromB: every field, plus sanity checks on
whether artist/title actually make sense.

  python promb_verify.py
Writes promb_review.csv listing every flagged track.
"""
import os, io, re, csv, json
from collections import Counter, defaultdict
from mutagen.id3 import ID3, ID3NoHeaderError
from PIL import Image

ROOT = r'E:\04_MP3_Library\PromB'
SP = os.path.dirname(os.path.abspath(__file__))
DJ = re.compile(r'\s*-\s*\d{1,2}[ABab]\s*-\s*\d{2,3}\s*$')
CAM = re.compile(r'^(?:[1-9]|1[0-2])[AB]$')
VALID = {'Electronic', 'Hip-Hop', 'R&B & Soul', 'Rock', 'Metal',
         'Jazz', 'Classical', 'Country & Folk'}

# things that should never survive into a track title
DIRT = re.compile(
    r'official\s*(music\s*)?(video|audio)|lyric|\bhd\b|\bhq\b|\bmp4\b|\.avi|'
    r'\(\d{4}\)\s*$|visualizer|full album|\baudio\b\s*$|\[.*?\]', re.I)
# an "artist" that reads like a sentence or a filename
BAD_ARTIST = re.compile(r'^\d{6,}|^\d{1,2}\s|\bpart \d|:\s|^the\s+\w+\s+\w+\s+\w+\s+\w+', re.I)

rows = []
files = sorted(f for f in os.listdir(ROOT) if f.lower().endswith('.mp3'))
for i, fn in enumerate(files):
    p = os.path.join(ROOT, fn)
    r = {'file': fn, 'artist': '', 'title': '', 'album': '', 'genre': '',
         'bpm': '', 'key': '', 'energy': '', 'w': 0, 'h': 0, 'art': ''}
    try:
        t = ID3(p)
        def g(fr):
            v = t.get(fr)
            try:
                return str(v.text[0]).strip() if (v and v.text) else ''
            except Exception:
                return ''
        r['artist'], r['title'] = g('TPE1'), g('TIT2')
        r['album'], r['genre'] = g('TALB'), g('TCON')
        r['bpm'], r['key'] = g('TBPM'), g('TKEY')
        for k, v in t.items():
            if k.startswith('TXXX') and getattr(v, 'desc', '').lower().startswith('energy'):
                try:
                    r['energy'] = str(v.text[0]).strip()
                except Exception:
                    pass
                break
        ap = t.getall('APIC')
        if ap:
            a = next((x for x in ap if getattr(x, 'type', None) == 3), ap[0])
            try:
                r['w'], r['h'] = Image.open(io.BytesIO(a.data)).size
                r['art'] = 'square' if abs(r['w'] / r['h'] - 1) <= 0.05 else 'THUMBNAIL'
            except Exception:
                r['art'] = 'unreadable'
        else:
            r['art'] = 'none'
    except (ID3NoHeaderError, Exception):
        r['art'] = 'no-id3'
    rows.append(r)
    if i % 200 == 0:
        print(f'{i}/{len(files)}', flush=True)

n = len(rows)
issues = Counter()
flagged = []
seen = defaultdict(list)

for r in rows:
    probs = []
    stem = DJ.sub('', os.path.splitext(r['file'])[0])

    if not r['artist']:
        probs.append('NO ARTIST')
    elif BAD_ARTIST.search(r['artist']):
        probs.append('artist looks wrong')
    elif len(r['artist']) > 55:
        probs.append('artist suspiciously long')

    if not r['title']:
        probs.append('NO TITLE')
    elif DIRT.search(r['title']):
        probs.append('title has video/lyric junk')

    if r['artist'] and r['title'] and \
       r['artist'].strip().lower() == r['title'].strip().lower():
        probs.append('artist == title')

    if r['genre'] not in VALID:
        probs.append('genre missing/invalid' if r['genre'] == '' else f"genre not canonical: {r['genre']}")

    if not r['bpm']:
        probs.append('no bpm')
    else:
        try:
            b = float(r['bpm'])
            if not (30 <= b <= 300):
                probs.append(f'bpm out of range: {r["bpm"]}')
        except Exception:
            probs.append(f'bpm not numeric: {r["bpm"]}')

    if not r['key']:
        probs.append('no key')
    elif not CAM.match(r['key']):
        probs.append(f'key not camelot: {r["key"]}')

    if not r['energy']:
        probs.append('no energy')
    else:
        try:
            e = int(float(r['energy']))
            if not (1 <= e <= 10):
                probs.append(f'energy out of range: {r["energy"]}')
        except Exception:
            probs.append('energy not numeric')

    if r['art'] != 'square':
        probs.append(f'artwork: {r["art"]}' + (f" {r['w']}x{r['h']}" if r['w'] else ''))

    key = (r['artist'].strip().lower(), r['title'].strip().lower())
    if key[0] or key[1]:
        seen[key].append(r['file'])

    for p in probs:
        issues[p.split(':')[0]] += 1
    if probs:
        flagged.append((r, probs))

dups = {k: v for k, v in seen.items() if len(v) > 1}

print(f'\n===== PromB VERIFICATION ({n} files) =====\n')
print('--- FIELD COVERAGE ---')
for k, lbl in (('artist', 'artist'), ('title', 'title'), ('genre', 'genre'),
               ('bpm', 'bpm'), ('key', 'camelot key'), ('energy', 'energy')):
    c = sum(1 for r in rows if r[k])
    print(f'  {c:5d}/{n}  {lbl}' + ('  OK' if c == n else '  <-- gaps'))
print(f'  {sum(1 for r in rows if r["art"] == "square"):5d}/{n}  square album art')

print('\n--- ISSUES ---')
if not issues:
    print('  none')
for k, c in issues.most_common():
    print(f'  {c:5d}  {k}')

print('\n--- GENRE DISTRIBUTION ---')
for k, c in Counter(r['genre'] or '(blank)' for r in rows).most_common():
    print(f'  {c:5d}  {k}')

print(f'\n--- DUPLICATE artist+title: {len(dups)} groups ---')
for k, v in list(dups.items())[:10]:
    print(f'  [{len(v)}x] {k[0]} — {k[1]}')

print(f'\n--- FLAGGED TRACKS: {len(flagged)} ---')
for r, probs in flagged[:35]:
    print(f"  {r['file'][:62]}")
    print(f"      artist={r['artist'][:30]!r} title={r['title'][:34]!r}")
    print(f"      -> {'; '.join(probs)}")

with open(os.path.join(SP, 'promb_review.csv'), 'w', encoding='utf-8', newline='') as f:
    w = csv.writer(f)
    w.writerow(['file', 'artist', 'title', 'genre', 'bpm', 'key', 'energy', 'art', 'problems'])
    for r, probs in flagged:
        w.writerow([r['file'], r['artist'], r['title'], r['genre'], r['bpm'],
                    r['key'], r['energy'], r['art'], '; '.join(probs)])
print(f'\nwrote promb_review.csv ({len(flagged)} rows)')
