# -*- coding: utf-8 -*-
"""Recover artist (and title) for tracks tagged 'Unknown'.

Primary source: match the uploaded audio back to the library by audio-stream
hash and read the real TPE1/TIT2. Fallback: parse the artist out of the
title string ("Grimes | Genesis", "'Slidin'' by Skin Town").

Writes crate-app/unknown-fix.json ; flags the rest as probable non-music.
"""
import os, re, sys, json, hashlib
from pathlib import Path
from collections import Counter
from mutagen.id3 import ID3

APP = Path(r'C:\Users\lpgut\crate-app')
ADIR = APP / 'audio'
LIB = [r'E:\04_MP3_Library\evie',
       r'E:\04_MP3_Library\Ramos Jan 2025 - Mar 26',
       r'E:\04_MP3_Library\_needs_artwork_evie',
       r'E:\04_MP3_Library\_duplicates_ramos',
       r'E:\04_MP3_Library\_duplicates_evie',
       r'E:\04_MP3_Library\_nonmusic_evie']
HB = 256 * 1024

# titles that are clearly not music
JUNK = re.compile(
    r'\bted(x|\s)|eye exam|thundercats|air horn|\.avi\b|screening|'
    r'short list|asl\b|interview|podcast|trailer|episode|unboxing|'
    r'review\b|how is a|vs\s*20\d\d', re.I)

SPLITS = [
    re.compile(r'^\s*(?P<a>.+?)\s*[|｜]\s*(?P<t>.+?)\s*$'),
    re.compile(r'^\s*(?P<t>.+?)\s+by\s+(?P<a>.+?)\s*$', re.I),
    re.compile(r'^\s*(?P<a>.+?)\s*//\s*(?P<t>.+?)\s*$'),
    re.compile(r'^\s*(?P<a>.+?)\s*,\s*(?P<t>.+?)\s*$'),
    re.compile(r'^\s*(?P<a>.+?)\s+-\s+(?P<t>.+?)\s*$'),
]
NOISE = re.compile(
    r'\s*\(?(official\s*(music\s*)?(video|audio)?|music video|lyrics?|'
    r'live at .*|live\b.*|mv|hd|hq|\d{4})\)?\s*$', re.I)


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


def tag(path, frame):
    try:
        v = ID3(str(path)).get(frame)
        return str(v.text[0]).strip() if (v and v.text) else ''
    except Exception:
        return ''


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

targets = json.load(open(APP / 'unknown-artists.json', encoding='utf-8'))
fixes, junk, stuck = [], [], []
stats = Counter()

for t in targets:
    title = (t.get('title') or '').strip()
    af = t.get('audioFile') or ''
    artist = new_title = ''
    src = ''

    p = ADIR / af
    if af and p.exists():
        h = audio_hash(p)
        m = lib.get(h) if h else None
        if m:
            a, ti = tag(m, 'TPE1'), tag(m, 'TIT2')
            if a and a.lower() not in ('unknown', ''):
                artist, new_title, src = a, (ti or title), 'library tag'

    if not artist:
        if JUNK.search(title):
            junk.append(t)
            stats['probable non-music'] += 1
            continue
        clean = NOISE.sub('', title).strip()
        for rx in SPLITS:
            m = rx.match(clean)
            if m:
                a = m.group('a').strip(" '\"")
                ti = m.group('t').strip(" '\"")
                if 1 < len(a) <= 60 and len(ti) > 1:
                    artist, new_title, src = a, ti, 'parsed from title'
                    break

    if artist:
        upd = {'artist': artist}
        if new_title and new_title != title:
            upd['title'] = new_title
        fixes.append({'id': t['id'], 'was': title, 'update': upd, 'src': src})
        stats[f'FIXED ({src})'] += 1
    else:
        stuck.append(t)
        stats['could not recover'] += 1

json.dump(fixes, open(APP / 'unknown-fix.json', 'w', encoding='utf-8'),
          ensure_ascii=False, indent=1)
json.dump(junk + stuck, open(APP / 'unknown-junk.json', 'w', encoding='utf-8'),
          ensure_ascii=False, indent=1)

print('\n--- RESULT ---')
for k, c in stats.most_common():
    print(f'  {c:4d}  {k}')
print('\n--- sample fixes ---')
for f in fixes[:20]:
    print(f"  {f['was'][:52]}")
    print(f"     -> artist={f['update']['artist']!r} title={f['update'].get('title', '(unchanged)')!r}  [{f['src']}]")
print('\n--- flagged non-music / unrecoverable ---')
for j in (junk + stuck)[:15]:
    print(f"  {j.get('title', '')[:66]}")
print(f'\nwrote unknown-fix.json ({len(fixes)}) and unknown-junk.json ({len(junk)+len(stuck)})')
