# -*- coding: utf-8 -*-
import os, io
from collections import Counter
from mutagen.id3 import ID3
from PIL import Image

ROOT = r'E:\04_MP3_Library\Ramos Jan 2025 - Mar 26'
SP = os.path.dirname(os.path.abspath(__file__))
sq = nonsq = noart = 0
sizes, gen = Counter(), Counter()
left = []
files = sorted(f for f in os.listdir(ROOT) if f.lower().endswith('.mp3'))
for i, fn in enumerate(files):
    try:
        t = ID3(os.path.join(ROOT, fn))
    except Exception:
        noart += 1
        continue
    g = t.get('TCON')
    gen[str(g.text[0]) if (g and g.text) else '(none)'] += 1
    ap = t.getall('APIC')
    if not ap:
        noart += 1
        continue
    a = next((x for x in ap if getattr(x, 'type', None) == 3), ap[0])
    try:
        w, h = Image.open(io.BytesIO(a.data)).size
    except Exception:
        nonsq += 1
        continue
    if abs(w / h - 1) <= 0.05:
        sq += 1
        m = min(w, h)
        sizes['1000px+' if m >= 1000 else '600-999px' if m >= 600
              else '500-599px' if m >= 500 else '<500px'] += 1
    else:
        nonsq += 1
        left.append(f'{w}x{h}\t{fn}')
    if i % 800 == 0:
        print(f'{i}/{len(files)}', flush=True)

n = len(files)
print(f'\n===== RAMOS FINAL: {n} files =====')
print(f'  SQUARE album art : {sq}  ({100*sq/n:.0f}%)')
print(f'  non-square left  : {nonsq}')
print(f'  no art           : {noart}')
print('\n  art resolution:')
for k, c in sizes.most_common():
    print(f'   {c:5d}  {k}')
print('\n  genre:')
for k, c in gen.most_common():
    print(f'   {c:5d}  {k}')
open(os.path.join(SP, 'ramos_still_thumb.txt'), 'w', encoding='utf-8').write('\n'.join(left))
print(f'\nremaining thumbnails: {len(left)}')
