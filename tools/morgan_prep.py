# -*- coding: utf-8 -*-
"""Prepare Morgan end-to-end: clean titles, recover artists, write genres,
quarantine junk + the stray .download file.

  python morgan_prep.py            # dry run
  python morgan_prep.py --commit   # apply
"""
import os, re, sys, json, csv, shutil, unicodedata
from collections import Counter
from mutagen.id3 import ID3, TCON, TPE1, TIT2, ID3NoHeaderError

SP = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, SP)
from genres import ARTIST_GENRE
from ramos_genres import RAMOS_GENRE
from promb_genres import PROMB_GENRE
from morgan_genres import MORGAN_GENRE, DEFAULT

ROOT = r'E:\04_MP3_Library\Morgan'
QUAR = r'E:\04_MP3_Library\_junk_morgan'
COMMIT = '--commit' in sys.argv
DJ = re.compile(r'\s*-\s*\d{1,2}[ABab]\s*-\s*\d{2,3}\s*$')
VALID = {'Electronic', 'Hip-Hop', 'R&B & Soul', 'Rock', 'Metal',
         'Jazz', 'Classical', 'Country & Folk'}

# ---- genuinely not music (hand-checked; the earlier keyword sweep had many
# false positives like "Doves - Strange Weather" and "World News") ----
JUNK_FILES = {
    "A beginner's guide to Chalk Paint® by Annie Sloan - 6A - 95.mp3",
    "David Lynch's Weather Report  12_16_22 - 7A - 121.mp3",
}
JUNK_SUBSTR = ['full interview', 'the story behind', 'chalk paint',
               "weather report  12", 'log lady']

# ---- title cleaning ----
JUNK_PAREN = re.compile(
    r'\s*[\(\[]\s*(official\s*(music\s*)?(video|audio)?|music\s*video|'
    r'lyrics?\s*video|lyrics?|hq|hd|4k|audio|visualizer|remaster(ed)?\s*\d*|'
    r'\d{4}|ultimate mix,?\s*\d{4}|extra hq)\s*[\)\]]', re.I)
JUNK_TAIL = re.compile(
    r'\s*(\[?(official\s*)?(music\s*)?video\]?|\[hq\]|\[hd\]|music\s*video|'
    r'lyric video|\b(hd|hq|4k)\b|@\s*.+|\|\s*.+)\s*$', re.I)


def clean_title(t):
    if not t:
        return t
    ell = bool(re.search(r'\.\.\.\s*$', t))
    prev = None
    while prev != t:
        prev = t
        t = JUNK_PAREN.sub('', t)
        t = JUNK_TAIL.sub('', t)
    t = re.sub(r'\s{2,}', ' ', t).strip(' -–_.,|')
    if ell and not t.endswith('...'):
        t += '...'
    return t


SPLITS = [
    re.compile(r'^(?P<a>.+?)\s+[–—-]\s*(?P<t>.+)$'),
    re.compile(r'^(?P<t>.+?)\s+by\s+(?P<a>.+)$', re.I),
    re.compile(r'^(?P<a>.+?)\s{2,}(?P<t>.+)$'),
]
BAD_A = re.compile(r'^\d{6,}|^\d{1,2}\s|\bthe story behind\b|guide to', re.I)


def split_from_stem(stem):
    """Best-effort Artist/Title from a filename with no artist tag."""
    for rx in SPLITS:
        m = rx.match(stem)
        if not m:
            continue
        a = m.group('a').strip(" '\"“”-–_.")
        t = clean_title(m.group('t')).strip(" '\"“”-–_.")
        if 1 < len(a) <= 55 and len(t) >= 2 and not BAD_A.search(a) \
           and len(a.split()) <= 7:
            return a, t
    return None, None


def fold(s):
    s = unicodedata.normalize('NFKD', (s or '').lower())
    s = ''.join(c for c in s if not unicodedata.combining(c))
    return re.sub(r'\s+', ' ', s).strip()


LOOKUP = {}
for src in (ARTIST_GENRE, RAMOS_GENRE, PROMB_GENRE):
    for k, v in src.items():
        LOOKUP.setdefault(fold(k), v)
for k, v in MORGAN_GENRE.items():
    LOOKUP[fold(k)] = v


