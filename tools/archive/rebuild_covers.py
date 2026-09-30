# -*- coding: utf-8 -*-
"""Replace thumbnail covers in crate-app/covers with the good square art we
embedded in the library MP3s.

Matching is done on the AUDIO STREAM hash (ID3 region skipped), so it is
immune to all the tag/artwork edits we made -- no slug guessing.

  python rebuild_covers.py            # dry run
  python rebuild_covers.py --commit   # overwrite covers/*.jpg
"""
import os, io, sys, csv, json, hashlib, shutil
from collections import Counter
from mutagen.id3 import ID3
from PIL import Image

APP = r'C:\Users\lpgut\crate-app'
SP = os.path.dirname(os.path.abspath(__file__))
CDIR = os.path.join(APP, 'covers')
ADIR = os.path.join(APP, 'audio')
BACKUP = os.path.join(SP, 'covers_backup')
COMMIT = '--commit' in sys.argv
os.makedirs(BACKUP, exist_ok=True)

LIB = [r'E:\04_MP3_Library\evie',
       r'E:\04_MP3_Library\Ramos Jan 2025 - Mar 26',
       r'E:\04_MP3_Library\_needs_artwork_evie',
       r'E:\04_MP3_Library\_duplicates_ramos',
       r'E:\04_MP3_Library\_duplicates_evie']
HB = 256 * 1024


def audio_hash(path):
    try:
        size = os.path.getsize(path)
        with open(path, 'rb') as fh:
            off = 0
            head = fh.read(10)
            if len(head) == 10 and head[:3] == b'ID3':
                sz = ((head[6] & 0x7f) << 21 | (head[7] & 0x7f) << 14 |
                      (head[8] & 0x7f) << 7 | (head[9] & 0x7f))
                off = 10 + sz
                if head[5] & 0x10:
                    off += 10
            end = size
            if size >= 128:
                fh.seek(size - 128)
                if fh.read(3) == b'TAG':
                    end = size - 128
            alen = max(0, end - off)
            fh.seek(off)
            chunk = fh.read(HB)
        return hashlib.sha1(str(alen).encode() + chunk).hexdigest()
    except Exception:
        return None


def square_art(path):
    """Return JPEG bytes of the embedded cover if it's square and big enough."""
    try:
        ap = ID3(path).getall('APIC')
        if not ap:
            return None
        a = next((x for x in ap if getattr(x, 'type', None) == 3), ap[0])
        w, h = Image.open(io.BytesIO(a.data)).size
        if abs(w / h - 1) <= 0.05 and min(w, h) >= 300:
            return a.data
    except Exception:
        pass
    return None


# 1. index the library by audio hash
print('indexing library...')
lib = {}
for root in LIB:
    if not os.path.isdir(root):
        continue
    fl = [f for f in os.listdir(root) if f.lower().endswith('.mp3')]
    for i, fn in enumerate(fl):
        p = os.path.join(root, fn)
        h = audio_hash(p)
        if h:
            lib.setdefault(h, p)
        if i % 1000 == 0:
            print(f'  {os.path.basename(root)} {i}/{len(fl)}', flush=True)
print(f'library hashes: {len(lib)}')

# 2. which covers are thumbnails?
bad = set(json.load(open(os.path.join(SP, 'covers_bad.json'),
                         encoding='utf-8'))['nonsquare'])
rows = list(csv.DictReader(open(os.path.join(APP, 'tracks.csv'),
                                encoding='utf-8-sig')))

stats = Counter()
plan = []
for i, r in enumerate(rows):
    cf = (r.get('coverFile') or '').strip()
    af = (r.get('audioFile') or '').strip()
    if not cf or cf not in bad:
        continue
    ap = os.path.join(ADIR, af)
    if not af or not os.path.exists(ap):
        stats['audio file missing'] += 1
        continue
    h = audio_hash(ap)
    src = lib.get(h) if h else None
    if not src:
        stats['no library match'] += 1
        continue
    data = square_art(src)
    if not data:
        stats['library file has no square art'] += 1
        continue
    plan.append((cf, src, data))
    stats['FIXABLE'] += 1
    if i % 400 == 0:
        print(f'  scanned {i}/{len(rows)}', flush=True)

print(f'\n--- COVER REBUILD ---')
for k, c in stats.most_common():
    print(f'  {c:5d}  {k}')

written = 0
for cf, src, data in plan:
    dst = os.path.join(CDIR, cf)
    if COMMIT:
        if os.path.exists(dst) and not os.path.exists(os.path.join(BACKUP, cf)):
            shutil.copy2(dst, os.path.join(BACKUP, cf))
        open(dst, 'wb').write(data)
    written += 1

json.dump([cf for cf, _, _ in plan],
          open(os.path.join(SP, 'covers_replaced.json'), 'w', encoding='utf-8'),
          ensure_ascii=False, indent=1)
print(f"\n{'REPLACED' if COMMIT else 'WOULD REPLACE'}: {written} cover images")
print(f'originals backed up to: {BACKUP}')
