# -*- coding: utf-8 -*-
"""What did Mixed In Key write? Look for BPM / key / energy frames."""
import os, random
from collections import Counter
from mutagen.id3 import ID3

ROOT = r'E:\04_MP3_Library\evie'
files = sorted(f for f in os.listdir(ROOT) if f.lower().endswith('.mp3'))

frames = Counter()
have = Counter()
samples = []
random.seed(3)
scan = files if len(files) <= 4600 else random.sample(files, 4600)

for i, fn in enumerate(scan):
    try:
        t = ID3(os.path.join(ROOT, fn))
    except Exception:
        continue
    keys = set(t.keys())
    for k in keys:
        frames[k.split(':')[0]] += 1

    def txt(fr):
        v = t.get(fr)
        try:
            return str(v.text[0]).strip() if (v and v.text) else ''
        except Exception:
            return ''

    bpm = txt('TBPM')
    key = txt('TKEY')
    grp = txt('TIT1')          # grouping - MIK often puts Camelot here
    com = ''
    for k in t.keys():
        if k.startswith('COMM'):
            try:
                com = str(t[k].text[0]).strip()
            except Exception:
                pass
            break
    if bpm:
        have['TBPM (bpm)'] += 1
    if key:
        have['TKEY (key)'] += 1
    if grp:
        have['TIT1 (grouping)'] += 1
    if com:
        have['COMM (comment)'] += 1
    if len(samples) < 18 and (bpm or key or grp or com):
        samples.append((fn, bpm, key, grp, com))
    if i % 1000 == 0:
        print(f'{i}/{len(scan)}', flush=True)

print(f'\nscanned {len(scan)} files\n')
print('--- fields populated ---')
for k, c in have.most_common():
    print(f'  {c:5d}  {k}')
print('\n--- all ID3 frames present ---')
for k, c in frames.most_common(20):
    print(f'  {c:5d}  {k}')
print('\n--- samples ---')
for fn, b, k, g, c in samples:
    print(f'  {fn[:44]}')
    print(f'     BPM={b!r} KEY={k!r} GROUPING={g!r} COMMENT={c[:40]!r}')
