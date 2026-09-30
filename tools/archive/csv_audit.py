# -*- coding: utf-8 -*-
"""Read-only: which tracks.csv rows have no cover?"""
import csv, os, json

APP = r'C:\Users\lpgut\crate-app'
SP = os.path.dirname(os.path.abspath(__file__))
covers = set(os.listdir(os.path.join(APP, 'covers')))

rows = list(csv.DictReader(open(os.path.join(APP, 'tracks.csv'),
                                encoding='utf-8-sig')))
no_cover_field, missing_file, ok = [], [], 0
for r in rows:
    cf = (r.get('coverFile') or '').strip()
    if not cf:
        no_cover_field.append(r)
    elif cf not in covers:
        missing_file.append(r)
    else:
        ok += 1

print(f'tracks.csv rows        : {len(rows)}')
print(f'  cover OK             : {ok}')
print(f'  coverFile EMPTY      : {len(no_cover_field)}')
print(f'  coverFile set but    : {len(missing_file)}  (file not in covers/)')
print(f'files in covers/       : {len(covers)}')

print('\n--- sample: empty coverFile ---')
for r in no_cover_field[:15]:
    print(f"  {r.get('artist','')[:22]:22} | {r.get('title','')[:46]}")

print('\n--- sample: coverFile set but file missing ---')
for r in missing_file[:10]:
    print(f"  {r.get('coverFile','')[:60]}")

json.dump({'empty': [{'title': r.get('title', ''), 'artist': r.get('artist', ''),
                      'audioFile': r.get('audioFile', '')} for r in no_cover_field],
           'missing': [{'title': r.get('title', ''), 'artist': r.get('artist', ''),
                        'audioFile': r.get('audioFile', ''),
                        'coverFile': r.get('coverFile', '')} for r in missing_file]},
          open(os.path.join(SP, 'csv_nocover.json'), 'w', encoding='utf-8'),
          ensure_ascii=False, indent=1)
