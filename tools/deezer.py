# -*- coding: utf-8 -*-
"""Deezer as a third artwork source. Public API, no key.
Different catalogue coverage from iTunes, and returns 1000x1000 covers."""
import time, hashlib, os
import requests
from fetch_art import norm

API = 'https://api.deezer.com/search'
UA = {'User-Agent': 'Mozilla/5.0 (personal library art tagger)'}
_last = [0.0]


def _throttle(gap=0.25):
    dt = time.time() - _last[0]
    if dt < gap:
        time.sleep(gap - dt)
    _last[0] = time.time()


def dz_search(artist, title, limit=8):
    _throttle()
    q = f'artist:"{artist}" track:"{title}"'
    try:
        r = requests.get(API, params={'q': q, 'limit': limit},
                         headers=UA, timeout=15)
        if r.status_code in (429, 403):
            time.sleep(3)
            return []
        r.raise_for_status()
        return r.json().get('data', []) or []
    except Exception:
        return []


def dz_pick(results, artist, title):
    """Artist must match; title must match. Same strictness as the iTunes path."""
    na, nt = norm(artist), norm(title)
    if not nt or not na:
        return None
    for res in results:
        ra = norm((res.get('artist') or {}).get('name', ''))
        rt = norm(res.get('title', ''))
        if not rt or not ra:
            continue
        if not (na in ra or ra in na):
            continue
        if nt in rt or rt in nt:
            return res
    return None


def dz_cover_url(res):
    alb = res.get('album') or {}
    return (alb.get('cover_xl') or alb.get('cover_big') or
            alb.get('cover_medium') or '')


def try_deezer(artist, title, cache_dir):
    """Return (sha, album_name) or (None, '')."""
    res = dz_pick(dz_search(artist, title), artist, title)
    if not res:
        return None, ''
    url = dz_cover_url(res)
    if not url:
        return None, ''
    try:
        r = requests.get(url, headers=UA, timeout=20)
        r.raise_for_status()
        d = r.content
        if len(d) < 3000:
            return None, ''
        h = hashlib.sha1(d).hexdigest()
        p = os.path.join(cache_dir, h + '.jpg')
        if not os.path.exists(p):
            open(p, 'wb').write(d)
        return h, (res.get('album') or {}).get('title', '')
    except Exception:
        return None, ''
