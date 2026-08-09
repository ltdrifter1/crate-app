# -*- coding: utf-8 -*-
"""MusicBrainz + Cover Art Archive fallback for tracks iTunes couldn't match.

MusicBrainz asks for a descriptive User-Agent and enforces ~1 req/sec;
both are respected below.
"""
import re, time, hashlib, os
import requests

MB = 'https://musicbrainz.org/ws/2/recording'
CAA = 'https://coverartarchive.org'
UA = {'User-Agent': 'PersonalLibraryArtTagger/1.0 (offline personal music library)'}
_last = [0.0]


def _throttle(min_gap=1.1):
    dt = time.time() - _last[0]
    if dt < min_gap:
        time.sleep(min_gap - dt)
    _last[0] = time.time()


def _esc(s):
    return re.sub(r'([+\-!(){}\[\]^"~*?:\\/]|&&|\|\|)', r'\\\1', s or '')


def mb_lookup(artist, title):
    """Return [(release_mbid, release_group_mbid), ...] for confident matches."""
    _throttle()
    q = f'artist:"{_esc(artist)}" AND recording:"{_esc(title)}"'
    try:
        r = requests.get(MB, params={'query': q, 'fmt': 'json', 'limit': 5},
                         headers=UA, timeout=20)
        if r.status_code in (429, 503):
            time.sleep(5)
            return []
        r.raise_for_status()
        data = r.json()
    except Exception:
        return []

    out = []
    for rec in data.get('recordings', []):
        if rec.get('score', 0) < 85:      # only reasonably confident matches
            continue
        for rel in rec.get('releases', []):
            rg = (rel.get('release-group') or {}).get('id', '')
            out.append((rel.get('id', ''), rg))
    return out


def caa_fetch(release_mbid, rg_mbid, cache_dir, px=500):
    """Try the release front cover, then the release-group front cover."""
    urls = []
    if release_mbid:
        urls.append(f'{CAA}/release/{release_mbid}/front-{px}')
    if rg_mbid:
        urls.append(f'{CAA}/release-group/{rg_mbid}/front-{px}')
    for u in urls:
        try:
            r = requests.get(u, headers=UA, timeout=20, allow_redirects=True)
            if r.status_code != 200:
                continue
            d = r.content
            if len(d) < 3000:
                continue
            h = hashlib.sha1(d).hexdigest()
            p = os.path.join(cache_dir, h + '.jpg')
            if not os.path.exists(p):
                open(p, 'wb').write(d)
            return h
        except Exception:
            continue
    return None


def try_musicbrainz(artist, title, cache_dir):
    for rel, rg in mb_lookup(artist, title)[:3]:
        h = caa_fetch(rel, rg, cache_dir)
        if h:
            return h
    return None
