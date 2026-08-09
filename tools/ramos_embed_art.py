# -*- coding: utf-8 -*-
"""Embed fetched covers into the Ramos crate. Originals backed up to
./artbackup_ramos so revert_art_ramos.py can undo it.

  python ramos_embed_art.py            # dry run
  python ramos_embed_art.py --commit   # write
"""
import os, io, sys, json, hashlib
from collections import Counter
from mutagen.id3 import ID3, APIC, ID3NoHeaderError
from PIL import Image

ROOT = r'E:\04_MP3_Library\Ramos Jan 2025 - Mar 26'
SP = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(SP, 'artcache')
BACKUP = os.path.join(SP, 'artbackup_ramos')
os.makedirs(BACKUP, exist_ok=True)
COMMIT = '--commit' in sys.argv

matches = json.load(open(os.path.join(SP, 'ramos_artmatch.json'), encoding='utf-8'))
todo = [m for m in matches if m.get('matched') and m.get('sha')]
print(f'{len(todo)} matched entries with a cached image')

ipath = os.path.join(BACKUP, '_index.json')
index = json.load(open(ipath, encoding='utf-8')) if os.path.exists(ipath) else {}

embedded = nocache = badimg = 0
errors, stats = [], Counter()

for i, m in enumerate(todo):
    src = os.path.join(CACHE, m['sha'] + '.jpg')
    if not os.path.exists(src):
        nocache += 1
        continue
    data = open(src, 'rb').read()
    try:
        w, h = Image.open(io.BytesIO(data)).size
        if not (0.95 <= w / h <= 1.05) or min(w, h) < 250:
            badimg += 1
            continue
    except Exception:
        badimg += 1
        continue

    path = os.path.join(ROOT, m['file'])
    if not os.path.exists(path):
        continue
    try:
        try:
            tags = ID3(path)
        except ID3NoHeaderError:
            tags = ID3()
        if COMMIT:
            key = hashlib.sha1(m['file'].encode('utf-8')).hexdigest()
            if key not in index:
                old = tags.getall('APIC')
                if old:
                    a = next((x for x in old if getattr(x, 'type', None) == 3), old[0])
                    open(os.path.join(BACKUP, key + '.bin'), 'wb').write(a.data)
                    index[key] = {'file': m['file'], 'mime': a.mime or 'image/jpeg',
                                  'had_art': True}
                else:
                    index[key] = {'file': m['file'], 'mime': '', 'had_art': False}
            tags.delall('APIC')
            tags.add(APIC(encoding=3, mime='image/jpeg', type=3,
                          desc='Cover', data=data))
            tags.save(path, v2_version=3)
        embedded += 1
        stats[m.get('src', '?')] += 1
    except Exception as e:
        errors.append(f"{m['file']}\t{type(e).__name__}: {e}")
    if COMMIT and i % 200 == 0:
        json.dump(index, open(ipath, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
        print(f'{i}/{len(todo)}', flush=True)

if COMMIT:
    json.dump(index, open(ipath, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)

print(f"\n{'EMBEDDED' if COMMIT else 'WOULD EMBED'}: {embedded}")
print(f'  image not cached             : {nocache}')
print(f'  rejected (not square / small): {badimg}')
print(f'  errors                       : {len(errors)}')
for k, c in stats.most_common():
    print(f'  via {k}: {c}')
if errors:
    open(os.path.join(SP, 'ramos_embed_errors.txt'), 'w', encoding='utf-8').write('\n'.join(errors))
