# -*- coding: utf-8 -*-
"""Hand-curated artist/title for the 73 unknown-artist tracks.
Three outcomes: FIX (confident), JUNK (not music), LEAVE (ambiguous -> untouched).
"""
import json
from pathlib import Path

APP = Path(r'C:\Users\lpgut\crate-app')

FIX = {
 '0tc3FafBwylqAzaEYyT6': ('Grimes', 'Genesis'),
 '4MdINErUALDY2ZCgDyEa': ('L Side & Lorna King', 'Unwind'),
 '5GuNqY8cPz1mc5mM7Zgp': ('Juan Gabriel', 'Caray'),
 '6UduaU3mYs1W5GgHqaoR': ('Skin Town', "Slidin'"),
 '7dYlKATl6v6LGroNCezT': ('Grimes', 'Oblivion'),
 '7x5LR6JTTKhMLJxybhvJ': ('plash', 'sona'),
 '8wz1Q7LnqBVHMH4JgyPE': ('Atmosphere', 'The Waitress'),
 'BFdouptm6gjw4pHJ4Fdu': ('Burial', 'Archangel'),
 'BPSjY5faghea5t8R3PY5': ('Toots Hibbert & Willie Nelson', 'Still Is Still Moving to Me'),
 'DHsKJkbd2tFuXteBkoX8': ('Childish Gambino', 'Redbone'),
 'E8wfU8AYRwPhFuE8vqo4': ('Subsonic Eye', 'My iPhone Screen'),
 'EGuB2fB9Pde0WVeCo97v': ('Giraffage & XXYYXX', 'Even Though'),
 'FVnsnU0RFRdllRzyMqaI': ("Lil' Kim", 'Wait a Minute'),
 'FiHnlucSkqsViGD8fTJS': ('Wild Nothing', "This Chain Won't Break"),
 'HDRr3VmXIq0dHZogGkgl': ('Donald Byrd', 'Think Twice'),
 'IKXEo88jbEHzfRzsfPWG': ('fish narc', 'my ceiling'),
 'IkNPvwZOBPxJODgKWey5': ('The Budos Band', 'Overlander'),
 'KNSWh2BgiM5Zzoo3f5Z5': ('Rancid', 'Radio'),
 'KQlEkXeyrDUURa8rss1n': ('MACFLIP', 'Una Ronda Mas'),
 'KkyQDHJ6KxGJgKdONjRD': ('Black Moth Super Rainbow', 'Psychic Love Damage'),
 'LkNX8ypHeoCUhS1eYViL': ('Dreamhouse', 'Jump & Prance'),
 'Mkfja9CJnSvT8XCS3eo4': ('J Roddy Walston and The Business', 'Black Light'),
 'SmiR1yKnMjMHRxM0KUTM': ('Kipp Stone', 'Petrichor'),
 'Uhe095ieV73PEYmi43m1': ('6BLOCC vs DJ MUGGS vs Sick Jacken', 'El Barrio (LA Dubstep Remix)'),
 'WBD3sU6MtLccfEv655iu': ('Throwing Muses', 'Snakeface'),
 'WPYBlkd7fRckoxUFua5D': ('Beliefs', 'Colour Of Your Name'),
 'WzYjB5FMspIAXRSrpkQj': ('Linval Thompson', 'Down Inna Babylon'),
 'XASRs7gcfOLQVa7xTzEU': ('Jagwar Ma', 'O B 1'),
 'XSVCdz9EWteqqZoiS68B': ('Wildhoney', 'Laura'),
 'ZjrD8GraBiH4Cy0rLOYN': ('Lauryn Hill', 'Forgive Them Father'),
 'bX2XMmDUEA6N4w33xomE': ('Santana', 'Samba Pa Ti'),
 'cs77gklk0uPnGzWbqaV5': ('Alabama Shakes', 'Sound & Color'),
 # artist/title are REVERSED in these two -- no regex would catch it
 'eI57fMpmW5gq17ZiIOMN': ('Radiohead', 'Reckoner'),
 'fZGAtgejKodFK1R2shEz': ('Radiohead', 'All I Need'),
 'fIugEJkjcbApFr2QbZTM': ('Pale Blue', 'The Past We Leave Behind'),
 'hexr9KXWAbqylhI4zv3M': ('The Maytals + Prince Buster & Lee Perry', 'Cry Over You + Ghost Dance'),
 'i1eof3CEPmdawrtGHKb2': ('MxPx', 'Set A Fire'),
 'kT9TUspDydhnONlHFlMT': ('Grace Jones', 'Nightclubbing'),
 'mnS0rvBkSDOADpEXsPXo': ('Clive Tanaka y su orquesta', 'Neu Chicago'),
 'n7I8rwQildVTFthGHEUC': ('plash', 'AEA'),
 'oQqdA2wunOs85NrRzesH': ('Wildhoney', 'Ceiling Fan'),
 'pCZp37FmHwehRCitif73': ('War', 'The World Is A Ghetto'),
 'qFWz8U2jBl54KKS4aEze': ('Kermit the Frog', 'Rainbow Connection'),
 'qQUPjeVNmKEHbmIRwhcq': ('Jagwar Ma', 'What Love'),
 'qT9kEvwWyVL7xWrCcWcd': ('Andres Segovia', 'Recuerdos de la Alhambra'),
 'qWpkHend4TZDsaVPTXaE': ('Clinton Fearon', 'Richman Poorman'),
 'qq53LmR5Yjced8uHBEml': ('Sweet', 'I Thought You Wanted To Dance'),
 'tOYwmQYP4Q9580NhNzet': ('DEVO', 'Gut Feeling'),
 'ug2jxrY7UxVvjgEN6fze': ('Wild Nothing', 'Adore'),
 'vQNhCzvskCKaAPX3FVug': ('Walt Barr', "Creepin'"),
 'w1vv7zh9JXBOx1oGqRtV': ('Jaybee & Pixel', "It's Me"),
 'wAqdkJto3crcN2AY60kz': ('No Joy', "A Thorn In Garland's Side"),
 'xN8eBZDk3xBR8f1BGcH7': ('Anika', 'Masters of War'),
 'xdzjhsdyHjX3fCMWmNRw': ('Jennifer Lara', 'Natural Mistic'),
 'yJIGM2qz7i7eSh9Ii3NY': ('Christian Scott aTunde Adjuah', 'Forevergirl'),
}

