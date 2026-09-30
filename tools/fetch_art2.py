# -*- coding: utf-8 -*-
"""Second artwork pass for the files pass 1 couldn't fix.

Pass 1 failed three ways, each addressed here:

 1. 489 "no match" - my title cleaner left dangling "(" after stripping
    "(feat. ...)", so queries like "The One 2 (" could never match. Also
    leading track numbers ("12. Wavybone") and trailing years were kept.
 2. 215 "no artist/title" - these DO carry artist+song in the filename, just
    not as "Artist - Title": "X by Y", "A _ B _ C", "Artist_ Title", etc.
 3. 101 "art rejected" - all MusicBrainz/CAA sleeve scans that weren't square.
    Retried against iTunes first, which returns true square covers.

Strategy: build several (artist, title) guesses per file and try each until
one gives a strict artist+title match. Same square-art guard as before.

  python fetch_art2.py --test 30
  python fetch_art2.py --all
"""
import os, re, sys, json, time, unicodedata
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fetch_art import search, pick, art_url, download, norm, CACHE
from mb_fallback import try_musicbrainz

SP = os.path.dirname(os.path.abspath(__file__))
ROOT = r'E:\04_MP3_Library\evie'

JUNK_WORDS = re.compile(
    r'\b(official\s*(music\s*)?(video|audio)?|lyrics?\s*video|lyrics?|music\s*video|'
    r'full\s*album|album\s*stream|hd|hq|4k|visualizer|instrumental\s*cover|'
    r'from\s+the\s+basement|a\s+music\s+film|live\s+at\s+.*|live\s+on\s+.*|'
    r'soundtrack|ost|wish\s+i\s+was\s+here|'
    r'@.*|extra\s+hq|with\s+lyrics)\b', re.I)


def strip_all(t):
    t = re.sub(r'^\s*\d{1,2}\s*[\.\)\-]?\s+', '', t)    # "12. " / "01 " track no.
    t = re.sub(r'\bstarring\b.*$', '', t, flags=re.I)
    t = re.sub(r'\s+[A-Z][A-Z\.\$]{5,}$', '', t)        # trailing SHOUTY album tag
    t = re.sub(r'\[[^\]]*\]', ' ', t)                   # [Official Video]
    t = re.sub(r'\((?:[^()]*)\)', lambda m: '' if JUNK_WORDS.search(m.group(0))
               or re.search(r'feat|ft\.|\b(19|20)\d{2}\b', m.group(0), re.I)
               else m.group(0), t)
    t = re.sub(r'\s*\bfeat\.?\b.*$', '', t, flags=re.I)
    t = re.sub(r'\s*\bft\.?\b.*$', '', t, flags=re.I)
    t = JUNK_WORDS.sub(' ', t)
    t = re.sub(r'[\(\[]\s*$', '', t)                    # <- dangling "(" bug
    t = re.sub(r'\s*[\(\[\)\]]\s*', ' ', t)
    t = re.sub(r'\s*[-–_|]\s*$', '', t)
    return re.sub(r'\s+', ' ', t).strip(' -–_|.')


def variants(rec):
    """Yield plausible (artist, title) pairs, best guess first."""
    out, seen = [], set()

    def add(a, t):
        a, t = strip_all(a or ''), strip_all(t or '')
        if len(a) < 2 or len(t) < 2:
            return
        # A symbol-only artist ("!!!") normalises to '' -- keep it anyway and
        # key on the raw text, otherwise those files can never be queried.
        ka = norm(a) or re.sub(r'\s+', '', a.lower())
        k = (ka, norm(t))
        if k in seen or not ka or not k[1]:
            return
        seen.add(k)
        out.append((a, t))

    art, tit = rec.get('artist', ''), rec.get('title', '')
    stem = rec['file'][:-4]

    if art and tit:
        add(art, tit)
        add(re.sub(r'\s*[&,].*$', '', art), tit)   # first credited artist
        # drop a parenthetical alias: "!!! (Chk Chk Chk)" -> "!!!"
        add(re.sub(r'\s*\(.*?\)\s*', ' ', art), tit)
        add(tit, art)                              # reversed tags

    # "Artist - Title"
    if ' - ' in stem:
        a, _, t = stem.partition(' - ')
        add(a, t)
        add(t, a)                                  # reversed filename
    # "Title by Artist"
    m = re.match(r'^(.*?)\s+by\s+(.+)$', stem, re.I)
    if m:
        add(m.group(2), m.group(1))
    # "A _ B _ C"  (pipe-ish separators from YouTube)
    parts = [p.strip() for p in re.split(r'\s*[_|]\s*', stem) if p.strip()]
    if len(parts) >= 2:
        add(parts[1], parts[0])
        add(parts[0], parts[1])
    # "Artist-Title" with no spaces around the dash
    m = re.match(r'^([^-]{3,40})-([^-].{2,})$', stem)
    if m:
        add(m.group(1), m.group(2))
    # title itself may be "Artist - Title"
    if tit and ' - ' in tit:
        a, _, t = tit.partition(' - ')
        add(a, t)
    return out


