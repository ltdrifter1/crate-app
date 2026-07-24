#!/usr/bin/env node
// normalize-genres.js
// Remap every Firestore track.genre into the canonical 4AM set.
//
//   node normalize-genres.js           # dry-run → genres-review.csv
//   node normalize-genres.js --apply   # write Firestore
//
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

// Keep in sync with src/lib/genres.js
const CANONICAL_GENRES = [
  "Rock", "R&B", "Country", "Hip-Hop", "House",
  "Drum and Bass", "Soul", "Jazz", "Classical", "Metal",
];
const CANONICAL_SET = new Set(CANONICAL_GENRES.map((g) => g.toLowerCase()));
const GENRE_ALIASES = {
  rock: "Rock", "r&b": "R&B", rnb: "R&B", "r and b": "R&B", "r n b": "R&B",
  country: "Country", "hip-hop": "Hip-Hop", "hip hop": "Hip-Hop", hiphop: "Hip-Hop", rap: "Hip-Hop",
  house: "House", "drum and bass": "Drum and Bass", "drum & bass": "Drum and Bass",
  "drum&bass": "Drum and Bass", dnb: "Drum and Bass", "d&b": "Drum and Bass", jungle: "Drum and Bass",
  soul: "Soul", jazz: "Jazz", classical: "Classical", metal: "Metal", "heavy metal": "Metal",
  techno: "House", electronic: "House", electronica: "House", ambient: "House", disco: "House",
  garage: "House", "uk garage": "House", ukg: "House", "deep house": "House", "tech house": "House",
  "progressive house": "House", breakbeat: "Drum and Bass", breaks: "Drum and Bass",
  funk: "Soul", blues: "Jazz", "neo-soul": "Soul", "neo soul": "Soul", gospel: "Soul", motown: "Soul",
  pop: "R&B", "indie pop": "R&B", alternative: "Rock", alt: "Rock", indie: "Rock", "indie rock": "Rock",
  punk: "Rock", "hard rock": "Rock", grunge: "Rock", folk: "Country", americana: "Country",
  bluegrass: "Country", reggae: "Soul", dancehall: "Soul", afrobeat: "Soul", afrobeats: "Soul",
  latin: "Jazz", world: "Jazz", experimental: "Jazz",
};

function normalizeGenre(raw) {
  if (raw == null) return "";
  const trimmed = String(raw).trim();
  if (!trimmed) return "";
  const lower = trimmed.toLowerCase().replace(/\s+/g, " ");
  if (CANONICAL_SET.has(lower)) {
    return CANONICAL_GENRES.find((g) => g.toLowerCase() === lower) || trimmed;
  }
  if (GENRE_ALIASES[lower]) return GENRE_ALIASES[lower];
  if (lower.includes("drum") && lower.includes("bass")) return "Drum and Bass";
  if (lower.includes("hip") && lower.includes("hop")) return "Hip-Hop";
  if (lower.includes("r&b") || lower.includes("rnb")) return "R&B";
  if (lower.includes("house") || lower.includes("techno") || lower.includes("electronic")) return "House";
  if (lower.includes("metal")) return "Metal";
  if (lower.includes("country") || lower.includes("folk")) return "Country";
  if (lower.includes("jazz")) return "Jazz";
  if (lower.includes("soul") || lower.includes("funk")) return "Soul";
  if (lower.includes("classical") || lower.includes("orchestra")) return "Classical";
  if (lower.includes("rock") || lower.includes("punk") || lower.includes("indie")) return "Rock";
  if (lower.includes("rap")) return "Hip-Hop";
  return "";
}

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
  CANONICAL_GENRES.forEach((g) => console.log(`      ${g.padEnd(16)} ${counts[g]}`));
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
