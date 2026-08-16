# ROOMS — Product Audit, Experience Vision & Implementation Roadmap

> **Archival / aspirational (2026):** Rooms and Paths are **not** current top-level destinations. Live product IA is **Station Home** (Channel Surfing, live stage, countdown) + Explore / Charts / Library / Club. This document remains the long-form vision reference; foundation libs (`lib/rooms.js`, posters, motion tokens) still power atmosphere elsewhere.

> **Guiding principle:** ROOMS should feel less like software and more like a place people return to—where music is discovered through exploration, collections become personal spaces, and every visit uncovers something worth sharing.

**Document status:** Phase 1–12 complete as strategic specification. Rooms destination UI was prototyped then **retired from nav** in favor of the broadcast station model.

**Current codebase audited:** `crate-app` / Planet MP3 — React 18 CRA, Firebase Auth + Firestore, dual-audio crossfade engine, monolith `App.jsx`.

---

## Executive summary

The existing product is a **strong late-night listening booth** with harmonic radio, energy-aware rooms, sessions, and Hypno similarity. It is **not yet a place people inhabit**.

| Strength | Gap |
|---|---|
| Coherent underground brand & booth metaphor | Rooms are Discover sub-tabs, not destinations |
| Camelot + energy + Aura traits | Recommendations still feel engine-first, story-light |
| Immersive player & floor radio | No artist/album/label worlds; no deep links |
| Quiet editorial UI (list-first, full-bleed heroes) | Library = likes + playlists, not a personal home |
| Pure testable libs (`engine`, `harmony`, `club`) | Monolith UI; no router; social layer absent |

**Transformation thesis (historical):** Keep the booth and floor as the *listening instrument*. Rebuild product gravity around **Rooms** (living destinations), **Home** (personal musical world), and **Discovery through culture** (scenes, stories, relationships).

**Current thesis:** Own the **broadcast station** (Home + channels) and make **Library stacks** first-class (`/stack/:id`) while this Rooms vision stays on ice.

---

# PHASE 1 — Complete Product Audit

Scoring key for Priority: **P0** foundation / **P1** core experience / **P2** differentiation / **P3** polish. Complexity: **S** small · **M** medium · **L** large · **XL** multi-quarter architecture.

---

### 1.1 Visual identity

| | |
|---|---|
| **Current** | Cool PNW slate/fog on charcoal; Syne + DM Sans + IBM Plex Mono; sharp album art; steel accent `#7A91A4`; time-of-day mist gradients. |
| **Problems** | Brand reads as “4AM app,” not a cultural destination named ROOMS. Cool steel can feel clinical vs warm/human. No shared atmosphere language across Rooms. |
| **Strengths** | Distinctive, non-generic streaming look; brand-first floor hero; editorial mono labels; reduced-motion support. |
| **Missed opportunities** | Per-Room atmospheres; paper/vinyl texture; lighting that responds to track color + time; typographic poster moments for Rooms. |
| **Priority** | P0 |
| **Complexity** | M |
| **Impact** | High — first impression defines “place vs app.” |

*Foundation shipped:* warmer charcoal + muted brass accent; `atmosphereGradient()` per Room; brand tokens `BRAND_NAME` / `BRAND_TAGLINE`.

---

### 1.2 Brand personality

| | |
|---|---|
| **Current** | Late-night digger / DJ booth — Peak, Afterhours, Closing, doors sound, On Air. |
| **Problems** | Personality locked to club night; excludes daytime listening, cities, labels, personal collection intimacy. Naming drift: 4AM / crate / verse / ROOMS. |
| **Strengths** | Memorable metaphors (floor, booth, pocket, afterglow). Avoids Spotify clone voice. |
| **Missed opportunities** | Record-shop clerk voice; city scene guides; curator notes; “trusted friend” recommendation copy. |
| **Priority** | P0 |
| **Complexity** | S–M |
| **Impact** | High |

---

### 1.3 Information architecture

