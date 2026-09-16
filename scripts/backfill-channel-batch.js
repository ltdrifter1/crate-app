#!/usr/bin/env node
// Patch existing Firestore tracks with `batch` / culture `genre` from tracks.csv.
// Upload skips duplicates; this is the backfill path for early rows.
//
//   node scripts/backfill-channel-batch.js              # dry-run
//   node scripts/backfill-channel-batch.js --apply      # write
//
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");
const { storeGenreLabel } = require("../src/lib/genre-normalize.shared.cjs");

const root = path.join(__dirname, "..");
const keyPath = path.join(root, "serviceAccountKey.json");
const csvPath = path.join(root, "tracks.csv");

if (!fs.existsSync(keyPath)) {
  console.error("\n❌  serviceAccountKey.json not found in repo root.\n");
  process.exit(1);
}
if (!fs.existsSync(csvPath)) {
  console.error("\n❌  tracks.csv not found. Export or rebuild it (keep title, artist, batch, genre).\n");
  process.exit(1);
}

const apply = process.argv.includes("--apply");
const serviceAccount = require(keyPath);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

function nameKey(title, artist) {
  return `${String(title || "").trim().toLowerCase()}|||${String(artist || "").trim().toLowerCase()}`;
}

function parseCSV(text) {
  const lines = text.trim().split("\n").filter((l) => l.trim());
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line, idx) => {
    const values = [];
    let cur = "";
    let inQ = false;
    for (const c of line) {
      if (c === '"') inQ = !inQ;
      else if (c === "," && !inQ) {
        values.push(cur.trim());
        cur = "";
      } else cur += c;
    }
    values.push(cur.trim());
    const obj = { _line: idx + 2 };
    headers.forEach((h, i) => {
      obj[h] = (values[i] || "").trim();
    });
    return obj;
  });
}

function csvEscape(v) {
  const s = String(v ?? "");
  return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
}

async function main() {
  const rows = parseCSV(fs.readFileSync(csvPath, "utf8")).filter((r) => r.title);
  const byName = new Map();
  rows.forEach((r) => {
    const key = nameKey(r.title, r.artist);
    if (!byName.has(key)) byName.set(key, r);
  });

  const snap = await db.collection("tracks").get();
  const changes = [];
  let csvMiss = 0;

  snap.docs.forEach((d) => {
    const data = d.data();
    const row = byName.get(nameKey(data.title, data.artist));
    if (!row) {
      csvMiss++;
      return;
    }
    const next = {};
    if (row.batch) next.batch = String(row.batch).trim();
    if (row.source) next.source = String(row.source).trim();
    if (row.genre) next.genre = storeGenreLabel(row.genre);
    const diff = {};
    Object.entries(next).forEach(([k, v]) => {
      if (v && String(data[k] || "") !== String(v)) diff[k] = v;
    });
    if (Object.keys(diff).length) {
      changes.push({
        id: d.id,
        title: data.title || "",
        artist: data.artist || "",
        diff,
        before: { batch: data.batch || "", genre: data.genre || "" },
      });
    }
  });

  const outPath = path.join(root, "batch-backfill-review.csv");
  const lines = ["id,title,artist,fields,old_batch,old_genre,new_batch,new_genre"];
  changes.forEach((c) => {
    lines.push([
      c.id,
      csvEscape(c.title),
      csvEscape(c.artist),
      Object.keys(c.diff).join("|"),
      csvEscape(c.before.batch),
      csvEscape(c.before.genre),
      csvEscape(c.diff.batch || ""),
      csvEscape(c.diff.genre || ""),
    ].join(","));
  });
  fs.writeFileSync(outPath, lines.join("\n"));

  console.log(`\n🎛  Firestore tracks: ${snap.size}`);
  console.log(`    CSV rows:        ${rows.length}`);
  console.log(`    No CSV match:    ${csvMiss}`);
  console.log(`    Fields to patch: ${changes.length}`);
  console.log(`    Review: ${outPath}\n`);

  if (!changes.length) {
    console.log("✅  Nothing to write — CSV batch/genre already match Firestore (or CSV has no batch column filled).\n");
    return;
  }

  if (!apply) {
    console.log("Dry-run only. Re-run with --apply to write Firestore.\n");
    console.log("  node scripts/backfill-channel-batch.js --apply\n");
    return;
  }

  console.log("Writing updates...");
  let ok = 0;
  for (const c of changes) {
    await db.collection("tracks").doc(c.id).update(c.diff);
    ok++;
    if (ok % 25 === 0) console.log(`  ${ok}/${changes.length}`);
  }
  console.log(`\n✅  Updated ${ok} tracks.\n`);
}

main().catch((err) => {
  console.error("\n❌ ", err.message);
  process.exit(1);
});
