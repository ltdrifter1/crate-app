import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth }                                  from "./useAuth";
import { toggleLike as fbToggleLike, recordPlay, saveGenres } from "./useUserData";
import { collection, getDocs, query, orderBy, doc, updateDoc } from "firebase/firestore";
import { db }                                       from "./firebase";

const injectStyles = () => {
  if (document.getElementById("crate-app-global-styles")) return;
  const s = document.createElement("style");
  s.id = "crate-app-global-styles";
  s.textContent = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    :root { --font: -apple-system, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif; --apple-red: #FC3C44; }
    body { font-family: var(--font); background: #F2F2F7; }
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 3px; }
    @keyframes spin        { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
    @keyframes pulse       { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }
    @keyframes pulse-ring  { 0%{transform:scale(1);opacity:0.35} 100%{transform:scale(1.7);opacity:0} }
    @keyframes slide-up    { from{transform:translateY(10px);opacity:0} to{transform:translateY(0);opacity:1} }
    @keyframes slide-in    { from{transform:translateY(100%)} to{transform:translateY(0)} }
    @keyframes mist        { 0%,100%{opacity:0.3;transform:translateX(0) scale(1)} 50%{opacity:0.45;transform:translateX(8px) scale(1.04)} }
    @keyframes shimmer     { 0%{opacity:0.5} 50%{opacity:0.85} 100%{opacity:0.5} }
    @keyframes breathe     { 0%,100%{opacity:0.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.04)} }
    @keyframes card-snap   { 0%{transform:translateY(-12px);opacity:0} 100%{transform:translateY(0);opacity:1} }
    input:focus { outline: none; }
    button { transition: transform 0.12s, opacity 0.12s; font-family: var(--font); }
    button:active { transform: scale(0.96) !important; }
    input[type="range"] { -webkit-appearance: none; height: 4px; background: #E5E5EA; border-radius: 2px; outline: none; }
    input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%; background: #fff; border: 0.5px solid rgba(0,0,0,0.12); box-shadow: 0 1px 4px rgba(0,0,0,0.18); cursor: pointer; }
  `;
  document.head.appendChild(s);
};
injectStyles();

// ─── CAMELOT ──────────────────────────────────────────────────────────────────
function camelotCompatible(keyA, keyB, range = 2) {
  if (!keyA || !keyB) return true;
  const numA = parseInt(keyA), numB = parseInt(keyB);
  if (isNaN(numA) || isNaN(numB)) return true;
  const diff = Math.abs(numA - numB);
  return Math.min(diff, 12 - diff) <= range;
}

// ─── TIME → ENERGY ────────────────────────────────────────────────────────────
function getEnergyRangeForHour(h) {
  const m = {
    0:[7,9],1:[5,7],2:[2,4],3:[2,4],4:[2,4],5:[2,4],6:[2,4],7:[2,4],8:[2,4],
    9:[4,6],10:[4,6],11:[4,6],12:[5,8],13:[5,8],14:[5,8],15:[5,8],
    16:[4,8],17:[4,8],18:[4,8],19:[4,8],20:[4,8],21:[4,8],22:[7,9],23:[7,9],
  };
  return m[h] ?? [1,10];
}

// ─── WEIGHTED RADIO PICK ──────────────────────────────────────────────────────
// All tracks eligible; liked tracks get 3× weight
// Priority: camelot+energy → camelot → energy → anything
function pickNextTrack(allTracks, currentTrack) {
  if (!allTracks.length) return null;
  const hour = new Date().getHours();
  const [eMin, eMax] = getEnergyRangeForHour(hour);
  const pool = allTracks.filter(t => t.id !== currentTrack?.id && (t.duration||0) <= 900);
  if (!pool.length) return allTracks[0];

  function weightedPick(candidates) {
    const weighted = candidates.flatMap(t => t.liked ? [t,t,t] : [t]);
    return weighted[Math.floor(Math.random() * weighted.length)];
  }

  const p1 = pool.filter(t => camelotCompatible(currentTrack?.camelot,t.camelot) && t.energy>=eMin && t.energy<=eMax);
  if (p1.length) return weightedPick(p1);
  const p2 = pool.filter(t => camelotCompatible(currentTrack?.camelot,t.camelot));
  if (p2.length) return weightedPick(p2);
  const p3 = pool.filter(t => t.energy>=eMin && t.energy<=eMax);
  if (p3.length) return weightedPick(p3);
  return weightedPick(pool);
}

function fmtTime(s) {
  if (!s||isNaN(s)) return "0:00";
  return `${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,"0")}`;
}
function hexToRgbStr(hex) {
  if (!hex||hex.length<7) return "160,165,175";
  return `${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)}`;
}

// ─── ENERGY BAR ───────────────────────────────────────────────────────────────
function EnergyBar({ level, color, size="sm" }) {
  const h = size==="lg" ? [8,10,12,10,8,12,10,8,12,10] : [5,6,7,6,5,7,6,5,7,6];
  return (
    <div style={{ display:"flex", gap:size==="lg"?3:2, alignItems:"center" }}>
      {h.map((ht,i) => (
        <div key={i} style={{
          width: size==="lg"?4:2.5, height:ht,
          borderRadius:2,
          background: i < level ? "#FC3C44" : "#E5E5EA",
          transition:"background 0.2s",
        }}/>
      ))}
    </div>
  );
}

// ─── ICONS ────────────────────────────────────────────────────────────────────
const Icon = ({ name, size=18 }) => {
  const icons = {
    play:       <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>,
    pause:      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>,
    skip:       <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zm2-8.14L11.03 12 8 14.14V9.86zM16 6h2v12h-2z"/></svg>,
    prev:       <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>,
    heart:      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>,
    heartempty: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
    search:     <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>,
    home:       <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>,
    profile:    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>,
    repeat:     <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>,
    settings:   <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94zM12,15.6c-1.98,0-3.6-1.62-3.6-3.6s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/></svg>,
    plus:       <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>,
    x:          <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>,
    edit:       <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>,
    trash:      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>,
    chev_up:    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 15l-6-6-6 6"/></svg>,
    chev_down:  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>,
  };
  return icons[name] || null;
};

// ─── ALBUM ART ────────────────────────────────────────────────────────────────
function AlbumArt({ track, size=300, borderRadius=0 }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError]   = useState(false);
  if (!track.albumCover || error) {
    return (
      <div style={{ width:size, height:size, borderRadius, flexShrink:0, background:`linear-gradient(135deg,rgba(${hexToRgbStr(track.color)},0.5),rgba(${hexToRgbStr(track.color)},0.1))`, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ fontSize:size*0.25, fontWeight:700, color:`rgba(${hexToRgbStr(track.color)},0.7)`, letterSpacing:-2 }}>
          {track.title.charAt(0)}{track.artist.charAt(0)}
        </div>
      </div>
    );
  }
  return (
    <div style={{ width:size, height:size, borderRadius, flexShrink:0, position:"relative", overflow:"hidden" }}>
      {!loaded && <div style={{ position:"absolute", inset:0, background:`rgba(${hexToRgbStr(track.color)},0.15)`, animation:"shimmer 1.5s ease-in-out infinite" }}/>}
      <img src={track.albumCover} alt={track.album} onLoad={()=>setLoaded(true)} onError={()=>setError(true)}
        style={{ width:"100%", height:"100%", objectFit:"cover", display:"block", opacity:loaded?1:0, transition:"opacity 0.4s" }}/>
    </div>
  );
}

// ─── VINYL RECORD ─────────────────────────────────────────────────────────────
function VinylRecord({ track, isPlaying, size=190 }) {
  const c = size/2;
  const grooves = Array.from({length:8},(_,i)=>({ r:size*0.24+i*(size*0.23/7), op:0.06+i*0.022 }));
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", position:"relative", overflow:"hidden",
      animation:isPlaying?"spin 2.8s linear infinite":"none",
      boxShadow:"0 8px 32px rgba(0,0,0,0.25)",
    }}>
      {track.albumCover
        ? <img src={track.albumCover} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}/>
        : <div style={{ width:"100%", height:"100%", background:`linear-gradient(135deg,rgba(${hexToRgbStr(track.color)},0.4),#141416)` }}/>
      }
      <svg style={{ position:"absolute", inset:0 }} width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={c} cy={c} r={c} fill="rgba(0,0,0,0.52)"/>
        {grooves.map((g,i)=><circle key={i} cx={c} cy={c} r={g.r} fill="none" stroke={track.color} strokeWidth="0.7" opacity={g.op}/>)}
        <circle cx={c} cy={c} r={size*0.17} fill="rgba(0,0,0,0.65)"/>
        <circle cx={c} cy={c} r={size*0.17} fill={`rgba(${hexToRgbStr(track.color)},0.2)`}/>
        <circle cx={c} cy={c} r={3.5} fill="#0f1011"/>
        <circle cx={c} cy={c} r={1.4} fill={track.color} opacity="0.7"/>
      </svg>
    </div>
  );
}