| | |
|---|---|
| **Current** | Screens via React state: `home` · `search` · `favorites` (Dig/Saved/Genres/Playlists) · `profile` · `map` · `admin`. No URLs. |
| **Problems** | Discover absorbs Rooms + library; Home = floor radio + charts; cannot deep-link a Room, album, or friend. |
| **Strengths** | Simple mobile mental model; desktop rail + Up Next. |
| **Missed opportunities** | Triad IA: **Rooms / Home / Discover** (+ Search, You). Shareable Room URLs. |
| **Priority** | P0 |
| **Complexity** | L (router + migration) |
| **Impact** | Very high |

*Foundation shipped:* `rooms` screen + bottom/desktop nav entry; `src/lib/rooms.js` destination taxonomy.

---

### 1.4 Navigation

| | |
|---|---|
| **Current** | Mobile: Home / Search / Discover / You. Desktop: icon rail + queue column. |
| **Problems** | Rooms invisible at top level; Search equals peer of Home (utility-first); Map buried desktop-only. |
| **Strengths** | Quiet active indicator; player-aware bottom padding. |
| **Missed opportunities** | Spatial “move between rooms”; Search as overlay; Map as discovery surface inside Rooms. |
| **Priority** | P0 |
| **Complexity** | M |
| **Impact** | High |

---

### 1.5 Search

| | |
|---|---|
| **Current** | Text / artist / Camelot (`e7`) / BPM / genre chips. Flat result list. |
| **Problems** | No entity results (Room, artist, label, album); empty states lack curiosity; no recent/history. |
| **Strengths** | Harmonic query is a digger delight. |
| **Missed opportunities** | Search → Rooms & scenes; “sounds like” bridge to Hypno; crate-dig facets (year, label, energy band). |
| **Priority** | P1 |
| **Complexity** | M |
| **Impact** | High |

---

### 1.6 Discovery

| | |
|---|---|
| **Current** | Dig tab: floor-phase lead, room energy lists, genre shelves, soft “For You” from preferred genres + hour energy. Hypno Vision overlay. |
| **Problems** | Still adjacent to algorithmic feed; no stories, scenes, or human curators; genre remapping collapses UKG/techno into House. |
| **Strengths** | Energy-first Dig; Hypno trait vectors; session/route builder. |
| **Missed opportunities** | Scene maps, sampling lineage, DJ picks, friends’ finds, label family trees, listening journeys. |
| **Priority** | P1 |
| **Complexity** | L |
| **Impact** | Very high (category-defining) |

---

### 1.7 Rooms

| | |
|---|---|
| **Current** | Five club rooms (Warmup/Peak/Dark/Afterhours/Closing) as energy filters inside Discover. |
| **Problems** | Not alive (no presence, conversation, history, identity beyond filter); not browsable as worlds; no people/artist/label/city Rooms. |
| **Strengths** | Correct product intuition: room > playlist; hour-aware floor phase. |
| **Missed opportunities** | Living Rooms ecosystem (see Phase 4). |
| **Priority** | P0 |
| **Complexity** | XL |
| **Impact** | Maximum |

*Foundation shipped:* culture Rooms (Sunday Morning, Warehouse, cities, Rain, etc.), populate/presence stubs, Rooms screen + detail.

---

### 1.8 Library / Personal Home

| | |
|---|---|
| **Current** | Liked tracks + user playlists; Home shows top played + recently saved. |
| **Problems** | Files/folders feeling; no albums, vinyl, wishlist, mood/memory/season collections, rediscovery, journal. |
| **Strengths** | Energy sparkline on saved; playlist add via ⋯ menu. |
| **Missed opportunities** | Record-collection browsing; smart collections; listening memories (see Phase 6). |
| **Priority** | P1 |
| **Complexity** | L |
| **Impact** | High (retention) |

---

### 1.9 Artist & album pages

| | |
|---|---|
| **Current** | Metadata on tracks only — **no pages**. |
| **Problems** | Dead end after curiosity; cannot follow artist/label; no liner notes/credits. |
| **Strengths** | — |
| **Missed opportunities** | Artist Rooms; album as object with credits/samples; label catalogues as worlds. |
| **Priority** | P1 |
| **Complexity** | L |
| **Impact** | High |

---

### 1.10 Player

