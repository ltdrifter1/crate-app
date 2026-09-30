# -*- coding: utf-8 -*-
"""Decide which files need artwork, per the agreed scope:
   missing  +  clearly-wrong  (16:9 video thumbs, tiny, generic-shared, broken).
Plausible existing art is left alone.
"""
import json, os, re
from collections import defaultdict, Counter

SP = os.path.dirname(os.path.abspath(__file__))
art = json.load(open(os.path.join(SP, 'art_raw.json'), encoding='utf-8'))
tags = {t['file']: t for t in
        json.load(open(os.path.join(SP, 'tags_raw.json'), encoding='utf-8'))}
skipped = set(open(os.path.join(SP, 'skipped.txt'), encoding='utf-8')
              .read().splitlines())


def artist_of(fn):
    p = re.split(r'\s+-\s+', fn[:-4], maxsplit=1)
    return p[0].strip().lower() if len(p) == 2 else ''


# images shared by 3+ distinct artists => generic (YouTube channel art etc.)
by_hash = defaultdict(list)
for r in art:
    if r['sha1']:
        by_hash[r['sha1']].append(r['file'])
generic = set()
for h, fl in by_hash.items():
    arts = {artist_of(f) for f in fl}
    arts.discard('')
    if len(arts) >= 3:
        generic.add(h)

cands, keep = [], 0
reasons = Counter()
for r in art:
    fn = r['file']
    if fn in skipped:            # non-music, deliberately untouched
        continue
    t = tags.get(fn, {})
    artist, title = t.get('artist', ''), t.get('title', '')

    why = None
    if r['n_apic'] == 0:
        why = 'missing'
    elif r['err'].startswith('UNDECODABLE'):
        why = 'broken image'
    elif r['w'] and r['h']:
        a = r['w'] / r['h']
        # Album art is square. Anything else in this library is a YouTube
        # thumbnail: 1280x720 / 640x360 (16:9) and 640x480 / 480x360 (4:3)
        # are exactly YouTube's thumbnail sizes.
        if not (0.98 <= a <= 1.02):
            if 1.6 <= a <= 1.95:
                why = 'video thumbnail (16:9)'
            elif 1.25 <= a <= 1.4:
                why = 'video thumbnail (4:3)'
            else:
                why = f'non-square ({r["w"]}x{r["h"]})'
        elif min(r['w'], r['h']) < 200:
            why = 'too small (<200px)'
        elif r['sha1'] in generic:
            why = 'generic art shared across artists'

    if why is None:
        keep += 1
        continue
    if not artist or not title:
        reasons['UNFIXABLE - no artist/title to search on'] += 1
        continue
    reasons[why] += 1
    cands.append({'file': fn, 'artist': artist, 'title': title, 'why': why})

json.dump(cands, open(os.path.join(SP, 'art_candidates.json'), 'w',
          encoding='utf-8'), ensure_ascii=False, indent=0)

print(f'left alone (art looks fine) : {keep}')
print(f'CANDIDATES to fetch         : {len(cands)}\n')
for k, c in reasons.most_common():
    print(f'{c:5d}  {k}')
