// One-off: copy uploadBatch -> batch on existing tracks so the app's channels see them.
// The app reads `batch`; older uploads only have `uploadBatch`.
//   node ingest/backfill-batch.js [--exclude ingest/audioasis_flagged.txt]          dry run (read-only)
//   node ingest/backfill-batch.js [--exclude ...] --apply                           writes to Firestore
// Excluded artists keep uploadBatch but get no batch. Changed doc ids are logged
// to ingest/backfill-undo.json so the change can be reversed.
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");
admin.initializeApp({ credential: admin.credential.cert(require(path.join(__dirname, "..", "serviceAccountKey.json"))) });
const db = admin.firestore();
const APPLY = process.argv.includes("--apply");
const ex = process.argv.indexOf("--exclude");
const excluded = new Set(ex > -1
  ? fs.readFileSync(process.argv[ex + 1], "utf8").split("\n").map((l) => l.split("\t")[1]).filter(Boolean).map((a) => a.trim().toLowerCase())
  : []);

(async () => {
  const snap = await db.collection("tracks").get();
  const pending = snap.docs.filter((d) => {
    const x = d.data();
    return String(x.uploadBatch || "").trim() && !String(x.batch || "").trim();
  });
  const skip = pending.filter((d) => excluded.has(String(d.data().artist || "").trim().toLowerCase()));
  const skipIds = new Set(skip.map((d) => d.id));
  const todo = pending.filter((d) => !skipIds.has(d.id));
  const counts = {};
  todo.forEach((d) => { const b = d.data().uploadBatch; counts[b] = (counts[b] || 0) + 1; });
  console.log(`${snap.size} tracks total; ${pending.length} have uploadBatch but no batch.`);
  console.log(`Excluding ${skip.length} track(s) by ${excluded.size} flagged artist name(s).`);
  console.log(`Will set batch on ${todo.length}:`, counts);
  if (!APPLY) { console.log("Dry run - nothing written. Re-run with --apply to update."); return; }
  fs.writeFileSync(path.join(__dirname, "backfill-undo.json"), JSON.stringify(todo.map((d) => d.id)));
  for (let i = 0; i < todo.length; i += 400) {
    const b = db.batch();
    todo.slice(i, i + 400).forEach((d) => b.update(d.ref, { batch: d.data().uploadBatch }));
    await b.commit();
  }
  console.log(`Updated ${todo.length} tracks. Undo list: ingest/backfill-undo.json`);
})().then(() => process.exit(0)).catch((e) => { console.error(e.message); process.exit(1); });