| | |
|---|---|
| **Current** | Immersive Booth: full-bleed art, Ken-Burns, booth HUD (BPM/key/energy), seek, Hypno, Pocket, session arc, Media Session, A/B crossfade radio. |
| **Problems** | No lyrics/credits/liner; limited gesture language; desktop right panel duplicates rather than deepens. |
| **Strengths** | Best-in-class for this codebase; cinematic and purposeful. |
| **Missed opportunities** | Interactive liner notes; sample history; Room context chip (“Playing in Detroit”). |
| **Priority** | P1 |
| **Complexity** | M |
| **Impact** | High |

---

### 1.11 Queue

| | |
|---|---|
| **Current** | Mobile QueueSheet; desktop Up Next with shuffle/reorder; radio uses engine picks. |
| **Problems** | Queue not tied to Room narrative; empty radio state opaque. |
| **Strengths** | Clear Now / Next; signal labels. |
| **Missed opportunities** | “Path” queues (journeys); collaborative Up Next in social Rooms. |
| **Priority** | P2 |
| **Complexity** | M |
| **Impact** | Medium |

---

### 1.12 Recommendations

| | |
|---|---|
| **Current** | `pickNextTrack` (Camelot, hour energy, preferred genres, Aura, Hypno seed); For You shuffle; Hypno Euclidean traits. |
| **Problems** | Opaque to users (“Floor is choosing”); no story why; collapses scene nuance via genre normalize. |
| **Strengths** | Unusual & musical (not pure collaborative filter); human-state labels (arrival → immersion). |
| **Missed opportunities** | Explainability (“because you lingered in Jazz Cafe”); curator/DJ/friend sources; scene graphs. |
| **Priority** | P1 |
| **Complexity** | L |
| **Impact** | Very high |

---

### 1.13 Profiles

| | |
|---|---|
| **Current** | Private fingerprint: genres, Aura averages, energy dist, skip rate; preferred genres editor. `onboarded: false` unused. |
| **Problems** | Not social; no public taste identity; no onboarding ritual. |
| **Strengths** | Thoughtful listening analytics without vanity metrics spam. |
| **Missed opportunities** | Taste portrait as Room; shareable listening year; “My Room.” |
| **Priority** | P2 |
| **Complexity** | M |
| **Impact** | Medium–High |

---

### 1.14 Community & notifications

| | |
|---|---|
| **Current** | **Absent** (single-user + admin). |
| **Problems** | Product vision is social inhabitation; currently solitary. |
| **Strengths** | Clean slate — can avoid noisy social patterns. |
| **Missed opportunities** | Presence, listening together, notes, local scenes (Phase 7) with quiet UX. |
| **Priority** | P2 |
| **Complexity** | XL |
| **Impact** | High (long-term) |

---

### 1.15 Performance

| | |
|---|---|
| **Current** | Full catalog `getDocs` on mount; dual Audio elements; committed `build/`; CRA bundle. |
| **Problems** | Catalog scale will hurt TTI; monolith re-renders; no virtualization; no offline cache strategy beyond browser. |
| **Strengths** | Simple mental model; crossfade engineered carefully. |
| **Missed opportunities** | Paginated/indexed Firestore; route-based code split; service worker for covers/audio metadata. |
| **Priority** | P1 |
| **Complexity** | L |
| **Impact** | High at scale |

---

### 1.16 Accessibility

| | |
|---|---|
| **Current** | `aria-*` on key controls; focus-visible; reduced-motion; slider roles on seek. |
| **Problems** | Many clickable `div`s; color contrast on faint text; custom range inputs; no skip-to-content; screen-reader Room structure incomplete. |
| **Strengths** | Better than typical music SPA prototypes. |
| **Missed opportunities** | Full keyboard map for Booth; live regions for track changes; WCAG AA audit. |
| **Priority** | P1 |
| **Complexity** | M |
| **Impact** | High (inclusion + quality bar) |

---

### 1.17 Responsiveness

| | |
|---|---|
| **Current** | Breakpoint 900px → mobile shell vs 3-column desktop. |
| **Problems** | Tablet awkward; desktop is “phone column + chrome,” not a spatial place; Rooms not designed for wide editorial layouts yet. |
| **Strengths** | Works on phone; player consistent. |
| **Missed opportunities** | Desktop as gallery of Rooms; multi-pane Room + collection. |
| **Priority** | P1 |
| **Complexity** | M |
| **Impact** | Medium–High |

