# -*- coding: utf-8 -*-
"""Full audit of PromB: tags, genre, artwork, Mixed In Key data, duplicates."""
import os, io, re, json, hashlib
from collections import Counter, defaultdict
from mutagen.id3 import ID3, ID3NoHeaderError
from PIL import Image

ROOT = r'E:\04_MP3_Library\PromB'
SP = os.path.dirname(os.path.abspath(__file__))
HB = 256 * 1024
DJ = re.compile(r'\s*-\s*\d{1,2}[ABab]\s*-\s*\d{2,3}\s*$')


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
files = sorted(f for f in os.listdir(ROOT) if f.lower().endswith('.mp3'))
exts = Counter(os.path.splitext(f)[1].lower() for f in os.listdir(ROOT))
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
    if i % 200 == 0:
        print(f'{i}/{len(files)}', flush=True)

json.dump(rows, open(os.path.join(SP, 'promb.json'), 'w', encoding='utf-8'),
          ensure_ascii=False, indent=0)

n = len(rows)
print(f'\n===== PromB AUDIT =====')
print(f'files on disk        : {sum(exts.values())}  ({dict(exts)})')
print(f'mp3 scanned          : {n}\n')
print('--- TAGS ---')
for k, lbl in (('artist', 'artist'), ('title', 'title'), ('album', 'album'),
               ('genre', 'GENRE'), ('bpm', 'bpm (TBPM)'), ('key', 'key (TKEY)'),
               ('energy', 'energy')):
    c = sum(1 for r in rows if r[k])
    print(f'  {c:5d}/{n}  {lbl}')
print('\n--- existing genre values ---')
gv = Counter(r['genre'] for r in rows if r['genre'])
if not gv:
    print('  (none)')
for k, c in gv.most_common(15):
    print(f'  {c:5d}  {k}')
print('\n--- ARTWORK ---')
sq = sum(1 for r in rows if r['square'])
ns = sum(1 for r in rows if r['has_art'] and not r['square'])
na = sum(1 for r in rows if not r['has_art'])
print(f'  {sq:5d}  square album art')
print(f'  {ns:5d}  non-square (thumbnails)')
print(f'  {na:5d}  no artwork')
for k, c in Counter(f"{r['w']}x{r['h']}" for r in rows if r['has_art']).most_common(8):
    print(f'      {c:5d}  {k}')
print('\n--- DUPLICATES (identical audio) ---')
by = defaultdict(list)
for r in rows:
    if r['ahash']:
        by[r['ahash']].append(r['file'])
dup = {k: v for k, v in by.items() if len(v) > 1}
print(f'  {len(dup)} groups, {sum(len(v)-1 for v in dup.values())} redundant')
for k, v in list(dup.items())[:8]:
    print(f'    [{len(v)}x] ' + ' || '.join(x[:42] for x in v))
print('\n--- filename pattern ---')
withdj = sum(1 for r in rows if DJ.search(os.path.splitext(r['file'])[0]))
print(f'  {withdj}/{n} have "- 8A - 126" suffix')
print('\n--- sample filenames ---')
for r in rows[:10]:
    print(f"  {r['file'][:74]}")
print('\n--- sample tags ---')
for r in rows[:6]:
    print(f"  a={r['artist'][:22]!r} t={r['title'][:26]!r} g={r['genre'][:14]!r} bpm={r['bpm']} key={r['key']} e={r['energy']}")
json.dump({'dupes': [v for v in dup.values()]},
          open(os.path.join(SP, 'promb_dupes.json'), 'w', encoding='utf-8'),
          ensure_ascii=False, indent=1)
