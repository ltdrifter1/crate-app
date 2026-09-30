"""List audioasis artists I flagged as clearly NOT Pacific Northwest (or not music)
so you can review them before anything is moved onto the Local channel.
Reads ingest/audioasis_artists.txt (count<TAB>artist); writes audioasis_flagged.txt.
"""
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
FLAG = """radiohead|marvin gaye|the clash|the weeknd|ray charles|lauryn hill|journey|ramones|xtc|blondie|
system of a down|queens of the stone age|dave matthews band|devo|swans|neutral milk hotel|interpol|
bad religion|lil peep|de la soul|yo-yo ma|grace jones|sham 69|uk subs|the damned|amy grant|james taylor|
josh ritter|ryan adams|drive-by truckers|the replacements|ice nine kills|motion city soundtrack|fontaines d.c.|
celia cruz|marty robbins|hank snow|bing crosby|the andrews sisters|disney peaceful piano|kenny g|
the pogues|scissor sisters|the undertones|generation x|thee headcoats|stars of the lid|gary numan|
rhett miller|the streets|raye|mahmoud ahmed|mike posner|candlebox|the pretty reckless|the beths|
memphis may fire|four year strong|uncle kracker|lemonheads|the lemonheads|foo fighters|grimes|jayda g|
hot hot heat|crack cloud|the tea party|robyn hitchcock|the delfonics|battles|dj shadow|yacht|caribou|
fka twigs|mylo|front line assembly|die kreuzen|engine kid|big black|trouble|blitz|d.r.i.|triumph|
brainiac|the body|merchandise|protomartyr|the menzingers|propagandhi|rocket from the crypt|hot snakes|
all them witches|james bay|emily king|laila biali|kishi bashi|youth lagoon|charlotte day wilson|
theo croker|robert glasper|sudan archives|little simz|tobe nwigwe|earthgang|dungeon family|tuxedo|
vagabon|soulsavers|lo fidelity allstars|nicholas britell|pegboard nerds|will sparks|wajatta|
eddy current suppression ring|ausmuteants|the chats|angry samoans|swingin utters|chixdiggit|
the exploding hearts|the gotobeds|uranium club|mean jeans|sick of it al|lavender country|
poly styrene|x-ray spex|x ray spex|he gothard sisters|the gothard sisters|sophie tucker|
ian & sylvia|hank snow & chet atkins|maurice jarre|untitled goose game|audiotree|
pink martini|esperanza spalding|bill frisell|the ventures""".replace("\n", "").split("|")
FLAG = {f.strip().lower() for f in FLAG if f.strip()}
NOT_MUSIC = re.compile(
    r"official (music )?video|untitled goose|mapleStory|ap macroeconomics|la fonda hotel|"
    r"nostalgia show|vigil of st|comm\. of st|how to read an architectural|"
    r"entertainment news|nixon in china|dick's live stage|day of the dead arts|"
    r"footsteps \[official|famous painting|silver surfer|tomb raider|black ops|"
    r"^\[|^\(|\bamv\b|1080p|\(hd\)", re.I)

rows = [l.rstrip("\n").split("\t", 1) for l in open(os.path.join(HERE, "audioasis_artists.txt"), encoding="utf-8")]
hits = [(int(c), a) for c, a in rows if a.strip().lower() in FLAG or NOT_MUSIC.search(a)]
hits.sort(reverse=True)
with open(os.path.join(HERE, "audioasis_flagged.txt"), "w", encoding="utf-8") as fh:
    fh.write("\n".join(f"{c}\t{a}" for c, a in hits))
print(f"{len(hits)} flagged artists, {sum(c for c, _ in hits)} tracks of {sum(int(c) for c, _ in rows)}")