---

# PHASE 2 — Experience Research

Extract **principles**, not skins.

| Reference | Why it works | Emotional response | ROOMS evolution |
|---|---|---|---|
| **Bandcamp** | Artist-first economy; album as object; supporting feels personal | Trust, patronage, discovery pride | Label/artist Rooms with catalogue as world; “supported” shelf in Home |
| **Discogs** | Data depth + community knowledge; physical collection | Mastery, ownership, archaeology | Vinyl owned / wishlist; credits & versions as liner layer |
| **Letterboxd** | Social taste without feed addiction; diary | Reflection, identity, light social | Music journal; “listened on” memories; friend taste Rooms |
| **Are.na** | Blocks & channels; association over ranking | Curiosity, intellectual play | Community paths connecting artists/labels/genres |
| **Pinterest** | Visual wandering; boards as identity | Serendipity | Mood/season boards as Rooms; image-led browse |
| **Steam** | Store as place; presence; collections; events | Belonging to a platform-world | Living Rooms with presence; release parties |
| **Arc Browser** | Spaces; personality; spatial tabs | Delight, ownership of workspace | Spatial navigation between Rooms |
| **A24 / editorial pubs** | Restraint, craft, poster typography | Prestige, mood | Room posters; editorial blurbs over chips |
| **Independent record shops** | Clerk taste; listening station; front table | Human recommendation | DJ picks, Hidden Gems, staff Rooms |
| **Museum exhibitions** | Path through meaning; pacing | Contemplation | Listening journeys; curated paths |
| **Luxury retail** | Atmosphere, lighting, fewer SKUs | Calm desire | Negative space; fewer louder moments |
| **Notion / Read.cv** | Identity as crafted page | Self-expression | My Room as crafted home |
| **Spotify / Apple** | Utility + scale (cautionary) | Efficiency, numbness | **Anti-pattern for IA** — take playback reliability only |
| **Balming Tiger** | Worldbuilding around music identity | Cultural immersion | Scene Rooms as worlds |

**Principles to steal:** association > ranking · objects with weight (albums) · human explainability · spatial mental models · restraint · diary over dopamine feed · presence without noise.

---

# PHASE 3 — User Journey Audit

| Journey | Friction / dead ends | Missed delight |
|---|---|---|
| **Onboarding** | `onboarded` unused → cold catalog | Ritual: pick 3 Rooms / 5 records that feel like home |
| **Account creation** | Functional email/phone/Google; tagline “House music for late nights” too narrow | Welcome into *your first Room* |
| **Search** | List-only; no entity graph | Land in a Room or artist world |
| **Finding music** | Dig helps; stories absent | “Why this track” liner |
| **Joining Rooms** | Cannot join — rooms are filters | Door animation, presence, history |
| **Creating Rooms** | Only playlists | Create mood/city/event Room with identity |
| **Inviting friends** | Impossible | Quiet invite link to a Room |
| **Saving music** | Heart + playlist | Save to collection / Room / vinyl shelf |
| **Organizing** | Manual playlists only | Smart collections by mood/season/memory |
| **Following artists/labels** | No entities | Follow → their Room evolves |
| **Listening sessions** | Strong (radio, route, afterglow) | Session named as night in a Room |
| **Sharing** | No share URLs | Share Room moment / path |
| **New releases** | Weak (playCount heuristics) | New This Week Room + release parties |
| **Returning daily** | Floor phase changes — good seed | Daily door: what changed in your Rooms |

---

# PHASE 4 — Rooms System

## Room types

People · Artists · Labels · Genres · Cities · Countries · Record stores · Radio shows · Festivals · Events · Moods · Weather · Season · Time of day · Years · Decades · Scenes · Movements · Communities

## Living Room anatomy

