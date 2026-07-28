#!/usr/bin/env node
// normalize-genres.js
// Remap every Firestore track.genre into the canonical 11 (alias table in genre-normalize.shared.cjs).
//
//   node normalize-genres.js           # dry-run → genres-review.csv
//   node normalize-genres.js --apply   # write Firestore
//
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");
const { CANONICAL_GENRES, normalizeGenre } = require("./src/lib/genre-normalize.shared.cjs");

if (!fs.existsSync(path.join(__dirname, "serviceAccountKey.json"))) {
  console.error("\n❌  serviceAccountKey.json not found in repo root.\n");
  process.exit(1);
}

const apply = process.argv.includes("--apply");
admin.initializeApp({ credential: admin.credential.cert(require("./serviceAccountKey.json")) });
const db = admin.firestore();

function csvEscape(v) {
  const s = String(v ?? "");
  return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
}

async function main() {
  const snap = await db.collection("tracks").get();
  const changes = [];
  const counts = Object.fromEntries(CANONICAL_GENRES.map((g) => [g, 0]));
  let blank = 0;

  snap.docs.forEach((d) => {
    const data = d.data();
    const before = data.genre || "";
    const after = normalizeGenre(before);
    if (after) counts[after] = (counts[after] || 0) + 1;
    else blank++;
    if (after !== before) {
      changes.push({
        id: d.id,
        title: data.title || "",
        artist: data.artist || "",
        before,
        after: after || "(clear)",
        next: after,
      });
    }
  });

  const outPath = path.join(__dirname, "genres-review.csv");
  const lines = ["id,title,artist,old_genre,new_genre"];
  changes.forEach((c) => {
    lines.push([c.id, csvEscape(c.title), csvEscape(c.artist), csvEscape(c.before), csvEscape(c.after)].join(","));
  });
  fs.writeFileSync(outPath, lines.join("\n"));

  console.log(`\n🎵  Scanned ${snap.size} tracks`);
  console.log(`    ${changes.length} genre fields to update`);
  console.log(`    Review: ${outPath}\n`);
  console.log("    Canonical counts (after normalize):");
  CANONICAL_GENRES.forEach((g) => console.log(`      ${g.padEnd(18)} ${counts[g]}`));
  console.log(`      (blank/unknown) ${blank}`);

  if (!changes.length) {
    console.log("\n✅  Already clean.\n");
    return;
  }

  if (!apply) {
    console.log("\nDry-run only. Re-run with --apply to write Firestore.\n");
    console.log("  node normalize-genres.js --apply\n");
    return;
  }

  console.log("\nWriting updates...");
  let ok = 0;
  for (const c of changes) {
    await db.collection("tracks").doc(c.id).update({ genre: c.next });
    ok++;
    if (ok % 25 === 0) console.log(`  ${ok}/${changes.length}`);
  }
  console.log(`\n✅  Updated ${ok} tracks.\n`);
}

main().catch((err) => {
  console.error("\n❌ ", err.message);
  process.exit(1);
});