def main():
    gaps = json.load(open(os.path.join(SP, 'gap_detail.json'), encoding='utf-8'))
    targets = sorted(set(gaps['nomatch'] + gaps['notcand'] + gaps['rejected']))
    review = {r['file']: r for r in
              json.load(open(os.path.join(SP, 'review.json'), encoding='utf-8'))}
    present = set(os.listdir(ROOT))
    targets = [f for f in targets if f in present]

    test_n = 0
    if '--test' in sys.argv:
        test_n = int(sys.argv[sys.argv.index('--test') + 1])
        targets = targets[:test_n]

    outp = os.path.join(SP, 'artmatch2.json')
    done = {}
    if os.path.exists(outp) and not test_n:
        done = {d['file']: d for d in json.load(open(outp, encoding='utf-8'))}

    out, hit, miss = [], 0, 0
    for i, fn in enumerate(targets):
        # Only trust a cached entry if it actually produced a cached image.
        # matched=True with an empty sha means it came from a --test run
        # (test mode never downloads), so it must be redone.
        if fn in done and (done[fn].get('sha') or not done[fn].get('matched')):
            out.append(done[fn])
            if done[fn].get('matched'):
                hit += 1
            continue
        rec = review.get(fn, {'file': fn, 'artist': '', 'title': ''})
        rec['file'] = fn
        got = None
        for a, t in variants(rec)[:5]:
            res = search(a, t)
            b = pick(res, a, t)
            if b:
                sha = None if test_n else download(art_url(b[1]))
                if test_n or sha:
                    got = {'q': f'{a} | {t}', 'sha': sha or '', 'src': 'itunes',
                           'album': b[1].get('collectionName', ''),
                           'artist': b[1].get('artistName', '')}
                    break
            time.sleep(0.3)
        if not got and not test_n:
            for a, t in variants(rec)[:2]:
                sha = try_musicbrainz(a, t, CACHE)
                if sha:
                    got = {'q': f'{a} | {t}', 'sha': sha, 'src': 'musicbrainz',
                           'album': '', 'artist': ''}
                    break

        r = {'file': fn, 'matched': bool(got)}
        r.update(got or {'q': ' || '.join(f'{a}|{t}' for a, t in variants(rec)[:3])})
        out.append(r)
        hit, miss = hit + bool(got), miss + (not got)
        if not test_n and i % 25 == 0:
            print(f'{i}/{len(targets)}  hit={hit} miss={miss}', flush=True)
            tmp = f'{outp}.{os.getpid()}.tmp'
            try:
                json.dump(out, open(tmp, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
                os.replace(tmp, outp)
            except OSError:
                pass

    if not test_n:          # never let a --test run persist and poison resume
        json.dump(out, open(outp, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
    print(f'\npass2 targets {len(targets)}   matched {hit}   still missing {miss}')
    if test_n:
        for r in out:
            print(('OK   ' if r['matched'] else 'MISS ') + r['file'][:58])
            print(f"      q={r.get('q','')[:70]}")
            if r['matched']:
                print(f"      -> {r.get('artist','')} / {r.get('album','')} [{r.get('src')}]")


if __name__ == '__main__':
    main()