| Layer | Behavior |
|---|---|
| **Identity** | Name, story, atmosphere gradient/texture, cover from featured track or curator art |
| **Curators** | Owners/hosts who shape the crate |
| **Featured** | Front table — not chronological dump |
| **Activity** | Recent listens, saves, notes (quiet feed) |
| **Presence** | Soft count / avatars; “3 listening” |
| **Conversation** | Community notes on tracks — optional, rate-limited |
| **Recommendations** | “From this Room” with story hooks |
| **History** | What the Room sounded like last weekend |
| **Live events** | Takeovers, listening parties |
| **Ambient environment** | Visual/motion responds to energy + time |

## Aliveness rules

1. Music changes as people listen and curators add.
2. Empty Rooms feel quiet, not broken — invite contribution.
3. Night Rooms (Warmup→Closing) remain the temporal spine.
4. Culture Rooms (cities, moods, scenes) are peer destinations.
5. Every recommendation cites a *source*: Room, friend, DJ, label, path.

---

# PHASE 5 — Music Discovery

Move beyond feeds:

| Mechanism | Story it tells |
|---|---|
| **Scene maps** | “UK Garage sits between House pressure and bass weight” |
| **Artist connections** | Collaborators, featured on, remixed by |
| **Producer networks** | Studio lineages |
| **Sampling lineage** | Who sampled whom — crate archaeology |
| **Label family trees** | Imprints and sister labels |
| **Influences** | Editorial + community edges |
| **Record store picks** | Staff Room rotations |
| **DJ picks** | Trusted human crates |
| **Friends’ discoveries** | Social without infinite scroll |
| **Nearby listeners** | Local scene (privacy-first) |
| **Emerging genres** | Before they flatten into canonical buckets |
| **Hidden gems** | High grip, low fame |
| **Recently rediscovered** | Your own archaeology |
| **Listening journeys** | Curated paths (Are.na-like channels) |

**Copy standard:** never “Because you listened to X.” Prefer “From the Jazz Cafe · rainy Tuesday · picked like a B-side.”

---

# PHASE 6 — Personal Home

Reimagine library as **home**:

- Saved music · Collections · Smart collections  
- Albums · Artists · Recently rediscovered  
- Listening memories · Vinyl collection · Wishlist · Archive  
- Mood / travel / seasonal collections  
- Light analytics · Music journal  

**UX north star:** browsing a curated record wall — spines, covers, handwritten dividers — not a file manager.

**Home IA (proposed):**
1. Hero: *My Room* or continue listening in last Room  
2. Recently lived-in Rooms  
3. Collections wall  
4. Rediscovered  
5. Journal snippet  

---

# PHASE 7 — Social Experience

| Feature | Quiet design rule |
|---|---|
| Friends listening | Opt-in presence; no public activity spam |
| Listening together | Temporary Room with shared Up Next |
| Release parties | Scheduled Room state + host |
| Label takeovers | Time-boxed curator swap |
| Artist Q&A | Attached to Artist Room, archived as notes |
| Community notes | On tracks/albums; downvote noise |
| Collaborative Rooms | Roles: host / member / visitor |
| Local scenes | City Rooms + optional geo |
| Presence indicators | Soft, ambient — not streaks |

**Anti-goals:** infinite social feed, dark-pattern notifications, performative share prompts.

---

# PHASE 8 — Visual System

**Feel:** Editorial · Minimal · Atmospheric · Physical · Warm · Cinematic · Underground · Modern · Timeless · Premium

**Build depth with:** glass (sparingly) · blur · texture · lighting · layering · negative space · large imagery · elegant type · editorial layouts · dynamic composition

**Do not:** purple gradients · cream+terracotta cliché · dashboard cards in hero · pill clusters · multi-layer neon glow · inset hero cards

**Type**
- Display: Syne (keep) — Room titles as posters  
- Body: DM Sans  
- Meta: IBM Plex Mono — BPM, presence, room kind  

**Color (foundation)**  
- Canvas `#0C0B0A` · Ink `#EDE8E1` · Accent brass `#A8926A`  
- Per-Room atmosphere gradients  

**Composition rules**
- One job per section  
- Full-bleed Room heroes  
- Lists over cards for browse  
- Cards only for interactive containers  

---

# PHASE 9 — Motion System

