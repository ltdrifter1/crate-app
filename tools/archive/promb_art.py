# -*- coding: utf-8 -*-
"""Artwork for PromB: fetch real album covers and embed them.

Sources, in order: iTunes (strict, then fuzzy) -> Deezer -> MusicBrainz.
Artist matching is always strict; only the title may be fuzzy, so a loose
title can never pull in a different artist's cover. Fetched images must be
square and >=300px or they are rejected -- that is what stops another video
thumbnail being embedded.

Originals are backed up to ./artbackup_promb before anything is overwritten;
revert_art_promb.py puts them back.

  python promb_art.py --test 30    # sample lookups, downloads nothing
  python promb_art.py              # fetch + embed (resumable)
"""
import os, io, re, sys, json, time, hashlib
from difflib import SequenceMatcher

SP = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, SP)
from fetch_art import search, pick, art_url, download, norm, CACHE, raw_artist_eq
from fetch_art2 import variants, strip_all
from mb_fallback import try_musicbrainz
from deezer import try_deezer
from mutagen.id3 import ID3, APIC, ID3NoHeaderError
from PIL import Image

ROOT = r'E:\04_MP3_Library\PromB'
BACKUP = os.path.join(SP, 'artbackup_promb')
MATCH = os.path.join(SP, 'promb_artmatch.json')
os.makedirs(BACKUP, exist_ok=True)
DJ = re.compile(r'\s*-\s*\d{1,2}[ABab]\s*-\s*\d{2,3}\s*$')
FUZZ = 0.82
TEST = 0
if '--test' in sys.argv:
    TEST = int(sys.argv[sys.argv.index('--test') + 1])


def fuzzy_pick(results, artist, title):
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


rows = json.load(open(os.path.join(SP, 'promb.json'), encoding='utf-8'))
present = set(os.listdir(ROOT))

cands = []
for r in rows:
    if r['file'] not in present:
        continue
    if r['square'] and min(r['w'], r['h']) >= 300:
        continue                       # already has real album art
    # strip the "- 8A - 126" suffix before any parsing
    rec = dict(r)
    rec['file'] = DJ.sub('', os.path.splitext(r['file'])[0]) + '.mp3'
    rec['title'] = strip_all(DJ.sub('', r['title'] or ''))
    rec['_real'] = r['file']
    cands.append(rec)

if TEST:
    import random
    random.seed(11)
    cands = random.sample(cands, min(TEST, len(cands)))

print(f'candidates needing artwork: {len(cands)}')

done = {}
if os.path.exists(MATCH) and not TEST:
    done = {d['file']: d for d in json.load(open(MATCH, encoding='utf-8'))
            if d.get('sha') or not d.get('matched')}

out, hit, miss = [], 0, 0
for i, rec in enumerate(cands):
    key = rec['_real']
    if key in done:
        out.append(done[key])
        hit += bool(done[key].get('matched'))
        continue

    vs = variants(rec)[:4]
    got = None
    for a, t in vs:
        res = search(a, t)
        p = pick(res, a, t)
        x = p[1] if p else fuzzy_pick(res, a, t)
        if x is not None:
            sha = None if TEST else download(art_url(x))
            if TEST or sha:
                got = {'sha': sha or '', 'src': 'itunes', 'q': f'{a} | {t}',
                       'artist': x.get('artistName', ''),
                       'album': x.get('collectionName', '')}
                break
        time.sleep(0.25)
    if not got and not TEST:
        for a, t in vs[:3]:
            sha, alb = try_deezer(a, t, CACHE)
            if sha:
                got = {'sha': sha, 'src': 'deezer', 'q': f'{a} | {t}',
                       'artist': a, 'album': alb}
                break
        if not got:
            for a, t in vs[:2]:
                sha = try_musicbrainz(a, t, CACHE)
                if sha:
                    got = {'sha': sha, 'src': 'musicbrainz',
                           'q': f'{a} | {t}', 'artist': a, 'album': ''}
                    break

    r = {'file': key, 'matched': bool(got)}
    r.update(got or {'q': ' || '.join(f'{a}|{t}' for a, t in vs[:2])})
    out.append(r)
    hit, miss = hit + bool(got), miss + (not got)
    if not TEST and i % 25 == 0:
        print(f'{i}/{len(cands)}  hit={hit} miss={miss}', flush=True)
        tmp = f'{MATCH}.{os.getpid()}.tmp'
        try:
            json.dump(out, open(tmp, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
            os.replace(tmp, MATCH)
        except OSError:
            pass

if not TEST:
    json.dump(out, open(MATCH, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
print(f'\nlookups {len(out)}  matched {hit}  missing {miss}')

if TEST:
    for r in out:
        print(('OK   ' if r['matched'] else 'MISS ') + r['file'][:56])
        if r['matched']:
            print(f"      -> {r.get('artist','')} / {r.get('album','')} [{r.get('src')}]")
    raise SystemExit(0)

# ---------------- embed ----------------
idx_path = os.path.join(BACKUP, '_index.json')
index = json.load(open(idx_path, encoding='utf-8')) if os.path.exists(idx_path) else {}
emb = rej = 0
errs = []
todo = [m for m in out if m.get('matched') and m.get('sha')]
print(f'\nembedding {len(todo)} covers...')
for i, m in enumerate(todo):
    src = os.path.join(CACHE, m['sha'] + '.jpg')
    if not os.path.exists(src):
        continue
    data = open(src, 'rb').read()
    try:
        w, h = Image.open(io.BytesIO(data)).size
        if not (0.95 <= w / h <= 1.05) or min(w, h) < 300:
            rej += 1
            continue
    except Exception:
        rej += 1
        continue
    path = os.path.join(ROOT, m['file'])
    if not os.path.exists(path):
        continue
    try:
        try:
            tags = ID3(path)
        except ID3NoHeaderError:
            tags = ID3()
        k = hashlib.sha1(m['file'].encode('utf-8')).hexdigest()
        if k not in index:
            old = tags.getall('APIC')
            if old:
                a = next((x for x in old if getattr(x, 'type', None) == 3), old[0])
                open(os.path.join(BACKUP, k + '.bin'), 'wb').write(a.data)
                index[k] = {'file': m['file'], 'mime': a.mime or 'image/jpeg', 'had_art': True}
            else:
                index[k] = {'file': m['file'], 'mime': '', 'had_art': False}
        tags.delall('APIC')
        tags.add(APIC(encoding=3, mime='image/jpeg', type=3, desc='Cover', data=data))
        tags.save(path, v2_version=3)
        emb += 1
    except Exception as e:
        errs.append(f"{m['file']}\t{e}")
    if i % 100 == 0:
        json.dump(index, open(idx_path, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
        print(f'  {i}/{len(todo)}', flush=True)

json.dump(index, open(idx_path, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
print(f'\nEMBEDDED {emb}   rejected(non-square) {rej}   errors {len(errs)}')
for e in errs[:10]:
    print('  ' + e)
