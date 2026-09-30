# -*- coding: utf-8 -*-
"""Genre map for the PromB crate. DEFAULT = Hip-Hop (largest single class here).
Same folding as the other crates: reggae/funk/disco/afrobeat -> R&B & Soul,
Latin/reggaeton -> Hip-Hop, corridos -> Country & Folk."""

RNB_SOUL = """
burna boy|black pumas|daryl hall & john oates|debarge|donny hathaway|joe bataan|melvin bliss|rick james|the o'jays|alexander o'neal
amp fiddler|assagai|ayra starr|aziza jaye & nubiyan twist|b.j. the chicago kid|bj the chicago kid|betty davis|betty mabry|boney m.|brittany davis
caron wheeler|cautious clay|claudine magbag|day soul exquisite|dominique fils-aimé|eddie chacon|edwin starr|en vogue|erma franklin|eugene wilde
fela kuti|africa 70 & fela kuti|force m.d.'s|george mccrae|goapele|gordon voidwell|gregory abbott|groove theory|h.e.r., yg|hirie
jai paul|jamiroquai|jazzyfatnastees|jocelyn enriquez|jordan knight|jordan mackampa|judy clay & william bell|labelle|labi siffre|lionel richie
luther vandross|madeline bell|mahalia|maxwell|mikey dread|minnie riperton|one vo1ce|parisalexa|patrice rushen|pheelz & bnxn
ponderosa twins plus one|rare soul 45|roberta flack|roberta flack & donny hathaway|ruby wood|sananda maitreya|saturday love|sexual healing|shaggy|shanice
soul ii soul|soul ii soul & caron wheeler|soul swingers|teddy pendergrass|the bamboos|the brand new heavies|the foreign exchange|the honey drippers|the impressions|the jets
the neville brothers|the pacifics|three degrees|ub40|vst & co.|zapp & roger|serpentwithfeet|victony|gims|gigolette
dnh drop'n harmony|sun rai|tammi lynn|kuh ledesma|sharon cuneta|fiji|israel kamakawiwo'ole|kalapana|ka'ikena scanlan|don ho
craig david|tom jones|hikaru utada|vulfpeck|hold yuh (lyrics)|glendal tautua|tabi bonney|caron wheeler|starrah|goapele
"""

JAZZ = """
duke ellington|doc severinsen|galt macdermot|jimmy mcgriff|lonnie liston smith|jon batiste|sheila landis|yussef dayes|ncy milky band|bebel gilberto
bong peñera|ryan cayabyab|barbra streisand|engelbert humperdinck|a love supreme, part 1: acknowledgement
"""

ROCK = """
arctic monkeys|metric|mitski|the 1975|beabadoobee|beabadoobee & laufey|bloc party|bombay bicycle club|camper van beethoven|cat power
coldplay|david bowie|death cab for cutie|descendents|dengue fever|electric six|emma anderson|english teacher|eraserheads|faith no more
fiona apple|frank zappa|frente!|from monument to masses|glenn frey|jeff buckley|jefferson airplane|jimi hendrix|journey|l7
led zeppelin|linkin park|living colour|looking glass|men i trust|new radicals|orions belte|pablo cruise|player|reo speedwagon
rare earth|robbie dupree|roger waters|sparklehorse|sumo|teke::teke|tv girl|temple of the dog|the bug club|the doobie brothers
the free design|the jesus and mary chain|the last dinner party|the romantics|the young rascals|they might be giants|toto|vagabon|vanishing twin|viji
ween|white poppy|bar italia|la sécurité|tomo nakayama|julie plug|please|børns|dominic fike|kevin abstract
maggie rogers|band of horses|corey hart|culture club|rupert holmes|kenny loggins|peter gabriel & kate bush|manu chao|olivia rodrigo|chai
sky hunters, the world of the dragonfly|just ask the flowers|pinder|thunder and lightning|robbie robb|anton glamb|angélica garcia|bic runga|gabe bondoc|yasuhiro abe
tommy guerrero|buffy|the colors mongolia|she only likes me when i'm drunk|2/2 becca mancari w/ april lee|hollis|kiwi|sumo|mgmt|roman reigns
"""

ELECTRONIC = """
actress|braxe + falcon, dj falcon & alan braxe|bella boo|chromeo|chong the nomad|giorgio moroder|jayda g|kasbo|lorn|viken arman
yaeji|somedeadbeat & barry can't swim|art of noise|baltimora|the human league|limahl|laura branigan|jean-jacques perrey|caroline polachek|pinkpantheress
eurythmics|bruno belissimo|kai|framework|high prime|muddat|hardwe're|question mark|pumpkin|talilo
"""

COUNTRY_FOLK = """
gordon lightfoot|tracy chapman|allison russell|hurray for the riff raff|elisapie|vera sola|madi diaz|jordan mackampa
"""

METAL = """
"""

CLASSICAL = """
"""

# everything not listed falls through to Hip-Hop
DEFAULT = 'Hip-Hop'


def _parse(b):
    out = set()
    for line in b.strip().splitlines():
        for n in line.split('|'):
            n = n.strip().lower()
            if n:
                out.add(n)
    return out


GENRE_SETS = [
    ('R&B & Soul',     _parse(RNB_SOUL)),
    ('Jazz',           _parse(JAZZ)),
    ('Rock',           _parse(ROCK)),
    ('Electronic',     _parse(ELECTRONIC)),
    ('Country & Folk', _parse(COUNTRY_FOLK)),
    ('Metal',          _parse(METAL)),
    ('Classical',      _parse(CLASSICAL)),
]

PROMB_GENRE = {}
for g, names in GENRE_SETS:
    for n in names:
        PROMB_GENRE.setdefault(n, g)
