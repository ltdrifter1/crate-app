import { useMemo, useRef, useState } from "react";
import { collection, deleteDoc, doc, getDocs, orderBy, query, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import Icon from "../components/ui/Icon";
import VirtualList from "../components/ui/VirtualList";
import { AlbumArt } from "../components/listen/AlbumArt";
import { BrandGlyph as DoorGlyph } from "../components/brand/BrandMark";
import { computeSignalTraits } from "../lib/engine";
import { enrichTracksWithScenes } from "../lib/scenes";
import { normalizeGenre } from "../lib/genres";
import { COMMUNITY_MIX_TITLE, formatMonthLabel, isCommunityPlaylist } from "../lib/mixes";
import {
  BTN_PRIMARY,
  BTN_SECONDARY,
  INPUT_ST,
  color,
  fontDisplay,
  glass,
  radius,
} from "../theme";

const SectionLabel = ({ children, style = {} }) => (
  <div style={{ fontSize: 13, fontWeight: 650, letterSpacing: -0.2, color: color.ink, marginBottom: 12, fontFamily: fontDisplay, ...style }}>
    {children}
  </div>
);

// ─── ANALYTICS ROW ───────────────────────────────────────────────────────────
function AnalyticsRow({ rank, track, value, label, max, color: trackColor, accent }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:10, padding:"12px 14px",
      background: `
        linear-gradient(165deg, rgba(38,43,51,0.8) 0%, rgba(28,32,38,0.48) 100%)
      `,
      borderRadius: radius.lg,
      marginBottom: 6,
      border:`1px solid ${glass.borderSoft}`,
      boxShadow: `inset 0 1px 0 ${glass.highlight}`,
      backdropFilter: glass.blurSoft,
      WebkitBackdropFilter: glass.blurSoft,
    }}>
      <div style={{ width:22, textAlign:"right", fontSize:14, fontWeight:700, color: color.faint, flexShrink:0 }}>{rank}</div>
      <div style={{ width:36, height:36, borderRadius: radius.sm, overflow:"hidden", flexShrink:0, border: `1px solid ${glass.borderSoft}` }}>
        <AlbumArt track={track} size={36} borderRadius={radius.sm}/>
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:14, fontWeight:600, color: color.ink, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{track.title}</div>
        <div style={{
          marginTop:6,
          background: "rgba(18,20,26,0.08)",
          borderRadius:999,
          height:4,
          overflow:"hidden",
          boxShadow: "inset 0 1px 1px rgba(18,20,26,0.08)",
        }}>
          <div style={{ height:"100%", width:`${pct}%`, borderRadius:999, background: accent || trackColor || color.accent, transition:"width 0.4s ease" }}/>
        </div>
      </div>
      <div style={{ flexShrink:0, textAlign:"right" }}>
        <div style={{ fontSize:18, fontWeight:700, color:accent, letterSpacing:-0.3 }}>{value}</div>
        <div style={{ fontSize:10, color: color.faint, fontWeight:600 }}>{label}</div>
      </div>
    </div>
  );
}

