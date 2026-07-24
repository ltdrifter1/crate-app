# V Music / Crate

Intentional listening for diggers, DJs, collectors, and everyday listeners.
Harmonic (Camelot) mixing, energy-aware radio, sessions, and a quiet modern UI.

## Stack

- React 18 (Create React App)
- Firebase Auth, Firestore, Cloud Storage, Hosting

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

## Security rules

```bash
firebase deploy --only firestore:rules,storage
```

Rules live in `firestore.rules` and `storage.rules`.

## Ingest

1. Place audio in `audio/` and covers in `covers/` (gitignored).
2. Build `tracks.csv` (see `build-crate-from-playlist.py`).
3. Put `serviceAccountKey.json` in the repo root (gitignored).
4. Run `node upload-tracks.js`.

Genre enrichment: set `DISCOGS_TOKEN` / `LASTFM_KEY` then `python fix_genres.py`.

## Notes

- Admin UI is limited to the configured admin UID (see `src/theme.js` + rules).
- Prefer small, safe changes; keep playback working after every commit.


## Cloudflare Pages

Preview/production deploys use the Cloudflare Git integration.

**Current setup:** the `build/` folder is committed so Pages can deploy
with an empty build command (output directory = `build`).

**Recommended (optional):** in the Cloudflare dashboard set:

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Build output directory | `build` |
| Node version | `22` (or match `.nvmrc`) |
| Environment variable | `CI=false` (avoids CRA treating warnings as errors) |

After that, you can stop committing `build/` and add it back to `.gitignore`.
