# -*- coding: utf-8 -*-
"""Write genre tags to the Ramos crate AND detect duplicates in one pass.

  python ramos_write_and_dupes.py            # dry run, detection only
  python ramos_write_and_dupes.py --commit   # write genre tags
"""
import os, sys, json, re, hashlib, unicodedata
from collections import Counter, defaultdict
from mutagen.id3 import ID3, TCON, ID3NoHeaderError

ROOT = r'E:\04_MP3_Library\Ramos Jan 2025 - Mar 26'
SP = os.path.dirname(os.path.abspath(__file__))
COMMIT = '--commit' in sys.argv
HASH_BYTES = 256 * 1024
DJ = re.compile(r'\s*-\s*\d{1,2}[AB]\s*-\s*\d{2,3}$')

plan = {p['file']: p for p in
        json.load(open(os.path.join(SP, 'ramos_plan.json'), encoding='utf-8'))}


def audio_span(fh, size):
    off = 0
    fh.seek(0)
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
    return off, max(0, end - off)


rows, written, errors = [], 0, []
files = sorted(f for f in os.listdir(ROOT) if f.lower().endswith('.mp3'))
for i, fn in enumerate(files):
    p = os.path.join(ROOT, fn)
    rec = {'file': fn, 'ahash': '', 'alen': 0,
           'artist': plan.get(fn, {}).get('artist', ''),
           'title': plan.get(fn, {}).get('title', '')}
    try:
        size = os.path.getsize(p)
        with open(p, 'rb') as fh:
            off, alen = audio_span(fh, size)
            fh.seek(off)
            chunk = fh.read(HASH_BYTES)
        rec['alen'] = alen
        rec['ahash'] = hashlib.sha1(str(alen).encode() + chunk).hexdigest()
    except Exception as e:
        errors.append(f'{fn}\thash: {e}')

    g = plan.get(fn, {}).get('genre')
    if g and COMMIT:
        try:
            try:
                t = ID3(p)
            except ID3NoHeaderError:
                t = ID3()
            t.setall('TCON', [TCON(encoding=3, text=[g])])
            t.save(p, v2_version=3)
            written += 1
        except Exception as e:
            errors.append(f'{fn}\ttag: {e}')
    elif g:
        written += 1
    rows.append(rec)
    if i % 400 == 0:
        print(f'{i}/{len(files)}', flush=True)

json.dump(rows, open(os.path.join(SP, 'ramos_review.json'), 'w',
          encoding='utf-8'), ensure_ascii=False, indent=0)
print(f"\n{'WROTE' if COMMIT else 'WOULD WRITE'} genre on {written} files, "
      f"errors {len(errors)}")


def norm(s):
    s = unicodedata.normalize('NFKD', (s or '').lower())
    s = ''.join(c for c in s if not unicodedata.combining(c))
    s = re.sub(r'\(.*?\)|\[.*?\]', ' ', s)
    return re.sub(r'[^a-z0-9]+', '', s)


def key_of(r):
    stem = DJ.sub('', r['file'][:-4])
    stem = re.sub(r'-\d+$', '', stem)          # trailing "-1" download marker
    return norm(stem)


by_audio = defaultdict(list)
for r in rows:
    if r['ahash']:
        by_audio[r['ahash']].append(r)
exact = {h: v for h, v in by_audio.items() if len(v) > 1}

by_name = defaultdict(list)
for r in rows:
    by_name[key_of(r)].append(r)
namedup = {k: v for k, v in by_name.items()
           if len(v) > 1 and len({x['ahash'] for x in v}) > 1}

print(f'\n===== DUPLICATES =====')
print(f'  IDENTICAL audio        : {len(exact)} groups, '
      f'{sum(len(v)-1 for v in exact.values())} redundant')
print(f'  same name, diff audio  : {len(namedup)} groups, '
      f'{sum(len(v)-1 for v in namedup.values())} extra')
print('\n--- sample identical-audio ---')
for h, v in list(exact.items())[:12]:
    print(f'  [{len(v)}x] ' + ' || '.join(x['file'][:46] for x in v))
print('\n--- sample same-name/diff-audio ---')
for k, v in list(namedup.items())[:8]:
    print('  ' + ' || '.join(f"{x['alen']/1e6:.2f}MB {x['file'][:40]}" for x in v))

json.dump({'exact': [[x['file'] for x in v] for v in exact.values()],
           'namedup': [[x['file'] for x in v] for v in namedup.values()]},
          open(os.path.join(SP, 'ramos_dupes.json'), 'w', encoding='utf-8'),
          ensure_ascii=False, indent=0)
if errors:
    open(os.path.join(SP, 'ramos_errors.txt'), 'w', encoding='utf-8').write('\n'.join(errors))
