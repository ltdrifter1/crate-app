# -*- coding: utf-8 -*-
import json, re, os, random
SP = os.path.dirname(os.path.abspath(__file__))
rows = json.load(open(os.path.join(SP, 'audioasis.json'), encoding='utf-8'))
DJ = re.compile(r'\s*-\s*\d{1,2}[ABab]\s*-\s*\d{2,3}\s*$')
SEP = re.compile(r'^.{2,50}\s+[-–—]\s+.{2,}$')

na = [r for r in rows if not r['artist']]
print(f'no-artist total : {len(na)}')
split, nosplit = [], []
for r in na:
    stem = DJ.sub('', os.path.splitext(r['file'])[0])
    (split if SEP.match(stem) else nosplit).append(stem)
print(f'  splits on " - " : {len(split)}')
print(f'  NO separator    : {len(nosplit)}')

random.seed(4)
print('\n--- sample: WOULD split ---')
for s in random.sample(split, min(12, len(split))):
    print(f'   {s[:80]}')
print('\n--- sample: NO separator ---')
for s in random.sample(nosplit, min(30, len(nosplit))):
    print(f'   {s[:80]}')
