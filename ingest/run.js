// Plan + upload for a prep manifest. Uploads straight from the source paths.
//   node ingest/run.js plan   <manifest.json>   read-only: dedupe, classify, summarise
//   node ingest/run.js upload <manifest.json>   upload the plan's new tracks, then verify
// Both print a final line:  RESULT {json}
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");
const { normalizeGenre } = require("../src/lib/genre-normalize.shared.cjs");

const ROOT = path.join(__dirname, "..");
const keyPath = path.join(ROOT, "serviceAccountKey.json");
if (!fs.existsSync(keyPath)) { console.error("serviceAccountKey.json not found in crate-app folder."); process.exit(1); }
const serviceAccount = require(keyPath);
const bucketName = `${serviceAccount.project_id}.firebasestorage.app`;
admin.initializeApp({ credential: admin.credential.cert(serviceAccount), storageBucket: bucketName });
const db = admin.firestore();
const bucket = admin.storage().bucket();

const nameKey = (t, a) => `${String(t || "").trim().toLowerCase()}|||${String(a || "").trim().toLowerCase()}`;
const out = (obj) => console.log("RESULT " + JSON.stringify(obj));

function mp3Duration(filePath) {
  try {
    const buf = fs.readFileSync(filePath);
    let offset = 0;
    if (buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33) {
      offset = (((buf[6] & 0x7f) << 21) | ((buf[7] & 0x7f) << 14) | ((buf[8] & 0x7f) << 7) | (buf[9] & 0x7f)) + 10;
    }
    const br = [null,
      [0,32,64,96,128,160,192,224,256,288,320,352,384,416,448,null],
      [0,32,48,56,64,80,96,112,128,160,192,224,256,320,384,null],
      [0,32,40,48,56,64,80,96,112,128,160,192,224,256,320,null]];
    const sr = { 3: [44100, 48000, 32000], 2: [22050, 24000, 16000], 0: [11025, 12000, 8000] };
    for (let i = offset; i < Math.min(offset + 8192, buf.length - 4); i++) {
      if (buf[i] === 0xff && (buf[i + 1] & 0xe0) === 0xe0) {
        const layer = 4 - ((buf[i + 1] >> 1) & 3);
        const bitrate = br[layer]?.[(buf[i + 2] >> 4) & 15];
        const rate = sr[(buf[i + 1] >> 3) & 3]?.[(buf[i + 2] >> 2) & 3];
        if (bitrate && rate) {
          const s = Math.round((fs.statSync(filePath).size * 8) / (bitrate * 1000));
          if (s > 0 && s < 86400) return s;
        }
        break;
      }
    }
  } catch (e) { /* fall through */ }
  return null;
}

