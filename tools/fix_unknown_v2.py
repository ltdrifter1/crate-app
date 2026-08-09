# -*- coding: utf-8 -*-
"""Recover artist/title from titles only (none of these 73 exist in the
library, so hashing is pointless). Conservative: a parse is rejected unless
the artist half looks like an artist name.
"""
import re, json
from pathlib import Path
from collections import Counter

APP = Path(r'C:\Users\lpgut\crate-app')

# clearly not music
JUNK = re.compile(
    r'\bted\s*x|\btedx|eye exam|thundercats|air horn|\.avi\b|screening|'
    r'short list|\basl\b|interview|podcast|trailer|episode|unboxing|'
    r'\breview\b|how is a|how .* made|track breakdown|vs\s*20\d\d|'
    r'training camp|joins training|day \d+ of|gunner|highlights|'
    r'yomyomf|full match|press conference', re.I)

# trailing platform / promo noise to drop from a title
TAIL = re.compile(
    r'\s*[\|/]+\s*(ct\d+\s*\d*|pitchfork\s*tv|pitchforktv|npr|kexp|boiler room|'
    r'official.*|music video|audio|hd|hq|\d{4}|live.*|video oficial)\s*$', re.I)
PARENS = re.compile(
    r'\s*[\(\[][^\)\]]*(official|music video|video|audio|lyrics?|hd|hq|mv|'
    r'live at|live on|remaster|visualizer|video oficial)[^\)\]]*[\)\]]', re.I)

# an "artist" that is really a sentence
BAD_ARTIST = re.compile(
    r'\b(the science of|how|why|what|when|joins|returning|directed|'
    r'presents a|made|feat\b.*feat)\b', re.I)


def clean_title(s):
    prev = None
    while prev != s:
        prev = s
        s = TAIL.sub('', s)
        s = PARENS.sub('', s)
    return re.sub(r'\s+', ' ', s).strip(" -–_|.,")


def plausible_artist(a):
    if not a or len(a) < 2 or len(a) > 55:
        return False
    if BAD_ARTIST.search(a):
        return False
    words = a.split()
    if len(words) > 6:
        return False
    # ALL-CAPS multi-word headlines are usually video titles
    if len(words) >= 4 and a.upper() == a:
        return False
    if a.endswith('?') or a.endswith('!'):
        return False
    return True


# ordered: most reliable separator first. Comma is deliberately LAST and
# only allowed when the left side is short (it splits song titles otherwise).
SPLITS = [
    (re.compile(r'^(?P<a>.+?)\s*[|｜]\s*(?P<t>.+)$'), 'pipe'),
    (re.compile(r'^(?P<a>.+?)\s*//\s*(?P<t>.+)$'), 'slashes'),
    (re.compile(r'^(?P<t>.+?)\s+by\s+(?P<a>.+)$', re.I), 'by'),
    (re.compile(r'^(?P<a>.+?)\s{2,}(?P<t>.+)$'), 'multi-space'),
    (re.compile(r'^(?P<a>.+?)\s+-\s+(?P<t>.+)$'), 'dash'),
    (re.compile(r'^(?P<a>[^,]{2,28}),\s*(?P<t>.+)$'), 'comma'),
]

targets = json.load(open(APP / 'unknown-artists.json', encoding='utf-8'))
fixes, junk = [], []
stats = Counter()

for t in targets:
    raw = (t.get('title') or '').strip()
    if JUNK.search(raw):
        junk.append(t)
        stats['non-music'] += 1
        continue

    base = clean_title(raw)
    got = None
    for rx, name in SPLITS:
        m = rx.match(base)
        if not m:
            continue
        a = m.group('a').strip(" '\"“”-–_.")
        ti = clean_title(m.group('t')).strip(" '\"“”-–_.")
        if plausible_artist(a) and len(ti) >= 2:
            got = (a, ti, name)
            break

    if got:
        a, ti, how = got
        upd = {'artist': a}
        if ti and ti != raw:
            upd['title'] = ti
        fixes.append({'id': t['id'], 'was': raw, 'update': upd, 'src': how})
        stats[f'fixed via {how}'] += 1
    else:
        junk.append(t)
        stats['no usable split'] += 1

json.dump(fixes, open(APP / 'unknown-fix.json', 'w', encoding='utf-8'),
          ensure_ascii=False, indent=1)
json.dump(junk, open(APP / 'unknown-junk.json', 'w', encoding='utf-8'),
          ensure_ascii=False, indent=1)

print('--- RESULT ---')
for k, c in stats.most_common():
    print(f'  {c:4d}  {k}')
print(f'\n=== {len(fixes)} FIXES (review these) ===')
for f in fixes:
    u = f['update']
    print(f"  {f['was'][:58]}")
    print(f"     artist={u['artist']!r}  title={u.get('title','(unchanged)')!r}  [{f['src']}]")
print(f'\n=== {len(junk)} FLAGGED AS JUNK ===')
for j in junk:
    print(f"  {j.get('title','')[:70]}")
