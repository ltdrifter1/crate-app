# -*- coding: utf-8 -*-
"""Audit embedded artwork in the Ramos crate + build the fetch candidate list."""
import os, io, json, re, hashlib
from collections import Counter, defaultdict
from mutagen.id3 import ID3, ID3NoHeaderError
from PIL import Image

ROOT = r'E:\04_MP3_Library\Ramos Jan 2025 - Mar 26'
SP = os.path.dirname(os.path.abspath(__file__))
DJ = re.compile(r'\s*-\s*\d{1,2}[AB]\s*-\s*\d{2,3}$')

rows = []
files = sorted(f for f in os.listdir(ROOT) if f.lower().endswith('.mp3'))
for i, fn in enumerate(files):
    rec = {'file': fn, 'artist': '', 'title': '', 'album': '',
           'w': 0, 'h': 0, 'has_art': False, 'square': False, 'sha1': ''}
    try:
        t = ID3(os.path.join(ROOT, fn))
        for k, fr in (('artist', 'TPE1'), ('title', 'TIT2'), ('album', 'TALB')):
            v = t.get(fr)
            rec[k] = str(v.text[0]).strip() if (v and v.text) else ''
        ap = t.getall('APIC')
        if ap:
            a = next((x for x in ap if getattr(x, 'type', None) == 3), ap[0])
            rec['has_art'] = True
            rec['sha1'] = hashlib.sha1(a.data).hexdigest()
            try:
                rec['w'], rec['h'] = Image.open(io.BytesIO(a.data)).size
                rec['square'] = abs(rec['w'] / rec['h'] - 1) <= 0.05
            except Exception:
                pass
    except (ID3NoHeaderError, Exception):
        pass
    rows.append(rec)
    if i % 400 == 0:
        print(f'{i}/{len(files)}', flush=True)

json.dump(rows, open(os.path.join(SP, 'ramos_art.json'), 'w', encoding='utf-8'),
          ensure_ascii=False, indent=0)

n = len(rows)
sq = [r for r in rows if r['square']]
noart = [r for r in rows if not r['has_art']]
bad = [r for r in rows if r['has_art'] and not r['square']]
print(f'\n===== RAMOS ARTWORK AUDIT ({n}) =====')
print(f'  square album art : {len(sq)}  ({100*len(sq)/n:.0f}%)')
print(f'  non-square       : {len(bad)}')
print(f'  no art           : {len(noart)}')
print('\n--- size of existing square art ---')
def sb(r):
    m = min(r['w'], r['h'])
    return ('1000px+' if m >= 1000 else '600-999px' if m >= 600 else
            '500-599px' if m >= 500 else '300-499px' if m >= 300 else '<300px')
for k, c in Counter(sb(r) for r in sq).most_common():
    print(f'  {c:5d}  {k}')
print('\n--- non-square dimensions ---')
for k, c in Counter(f"{r['w']}x{r['h']}" for r in bad).most_common(10):
    print(f'  {c:5d}  {k}')

# candidates: missing, non-square, or tiny -- needs artist+title to search
cands = []
skip_notags = 0
for r in rows:
    why = None
    if not r['has_art']:
        why = 'missing'
    elif not r['square']:
        why = f"non-square ({r['w']}x{r['h']})"
    elif min(r['w'], r['h']) < 300:
        why = f"tiny ({r['w']}x{r['h']})"
    if not why:
        continue
    artist, title = r['artist'], r['title']
    if not (artist and title):
        stem = DJ.sub('', r['file'][:-4])
        p = re.split(r'\s+-\s+', stem, maxsplit=1)
        if len(p) == 2:
            artist = artist or p[0].strip()
            title = title or p[1].strip()
    if not (artist and title):
        skip_notags += 1
        continue
    cands.append({'file': r['file'], 'artist': artist, 'title': title,
                  'album': r['album'], 'why': why})

json.dump(cands, open(os.path.join(SP, 'ramos_art_cands.json'), 'w',
          encoding='utf-8'), ensure_ascii=False, indent=0)
print(f'\nCANDIDATES to fetch : {len(cands)}')
print(f'unfixable (no tags) : {skip_notags}')
print(f'with album tag      : {sum(1 for c in cands if c["album"])}')
for k, c in Counter(c['why'].split('(')[0].strip() for c in cands).most_common():
    print(f'  {c:5d}  {k}')
print('\n--- sample ID3 titles (check for DJ suffix) ---')
for r in rows[:8]:
    print(f"  a='{r['artist'][:24]}' t='{r['title'][:40]}' alb='{r['album'][:24]}'")
