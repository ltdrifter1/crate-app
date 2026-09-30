# -*- coding: utf-8 -*-
"""Quarantine byte-identical duplicates in the Ramos crate.

Only IDENTICAL audio is moved. Alternate mixes/remixes/extended versions
(same name, different audio) are left alone -- for a DJ crate those are
different records, not duplicates.

Files are MOVED to E:\04_MP3_Library\_duplicates_ramos, never deleted.

  python ramos_dedupe.py            # dry run
  python ramos_dedupe.py --commit   # move
"""
import os, sys, json, re, shutil

ROOT = r'E:\04_MP3_Library\Ramos Jan 2025 - Mar 26'
QUAR = r'E:\04_MP3_Library\_duplicates_ramos'
SP = os.path.dirname(os.path.abspath(__file__))
COMMIT = '--commit' in sys.argv

rows = {r['file']: r for r in
        json.load(open(os.path.join(SP, 'ramos_review.json'), encoding='utf-8'))}
dupes = json.load(open(os.path.join(SP, 'ramos_dupes.json'), encoding='utf-8'))

DL = re.compile(r'-\d+(?=\s*-\s*\d{1,2}[AB]\s*-\s*\d{2,3}\.mp3$)|-\d+\.mp3$', re.I)


def keep_score(fn):
    """Higher = keep. Strongly prefer the copy without a '-1' download marker."""
    r = rows.get(fn, {})
    return (0 if DL.search(fn) else 1, r.get('alen', 0), -len(fn))


plan = []
for g in dupes['exact']:
    g = [f for f in g if os.path.exists(os.path.join(ROOT, f))]
    if len(g) < 2:
        continue
    best = max(g, key=keep_score)
    for f in g:
        if f != best:
            plan.append((f, best))

if COMMIT and plan:
    os.makedirs(QUAR, exist_ok=True)
for f, best in plan:
    if COMMIT:
        d = os.path.join(QUAR, f)
        n = 1
        while os.path.exists(d):
            s, e = os.path.splitext(f)
            d = os.path.join(QUAR, f'{s}__dup{n}{e}')
            n += 1
        shutil.move(os.path.join(ROOT, f), d)

with open(os.path.join(SP, 'ramos_dedupe_plan.txt'), 'w', encoding='utf-8') as fh:
    for f, best in plan:
        fh.write(f'MOVE  {f}\n KEEP  {best}\n\n')

print(('MOVED ' if COMMIT else 'WOULD MOVE ') + f'{len(plan)} identical copies')
print(f"alternate mixes/versions left alone: {len(dupes['namedup'])} groups")
print(f'quarantine: {QUAR}')
for f, best in plan[:12]:
    print(f'  - {f[:66]}\n      keep: {best[:62]}')
