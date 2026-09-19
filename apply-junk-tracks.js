#!/usr/bin/env node
// apply-junk-tracks.js
// ─────────────────────────────────────────────────────────────────────────────
// Apply approved junk deletes from docs/audits/catalog-junk-candidates.csv
// (action=delete only). Review rows are never deleted.
//
//   node apply-junk-tracks.js                         # dry-run plan
//   node apply-junk-tracks.js --apply --approve-deletes
//
// Requires serviceAccountKey.json (repo root) or FIREBASE_SERVICE_ACCOUNT_JSON
// for --apply. Default is dry-run.
// ─────────────────────────────────────────────────────────────────────────────

const fs = require("fs");
const path = require("path");
const {
  planJunkApply,
  parseApprovedDeleteIds,
} = require("./src/lib/catalog-junk-audit.shared.cjs");

const PROJECT_ID = "crate-app-58494";
const WEB_API_KEY = "AIzaSyD39HO66pip_1Q1RBy6fJFb9hhbLJmlFyU";
const ROOT = __dirname;
const DEFAULT_CSV = path.join(ROOT, "docs", "audits", "catalog-junk-candidates.csv");

function hasFlag(name) {
  return process.argv.includes(name);
}

function argValue(name) {
  const i = process.argv.indexOf(name);
  if (i === -1 || i === process.argv.length - 1) return null;
  return process.argv[i + 1];
}

function parseFirestoreValue(v) {
  if (!v || typeof v !== "object") return v;
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return Number(v.doubleValue);
  if ("booleanValue" in v) return v.booleanValue;
  if ("nullValue" in v) return null;
  if ("timestampValue" in v) return v.timestampValue;
  if ("arrayValue" in v) return (v.arrayValue.values || []).map(parseFirestoreValue);
  if ("mapValue" in v) {
    const out = {};
    const fields = (v.mapValue && v.mapValue.fields) || {};
    Object.keys(fields).forEach((k) => {
      out[k] = parseFirestoreValue(fields[k]);
    });
    return out;
  }
  return v;
}

function restDocToTrack(doc) {
  const name = String((doc && doc.name) || "");
  const id = name.split("/").pop();
  const fields = (doc && doc.fields) || {};
  const row = {};
  Object.keys(fields).forEach((k) => {
    row[k] = parseFirestoreValue(fields[k]);
  });
  row.id = id;
  return row;
}

async function fetchViaRest() {
  const tracks = [];
  let pageToken = "";
  do {
    const params = new URLSearchParams({ pageSize: "300", key: WEB_API_KEY });
    if (pageToken) params.set("pageToken", pageToken);
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/tracks?${params}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Firestore REST ${res.status}`);
    const data = await res.json();
    (data.documents || []).forEach((d) => tracks.push(restDocToTrack(d)));
    pageToken = data.nextPageToken || "";
    process.stderr.write(`  loaded ${tracks.length} tracks…\n`);
  } while (pageToken);
  return tracks;
}

function loadAdminCred() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  }
  const filePath = path.join(ROOT, "serviceAccountKey.json");
  if (fs.existsSync(filePath)) return require(filePath);
  return null;
}

function initAdmin(cred) {
  const admin = require("firebase-admin");
  if (admin.apps.length) return admin;
  const projectId = cred.project_id || PROJECT_ID;
  admin.initializeApp({
    credential: admin.credential.cert(cred),
    storageBucket: `${projectId}.firebasestorage.app`,
  });
  return admin;
}

function writePlanMarkdown(plan, meta, outPath) {
  const lines = [
    "# Catalog junk apply plan",
    "",
    `Fetched: \`${meta.fetchedAt}\``,
    `Source: \`${meta.source}\``,
    `Approved CSV: \`${meta.csvPath}\``,
    "",
    `Live catalog: **${plan.result.total}**`,
    `Approved delete ids in CSV: **${meta.approvedCount}**`,
    `Will delete (CSV ∩ live delete): **${plan.targets.length}**`,
    `CSV deletes no longer live/matching: **${plan.approvedMissing.length}**`,
    `Live deletes not in CSV (skipped): **${plan.skippedNotApproved.length}**`,
    `Storage objects to purge: **${plan.storage.filter((s) => !s.skipped).length}**`,
    `Storage skipped (still referenced): **${plan.storage.filter((s) => s.skipped).length}**`,
    "",
    "## Firestore deletes",
    "",
    "| id | duration | title | artist | reason |",
    "|---|---|---|---|---|",
    ...plan.targets.map(
      (t) =>
        `| \`${t.id}\` | ${t.durationLabel} | ${String(t.title).replace(/\|/g, "/")} | ${String(t.artist).replace(/\|/g, "/")} | ${t.reason} |`
    ),
    "",
    "Review rows (unknown artist / broken metadata / duplicates) are **not** in this list.",
    "",
  ];
  fs.writeFileSync(outPath, lines.join("\n") + "\n");
}

