/**
 * Catalog junk / long-track audit (Node scripts + Jest).
 * Dry-run only — this module never writes to Firestore or Storage.
 *
 * Keep heuristics conservative: a real song with messy YouTube leftovers
 * (KEXP, “Official Video”, remix subtitles) must stay out of DELETE.
 */

const LONG_SECONDS = 20 * 60; // 20 minutes — “very long” cutoff
const APP_MIXTAPE_SECONDS = 15 * 60; // app already drops these from singles
const FULL_DUMP_SECONDS = 10 * 60; // full album/EP as one file
const ULTRA_SHORT_SECONDS = 30;
const TEASER_SECONDS = 90;

const UNKNOWN_ARTISTS = new Set([
  "",
  "unknown",
  "unknown artist",
  "n/a",
  "na",
  "-",
  "none",
  "null",
  "undefined",
]);

/** DJ / continuous sets Luke may want to keep. Not “Original Mix” / radio edits. */
const MIX_RE = /\b(dj\s*mix|dj\s*set|continuous\s+(mix|set)|essential\s+mix|boiler\s+room|mixset|club\s+set|radio\s+set|live\s+pa\s+set)\b/i;

const FULL_DUMP_RE =
  /\b(full\s+album(\s+stream)?|album\s+stream|entire\s+album|full\s+lp|full\s+ep(\s+stream)?|full\s+cassette|full\s+vinyl|debut\s+album)\b|\[\s*full(\s+ep)?\s*\]|\(\s*full\s*\)/i;

/**
 * High-confidence non-music (game guides, hotel tours, theory videos,
 * nature docs, spoken marketing). Do not use generic “walkthrough” /
 * “let’s play” — those false-positive real songs.
 */
