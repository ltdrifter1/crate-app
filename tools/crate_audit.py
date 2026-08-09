# -*- coding: utf-8 -*-
"""Reusable crate audit: tags, genre, artwork, Mixed In Key data, duplicates, junk.

  python crate_audit.py "E:\\04_MP3_Library\\Morgan"
Writes <name>.json and <name>_dupes.json next to this script.
"""
import os, io, re, sys, json, hashlib
from collections import Counter, defaultdict
from mutagen.id3 import ID3, ID3NoHeaderError
from PIL import Image

ROOT = sys.argv[1] if len(sys.argv) > 1 else r'E:\04_MP3_Library\Morgan'
SP = os.path.dirname(os.path.abspath(__file__))
NAME = re.sub(r'[^A-Za-z0-9]+', '_', os.path.basename(ROOT.rstrip('\\/'))).lower()
HB = 256 * 1024
DJ = re.compile(r'\s*-\s*\d{1,2}[ABab]\s*-\s*\d{2,3}\s*$')

JUNK = re.compile(
    r'\bted\s*x|\btedx|interview|podcast|trailer|\bepisode\b|unboxing|reaction|'
    r'\breview\b|tutorial|full match|highlights|press conference|'
    r'\.avi\b|\.mp4\b|sound effect|air horn|asmr|how to |vlog|'
    r'commercial|advert|\bnews\b|weather|lecture|sermon|audiobook', re.I)


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
        return hashlib.sha1(str(alen).encode() + chunk).hexdigest(), alen
    except Exception:
        return None, 0


rows = []
allfiles = os.listdir(ROOT)
exts = Counter(os.path.splitext(f)[1].lower() for f in allfiles
               if os.path.isfile(os.path.join(ROOT, f)))
files = sorted(f for f in allfiles if f.lower().endswith('.mp3'))
for i, fn in enumerate(files):
    p = os.path.join(ROOT, fn)
    r = {'file': fn, 'artist': '', 'title': '', 'album': '', 'genre': '',
         'bpm': '', 'key': '', 'energy': '', 'w': 0, 'h': 0,
         'has_art': False, 'square': False, 'ahash': '', 'alen': 0}
    h, alen = audio_hash(p)
    r['ahash'], r['alen'] = h or '', alen
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
            r['has_art'] = True
            try:
                r['w'], r['h'] = Image.open(io.BytesIO(a.data)).size
                r['square'] = abs(r['w'] / r['h'] - 1) <= 0.05
            except Exception:
                pass
    except (ID3NoHeaderError, Exception):
        pass
    rows.append(r)
    if i % 250 == 0:
        print(f'{i}/{len(files)}', flush=True)

json.dump(rows, open(os.path.join(SP, f'{NAME}.json'), 'w', encoding='utf-8'),
          ensure_ascii=False, indent=0)

n = max(len(rows), 1)
print(f'\n===== AUDIT: {ROOT} =====')
print(f'files: {sum(exts.values())} {dict(exts)}   mp3 scanned: {len(rows)}\n')
print('--- TAG COVERAGE ---')
for k, lbl in (('artist', 'artist'), ('title', 'title'), ('album', 'album'),
               ('genre', 'GENRE'), ('bpm', 'bpm'), ('key', 'camelot key'),
               ('energy', 'energy')):
    c = sum(1 for r in rows if r[k])
    print(f'  {c:5d}/{len(rows)}  {lbl}')
gv = Counter(r['genre'] for r in rows if r['genre'])
print(f'\n--- existing genres ({len(gv)} distinct) ---')
for k, c in gv.most_common(12):
    print(f'  {c:5d}  {k}')
if not gv:
    print('  (none)')

print('\n--- ARTWORK ---')
print(f"  {sum(1 for r in rows if r['square']):5d}  square")
print(f"  {sum(1 for r in rows if r['has_art'] and not r['square']):5d}  thumbnail/non-square")
print(f"  {sum(1 for r in rows if not r['has_art']):5d}  none")
for k, c in Counter(f"{r['w']}x{r['h']}" for r in rows if r['has_art']).most_common(6):
    print(f'      {c:5d}  {k}')

by = defaultdict(list)
for r in rows:
    if r['ahash']:
        by[r['ahash']].append(r['file'])
dup = {k: v for k, v in by.items() if len(v) > 1}
print(f"\n--- DUPLICATES: {len(dup)} groups, {sum(len(v)-1 for v in dup.values())} redundant ---")
for k, v in list(dup.items())[:8]:
    print('    ' + ' || '.join(x[:40] for x in v))

sus = [r for r in rows if JUNK.search(r['file']) or JUNK.search(r['title'] or '')]
print(f'\n--- PROBABLE NON-MUSIC: {len(sus)} ---')
for r in sus[:20]:
    print(f"  {r['file'][:74]}")

noart = [r for r in rows if not r['artist']]
print(f'\n--- NO ARTIST TAG: {len(noart)} ---')
for r in noart[:20]:
    print(f"  {r['file'][:74]}")

withdj = sum(1 for r in rows if DJ.search(os.path.splitext(r['file'])[0]))
print(f'\nfilenames with "- 8A - 126": {withdj}/{len(rows)}')
print('\n--- sample ---')
for r in rows[:8]:
    print(f"  {r['file'][:70]}")
    print(f"     a={r['artist'][:26]!r} t={r['title'][:30]!r} bpm={r['bpm']} key={r['key']} e={r['energy']}")

json.dump({'dupes': list(dup.values()), 'junk': [r['file'] for r in sus]},
          open(os.path.join(SP, f'{NAME}_dupes.json'), 'w', encoding='utf-8'),
          ensure_ascii=False, indent=1)
print(f'\nwrote {NAME}.json and {NAME}_dupes.json')
