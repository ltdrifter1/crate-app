# -*- coding: utf-8 -*-
"""Look up cover art on the iTunes Search API (no key, public endpoint).

  python fetch_art.py --test 25      # sample lookups, print matches, download nothing
  python fetch_art.py --all          # cache art for every candidate (no tag writes)

Writes images into ./artcache/<sha>.jpg plus artmatch.json.
Embedding into the MP3s is a separate, later step (embed_art.py).
"""
import os, re, sys, json, time, hashlib, unicodedata
import requests
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mb_fallback import try_musicbrainz

SP = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(SP, 'artcache')
os.makedirs(CACHE, exist_ok=True)
API = 'https://itunes.apple.com/search'
UA = {'User-Agent': 'Mozilla/5.0 (artwork tagger; personal library)'}

NOISE = re.compile(
    r'\s*[\(\[][^\)\]]*(official|lyric|music\s*video|video|audio|hd|hq|4k|'
    r'visualizer|full album|remaster|explicit|album stream|'
    r'live\s+(on|at|in|from)|kexp|session|acoustic|bbc|npr|tiny desk|'
    r'pitchfork|glastonbury|letterman|boiler room)[^\)\]]*[\)\]]',
    re.I)
TRAIL = re.compile(r'\s*[-–]\s*(official.*|lyric.*|music video.*|hd|hq)$', re.I)


def clean_title(t):
    t = NOISE.sub('', t)
    t = TRAIL.sub('', t)
    t = re.sub(r'\s*\bfeat\.?\b.*$', '', t, flags=re.I)
    t = re.sub(r'\s*\bft\.?\b.*$', '', t, flags=re.I)
    return re.sub(r'\s+', ' ', t).strip(' -–_')


def clean_artist(a):
    a = re.sub(r'\s*[&,]\s*.*$', '', a)      # first credited artist only
    return re.sub(r'\s+', ' ', a).strip()


def norm(s):
    s = unicodedata.normalize('NFKD', s.lower())
    s = ''.join(c for c in s if not unicodedata.combining(c))
    # "and" and "&" must collapse to the same thing, otherwise
    # "Sound and Color" never matches "Sound & Color" and
    # "Simon and Garfunkel" never matches "Simon & Garfunkel".
    s = re.sub(r'\s*&\s*', ' and ', s)
    s = re.sub(r'\band\b', '', s)
    s = re.sub(r'\bthe\b', '', s)                # "The Smiths" == "Smiths"
    s = s.replace('$', 's')                      # "A$AP Rocky" == "ASAP Rocky"
    return re.sub(r'[^a-z0-9]+', '', s)


def raw_artist_eq(a, b):
    """Fallback for artists that are pure punctuation, e.g. '!!!',
    which norm() reduces to an empty string and so can never match."""
    f = lambda s: re.sub(r'\s+', '', (s or '').lower())
    return bool(f(a)) and f(a) == f(b)


def search(artist, title, tries=3):
    term = f'{artist} {title}'.strip()
    for k in range(tries):
        try:
            r = requests.get(API, params={
                'term': term, 'media': 'music', 'entity': 'song', 'limit': 8
            }, headers=UA, timeout=15)
            if r.status_code == 403 or r.status_code == 429:
                time.sleep(5 * (k + 1))
                continue
            r.raise_for_status()
            return r.json().get('results', [])
        except Exception:
            time.sleep(2 * (k + 1))
    return []


def pick(results, artist, title):
    """BOTH artist and track title must match.

    Artist-only matches are rejected on purpose. iTunes happily returns some
    other album by the same artist, and taking its cover silently attaches the
    wrong artwork -- e.g. Tame Impala "'Cause I'm a Man" is on *Currents*, but
    an artist-only match returns *The Slow Rush*. Wrong art is worse than none,
    so these fall through to MusicBrainz and are otherwise left alone.
    """
    na, nt = norm(artist), norm(title)
    if not nt:
        return None
    for res in results:
        rname = res.get('artistName', '')
        ra, rt = norm(rname), norm(res.get('trackName', ''))
        if not rt:
            continue
        if na and ra:
            if not (na in ra or ra in na):
                continue
        elif not raw_artist_eq(artist, rname):
            continue          # symbol-only artist: require exact raw match
        if nt in rt or rt in nt:
            return (2, res)
    return None