def lookup(a):
    f = fold(a)
    if not f:
        return None
    if f in LOOKUP:
        return LOOKUP[f]
    if f.startswith('the ') and f[4:] in LOOKUP:
        return LOOKUP[f[4:]]
    if 'the ' + f in LOOKUP:
        return LOOKUP['the ' + f]
    for part in re.split(r'\s*(?:&|,|\bfeat\.?\b|\bft\.?\b|\bx\b|\bvs\.?\b)\s*', f):
        part = part.strip()
        if part and part in LOOKUP:
            return LOOKUP[part]
    return None


stats, changes, junk, plan = Counter(), [], [], []
for fn in sorted(os.listdir(ROOT)):
    p = os.path.join(ROOT, fn)
    if not os.path.isfile(p):
        continue
    low = fn.lower()

    if low.endswith('.download'):
        junk.append((fn, 'incomplete download'))
        stats['incomplete .download'] += 1
        continue
    if not low.endswith('.mp3'):
        continue
    if fn in JUNK_FILES or any(s in low for s in JUNK_SUBSTR):
        junk.append((fn, 'not music'))
        stats['not music'] += 1
        continue

    try:
        tags = ID3(p)
    except (ID3NoHeaderError, Exception):
        tags = ID3()

    def get(fr):
        v = tags.get(fr)
        try:
            return str(v.text[0]).strip() if (v and v.text) else ''
        except Exception:
            return ''

    artist, title = get('TPE1'), get('TIT2')
    new_a, new_t = artist, title
    stem = DJ.sub('', os.path.splitext(fn)[0])

    if not new_a:
        a, t = split_from_stem(stem)
        if a:
            new_a, new_t = a, t
            stats['artist recovered from filename'] += 1
        else:
            stats['NO artist recoverable'] += 1

    ct = clean_title(new_t)
    if ct and ct != new_t:
        new_t = ct
        stats['title cleaned'] += 1

    genre = lookup(new_a) or DEFAULT
    assert genre in VALID
    stats['genre: ' + ('matched' if lookup(new_a) else 'DEFAULT')] += 1
    plan.append({'file': fn, 'artist': new_a, 'title': new_t, 'genre': genre})

    if COMMIT:
        try:
            if new_a and new_a != artist:
                tags.setall('TPE1', [TPE1(encoding=3, text=[new_a])])
            if new_t and new_t != title:
                tags.setall('TIT2', [TIT2(encoding=3, text=[new_t])])
            tags.setall('TCON', [TCON(encoding=3, text=[genre])])
            tags.save(p, v2_version=3)
        except Exception as e:
            stats['WRITE ERROR'] += 1
    if new_a != artist or new_t != title:
        changes.append((fn, artist, title, new_a, new_t))

if COMMIT and junk:
    os.makedirs(QUAR, exist_ok=True)
    for fn, _ in junk:
        try:
            shutil.move(os.path.join(ROOT, fn), os.path.join(QUAR, fn))
        except Exception:
            pass

with open(os.path.join(SP, 'morgan_plan.csv'), 'w', encoding='utf-8', newline='') as f:
    w = csv.writer(f)
    w.writerow(['genre', 'artist', 'title', 'file'])
    for x in sorted(plan, key=lambda r: (r['genre'], r['artist'].lower())):
        w.writerow([x['genre'], x['artist'], x['title'], x['file']])

print(f"{'APPLIED' if COMMIT else 'DRY RUN'} — {len(plan)} tracks kept, {len(junk)} quarantined\n")
for k, c in stats.most_common():
    print(f'  {c:5d}  {k}')
print('\n--- GENRE DISTRIBUTION ---')
for g, c in Counter(x['genre'] for x in plan).most_common():
    print(f'  {c:5d}  {100*c/max(len(plan),1):5.1f}%  {g}')
print(f'\n--- QUARANTINE ({len(junk)}) -> {QUAR} ---')
for fn, why in junk:
    print(f'  [{why}] {fn[:66]}')
print(f'\n--- TAG CHANGES (first 25 of {len(changes)}) ---')
for fn, oa, ot, na, nt in changes[:25]:
    print(f'  {fn[:58]}')
    if oa != na:
        print(f'      artist: {oa!r} -> {na!r}')
    if ot != nt:
        print(f'      title : {ot!r} -> {nt!r}')
