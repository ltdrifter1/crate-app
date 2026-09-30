# Rename Google Sign-In from `crate-app-58494` → PlanetMP3

The Google account picker / consent screen shows the **OAuth consent screen app name** from Google Cloud — not a string from this repo. The Firebase project ID (`crate-app-58494` in `src/firebase.js`) must stay as-is; renaming it would break Auth, Firestore, and Storage.

## Fix (one-time, in Google Cloud Console)

1. Open [Google Cloud Console](https://console.cloud.google.com/) and select project **crate-app-58494**.
2. Go to **APIs & Services → OAuth consent screen**.
3. Click **Edit app**.
4. Set **App name** to **PlanetMP3** (and optionally upload the Planet MP3 logo).
5. Save.
6. (Optional) Firebase Console → Project settings → change the **Project name** display label to PlanetMP3. This does **not** change the project ID.

After saving, new Google sign-in flows show **PlanetMP3** instead of `crate-app-58494`. Existing sessions may cache the old name briefly — try an incognito window to verify.