const NON_MUSIC_RES = [
  /\bswitch\s+gameplay\b/i,
  /\b(untitled\s+)?goose\s+game\b/i,
  /\bmaplestory\b/i,
  /\bfamiliars\s+guide\b/i,
  /\btomb\s+raider(\s+\d+)?\b/i,
  /\bfilm\s+theory\b/i,
  /\bextra\s+history\b/i,
  /\bhistory\s+of\s+paper\s+money\b/i,
  /\bhotel\s+tour\b/i,
  /\bstegadons?\b/i,
  /\bdipole\s+repeller\b/i,
  /\bask\s+a\s+spaceman\b/i,
  /\bbathrobe\s+chronicles\b/i,
  /\bworld\s+of\s+the\s+dragonfly\b/i,
  /\bandnowuknow\b/i,
  /\bhow\s+to\s+read\s+an\s+architectural\b/i,
  /\bresidence\s+inn\b/i,
  /\bkicked\s+out\s+at\s+\d+/i,
  /\bmy\s+parents\s+don['’]t\s+know\b/i,
  /\balbum\s+lyrics\b/i,
  /\bsay\s+the\s+alphabet\b/i,
  /\bthings\s+to\s+do!/i,
  /\bbaloney\s+bob\b/i,
  /\bcartoon\s+planet\b/i,
  /\bcrafting\s+your\s+marketing\s+message\b/i,
  /\bsky\s+hunters,\s+the\s+world\b/i,
];

const BROKEN_TITLE_RE = /^(youtube|music video|official video|audio only|video)$/i;
const SWAPPED_ARTIST_RE = /\bofficial\s+(music\s+)?video\b/i;

function numDuration(track) {
  const d = track && track.duration;
  const n = typeof d === "number" ? d : parseFloat(d);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function uploadBatchOf(track) {
  const v = track && (track.uploadBatch || track.batch || track.source);
  return v == null ? "" : String(v).trim();
}

function haystack(track) {
  return [track && track.title, track && track.artist, track && track.album]
    .map((s) => String(s || ""))
    .join(" ");
}

function isUnknownArtist(artist) {
  return UNKNOWN_ARTISTS.has(String(artist ?? "").trim().toLowerCase());
}

function isIntentionalMix(title, artist) {
  const s = `${title || ""} ${artist || ""}`;
  if (MIX_RE.test(s)) return true;
  if (/\bmixtape\b/i.test(s) && !/\b(original|radio|extended|club|clean)\s+mix\b/i.test(s)) {
    return true;
  }
  return false;
}

function isFullAlbumDump(title, duration) {
  if (duration < FULL_DUMP_SECONDS) return false;
  return FULL_DUMP_RE.test(String(title || ""));
}

function isNonMusic(track) {
  const s = haystack(track);
  return NON_MUSIC_RES.some((re) => re.test(s));
}

function isTeaser(title, duration) {
  return duration > 0 && duration < TEASER_SECONDS && /\bteaser\b/i.test(String(title || ""));
}

function isBrokenMetadata(track) {
  const title = String((track && track.title) || "").trim();
  const artist = String((track && track.artist) || "").trim();
  if (BROKEN_TITLE_RE.test(title)) return true;
  if (SWAPPED_ARTIST_RE.test(artist) && title.length > 0) return true;
  return false;
}

function formatDuration(seconds) {
  const s = Math.round(Number(seconds) || 0);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
  return `${m}:${String(r).padStart(2, "0")}`;
}

function nameKey(track) {
  return `${String((track && track.title) || "").trim().toLowerCase()}|||${String(
    (track && track.artist) || ""
  )
    .trim()
    .toLowerCase()}`;
}

function createdAtMs(track) {
  const c = track && track.createdAt;
  if (!c) return 0;
  if (typeof c === "number" && Number.isFinite(c)) return c;
  if (typeof c === "string") {
    const ms = Date.parse(c);
    return Number.isFinite(ms) ? ms : 0;
  }
  if (typeof c.toMillis === "function") {
    try {
      return c.toMillis();
    } catch {
      return 0;
    }
  }
  if (typeof c.seconds === "number") return c.seconds * 1000;
  return 0;
}

/**
 * Extra copies of the same title+artist. Canonical = highest playCount,
 * then earliest createdAt, then smallest id.
 */
function findDuplicateExtraIds(tracks) {
  const groups = new Map();
  (tracks || []).forEach((t) => {
    const key = nameKey(t);
    if (!key || key === "|||") return;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(t);
  });
  const extras = new Set();
  groups.forEach((rows) => {
    if (rows.length < 2) return;
    const ranked = [...rows].sort((a, b) => {
      const pc = (Number(b.playCount) || 0) - (Number(a.playCount) || 0);
      if (pc) return pc;
      const ca = createdAtMs(a) - createdAtMs(b);
      if (ca) return ca;
      return String(a.id || "").localeCompare(String(b.id || ""));
    });
    ranked.slice(1).forEach((t) => {
      if (t && t.id) extras.add(String(t.id));
    });
  });
  return extras;
}

function pushReason(reasons, code, action, detail) {
  if (reasons.some((r) => r.code === code)) return;
  reasons.push({ code, action, detail });
}

function classifyTrack(track, ctx) {
  const duration = numDuration(track);
  const title = String((track && track.title) || "");
  const artist = String((track && track.artist) || "");
  const mix = isIntentionalMix(title, artist);
  const reasons = [];

  if (isNonMusic(track)) {
    pushReason(reasons, "NON_MUSIC", "delete", "Title/artist looks like a guide, gameplay, tour, documentary, or other non-song");
  }
  if (isFullAlbumDump(title, duration)) {
    pushReason(
      reasons,
      "FULL_ALBUM_DUMP",
      "delete",
      `Full album/EP/cassette language and duration ${formatDuration(duration)} (≥ ${FULL_DUMP_SECONDS / 60} min)`
    );
  }
  if (duration >= LONG_SECONDS) {
    if (mix) {
      pushReason(
        reasons,
        "MAYBE_KEEP_MIX",
        "review",
        `Duration ${formatDuration(duration)} (≥ ${LONG_SECONDS / 60} min) with DJ-mix / continuous-set language — keep unless Luke says otherwise`
      );
    } else {
      pushReason(
        reasons,
        "VERY_LONG",
        "delete",
        `Duration ${formatDuration(duration)} (≥ ${LONG_SECONDS / 60} min) and not an obvious DJ mix / continuous set`
      );
    }
  }
  if (duration > 0 && duration < ULTRA_SHORT_SECONDS) {
    pushReason(
      reasons,
      "ULTRA_SHORT",
      "review",
      `Duration ${formatDuration(duration)} (< ${ULTRA_SHORT_SECONDS}s) — confirm it is not a real micro-song`
    );
  }
  if (isTeaser(title, duration)) {
    pushReason(reasons, "TEASER", "delete", `Title contains “teaser” and duration ${formatDuration(duration)} (< ${TEASER_SECONDS}s)`);
  }
  if (isUnknownArtist(artist)) {
    pushReason(
      reasons,
      "UNKNOWN_ARTIST",
      "review",
      "Artist missing/Unknown — existing catalog:delete-unknown-artists would drop these; prefer fixing artist if it is a real cut"
    );
  }
  if (isBrokenMetadata(track)) {
    pushReason(
      reasons,
      "BROKEN_METADATA",
      "review",
      "Title/artist swapped or placeholder (YouTube / Official Music Video in the artist field) — fix metadata, do not delete if the audio is a real song"
    );
  }
  if (ctx && ctx.duplicateExtraIds && track && track.id && ctx.duplicateExtraIds.has(String(track.id))) {
    pushReason(reasons, "DUPLICATE", "review", "Extra copy of the same title+artist (keep one)");
  }

  if (!reasons.length) return null;

  const primary = reasons.find((r) => r.action === "delete") || reasons[0];
  return {
    id: String((track && track.id) || ""),
    title,
    artist,
    duration,
    durationLabel: formatDuration(duration),
    genre: String((track && track.genre) || ""),
    uploadBatch: uploadBatchOf(track),
    action: primary.action,
    reason: primary.code,
    extraReasons: reasons.slice(1).map((r) => r.code).join("|"),
    reasons: reasons.map((r) => r.code),
    detail: reasons.map((r) => r.detail).join("; "),
  };
}

function auditCatalog(tracks) {
  const list = Array.isArray(tracks) ? tracks : [];
  const duplicateExtraIds = findDuplicateExtraIds(list);
  const candidates = [];
  list.forEach((t) => {
    const row = classifyTrack(t, { duplicateExtraIds });
    if (row) candidates.push(row);
  });
  candidates.sort((a, b) => {
    if (a.action !== b.action) return a.action === "delete" ? -1 : 1;
    if (a.reason !== b.reason) return a.reason.localeCompare(b.reason);
    return (b.duration || 0) - (a.duration || 0);
  });

  const deletes = candidates.filter((c) => c.action === "delete");
  const reviews = candidates.filter((c) => c.action === "review");
  const mixes = candidates.filter((c) => c.reasons.includes("MAYBE_KEEP_MIX"));
  const longTracks = list.filter((t) => numDuration(t) >= LONG_SECONDS);
  const appMixtapeBand = list.filter((t) => numDuration(t) >= APP_MIXTAPE_SECONDS);

  const byReason = {};
  candidates.forEach((c) => {
    c.reasons.forEach((code) => {
      byReason[code] = (byReason[code] || 0) + 1;
    });
  });

  return {
    total: list.length,
    candidates,
    deletes,
    reviews,
    mixes,
    longTracks,
    appMixtapeBand,
    byReason,
    criteria: {
      longSeconds: LONG_SECONDS,
      appMixtapeSeconds: APP_MIXTAPE_SECONDS,
      fullDumpSeconds: FULL_DUMP_SECONDS,
      ultraShortSeconds: ULTRA_SHORT_SECONDS,
      teaserSeconds: TEASER_SECONDS,
    },
  };
}

function csvEscape(v) {
  const s = String(v ?? "");
  return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
}

function candidatesToCsv(candidates) {
  const header = [
    "id",
    "title",
    "artist",
    "duration",
    "duration_label",
    "genre",
    "uploadBatch",
    "action",
    "reason",
    "extra_reasons",
    "detail",
  ];
  const lines = [header.join(",")];
  (candidates || []).forEach((c) => {
    lines.push(
      [
        c.id,
        csvEscape(c.title),
        csvEscape(c.artist),
        c.duration,
        c.durationLabel,
        csvEscape(c.genre),
        csvEscape(c.uploadBatch),
        c.action,
        c.reason,
        csvEscape(c.extraReasons),
        csvEscape(c.detail),
      ].join(",")
    );
  });
  return lines.join("\n") + "\n";
}

function examplesFor(candidates, code, n) {
  const rows = (candidates || []).filter((c) => c.reasons.includes(code));
  return rows.slice(0, n || 8);
}

function renderMarkdownReport(result, meta) {
  const fetchedAt = (meta && meta.fetchedAt) || new Date().toISOString();
  const source = (meta && meta.source) || "unknown";
  const c = result.criteria;
  const top = (code) => {
    const rows = examplesFor(result.candidates, code, 8);
    if (!rows.length) return "_None._\n";
    return (
      rows
        .map(
          (r) =>
            `- \`${r.id}\` · **${r.durationLabel}** · ${r.title.replace(/\|/g, "/")} — ${r.artist.replace(/\|/g, "/")} · \`${r.action}\``
        )
        .join("\n") + "\n"
    );
  };

  const longAppendix = [...result.appMixtapeBand]
    .sort((a, b) => numDuration(b) - numDuration(a))
    .map((t) => {
      const d = numDuration(t);
      const row = result.candidates.find((c2) => c2.id === String(t.id));
      const flag = row ? `${row.action}/${row.reason}` : "keep";
      return `| ${formatDuration(d)} | ${String(t.title || "").replace(/\|/g, "/")} | ${String(t.artist || "").replace(/\|/g, "/")} | ${flag} | \`${t.id}\` |`;
    })
    .join("\n");

  return `# Planet MP3 catalog junk audit (dry-run)

**Status: no Firestore or Storage deletes were applied.**

Fetched: \`${fetchedAt}\`  
Source: \`${source}\`  
Catalog size: **${result.total}** tracks

## Counts

| Bucket | Count |
|---|---|
| Total tracks | ${result.total} |
| Candidate **deletes** | ${result.deletes.length} |
| Long tracks (≥ ${c.longSeconds / 60} min) | ${result.longTracks.length} |
| Ambiguous **maybe keep** (DJ mix / continuous set) | ${result.mixes.length} |
| Review (fix metadata / confirm, do not auto-delete) | ${result.reviews.length} |
| App mixtape band (≥ ${c.appMixtapeSeconds / 60} min, already excluded from singles) | ${result.appMixtapeBand.length} |
| All flagged rows (delete + review) | ${result.candidates.length} |

### Reason codes

${Object.keys(result.byReason)
  .sort()
  .map((k) => `- \`${k}\`: ${result.byReason[k]}`)
  .join("\n") || "- _None._"}

## Criteria

- **Very long:** duration ≥ **${c.longSeconds / 60} minutes** (${c.longSeconds}s). Album-length files that are not an obvious DJ mix / continuous set are recommended **delete**.
- **DJ mix / maybe keep:** same duration cutoff **and** mix language (\`dj mix\`, \`dj set\`, \`continuous mix/set\`, \`essential mix\`, \`boiler room\`, \`mixtape\`, \`mixset\`, \`club set\`, \`radio set\`). “Original Mix” / radio edits of singles do **not** count.
- **Full album/EP dump:** title looks like a full album/EP/cassette/vinyl stream **and** duration ≥ **${c.fullDumpSeconds / 60} minutes** (even if under 20 min).
- **Non-music:** high-confidence guides, gameplay, hotel tours, theory/history videos, nature docs, spoken marketing, alphabet drills, lyric-dump files. Generic words like “walkthrough” or “let’s play” are **not** used (too many real songs).
- **Teaser:** title contains “teaser” and duration < ${c.teaserSeconds}s.
- **Ultra-short:** duration < ${c.ultraShortSeconds}s → **review** only (grindcore / real micro-songs exist).
- **Unknown artist / broken metadata / duplicates:** **review** (fix tags or keep one copy). Not auto-delete.

The app already treats duration > ${c.appMixtapeSeconds}s as a mixtape (hidden from artist/album “singles”). This audit’s delete cutoff is stricter (20 min) so André 3000 / KEXP medleys in the 15–20 min band stay unless they also match dump/non-music language.

## Top examples per reason

### NON_MUSIC (delete)

${top("NON_MUSIC")}

### FULL_ALBUM_DUMP (delete)

${top("FULL_ALBUM_DUMP")}

### VERY_LONG (delete)

${top("VERY_LONG")}

### TEASER (delete)

${top("TEASER")}

### MAYBE_KEEP_MIX (review — do not delete)

${top("MAYBE_KEEP_MIX")}

### UNKNOWN_ARTIST (review)

${top("UNKNOWN_ARTIST")}

### BROKEN_METADATA (review)

${top("BROKEN_METADATA")}

### DUPLICATE (review)

${top("DUPLICATE")}

### ULTRA_SHORT (review)

${top("ULTRA_SHORT")}

## Next step for Luke

1. Skim this report and the CSV (\`docs/audits/catalog-junk-candidates.csv\`).
2. Reply **yes / approve deletes** on the PR (or list ids to drop / keep).
3. A follow-up run can apply Firestore deletes (and optional Storage purge) **only after that approval**.

This script has **no \`--apply\` path**. Do not invent one locally unless you are in the approved follow-up.

Local re-run (public catalog read; no service account required):

\`\`\`bash
npm run catalog:audit-junk
\`\`\`

If Firestore REST is blocked, put \`serviceAccountKey.json\` in the repo root (gitignored) and re-run; the script will use Admin SDK read.

## Appendix — every track ≥ ${c.appMixtapeSeconds / 60} min

| Duration | Title | Artist | Flag | id |
|---|---|---|---|---|
${longAppendix || "| _none_ | | | | |"}
`;
}

const DEFAULT_BUCKETS = new Set([
  "crate-app-58494.firebasestorage.app",
  "crate-app-58494.appspot.com",
]);

function parseCsvLine(line) {
  const values = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < String(line || "").length; i += 1) {
    const c = line[i];
    if (c === '"') {
      if (inQ && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else {
        inQ = !inQ;
      }
    } else if (c === "," && !inQ) {
      values.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  values.push(cur);
  return values;
}

/** Approved delete ids from a candidates CSV (`action=delete` only). */
function parseApprovedDeleteIds(csvText) {
  const lines = String(csvText || "").split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const header = parseCsvLine(lines[0]).map((h) => h.trim());
  const idIdx = header.indexOf("id");
  const actionIdx = header.indexOf("action");
  if (idIdx === -1 || actionIdx === -1) return [];
  const ids = [];
  lines.slice(1).forEach((line) => {
    const cols = parseCsvLine(line);
    if (String(cols[actionIdx] || "").trim() !== "delete") return;
    const id = String(cols[idIdx] || "").trim();
    if (id) ids.push(id);
  });
  return ids;
}

function storageObjectPathFromUrl(url, allowedBuckets = DEFAULT_BUCKETS) {
  const raw = String(url || "").trim();
  if (!raw) return null;
  try {
    const u = new URL(raw);
    if (u.hostname === "storage.googleapis.com") {
      const parts = u.pathname.replace(/^\/+/, "").split("/");
      const bucket = decodeURIComponent(parts.shift() || "");
      const objectPath = parts.map((p) => decodeURIComponent(p)).join("/");
      if (!allowedBuckets.has(bucket) || !objectPath) return null;
      return { bucket, path: objectPath };
    }
    if (u.hostname === "firebasestorage.googleapis.com") {
      const m = u.pathname.match(/\/v0\/b\/([^/]+)\/o\/(.+)$/);
      if (!m) return null;
      const bucket = decodeURIComponent(m[1]);
      const objectPath = decodeURIComponent(m[2]);
      if (!allowedBuckets.has(bucket) || !objectPath) return null;
      return { bucket, path: objectPath };
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Live `action=delete` rows that also appear in the approved CSV.
 * Review rows (unknown artist, broken metadata, duplicates) are never included.
 */
function planJunkApply(tracks, approvedDeleteIds) {
  const approved = new Set((approvedDeleteIds || []).map(String));
  const result = auditCatalog(tracks);
  const liveDeleteIds = result.deletes.map((c) => c.id);
  const targets = result.deletes.filter((c) => approved.has(c.id));
  const targetIds = new Set(targets.map((c) => c.id));
  const skippedNotApproved = result.deletes.filter((c) => !approved.has(c.id));
  const approvedMissing = [...approved].filter((id) => !liveDeleteIds.includes(id));

  const remaining = (tracks || []).filter((t) => t && t.id && !targetIds.has(String(t.id)));
  const stillUsed = new Set();
  remaining.forEach((t) => {
    const audio = storageObjectPathFromUrl(t.audioUrl);
    const cover = storageObjectPathFromUrl(t.albumCover);
    if (audio) stillUsed.add(audio.path);
    if (cover) stillUsed.add(cover.path);
  });

  const byPath = new Map();
  (tracks || []).forEach((t) => {
    if (!t || !targetIds.has(String(t.id))) return;
    ["audioUrl", "albumCover"].forEach((field) => {
      const parsed = storageObjectPathFromUrl(t[field]);
      if (!parsed) return;
      const kind = field === "audioUrl" ? "audio" : "cover";
      const existing = byPath.get(parsed.path) || {
        bucket: parsed.bucket,
        path: parsed.path,
        kind,
        skipped: false,
        reason: "",
      };
      if (stillUsed.has(parsed.path)) {
        existing.skipped = true;
        existing.reason = "still referenced by a kept track";
      }
      byPath.set(parsed.path, existing);
    });
  });

  return {
    result,
    targets,
    skippedNotApproved,
    approvedMissing,
    storage: [...byPath.values()],
  };
}

module.exports = {
  LONG_SECONDS,
  APP_MIXTAPE_SECONDS,
  FULL_DUMP_SECONDS,
  ULTRA_SHORT_SECONDS,
  TEASER_SECONDS,
  numDuration,
  uploadBatchOf,
  isUnknownArtist,
  isIntentionalMix,
  isFullAlbumDump,
  isNonMusic,
  isTeaser,
  isBrokenMetadata,
  formatDuration,
  findDuplicateExtraIds,
  classifyTrack,
  auditCatalog,
  candidatesToCsv,
  renderMarkdownReport,
  parseCsvLine,
  parseApprovedDeleteIds,
  storageObjectPathFromUrl,
  planJunkApply,
};
