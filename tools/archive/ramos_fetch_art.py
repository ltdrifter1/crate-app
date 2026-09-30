# -*- coding: utf-8 -*-
"""Artwork fetch for the Ramos crate.

Advantages over evie: clean "Artist - Title" tags and 915 album tags, so this
adds an ALBUM-search path (iTunes entity=album) that evie couldn't use.

Order per file:  iTunes album  ->  iTunes track (strict, then fuzzy)
                 ->  Deezer  ->  MusicBrainz
Artist match is always strict; only the title may be fuzzy.

  python ramos_fetch_art.py --test 30
  python ramos_fetch_art.py --all
"""
import os, re, sys, json, time
from difflib import SequenceMatcher
import requests
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fetch_art import (search, pick, art_url, download, norm, CACHE,
                       raw_artist_eq, UA, API)
from fetch_art2 import strip_all
from mb_fallback import try_musicbrainz
from deezer import try_deezer

SP = os.path.dirname(os.path.abspath(__file__))
ROOT = r'E:\04_MP3_Library\Ramos Jan 2025 - Mar 26'
DJ = re.compile(r'\s*-\s*\d{1,2}[AB]\s*-\s*\d{2,3}\s*$')
FUZZ = 0.82


def album_search(artist, album):
    """iTunes album lookup -- only usable when the file carries an album tag."""
    try:
        r = requests.get(API, params={'term': f'{artist} {album}',
                                      'media': 'music', 'entity': 'album',
                                      'limit': 8}, headers=UA, timeout=15)
        if r.status_code in (403, 429):
            time.sleep(3)
            return None
        r.raise_for_status()
        res = r.json().get('results', [])
    except Exception:
        return None
    na, nb = norm(artist), norm(album)
    if not na or not nb:
        return None
    for x in res:
        ra, rb = norm(x.get('artistName', '')), norm(x.get('collectionName', ''))
        if not ra or not rb:
            continue
        if not (na in ra or ra in na):
            continue
        if nb in rb or rb in nb or SequenceMatcher(None, nb, rb).ratio() >= 0.9:
            return x
    return None


def fuzzy_track(results, artist, title):
    na, nt = norm(artist), norm(title)
    if not nt:
        return None
    best = None
    for x in results:
        rn = x.get('artistName', '')
        ra, rt = norm(rn), norm(x.get('trackName', ''))
        if not rt:
            continue
        if na and ra:
            if not (na in ra or ra in na):
                continue
        elif not raw_artist_eq(artist, rn):
            continue
        if nt in rt or rt in nt:
            return x
        s = SequenceMatcher(None, nt, rt).ratio()
        if s >= FUZZ and (best is None or s > best[0]):
            best = (s, x)
    return best[1] if best else None


def clean(s):
    return strip_all(DJ.sub('', s or ''))


def main():
    cands = json.load(open(os.path.join(SP, 'ramos_art_cands.json'), encoding='utf-8'))
    present = set(os.listdir(ROOT))
    cands = [c for c in cands if c['file'] in present]

    test_n = 0
    if '--test' in sys.argv:
        test_n = int(sys.argv[sys.argv.index('--test') + 1])
        # RANDOM sample, not the first N. Taking the head is alphabetical and
        # badly over-estimated the hit rate on the evie pass-3 run.
        import random
        random.seed(11)
        cands = random.sample(cands, min(test_n, len(cands)))

    outp = os.path.join(SP, 'ramos_artmatch.json')
    done = {}
    if os.path.exists(outp) and not test_n:
        done = {d['file']: d for d in json.load(open(outp, encoding='utf-8'))
                if d.get('sha') or not d.get('matched')}

    out, hit, miss = [], 0, 0
    for i, c in enumerate(cands):
        fn = c['file']
        if fn in done:
            out.append(done[fn])
            hit += bool(done[fn].get('matched'))
            continue

        a = clean(re.sub(r'\s*[&,]\s*.*$', '', c['artist'])) or clean(c['artist'])
        a_full = clean(c['artist'])
        t = clean(c['title'])
        alb = clean(c['album'])
        got = None

        # 1) album search (strongest when present)
        if alb:
            for aa in (a_full, a):
                x = album_search(aa, alb)
                if x:
                    sha = None if test_n else download(art_url(x))
                    if test_n or sha:
                        got = {'sha': sha or '', 'src': 'itunes-album',
                               'q': f'{aa} | {alb}',
                               'artist': x.get('artistName', ''),
                               'album': x.get('collectionName', '')}
                        break
                time.sleep(0.25)

        # 2) track search
        if not got:
            for aa in (a_full, a):
                if not aa or not t:
                    continue
                res = search(aa, t)
                p = pick(res, aa, t)          # (score, result) or None
                x = p[1] if p else fuzzy_track(res, aa, t)
                if x is not None:
                    sha = None if test_n else download(art_url(x))
                    if test_n or sha:
                        got = {'sha': sha or '', 'src': 'itunes-track',
                               'q': f'{aa} | {t}',
                               'artist': x.get('artistName', ''),
                               'album': x.get('collectionName', '')}
                        break
                time.sleep(0.25)

        # 3) Deezer, 4) MusicBrainz
        if not got and not test_n:
            for aa in (a_full, a):
                sha, dalb = try_deezer(aa, t, CACHE)
                if sha:
                    got = {'sha': sha, 'src': 'deezer', 'q': f'{aa} | {t}',
                           'artist': aa, 'album': dalb}
                    break
            if not got:
                sha = try_musicbrainz(a_full or a, t, CACHE)
                if sha:
                    got = {'sha': sha, 'src': 'musicbrainz',
                           'q': f'{a_full} | {t}', 'artist': a_full, 'album': ''}

        r = {'file': fn, 'matched': bool(got), 'why': c['why']}
        r.update(got or {'q': f'{a_full} | {t}' + (f' | alb={alb}' if alb else '')})
        out.append(r)
        hit, miss = hit + bool(got), miss + (not got)
        if not test_n and i % 25 == 0:
            print(f'{i}/{len(cands)}  hit={hit} miss={miss}', flush=True)
            tmp = f'{outp}.{os.getpid()}.tmp'
            try:
                json.dump(out, open(tmp, 'w', encoding='utf-8'),
                          ensure_ascii=False, indent=0)
                os.replace(tmp, outp)
            except OSError:
                pass

    if not test_n:
        json.dump(out, open(outp, 'w', encoding='utf-8'),
                  ensure_ascii=False, indent=0)
    print(f'\nramos art: targets {len(cands)}  matched {hit}  missing {miss}')
    if test_n:
        for r in out:
            print(('OK   ' if r['matched'] else 'MISS ') + r['file'][:56])
            print(f"      q={r.get('q','')[:66]}")
            if r['matched']:
                print(f"      -> {r.get('artist','')} / {r.get('album','')} [{r.get('src')}]")


if __name__ == '__main__':
    main()
