# -*- coding: utf-8 -*-
import json, re, os, sys, unicodedata
from collections import Counter
SP = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, SP)
from genres import ARTIST_GENRE
from ramos_genres import RAMOS_GENRE
from promb_genres import PROMB_GENRE
from morgan_genres import MORGAN_GENRE

rows = json.load(open(os.path.join(SP, 'audioasis.json'), encoding='utf-8'))


def fold(s):
    s = unicodedata.normalize('NFKD', (s or '').lower())
    s = ''.join(c for c in s if not unicodedata.combining(c))
    return re.sub(r'\s+', ' ', s).strip()


L = {}
for src in (ARTIST_GENRE, RAMOS_GENRE, PROMB_GENRE, MORGAN_GENRE):
    for k, v in src.items():
        L.setdefault(fold(k), v)


def look(a):
    f = fold(a)
    if not f:
        return None
    if f in L:
        return L[f]
    if f.startswith('the ') and f[4:] in L:
        return L[f[4:]]
    if 'the ' + f in L:
        return L['the ' + f]
    for part in re.split(r'\s*(?:&|,|\bfeat\.?\b|\bft\.?\b|\bx\b)\s*', f):
        part = part.strip()
        if part and part in L:
            return L[part]
    return None


# only the tracks that WILL be imported (have an artist tag)
keep = [r for r in rows if r['artist']]
mp, un = Counter(), Counter()
for r in keep:
    g = look(r['artist'])
    if g:
        mp[g] += 1
    else:
        un[r['artist'].strip()] += 1

print(f'importable (has artist): {len(keep)}')
print(f'  mapped by existing crates : {sum(mp.values())}')
for k, c in mp.most_common():
    print(f'     {c:5d}  {k}')
print(f'  UNMAPPED tracks           : {sum(un.values())}')
print(f'  distinct unmapped artists : {len(un)}')
open(os.path.join(SP, 'audioasis_unmapped.txt'), 'w', encoding='utf-8').write(
    '\n'.join(f'{c}\t{a}' for a, c in un.most_common()))
print('\n--- top 50 unmapped ---')
for a, c in un.most_common(50):
    print(f'  {c:4d}  {a}')