// ─── CRATE FLIPPER — vertical, full-bleed album art ────────────────────────────
function CrateFlipper({ tracks, onSelect, currentTrack, isPlaying }) {
  const [idx, setIdx]           = useState(0);
  const [dragY, setDragY]       = useState(0);
  const [dragStart, setDragStart] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [animDir, setAnimDir]   = useState(null); // "up"|"down"
  const containerRef            = useRef(null);

  const t = tracks[idx];
  const prev = tracks[idx-1];
  const next = tracks[idx+1];

  const goTo = useCallback((newIdx, dir) => {
    if (newIdx < 0 || newIdx >= tracks.length) return;
    setAnimDir(dir);
    setIdx(newIdx);
    setTimeout(() => setAnimDir(null), 350);
  }, [tracks.length]);

  const onPD = (e) => { setDragStart(e.clientY ?? e.touches?.[0]?.clientY ?? 0); setDragging(true); };
  const onPM = useCallback((e) => {
    if (!dragging) return;
    const y = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
    setDragY(y - dragStart);
  }, [dragging, dragStart]);
  const onPU = useCallback(() => {
    if (!dragging) return;
    setDragging(false);
    if (dragY < -55 && idx < tracks.length-1) goTo(idx+1, "up");
    else if (dragY > 55 && idx > 0) goTo(idx-1, "down");
    setDragY(0); setDragStart(null);
  }, [dragging, dragY, idx, tracks.length, goTo]);

  useEffect(() => {
    window.addEventListener("pointermove", onPM);
    window.addEventListener("pointerup", onPU);
    window.addEventListener("touchmove", onPM, {passive:true});
    window.addEventListener("touchend", onPU);
    return () => {
      window.removeEventListener("pointermove", onPM);
      window.removeEventListener("pointerup", onPU);
      window.removeEventListener("touchmove", onPM);
      window.removeEventListener("touchend", onPU);
    };
  }, [onPM, onPU]);

  const CARD_H = 200;

  return (
    <div style={{ position:"relative", userSelect:"none", touchAction:"none" }}>
      {/* Peek card above (previous) */}
      {prev && (
        <div style={{ position:"absolute", top:-28, left:0, right:0, height:32, zIndex:0, overflow:"hidden", opacity:0.35, pointerEvents:"none" }}>
          <div style={{ position:"absolute", bottom:0, left:0, right:0, height:80, background:"rgba(0,0,0,0.6)", backdropFilter:"blur(4px)" }}/>
          <img src={prev.albumCover} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", display:"block", filter:"brightness(0.4)" }}/>
          <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)" }}/>
        </div>
      )}

      {/* Main card */}
      <div ref={containerRef}
        onPointerDown={onPD}
        style={{
          height: CARD_H,
          position:"relative", overflow:"hidden",
          cursor: dragging ? "grabbing" : "grab",
          borderRadius: 0,
          transform: dragging ? `translateY(${dragY * 0.18}px)` : "none",
          transition: dragging ? "none" : "transform 0.35s cubic-bezier(0.22,1,0.36,1)",
          animation: animDir ? `card-snap 0.32s cubic-bezier(0.22,1,0.36,1)` : "none",
          WebkitBackfaceVisibility: "hidden",
        }}>

        {/* Full-bleed album image */}
        <div style={{ position:"absolute", inset:0, zIndex:0 }}>
          <AlbumArt track={t} size={CARD_H} borderRadius={0}/>
          <div style={{ position:"absolute", inset:0, width:"100%" }}>
            {/* Re-render as full-width cover */}
            <img src={t.albumCover} alt="" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", display:"block" }}
              onError={()=>{}}/>
          </div>
        </div>

        {/* Gradient overlay — dark at bottom for text readability */}
        <div style={{ position:"absolute", inset:0, zIndex:1,
          background:"linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.0) 35%, rgba(0,0,0,0.65) 70%, rgba(0,0,0,0.92) 100%)"
        }}/>

        {/* Top badges — genre, liked indicator */}
        <div style={{ position:"absolute", top:16, left:16, right:16, zIndex:3, display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            <span style={{ fontSize:10, fontWeight:700, letterSpacing:1.2, textTransform:"uppercase", color:"rgba(255,255,255,0.9)", background:"rgba(0,0,0,0.5)", backdropFilter:"blur(8px)", padding:"4px 9px", borderRadius:20, border:"1px solid rgba(255,255,255,0.12)" }}>{t.genre}</span>
            {t.liked && <span style={{ fontSize:10, fontWeight:700, letterSpacing:0.8, color:"rgba(255,255,255,0.85)", background:"rgba(255,255,255,0.12)", backdropFilter:"blur(8px)", padding:"4px 9px", borderRadius:20, border:"1px solid rgba(255,255,255,0.2)" }}>♥ Saved</span>}
          </div>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
            {t.camelot && <span style={{ fontSize:11, fontWeight:800, letterSpacing:0.5, color:"rgba(255,255,255,0.9)", background:"rgba(0,0,0,0.55)", backdropFilter:"blur(8px)", padding:"4px 9px", borderRadius:6, border:"1px solid rgba(255,255,255,0.15)", fontVariantNumeric:"tabular-nums" }}>{t.camelot}</span>}
            {t.bpm && <span style={{ fontSize:9, color:"rgba(255,255,255,0.5)", letterSpacing:0.5 }}>{t.bpm} BPM</span>}
          </div>
        </div>

        {/* Bottom info — title, artist, album, energy, play */}
        <div style={{ position:"absolute", bottom:0, left:0, right:0, zIndex:3, padding:"0 16px 18px" }}>
          <div style={{ fontSize:22, fontWeight:700, letterSpacing:-0.4, color:"#ffffff", lineHeight:1.15, marginBottom:3, textShadow:"0 2px 12px rgba(0,0,0,0.8)" }}>
            {t.title}
          </div>
          <div style={{ fontSize:14, color:"rgba(255,255,255,0.72)", fontWeight:500, marginBottom:2 }}>
            {t.artist}
          </div>
          <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginBottom:12 }}>
            {t.album}
          </div>
          {/* Play button bottom left */}
          <button onClick={()=>onSelect(t)} style={{
            width:44, height:44, borderRadius:"50%",
            background:"#FC3C44",
            border:"none",
            color:"#FFFFFF", cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow:"0 4px 16px rgba(252,60,68,0.4)",
          }}>
            <Icon name={currentTrack?.id===t.id && isPlaying ? "pause" : "play"} size={20}/>
          </button>
        </div>

        {/* Swipe hint arrows (subtle) */}
        {idx > 0 && (
          <button onClick={()=>goTo(idx-1,"down")} style={{ position:"absolute", top:12, left:"50%", transform:"translateX(-50%)", background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,0.3)", zIndex:4, padding:4 }}>
            <Icon name="chev_up" size={18}/>
          </button>
        )}
        {idx < tracks.length-1 && (
          <button onClick={()=>goTo(idx+1,"up")} style={{ position:"absolute", bottom:72, left:"50%", transform:"translateX(-50%)", background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,0.3)", zIndex:4, padding:4 }}>
            <Icon name="chev_down" size={18}/>
          </button>
        )}

        {/* Playing indicator */}
        {currentTrack?.id === t.id && (
          <div style={{ position:"absolute", top:16, left:"50%", transform:"translateX(-50%)", zIndex:4, display:"flex", gap:2, alignItems:"flex-end" }}>
            {[5,8,5,9,6].map((h,i)=>(
              <div key={i} style={{ width:3, height:h, borderRadius:2, background:"rgba(255,255,255,0.7)", animation:isPlaying?`pulse ${0.5+i*0.1}s ease-in-out infinite alternate`:"none" }}/>
            ))}
          </div>
        )}
      </div>

      {/* Peek card below (next) */}
      {next && (
        <div style={{ position:"absolute", bottom:-28, left:0, right:0, height:32, zIndex:0, overflow:"hidden", opacity:0.35, pointerEvents:"none" }}>
          <img src={next.albumCover} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", display:"block", filter:"brightness(0.4)" }}/>
          <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)" }}/>
        </div>
      )}

      {/* Track counter */}
      <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:6, padding:"14px 0 4px" }}>
        <span style={{ fontSize:11, color:"#8E8E93", fontWeight:500 }}>{idx+1} / {tracks.length}</span>
        <div style={{ display:"flex", gap:3 }}>
          {tracks.map((_,i) => (
            <div key={i} onClick={()=>setIdx(i)} style={{
              width: i===idx?16:4, height:4, borderRadius:2, cursor:"pointer",
              background: i===idx?"#FC3C44":"#E5E5EA",
              transition:"width 0.25s, background 0.25s",
            }}/>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── DEEP CUTS RADIO CARD ─────────────────────────────────────────────────────
function DeepCutsCard({ onPlay, onTogglePlay, currentTrack, isPlaying, isRadioMode }) {
  const hour = new Date().getHours();
  const [eMin, eMax] = getEnergyRangeForHour(hour);
  const timeLabel = hour>=22||hour<=1?"Late Night":hour<=5?"Deep Hours":hour<=8?"Early Morning":hour<=11?"Morning":hour<=14?"Midday":hour<=17?"Afternoon":"Evening";
  const rgb = currentTrack ? hexToRgbStr(currentTrack.color) : "160,165,175";

  return (
    <div onClick={isRadioMode ? undefined : onPlay} style={{
      cursor: isRadioMode ? 'default' : 'pointer',
      background: isRadioMode
        ? `linear-gradient(135deg, rgba(252,60,68,0.08) 0%, #FFFFFF 100%)`
        : "#FFFFFF",
      backdropFilter:"blur(28px) saturate(1.6)",
      border:`1px solid ${isRadioMode?"rgba(252,60,68,0.25)":"rgba(60,60,67,0.12)"}`,
      borderRadius:20, padding:"20px 18px", transition:"all 0.3s",
      marginBottom:24, position:"relative", overflow:"hidden",
      boxShadow: isRadioMode
        ? "0 4px 24px rgba(252,60,68,0.1)"
        : "0 1px 8px rgba(0,0,0,0.06)",
    }}>
      {/* Background glow when on air */}
      {isRadioMode && <div style={{ position:"absolute", top:-40, right:-40, width:160, height:160, borderRadius:"50%", background:"radial-gradient(circle, rgba(252,60,68,0.06) 0%, transparent 70%)", pointerEvents:"none" }}/>}

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {/* Live dot */}
          <div style={{ position:"relative", width:10, height:10, flexShrink:0 }}>
            <div style={{ position:"absolute", inset:0, borderRadius:"50%", background: isRadioMode?"#FC3C44":"#AEAEB2", animation:isRadioMode&&isPlaying?"breathe 1.8s ease-in-out infinite":"none" }}/>
            {isRadioMode&&isPlaying&&<div style={{ position:"absolute", inset:-4, borderRadius:"50%", border:"1px solid rgba(252,60,68,0.5)", animation:"pulse-ring 1.8s ease-out infinite" }}/>}
          </div>
          <span style={{ fontSize:11, fontWeight:800, letterSpacing:2, color:isRadioMode&&isPlaying?"#FC3C44":"#8E8E93", textTransform:"uppercase" }}>
            {isRadioMode&&isPlaying ? "LIVE" : "Now Playing"}
          </span>
        </div>
        <div style={{ fontSize:11, color:"#8E8E93", textAlign:"right", lineHeight:1.6 }}>
          <div style={{ fontWeight:600, color:"#8E8E93" }}>{timeLabel}</div>
        </div>
      </div>

      {isRadioMode&&currentTrack ? (
        <div>
          <div style={{ display:"flex", gap:14, alignItems:"center" }}>
            <div style={{ width:54, height:54, borderRadius:10, overflow:"hidden", flexShrink:0, boxShadow:"0 2px 12px rgba(0,0,0,0.12)" }}>
              <AlbumArt track={currentTrack} size={54} borderRadius={0}/>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:16, fontWeight:600, color:"#1C1C1E", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", letterSpacing:-0.2 }}>{currentTrack.title}</div>
              <div style={{ fontSize:13, color:"#8E8E93", marginTop:2 }}>{currentTrack.artist}</div>
              {currentTrack.camelot&&<span style={{ fontSize:10, fontWeight:600, color:"#FC3C44", background:"rgba(252,60,68,0.08)", padding:"2px 6px", borderRadius:4, marginTop:4, display:"inline-block" }}>{currentTrack.camelot}</span>}
            </div>
          </div>
          {/* Energy bar + play/pause button row — button on left */}
          <div style={{ marginTop:12, display:"flex", alignItems:"center", gap:12 }}>
            <button onClick={e=>{e.stopPropagation();onTogglePlay();}} style={{ width:40, height:40, borderRadius:"50%", background:"#FC3C44", border:"none", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, color:"#FFFFFF", cursor:"pointer" }}>
              <Icon name={isPlaying?"pause":"play"} size={18}/>
            </button>
            <EnergyBar level={currentTrack.energy} color={currentTrack.color} size="lg"/>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ fontSize:22, fontWeight:700, letterSpacing:-0.3, color:"#1C1C1E" }}>Crate Radio</div>
          <div style={{ fontSize:13, color:"#8E8E93", marginTop:4, marginBottom:14 }}>Tap to tune in</div>
          <button onClick={e=>{e.stopPropagation();onPlay();}} style={{ width:48, height:48, borderRadius:"50%", background:"#FC3C44", border:"none", display:"flex", alignItems:"center", justifyContent:"center", color:"#FFFFFF", cursor:"pointer" }}>
            <Icon name="play" size={22}/>
          </button>
        </div>
      )}

      {/* Animated waveform */}
      <div style={{ position:"absolute", right:18, bottom:18, display:"flex", gap:2.5, alignItems:"flex-end", opacity:isRadioMode&&isPlaying?0.45:0.12 }}>
        {[4,7,5,9,6,4,8,5,7,4].map((h,i)=>(
          <div key={i} style={{ width:2.5, height:h*1.6, borderRadius:2, background:"#FC3C44", animation:isRadioMode&&isPlaying?`pulse ${0.55+i*0.07}s ease-in-out infinite alternate`:"none" }}/>
        ))}
      </div>
    </div>
  );
}

// ─── PLAYLIST MENU CONTEXT ────────────────────────────────────────────────────
// Passed down from App so every TrackRow can access playlists + handlers
const PlaylistCtx = { playlists:[], onCreate:()=>{}, onAdd:()=>{}, onRemove:()=>{}, activePlaylistId:null };

// ─── TRACK ROW ────────────────────────────────────────────────────────────────
function TrackRow({ track, onPlay, active, isPlaying, onLike, extraAction, playlistCtx, activePlaylistId }) {
  const [hover, setHover]         = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);
  const [newPlName, setNewPlName] = useState("");
  const [showNewPl, setShowNewPl] = useState(false);
  const ctx = playlistCtx || PlaylistCtx;

  function handleAddTo(plId) {
    ctx.onAdd(track.id, plId);
    setMenuOpen(false);
  }
  function handleCreateAndAdd() {
    if (!newPlName.trim()) return;
    ctx.onCreate(newPlName.trim(), track.id);
    setNewPlName(""); setShowNewPl(false); setMenuOpen(false);
  }

  return (
    <div style={{ position:"relative" }}>
      <div onClick={onPlay} onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
        style={{ display:"flex", alignItems:"center", gap:12, padding:"9px 12px", borderRadius:10, cursor:"pointer", transition:"background 0.15s",
          background:active?"rgba(252,60,68,0.06)":hover?"rgba(0,0,0,0.03)":"transparent",
          borderBottom:active?"":"0.5px solid rgba(60,60,67,0.08)" }}>
        <div style={{ width:40, height:40, borderRadius:7, overflow:"hidden", flexShrink:0, position:"relative" }}>
          <AlbumArt track={track} size={40} borderRadius={0}/>
          {active&&isPlaying&&<div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center" }}><div style={{ width:7, height:7, borderRadius:"50%", background:"#FC3C44", animation:"pulse 1s ease-in-out infinite" }}/></div>}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:15, fontWeight:active?600:400, letterSpacing:-0.2, color:active?"#FC3C44":"#1C1C1E", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{track.title}</div>
          <div style={{ fontSize:13, color:"#8E8E93", marginTop:1 }}>{track.artist}</div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:3, flexShrink:0 }}>
          <EnergyBar level={track.energy} color={track.color}/>
          <div style={{ display:"flex", gap:4 }}>
            {track.camelot&&<span style={{ fontSize:9, fontWeight:600, color:"#FC3C44", background:"rgba(252,60,68,0.08)", padding:"1px 5px", borderRadius:3 }}>{track.camelot}</span>}
            <span style={{ fontSize:10, color:"#AEAEB2" }}>{track.genre}</span>
          </div>
        </div>
        {onLike&&<button onClick={e=>{e.stopPropagation();onLike(track.id);}} style={{ background:"none", border:"none", cursor:"pointer", color:track.liked?"#FC3C44":"#AEAEB2", padding:4, transition:"color 0.2s" }}><Icon name={track.liked?"heart":"heartempty"} size={16}/></button>}
        {/* ⋯ menu button — always visible */}
        <button onClick={e=>{e.stopPropagation();setMenuOpen(o=>!o);setShowNewPl(false);}}
          style={{ background:"none", border:"none", cursor:"pointer", color:"#AEAEB2", padding:"4px 6px", fontSize:18, lineHeight:1, flexShrink:0 }}>⋯</button>
        {extraAction||null}
      </div>

      {/* ── Dropdown menu ── */}
      {menuOpen && (
        <div onClick={e=>e.stopPropagation()}
          style={{ position:"absolute", right:8, top:44, zIndex:50, background:"#FFFFFF", border:"0.5px solid rgba(60,60,67,0.12)", borderRadius:14, padding:"6px 0", minWidth:210, boxShadow:"0 8px 40px rgba(0,0,0,0.15)" }}>

          {/* Add to existing playlists */}
          {ctx.playlists.length > 0 && (
            <>
              <div style={{ fontSize:11, fontWeight:600, letterSpacing:0.5, color:"#AEAEB2", padding:"6px 14px", textTransform:"uppercase" }}>Add to playlist</div>
              {ctx.playlists.map(pl => (
                <button key={pl.id} onClick={()=>handleAddTo(pl.id)}
                  style={{ display:"block", width:"100%", textAlign:"left", background:"none", border:"none", color:"#1C1C1E", fontSize:14, padding:"10px 14px", cursor:"pointer" }}>
                  ♪ {pl.name}
                </button>
              ))}
              <div style={{ height:0.5, background:"rgba(60,60,67,0.12)", margin:"4px 14px" }}/>
            </>
          )}

          {/* New playlist inline */}
          {showNewPl ? (
            <div style={{ padding:"8px 12px" }}>
              <input autoFocus value={newPlName} onChange={e=>setNewPlName(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter")handleCreateAndAdd();if(e.key==="Escape")setShowNewPl(false);}}
                placeholder="Playlist name…"
                style={{ background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.14)", borderRadius:8, padding:"7px 10px", color:"#1C1C1E", fontSize:13, fontFamily:"inherit", width:"100%", marginBottom:6 }}/>
              <div style={{ display:"flex", gap:6 }}>
                <button onClick={handleCreateAndAdd} style={{ flex:1, background:"#FC3C44", border:"none", borderRadius:8, color:"#FFFFFF", fontSize:13, fontWeight:600, padding:"8px 0", cursor:"pointer" }}>Create & add</button>
                <button onClick={()=>setShowNewPl(false)} style={{ flex:1, background:"#F2F2F7", border:"1px solid rgba(60,60,67,0.12)", borderRadius:8, color:"#8E8E93", fontSize:13, padding:"8px 0", cursor:"pointer" }}>Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={()=>setShowNewPl(true)}
              style={{ display:"flex", alignItems:"center", gap:8, width:"100%", textAlign:"left", background:"none", border:"none", color:"#FC3C44", fontSize:14, padding:"10px 14px", cursor:"pointer", fontWeight:500 }}>
              <span style={{ fontSize:18, lineHeight:1 }}>+</span> New playlist
            </button>
          )}

          {/* Remove from current playlist if in library view */}
          {activePlaylistId && activePlaylistId !== "liked" && (
            <>
              <div style={{ height:0.5, background:"rgba(60,60,67,0.12)", margin:"4px 14px" }}/>
              <button onClick={()=>{ctx.onRemove(track.id, activePlaylistId);setMenuOpen(false);}}
                style={{ display:"block", width:"100%", textAlign:"left", background:"none", border:"none", color:"#FF3B30", fontSize:14, padding:"10px 14px", cursor:"pointer" }}>
                Remove from playlist
              </button>
            </>
          )}

          <div style={{ height:0.5, background:"rgba(60,60,67,0.12)", margin:"4px 14px" }}/>
          <button onClick={()=>setMenuOpen(false)}
            style={{ display:"block", width:"100%", textAlign:"left", background:"none", border:"none", color:"#AEAEB2", fontSize:13, padding:"8px 14px", cursor:"pointer" }}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

const SectionLabel = ({ children, style={} }) => (
  <div style={{ fontSize:12, fontWeight:700, letterSpacing:0.3, color:"#8E8E93", marginBottom:10, textTransform:"uppercase", ...style }}>{children}</div>
);

// ─── LOGIN ────────────────────────────────────────────────────────────────────

// ─── LOGIN SCREEN — wired to real Firebase auth ───────────────────────────────
function LoginScreen({ onSignUp, onLogIn }) {
  const [mode, setMode]     = useState("login");
  const [name, setName]     = useState("");
  const [email, setEmail]   = useState("");
  const [pass, setPass]     = useState("");
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(""); setLoading(true);
    try {
      if (mode === "signup") {
        if (!name.trim()) { setError("Enter a username"); setLoading(false); return; }
        await onSignUp(email, pass, name.trim());
      } else {
        await onLogIn(email, pass);
      }
    } catch (e) {
      // Turn Firebase error codes into plain English
      const msg = {
        "auth/invalid-email":          "That doesn't look like a valid email address.",
        "auth/user-not-found":         "No account found with that email.",
        "auth/wrong-password":         "Wrong password — try again.",
        "auth/email-already-in-use":   "An account with that email already exists.",
        "auth/weak-password":          "Password must be at least 6 characters.",
        "auth/too-many-requests":      "Too many attempts. Wait a moment and try again.",
        "auth/network-request-failed": "Network error. Check your internet connection.",
      }[e.code] || "Something went wrong — please try again.";
      setError(msg);
    }
    setLoading(false);
  }

  return (
    <div style={APP_STYLE}>
      <BgMist/>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", gap:32, padding:32, position:"relative", zIndex:2 }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ width:80, height:80, borderRadius:20, background:"linear-gradient(135deg, #FC3C44, #FF2D55)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", boxShadow:"0 8px 32px rgba(252,60,68,0.25)", fontSize:36 }}>🎵</div>
          <div style={{ fontSize:34, fontWeight:700, letterSpacing:-0.5, color:"#1C1C1E" }}>Crate</div>
          <div style={{ color:"#8E8E93", fontSize:14, letterSpacing:0.5, marginTop:6, fontWeight:500 }}>Dig Deeper</div>
        </div>
        <div style={{ width:"100%", maxWidth:320, display:"flex", flexDirection:"column", gap:12 }}>
          {/* Tab switcher */}
          <div style={{ display:"flex", background:"#F2F2F7", borderRadius:10, padding:2, gap:2 }}>
            {["login","signup"].map(m=>(
              <button key={m} onClick={()=>{setMode(m);setError("");}} style={{ flex:1, padding:"8px 0", borderRadius:10, border:"none", cursor:"pointer", fontSize:14, fontWeight:600, background:mode===m?"#FFFFFF":"transparent", color:mode===m?"#1C1C1E":"#AEAEB2", boxShadow:mode===m?"0 1px 3px rgba(0,0,0,0.06)":"none" }}>
                {m==="login"?"Log In":"Sign Up"}
              </button>
            ))}
          </div>
          {mode==="signup" && <input placeholder="Username" style={INPUT_ST} value={name} onChange={e=>setName(e.target.value)}/>}
          <input placeholder="Email" type="email" style={INPUT_ST} value={email} onChange={e=>setEmail(e.target.value)}/>
          <input placeholder="Password" type="password" style={INPUT_ST} value={pass} onChange={e=>setPass(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&handleSubmit()}/>
          {error && (
            <div style={{ fontSize:13, color:"#FF3B30", background:"rgba(255,59,48,0.08)", border:"1px solid rgba(255,59,48,0.15)", borderRadius:10, padding:"10px 14px", lineHeight:1.4 }}>
              {error}
            </div>
          )}
          <button onClick={handleSubmit} disabled={loading} style={{...BTN_PRIMARY, opacity:loading?0.6:1}}>
            {loading ? "Please wait…" : mode==="login" ? "Sign In" : "Create Account"}
          </button>
        </div>
      </div>
    </div>
  );
}

function HomeScreen({ tracks, onPlayRadio, onTogglePlay, onPlayTrack, currentTrack, isPlaying, onLike, isRadioMode, playlistCtx }) {
  const hour = new Date().getHours();
  const greeting = hour<12?"Good Morning":hour<18?"Good Afternoon":"Good Evening";
  // Sort tracks by playCount descending for Top Tracks section
  const topTracks = [...tracks].filter(t=>(t.duration||0)<=900).sort((a,b) => (b.playCount||0) - (a.playCount||0)).slice(0,8);
  // Mixtapes: tracks with duration > 900 seconds (15 minutes)
  const mixtapes  = tracks.filter(t => (t.duration||0) > 900).sort((a,b) => (b.duration||0) - (a.duration||0));
  return (
    <div>
      {/* Header */}
      <div style={{ padding:"24px 16px 16px", display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div>
          <div style={{ fontSize:28, fontWeight:700, letterSpacing:-0.5, color:"#1C1C1E" }}>{greeting}</div>
          <div style={{ fontSize:14, color:"#8E8E93", marginTop:3 }}>What are you digging?</div>
        </div>
        <div style={{ fontSize:26 }}>📦</div>
      </div>

      {/* Radio card — top of page */}
      <div style={{ padding:"0 16px", marginBottom:8 }}>
        <DeepCutsCard onPlay={onPlayRadio} onTogglePlay={onTogglePlay} currentTrack={isRadioMode?currentTrack:null} isPlaying={isPlaying} isRadioMode={isRadioMode}/>
      </div>

      {/* YOUR CRATE — standout section */}
      <div style={{ padding:"4px 16px 12px", display:"flex", alignItems:"baseline", gap:10, borderTop:"0.5px solid rgba(60,60,67,0.12)", marginTop:4 }}>
        <div style={{ fontSize:22, fontWeight:700, letterSpacing:-0.3, color:"#1C1C1E" }}>Your Crate</div>
        <div style={{ fontSize:13, color:"#8E8E93" }}>{tracks.length} records</div>
      </div>
      <div style={{ marginBottom:32, borderBottom:"0.5px solid rgba(60,60,67,0.12)", background:"rgba(0,0,0,0.02)", display:"flex", justifyContent:"center" }}>
        <div style={{ width:"100%", maxWidth:320 }}>
          <CrateFlipper tracks={tracks.filter(t=>(t.duration||0)<=900)} onSelect={t=>onPlayTrack(t,tracks)} currentTrack={currentTrack} isPlaying={isPlaying}/>
        </div>
      </div>

      {/* MIXTAPES — tracks over 15 minutes */}
      {mixtapes.length > 0 && (
        <>
          <div style={{ padding:"20px 16px 12px", display:"flex", alignItems:"baseline", gap:10, borderTop:"0.5px solid rgba(60,60,67,0.12)", marginTop:8 }}>
            <div style={{ fontSize:22, fontWeight:700, letterSpacing:-0.3, color:"#1C1C1E" }}>Mixtapes</div>
            <div style={{ fontSize:13, color:"#8E8E93" }}>{mixtapes.length} mixes · 15min+</div>
          </div>
          <div style={{ padding:"0 16px 4px" }}>
            {mixtapes.map(t => (
              <div key={t.id} onClick={()=>onPlayTrack(t, mixtapes)}
                style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 12px", borderRadius:12, cursor:"pointer", marginBottom:4,
                  background: currentTrack?.id===t.id ? "rgba(252,60,68,0.06)" : "#FFFFFF",
                  border: currentTrack?.id===t.id ? "0.5px solid rgba(252,60,68,0.2)" : "0.5px solid rgba(60,60,67,0.12)",
                  transition:"all 0.15s" }}>
                <div style={{ width:48, height:48, borderRadius:9, overflow:"hidden", flexShrink:0, position:"relative" }}>
                  <AlbumArt track={t} size={48} borderRadius={0}/>
                  {currentTrack?.id===t.id && isPlaying && (
                    <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <div style={{ width:7, height:7, borderRadius:"50%", background:"#FC3C44", animation:"pulse 1s ease-in-out infinite" }}/>
                    </div>
                  )}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:15, fontWeight:600, color: currentTrack?.id===t.id ? "#FC3C44" : "#1C1C1E", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", letterSpacing:-0.2 }}>{t.title}</div>
                  <div style={{ fontSize:13, color:"#8E8E93", marginTop:1 }}>{t.artist}</div>
                </div>
                <div style={{ flexShrink:0, textAlign:"right" }}>
                  <div style={{ fontSize:13, fontWeight:600, color:"#FC3C44", background:"rgba(252,60,68,0.08)", padding:"3px 8px", borderRadius:6 }}>
                    {t.duration ? `${Math.floor(t.duration/60)}m` : "—"}
                  </div>
                  <div style={{ fontSize:11, color:"#AEAEB2", marginTop:3 }}>{t.genre}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Top Tracks — styled to match Your Crate header */}
      <div style={{ padding:"20px 16px 12px", display:"flex", alignItems:"baseline", gap:10, borderTop:"0.5px solid rgba(60,60,67,0.12)", marginTop:8 }}>
        <div style={{ fontSize:22, fontWeight:700, letterSpacing:-0.3, color:"#1C1C1E" }}>Top Tracks</div>
        <div style={{ fontSize:13, color:"#8E8E93" }}>most played</div>
      </div>
      <div style={{ padding:"0 16px" }}>
        {topTracks.map((t,i)=>(
          <div key={t.id} style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:22, textAlign:"right", fontSize:14, fontWeight:700, color:"#AEAEB2", flexShrink:0 }}>{i+1}</div>
            <div style={{ flex:1 }}>
              <TrackRow track={t} onPlay={()=>onPlayTrack(t,tracks)} active={currentTrack?.id===t.id} isPlaying={isPlaying} onLike={onLike} playlistCtx={playlistCtx}/>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SEARCH ───────────────────────────────────────────────────────────────────
function SearchScreen({ query, setQuery, results, onPlay, onLike, currentTrack, isPlaying, playlistCtx }) {
  return (
    <div style={{ padding:"24px 16px 16px" }}>
      <div style={{ fontSize:28, fontWeight:700, letterSpacing:-0.5, color:"#1C1C1E", marginBottom:16 }}>Search</div>
      <div style={{ position:"relative", marginBottom:24 }}>
        <div style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:"#AEAEB2" }}><Icon name="search" size={16}/></div>
        <input placeholder="Tracks, artists, genres…" style={{...INPUT_ST,paddingLeft:42}} value={query} onChange={e=>setQuery(e.target.value)} autoFocus/>
      </div>
      {query.length>1&&!results.length&&<div style={{ textAlign:"center", color:"#AEAEB2", padding:"48px 0" }}><div style={{ fontSize:32, marginBottom:12 }}>🔍</div><div style={{ fontSize:15, color:"#8E8E93" }}>No results for "{query}"</div></div>}
      {results.map(t=><TrackRow key={t.id} track={t} onPlay={()=>onPlay(t)} active={currentTrack?.id===t.id} isPlaying={isPlaying} onLike={onLike} playlistCtx={playlistCtx}/>)}
      {!query&&<div style={{ color:"#AEAEB2", textAlign:"center", paddingTop:48 }}><Icon name="search" size={32}/><div style={{ marginTop:12, fontSize:14 }}>Search tracks, artists or genres</div></div>}
    </div>
  );
}

// ─── LIBRARY ─────────────────────────────────────────────────────────────────
function FavoritesScreen({ tracks, onPlay, onLike, currentTrack, isPlaying, userPlaylists, onCreatePlaylist, onAddToPlaylist, onRemoveFromPlaylist, onDeletePlaylist, playlistCtx }) {
  const [activeList, setActiveList]     = useState("liked");
  const [showNewInput, setShowNewInput] = useState(false);
  const [newName, setNewName]           = useState("");

  const likedTracks = tracks.filter(t => t.liked);
  const activeTracks = activeList === "liked"
    ? likedTracks
    : (() => {
        const pl = userPlaylists.find(p => p.id === activeList);
        return (pl?.trackIds || []).map(id => tracks.find(t => t.id === id)).filter(Boolean);
      })();
  const activeLabel = activeList === "liked" ? "Liked Songs" : (userPlaylists.find(p => p.id === activeList)?.name || "Playlist");

  function handleCreate() {
    if (!newName.trim()) return;
    onCreatePlaylist(newName.trim());
    setNewName(""); setShowNewInput(false);
  }

  return (
    <div style={{ display:"flex", height:"100%", minHeight:"calc(100vh - 112px)" }}>
      {/* ── Left sidebar ── */}
      <div style={{ width:160, flexShrink:0, borderRight:"0.5px solid rgba(60,60,67,0.12)", background:"#F2F2F7", paddingTop:24, display:"flex", flexDirection:"column", gap:1, overflowY:"auto" }}>
        <div style={{ fontSize:11, fontWeight:700, letterSpacing:0.5, color:"#AEAEB2", textTransform:"uppercase", padding:"0 14px 8px" }}>Library</div>
        {/* Liked Songs row */}
        <button onClick={()=>setActiveList("liked")} style={{ background:activeList==="liked"?"#FFFFFF":"none", border:"none", cursor:"pointer", textAlign:"left", padding:"10px 14px", color:activeList==="liked"?"#FC3C44":"#1C1C1E", boxShadow:activeList==="liked"?"0 1px 3px rgba(0,0,0,0.06)":"none", fontSize:13, fontWeight:activeList==="liked"?600:400, display:"flex", alignItems:"center", gap:8, borderRadius:8, margin:"0 6px", transition:"all 0.15s" }}>
          <Icon name="heart" size={13}/> Liked Songs
        </button>
        {/* User playlists */}
        {userPlaylists.map(pl => (
          <div key={pl.id} style={{ position:"relative", margin:"0 6px" }}>
            <button onClick={()=>setActiveList(pl.id)} style={{ background:activeList===pl.id?"#FFFFFF":"none", border:"none", cursor:"pointer", textAlign:"left", padding:"10px 28px 10px 14px", color:activeList===pl.id?"#FC3C44":"#1C1C1E", boxShadow:activeList===pl.id?"0 1px 3px rgba(0,0,0,0.06)":"none", fontSize:13, fontWeight:activeList===pl.id?600:400, display:"flex", alignItems:"center", gap:8, borderRadius:8, width:"100%", transition:"all 0.15s" }}>
              <span style={{ fontSize:11 }}>♪</span>
              <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1 }}>{pl.name}</span>
            </button>
            <button onClick={()=>{ if(activeList===pl.id) setActiveList("liked"); onDeletePlaylist(pl.id); }} style={{ position:"absolute", right:6, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#AEAEB2", fontSize:16, opacity:0.4, padding:2, lineHeight:1 }}>×</button>
          </div>
        ))}
        {/* New playlist button */}
        <div style={{ padding:"10px 12px 0" }}>
          {showNewInput ? (
            <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
              <input autoFocus value={newName} onChange={e=>setNewName(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")handleCreate();if(e.key==="Escape"){setShowNewInput(false);setNewName("");}}} placeholder="Name…" style={{ background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:8, padding:"7px 10px", color:"#1C1C1E", fontSize:12, fontFamily:"inherit", width:"100%" }}/>
              <div style={{ display:"flex", gap:5 }}>
                <button onClick={handleCreate} style={{ flex:1, background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:7, color:"#e8e8ea", fontSize:11, fontWeight:600, padding:"5px 0", cursor:"pointer" }}>Create</button>
                <button onClick={()=>{setShowNewInput(false);setNewName("");}} style={{ flex:1, background:"none", border:"1px solid rgba(255,255,255,0.08)", borderRadius:7, color:"rgba(210,210,215,0.65)", fontSize:11, padding:"5px 0", cursor:"pointer" }}>Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={()=>setShowNewInput(true)} style={{ background:"none", border:"1px dashed #E5E5EA", borderRadius:8, color:"#AEAEB2", fontSize:12, padding:"7px 10px", cursor:"pointer", width:"100%", textAlign:"left", display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ fontSize:15, lineHeight:1 }}>+</span> New playlist
            </button>
          )}
        </div>
      </div>

      {/* ── Main track list ── */}
      <div style={{ flex:1, padding:"24px 16px 16px", overflowY:"auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <div style={{ fontSize:24, fontWeight:700, letterSpacing:-0.3, color:"#1C1C1E" }}>{activeLabel}</div>
          <div style={{ fontSize:13, color:"#8E8E93" }}>{activeTracks.length} tracks</div>
        </div>
        {!activeTracks.length ? (
          <div style={{ textAlign:"center", color:"#AEAEB2", paddingTop:48 }}>
            <div style={{ fontSize:36, marginBottom:12 }}>{activeList==="liked"?"🎵":"🎶"}</div>
            <div style={{ fontSize:14 }}>{activeList==="liked"?"Heart tracks to save them here":"Add tracks using the ⋯ menu on any track"}</div>
          </div>
        ) : activeTracks.map(t => (
          <TrackRow key={t.id} track={t} onPlay={()=>onPlay(t)} active={currentTrack?.id===t.id} isPlaying={isPlaying} onLike={onLike} playlistCtx={playlistCtx} activePlaylistId={activeList}/>
        ))}
      </div>
    </div>
  );
}

// ─── PROFILE ─────────────────────────────────────────────────────────────────
const ALL_GENRES = [
  "Soul","R&B","Jazz","Blues","Funk",
  "Hip-Hop","Electronic","House","Techno","Ambient",
  "Reggae","Afrobeat","Latin","World","Folk",
  "Rock","Indie","Alternative","Classical","Experimental",
];

function ProfileScreen({ user, setUser, tracks, onLogout }) {
  const liked = tracks.filter(t=>t.liked).length;
  return (
    <div style={{ padding:"24px 16px 16px" }}>
      <div style={{ textAlign:"center", padding:"24px 0 28px" }}>
        <div style={{ width:80, height:80, borderRadius:"50%", background:"#F2F2F7", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px", fontSize:40, border:"2px solid rgba(60,60,67,0.12)" }}>{user.image}</div>
        <div style={{ fontSize:24, fontWeight:700, letterSpacing:-0.3, color:"#1C1C1E" }}>{user.name}</div>
        <div style={{ fontSize:12, color:"#8E8E93", marginTop:4, letterSpacing:1, fontWeight:600, textTransform:"uppercase" }}>Record Collector</div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:28 }}>
        {[["Saved",liked],["Genres",user.genres.length],["Radio","On"]].map(([label,val])=>(
          <div key={label} style={{ background:"#FFFFFF", border:"0.5px solid rgba(60,60,67,0.12)", borderRadius:14, boxShadow:"0 1px 4px rgba(0,0,0,0.04)", padding:"14px 0", textAlign:"center" }}>
            <div style={{ fontSize:24, fontWeight:700, letterSpacing:-0.5, color:"#1C1C1E" }}>{val}</div>
            <div style={{ fontSize:11, color:"#8E8E93", letterSpacing:0.5, marginTop:2, fontWeight:600, textTransform:"uppercase" }}>{label}</div>
          </div>
        ))}
      </div>
      <SectionLabel>Preferred Genres</SectionLabel>
      <div style={{ fontSize:12, color:"rgba(200,200,205,0.6)", marginBottom:12 }}>Tap to select — {user.genres.length} selected</div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:7, marginBottom:28 }}>
        {ALL_GENRES.map(g=>{
          const on=user.genres.includes(g);
          return <div key={g} onClick={()=>setUser(u=>({...u,genres:on?u.genres.filter(x=>x!==g):[...u.genres,g]}))}
            style={{ padding:"6px 13px", borderRadius:20, fontSize:12.5, fontWeight:on?600:400, cursor:"pointer", transition:"all 0.15s",
              border:`1px solid ${on?"rgba(252,60,68,0.3)":"rgba(60,60,67,0.12)"}`,
              background:on?"rgba(252,60,68,0.08)":"#FFFFFF",
              color:on?"#FC3C44":"#8E8E93" }}>{g}</div>;
        })}
      </div>
      <button onClick={onLogout} style={{...BTN_SECONDARY,width:"100%"}}>Sign Out</button>
    </div>
  );
}

// ─── ANALYTICS ROW ───────────────────────────────────────────────────────────
function AnalyticsRow({ rank, track, value, label, max, color, accent }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  const rgb = hexToRgbStr(color);
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", background:"#FFFFFF", borderRadius:12, marginBottom:4, border:"0.5px solid rgba(60,60,67,0.12)" }}>
      <div style={{ width:22, textAlign:"right", fontSize:14, fontWeight:700, color:"#AEAEB2", flexShrink:0 }}>{rank}</div>
      <div style={{ width:36, height:36, borderRadius:7, overflow:"hidden", flexShrink:0 }}>
        <AlbumArt track={track} size={36} borderRadius={0}/>
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:14, fontWeight:600, color:"#1C1C1E", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{track.title}</div>
        <div style={{ marginTop:5, background:"#F2F2F7", borderRadius:2, height:3, overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${pct}%`, borderRadius:3, background:accent, transition:"width 0.4s ease" }}/>
        </div>
      </div>
      <div style={{ flexShrink:0, textAlign:"right" }}>
        <div style={{ fontSize:18, fontWeight:700, color:accent, letterSpacing:-0.3 }}>{value}</div>
        <div style={{ fontSize:10, color:"#AEAEB2", fontWeight:600 }}>{label}</div>
      </div>
    </div>
  );
}

// ─── ADMIN ────────────────────────────────────────────────────────────────────
function AdminScreen({ tracks, setTracks, tab, setTab, editTrack, setEditTrack, showToast }) {
  const EMPTY = { title:"",artist:"",album:"",genre:"",energy:"",camelot:"",bpm:"",albumCover:"" };
  const [nt, setNt] = useState(EMPTY);
  const addTrack = () => {
    if (!nt.title||!nt.artist) { showToast("Title and artist required"); return; }
    const cols = ["#8899aa","#7a9e8a","#9090b0","#a09898","#88a8b0","#a0a0b8","#7aaa98"];
    setTracks(ts=>[...ts,{ id:Date.now(),...nt,energy:parseInt(nt.energy)||5,bpm:parseInt(nt.bpm)||null,liked:false,color:cols[Math.floor(Math.random()*cols.length)] }]);
    setNt(EMPTY); showToast("Track added");
  };
  return (
    <div style={{ padding:"24px 16px 16px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
        <div style={{ fontSize:20 }}>⚙️</div>
        <div style={{ fontSize:28, fontWeight:700, letterSpacing:-0.5, color:"#1C1C1E" }}>Admin</div>
      </div>
      <div style={{ display:"flex", gap:6, marginBottom:20, background:"rgba(18,18,20,0.65)", backdropFilter:"blur(16px)", borderRadius:12, padding:3, border:"1px solid rgba(255,255,255,0.07)" }}>
        {["tracks","analytics"].map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{ flex:1, padding:"8px 0", borderRadius:10, border:"none", cursor:"pointer", fontSize:13, fontWeight:600, textTransform:"capitalize", background:tab===t?"#FFFFFF":"transparent", color:tab===t?"#1C1C1E":"#AEAEB2", boxShadow:tab===t?"0 1px 3px rgba(0,0,0,0.06)":"none" }}>
            {t.charAt(0).toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>
      {tab==="tracks"&&(
        <div>
          {editTrack&&(
            <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.35)", backdropFilter:"blur(8px)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
              <div style={{ background:"#FFFFFF", borderRadius:20, padding:24, width:"100%", maxWidth:380, boxShadow:"0 16px 64px rgba(0,0,0,0.2)" }}>
                <div style={{ fontSize:18, fontWeight:600, color:"#1C1C1E", marginBottom:16 }}>Edit Track</div>
                {[["title","Title"],["artist","Artist"],["album","Album"],["genre","Genre"],["energy","Energy (1–10)"],["camelot","Camelot Key"],["bpm","BPM"],["albumCover","Cover URL"]].map(([k,p])=>(
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
          <button onClick={addTrack} style={{...BTN_PRIMARY,width:"100%",marginBottom:24,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><Icon name="plus" size={16}/> Add Track</button>
          <SectionLabel>Library ({tracks.length})</SectionLabel>
          {tracks.map(t=>(
            <div key={t.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", background:"#FFFFFF", borderRadius:10, marginBottom:4, border:"0.5px solid rgba(60,60,67,0.12)" }}>
              <div style={{ width:36, height:36, borderRadius:7, overflow:"hidden", flexShrink:0 }}><AlbumArt track={t} size={36} borderRadius={0}/></div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:14, fontWeight:500, color:"#1C1C1E", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.title}</div>
                <div style={{ fontSize:12, color:"#8E8E93" }}>{t.artist} · {t.genre}</div>
              </div>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:2, flexShrink:0 }}>
                <EnergyBar level={t.energy} color={t.color}/>
                {t.camelot&&<span style={{ fontSize:9, color:"#FC3C44", fontWeight:600 }}>{t.camelot}</span>}
              </div>
              <button onClick={()=>setEditTrack(t)} style={{ background:"none",border:"none",cursor:"pointer",color:"#8E8E93",padding:6 }}><Icon name="edit" size={14}/></button>
              <button onClick={()=>{setTracks(ts=>ts.filter(tr=>tr.id!==t.id));showToast("Deleted");}} style={{ background:"none",border:"none",cursor:"pointer",color:"#FF3B30",padding:6 }}><Icon name="trash" size={14}/></button>
            </div>
          ))}
        </div>
      )}
      {tab==="analytics"&&(
        <div>
          {/* ── Summary stats row ── */}
          <SectionLabel>Overview</SectionLabel>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:24 }}>
            {[["Tracks",tracks.length],["Liked",tracks.filter(t=>t.liked).length],["Genres",[...new Set(tracks.map(t=>t.genre))].length],["Keys",[...new Set(tracks.filter(t=>t.camelot).map(t=>t.camelot))].length]].map(([l,v])=>(
              <div key={l} style={{ padding:"14px 16px", background:"#FFFFFF", borderRadius:14, border:"0.5px solid rgba(60,60,67,0.12)", boxShadow:"0 1px 4px rgba(0,0,0,0.04)" }}>
                <div style={{ fontSize:11, fontWeight:600, letterSpacing:0.5, color:"#AEAEB2", textTransform:"uppercase", marginBottom:4 }}>{l}</div>
                <div style={{ fontSize:28, fontWeight:700, letterSpacing:-0.5, color:"#1C1C1E" }}>{v}</div>
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
    </div>
  );
}

// ─── NOW PLAYING BAR ──────────────────────────────────────────────────────────
function NowPlayingBar({ track, isPlaying, progress, duration, onTogglePlay, onSkip, onPrev, onLike, onSeek, repeat, setRepeat, isRadioMode, expanded, setExpanded }) {
  const pct = (progress/duration)*100;

  if (expanded) return (
    <div style={{ position:"fixed", inset:0, zIndex:90, overflow:"hidden" }}>
      <div style={{ position:"absolute", inset:0, background:`radial-gradient(ellipse at 50% 20%,rgba(${hexToRgbStr(track.color)},0.12) 0%,rgba(15,15,18,0.97) 65%)`, backdropFilter:"blur(40px)" }}/>
      <BgMist color={track.color}/>
      <div style={{ position:"absolute", inset:0, background:"rgba(6,6,8,0.5)" }}/>
      <div style={{ position:"relative", zIndex:1, height:"100%", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:32, gap:20 }}>
        <button onClick={()=>setExpanded(false)} style={{ position:"absolute", top:20, right:20, background:"rgba(255,255,255,0.15)", border:"none", borderRadius:"50%", width:36, height:36, cursor:"pointer", color:"#FFFFFF", backdropFilter:"blur(12px)", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <Icon name="x" size={18}/>
        </button>
        <div style={{ position:"relative" }}>
          {isPlaying&&<div style={{ position:"absolute", width:220, height:220, top:"50%", left:"50%", transform:"translate(-50%,-50%)", borderRadius:"50%", border:"1px solid rgba(255,255,255,0.15)", animation:"pulse-ring 2.5s ease-out infinite" }}/>}
          <VinylRecord track={track} isPlaying={isPlaying} size={190}/>
        </div>
        <div style={{ textAlign:"center" }}>
          {isRadioMode&&<div style={{ fontSize:11, color:"#FC3C44", letterSpacing:1.5, textTransform:"uppercase", marginBottom:6, fontWeight:700 }}>● Crate Radio</div>}
          <div style={{ fontSize:24, fontWeight:700, letterSpacing:-0.5, color:"#e8e8ea" }}>{track.title}</div>
          <div style={{ fontSize:15, color:"rgba(220,220,225,0.8)", marginTop:4 }}>{track.artist}</div>
          <div style={{ fontSize:12, color:"rgba(200,200,205,0.55)", marginTop:2 }}>{track.album} · {track.genre}</div>
          <div style={{ marginTop:10, display:"flex", justifyContent:"center", alignItems:"center", gap:12 }}>
            <EnergyBar level={track.energy} color={track.color} size="lg"/>
            {track.camelot&&<span style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,0.9)", background:"rgba(255,255,255,0.15)", padding:"2px 10px", borderRadius:6 }}>{track.camelot}</span>}
            {track.bpm&&<span style={{ fontSize:12, color:"rgba(200,200,205,0.6)" }}>{track.bpm} BPM</span>}
          </div>
        </div>
        <div style={{ width:"100%" }}>
          <input type="range" min={0} max={duration} value={progress} onChange={e=>onSeek(+e.target.value)} style={{ width:"100%", accentColor:track.color }}/>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"rgba(200,200,205,0.6)", marginTop:4 }}>
            <span>{fmtTime(progress)}</span><span>{fmtTime(duration)}</span>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:28 }}>
          <button onClick={onLike} style={{ background:"none",border:"none",cursor:"pointer",color:track.liked?"#FC3C44":"rgba(255,255,255,0.55)",padding:4 }}><Icon name={track.liked?"heart":"heartempty"} size={20}/></button>
          <button onClick={onPrev} style={CTRL_BTN}><Icon name="prev" size={22}/></button>
          <button onClick={onTogglePlay} style={{ ...CTRL_BTN,width:56,height:56,background:"#FC3C44",border:"none",borderRadius:"50%",color:"#FFFFFF" }}>
            <Icon name={isPlaying?"pause":"play"} size={26}/>
          </button>
          <button onClick={onSkip} style={CTRL_BTN}><Icon name="skip" size={22}/></button>
          <button onClick={()=>setRepeat(r=>!r)} style={{ background:"none",border:"none",cursor:"pointer",color:repeat?"#FC3C44":"rgba(255,255,255,0.55)",padding:4 }}><Icon name="repeat" size={18}/></button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ position:"fixed", bottom:56, left:0, right:0, zIndex:80, padding:"0 8px" }}>
      <div onClick={()=>setExpanded(true)} style={{ background:"rgba(249,249,249,0.94)", backdropFilter:"blur(24px) saturate(1.5)", borderRadius:14, padding:"10px 14px", display:"flex", alignItems:"center", gap:12, border:"0.5px solid rgba(60,60,67,0.12)", boxShadow:"0 2px 20px rgba(0,0,0,0.08)", cursor:"pointer" }}>
        <div style={{ width:38, height:38, borderRadius:8, overflow:"hidden", flexShrink:0 }}><AlbumArt track={track} size={38} borderRadius={0}/></div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:14, fontWeight:600, color:"#1C1C1E", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {isRadioMode&&<span style={{ fontSize:10, color:"#FC3C44", fontWeight:700, letterSpacing:1, marginRight:6 }}>●</span>}
            {track.title}
          </div>
          <div style={{ fontSize:12, color:"#8E8E93" }}>{track.artist}</div>
          <div style={{ marginTop:4, background:"#E5E5EA", borderRadius:2, height:2.5 }}>
            <div style={{ width:`${pct}%`, background:"#FC3C44", height:"100%", borderRadius:2, transition:"width 1s linear" }}/>
          </div>
        </div>
        <button onClick={e=>{e.stopPropagation();onLike();}} style={{ background:"none",border:"none",cursor:"pointer",color:track.liked?"#FC3C44":"#AEAEB2",padding:4 }}><Icon name={track.liked?"heart":"heartempty"} size={16}/></button>
        <button onClick={e=>{e.stopPropagation();onTogglePlay();}} style={{ background:"#FC3C44",border:"none",borderRadius:"50%",width:36,height:36,cursor:"pointer",color:"#FFFFFF",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
          <Icon name={isPlaying?"pause":"play"} size={18}/>
        </button>
        <button onClick={e=>{e.stopPropagation();onSkip();}} style={{ background:"none",border:"none",cursor:"pointer",color:"#8E8E93",padding:4 }}><Icon name="skip" size={18}/></button>
      </div>
    </div>
  );
}

// ─── BOTTOM NAV ───────────────────────────────────────────────────────────────
function BottomNav({ screen, setScreen }) {
  const items = [
    {id:"home",label:"Home",icon:"home"},{id:"search",label:"Search",icon:"search"},
    {id:"favorites",label:"Library",icon:"heartempty"},{id:"profile",label:"Profile",icon:"profile"},
    {id:"admin",label:"Admin",icon:"settings"},
  ];
  return (
    <div style={{ position:"fixed", bottom:0, left:0, right:0, height:56, background:"rgba(249,249,249,0.94)", backdropFilter:"blur(24px) saturate(1.5)", borderTop:"0.5px solid rgba(60,60,67,0.12)", display:"flex", zIndex:85 }}>
      {items.map(({id,icon,label})=>(
        <button key={id} onClick={()=>setScreen(id)} style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3,background:"none",border:"none",cursor:"pointer",color:screen===id?"#FC3C44":"#AEAEB2",transition:"color 0.18s",borderTop:screen===id?"2px solid #FC3C44":"2px solid transparent" }}>
          <Icon name={id==="favorites"?(screen===id?"heart":"heartempty"):icon} size={18}/>
          <span style={{ fontSize:10, fontWeight:600 }}>{label}</span>
        </button>
      ))}
    </div>
  );
}

function BgMist({ color="#909090" }) {
  return (
    <div style={{ position:"absolute", inset:0, pointerEvents:"none", zIndex:0, overflow:"hidden" }}>
      <div style={{ position:"absolute", top:"-15%", left:"20%", width:320, height:320, borderRadius:"50%", background:`radial-gradient(circle,rgba(${hexToRgbStr(color)},0.04) 0%,transparent 70%)`, filter:"blur(50px)", animation:"mist 14s ease-in-out infinite" }}/>
      <div style={{ position:"absolute", top:"40%", right:"-10%", width:260, height:260, borderRadius:"50%", background:"radial-gradient(circle,rgba(100,100,100,0.03) 0%,transparent 70%)", filter:"blur(60px)", animation:"mist 18s ease-in-out infinite reverse" }}/>
      <div style={{ position:"absolute", bottom:"20%", left:"-5%", width:200, height:200, borderRadius:"50%", background:"radial-gradient(circle,rgba(100,100,100,0.02) 0%,transparent 70%)", filter:"blur(45px)", animation:"mist 22s ease-in-out infinite" }}/>
    </div>
  );
}

const ToastEl = ({msg}) => (
  <div style={{ position:"fixed", bottom:120, left:"50%", transform:"translateX(-50%)", background:"rgba(30,30,30,0.88)", backdropFilter:"blur(20px)", color:"#FFFFFF", padding:"10px 20px", borderRadius:24, fontSize:13, zIndex:200, border:"1px solid rgba(255,255,255,0.1)", whiteSpace:"nowrap", fontWeight:600 }}>{msg}</div>
);

// ─── ROOT APP ─────────────────────────────────────────────────────────────────

// ─── ROOT APP — Firebase wired ────────────────────────────────────────────────
export default function App() {
  // ── Auth (login/signup/logout + user profile) ───────────────────────────
  const { firebaseUser, profile, setProfile, loading: authLoading, signUp, logIn, logOut } = useAuth();

  // ── App state ────────────────────────────────────────────────────────────
  const [screen, setScreen]           = useState("home");
  const [tracks, setTracks]           = useState([]);          // loaded from Firestore
  const [tracksLoading, setTracksLoading] = useState(true);
  const [currentTrack, setCurrent]    = useState(null);
  const [isPlaying, setIsPlaying]     = useState(false);
  const [progress, setProgress]       = useState(0);
  const [duration, setDuration]       = useState(0);
  const [repeat, setRepeat]           = useState(false);
  const [queue, setQueue]             = useState([]);
  const [isRadioMode, setIsRadioMode] = useState(false);
  const [searchQuery, setSearch]      = useState("");
  const [adminTab, setAdminTab]       = useState("tracks");
  const [editTrack, setEditTrack]     = useState(null);
  const [toast, setToast]             = useState(null);
  const [expanded, setExpanded]       = useState(false);
  const audioRef                      = useRef(null); // the real HTML5 audio element
  // ── Desktop detection (must be before any early returns) ─────────────────
  const [isDesktop, setIsDesktop]     = useState(() => window.innerWidth >= 900);
  useEffect(() => {
    const handle = () => setIsDesktop(window.innerWidth >= 900);
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);
  const [userPlaylists, setUserPlaylists] = useState([]); // [{id, name, trackIds:[]}]

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(null),2200); };

  // ── Load tracks from Firestore once on mount ────────────────────────────
  useEffect(() => {
    async function loadTracks() {
      try {
        const q    = query(collection(db, "tracks"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        const loaded = snap.docs.map(d => ({
          ...d.data(),          // spread data first
          id:    d.id,          // then override with real Firestore doc ID (never overwritten)
          liked: false,         // default; will be overridden from profile below
        }));
        setTracks(loaded);
      } catch (err) {
        console.error("Failed to load tracks:", err);
        showToast("Couldn't load tracks — check your connection");
      }
      setTracksLoading(false);
    }
    loadTracks();
  }, []);

  // ── Once profile loads, merge liked status + playlists into state ─────────
  useEffect(() => {
    if (!profile || !tracks.length) return;
    const likedSet = new Set(profile.likedTracks || []);
    setTracks(prev => prev.map(t => ({ ...t, liked: likedSet.has(t.id) })));
    if (profile.playlists) setUserPlaylists(profile.playlists);
  }, [profile?.likedTracks, tracks.length]);

  // ── User object shaped like the rest of the app expects ─────────────────
  const user = {
    name:   profile?.displayName || "Digger",
    image:  profile?.profileImage || "🎧",
    genres: profile?.genres || [],
  };

  // ── Crossfade audio engine ───────────────────────────────────────────────
  // Two audio elements — A and B. We alternate between them for crossfade.
  // audioRef = currently playing, nextAudioRef = the one fading in.
  const nextAudioRef   = useRef(null);
  const crossfadeRef   = useRef(null); // interval for the crossfade ramp
  const isCrossfading  = useRef(false);
  const CROSSFADE_SECS = 15; // start crossfade this many seconds before track ends

  // Keep a ref to isRadioMode so audio listeners can read the latest value
  const isRadioModeRef = useRef(false);
  useEffect(() => { isRadioModeRef.current = isRadioMode; }, [isRadioMode]);

  // Keep refs to tracks/currentTrack for use inside closures
  const tracksRef      = useRef([]);
  const currentRef     = useRef(null);
  useEffect(() => { tracksRef.current = tracks; }, [tracks]);
  useEffect(() => { currentRef.current = currentTrack; }, [currentTrack]);

  const handleSkipRef = useRef(null);
  const primaryAudioCleanupRef = useRef(() => {});

  const bindPrimaryAudio = useCallback((audio) => {
    primaryAudioCleanupRef.current?.();

    const onTimeUpdate = () => {
      setProgress(Math.floor(audio.currentTime));
      if (isRadioModeRef.current && audio.duration && !isCrossfading.current) {
        const remaining = audio.duration - audio.currentTime;
        if (remaining <= CROSSFADE_SECS && remaining > 0) {
          startCrossfade();
        }
      }
    };

    const onLoadedMetadata = () => {
      setDuration(Math.floor(audio.duration || 0));
    };

    const onEnded = () => {
      if (!isRadioModeRef.current) handleSkipRef.current?.();
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);

    primaryAudioCleanupRef.current = () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  useEffect(() => {
    const a = new Audio(); a.volume = 1;
    const b = new Audio(); b.volume = 0;
    audioRef.current     = a;
    nextAudioRef.current = b;
    bindPrimaryAudio(a);

    return () => {
      clearInterval(crossfadeRef.current);
      primaryAudioCleanupRef.current?.();
      a.pause(); b.pause();
      a.src = ""; b.src = "";
    };
  }, [bindPrimaryAudio]);

  function startCrossfade() {
    if (isCrossfading.current) return;
    isCrossfading.current = true;

    const next = pickNextTrack(tracksRef.current, currentRef.current);
    if (!next?.audioUrl) { isCrossfading.current = false; return; }

    const fadeOut = audioRef.current;
    const fadeIn  = nextAudioRef.current;

    // Load and start the next track silently
    fadeIn.src    = next.audioUrl;
    fadeIn.volume = 0;
    fadeIn.play().catch(() => {});

    // Record the play
    if (firebaseUser) recordPlay(next.id, profile?.recentTracks || []).catch(()=>{});

    fadeIn.addEventListener("loadedmetadata", () => {
      setDuration(Math.floor(fadeIn.duration || 0));
    }, { once: true });

    // Ramp volumes over CROSSFADE_SECS
    const steps    = CROSSFADE_SECS * 20; // 20 steps per second
    const interval = 1000 / 20;
    let   step     = 0;

    clearInterval(crossfadeRef.current);
    crossfadeRef.current = setInterval(() => {
      step++;
      const t = step / steps;
      fadeOut.volume = Math.max(0, 1 - t);
      fadeIn.volume  = Math.min(1, t);

      if (step >= steps) {
        clearInterval(crossfadeRef.current);
        fadeOut.pause();
        fadeOut.src = "";
        fadeOut.volume = 1;

        // Swap refs so audioRef always points to the active player
        audioRef.current     = fadeIn;
        nextAudioRef.current = fadeOut;
        bindPrimaryAudio(fadeIn);

        setCurrent(next);
        isCrossfading.current = false;
      }
    }, interval);
  }

  // When track changes (non-crossfade — manual play), load fresh
  useEffect(() => {
    if (!currentTrack || !audioRef.current) return;
    // If we're crossfading in radio mode, the engine handles it — skip
    if (isCrossfading.current) return;
    const audio = audioRef.current;
    clearInterval(crossfadeRef.current);
    if (currentTrack.audioUrl) {
      audio.src = currentTrack.audioUrl;
      audio.volume = 1;
      audio.load();
      if (isPlaying) audio.play().catch(() => {});
    } else {
      audio.src = "";
    }
    setProgress(0);
  }, [currentTrack?.id]);

  // Sync play/pause
  useEffect(() => {
    if (!audioRef.current || !currentTrack?.audioUrl) return;
    if (isPlaying) { audioRef.current.play().catch(() => {}); }
    else           { audioRef.current.pause(); }
  }, [isPlaying]);

  // ── Playback actions ─────────────────────────────────────────────────────
  const playTrack = (track, q = null) => {
    setCurrent(track); setIsPlaying(true); setProgress(0); setIsRadioMode(false);
    if (q) setQueue(q.filter(t => t.id !== track.id));
    // Save to recent plays in Firestore (fire and forget)
    if (firebaseUser) recordPlay(track.id, profile?.recentTracks || []).catch(()=>{});
  };

  const playRadio = () => {
    if (!tracks.length) return;
    const first = pickNextTrack(tracks, null);
    setCurrent(first); setIsPlaying(true); setProgress(0); setIsRadioMode(true); setQueue([]);
    showToast("Crate Radio — on air");
    if (firebaseUser) recordPlay(first.id, profile?.recentTracks || []).catch(()=>{});
  };

  // Record a skip on the track that was skipped (only if it had played >2s, not auto-advance)
  const recordSkipOnFirestore = async (trackId) => {
    try {
      const { doc: fdoc, updateDoc: fup, increment: finc } = await import("firebase/firestore");
      await fup(fdoc(db, "tracks", trackId), { skipCount: finc(1) });
    } catch(e) {}
  };

  const handleSkip = () => {
    // Only count as a skip if user manually skipped (not end-of-track auto-advance)
    // We detect this by checking if progress < 95% of duration
    const pct = duration > 0 ? progress / duration : 0;
    if (currentTrack && firebaseUser && pct < 0.95) {
      recordSkipOnFirestore(currentTrack.id);
      // Also update local tracks state so analytics tab reflects it immediately
      setTracks(prev => prev.map(t => t.id === currentTrack.id ? { ...t, skipCount: (t.skipCount||0)+1 } : t));
    }
    if (isRadioMode) {
      const next = pickNextTrack(tracks, currentTrack);
      if (next) {
        setCurrent(next); setProgress(0); setIsPlaying(true);
        if (firebaseUser) recordPlay(next.id, profile?.recentTracks || []).catch(()=>{});
      }
      return;
    }
    if (!queue.length) { setIsPlaying(false); return; }
    const next = queue[0];
    setQueue(repeat ? [...queue.filter(t=>t.id!==next.id), currentTrack] : queue.filter(t=>t.id!==next.id));
    setCurrent(next); setProgress(0); setIsPlaying(true);
  };
  // Keep ref in sync so the audio "ended" listener always calls the latest handleSkip
  handleSkipRef.current = handleSkip;

  // Seek: move the real audio position when the user drags the bar
  const handleSeek = (seconds) => {
    setProgress(seconds);
    if (audioRef.current) audioRef.current.currentTime = seconds;
  };

  // Prev: if more than 3 seconds in, restart the track; otherwise go to previous
  const handlePrev = () => {
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      setProgress(0);
    } else {
      // No queue history yet — just restart
      audioRef.current && (audioRef.current.currentTime = 0);
      setProgress(0);
    }
  };

  // ── Like/unlike — optimistic UI + Firestore sync ────────────────────────
  const toggleLike = async (id) => {
    const track = tracks.find(t => t.id === id);
    if (!track) return;
    const nowLiked = !track.liked;
    const delta = nowLiked ? 1 : -1;

    // Update local state immediately so the heart feels instant
    setTracks(prev => prev.map(t => t.id === id ? {...t, liked: nowLiked, likeCount: Math.max(0,(t.likeCount||0)+delta)} : t));
    if (currentTrack?.id === id) setCurrent(t => ({...t, liked: nowLiked}));

    // Sync to Firestore in the background
    if (firebaseUser) {
      try {
        await fbToggleLike(id, track.liked);
        // Increment/decrement global likeCount on the track doc
        const { doc: fdoc, updateDoc: fup, increment: finc } = await import("firebase/firestore");
        await fup(fdoc(db, "tracks", id), { likeCount: finc(delta) });
      } catch(e) {
        // Roll back on failure
        setTracks(prev => prev.map(t => t.id === id ? {...t, liked: track.liked, likeCount: t.likeCount - delta} : t));
        showToast("Couldn't save — check your connection");
      }
    }
  };

  // ── Genre preferences ────────────────────────────────────────────────────
  const setUser = (updater) => {
    // updater might be a function or an object (ProfileScreen uses both)
    const updated = typeof updater === "function" ? updater(user) : updater;
    if (updated.genres && firebaseUser) {
      setProfile(p => ({ ...p, genres: updated.genres }));
      saveGenres(updated.genres).catch(() => showToast("Couldn't save genres"));
    }
  };

  // ── Playlist handlers ────────────────────────────────────────────────────
  // Playlists are stored per-user in Firestore users/{uid}.playlists
  const savePlaylists = async (updated) => {
    setUserPlaylists(updated);
    if (firebaseUser) {
      try {
        const { doc: fdoc, updateDoc: fupdate } = await import("firebase/firestore");
        await fupdate(fdoc(db, "users", firebaseUser.uid), { playlists: updated });
      } catch(e) {}
    }
  };

  const createPlaylist = (name, trackId = null) => {
    const newPl = { id: `pl_${Date.now()}`, name, trackIds: trackId ? [trackId] : [] };
    savePlaylists([...userPlaylists, newPl]);
  };

  const addToPlaylist = (trackId, playlistId) => {
    const updated = userPlaylists.map(pl =>
      pl.id === playlistId && !pl.trackIds.includes(trackId)
        ? { ...pl, trackIds: [...pl.trackIds, trackId] }
        : pl
    );
    savePlaylists(updated);
  };

  const removeFromPlaylist = (trackId, playlistId) => {
    const updated = userPlaylists.map(pl =>
      pl.id === playlistId ? { ...pl, trackIds: pl.trackIds.filter(id => id !== trackId) } : pl
    );
    savePlaylists(updated);
  };

  const deletePlaylist = (playlistId) => {
    savePlaylists(userPlaylists.filter(pl => pl.id !== playlistId));
  };

  // Load playlists from profile when it arrives
  // (profile.playlists is set when user was created or updated)

  // ── Playlist context — passed to every TrackRow so the menu works everywhere
  const playlistCtx = {
    playlists: userPlaylists,
    onCreate:  createPlaylist,
    onAdd:     addToPlaylist,
    onRemove:  removeFromPlaylist,
  };

  // ── Search ───────────────────────────────────────────────────────────────
  const searchResults = searchQuery.length > 1
    ? tracks.filter(t => [t.title, t.artist, t.genre, t.camelot || ""].some(v => String(v || "").toLowerCase().includes(searchQuery.toLowerCase())))
    : [];

  // ── Loading states ────────────────────────────────────────────────────────
  // Show nothing while we check if someone is already logged in
  if (authLoading) return (
    <div style={{...APP_STYLE, alignItems:"center", justifyContent:"center"}}>
      <div style={{ width:60, height:60, borderRadius:15, background:"linear-gradient(135deg, #FC3C44, #FF2D55)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:16, fontSize:28 }}>🎵</div>
      <div style={{ fontSize:15, color:"#8E8E93" }}>Loading…</div>
    </div>
  );

  // Not logged in — show login screen
  if (!firebaseUser) return <LoginScreen onSignUp={signUp} onLogIn={logIn}/>;

  // ── Inner app (shared between mobile + desktop phone column) ─────────────
  const innerApp = (
    <div style={{ ...APP_STYLE, position:"relative" }}>
      <BgMist color={currentTrack?.color}/>
      {toast && <ToastEl msg={toast}/>}
      {tracksLoading && (
        <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", zIndex:50, textAlign:"center" }}>
          <div style={{ width:56, height:56, borderRadius:14, background:"linear-gradient(135deg, #FC3C44, #FF2D55)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px", fontSize:24 }}>🎵</div>
          <div style={{ fontSize:14, color:"#8E8E93" }}>Loading your crate…</div>
        </div>
      )}
      <div style={{ flex:1, overflow:"auto", paddingBottom:currentTrack?120:56, zIndex:1, position:"relative" }}>
        {screen==="home"      && !tracksLoading && <HomeScreen tracks={tracks} onPlayRadio={playRadio} onTogglePlay={()=>setIsPlaying(p=>!p)} onPlayTrack={playTrack} currentTrack={currentTrack} isPlaying={isPlaying} onLike={toggleLike} isRadioMode={isRadioMode} playlistCtx={playlistCtx}/>}
        {screen==="search"    && <SearchScreen query={searchQuery} setQuery={setSearch} results={searchResults} onPlay={t=>playTrack(t,tracks)} onLike={toggleLike} currentTrack={currentTrack} isPlaying={isPlaying} playlistCtx={playlistCtx}/>}
        {screen==="favorites" && <FavoritesScreen tracks={tracks} onPlay={t=>{setIsRadioMode(false);playTrack(t,tracks);}} onLike={toggleLike} currentTrack={currentTrack} isPlaying={isPlaying} userPlaylists={userPlaylists} onCreatePlaylist={createPlaylist} onAddToPlaylist={addToPlaylist} onRemoveFromPlaylist={removeFromPlaylist} onDeletePlaylist={deletePlaylist} playlistCtx={playlistCtx}/>}
        {screen==="profile"   && <ProfileScreen user={user} setUser={setUser} tracks={tracks} onLogout={logOut}/>}
        {screen==="admin"     && <AdminScreen tracks={tracks} setTracks={setTracks} tab={adminTab} setTab={setAdminTab} editTrack={editTrack} setEditTrack={setEditTrack} showToast={showToast}/>}
      </div>
      {currentTrack && (
        <NowPlayingBar track={currentTrack} isPlaying={isPlaying} progress={progress} duration={duration}
          onTogglePlay={()=>setIsPlaying(p=>!p)} onSkip={handleSkip} onPrev={handlePrev}
          onLike={()=>toggleLike(currentTrack.id)} onSeek={handleSeek}
          repeat={repeat} setRepeat={setRepeat} isRadioMode={isRadioMode} expanded={expanded} setExpanded={setExpanded}/>
      )}
      <BottomNav screen={screen} setScreen={setScreen}/>
    </div>
  );

  // ── Mobile: render as-is ─────────────────────────────────────────────────
  if (!isDesktop) return innerApp;

  // ── Desktop: 3-column shell ───────────────────────────────────────────────
  const NAV_ITEMS = [
    { id:"home",      icon:"home",   label:"Home" },
    { id:"search",    icon:"search", label:"Search" },
    { id:"favorites", icon:"heart",  label:"Library" },
    { id:"profile",   icon:"user",   label:"Profile" },
  ];

  const recentTracks = [...tracks].slice(0, 6);

  return (
    <div style={{ display:"flex", height:"100vh", background:"#F2F2F7", overflow:"hidden", fontFamily:"-apple-system,'SF Pro Display','Helvetica Neue',Arial,sans-serif" }}>

      {/* ── LEFT SIDEBAR ─────────────────────────────────────────────────── */}
      <div style={{ width:220, flexShrink:0, background:"#FFFFFF", borderRight:"0.5px solid rgba(60,60,67,0.12)", display:"flex", flexDirection:"column", padding:"20px 0 24px" }}>

        {/* Logo */}
        <div style={{ padding:"0 20px 32px" }}>
          <div style={{ fontSize:18, fontWeight:700, letterSpacing:-0.3, color:"#1C1C1E" }}>Crate
          </div>
          <div style={{ fontSize:10, color:"#AEAEB2", letterSpacing:0.5, marginTop:1 }}>cratedigger.uk</div>
        </div>

        {/* Nav */}
        <div style={{ display:"flex", flexDirection:"column", gap:2, flex:1 }}>
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={()=>setScreen(item.id)} style={{
              display:"flex", alignItems:"center", gap:12, padding:"11px 20px",
              background:screen===item.id?"rgba(252,60,68,0.08)":"none",
              border:"none", borderLeft:screen===item.id?"3px solid #FC3C44":"3px solid transparent",
              color:screen===item.id?"#FC3C44":"#8E8E93",
              fontSize:14, fontWeight:screen===item.id?600:400,
              cursor:"pointer", textAlign:"left", transition:"all 0.15s",
              fontFamily:"inherit",
            }}>
              <Icon name={item.icon} size={16}/> {item.label}
            </button>
          ))}
          {firebaseUser?.uid === "5lPAI9N1jkMbVkUyIqLTqBvBf1t1" && (
            <button onClick={()=>setScreen("admin")} style={{
              display:"flex", alignItems:"center", gap:12, padding:"11px 20px",
              background:screen==="admin"?"rgba(252,60,68,0.08)":"none",
              border:"none", borderLeft:screen==="admin"?"3px solid #FC3C44":"3px solid transparent",
              color:screen==="admin"?"#FC3C44":"#8E8E93",
              fontSize:14, fontWeight:screen==="admin"?600:400,
              cursor:"pointer", textAlign:"left", transition:"all 0.15s",
              fontFamily:"inherit",
            }}>
              <Icon name="settings" size={16}/> Admin
            </button>
          )}
        </div>

        {/* User footer */}
        <div style={{ padding:"16px 20px 0", borderTop:"0.5px solid rgba(60,60,67,0.12)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:32, height:32, borderRadius:"50%", background:"#F2F2F7", border:"1px solid rgba(60,60,67,0.12)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15 }}>{user.image}</div>
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:"#1C1C1E" }}>{user.name}</div>
              <div style={{ fontSize:11, color:"#8E8E93" }}>Record Collector</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CENTRE: Phone frame ───────────────────────────────────────────── */}
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"24px 0" }}>
        <div style={{
          width:420, height:"calc(100vh - 48px)", maxHeight:860,
          borderRadius:28, overflow:"hidden",
          boxShadow:"0 16px 60px rgba(0,0,0,0.12), 0 0 0 0.5px rgba(0,0,0,0.08)",
          position:"relative", flexShrink:0,
        }}>
          {innerApp}
        </div>
      </div>

      {/* ── RIGHT PANEL ──────────────────────────────────────────────────── */}
      <div style={{ width:260, flexShrink:0, background:"#FFFFFF", borderLeft:"0.5px solid rgba(60,60,67,0.12)", display:"flex", flexDirection:"column", padding:"28px 20px 24px", overflowY:"auto" }}>

        {/* Now Playing */}
        <div style={{ marginBottom:28 }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:1, color:"#AEAEB2", textTransform:"uppercase", marginBottom:14 }}>Now Playing</div>
          {currentTrack ? (
            <div>
              <div style={{ width:"100%", aspectRatio:"1", borderRadius:12, overflow:"hidden", marginBottom:16, boxShadow:"0 4px 24px rgba(0,0,0,0.1)" }}>
                <img src={currentTrack.albumCover||"/covers/default.jpg"} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e=>{e.target.src="/covers/default.jpg";}}/>
              </div>
              <div style={{ fontSize:17, fontWeight:700, color:"#1C1C1E", marginBottom:4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{currentTrack.title}</div>
              <div style={{ fontSize:14, color:"#8E8E93", marginBottom:14, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{currentTrack.artist}</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {currentTrack.genre && <span style={{ fontSize:11, fontWeight:600, padding:"4px 10px", borderRadius:8, background:"#F2F2F7", color:"#1C1C1E", border:"0.5px solid rgba(60,60,67,0.12)" }}>{currentTrack.genre}</span>}
                {currentTrack.camelot && <span style={{ fontSize:11, fontWeight:600, padding:"4px 10px", borderRadius:8, background:"rgba(252,60,68,0.08)", color:"#FC3C44", border:"0.5px solid rgba(252,60,68,0.15)" }}>{currentTrack.camelot}</span>}
                {currentTrack.bpm && <span style={{ fontSize:11, fontWeight:600, padding:"4px 10px", borderRadius:8, background:"#F2F2F7", color:"#8E8E93", border:"0.5px solid rgba(60,60,67,0.12)", fontVariantNumeric:"tabular-nums" }}>{currentTrack.bpm} BPM</span>}
              </div>
              {/* Progress bar */}
              <div style={{ marginTop:16 }}>
                <div style={{ height:3, background:"#E5E5EA", borderRadius:2, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${duration?((progress/duration)*100):0}%`, background:"#FC3C44", borderRadius:2, transition:"width 0.5s linear" }}/>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", marginTop:5 }}>
                  <span style={{ fontSize:11, color:"#AEAEB2", fontVariantNumeric:"tabular-nums" }}>{Math.floor(progress/60)}:{String(progress%60).padStart(2,"0")}</span>
                  <span style={{ fontSize:11, color:"#AEAEB2", fontVariantNumeric:"tabular-nums" }}>{Math.floor(duration/60)}:{String(duration%60).padStart(2,"0")}</span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign:"center", padding:"32px 0", color:"#AEAEB2" }}>
              <div style={{ fontSize:36, marginBottom:10 }}>🎵</div>
              <div style={{ fontSize:13 }}>Nothing playing yet</div>
            </div>
          )}
        </div>

        {/* Recent tracks */}
        <div>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:1, color:"#AEAEB2", textTransform:"uppercase", marginBottom:12 }}>Recent Additions</div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {recentTracks.map(t => (
              <div key={t.id} onClick={()=>playTrack(t,tracks)} style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer", padding:"6px 8px", borderRadius:8, background:currentTrack?.id===t.id?"rgba(252,60,68,0.06)":"transparent", transition:"background 0.15s" }}>
                <div style={{ width:36, height:36, borderRadius:7, overflow:"hidden", flexShrink:0, boxShadow:"0 1px 4px rgba(0,0,0,0.08)" }}>
                  <img src={t.albumCover||"/covers/default.jpg"} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e=>{e.target.src="/covers/default.jpg";}}/>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:currentTrack?.id===t.id?600:400, color:currentTrack?.id===t.id?"#FC3C44":"#1C1C1E", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.title}</div>
                  <div style={{ fontSize:11, color:"#AEAEB2", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.artist}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SHARED STYLES ────────────────────────────────────────────────────────────
const APP_STYLE = {
  background:"#F2F2F7",
  minHeight:"100vh", height:"100vh", overflow:"hidden",
  fontFamily:"-apple-system,'SF Pro Display','SF Pro Text','Helvetica Neue',Arial,sans-serif",
  color:"#1C1C1E", position:"relative", display:"flex", flexDirection:"column",
  WebkitFontSmoothing:"antialiased", MozOsxFontSmoothing:"grayscale",
};
const INPUT_ST = {
  background:"#1a1a1c", border:"1px solid rgba(255,255,255,0.08)",
  borderRadius:8, padding:"12px 14px", color:"#1C1C1E", fontSize:15,
  fontFamily:"-apple-system,'SF Pro Text','Helvetica Neue',Arial,sans-serif", width:"100%", display:"block",
};
const BTN_PRIMARY = {
  background:"#FC3C44", color:"#FFFFFF",
  border:"none", borderRadius:10, padding:"13px 20px", fontSize:15, fontWeight:600,
  fontFamily:"-apple-system,'SF Pro Text','Helvetica Neue',Arial,sans-serif", cursor:"pointer",
};
const BTN_SECONDARY = {
  background:"#FFFFFF", color:"#8E8E93", border:"1px solid rgba(60,60,67,0.12)",
  borderRadius:10, padding:"13px 20px", fontSize:15, fontWeight:500,
  fontFamily:"-apple-system,'SF Pro Text','Helvetica Neue',Arial,sans-serif", cursor:"pointer",
};
const CTRL_BTN = {
  background:"none", border:"none", cursor:"pointer", color:"#8E8E93",
  display:"flex", alignItems:"center", justifyContent:"center", padding:8,
};
