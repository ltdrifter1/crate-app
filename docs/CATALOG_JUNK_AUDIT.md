# Catalog junk / long-track audit

Planet MP3’s `tracks` collection is publicly readable. The audit script **lists** junk and very-long files. Apply is a **separate** script and stays dry-run unless you pass `--apply --approve-deletes` with admin credentials.

## What it flags

See [`docs/audits/catalog-junk-audit.md`](audits/catalog-junk-audit.md) for the live counts and examples.

| Reason | Action | Rule |
|---|---|---|
| `NON_MUSIC` | delete | Guides, gameplay, hotel tours, theory videos, nature docs, spoken marketing, lyric-dump files |
| `FULL_ALBUM_DUMP` | delete | “Full album/EP/cassette” (etc.) in the title **and** duration ≥ 10 min |
| `VERY_LONG` | delete | Duration ≥ **20 minutes**, not an obvious DJ mix / continuous set |
| `TEASER` | delete | Title contains “teaser” and duration &lt; 90s |
| `MAYBE_KEEP_MIX` | review | ≥ 20 min **and** DJ-mix / continuous-set language |
| `UNKNOWN_ARTIST` | review | Same Unknown-artist set as `delete-unknown-artists.js` — prefer fixing artist |
| `BROKEN_METADATA` | review | Title `YouTube` / `Music Video`, or “Official Music Video” packed into **artist** |
| `DUPLICATE` | review | Extra copy of the same title+artist |
| `ULTRA_SHORT` | review | Duration &lt; 30s (confirm it is not a real micro-song) |

The app already hides duration &gt; 15 min from artist/album “singles”. This audit’s **delete** cutoff is 20 min so long ambient pieces and KEXP medleys in the 15–20 min band stay unless they also look like a dump or non-music.

## Run (no service account required)

Catalog reads are public (`firestore.rules`: `match /tracks/{id} allow read: if true`).

```bash
npm run catalog:audit-junk
```

Writes:

- `docs/audits/catalog-junk-audit.md`
- `docs/audits/catalog-junk-candidates.csv`

Optional:

```bash
node audit-junk-tracks.js --from-json /path/to/tracks.json
node audit-junk-tracks.js --out-dir docs/audits
```

If REST is blocked, put gitignored `serviceAccountKey.json` in the repo root and re-run; the script uses Admin SDK **read**.

`--apply`, `--delete`, and `--purge` on `audit-junk-tracks.js` exit immediately and do nothing (that script stays dry-run).

## Apply after approval

Deletes **only** `action=delete` rows from `docs/audits/catalog-junk-candidates.csv` that still classify as delete on a live rescan. Review rows (unknown artist, broken metadata, duplicates) stay.

```bash
# dry-run plan (no credentials)
node apply-junk-tracks.js

# apply Firestore deletes + unused Storage objects
# needs gitignored serviceAccountKey.json in repo root
# (Firebase Console → Project Settings → Service Accounts → Generate new private key)
node apply-junk-tracks.js --apply --approve-deletes
# or: npm run catalog:audit-junk:apply
```

`--apply` without `--approve-deletes` is refused. Shared covers used by remaining tracks are not purged.