def art_url(res, px=600):
    u = res.get('artworkUrl100') or res.get('artworkUrl60') or ''
    return re.sub(r'/\d+x\d+bb\.(jpg|png)$', f'/{px}x{px}bb.jpg', u) if u else ''


def download(url):
    try:
        r = requests.get(url, headers=UA, timeout=20)
        r.raise_for_status()
        d = r.content
        if len(d) < 3000:
            return None
        h = hashlib.sha1(d).hexdigest()
        p = os.path.join(CACHE, h + '.jpg')
        if not os.path.exists(p):
            open(p, 'wb').write(d)
        return h
    except Exception:
        return None


def main():
    cands = json.load(open(os.path.join(SP, 'art_candidates.json'), encoding='utf-8'))
    test_n = 0
    if '--test' in sys.argv:
        test_n = int(sys.argv[sys.argv.index('--test') + 1])
        cands = cands[:test_n]

    outp = os.path.join(SP, 'artmatch.json')
    done = {}
    if os.path.exists(outp) and not test_n:
        done = {d['file']: d for d in json.load(open(outp, encoding='utf-8'))}

    out, hit, miss = [], 0, 0
    for i, c in enumerate(cands):
        if c['file'] in done:
            out.append(done[c['file']]);  continue
        a, t = clean_artist(c['artist']), clean_title(c['title'])
        res = search(a, t)
        b = pick(res, a, t)
        rec = {'file': c['file'], 'q_artist': a, 'q_title': t,
               'why': c.get('why', ''), 'src': '',
               'matched': False, 'sha': '', 'score': 0,
               'm_artist': '', 'm_album': '', 'm_track': ''}
        if b:
            score, r = b
            rec.update(matched=True, score=score, src='itunes',
                       m_artist=r.get('artistName', ''),
                       m_album=r.get('collectionName', ''),
                       m_track=r.get('trackName', ''))
            if not test_n:
                sha = download(art_url(r))
                rec['sha'] = sha or ''
                rec['matched'] = bool(sha)
            hit += 1
        elif not test_n:
            # iTunes had no artist+title match -> try MusicBrainz / Cover Art Archive
            sha = try_musicbrainz(a, t, CACHE)
            if sha:
                rec.update(matched=True, sha=sha, score=2, src='musicbrainz')
                hit += 1
            else:
                miss += 1
        else:
            miss += 1
        out.append(rec)
        time.sleep(0.35)          # be polite to the endpoint
        if not test_n and i % 25 == 0:
            print(f'{i}/{len(cands)}  hit={hit} miss={miss}', flush=True)
            # checkpoint often so a crash/kill loses little and resume works.
            # PID-unique temp name: if two copies ever run at once they no
            # longer collide on the same .tmp path (that raised WinError 32).
            tmp = f'{outp}.{os.getpid()}.tmp'
            try:
                json.dump(out, open(tmp, 'w', encoding='utf-8'),
                          ensure_ascii=False, indent=0)
                os.replace(tmp, outp)
            except OSError as e:
                print(f'  (checkpoint skipped: {e})', flush=True)

    json.dump(out, open(outp, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
    print(f'\nlookups {len(out)}   matched {hit}   no-match {miss}')
    if test_n:
        print('\n--- SAMPLE MATCHES (nothing downloaded) ---')
        for r in out:
            tag = 'OK ' if r['score'] == 2 else ('~  ' if r['score'] == 1 else 'XX ')
            print(f"{tag} {r['q_artist']} - {r['q_title']}")
            if r['matched'] or r['score']:
                print(f"      -> {r['m_artist']} / {r['m_album']} / {r['m_track']}")


if __name__ == '__main__':
    main()
