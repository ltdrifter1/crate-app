# PlanetMP3 — Mobile UX Audit, round 2

**Date:** 21 September 2026  
**HEAD:** mobile UX upgrades `#265` on `cursor/mobile-ux-upgrades-d27a`  
**Scope:** layout, hierarchy, navigation, usability, intuitiveness after the five P0 upgrades. Not performance.  
**Method:** 390×844 inspection of `#broadcast-preview`, `#explore-preview`, `#player-preview`, `#chat-preview`, plus the live IA in source.  
**Question:** *Would a new user immediately understand what to do here?*

Round 1 scored **61**. P0 shipped: one player, Channel Surfing on the fold, Tabs-only More, labeled Find, Pace taught in the deck.

---

## 1. Overall Score — **73 / 100**

The phone chrome is now a music device: Find is a field, More is overflow, the mini does not grow a second deck, and Channel Surfing clears the tabs. A first-time listener can start music *and* map Home / Explore / Library / Club.

What still fails is **the first browse object** and **crate literacy**. Home has no visible title — More + Find sit on an untitled steel bar. Channel tiles are Game Icon plates, so the first shelf does not look like records. Explore’s four modes are 10px firmware tabs with poetry lines. Mix A/B pads are unlabeled DJ homework. In radio, shuffle/repeat vanish and ⋯ still opens a second Volume.

**Band: Improve.** Do not restyle the player. Teach the crate in place.

---

## 2. Scorecard

Weighted = `(score / 10) × weight`.

| Category | /10 | Weight | Weighted | Round 1 | Now | Still broken |
|---|---:|---:|---:|---:|---|---|
| **Layout & Hierarchy** | 7.5 | 20 | 15.0 | 6.0 | Hero + full Channel row on the fold. Tonight demoted. | Home untitled. Channel art is pictograms, not sleeves. |
| **Navigation** | 7.5 | 20 | 15.0 | 5.5 | Four tabs. More = Charts + Build a set. Find → Search. | More sits where a mark should be. Search dock-highlights Explore (correct) but Home loses identity. |
| **Intuitiveness** | 6.5 | 20 | 13.0 | 5.0 | Pace = Next picks. 3-step tour. BPM/key on rows. | Worlds / Energy / Mix still speak in slogans. A/B is unexplained. Radio hides shuffle with no LCD line. |
| **Player UX** | 8.0 | 15 | 12.0 | 7.5 | Mini tap → immersive. One Slow–Fast. | ⋯ duplicates Volume. Radio gap where shuffle was. |
| **Discovery & Browsing** | 7.0 | 10 | 7.0 | 6.5 | Folder prints BPM/key. Search empty = keys + genres. | First Home shelf is icons. Mix dark pads look broken. Explore tabs are 10px / 40px. |
| **Interaction Design** | 7.0 | 5 | 3.5 | 6.0 | Header Find/More 44px. Drawer covers dock. | Mix A/B is 28px. Library + is 36px. Vibe blurbs still one-line ellipsis. |
| **Visual Consistency** | 7.0 | 5 | 3.5 | 6.5 | One steel OS. Mini is compact, not a second deck. | Mini is still a streaming pill. Channel plates vs Explore sleeves. |
| **PlanetMP3 Identity** | 8.0 | 5 | 4.0 | 8.0 | LCD, `.MP3`, Club card. | Home lost ON AIR when the header became More + Find. |

**Total: 73.0 → 73 / 100**

---

## 3. What round 1 actually fixed

1. One listening object (hero / collapsed mini / immersive).
2. Channel Surfing fully above the dock on 390×844.
3. Faceplate gone. More = Charts + Build a set.
4. Find is labeled and opens Search (Camelot + genres). Back returns Home.
5. Next picks + first-run hint + BPM/key on lists. Tour is three beats.

Club already lands on the membership card. Production Home does not mount station chat (intentional). Those P1s are done or withdrawn.

---

## 4. Top remaining problems

1. **Home has no place.** More + Find, no ON AIR / Planet mark. The untitled screen is still the second impression after login.
2. **Channel Surfing looks like a game, Explore looks like a crate.** `channelCoverUrls` already prefers catalog sleeves; the tile still paints `/channels/*.png`.
3. **Explore mode tabs are 10px uppercase / 40px tall.** Energy, Sleeves, Mix are easy to miss. Hint lines are poems.
4. **Mix A/B has no legend.** “Twelve keys. Neighbors mix.” does not say minor/major. Dark pads look empty-broken. Hit target is 28px.
5. **Radio hides shuffle/repeat** with a hole in the deck. ⋯ still contains Volume, which is already on the faceplate.

---

## 5. P0 this round (five changes)

1. **Home identity** — compact ON AIR mark on the left; Find stays the field; More moves to the right. No 98.3, no Faceplate.
2. **Channel tiles sleeve-first** — one catalog sleeve as the art; CH-xx stays a corner bug; PS1 plate only if there is no sleeve. One tile, not a mosaic.
3. **Explore tabs you can hit** — 13px, 44px, sentence-case labels. One hint sentence from `EXPLORE_MODES` (already written: Cities and scenes / Rooms by pressure / Albums as objects / Keys that blend).
4. **Mix legend in the grid** — “A / B = minor / major. Neighbors mix. Dark = nothing in the crate.” A/B pads 44px.
5. **Radio says why shuffle is gone** — firmware line on the immersive deck: “On air — the station picks next.” Drop Volume from ⋯.

No extra tabs. No Spotify IA. No new visual system.
