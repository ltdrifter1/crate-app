# -*- coding: utf-8 -*-
"""Clean PromB tags before import:
  1. strip video/lyric junk from titles
  2. restore artist/title on files where they're missing or reversed

  python promb_cleanup.py            # dry run
  python promb_cleanup.py --commit   # write tags
"""
import os, re, sys
from collections import Counter
from mutagen.id3 import ID3, TPE1, TIT2, ID3NoHeaderError

ROOT = r'E:\04_MP3_Library\PromB'
COMMIT = '--commit' in sys.argv

# ── 1. title junk ────────────────────────────────────────────────────────
JUNK_PAREN = re.compile(
    r'\s*[\(\[]\s*(official\s*(music\s*)?(video|audio)?|music\s*video|'
    r'lyrics?\s*video|lyrics?|hq|hd|4k|audio|visualizer|live|remaster(ed)?\s*\d*|'
    r'\d{4}|maxi\s*45t|original\s*12\"?\s*mix)\s*[\)\]]', re.I)
JUNK_TAIL = re.compile(
    r'\s*(\[?(official\s*)?(music\s*)?video\]?|\[hq\]|\[hd\]|music\s*video|'
    r'audio\s*officiel|\(reaction\)|@\s*.+$|\|\s*.+$|'
    r'\b(hd|hq|4k)\b)\s*$', re.I)          # bare trailing HD/HQ too


def clean_title(t):
    # a trailing "..." means the source title was truncated -- keep it so the
    # track doesn't end on a dangling word like "...But This Is Literally The"
    ellipsis = bool(re.search(r'\.\.\.\s*$', t or ''))
    prev = None
    while prev != t:
        prev = t
        t = JUNK_PAREN.sub('', t)
        t = JUNK_TAIL.sub('', t)
    t = re.sub(r'\s{2,}', ' ', t)
    t = t.strip(' -–_.,|')
    if ellipsis and not t.endswith('...'):
        t += '...'
    return t


# ── 2. curated artist/title repairs, keyed by filename ───────────────────
FIX = {
 '09 The Dreamteam The Hard Way - 6A - 104.mp3': ('The Dreamteam', '3 The Hard Way'),
 'A Love Supreme, Part 1_ Acknowledgement - John Coltrane (1965) - 4A - 124.mp3':
     ('John Coltrane', 'A Love Supreme, Pt. 1: Acknowledgement'),   # was reversed
 'All I Need _ Radiohead _ From The Basement - 8B - 171.mp3': ('Radiohead', 'All I Need'),
 'Brandi Carlile Hallelujah - 9B - 144.mp3': ('Brandi Carlile', 'Hallelujah'),
 "Cold, Bold & Together --Somebody's Gonna Burn Ya - 9A - 97.mp3":
     ('Cold, Bold & Together', "Somebody's Gonna Burn Ya"),
 'Cool Change Little River Band - 11B - 132.mp3': ('Little River Band', 'Cool Change'),
 'Dark Sun Riders – Dark Sun Riders (Feat. Brother J) (HQ) 1996 - 9A - 180.mp3':
     ('Dark Sun Riders', 'Dark Sun Riders (feat. Brother J)'),
 'De La Soul   A Roller Skating Jam Named Saturdays - 10A - 115.mp3':
     ('De La Soul', 'A Roller Skating Jam Named "Saturdays"'),
 'Death Cab for Cutie -Title Track - 12B - 163.mp3': ('Death Cab for Cutie', 'Title Track'),
 'Final Decisions-The Pusher(1973) - 1A - 150.mp3': ('Final Decisions', 'The Pusher'),
 'Freddie Hubbard- Put It In The Pocket - 4A - 99.mp3': ('Freddie Hubbard', 'Put It In The Pocket'),
 'GWEN McCRAE   90_ OF ME IS YOU - 5A - 162.mp3': ('Gwen McCrae', '90% Of Me Is You'),
 'Invocation from City of Pearls by Sham-e-Ali Nayeem (feat. Qais Essar) - 9A - 96.mp3':
     ('Sham-e-Ali Nayeem', 'Invocation from City of Pearls (feat. Qais Essar)'),
 'Josh Verdes- Original- Save Me - 2B - 174.mp3': ('Josh Verdes', 'Save Me'),
 'LOWRELL. Mellow, Mellow Right On. 1979. Original 12 Mix. - 6A - 177.mp3':
     ('Lowrell', 'Mellow Mellow Right On'),
 'Neezie Pleaze - Watch - 5A - 95.mp3': ('Neezie Pleaze', 'Watch'),
 'Organic Thoughts- World Renowned feat Large Professor - 5A - 90.mp3':
     ('Organic Thoughts', 'World Renowned (feat. Large Professor)'),
 'Osnizzle Happy Haole Music Video - 2A - 168.mp3': ('Osnizzle', 'Happy Haole'),
 'PNL  Shenmue Audio Officiel - 10A - 126.mp3': ('PNL', 'Shenmue'),
 "Pale Jay-'Don't Forget That I Love You' [OFFICIAL MUSIC VIDEO] - 2A - 156.mp3":
     ('Pale Jay', "Don't Forget That I Love You"),
 "Parliament 'Come In Out Of The Rain', Osmium [1970] - 3A - 168.mp3":
     ('Parliament', 'Come In Out Of The Rain'),
 'People Under the Stairs San Francisco Knights - 9A - 175.mp3':
     ('People Under the Stairs', 'San Francisco Knights'),
 'Push And Pull Theory.  Isangmahal 1998 - 4A - 96.mp3': ('isangmahal', 'Push And Pull Theory'),
 'Raphael Saadiq – Still Ray (HQ) 2002 - 3A - 168.mp3': ('Raphael Saadiq', 'Still Ray'),
 'Rickey G. & The Everloving Five – To The Max (1983) (Maxi 45T) - 8A - 98.mp3':
     ('Rickey G. & The Everloving Five', 'To The Max'),
 'SEE YOU AGAIN featuring Kali Uchis - 3A - 157.mp3':
     ('Tyler, The Creator', 'See You Again (feat. Kali Uchis)'),
 'Soulja Slim-Love Me or Love Me Not - 11A - 158.mp3': ('Soulja Slim', 'Love Me or Love Me Not'),
 'Tetsuji Hayashi_ Silly Girl - 11A - 93.mp3': ('Tetsuji Hayashi', 'Silly Girl'),
 'The Physics of Failure_  The Lake Peigneur Cascade - 5A - 129.mp3':
     ('The Physics of Failure', 'The Lake Peigneur Cascade'),
 'Vampire Weekend   Step BIANKA Remix Music Video - 6B - 155.mp3':
     ('Vampire Weekend', 'Step (BIANKA Remix)'),
 'Wayne Wonder No Letting Go - 4A - 100.mp3': ('Wayne Wonder', 'No Letting Go'),
 "Zo! & Tigallo- I'm Only Human - 4B - 98.mp3": ('Zo! & Tigallo', "I'm Only Human"),
 'cymande    genevieve - 5A - 90.mp3': ('Cymande', 'Genevieve'),
 'the flaming lips yoshimi battles the pink robots part 1 - 8A - 156.mp3':
     ('The Flaming Lips', 'Yoshimi Battles the Pink Robots, Pt. 1'),
 'zeebra Street Dreams - 12A - 99.mp3': ('Zeebra', 'Street Dreams'),
}

