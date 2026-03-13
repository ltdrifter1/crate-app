// upload-tracks.js
// ─────────────────────────────────────────────────────────────────────────────
// Run this once to upload all your tracks to Firebase.
// HOW TO RUN:  node upload-tracks.js
// ─────────────────────────────────────────────────────────────────────────────

const admin = require("firebase-admin");
const fs    = require("fs");
const path  = require("path");

// ── Startup checks ────────────────────────────────────────────────────────
if (!fs.existsSync(path.join(__dirname, "serviceAccountKey.json"))) {
  console.error("\n❌  serviceAccountKey.json not found.");
  console.error("    Download it from: Firebase Console → Project Settings → Service Accounts\n");
  process.exit(1);
}
if (!fs.existsSync(path.join(__dirname, "tracks.csv"))) {
  console.error("\n❌  tracks.csv not found.\n");
  process.exit(1);
}

const serviceAccount = require("./serviceAccountKey.json");
const projectId      = serviceAccount.project_id;
const bucketName     = `${projectId}.firebasestorage.app`;

admin.initializeApp({
  credential:    admin.credential.cert(serviceAccount),
  storageBucket: bucketName,
});

const db     = admin.firestore();
const bucket = admin.storage().bucket();

// ── Helper: read MP3 duration in seconds ──────────────────────────────────
// Reads the MPEG frame header to get duration without any external libraries.
// Falls back to null if the file isn't a standard MP3.
function getMp3Duration(filePath) {
  try {
    const buf = fs.readFileSync(filePath);
    // Look for ID3v2 tag to skip it
    let offset = 0;
    if (buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33) { // "ID3"
      const id3Size = ((buf[6] & 0x7f) << 21) | ((buf[7] & 0x7f) << 14) |
                      ((buf[8] & 0x7f) << 7)  |  (buf[9] & 0x7f);
      offset = id3Size + 10;
    }
    // Find first valid MPEG sync frame
    for (let i = offset; i < Math.min(offset + 8192, buf.length - 4); i++) {
      if (buf[i] === 0xff && (buf[i+1] & 0xe0) === 0xe0) {
        const b1 = buf[i+1], b2 = buf[i+2];
        const versionBits  = (b1 >> 3) & 0x3;
        const layerBits    = (b1 >> 1) & 0x3;
        const bitrateBits  = (b2 >> 4) & 0xf;
        const sampleBits   = (b2 >> 2) & 0x3;

        const bitrateTable = [
          null,
          [0,32,64,96,128,160,192,224,256,288,320,352,384,416,448,null], // L1
          [0,32,48,56,64,80,96,112,128,160,192,224,256,320,384,null],    // L2
          [0,32,40,48,56,64,80,96,112,128,160,192,224,256,320,null],     // L3
        ];
        const sampleRateTable = {3:[44100,48000,32000], 2:[22050,24000,16000], 0:[11025,12000,8000]};

        const layer     = 4 - layerBits;
        const bitrate   = bitrateTable[layer]?.[bitrateBits];
        const sampleRate = sampleRateTable[versionBits]?.[sampleBits];

        if (bitrate && sampleRate) {
          const fileSizeBytes = fs.statSync(filePath).size;
          const durationSecs  = Math.round((fileSizeBytes * 8) / (bitrate * 1000));
          if (durationSecs > 0 && durationSecs < 86400) return durationSecs;
        }
        break;
      }
    }
  } catch(e) {}
  return null;
}

// ── Helper: upload file to Storage, return public URL ─────────────────────
async function uploadFile(localPath, destPath, contentType) {
  if (!fs.existsSync(localPath)) throw new Error(`File not found: ${localPath}`);
  const mb = (fs.statSync(localPath).size / 1024 / 1024).toFixed(1);
  process.stdout.write(`Uploading (${mb} MB)... `);
  await bucket.upload(localPath, {
    destination: destPath,
    metadata: { contentType, cacheControl: "public, max-age=31536000" },
  });
  await bucket.file(destPath).makePublic();
  console.log("✓");
  return `https://storage.googleapis.com/${bucketName}/${destPath}`;
}

