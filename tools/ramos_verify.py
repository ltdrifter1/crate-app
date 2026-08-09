# -*- coding: utf-8 -*-
import os
from collections import Counter
from mutagen.id3 import ID3

ROOT = r'E:\04_MP3_Library\Ramos Jan 2025 - Mar 26'
g = Counter()
none = 0
for fn in os.listdir(ROOT):
    if not fn.lower().endswith('.mp3'):
        continue
    try:
        t = ID3(os.path.join(ROOT, fn)).get('TCON')
        v = str(t.text[0]) if (t and t.text) else ''
    except Exception:
        v = ''
    if v:
        g[v] += 1
    else:
        none += 1
print(f'tagged   : {sum(g.values())}')
print(f'untagged : {none}\n')
for k, c in g.most_common():
    print(f'{c:5d}  {k}')
