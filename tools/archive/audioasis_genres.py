# -*- coding: utf-8 -*-
"""Genre map for audioasis (KEXP's PNW local-music show). DEFAULT = Rock.

This crate is overwhelmingly Pacific Northwest indie/grunge/punk, so Rock is
right for the long tail of local bands. Only the identifiable non-Rock acts
are listed here."""

HIPHOP = """
travis thompson|oblé reed|sol|stas thee boss|raz simone|kimmortal|knife knights|da qween|huey and the inflowentials|tezatalks
shabazz palaces|porter ray|nacho picasso|dave b|sam lachow|grynch|jarv dee|thaddeus david|romaro franceswa|blue scholars
gifted gab|lady krishna|guayaba|dj topspin|parisalexa|otieno terry|jusmoni|the physics|fresh espresso|theoretics
"""

RNB_SOUL = """
maktub|whitney mongé|chanti darling|medejin|jayomi|mirrorgloss|stephanie anne johnson|stephanie anne johnson and the hidogs|grace love|the true loves
ayron jones|carrie akre|shaggy sweet|allen stone|choklate|shaprece|sassyblack|thee sacred souls|black stax|industrial revelation
"""

ELECTRONIC = """
yung bae|yu su|akasha system|casiotone for the painfully alone|dub narcotic sound system|sushi robo|freak heat waves|left at london|terror/cactus|beverly crusher
odesza|chong the nomad|manatee commune|kid smpl|natasha kmeto|katie kate|erik blood|pretty gritty|vox mod|supercoze
electric nono|mirror ferrari|slang|spyglass|livt|amsellem|asahi|illvester|jupiter sprites|hypatia lake
"""

JAZZ = """
high pulp|quincy jones|barrett martin group|industrial revelation|jovino santos neto|thomas marriott|d'vonne lewis|kassa overall|marina albero|delvon lamarr organ trio
"""

COUNTRY_FOLK = """
laura veirs|rosie thomas|dear nora|blitzen trapper|fruition|sarah dougher|shana cleveland|damien jurado|david bazan|kris orlowski
the cave singers|the moondoggies|hey marseilles|noah gundersen|zoe muth|the maldives|star anna|brandi carlile|jesse sykes|tomo nakayama
"""

METAL = """
melvins|red fang|skin yard|bam bam|final body|helms alee|black breath|tad|earth
"""

CLASSICAL = """
"""

DEFAULT = 'Rock'


def _parse(b):
    out = set()
    for line in b.strip().splitlines():
        for n in line.split('|'):
            n = n.strip().lower()
            if n:
                out.add(n)
    return out


GENRE_SETS = [
    ('Hip-Hop',        _parse(HIPHOP)),
    ('R&B & Soul',     _parse(RNB_SOUL)),
    ('Electronic',     _parse(ELECTRONIC)),
    ('Jazz',           _parse(JAZZ)),
    ('Country & Folk', _parse(COUNTRY_FOLK)),
    ('Metal',          _parse(METAL)),
    ('Classical',      _parse(CLASSICAL)),
]

AUDIOASIS_GENRE = {}
for g, names in GENRE_SETS:
    for n in names:
        AUDIOASIS_GENRE.setdefault(n, g)
