#!/usr/bin/env node
// delete-missing-covers.js
// ─────────────────────────────────────────────────────────────────────────────
// Delete Firestore tracks that have no real artwork.
//
//   node delete-missing-covers.js            # dry-run (writes missing-covers-review.csv)
//   node delete-missing-covers.js --apply    # delete matching track documents
//
// Treats as missing:
//   - empty / null albumCover
//   - non-http values
//   - known placeholders (covers/default.*, test.png)
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
const purgeStorage = process.argv.includes("--purge-storage");
const serviceAccount = require("./serviceAccountKey.json");
const projectId = serviceAccount.project_id;
const bucketName = `${projectId}.firebasestorage.app`;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: bucketName,
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

function classifyCover(albumCover) {
  const c = String(albumCover || "").trim();
  if (!c) return "empty";
  if (!/^https?:\/\//i.test(c)) return "non-http";
  if (/\/covers\/default\.(avif|jpg|jpeg|png|webp)(\?|$)/i.test(c)) return "default-placeholder";
  if (/test\.png/i.test(c)) return "test-placeholder";
  return "ok";
}

function missingArtwork(albumCover) {
  return classifyCover(albumCover) !== "ok";
}

function storagePathFromUrl(url) {
  if (!url || typeof url !== "string") return null;
  // https://storage.googleapis.com/<bucket>/<path>
  const m = url.match(/storage\.googleapis\.com\/[^/]+\/(.+?)(?:\?|$)/i);
  if (m) return decodeURIComponent(m[1]);
  // https://firebasestorage.googleapis.com/v0/b/<bucket>/o/<encodedPath>
  const m2 = url.match(/\/o\/([^?]+)/i);
  if (m2) return decodeURIComponent(m2[1]);
  return null;
}

function csvEscape(v) {
  const s = String(v ?? "");
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

async function maybeDeleteStorage(url, label) {
  if (!purgeStorage || !url) return;
  const objectPath = storagePathFromUrl(url);
  if (!objectPath) return;
  // Never delete shared default placeholders from Storage.
  if (/^covers\/default\./i.test(objectPath) || /test\.png$/i.test(objectPath)) return;
  try {
    await bucket.file(objectPath).delete({ ignoreNotFound: true });
    console.log(`    🗑  storage ${label}: ${objectPath}`);
  } catch (err) {
    console.warn(`    ⚠  storage ${label} failed (${objectPath}): ${err.message}`);
  }
}

async function main() {
  console.log(`\nScanning tracks for missing artwork… (${apply ? "APPLY" : "dry-run"})\n`);
  const snap = await db.collection("tracks").get();
  const missing = [];

  snap.docs.forEach((d) => {
    const data = d.data();
    const kind = classifyCover(data.albumCover);
    if (kind === "ok") return;
    missing.push({
      id: d.id,
      title: data.title || "",
      artist: data.artist || "",
      albumCover: data.albumCover || "",
      audioUrl: data.audioUrl || "",
      kind,
    });
  });

  const outPath = path.join(__dirname, "missing-covers-review.csv");
  const lines = ["id,kind,artist,title,albumCover"];
  missing.forEach((row) => {
    lines.push([
      row.id,
      row.kind,
      csvEscape(row.artist),
      csvEscape(row.title),
      csvEscape(row.albumCover),
    ].join(","));
  });
  fs.writeFileSync(outPath, lines.join("\n") + "\n");

  console.log(`Total tracks:   ${snap.size}`);
  console.log(`Missing art:    ${missing.length}`);
  console.log(`Review CSV:     ${outPath}\n`);

  if (!missing.length) {
    console.log("Nothing to delete.\n");
    return;
  }

  const byKind = missing.reduce((acc, row) => {
    acc[row.kind] = (acc[row.kind] || 0) + 1;
    return acc;
  }, {});
  Object.entries(byKind).forEach(([k, n]) => console.log(`  ${k}: ${n}`));
  console.log("");

  missing.slice(0, 20).forEach((row) => {
    console.log(`  · [${row.kind}] ${row.artist} — ${row.title}`);
  });
  if (missing.length > 20) console.log(`  … and ${missing.length - 20} more`);
  console.log("");

  if (!apply) {
    console.log("Dry-run only. Re-run with --apply to delete these Firestore documents.");
    console.log("Optional: --purge-storage also removes non-default audio/cover objects.\n");
    return;
  }

  let deleted = 0;
  for (const row of missing) {
    await db.collection("tracks").doc(row.id).delete();
    deleted += 1;
    console.log(`  ✓ deleted ${row.id}  ${row.artist} — ${row.title}`);
    await maybeDeleteStorage(row.audioUrl, "audio");
    await maybeDeleteStorage(row.albumCover, "cover");
  }

  console.log(`\nDone. Deleted ${deleted} / ${missing.length} tracks.\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
