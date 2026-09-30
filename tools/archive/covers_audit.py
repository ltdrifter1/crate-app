# -*- coding: utf-8 -*-
"""Read-only: what do the uploaded cover images actually look like?
A 1280x720 cover is a YouTube thumbnail, not album art."""
import os, json
from collections import Counter
from PIL import Image

APP = r'C:\Users\lpgut\crate-app'
SP = os.path.dirname(os.path.abspath(__file__))
CDIR = os.path.join(APP, 'covers')

sq, nonsq, broken = [], [], []
sizes = Counter()
files = sorted(os.listdir(CDIR))
for i, fn in enumerate(files):
    p = os.path.join(CDIR, fn)
    try:
        w, h = Image.open(p).size
    except Exception:
        broken.append(fn)
        continue
    sizes[f'{w}x{h}'] += 1
    if abs(w / h - 1) <= 0.05:
        sq.append(fn)
    else:
        nonsq.append((fn, w, h))
    if i % 800 == 0:
        print(f'{i}/{len(files)}', flush=True)

print(f'\n===== UPLOADED COVERS ({len(files)}) =====')
print(f'  square (real album art) : {len(sq)}')
print(f'  NON-SQUARE (thumbnails) : {len(nonsq)}')
print(f'  unreadable              : {len(broken)}')
print('\n--- top dimensions ---')
for k, c in sizes.most_common(12):
    w, h = map(int, k.split('x'))
    tag = 'square' if abs(w / h - 1) <= 0.05 else 'THUMBNAIL'
    print(f'  {c:5d}  {k:12} {tag}')
print('\n--- sample non-square ---')
for fn, w, h in nonsq[:12]:
    print(f'  {w}x{h}  {fn[:66]}')

json.dump({'nonsquare': [f for f, _, _ in nonsq], 'broken': broken},
          open(os.path.join(SP, 'covers_bad.json'), 'w', encoding='utf-8'),
          ensure_ascii=False, indent=1)
print(f'\nwrote covers_bad.json  ({len(nonsq)} non-square, {len(broken)} broken)')
