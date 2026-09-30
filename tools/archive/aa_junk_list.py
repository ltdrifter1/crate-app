# -*- coding: utf-8 -*-
"""Show the flagged junk candidates that HAVE an artist tag (i.e. that would
otherwise be imported), so they can be hand-checked."""
import json, os, re
SP = os.path.dirname(os.path.abspath(__file__))
rows = {r['file']: r for r in
        json.load(open(os.path.join(SP, 'audioasis.json'), encoding='utf-8'))}
junk = json.load(open(os.path.join(SP, 'audioasis_dupes.json'), encoding='utf-8'))['junk']

withart = [f for f in junk if rows.get(f, {}).get('artist')]
noart = [f for f in junk if not rows.get(f, {}).get('artist')]
print(f'flagged: {len(junk)}   with artist tag: {len(withart)}   without: {len(noart)}')
print('\n=== FLAGGED **AND** HAS ARTIST (would be imported) ===')
for i, f in enumerate(withart, 1):
    r = rows[f]
    print(f"{i:3d}| a={r['artist'][:34]!r}")
    print(f"    t={r['title'][:70]!r}")
print('\n=== flagged, no artist (already going to review) ===')
for f in noart[:20]:
    print(f'   {f[:78]}')
