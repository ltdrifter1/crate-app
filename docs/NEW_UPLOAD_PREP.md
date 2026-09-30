# New upload prep template (Planet MP3)

Use this when adding tracks so **upload scripts**, **Firestore**, and the **app** (taste, scenes, radio, Build a set) all see the same data.

**User-facing taste:** only the **11 genres** (onboarding / Your genres).  
**Background:** store a **specific culture label** in the `genre` column when you can (Techno, UK Garage, Soul, Drum and Bass, etc.) — the app maps it to the 11 and infers **scenes** for browse and display.

---

## 1. Copy the CSV template

```bash
cp tracks.template.csv tracks.csv
```

(`tracks.csv` is gitignored; keep your working copy local.)

**Required columns for `node upload-tracks.js`:**

| Column | Required | Source / rules |
|--------|----------|----------------|
| `title` | Yes | Clean track name only — no `(Official Video)`, `Lyrics`, `4K`, leading `01 -`, or `AUDIO:` prefix. |
| `artist` | Yes | Display artist; not `Unknown`. If the file is `Artist - Title.mp3`, split into columns (don’t leave artist empty). |
| `album` | No | Album or EP name; helps catalog pages and copy. |
| `genre` | Strongly recommended | **Micro-genre / store label** (see §3). Blank = weak browse + scene inference. |
| `energy` | Recommended | Integer **1–10** (Mixed In Key energy, or your estimate). Default in app is 5 if missing. |
| `camelot` | Recommended | Mixed In Key **Camelot** key: `1A`–`12B` (letter A or B, no spaces). Powers harmonic mixes. |
| `bpm` | Recommended | Integer BPM from Mixed In Key. Powers scene inference (e.g. DnB/jungle band). |
| `audioFile` | Yes | Filename only, must exist under `audio/` (e.g. `artist-title.mp3`). |
| `coverFile` | No | Filename under `covers/` (jpg/png/webp). Upload script can skip if missing. |
| `color` | No | Hex fallback for tiles without art (e.g. `#8899aa`). |

**Auto-filled on upload (don’t put in CSV unless you know better):**

- `duration` — read from MP3 in `upload-tracks.js`
- `audioUrl` / `albumCover` — Firebase Storage URLs after upload

**Admin CSV (export/import in app)** uses the same fields plus:

`id`, `audioUrl`, `albumCover`, `duration` — use **Export CSV → edit → Import** for renames and metadata fixes on **existing** rows (match by `id` first).

---

## 2. Mixed In Key → your columns

Typical MIK / playlist export mapping:

| Mixed In Key (or export) | `tracks.csv` column | Notes |
|--------------------------|---------------------|--------|
| Track name | `title` | Run through cleanup rules in §4 |
| Artist | `artist` | |
| Album | `album` | |
| Genre (MIK) | `genre` | Often coarse; prefer your **culture label** (§3) |
| BPM | `bpm` | Integer |
| Key (Camelot) | `camelot` | Must be like `8A`, `12B` — not `Am` unless you convert |
| Energy | `energy` | MIK 1–10 maps directly |

If MIK only gives musical key (e.g. `F# minor`), convert to Camelot before import or leave `camelot` blank (mixes stay permissive).

---

## 3. Genre: 11 lanes vs background label

### The 11 (user-facing only)

1. Electronic  
2. Hip-Hop  
3. R&B & Soul  
4. Pop  
5. Rock  
6. Metal  
7. Jazz  
8. Classical  
9. Country & Folk  
10. Reggae  
11. Latin  

Users never pick “House” or “DnB” in the app — only these.

### What to put in `genre` on each track (background)

Put the **most specific honest label** you have. Scripts and `normalizeGenre` collapse to the 11; **scenes** use the string + BPM/energy.

| You store (examples) | Maps to (taste lane) | Scene / UX benefit |
|----------------------|----------------------|--------------------|
| Techno, House, UK Garage, Deep House, DnB, Drum and Bass, Ambient, Amapiano | Electronic | Techno, UK Garage, DnB scenes |
| Rap, Trap, Grime | Hip-Hop | |
| Soul, R&B, Funk, Neo-Soul | R&B & Soul | Soul / R&B / Funk scenes |
| Afrobeats, K-Pop, Synth-pop | Pop | |
| Indie Rock, Punk, Alternative | Rock | |
| Metal, Doom | Metal | |
| Jazz, Blues | Jazz | |
| Classical, Soundtrack | Classical | |
| Country, Folk, Americana | Country & Folk | |
| Reggae, Dancehall, Dub | Reggae | |
| Salsa, Latin, Reggaeton | Latin | |

