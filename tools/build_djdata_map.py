# -*- coding: utf-8 -*-
"""Build docId -> {camelot,bpm,energy} by matching uploaded audio back to the
library files (audio-stream hash, so tag edits don't matter).

Reads  crate-app/missing-djdata.json
Writes crate-app/djdata-fix.json
"""
import os, sys, json, hashlib, importlib.util
from pathlib import Path
from collections import Counter

APP = Path(r'C:\Users\lpgut\crate-app')
ADIR = APP / 'audio'
LIB = [r'E:\04_MP3_Library\evie',
       r'E:\04_MP3_Library\Ramos Jan 2025 - Mar 26',
       r'E:\04_MP3_Library\_needs_artwork_evie',
       r'E:\04_MP3_Library\_duplicates_ramos',
       r'E:\04_MP3_Library\_duplicates_evie',
       r'E:\04_MP3_Library\_nonmusic_evie']
HB = 256 * 1024

# reuse the MIK reader from the (fixed) importer
spec = importlib.util.spec_from_file_location('b', APP / 'build-crate-from-folder.py')
mod = importlib.util.module_from_spec(spec)
sys.argv = ['x']
spec.loader.exec_module(mod)


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


print('indexing library...')
lib = {}
for root in LIB:
    if not os.path.isdir(root):
        continue
    fl = [f for f in os.listdir(root) if f.lower().endswith('.mp3')]
    for i, fn in enumerate(fl):
        h = audio_hash(os.path.join(root, fn))
        if h:
            lib.setdefault(h, Path(root) / fn)
        if i % 1500 == 0:
            print(f'  {os.path.basename(root)} {i}/{len(fl)}', flush=True)
print(f'library hashes: {len(lib)}')

targets = json.load(open(APP / 'missing-djdata.json', encoding='utf-8'))
out, stats = [], Counter()
for i, t in enumerate(targets):
    af = t.get('audioFile') or ''
    p = ADIR / af
    if not af or not p.exists():
        stats['audio file not on disk'] += 1
        continue
    h = audio_hash(p)
    src = lib.get(h) if h else None
    if not src:
        stats['no library match'] += 1
        continue
    energy, camelot, bpm = mod.read_mik_fields(src)
    upd = {}
    if camelot:
        upd['camelot'] = camelot
    if bpm:
        upd['bpm'] = int(bpm)
    if energy:
        upd['energy'] = int(energy)
    if not upd:
        stats['library file has no DJ data'] += 1
        continue
    out.append({'id': t['id'], 'title': t.get('title', ''),
                'artist': t.get('artist', ''), 'update': upd,
                'source': str(src)})
    stats['FIXABLE'] += 1
    if i % 300 == 0:
        print(f'  matched {i}/{len(targets)}', flush=True)

json.dump(out, open(APP / 'djdata-fix.json', 'w', encoding='utf-8'),
          ensure_ascii=False, indent=1)
print('\n--- RESULT ---')
for k, c in stats.most_common():
    print(f'  {c:5d}  {k}')
f = Counter()
for o in out:
    for k in o['update']:
        f[k] += 1
print('\nfields that would be set:')
for k, c in f.most_common():
    print(f'  {c:5d}  {k}')
print(f'\nwrote djdata-fix.json ({len(out)} docs)')