| Surface | Motion intent |
|---|---|
| Navigation | Crossfade / soft rise — no page wipe chaos |
| Room enter | Atmosphere gradient settles; content rises staggered |
| Album art | Slow scale (art duration); opacity on load |
| Player | UI autohide; progress linear; play press scale |
| Queue sheet | Rise from bottom |
| Search | Results rise; no layout jump |
| Hover (desktop) | Color/opacity only — no lift circus |
| Loading | Shimmer tied to accent, not skeleton card farms |
| Ambience | Breathe 6–8s on light washes |
| Now Playing | Track title fade on change |

**Tokens:** `src/motion/tokens.js` — duration, ease, stagger, principles.

---

# PHASE 10 — Design System & Architecture

## Audit

| Area | Current | Recommendation |
|---|---|---|
| Components | Inline in `App.jsx` | Extract `components/{rooms,player,home,ui}` |
| React | CRA 18, hooks only | Keep React 18; consider Vite migrate |
| Next.js | Not used | Evaluate later for SSR/OG Room links; not blocking |
| TypeScript | DevDep only | Gradual TS for `lib/*` then components |
| Tailwind | None | Optional later; tokens-first CSS vars sufficient |
| Routing | State machine | React Router or Remix/Next for shareable Rooms |
| State | Root `useState` | Context slices: player, catalog, rooms, user |
| API | Firestore client reads | Cloud Functions for social/presence; indexes |
| Caching | None | React Query / SWR for catalog; SW for assets |
| Offline | Minimal | Cache metadata + liked; queue offline intents |
| Performance | Full fetch | Virtualize lists; paginate tracks; code-split screens |
| A11y | Partial | Lint + axe CI; keyboard Booth map |
| Scale | Single admin catalog | Multi-tenant Rooms data model |
| DX | Monolith | Storybook for Room hero/player; vitest for libs |

## Proposed data model (sketch)

```
Room { id, kind, title, story, atmosphere, curatorIds, trackIds[], rules, presence }
Collection { id, userId, title, kind, trackIds[], smartRule? }
Path { id, title, nodes: [{type, id, note}] }  // listening journey
Presence { roomId, userId, trackId?, updatedAt }
Note { targetType, targetId, userId, body, createdAt }
```

---

# PHASE 11 — Implementation Roadmap

Effort: **S** ≤3d · **M** ≤2w · **L** ≤6w · **XL** multi-phase. (Agent/team relative, not calendar promises.)

### Phase 1 — Foundation & UX improvements
| Task | Priority | Deps | Effort | Impact | Complexity |
|---|---|---|---|---|---|
| Visual token refresh (warm brass) | P0 | — | S | High | S |
| Motion token module | P0 | — | S | Med | S |
| Rooms taxonomy + populate API | P0 | — | M | High | M |
| Extract RoomsScreen | P0 | taxonomy | M | High | M |
| Fix brand naming consistency | P0 | tokens | S | High | S |
| Empty/error/curiosity copy pass | P1 | — | S | Med | S |

### Phase 2 — Navigation redesign
| Task | Priority | Deps | Effort | Impact | Complexity |
|---|---|---|---|---|---|
| Top-level Rooms tab | P0 | RoomsScreen | S | High | S |
| IA: Rooms / Home / Discover / You | P0 | nav | M | High | M |
| Search as overlay | P1 | nav | M | Med | M |
| React Router + Room URLs | P0 | IA | L | Very high | L |

### Phase 3 — Rooms architecture
| Task | Priority | Deps | Effort | Impact | Complexity |
|---|---|---|---|---|---|
| Firestore `rooms` collection | P0 | router | L | Very high | L |
| Curator roles + create Room | P1 | data model | L | High | L |
| Atmosphere + identity designer | P1 | visual | M | High | M |
| Room history snapshots | P2 | data | M | Med | M |
| Live floor rooms (time) keep engine | P0 | — | S | High | S |

### Phase 4 — Discovery engine
| Task | Priority | Deps | Effort | Impact | Complexity |
|---|---|---|---|---|---|
| Explainable picks UI | P1 | engine | M | High | M |
| Expand genre/scene taxonomy | P1 | genres | L | High | L |
| Paths (listening journeys) | P1 | rooms | L | Very high | L |
| Hypno → “lineage” storytelling | P2 | Hypno | M | High | M |
| Hidden Gems / Rediscovered jobs | P1 | traits | M | High | M |