**Avoid** vague `World`, `Other`, or empty genre if you can infer better from MIK, Discogs, or listening.

Canonical rules live in: `src/lib/genre-normalize.shared.cjs` (same table as the app).

---

## 4. Naming cleanup (before upload)

Apply these to **title**, **artist**, and **audio filenames**:

- Strip leading track numbers: `01.`, `02 -`, `3)`
- Remove: `Official Video`, `Official Audio`, `Lyrics`, `Visualizer`, `4K`, `HD`, `Free Download`
- Remove `AUDIO:` prefix
- Prefer **Title Case** or consistent casing; no double spaces
- **Filename convention:** `slug-artist-slug-title.mp3` (lowercase, hyphens) — must match `audioFile` column exactly
- If artist was embedded in title (`Artist - Title`), split into two columns

After bulk upload, optional Firestore pass:

```bash
node clean-titles.js           # → titles-review.csv
node clean-titles.js --apply
```

---

## 5. Energy guidelines (if MIK didn’t give one)

| Feel | energy |
|------|--------|
| Ambient / very slow | 1–3 |
| Chill / morning | 3–5 |
| Mid / groove | 5–7 |
| Peak / club | 7–9 |
| Hard / relentless | 9–10 |

Tracks **over 900s** are treated as long mixes and excluded from many radio/browse pools — note in filename or keep as intentional DJ tools.

---

## 6. Pipeline (what runs on your data)

| Step | Command | What it uses from CSV / Firestore |
|------|---------|-----------------------------------|
| 1. Prep rows | (you / agent) | `tracks.template.csv` → `tracks.csv` + `audio/` + `covers/` |
| 2. Bulk upload | `node upload-tracks.js` | title, artist, album, **genre** (normalized to 11 on write), energy, camelot, bpm, files, color; sets duration + URLs |
| 3. Genre audit | `npm run catalog:normalize-genres` | Re-map any legacy `genre` strings to 11 (`--apply` to write) |
| 4. Title audit | `node clean-titles.js` | title / artist only |
| 5. Gap-fill genres | `python fix_genres.py` | Reads `tracks.csv` + APIs; writes Firestore — outputs should land in 11 via `to_canonical()` |
| 6. Missing covers | `python find_missing_covers.py` | `tracks.csv` `coverFile` column |
| 7. Playlist builder | `python build-crate-from-playlist.py` | Builds `audio/`, `covers/`, starter `tracks.csv` from M3U (you still add MIK bpm/key/energy) |
| 8. Admin tweak | App → Admin → Import CSV | Full metadata including `id` for safe renames |

**Minimum for “fully considered” in the app:**

- `title`, `artist`, `audioFile` (+ file on disk)  
- `genre` (culture label)  
- `bpm`, `camelot`, `energy` from MIK when possible  
- `coverFile` or accept placeholder art  

---

## 7. Agent / handoff checklist

When prepping a batch for me (or for yourself), deliver:

- [ ] `tracks.csv` from template, one row per new track  
- [ ] `audio/` files named exactly as `audioFile`  
- [ ] `covers/` when available  
- [ ] MIK: BPM, Camelot key, energy filled per row  
- [ ] Genre: specific background label, not only “Electronic” unless unknown  
- [ ] Channel Surfing wave tag in `batch` when uploading for a dial (e.g. `audioasis-wave-1`, `metal-wave-1`, `punk-wave-1`, `country-folk-wave-1`) — see `docs/CHANNEL_SURFING.md`  
- [ ] Titles/artists cleaned per §4  
- [ ] Note any rows &gt; 15 min (mixes) intentionally  

After prep:

```bash
node upload-tracks.js
npm run catalog:normalize-genres    # dry-run; add :apply if anything to fix
```

---

## 8. Example row (filled)

```csv
title,artist,album,genre,energy,camelot,bpm,audioFile,coverFile,color
"Glue","Bicep","Bicep","Techno",8,4A,128,bicep-glue.mp3,bicep-glue.jpg,#6a7a8a
```

- Taste lane: **Electronic**  
- Scene label in UI: likely **Techno** (from genre + BPM)  
- Radio: uses energy + camelot + your 11-genre prefs  

---

## Reference

- Alias table: `src/lib/genre-normalize.shared.cjs`  
- Scene inference: `src/lib/scenes.js`  
- Upload script: `upload-tracks.js`  
- Template file: `tracks.template.csv`  
