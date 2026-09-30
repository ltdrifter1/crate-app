# Ingest (crate uploader)

Double-click `Crate Uploader.bat` in the repo root. Pick a folder, pick a channel, click Go.

1. `ingest/prep.py` reads tags/genres/covers into `ingest/runs/<time>/manifest.json`. Nothing is copied; your originals are never edited.
2. `ingest/run.js plan` dedupes against Firebase, excludes junk, and uses the app's own channel code to show where each track will play. Nothing uploads until you confirm.
3. `ingest/run.js upload` uploads from the source paths, writes `batch` (what the app reads) and `uploadBatch`, then re-reads every track and checks its audio URL.

Every run leaves `plan.json`, `excluded.csv` (junk/dupes, nothing deleted) and `result.json` in its run folder.

## Keeping channels in sync
`ingest/app-lib/` is a copy of the app's channel logic. When the app's channels change:

    git fetch origin
    python ingest/sync_app_lib.py

## One-off
Older uploads only have `uploadBatch`; the app reads `batch`.

    node ingest/backfill-batch.js          # dry run
    node ingest/backfill-batch.js --apply  # write

Old per-crate scripts live in `tools/archive/`. `tools/` keeps the audit and art-fetch tools.
