# Planet MP3

Music you inhabit.

**Tagline:** YOUR WORLD, YOUR MUSIC.

Living destinations for discovering, collecting, and experiencing music — not another streaming feed.

**Product vision & full audit:** [`docs/ROOMS_PRODUCT_VISION.md`](docs/ROOMS_PRODUCT_VISION.md)

Legacy listening core (harmonic radio, sessions, Hypno, floor phases) remains; Rooms are becoming first-class destinations.

## Stack

- React 18 (Create React App)
- Firebase Auth, Firestore, Cloud Storage, Hosting
- Cloudflare Pages (serves committed `build/` today)

## Setup

```bash
nvm use   # see .nvmrc
npm install
npm start
```

Copy `.env.example` for local ingest scripts. Never commit API keys or `serviceAccountKey.json`.

## Scripts

| Command | Purpose |
|---|---|
| `npm start` | Dev server |
| `npm test` | Unit tests |
| `npm run build` | Production build |
| `node upload-tracks.js` | Bulk add audio → Storage + Firestore (deduped) |
| `node clean-titles.js` | Dry-run title/artist cleanup → `titles-review.csv` |
| `node clean-titles.js --apply` | Write cleaned titles/artists to Firestore |

---

## What you need (checklist)

### A. Deferred Firebase security rules (still outstanding)

Rules are in the repo but **must be deployed from your machine** (needs your Firebase login):

```bash
npm i -g firebase-tools   # once
firebase login
firebase use              # should show crate-app-58494 from .firebaserc
firebase deploy --only firestore:rules,storage
```

Files: `firestore.rules`, `storage.rules`, `firebase.json`.

Until this runs, Console rules may still be looser/outdated than the repo.

### A note on rules

If you already ran `firebase deploy --only firestore:rules,storage` successfully, you can skip section A.

### B. Clean messy track names

**Option 1 — Admin CSV (best for hand edits)**  
1. Sign in as admin → Admin → Audit → **Export CSV**  
2. Keep the `id` column  
3. Fix `title` / `artist` in Sheets  
4. **Import CSV** (matches by **id** first so renames stick)

**Option 2 — Auto cleanup script**  
1. Put `serviceAccountKey.json` in repo root (gitignored)  
2. `node clean-titles.js` → review `titles-review.csv`  
3. `node clean-titles.js --apply`

### C. Normalize genres (canonical set only)

Only these genres are shown in the app:

`Rock, R&B, Country, Hip-Hop, House, Drum and Bass, Soul, Jazz, Classical, Metal`

```bash
cd ~/crate-app
node normalize-genres.js          # writes genres-review.csv
node normalize-genres.js --apply  # updates Firestore
```

Legacy labels (Techno, Ambient, Funk, etc.) are remapped; unknown genres are cleared.

### D. Add a lot more tracks

1. Build an M3U playlist of new tracks  
2. Edit paths in `build-crate-from-playlist.py` if needed, then run it → fills `audio/`, `covers/`, `tracks.csv`  
3. `serviceAccountKey.json` in repo root  
4. `node upload-tracks.js` — **skips duplicates** (by title+artist, audio filename, or existing Storage object)  
5. Optional: `DISCOGS_TOKEN` / `LASTFM_KEY` then `python fix_genres.py`  
6. Optional: `python find_missing_covers.py`

### Files you must have locally (never commit)

| File | From |
|---|---|
| `serviceAccountKey.json` | Firebase Console → Project Settings → Service Accounts → Generate new private key |
| `audio/` + `covers/` | Your library / playlist builder |
| `tracks.csv` | Playlist builder or hand-written |
| `.env` | Copy `.env.example` for Discogs/Last.fm |

---

## Security rules

```bash
firebase deploy --only firestore:rules,storage
```

## Notes

- Admin UI is limited to the configured admin UID (`src/theme.js` + rules).
- Admin **Add Track** in the UI does not upload audio — use `upload-tracks.js` for real adds.
- Prefer small, safe changes; keep playback working after every commit.

## Cloudflare Pages

**Current setup:** `build/` is committed so Pages can deploy with an empty build command.

**Recommended (optional):** set Build command `npm run build`, output `build`, Node 22, `CI=false`, then stop committing `build/`.