# long "PRODUCED BY / VIDEO BY" credits -- artist and title are the first two parts
CREDITS = re.compile(r'^(?P<a>.+?)\s*__\s*(?P<t>.+?)\s*__\s*(produced|video)\s+by', re.I)

# genuinely not music / nothing recoverable -- reported, not modified
LEAVE = {
 '20100908 nancyguppy 001 - 8A - 134.mp3',
 'JID, WESTSIDE GUNN & CONWAY WENT COMPLETELY OFF! Mamas PrimeTime (REACTION) - 8A - 150.mp3',
 'Mountains (ft. Clarissa Abadesco) - 4A - 170.mp3',
 'Ready For We __ Music Video - 5A - 172.mp3',
}

DJ = re.compile(r'\s*-\s*\d{1,2}[ABab]\s*-\s*\d{2,3}$')

changes, left, stats = [], [], Counter()
for fn in sorted(f for f in os.listdir(ROOT) if f.lower().endswith('.mp3')):
    p = os.path.join(ROOT, fn)
    try:
        tags = ID3(p)
    except (ID3NoHeaderError, Exception):
        continue

    def get(fr):
        v = tags.get(fr)
        try:
            return str(v.text[0]).strip() if (v and v.text) else ''
        except Exception:
            return ''

    artist, title = get('TPE1'), get('TIT2')
    new_a, new_t = artist, title

    if fn in LEAVE:
        left.append(fn)
        stats['left alone (not music / unrecoverable)'] += 1
        continue

    if fn in FIX:
        new_a, new_t = FIX[fn]
        stats['artist+title repaired'] += 1
    elif not artist:
        stem = DJ.sub('', os.path.splitext(fn)[0])
        m = CREDITS.match(stem)
        if m:
            new_a = m.group('a').strip().title()
            new_t = m.group('t').strip().title()
            stats['artist from PRODUCED BY credit'] += 1

    cleaned = clean_title(new_t)
    if cleaned and cleaned != new_t:
        new_t = cleaned
        stats['title junk stripped'] += 1

    if new_a != artist or new_t != title:
        changes.append((fn, artist, title, new_a, new_t))
        if COMMIT:
            if new_a != artist and new_a:
                tags.setall('TPE1', [TPE1(encoding=3, text=[new_a])])
            if new_t != title and new_t:
                tags.setall('TIT2', [TIT2(encoding=3, text=[new_t])])
            tags.save(p, v2_version=3)

print(f"{'APPLIED' if COMMIT else 'DRY RUN'} — {len(changes)} files would change\n")
for k, c in stats.most_common():
    print(f'  {c:4d}  {k}')
print(f'\n--- changes ---')
for fn, oa, ot, na, nt in changes[:60]:
    print(f'  {fn[:60]}')
    if oa != na:
        print(f'      artist: {oa!r} -> {na!r}')
    if ot != nt:
        print(f'      title : {ot!r} -> {nt!r}')
print(f'\n--- left alone ({len(left)}) ---')
for fn in left:
    print(f'  {fn[:70]}')