async function main() {
  const apply = hasFlag("--apply");
  if (apply && !hasFlag("--approve-deletes")) {
    console.error("\nRefusing. --apply also requires --approve-deletes.");
    console.error("  node apply-junk-tracks.js --apply --approve-deletes\n");
    process.exit(2);
  }

  const csvPath = argValue("--csv") || DEFAULT_CSV;
  const csvLabel = path.relative(ROOT, csvPath) || csvPath;
  if (!fs.existsSync(csvPath)) {
    console.error(`\n❌  Approved CSV not found: ${csvPath}\n`);
    process.exit(1);
  }
  const approvedIds = parseApprovedDeleteIds(fs.readFileSync(csvPath, "utf8"));
  if (!approvedIds.length) {
    console.error("\n❌  No action=delete rows in the approved CSV.\n");
    process.exit(1);
  }

  process.stderr.write("Loading live catalog…\n");
  const tracks = await fetchViaRest();
  const fetchedAt = new Date().toISOString();
  const plan = planJunkApply(tracks, approvedIds);

  const outDir = path.join(ROOT, "docs", "audits");
  fs.mkdirSync(outDir, { recursive: true });
  const planPath = path.join(outDir, "catalog-junk-apply-plan.md");
  writePlanMarkdown(plan, {
    fetchedAt,
    source: "firestore-rest-public",
    csvPath: csvLabel,
    approvedCount: approvedIds.length,
  }, planPath);

  console.log(`\nApply plan (review rows excluded)`);
  console.log(`  catalog:     ${plan.result.total}`);
  console.log(`  csv deletes: ${approvedIds.length}`);
  console.log(`  will delete: ${plan.targets.length}`);
  console.log(`  csv stale:   ${plan.approvedMissing.length}`);
  console.log(`  not in csv:  ${plan.skippedNotApproved.length}`);
  console.log(`  storage:     ${plan.storage.filter((s) => !s.skipped).length} purge / ${plan.storage.filter((s) => s.skipped).length} skip`);
  console.log(`  plan file:   ${planPath}`);

  if (!apply) {
    console.log("\nDry-run only. To apply:");
    console.log("  Put serviceAccountKey.json in repo root (gitignored), then:");
    console.log("  node apply-junk-tracks.js --apply --approve-deletes\n");
    return;
  }

  const cred = loadAdminCred();
  if (!cred) {
    console.error("\n❌  No Firebase admin credentials.");
    console.error("    Add gitignored serviceAccountKey.json in the repo root");
    console.error("    (Firebase Console → Project Settings → Service Accounts → Generate new private key)");
    console.error("    or set FIREBASE_SERVICE_ACCOUNT_JSON to the JSON contents.\n");
    process.exit(1);
  }

  const admin = initAdmin(cred);
  const db = admin.firestore();
  const bucket = admin.storage().bucket();

  let deleted = 0;
  let deleteErrors = 0;
  for (const t of plan.targets) {
    try {
      await db.collection("tracks").doc(t.id).delete();
      deleted += 1;
      console.log(`  ✓ firestore ${t.id}  ${t.title}`);
    } catch (e) {
      deleteErrors += 1;
      console.error(`  ✗ firestore ${t.id}: ${e.message || e}`);
    }
  }

  let purged = 0;
  let purgeSkip = 0;
  let purgeErrors = 0;
  for (const file of plan.storage) {
    if (file.skipped) {
      purgeSkip += 1;
      console.log(`  ⏭  storage ${file.path} (${file.reason})`);
      continue;
    }
    try {
      await bucket.file(file.path).delete({ ignoreNotFound: true });
      purged += 1;
      console.log(`  ✓ storage ${file.path}`);
    } catch (e) {
      purgeErrors += 1;
      console.error(`  ✗ storage ${file.path}: ${e.message || e}`);
    }
  }

  const logPath = path.join(outDir, "catalog-junk-apply-log.md");
  fs.writeFileSync(
    logPath,
    [
      "# Catalog junk apply log",
      "",
      `Applied: \`${new Date().toISOString()}\``,
      "",
      `- Firestore deleted: **${deleted}** / ${plan.targets.length} (${deleteErrors} errors)`,
      `- Storage purged: **${purged}** (${purgeSkip} skipped, ${purgeErrors} errors)`,
      `- Review rows left in catalog (unknown artist / broken metadata / duplicates)`,
      "",
    ].join("\n")
  );

  console.log(`\nDone. Firestore ${deleted}/${plan.targets.length}, storage ${purged} purged.`);
  console.log(`  log: ${logPath}\n`);
  if (deleteErrors || purgeErrors) process.exit(1);
}

main().catch((err) => {
  console.error("\n❌ ", err.message || err);
  process.exit(1);
});
