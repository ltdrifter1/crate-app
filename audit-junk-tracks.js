#!/usr/bin/env node
// audit-junk-tracks.js
// ─────────────────────────────────────────────────────────────────────────────
// Dry-run audit of Firestore `tracks` for junk + very-long files.
//
//   npm run catalog:audit-junk
//   node audit-junk-tracks.js
//   node audit-junk-tracks.js --from-json /tmp/tracks-dump.json
//
// Writes:
//   docs/audits/catalog-junk-audit.md
//   docs/audits/catalog-junk-candidates.csv
//
// THIS SCRIPT NEVER DELETES. There is no --apply path.
// ─────────────────────────────────────────────────────────────────────────────

const fs = require("fs");
const path = require("path");
const {
  auditCatalog,
  candidatesToCsv,
  renderMarkdownReport,
} = require("./src/lib/catalog-junk-audit.shared.cjs");

const PROJECT_ID = "crate-app-58494";
const WEB_API_KEY = "AIzaSyD39HO66pip_1Q1RBy6fJFb9hhbLJmlFyU";
const ROOT = __dirname;

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
  let pages = 0;
  do {
    const params = new URLSearchParams({
      pageSize: "300",
      key: WEB_API_KEY,
    });
    if (pageToken) params.set("pageToken", pageToken);
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/tracks?${params}`;
    const res = await fetch(url);
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Firestore REST ${res.status}: ${body.slice(0, 400)}`);
    }
    const data = await res.json();
    const docs = data.documents || [];
    docs.forEach((d) => tracks.push(restDocToTrack(d)));
    pageToken = data.nextPageToken || "";
    pages += 1;
    process.stderr.write(`  REST page ${pages}: +${docs.length} (total ${tracks.length})\n`);
  } while (pageToken);
  return tracks;
}

async function fetchViaAdmin() {
  const keyPath = path.join(ROOT, "serviceAccountKey.json");
  if (!fs.existsSync(keyPath)) {
    throw new Error("serviceAccountKey.json not found");
  }
  const admin = require("firebase-admin");
  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(require(keyPath)) });
  }
  const snap = await admin.firestore().collection("tracks").get();
  return snap.docs.map((d) => {
    const data = d.data() || {};
    let createdAt = data.createdAt;
    if (createdAt && typeof createdAt.toDate === "function") {
      createdAt = createdAt.toDate().toISOString();
    }
    return { ...data, createdAt, id: d.id };
  });
}

function loadFromJson(filePath) {
  const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (Array.isArray(raw)) return raw;
  if (raw && Array.isArray(raw.tracks)) return raw.tracks;
  throw new Error("JSON must be an array of tracks or { tracks: [] }");
}

async function loadTracks() {
  const fromJson = argValue("--from-json");
  if (fromJson) {
    return { tracks: loadFromJson(fromJson), source: `json:${fromJson}` };
  }

  const keyPath = path.join(ROOT, "serviceAccountKey.json");
  if (fs.existsSync(keyPath)) {
    process.stderr.write("Loading tracks via Admin SDK (serviceAccountKey.json)…\n");
    const tracks = await fetchViaAdmin();
    return { tracks, source: "firestore-admin" };
  }

  process.stderr.write("Loading tracks via public Firestore REST (no service account)…\n");
  const tracks = await fetchViaRest();
  return { tracks, source: "firestore-rest-public" };
}

async function main() {
  if (hasFlag("--apply") || hasFlag("--delete") || hasFlag("--purge")) {
    console.error("\nRefusing to run. This audit is dry-run only.");
    console.error("There is no --apply / delete path. Wait for Luke to approve, then a follow-up can delete.\n");
    process.exit(2);
  }

  const outDir = argValue("--out-dir") || path.join(ROOT, "docs", "audits");
  fs.mkdirSync(outDir, { recursive: true });

  const { tracks, source } = await loadTracks();
  const fetchedAt = new Date().toISOString();
  const result = auditCatalog(tracks);

  const mdPath = path.join(outDir, "catalog-junk-audit.md");
  const csvPath = path.join(outDir, "catalog-junk-candidates.csv");
  fs.writeFileSync(mdPath, renderMarkdownReport(result, { fetchedAt, source }));
  fs.writeFileSync(csvPath, candidatesToCsv(result.candidates));

  console.log(`\nPlanet MP3 catalog junk audit (dry-run)`);
  console.log(`  source:     ${source}`);
  console.log(`  fetched:    ${fetchedAt}`);
  console.log(`  total:      ${result.total}`);
  console.log(`  deletes:    ${result.deletes.length}`);
  console.log(`  long ≥20m:  ${result.longTracks.length}`);
  console.log(`  maybe mix:  ${result.mixes.length}`);
  console.log(`  review:     ${result.reviews.length}`);
  console.log(`  flagged:    ${result.candidates.length}`);
  console.log(`\n  markdown:   ${mdPath}`);
  console.log(`  csv:        ${csvPath}`);
  console.log(`\nNo Firestore or Storage deletes were applied.\n`);
}

main().catch((err) => {
  console.error("\n❌ ", err.message || err);
  process.exit(1);
});