const contentType = (f) => ({ ".mp3": "audio/mpeg", ".m4a": "audio/mp4", ".wav": "audio/wav", ".flac": "audio/flac",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" }[path.extname(f).toLowerCase()] || "application/octet-stream");

async function uploadFile(localPath, dest) {
  await bucket.upload(localPath, { destination: dest,
    metadata: { contentType: contentType(dest), cacheControl: "public, max-age=31536000" } });
  await bucket.file(dest).makePublic();
  return `https://storage.googleapis.com/${bucketName}/${dest}`;
}

async function loadCatalog() {
  const snap = await db.collection("tracks").get();
  const byName = new Map(), byAudio = new Map(), waves = {};
  snap.docs.forEach((d) => {
    const x = d.data();
    byName.set(nameKey(x.title, x.artist), d.id);
    const m = String(x.audioUrl || "").match(/\/audio\/([^/?#]+)/);
    if (m) byAudio.set(decodeURIComponent(m[1]), d.id);
    const b = String(x.batch || x.uploadBatch || "");
    const w = b.match(/^(.*?)-(\d+)$/);
    if (w) waves[w[1]] = Math.max(waves[w[1]] || 0, Number(w[2]));
  });
  return { byName, byAudio, waves, count: snap.size };
}

async function plan(manifestPath) {
  const { channelList, classify } = await import(pathToFileURL(path.join(__dirname, "classify.mjs")).href);
  const m = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const channel = channelList().find((c) => c.id === m.channel);
  if (!channel) throw new Error(`Unknown channel "${m.channel}"`);
  const cat = await loadCatalog();
  const batch = `${channel.batchPrefix}-${(cat.waves[channel.batchPrefix] || 0) + 1}`;

  const rows = m.rows.map((r) => {
    const genre = normalizeGenre(r.genre) || r.genre || "";
    let status = "new", reason = "";
    if (r.flags.includes("junk")) { status = "excluded"; reason = "junk"; }
    else if (r.flags.includes("dupe-in-folder")) { status = "skipped"; reason = "duplicate in folder"; }
    else if (cat.byName.has(nameKey(r.title, r.artist))) { status = "skipped"; reason = "already in Firebase"; }
    else if (cat.byAudio.has(r.audioFile)) { status = "skipped"; reason = "audio file already in Firebase"; }
    return { ...r, genre, status, reason, batch };
  });
  const fresh = rows.filter((r) => r.status === "new");
  const cls = classify(fresh.map((r) => ({
    title: r.title, artist: r.artist, album: r.album, genre: r.genre, batch,
    bpm: parseInt(r.bpm, 10) || null, energy: parseInt(r.energy, 10) || 5,
  })));
  fresh.forEach((r, i) => { r.channels = cls[i].channels; r.scene = cls[i].scene; });

  const count = (fn) => fresh.filter(fn).length;
  const byChannel = {}, byGenre = {};
  fresh.forEach((r) => {
    r.channels.forEach((c) => { byChannel[c] = (byChannel[c] || 0) + 1; });
    byGenre[r.genre || "(none)"] = (byGenre[r.genre || "(none)"] || 0) + 1;
  });
  const summary = {
    channel: channel.id, channelTitle: channel.title, batch, inFirebase: cat.count,
    total: rows.length, new: fresh.length,
    skipped: rows.filter((r) => r.status === "skipped").length,
    excluded: rows.filter((r) => r.status === "excluded").length,
    onTargetChannel: count((r) => r.channels.includes(channel.id)),
    onNoChannel: count((r) => !r.channels.length),
    missingCover: count((r) => !r.coverFile), missingBpm: count((r) => !r.bpm),
    missingKey: count((r) => !r.camelot), missingEnergy: count((r) => !r.energy),
    genreGuessed: count((r) => r.genreSource === "channel-default"),
    noGenre: count((r) => !r.genre),
    byChannel, byGenre,
    junk: rows.filter((r) => r.status === "excluded").slice(0, 40).map((r) => `${r.artist} - ${r.title}`),
    noChannelSample: fresh.filter((r) => !r.channels.length).slice(0, 15).map((r) => `${r.artist} - ${r.title}  [${r.genre || "no genre"}]`),
  };
  const dir = path.dirname(manifestPath);
  fs.writeFileSync(path.join(dir, "plan.json"), JSON.stringify({ summary, rows }, null, 1));
  fs.writeFileSync(path.join(dir, "excluded.csv"), "artist,title,reason,file\n" + rows
    .filter((r) => r.status !== "new")
    .map((r) => [r.artist, r.title, r.reason, r.audioPath].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n"));
  out(summary);
}

async function upload(manifestPath) {
  const { channelList } = await import(pathToFileURL(path.join(__dirname, "classify.mjs")).href);
  const dir = path.dirname(manifestPath);
  const { summary, rows } = JSON.parse(fs.readFileSync(path.join(dir, "plan.json"), "utf8"));
  const todo = rows.filter((r) => r.status === "new");
  const ids = [];
  let ok = 0, failed = 0;
  const failures = [];
  const t0 = Date.now();
  for (let i = 0; i < todo.length; i++) {
    const r = todo[i];
    const eta = i ? (((Date.now() - t0) / i) * (todo.length - i) / 60000).toFixed(1) : "?";
    console.log(`[${i + 1}/${todo.length}] ${r.artist} - ${r.title}  (~${eta}m left)`);
    try {
      const audioDest = `audio/${r.audioFile}`;
      if ((await bucket.file(audioDest).exists())[0]) { console.log("  skip: storage object exists"); continue; }
      const audioUrl = await uploadFile(r.audioPath, audioDest);
      let coverUrl = null;
      if (r.coverPath && fs.existsSync(r.coverPath)) {
        const coverDest = `covers/${r.coverFile}`;
        coverUrl = (await bucket.file(coverDest).exists())[0]
          ? `https://storage.googleapis.com/${bucketName}/${coverDest}` : await uploadFile(r.coverPath, coverDest);
      }
      const ref = await db.collection("tracks").add({
        title: r.title, artist: r.artist || "", album: r.album || "", genre: r.genre,
        energy: parseInt(r.energy, 10) || 5, camelot: r.camelot || null, bpm: parseInt(r.bpm, 10) || null,
        duration: mp3Duration(r.audioPath), audioUrl, albumCover: coverUrl, color: r.color || "#8899aa",
        batch: r.batch,          // the field the app's channels read
        uploadBatch: r.batch,    // kept for the existing audit tools
        playCount: 0, skipCount: 0, likeCount: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      ids.push({ id: ref.id, audioUrl, row: r });
      ok++;
    } catch (e) {
      failed++; failures.push(`${r.artist} - ${r.title}: ${e.message}`);
      console.log("  FAILED: " + e.message);
    }
  }

  // Verify: re-read each doc, confirm fields, confirm the audio URL answers.
  console.log("\nVerifying...");
  const { classify } = await import(pathToFileURL(path.join(__dirname, "classify.mjs")).href);
  let verified = 0; const problems = []; const landed = {};
  for (const { id, audioUrl } of ids) {
    const d = (await db.collection("tracks").doc(id).get()).data();
    let good = d && d.batch && d.genre && d.audioUrl;
    try { const res = await fetch(audioUrl, { method: "HEAD" }); if (!res.ok) good = false; } catch (e) { good = false; }
    if (good) {
      verified++;
      classify([{ ...d, bpm: d.bpm, energy: d.energy }])[0].channels.forEach((c) => { landed[c] = (landed[c] || 0) + 1; });
    } else problems.push(id);
  }
  const result = { uploaded: ok, failed, verified, problems, failures: failures.slice(0, 20), landed,
    channel: summary.channel, batch: summary.batch };
  fs.writeFileSync(path.join(dir, "result.json"), JSON.stringify(result, null, 1));
  out(result);
}

const [mode, manifest] = process.argv.slice(2);
(mode === "plan" ? plan(manifest) : mode === "upload" ? upload(manifest) : Promise.reject(new Error("usage: run.js plan|upload <manifest>")))
  .then(() => process.exit(0))
  .catch((e) => { console.error("ERROR " + e.message); process.exit(1); });
