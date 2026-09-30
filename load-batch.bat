@echo off
REM Usage: load-batch.bat "E:\path\to\music folder" country-folk-wave-1 Country
REM Run from the crate-app repo root (needs serviceAccountKey.json here).
if "%~1"=="" (echo Usage: load-batch.bat "music folder" batch-tag [default-genre] & exit /b 1)
set OUT=%USERPROFILE%\Documents\crate-batch
pip install -q mutagen pillow requests || exit /b 1
python build-crate-from-playlist.py --source "%~1" --batch %2 --default-genre %3 --out "%OUT%" || exit /b 1
if exist audio rmdir /s /q audio
if exist covers rmdir /s /q covers
xcopy /e /i /q "%OUT%\audio" audio
xcopy /e /i /q "%OUT%\covers" covers
copy /y "%OUT%\tracks.csv" tracks.csv
call npm install --silent
node upload-tracks.js || exit /b 1
call npm run catalog:normalize-genres
call npm run catalog:audit-junk
echo Done. Review genres-review.csv and docs\audits before applying anything.