JUNK_IDS = {
 '5EfXNjUFoc6QbVOuKzGK',  # TEDx talk
 '5x0U9Vs0kJq3FBlo2ukW',  # kids eye exam video
 '9xvVLGq9eNVi0O54OSUo',  # After Hours ASL
 'CKX2lQofhc6s9Pm65cY0',  # YOMYOMF short film
 'Fst7XDRWfVbwkUKks80d',  # Thundercats comparison
 'I99vof87xlwwzqHLdHai',  # Air Horn Sound.AVI
 'MLlXDbpSCY0FaEMO8RS3',  # Castle Beer Bonanza
 'MW0xtJqByL5fa3Aamc5n',  # Arsenal training footage
 'MpT3IJRz4FmAgjpatKbj',  # "Track Breakdown" video
 'Oraz0fuHSsVkbFn1DynE',  # Final Fantasy electone cover
 'XItx2amkgpKlgg4AkIn4',  # Secret Squirrel cartoon intro
 'Xn7ypzLRe0hmjkHYyjhp',  # "studio shoot"
}

# genuinely ambiguous -- no artist recoverable, but plausibly music. Left alone.
LEAVE_IDS = {
 'KXPNmB0IoUtvswzYUaJq',  # Assembly (feat Maddy Fox)
 'Mjin00XRnNevheF0N6Fm',  # GNX
 'OTBVIoiquPqdZaQr52Pk',  # trust me
 'U4bcMnDtwNsSi0ijlVLh',  # COME ON, LET'S GO
 'eUgeD5LGts1O3OVABkMK',  # SUGAR ON MY TONGUE
 'ejXeB6O50qJspQiPGZxu',  # Manticore
}

src = {t['id']: t for t in
       json.load(open(APP / 'unknown-artists.json', encoding='utf-8'))}

fixes = []
for did, (a, ti) in FIX.items():
    if did not in src:
        continue
    upd = {'artist': a}
    if ti and ti != src[did].get('title'):
        upd['title'] = ti
    fixes.append({'id': did, 'was': src[did].get('title', ''),
                  'update': upd, 'src': 'curated'})

junk = [src[i] for i in JUNK_IDS if i in src]
leave = [src[i] for i in LEAVE_IDS if i in src]

json.dump(fixes, open(APP / 'unknown-fix.json', 'w', encoding='utf-8'),
          ensure_ascii=False, indent=1)
json.dump(junk, open(APP / 'unknown-junk.json', 'w', encoding='utf-8'),
          ensure_ascii=False, indent=1)

print(f'total unknown : {len(src)}')
print(f'  FIX         : {len(fixes)}')
print(f'  JUNK        : {len(junk)}')
print(f'  LEAVE as-is : {len(leave)}')
missing = set(src) - set(FIX) - JUNK_IDS - LEAVE_IDS
print(f'  unaccounted : {len(missing)}')
for m in missing:
    print(f'      {src[m].get("title","")[:60]}')
print('\n--- JUNK (for deletion) ---')
for j in junk:
    print(f'  {j.get("title","")[:66]}')
print('\n--- LEFT ALONE (ambiguous, still Unknown) ---')
for l in leave:
    print(f'  {l.get("title","")[:66]}')
