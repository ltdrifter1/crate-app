# Later: Deploy Station Firebase rules

Do this on the PC that has Firebase CLI / this repo logged in.

## Command

```bash
cd path/to/crate-app
firebase deploy --only firestore:rules
```

Project: `crate-app-58494`

## First time on that PC (only if needed)

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules
```

## Why

PR #113 Station features work locally without this.
Deploy unlocks **shared** request counts + cloud dedications for everyone.

Home live chat (`stationChat/home/messages` + `presence`) is in the same rules file. Until this deploys, the messenger UI still mounts but Firestore snapshots/sends will fail.

Optional flood backstop (sanitize + 2.5s/user):

```bash
firebase deploy --only functions:moderateStationChat,firestore:rules
```

Related: https://github.com/ltdrifter1/crate-app/pull/113