function getContentType(filename) {
  const ext = path.extname(filename).toLowerCase();
  return { ".mp3":"audio/mpeg",".m4a":"audio/mp4",".wav":"audio/wav",".flac":"audio/flac",
           ".jpg":"image/jpeg",".jpeg":"image/jpeg",".png":"image/png",".webp":"image/webp" }[ext] || "application/octet-stream";
}

function parseCSV(text) {
  const lines   = text.trim().split("\n").filter(l => l.trim());
  const headers = lines[0].split(",").map(h => h.trim());
  return lines.slice(1).map((line, idx) => {
    const values = []; let cur = ""; let inQ = false;
    for (const c of line) {
      if (c === '"') { inQ = !inQ; }
      else if (c === "," && !inQ) { values.push(cur.trim()); cur = ""; }
      else { cur += c; }
    }
    values.push(cur.trim());
    const obj = { _line: idx + 2 };
    headers.forEach((h, i) => { obj[h] = (values[i] || "").trim(); });
    return obj;
  });
}

// ── Main ──────────────────────────────────────────────────────────────────
async function uploadTracks() {
  const rows      = parseCSV(fs.readFileSync("tracks.csv", "utf8")).filter(r => r.title && r.audioFile);
  const startTime = Date.now();

  if (!rows.length) { console.error("\n❌  No valid rows in tracks.csv\n"); process.exit(1); }

  console.log(`\n📦  Found ${rows.length} track(s) in tracks.csv`);
  console.log(`    Project: ${projectId}  |  Bucket: ${bucketName}\n`);
  console.log("─".repeat(60));

  let ok = 0, fail = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const elapsed  = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    const eta      = i > 0 ? ((Date.now() - startTime) / i * (rows.length - i) / 1000 / 60).toFixed(1) : "?";
    console.log(`\n  [${i+1}/${rows.length}] ${row.title} — ${row.artist||"Unknown"}  (${elapsed}m elapsed, ~${eta}m left)`);

    try {
      // Audio
      process.stdout.write("    Audio:  ");
      const audioPath = path.join(__dirname, "audio", row.audioFile);
      const audioUrl  = await uploadFile(audioPath, `audio/${row.audioFile}`, getContentType(row.audioFile));

      // Read duration from the actual MP3 file
      const duration = getMp3Duration(audioPath);
      if (duration) console.log(`    Duration: ${Math.floor(duration/60)}m ${duration%60}s${duration>900?" 🎛️  (mixtape!)":""}`);

      // Cover
      let coverUrl = null;
      if (row.coverFile) {
        process.stdout.write("    Cover:  ");
        coverUrl = await uploadFile(path.join(__dirname, "covers", row.coverFile), `covers/${row.coverFile}`, getContentType(row.coverFile));
      }

      // Save to Firestore
      process.stdout.write("    Saving... ");
      await db.collection("tracks").add({
        title:      row.title,
        artist:     row.artist      || "",
        album:      row.album       || "",
        genre:      row.genre       || "",
        energy:     parseInt(row.energy) || 5,
        camelot:    row.camelot     || null,
        bpm:        parseInt(row.bpm)    || null,
        duration:   duration,            // ← seconds, used for Mixtapes filter
        audioUrl:   audioUrl,
        albumCover: coverUrl,
        color:      row.color       || "#8899aa",
        playCount:  0,
        skipCount:  0,
        likeCount:  0,
        createdAt:  admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log("✓");
      ok++;

    } catch(err) {
      console.log(`\n    ❌  Failed: ${err.message}`);
      console.log("    Skipping and continuing...");
      fail++;
    }
  }

  const totalMin = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log("\n" + "─".repeat(60));
  console.log(`\n✅  Done in ${totalMin} minutes! ${ok} uploaded, ${fail} failed.`);
  if (fail > 0) console.log(`⚠️   Run again to retry failed tracks — already-uploaded ones are skipped.`);
  console.log(`\n  Files:  https://console.firebase.google.com/project/${projectId}/storage`);
  console.log(`  Tracks: https://console.firebase.google.com/project/${projectId}/firestore\n`);
}

uploadTracks().catch(err => {
  console.error("\n❌  Unexpected error:", err.message);
  process.exit(1);
});
