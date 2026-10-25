// scripts/publish-catalog.js
// ─────────────────────────────────────────────────────────────────────────────
// Publish the crate for fast cold boots:
//   catalog/v1.json   (Cloud Storage) — the whole catalog, gzipped, one fetch
//   catalog/homeLite  (Firestore)     — Home's first 48 cuts in one getDoc
// Same code the rebuildHomeLite Cloud Function runs on every track write; this
// runs it from your machine so it works whether or not functions are deployed.
//
// HOW TO RUN:  npm run catalog:publish        (needs serviceAccountKey.json)
// upload-tracks.js also runs this after a batch lands.
// ─────────────────────────────────────────────────────────────────────────────

const fs = require("fs");
const path = require("path");
const { CATALOG_OBJECT, publishCatalogJson } = require("../functions/lib/catalogJson");
const { publishHomeLite } = require("../functions/lib/homeLite");

function catalogUrl(bucketName) {
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(CATALOG_OBJECT)}?alt=media`;
}

/** Download what the app downloads and make sure it parses to this publish. */
async function verifyCatalogUrl(url, expected) {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    throw new Error(`${url} answered HTTP ${res.status}. Check storage rules allow public read (firebase deploy --only storage).`);
  }
  let json;
  try {
    json = await res.json();
  } catch {
    throw new Error(`${url} is not readable JSON (encoding: ${res.headers.get("content-encoding") || "none"}).`);
  }
  const count = Array.isArray(json?.tracks) ? json.tracks.length : 0;
  if (!count) throw new Error(`${url} parsed but holds no tracks.`);
  // The object carries s-maxage=3600, so an edge cache may serve the last publish for up to an hour.
  const stale = Number(json?.version) !== Number(expected.version);
  return { count, stale, servedVersion: json?.version, encoding: res.headers.get("content-encoding") || "identity" };
}

async function publishCatalog({ db, bucket, FieldValue, log = console.log } = {}) {
  log("\n  Publishing catalog…");
  const lite = await publishHomeLite(db, { FieldValue });
  log(`    catalog/homeLite  ${lite.trackCount} tracks`);
  const payload = await publishCatalogJson(db, bucket);
  log(`    ${CATALOG_OBJECT}   ${payload.trackCount} tracks (version ${payload.version})`);
  const url = catalogUrl(bucket.name);
  const check = await verifyCatalogUrl(url, payload);
  if (check.stale) {
    log(`    verified          download works; a cache still serves version ${check.servedVersion} (${check.count} tracks) — the new copy shows within the hour\n`);
  } else {
    log(`    verified          ${check.count} tracks download (${check.encoding})\n`);
  }
  return { lite, payload, url };
}

async function main() {
  const keyPath = path.join(__dirname, "..", "serviceAccountKey.json");
  if (!fs.existsSync(keyPath)) {
    console.error("\n❌  serviceAccountKey.json not found in the project root.");
    console.error("    Download it from: Firebase Console → Project Settings → Service Accounts\n");
    process.exit(1);
  }
  const admin = require("firebase-admin");
  const serviceAccount = require(keyPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: `${serviceAccount.project_id}.firebasestorage.app`,
  });
  await publishCatalog({
    db: admin.firestore(),
    bucket: admin.storage().bucket(),
    FieldValue: admin.firestore.FieldValue,
  });
  console.log("✅  Done. New visitors now load the catalog in one download.\n");
}

module.exports = { catalogUrl, verifyCatalogUrl, publishCatalog };

if (require.main === module) {
  main().catch((err) => {
    console.error(`\n❌  ${err.message}\n`);
    process.exit(1);
  });
}