// ─── ADMIN ────────────────────────────────────────────────────────────────────
export default function AdminScreen({
  tracks, setTracks, tab, setTab, editTrack, setEditTrack, showToast,
  userPlaylists = [], communityMix = null, onPublishCommunityMix = null,
}) {
  const EMPTY = { title:"",artist:"",album:"",genre:"",energy:"",camelot:"",bpm:"",albumCover:"",videoUrl:"" };
  const [nt, setNt] = useState(EMPTY);
  const [assigning, setAssigning] = useState(false);
  const [assigned, setAssigned] = useState(0);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState("");
  const [deletingUnknown, setDeletingUnknown] = useState(false);
  const fileInputRef = useRef(null);
  const [clubCurator, setClubCurator] = useState("");
  const publishable = (userPlaylists || []).filter((p) => !isCommunityPlaylist(p) && (p.trackIds || []).length > 0);

  function isUnknownArtist(artist) {
    const a = String(artist ?? "").trim().toLowerCase();
    return !a || a === "unknown" || a === "unknown artist" || a === "n/a" || a === "na" || a === "-" || a === "none";
  }

  const unknownArtistTracks = useMemo(
    () => tracks.filter((t) => isUnknownArtist(t.artist)),
    [tracks]
  );

  async function deleteTrackDoc(trackId) {
    await deleteDoc(doc(db, "tracks", trackId));
    setTracks((ts) => ts.filter((tr) => tr.id !== trackId));
  }

  async function handleDeleteTrack(t) {
    if (!t?.id) return;
    if (!window.confirm(`Delete “${t.title || t.id}” permanently?`)) return;
    try {
      await deleteTrackDoc(t.id);
      showToast("Deleted");
    } catch (e) {
      console.error("Delete failed", e);
      showToast("Delete failed: " + (e.code || e.message || "unknown error"));
    }
  }

  async function handleDeleteUnknownArtists() {
    if (!unknownArtistTracks.length || deletingUnknown) return;
    if (!window.confirm(`Permanently delete ${unknownArtistTracks.length} track${unknownArtistTracks.length === 1 ? "" : "s"} with Unknown artist?`)) return;
    setDeletingUnknown(true);
    let deleted = 0;
    let errors = 0;
    for (const t of unknownArtistTracks) {
      try {
        await deleteTrackDoc(t.id);
        deleted += 1;
      } catch (e) {
        console.error("Delete unknown failed", t.id, e);
        errors += 1;
      }
    }
    setDeletingUnknown(false);
    showToast(errors
      ? `Deleted ${deleted}, ${errors} failed`
      : `Deleted ${deleted} unknown-artist track${deleted === 1 ? "" : "s"}`);
  }

  // ── CSV EXPORT ──
  function exportCSV() {
    const fields = ["id","title","artist","album","genre","energy","camelot","bpm","audioUrl","albumCover","videoUrl","color","duration","batch","source"];
    const escape = v => {
      const s = String(v ?? "");
      return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g,'""')}"` : s;
    };
    const rows = [fields.join(",")];
    tracks.forEach(t => {
      rows.push(fields.map(f => escape(t[f])).join(","));
    });
    const blob = new Blob([rows.join("\n")], { type:"text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `4am-tracks-${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    showToast(`Exported ${tracks.length} tracks`);
  }

  // ── CSV IMPORT ──
  // Prefer match by `id` so title/artist renames stick. Fall back to title+artist.
  async function importCSV(file) {
    setImporting(true); setImportProgress("Reading file...");
    const text = await file.text();
    const lines = text.split("\n").filter(l => l.trim());
    if (lines.length < 2) { showToast("CSV appears empty"); setImporting(false); return; }

    const header = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
    const titleIdx = header.indexOf("title");
    const artistIdx = header.indexOf("artist");
    if (titleIdx === -1 || artistIdx === -1) {
      showToast("CSV must have 'title' and 'artist' columns");
      setImporting(false); return;
    }

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const vals = parseCSVLine(lines[i]);
      if (!vals[titleIdx]?.trim()) continue;
      const row = {};
      header.forEach((h, idx) => { row[h] = (vals[idx] || "").trim(); });
      rows.push(row);
    }

    setImportProgress(`Parsed ${rows.length} rows. Writing to Firestore...`);

    const byId = {};
    const byName = {};
    tracks.forEach(t => {
      byId[t.id] = t;
      byName[`${(t.title||"").toLowerCase()}|||${(t.artist||"").toLowerCase()}`] = t;
    });

    let updated = 0, created = 0, errors = 0, skipped = 0;
    const cols = ["#EAE7DC","#C4BFB0","#B8B4A8","#8E8A80","#D8D4C8","#A8A498","#6E6A60"];

    function fieldUpdates(r) {
      const updates = {};
      if (r.title != null && String(r.title).trim() !== "") updates.title = String(r.title).trim();
      if (r.artist != null && String(r.artist).trim() !== "") updates.artist = String(r.artist).trim();
      if (r.album != null && String(r.album).trim() !== "") updates.album = String(r.album).trim();
      if (r.genre != null && String(r.genre).trim() !== "") updates.genre = normalizeGenre(r.genre) || String(r.genre).trim();
      if (r.camelot != null && String(r.camelot).trim() !== "") updates.camelot = String(r.camelot).trim();
      if (r.bpm && !isNaN(parseInt(r.bpm, 10))) updates.bpm = parseInt(r.bpm, 10);
      if (r.energy && !isNaN(parseInt(r.energy, 10))) updates.energy = parseInt(r.energy, 10);
      const audioUrl = r.audiourl || r.audioUrl;
      if (audioUrl && String(audioUrl).trim()) updates.audioUrl = String(audioUrl).trim();
      const albumCover = r.albumcover || r.albumCover;
      if (albumCover && String(albumCover).trim()) updates.albumCover = String(albumCover).trim();
      if (r.color && String(r.color).trim()) updates.color = String(r.color).trim();
      if (r.duration && !isNaN(parseFloat(r.duration))) updates.duration = parseFloat(r.duration);
      if (r.batch != null && String(r.batch).trim() !== "") updates.batch = String(r.batch).trim();
      if (r.source != null && String(r.source).trim() !== "") updates.source = String(r.source).trim();
      return updates;
    }

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const id = (r.id || "").trim();
      const matchById = id ? byId[id] : null;
      const matchByName = byName[`${(r.title||"").toLowerCase()}|||${(r.artist||"").toLowerCase()}`];
      const match = matchById || (!id ? matchByName : null);

      try {
        if (match) {
          const updates = fieldUpdates(r);
          if (Object.keys(updates).length === 0) { skipped++; continue; }
          await updateDoc(doc(db, "tracks", match.id), updates);
          setTracks(prev => prev.map(t => t.id === match.id ? { ...t, ...updates } : t));
          // Keep lookups fresh for later rows
          byId[match.id] = { ...match, ...updates };
          updated++;
        } else if (id) {
          const trackData = {
            title: r.title || "", artist: r.artist || "", album: r.album || "",
            genre: normalizeGenre(r.genre) || "", camelot: r.camelot || "",
            energy: parseInt(r.energy, 10) || 5, bpm: parseInt(r.bpm, 10) || null,
            audioUrl: r.audiourl || r.audioUrl || "", albumCover: r.albumcover || r.albumCover || "",
            color: r.color || cols[Math.floor(Math.random() * cols.length)],
            duration: parseFloat(r.duration) || 0,
            ...(r.batch ? { batch: String(r.batch).trim() } : {}),
            ...(r.source ? { source: String(r.source).trim() } : {}),
            likeCount: 0, playCount: 0, skipCount: 0,
          };
          await setDoc(doc(db, "tracks", id), trackData, { merge: true });
          byId[id] = { ...trackData, id };
          created++;
        } else {
          const trackData = {
            title: r.title || "", artist: r.artist || "", album: r.album || "",
            genre: normalizeGenre(r.genre) || "", camelot: r.camelot || "",
            energy: parseInt(r.energy, 10) || 5, bpm: parseInt(r.bpm, 10) || null,
            audioUrl: r.audiourl || r.audioUrl || "", albumCover: r.albumcover || r.albumCover || "",
            color: r.color || cols[Math.floor(Math.random() * cols.length)],
            duration: parseFloat(r.duration) || 0,
            ...(r.batch ? { batch: String(r.batch).trim() } : {}),
            ...(r.source ? { source: String(r.source).trim() } : {}),
            createdAt: new Date(), likeCount: 0, playCount: 0, skipCount: 0,
          };
          const newId = `import_${Date.now()}_${i}`;
          await setDoc(doc(db, "tracks", newId), trackData);
          created++;
        }
      } catch(e) {
        console.error("Import error row", i, e);
        errors++;
      }

      if (i % 10 === 0) setImportProgress(`Processing ${i+1}/${rows.length}... (${updated} updated, ${created} created)`);
    }

    setImportProgress("Reloading library...");
    try {
      const q2 = query(collection(db, "tracks"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q2);
      const loaded = snap.docs.map(d => ({ ...d.data(), id: d.id, liked: false }));
      setTracks(computeSignalTraits(enrichTracksWithScenes(loaded)));
    } catch(e) {}

    setImporting(false);
    setImportProgress("");
    showToast(`Import done: ${updated} updated, ${created} created${skipped ? `, ${skipped} unchanged` : ""}${errors ? `, ${errors} errors` : ""}`);
  }

  // Simple CSV line parser that handles quoted fields
  function parseCSVLine(line) {
    const result = []; let current = ""; let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (inQuotes) {
        if (c === '"' && line[i+1] === '"') { current += '"'; i++; }
        else if (c === '"') { inQuotes = false; }
        else { current += c; }
      } else {
        if (c === '"') { inQuotes = true; }
        else if (c === ',') { result.push(current); current = ""; }
        else { current += c; }
      }
    }
    result.push(current);
    return result;
  }
  const addTrack = () => {
    if (!nt.title||!nt.artist) { showToast("Title and artist required"); return; }
    const cols = ["#EAE7DC","#C4BFB0","#B8B4A8","#8E8A80","#D8D4C8","#A8A498","#6E6A60"];
    setTracks(ts=>[...ts,{ id:Date.now(),...nt,energy:parseInt(nt.energy)||5,bpm:parseInt(nt.bpm)||null,liked:false,color:cols[Math.floor(Math.random()*cols.length)] }]);
    setNt(EMPTY); showToast("Track added");
  };
  return (
    <div style={{ padding:"24px 16px 16px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
        <DoorGlyph size={28} title="" />
        <div style={{ fontSize:28, fontWeight:700, letterSpacing:-0.5, color: color.ink, fontFamily: fontDisplay }}>Admin</div>
      </div>
      <div style={{ display:"flex", gap:6, marginBottom:20, background: color.surfaceSolid, borderRadius:12, padding:3, border:`1px solid ${color.line}` }}>
        {["tracks","analytics","audit","club"].map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{ flex:1, padding:"8px 0", borderRadius:10, border:"none", cursor:"pointer", fontSize:13, fontWeight:600, textTransform:"capitalize", background:tab===t? color.accent:"transparent", color:tab===t? color.onAccent: color.muted, boxShadow:"none" }}>
            {t.charAt(0).toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>
      {tab==="tracks"&&(
        <div>
          {editTrack&&(
            <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", backdropFilter:"blur(8px)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
              <div style={{
                background: `
                  linear-gradient(165deg, rgba(48,53,62,0.9) 0%, rgba(28,32,38,0.72) 100%)
                `,
                borderRadius: radius.xl,
                padding:24,
                width:"100%",
                maxWidth:380,
                boxShadow: `inset 0 1px 0 ${glass.highlight}, ${glass.shadowLift}`,
                border:`1px solid rgba(255,255,255,0.14)`,
                backdropFilter: glass.blur,
                WebkitBackdropFilter: glass.blur,
              }}>
                <div style={{ fontSize:18, fontWeight:600, color: color.ink, marginBottom:16 }}>Edit Track</div>
                {[["title","Title"],["artist","Artist"],["album","Album"],["genre","Genre"],["energy","Energy (1–10)"],["camelot","Camelot Key"],["bpm","BPM"],["albumCover","Cover URL"],["videoUrl","Video URL (MP4/WebM)"]].map(([k,p])=>(
                  <input key={k} placeholder={p} value={editTrack[k]||""} onChange={e=>setEditTrack(t=>({...t,[k]:e.target.value}))} style={{...INPUT_ST,marginBottom:8}}/>
                ))}
                <div style={{ display:"flex", gap:8, marginTop:8 }}>
                  <button onClick={async()=>{
                    const updated = {...editTrack, energy:parseInt(editTrack.energy)||5, bpm:parseInt(editTrack.bpm)||null};
                    try {
                      await updateDoc(doc(db,"tracks",editTrack.id), {
                        title:updated.title, artist:updated.artist, album:updated.album,
                        genre:updated.genre, energy:updated.energy, camelot:updated.camelot,
                        bpm:updated.bpm, albumCover:updated.albumCover,
                        videoUrl: updated.videoUrl || "",
                      });
                      setTracks(ts=>ts.map(tr=>tr.id===editTrack.id?updated:tr));
                      setEditTrack(null); showToast("Saved ✓");
                    } catch(e) {
                      console.error("Admin save error:", e);
                      showToast("Save failed: " + (e.code || e.message || "unknown error"));
                    }
                  }} style={{...BTN_PRIMARY,flex:1}}>Save</button>
                  <button onClick={()=>setEditTrack(null)} style={{...BTN_SECONDARY,flex:1}}>Cancel</button>
                </div>
              </div>
            </div>
          )}
          <SectionLabel>Add Track</SectionLabel>
          {[["title","Title *"],["artist","Artist *"],["album","Album"],["genre","Genre"],["energy","Energy (1–10)"],["camelot","Camelot Key (e.g. 8A)"],["bpm","BPM"],["albumCover","Cover URL"]].map(([k,p])=>(
            <input key={k} placeholder={p} value={nt[k]||""} onChange={e=>setNt(n=>({...n,[k]:e.target.value}))} style={{...INPUT_ST,marginBottom:8}}/>
          ))}
          <button onClick={addTrack} style={{...BTN_PRIMARY,width:"100%",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><Icon name="plus" size={16}/> Add Track</button>
          {unknownArtistTracks.length > 0 && (
            <button
              type="button"
              onClick={handleDeleteUnknownArtists}
              disabled={deletingUnknown}
              style={{
                ...BTN_SECONDARY,
                width: "100%",
                marginBottom: 20,
                borderColor: "rgba(224,100,100,0.35)",
                color: "#E8A0A0",
                opacity: deletingUnknown ? 0.6 : 1,
              }}
            >
              {deletingUnknown
                ? "Deleting…"
                : `Delete ${unknownArtistTracks.length} Unknown artist track${unknownArtistTracks.length === 1 ? "" : "s"}`}
            </button>
          )}
          <SectionLabel>Library ({tracks.length})</SectionLabel>
          <VirtualList
            items={tracks}
            estimateSize={60}
            maxHeight={Math.min(560, Math.max(240, tracks.length * 60))}
            renderItem={(t) => (
              <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", background:"rgba(255,255,255,0.15)", backdropFilter:"blur(32px)", borderRadius:10, marginBottom:4, border:"1px solid rgba(255,255,255,0.16)", height: 56, boxSizing: "border-box" }}>
                <div style={{ width:36, height:36, borderRadius:7, overflow:"hidden", flexShrink:0 }}><AlbumArt track={t} size={36} borderRadius={0}/></div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:14, fontWeight:500, color: color.ink, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.title}</div>
                  <div style={{ fontSize:12, color: isUnknownArtist(t.artist) ? "#E8A0A0" : color.muted }}>{t.artist || "Unknown"}</div>
                </div>
                <div style={{ display:"flex", gap:4, flexShrink:0, flexWrap:"wrap", justifyContent:"flex-end", maxWidth:180 }}>
                  {t.genre&&<span style={{ fontSize:10, fontWeight:500, padding:"2px 8px", borderRadius:6, background:"rgba(26,29,38,0.06)", color: color.ink }}>{t.genre}</span>}
                  {t.camelot&&<span style={{ fontSize:10, fontWeight:600, padding:"2px 8px", borderRadius:6, background:"rgba(26,29,38,0.08)", color: color.ink }}>{t.camelot}</span>}
                  {t.bpm&&<span style={{ fontSize:10, fontWeight:500, padding:"2px 8px", borderRadius:6, background:"rgba(0,0,0,0.04)", color: color.muted }}>{t.bpm}bpm</span>}
                  {t.energy&&<span style={{ fontSize:10, fontWeight:500, padding:"2px 8px", borderRadius:6, background:"rgba(0,0,0,0.04)", color: color.muted }}>E{t.energy}</span>}
                </div>
                <button type="button" onClick={()=>setEditTrack(t)} style={{ background:"none",border:"none",cursor:"pointer",color: color.muted,padding:6 }}><Icon name="edit" size={14}/></button>
                <button type="button" onClick={()=>handleDeleteTrack(t)} style={{ background:"none",border:"none",cursor:"pointer",color: color.alert,padding:6 }}><Icon name="trash" size={14}/></button>
              </div>
            )}
          />
        </div>
      )}
      {tab==="analytics"&&(
        <div>
          {/* ── Summary stats row ── */}
          <SectionLabel>Overview</SectionLabel>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:24 }}>
            {[["Tracks",tracks.length],["Liked",tracks.filter(t=>t.liked).length],["Genres",[...new Set(tracks.map(t=>t.genre))].length],["BPMs",[...new Set(tracks.filter(t=>t.bpm).map(t=>t.bpm))].length]].map(([l,v])=>(
              <div key={l} style={{ padding:"14px 16px", background: color.surfaceSolid, borderRadius:14, border:"0.5px solid rgba(60,60,67,0.12)", boxShadow:"0 1px 4px rgba(0,0,0,0.04)" }}>
                <div style={{ fontSize:11, fontWeight:600, letterSpacing:0.5, color: color.faint, textTransform:"uppercase", marginBottom:4 }}>{l}</div>
                <div style={{ fontSize:28, fontWeight:700, letterSpacing:-0.5, color: color.ink }}>{v}</div>
              </div>
            ))}
          </div>

          {/* ── Most liked ── */}
          <SectionLabel>Most Liked</SectionLabel>
          {[...tracks]
            .filter(t => (t.likeCount||0) > 0 || t.liked)
            .sort((a,b) => (b.likeCount||0) - (a.likeCount||0))
            .slice(0,10)
            .map((t,i) => (
              <AnalyticsRow key={t.id} rank={i+1} track={t}
                value={t.likeCount||0} label="likes"
                max={Math.max(...tracks.map(x=>x.likeCount||0),1)}
                color={t.color} accent="rgba(224,100,100,0.7)"/>
            ))
          }
          {tracks.every(t=>!(t.likeCount||0)) && (
            <div style={{ textAlign:"center", color:"rgba(220,220,225,0.75)", padding:"24px 0", fontSize:13 }}>No like data yet — play some tracks!</div>
          )}

          {/* ── Most skipped ── */}
          <SectionLabel style={{ marginTop:24 }}>Most Skipped</SectionLabel>
          {[...tracks]
            .filter(t => (t.skipCount||0) > 0)
            .sort((a,b) => (b.skipCount||0) - (a.skipCount||0))
            .slice(0,10)
            .map((t,i) => (
              <AnalyticsRow key={t.id} rank={i+1} track={t}
                value={t.skipCount||0} label="skips"
                max={Math.max(...tracks.map(x=>x.skipCount||0),1)}
                color={t.color} accent="rgba(200,160,80,0.7)"/>
            ))
          }
          {tracks.every(t=>!(t.skipCount||0)) && (
            <div style={{ textAlign:"center", color:"rgba(220,220,225,0.75)", padding:"24px 0", fontSize:13 }}>No skip data yet — start listening!</div>
          )}

          {/* ── Most played ── */}
          <SectionLabel style={{ marginTop:24 }}>Most Played</SectionLabel>
          {[...tracks]
            .filter(t => (t.playCount||0) > 0)
            .sort((a,b) => (b.playCount||0) - (a.playCount||0))
            .slice(0,10)
            .map((t,i) => (
              <AnalyticsRow key={t.id} rank={i+1} track={t}
                value={t.playCount||0} label="plays"
                max={Math.max(...tracks.map(x=>x.playCount||0),1)}
                color={t.color} accent="rgba(100,180,140,0.7)"/>
            ))
          }
          {tracks.every(t=>!(t.playCount||0)) && (
            <div style={{ textAlign:"center", color:"rgba(220,220,225,0.75)", padding:"24px 0", fontSize:13 }}>No play data yet — start listening!</div>
          )}
        </div>
      )}
      {tab==="audit"&&(
        <div>
          {/* Export / Import */}
          <SectionLabel>Export & Import</SectionLabel>
          <div style={{ display:"flex", gap:8, marginBottom:20 }}>
            <button onClick={exportCSV} style={{ flex:1, padding:"14px", borderRadius:14, background: color.accent, color: color.onAccent, border:"none", fontSize:14, fontWeight:600, cursor:"pointer" }}>
              Export CSV ({tracks.length} tracks)
            </button>
            <button onClick={()=>fileInputRef.current?.click()} disabled={importing}
              style={{ flex:1, padding:"14px", borderRadius:14, background:"rgba(255,255,255,0.12)", backdropFilter:"blur(32px)", color: color.ink, border:"1px solid rgba(255,255,255,0.18)", fontSize:14, fontWeight:600, cursor:importing?"wait":"pointer" }}>
              {importing ? "Importing..." : "Import CSV"}
            </button>
            <input ref={fileInputRef} type="file" accept=".csv" style={{ display:"none" }}
              onChange={e => { if(e.target.files[0]) importCSV(e.target.files[0]); e.target.value=""; }}/>
          </div>
          {importProgress && (
            <div style={{ padding:"10px 14px", borderRadius:10, background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.12)", marginBottom:16, fontSize:12, color: color.muted }}>
              {importProgress}
            </div>
          )}
          <div style={{ padding:"10px 14px", borderRadius:10, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", marginBottom:24, fontSize:11, color: color.muted, lineHeight:1.6 }}>
            <strong style={{ color: color.muted }}>How it works:</strong> Export downloads all tracks as CSV (keep the <code>id</code> column). Edit titles/artists/genres/BPM/Camelot in Sheets, then Import. Matching is by <strong>id first</strong> so renames stick; title+artist is only a fallback when id is blank. New rows without id are created. Columns: id, title, artist, album, genre, energy, camelot, bpm, audioUrl, albumCover, color, duration, <code>batch</code> (Channel Surfing waves: <code>audioasis-wave-1</code>, <code>metal-wave-1</code>, <code>punk-wave-1</code>, <code>country-folk-wave-1</code>), source.
          </div>
          {(() => {
            const withKey = tracks.filter(t => t.camelot && t.camelot.trim());
            const withoutKey = tracks.filter(t => !t.camelot || !t.camelot.trim());
            const withBpm = tracks.filter(t => t.bpm);
            const withEnergy = tracks.filter(t => t.energy && t.energy !== 5);
            const withGenre = tracks.filter(t => t.genre && t.genre.trim());

            // Key distribution
            const keyCounts = {};
            withKey.forEach(t => { keyCounts[t.camelot] = (keyCounts[t.camelot]||0)+1; });
            const sortedKeys = Object.entries(keyCounts).sort((a,b) => b[1]-a[1]);

            // BPM-based camelot estimation
            function estimateCamelot(t) {
              const bpm = t.bpm || 120;
              const genre = (t.genre || "").toLowerCase();
              const energy = t.energy || 5;
              const preferMinor = ["techno","ambient","electronic","experimental","house","drum & bass","hip-hop","r&b","metal","rock"].some(g => genre.includes(g));
              const suffix = preferMinor ? "A" : "B";
              const keyNum = ((Math.floor(bpm / 10) + energy) % 12) + 1;
              return `${keyNum}${suffix}`;
            }

            async function batchAssign() {
              if (assigning) return;
              setAssigning(true);
              setAssigned(0);
              let count = 0;
              for (const t of withoutKey) {
                const estimated = estimateCamelot(t);
                try {
                  await updateDoc(doc(db, "tracks", t.id), { camelot: estimated });
                  setTracks(prev => prev.map(tr => tr.id === t.id ? { ...tr, camelot: estimated } : tr));
                  count++;
                  setAssigned(count);
                } catch(e) {
                  console.error("Failed to update", t.id, e);
                }
              }
              setAssigning(false);
              showToast(`Assigned keys to ${count} tracks`);
            }

            return (
              <>
                <SectionLabel>Data Coverage</SectionLabel>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:24 }}>
                  {[
                    ["Camelot Key", withKey.length, tracks.length],
                    ["BPM", withBpm.length, tracks.length],
                    ["Energy", withEnergy.length, tracks.length],
                    ["Genre", withGenre.length, tracks.length],
                  ].map(([label, has, total]) => {
                    const pct = total ? Math.round(has/total*100) : 0;
                    return (
                      <div key={label} style={{ padding:"14px 12px", background:"rgba(255,255,255,0.1)", backdropFilter:"blur(32px)", borderRadius:14, border:"1px solid rgba(255,255,255,0.14)" }}>
                        <div style={{ fontSize:11, fontWeight:600, color: color.ink, letterSpacing:0.5, marginBottom:8, textTransform:"uppercase" }}>{label}</div>
                        <div style={{ fontSize:28, fontWeight:700, color: color.ink }}>{has}<span style={{ fontSize:14, color: color.muted }}>/{total}</span></div>
                        <div style={{ height:5, background:"rgba(18,20,26,0.08)", borderRadius:999, marginTop:8, overflow:"hidden", boxShadow: "inset 0 1px 1px rgba(18,20,26,0.08)" }}>
                          <div style={{ width:`${pct}%`, height:"100%", background: pct === 100 ? color.accent : pct > 50 ? color.surfaceRaised : color.faint, borderRadius:999, transition:"width 0.5s" }}/>
                        </div>
                        <div style={{ fontSize:10, color: color.muted, marginTop:4 }}>{pct}% covered</div>
                      </div>
                    );
                  })}
                </div>

                {/* Key distribution */}
                {sortedKeys.length > 0 && (
                  <>
                    <SectionLabel>Key Distribution</SectionLabel>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:24 }}>
                      {sortedKeys.map(([key, count]) => (
                        <div key={key} style={{ padding:"6px 12px", borderRadius:8, background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.14)", fontSize:12 }}>
                          <span style={{ fontWeight:700, color: color.ink, marginRight:4 }}>{key}</span>
                          <span style={{ color: color.muted }}>{count}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Missing camelot keys */}
                <SectionLabel>Missing Camelot Keys ({withoutKey.length})</SectionLabel>
                {withoutKey.length === 0 ? (
                  <div style={{ padding:"24px 0", textAlign:"center", color: color.muted, fontSize:13 }}>All tracks have Camelot keys assigned</div>
                ) : (
                  <>
                    <div style={{ padding:"12px 14px", borderRadius:14, background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.12)", marginBottom:12 }}>
                      <div style={{ fontSize:12, color: color.ink, fontWeight:600, marginBottom:4 }}>{withoutKey.length} tracks missing keys</div>
                      <div style={{ fontSize:11, color: color.muted, lineHeight:1.5, marginBottom:12 }}>You can batch-assign estimated keys based on BPM and genre. These are rough estimates — for accurate keys, use DJ software like Mixed In Key or Rekordbox to analyze audio.</div>
                      <button onClick={batchAssign} disabled={assigning}
                        style={{ width:"100%", background:assigning? color.muted: color.surfaceRaised, color: color.ink, border:"none", borderRadius:12, padding:"12px", fontSize:14, fontWeight:600, cursor:assigning?"wait":"pointer", transition:"all 0.2s" }}>
                        {assigning ? `Assigning... ${assigned}/${withoutKey.length}` : `Batch assign ${withoutKey.length} keys`}
                      </button>
                    </div>
                    <div style={{ maxHeight:300, overflowY:"auto" }}>
                      {withoutKey.slice(0, 50).map(t => (
                        <div key={t.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 8px", borderRadius:8, marginBottom:2 }}>
                          <div style={{ width:28, height:28, borderRadius:5, overflow:"hidden", flexShrink:0 }}><AlbumArt track={t} size={28} borderRadius={0}/></div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:12, fontWeight:600, color: color.ink, letterSpacing:-0.2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.title}</div>
                            <div style={{ fontSize:10, color: color.muted }}>{t.artist}</div>
                          </div>
                          <span style={{ fontSize:9, color: color.faint }}>{t.bpm ? `${t.bpm}bpm` : "no bpm"}</span>
                          <span style={{ fontSize:9, color: color.faint }}>{t.genre || "no genre"}</span>
                          <button onClick={()=>setEditTrack(t)} style={{ background:"none", border:"none", cursor:"pointer", color: color.muted, padding:4 }}><Icon name="edit" size={12}/></button>
                        </div>
                      ))}
                      {withoutKey.length > 50 && <div style={{ textAlign:"center", color: color.muted, fontSize:11, padding:8 }}>... and {withoutKey.length - 50} more</div>}
                    </div>
                  </>
                )}
              </>
            );
          })()}
        </div>
      )}
      {tab==="club"&&(
        <div>
          <SectionLabel>Planet Club · Community Mix</SectionLabel>
          <div style={{ fontSize:14, color: color.muted, lineHeight:1.5, marginBottom:16 }}>
            Pick a member playlist to publish as this month’s Community Mix. Everyone gets it in their Library. Featured curator gets recognition (and prizes offline).
          </div>
          {communityMix ? (
            <div style={{
              padding: "14px 16px", borderRadius: 14, marginBottom: 18,
              background: color.surfaceSolid, border: `1px solid ${color.line}`,
            }}>
              <div style={{ fontSize:12, color: color.muted, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.4 }}>Live now</div>
              <div style={{ fontSize:18, fontWeight:700, fontFamily: fontDisplay, color: color.ink }}>
                {communityMix.title || COMMUNITY_MIX_TITLE}
              </div>
              <div style={{ fontSize:13, color: color.body, marginTop: 4 }}>
                {(communityMix.featuredCurator?.displayName || communityMix.ownerName || "Curator")}
                {" · "}
                {(communityMix.trackIds || []).length} tracks
                {communityMix.monthKey ? ` · ${formatMonthLabel(communityMix.monthKey)}` : ""}
              </div>
            </div>
          ) : (
            <div style={{ fontSize:13, color: color.faint, marginBottom: 16 }}>No Community Mix published this month yet.</div>
          )}
          <input
            placeholder="Featured curator name (optional)"
            value={clubCurator}
            onChange={(e)=>setClubCurator(e.target.value)}
            style={{ ...INPUT_ST, marginBottom: 14 }}
          />
          {publishable.length === 0 ? (
            <div style={{ fontSize:13, color: color.muted }}>
              Create a playlist in Library first, then publish it here.
            </div>
          ) : publishable.map((pl) => (
            <div
              key={pl.id}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "12px 14px", marginBottom: 6, borderRadius: 12,
                background: color.surfaceSolid, border: `1px solid ${color.line}`,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize:15, fontWeight:600, color: color.ink }}>{pl.name}</div>
                <div style={{ fontSize:12, color: color.muted }}>{(pl.trackIds || []).length} tracks</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!onPublishCommunityMix) return;
                  onPublishCommunityMix({
                    ...pl,
                    ownerName: clubCurator.trim() || pl.ownerName || undefined,
                  });
                }}
                style={{ ...BTN_PRIMARY, borderRadius: 980, padding: "10px 14px", fontSize: 13 }}
              >
                Make Community Mix
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