### Phase 5 — Personal Home
| Task | Priority | Deps | Effort | Impact | Complexity |
|---|---|---|---|---|---|
| Home = collection world | P1 | IA | L | High | L |
| Albums & artists entities | P1 | catalog | L | High | L |
| Smart collections | P1 | home | M | High | M |
| Vinyl / wishlist | P2 | entities | M | Med | M |
| Music journal | P2 | social-lite | M | Med | M |

### Phase 6 — Social layer
| Task | Priority | Deps | Effort | Impact | Complexity |
|---|---|---|---|---|---|
| Presence in Rooms | P2 | rooms data | L | High | L |
| Listening together | P2 | presence | L | High | XL |
| Community notes | P2 | auth | M | Med | M |
| Invites & My Room public | P2 | profiles | M | High | M |

### Phase 7 — Motion & immersion
| Task | Priority | Deps | Effort | Impact | Complexity |
|---|---|---|---|---|---|
| Room enter/exit choreography | P1 | motion tokens | M | High | M |
| Track-change fades everywhere | P1 | player | S | Med | S |
| Ambient environments v2 | P2 | atmospheres | M | High | M |
| Desktop spatial layout | P2 | nav | L | High | L |

### Phase 8 — Performance
| Task | Priority | Deps | Effort | Impact | Complexity |
|---|---|---|---|---|---|
| Catalog pagination / query | P1 | Firebase | L | High | L |
| Code-split screens | P1 | extract comps | M | Med | M |
| Virtualized track lists | P1 | — | M | High | M |
| Cover CDN caching | P2 | hosting | S | Med | S |

### Phase 9 — Accessibility & QA
| Task | Priority | Deps | Effort | Impact | Complexity |
|---|---|---|---|---|---|
| WCAG AA pass | P1 | UI freeze | M | High | M |
| Keyboard Booth map | P1 | player | M | High | M |
| axe CI + visual regression | P1 | CI | M | Med | M |
| Room screen reader structure | P1 | Rooms UI | S | High | S |

### Phase 10 — Polish & launch readiness
| Task | Priority | Deps | Effort | Impact | Complexity |
|---|---|---|---|---|---|
| Onboarding ritual | P0 | Rooms | M | Very high | M |
| OG images for Room URLs | P1 | router | M | High | M |
| Empty catalog / first-run | P0 | — | S | High | S |
| Analytics for Room enter/dwell | P1 | — | M | Med | M |
| Brand launch (ROOMS) | P0 | copy+UI | M | High | M |

---

# PHASE 12 — Future Vision

Ambitious directions that still obey *place > software*:

1. **Living Rooms** — evolve crates from community listening patterns; weekly “what this Room became.”
2. **Spatial interface** — move between Rooms in a continuous atmosphere; menus dissolve into doors.
3. **Interactive liner notes** — credits, interviews, sample graphs inside albums.
4. **Artist-created Rooms** — evolve beside releases; eras as wings of a house.
5. **Label worlds** — catalogues as walkable districts, not discographies.
6. **AI guides with humility** — scene docents that cite sources and leave mystery intact; never opaque “For You.”
7. **Dynamic environments** — respond to music, weather, hour, season (extend `atmosphereGradient` + floor phase).
8. **Community paths** — Are.na-like journeys across artists, labels, movements.

---

## What shipped in this PR (foundation)

| Deliverable | Path |
|---|---|
| Full Phase 1–12 specification | `docs/ROOMS_PRODUCT_VISION.md` |
| Rooms taxonomy + populate/presence API | `src/lib/rooms.js` |
| Unit tests | `src/lib/rooms.test.js` |
| Motion tokens | `src/motion/tokens.js` |
| Warm editorial visual tokens + brand | `src/theme.js` |
| Rooms destination UI | `src/components/rooms/RoomsScreen.jsx` |
| Nav IA: Rooms as primary destination | `src/App.jsx` |

**Non-goals for this PR:** social presence backend, router migration, artist pages, full Home redesign — sequenced in Phase 11.

---

*End of specification. Build places people return to.*
