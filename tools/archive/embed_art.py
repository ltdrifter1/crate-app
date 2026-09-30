# -*- coding: utf-8 -*-
"""Embed the fetched covers into the MP3s.

Every image being replaced is first backed up to ./artbackup/, so the whole
operation can be undone with revert_art.py.

  python embed_art.py            # dry run
  python embed_art.py --commit   # write
"""
import os, io, sys, json, hashlib
from collections import Counter
from mutagen.id3 import ID3, APIC, ID3NoHeaderError
from PIL import Image

ROOT = r'E:\04_MP3_Library\evie'
SP = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(SP, 'artcache')
BACKUP = os.path.join(SP, 'artbackup')
os.makedirs(BACKUP, exist_ok=True)
COMMIT = '--commit' in sys.argv

MATCHFILE = 'artmatch.json'
if '--matches' in sys.argv:
    MATCHFILE = sys.argv[sys.argv.index('--matches') + 1]
matches = json.load(open(os.path.join(SP, MATCHFILE), encoding='utf-8'))
todo = [m for m in matches if m.get('matched') and m.get('sha')]
print(f'using {MATCHFILE}: {len(todo)} matched entries')

index_path = os.path.join(BACKUP, '_index.json')
index = json.load(open(index_path, encoding='utf-8')) if os.path.exists(index_path) else {}

embedded = 0
skipped_nocache = 0
skipped_badimg = 0
errors = []
stats = Counter()

for i, m in enumerate(todo):
    src = os.path.join(CACHE, m['sha'] + '.jpg')
    if not os.path.exists(src):
        skipped_nocache += 1
        continue
    data = open(src, 'rb').read()

    # sanity: must decode, must be square-ish, must be reasonably big
    try:
        im = Image.open(io.BytesIO(data))
        w, h = im.size
        if not (0.95 <= w / h <= 1.05) or min(w, h) < 250:
            skipped_badimg += 1
            continue
    except Exception:
        skipped_badimg += 1
        continue

    path = os.path.join(ROOT, m['file'])
    try:
        try:
            tags = ID3(path)
        except ID3NoHeaderError:
            tags = ID3()

        if COMMIT:
            # back up whatever art is there now (once per file)
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
        json.dump(index, open(index_path, 'w', encoding='utf-8'),
                  ensure_ascii=False, indent=0)
        print(f'{i}/{len(todo)}', flush=True)

if COMMIT:
    json.dump(index, open(index_path, 'w', encoding='utf-8'),
              ensure_ascii=False, indent=0)

mode = 'EMBEDDED' if COMMIT else 'WOULD EMBED (dry run)'
print(f'\n{mode}: {embedded}')
print(f'  matched but image not cached : {skipped_nocache}')
print(f'  rejected (not square / small): {skipped_badimg}')
print(f'  errors                       : {len(errors)}')
for k, c in stats.most_common():
    print(f'  via {k}: {c}')
if errors:
    open(os.path.join(SP, 'embed_errors.txt'), 'w', encoding='utf-8').write('\n'.join(errors))
    for e in errors[:10]:
        print('   ' + e)
