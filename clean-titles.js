#!/usr/bin/env node
// clean-titles.js
// ─────────────────────────────────────────────────────────────────────────────
// Preview / apply title + artist cleanup for existing Firestore tracks.
//
//   node clean-titles.js            # dry-run (writes titles-review.csv)
//   node clean-titles.js --apply    # write cleaned title/artist to Firestore
//
// Requires serviceAccountKey.json in repo root.
// ─────────────────────────────────────────────────────────────────────────────

const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

if (!fs.existsSync(path.join(__dirname, "serviceAccountKey.json"))) {
  console.error("\n❌  serviceAccountKey.json not found.\n");
  process.exit(1);
}

const apply = process.argv.includes("--apply");
const serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

function cleanArtist(s) {
  let t = String(s || "").trim();
  t = t.replace(/^\d{1,3}\s*[-.)]\s*/i, "");
  t = t.replace(/^AUDIO:\s*/i, "");
  t = t.replace(/\s+/g, " ").trim();
  return t;
}

function cleanTitle(s) {
  let t = String(s || "").trim();
  t = t.replace(/^\d{1,3}\s*[-.)]\s*/i, "");
  t = t.replace(/^AUDIO:\s*/i, "");
  // Drop common YouTube / rip suffixes
  t = t.replace(/\s*[\(\[\{]?\s*(official\s+)?(music\s+)?(video|audio|lyric(s)?|visualizer)\s*[\)\]\}]?\s*$/i, "");
  t = t.replace(/\s*[\(\[\{]?\s*(lyrics?|4k|hd|hq|free\s+download)\s*[\)\]\}]?\s*$/i, "");
  t = t.replace(/\s*[-–—]\s*(official\s+)?(music\s+)?(video|audio|lyric(s)?)\s*$/i, "");
  t = t.replace(/\s+/g, " ").trim();
  // Collapse leftover empty brackets
  t = t.replace(/\(\s*\)/g, "").replace(/\[\s*\]/g, "").trim();
  return t;
}

function maybeSplitArtistTitle(title, artist) {
  const a = cleanArtist(artist);
  const t = cleanTitle(title);
  if (a && a.toLowerCase() !== "unknown") return { title: t, artist: a };
  // "Artist - Title" packed into title with Unknown artist
  const m = t.match(/^(.+?)\s+[-–—:]\s+(.+)$/);
  if (m) return { title: cleanTitle(m[2]), artist: cleanArtist(m[1]) };
  return { title: t, artist: a || "Unknown" };
}

function csvEscape(v) {
  const s = String(v ?? "");
  return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
}

async function main() {
  const snap = await db.collection("tracks").get();
  const changes = [];

  snap.docs.forEach(d => {
    const data = d.data();
    const before = { title: data.title || "", artist: data.artist || "" };
    const after = maybeSplitArtistTitle(before.title, before.artist);
    if (after.title !== before.title || after.artist !== before.artist) {
      changes.push({ id: d.id, before, after });
    }
  });

  const outPath = path.join(__dirname, "titles-review.csv");
  const lines = ["id,old_title,old_artist,new_title,new_artist"];
  changes.forEach(c => {
    lines.push([
      c.id,
      csvEscape(c.before.title),
      csvEscape(c.before.artist),
      csvEscape(c.after.title),
      csvEscape(c.after.artist),
    ].join(","));
  });
  fs.writeFileSync(outPath, lines.join("\n"));

  console.log(`\n🧹  Scanned ${snap.size} tracks`);
  console.log(`    ${changes.length} need cleanup`);
  console.log(`    Review file: ${outPath}`);

  if (!changes.length) {
    console.log("\n✅  Nothing to clean.\n");
    return;
  }

  if (!apply) {
    console.log("\nDry-run only. Re-run with --apply to write Firestore updates.\n");
    console.log("  node clean-titles.js --apply\n");
    return;
  }

  console.log("\nWriting updates...");
  let ok = 0;
  for (const c of changes) {
    await db.collection("tracks").doc(c.id).update({
      title: c.after.title,
      artist: c.after.artist,
    });
    ok++;
    if (ok % 25 === 0) console.log(`  ${ok}/${changes.length}`);
  }
  console.log(`\n✅  Updated ${ok} tracks.\n`);
}

main().catch(err => {
  console.error("\n❌ ", err.message);
  process.exit(1);
});
