#!/usr/bin/env node
// delete-unknown-artists.js
// ─────────────────────────────────────────────────────────────────────────────
// Delete Firestore tracks whose artist is missing or "Unknown".
//
//   node delete-unknown-artists.js            # dry-run
//   node delete-unknown-artists.js --apply    # delete from Firestore
//
// Requires serviceAccountKey.json in repo root.
// ─────────────────────────────────────────────────────────────────────────────

const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

if (!fs.existsSync(path.join(__dirname, "serviceAccountKey.json"))) {
  console.error("\n❌  serviceAccountKey.json not found.");
  console.error("    Download it from: Firebase Console → Project Settings → Service Accounts\n");
  process.exit(1);
}

const apply = process.argv.includes("--apply");
const serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

function isUnknownArtist(artist) {
  const a = String(artist ?? "").trim().toLowerCase();
  return (
    !a ||
    a === "unknown" ||
    a === "unknown artist" ||
    a === "n/a" ||
    a === "na" ||
    a === "-" ||
    a === "none" ||
    a === "null" ||
    a === "undefined"
  );
}

async function main() {
  const snap = await db.collection("tracks").get();
  const targets = [];

  snap.docs.forEach((d) => {
    const data = d.data() || {};
    if (isUnknownArtist(data.artist)) {
      targets.push({
        id: d.id,
        title: data.title || "",
        artist: data.artist ?? "",
      });
    }
  });

  console.log(`\nCatalog: ${snap.size} tracks`);
  console.log(`Unknown artist: ${targets.length}\n`);
  targets.forEach((t, i) => {
    console.log(`  ${i + 1}. [${t.id}] ${t.title} — artist=${JSON.stringify(t.artist)}`);
  });

  if (!targets.length) {
    console.log("\nNothing to delete.\n");
    return;
  }

  if (!apply) {
    console.log("\nDry-run only. Re-run with --apply to delete these from Firestore.\n");
    return;
  }

  let deleted = 0;
  let errors = 0;
  for (const t of targets) {
    try {
      await db.collection("tracks").doc(t.id).delete();
      deleted += 1;
      console.log(`  ✓ deleted ${t.id}`);
    } catch (e) {
      errors += 1;
      console.error(`  ✗ ${t.id}: ${e.message || e}`);
    }
  }

  console.log(`\nDone. Deleted ${deleted}/${targets.length}${errors ? ` (${errors} errors)` : ""}.\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
