import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth }                                  from "./useAuth";
import { toggleLike as fbToggleLike, recordPlay, saveGenres } from "./useUserData";
import { collection, getDocs, addDoc, query, orderBy, doc, updateDoc, setDoc } from "firebase/firestore";
import { db }                                       from "./firebase";
import {
  font, fontDisplay, color, radius, motion, timeOfDayGradient,
  APP_STYLE, INPUT_ST, BTN_PRIMARY, BTN_SECONDARY, CTRL_BTN, ADMIN_UID,
} from "./theme";
import { camelotCompatible, getEnergyRangeForHour, fmtTime, hexToRgbStr } from "./lib/harmony";
import {
  computeHumanState, findResonant, computeSignalTraits, pickNextTrack,
  buildSession, SESSION_PROFILES,
} from "./lib/engine";
import { CANONICAL_GENRES, normalizeGenre, GENRE_TONES } from "./lib/genres";

const injectStyles = () => {
  if (document.getElementById("verse-app-global-styles")) return;
  const s = document.createElement("style");
  s.id = "verse-app-global-styles";
  s.textContent = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --font: ${font}; --font-display: ${fontDisplay};
      --ink: ${color.ink}; --muted: ${color.muted}; --faint: ${color.faint};
      --line: ${color.line}; --canvas: ${color.canvas}; --accent: ${color.accent};
    }
    body { font-family: var(--font); background: var(--canvas); color: var(--ink); }
    ::-webkit-scrollbar { width: 4px; height: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(232,236,240,0.14); border-radius: 4px; }
    button { transition: opacity ${motion.fast}, background ${motion.base}, transform ${motion.fast}; font-family: var(--font); }
    button:active { opacity: 0.72; }
    button:focus-visible, input:focus-visible { outline: 2px solid ${color.accent}; outline-offset: 2px; }
    input:focus { outline: none; }
    input[type="range"] { -webkit-appearance: none; height: 3px; background: rgba(232,236,240,0.12); border-radius: 2px; outline: none; cursor: pointer; }
    input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%; background: ${color.accent}; border: none; cursor: pointer; }
    input[type="range"]::-moz-range-thumb { width: 14px; height: 14px; border-radius: 50%; background: ${color.accent}; border: none; cursor: pointer; }
    .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
    .hide-scroll::-webkit-scrollbar { display: none; }
    @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }
    @keyframes pulse-ring { 0%{transform:scale(1);opacity:0.3} 100%{transform:scale(1.5);opacity:0} }
    @keyframes breathe { 0%,100%{opacity:0.55} 50%{opacity:1} }
    @keyframes rise { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
    @keyframes fadeIn { from{opacity:0} to{opacity:1} }
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
    }
  `;
  document.head.appendChild(s);
};
injectStyles();


// Engine helpers imported from ./lib/harmony + ./lib/engine

function EnergyBar({ level, size="sm" }) {
  const h = size==="lg" ? [8,10,12,10,8,12,10,8,12,10] : [5,6,7,6,5,7,6,5,7,6];
  return (
    <div style={{ display:"flex", gap:size==="lg"?3:2, alignItems:"center" }}>
      {h.map((ht,i) => (
        <div key={i} style={{
          width: size==="lg"?4:2.5, height:ht,
          borderRadius:2,
          background: i < level ? color.accent : "rgba(232,236,240,0.12)",
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
    drift:      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 3c2 4 2 8 0 12s-2 8 0 12" opacity="0.5"/><path d="M3 12c4-2 8-2 12 0s8 2 12 0" opacity="0.5"/></svg>,
    grid:       <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><circle cx="5" cy="7" r="2"/><circle cx="19" cy="7" r="2"/><circle cx="5" cy="17" r="2"/><circle cx="19" cy="17" r="2"/><path d="M7 8l3 3M17 8l-3 3M7 16l3-3M17 16l-3-3"/></svg>,
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

// ─── RADIO — home hero station ────────────────────────────────────────────────
function DeepCutsCard({ onPlay, onTogglePlay, currentTrack, isPlaying, isRadioMode, signalLabel, previewTracks = [] }) {
  const hour = new Date().getHours();
  const [eMin, eMax] = getEnergyRangeForHour(hour);
  const timeLabel = hour>=22||hour<=1?"Late Night":hour<=5?"Deep Hours":hour<=8?"Early Morning":hour<=11?"Morning":hour<=14?"Midday":hour<=17?"Afternoon":"Evening";
  const energyLevel = currentTrack?.energy || Math.round((eMin+eMax)/2);
  const previews = (previewTracks || []).filter(t => (t.duration||0) <= 900 && t.liked).slice(0, 5);
  const cover = currentTrack?.albumCover;
  const live = isRadioMode && currentTrack;

  return (
    <div onClick={live ? undefined : onPlay} role={live ? undefined : "button"}
      style={{
        cursor: live ? "default" : "pointer",
        background: color.station,
        borderRadius: 32,
        padding: live ? "28px 26px 26px" : "36px 26px 28px",
        position: "relative",
        overflow: "hidden",
        border: `1px solid ${color.lineStrong}`,
        minHeight: live ? 240 : 260,
        boxShadow: "0 24px 64px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)",
        animation: "rise 0.65s cubic-bezier(0.22,1,0.36,1) both",
      }}>
      {cover && (
        <div aria-hidden="true" style={{
          position:"absolute", inset:0,
          backgroundImage:`url(${cover})`, backgroundSize:"cover", backgroundPosition:"center",
          filter:"blur(48px) saturate(125%) brightness(0.38)", transform:"scale(1.3)", opacity:0.65,
        }}/>
      )}
      <div aria-hidden="true" style={{
        position:"absolute", inset:0,
        background: cover
          ? "linear-gradient(165deg, rgba(9,11,13,0.2) 0%, rgba(9,11,13,0.55) 42%, rgba(9,11,13,0.92) 100%)"
          : "linear-gradient(160deg, #182028 0%, #10151A 45%, #090B0D 100%)",
      }}/>
      <div aria-hidden="true" style={{
        position:"absolute", top:"-25%", left:"35%", width:320, height:320, borderRadius:"50%",
        background:`radial-gradient(circle, ${color.accentSoft} 0%, transparent 70%)`, pointerEvents:"none",
      }}/>

      <div style={{ position:"relative", zIndex:1, display:"flex", flexDirection:"column", height:"100%", minHeight: live ? 188 : 204 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{
              width:8, height:8, borderRadius:"50%",
              background: live && isPlaying ? color.accent : "rgba(232,236,240,0.2)",
              animation: live && isPlaying ? "breathe 2s ease-in-out infinite" : "none",
              boxShadow: live && isPlaying ? `0 0 0 5px ${color.accentSoft}` : "none",
            }}/>
            <span style={{
              fontSize:11, fontWeight:700, letterSpacing:2.2,
              color: live && isPlaying ? color.accent : "rgba(232,236,240,0.42)",
              textTransform:"uppercase", fontFamily: fontDisplay,
            }}>
              {live && isPlaying ? "On Air" : "Station"}
            </span>
          </div>
          <span style={{ fontSize:12, fontWeight:500, color:"rgba(232,236,240,0.36)", letterSpacing:0.3 }}>{live ? (currentTrack?.genre || timeLabel) : timeLabel}</span>
        </div>

        {live ? (
          <div style={{ marginTop:"auto", paddingTop:36 }}>
            <div style={{ display:"flex", gap:20, alignItems:"center", marginBottom:24 }}>
              <div style={{ width:96, height:96, borderRadius:18, overflow:"hidden", flexShrink:0, border:`1px solid ${color.lineStrong}`, boxShadow:"0 20px 48px rgba(0,0,0,0.5)" }}>
                <AlbumArt track={currentTrack} size={96} borderRadius={0}/>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:26, fontWeight:750, color: color.onDark, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", letterSpacing:-0.9, fontFamily: fontDisplay, lineHeight:1.08 }}>{currentTrack.title}</div>
                <div style={{ fontSize:15, color:"rgba(232,236,240,0.48)", marginTop:8, letterSpacing:-0.1 }}>{currentTrack.artist}</div>
                {(currentTrack.bpm || currentTrack.camelot) && (
                  <div style={{ fontSize:11, color:"rgba(232,236,240,0.28)", marginTop:8, fontVariantNumeric:"tabular-nums", letterSpacing:0.4 }}>
                    {[currentTrack.bpm && `${currentTrack.bpm} BPM`, currentTrack.camelot].filter(Boolean).join("  ·  ")}
                  </div>
                )}
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:14 }}>
              <button type="button" aria-label={isPlaying?"Pause":"Play"} onClick={e=>{e.stopPropagation();onTogglePlay();}}
                style={{ width:54, height:54, borderRadius:"50%", background: color.accent, border:"none", display:"flex", alignItems:"center", justifyContent:"center", color: color.onAccent, cursor:"pointer", flexShrink:0, boxShadow:"0 8px 24px rgba(122,145,164,0.28)" }}>
                <Icon name={isPlaying?"pause":"play"} size={20}/>
              </button>
              <div style={{ fontSize:13, color:"rgba(232,236,240,0.4)", letterSpacing:0.1 }}>{timeLabel}{signalLabel ? ` · ${signalLabel}` : ""}</div>
              <div style={{ flex:1 }}/>
              <div style={{ display:"flex", gap:3, alignItems:"flex-end", height:30 }} aria-hidden="true">
                {[1,2,3,4,5,6,7,8,9,10].map(i => (
                  <div key={i} style={{ width:3, height: 5 + i * 2.2, borderRadius:2, background: i <= energyLevel ? color.accent : "rgba(232,236,240,0.1)" }}/>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ marginTop:"auto", paddingTop:40 }}>
            <div style={{ fontSize:40, fontWeight:800, letterSpacing:-1.6, color: color.onDark, marginBottom:12, fontFamily: fontDisplay, lineHeight:0.95 }}>
              {timeLabel}
            </div>
            <div style={{ fontSize:15, color:"rgba(232,236,240,0.4)", marginBottom:32, lineHeight:1.55, maxWidth:280, letterSpacing:-0.1 }}>
              Press play. The hour shapes the set.
            </div>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                <button type="button" aria-label="Start radio" onClick={e=>{e.stopPropagation();onPlay();}}
                  style={{ width:58, height:58, borderRadius:"50%", background: color.accent, border:"none", display:"flex", alignItems:"center", justifyContent:"center", color: color.onAccent, cursor:"pointer", boxShadow:"0 10px 28px rgba(122,145,164,0.3)" }}>
                  <Icon name="play" size={22}/>
                </button>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:"rgba(232,236,240,0.72)", letterSpacing:-0.1 }}>Listen now</div>
                  {previews.length > 0 && (
                    <div style={{ display:"flex", marginTop:8 }}>
                      {previews.map((t,i) => (
                        <div key={t.id} style={{ width:26, height:26, borderRadius:7, overflow:"hidden", marginLeft:i>0?-7:0, border:`2px solid ${color.station}` }}>
                          <AlbumArt track={t} size={26} borderRadius={0}/>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display:"flex", gap:3, alignItems:"flex-end", height:30 }} aria-hidden="true">
                {[1,2,3,4,5,6,7,8,9,10].map(i => (
                  <div key={i} style={{ width:3, height: 5 + i * 2.2, borderRadius:2, background: (i >= eMin && i <= eMax) ? "rgba(122,145,164,0.55)" : "rgba(232,236,240,0.1)" }}/>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PLAYLIST MENU CONTEXT ────────────────────────────────────────────────────
// Passed down from App so every TrackRow can access playlists + handlers
const PlaylistCtx = { playlists:[], onCreate:()=>{}, onAdd:()=>{}, onRemove:()=>{}, activePlaylistId:null };

// ─── TRACK ROW ────────────────────────────────────────────────────────────────
function TrackRow({ track, onPlay, active, isPlaying, onLike, extraAction, playlistCtx, activePlaylistId }) {
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
      <div
        role="button"
        tabIndex={0}
        onClick={onPlay}
        onKeyDown={e=>{ if(e.key==="Enter"||e.key===" ") { e.preventDefault(); onPlay(); } }}
        style={{
          display:"flex", alignItems:"center", gap:12, padding:"10px 8px", borderRadius: radius.sm,
          cursor:"pointer", marginBottom:1,
          background: active ? color.accentSoft : "transparent",
        }}
      >
        <div style={{ width:44, height:44, borderRadius:9, overflow:"hidden", flexShrink:0, position:"relative" }}>
          <AlbumArt track={track} size={44} borderRadius={0}/>
          {active&&isPlaying&&(
            <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.4)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background: color.accent, animation:"pulse 1.2s ease-in-out infinite" }}/>
            </div>
          )}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:14, fontWeight: active?600:500, letterSpacing:-0.15, color: active ? color.accent : color.ink, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{track.title}</div>
          <div style={{ fontSize:12, color: color.muted, marginTop:2 }}>{track.artist}{normalizeGenre(track.genre) ? ` · ${normalizeGenre(track.genre)}` : ""}</div>
        </div>
        {onLike&&(
          <button type="button" aria-label={track.liked?"Unlike":"Like"} onClick={e=>{e.stopPropagation();onLike(track.id);}}
            style={{ background:"none", border:"none", cursor:"pointer", color: track.liked? color.accent : color.faint, padding:6 }}>
            <Icon name={track.liked?"heart":"heartempty"} size={16}/>
          </button>
        )}
        <button type="button" aria-label="More" onClick={e=>{e.stopPropagation();setMenuOpen(o=>!o);setShowNewPl(false);}}
          style={{ background:"none", border:"none", cursor:"pointer", color: color.faint, padding:"4px 6px", fontSize:18, lineHeight:1, flexShrink:0 }}>⋯</button>
        {extraAction||null}
      </div>

      {menuOpen && (
        <div onClick={e=>e.stopPropagation()}
          style={{ position:"absolute", right:8, top:52, zIndex:50, background: color.surfaceRaised, border:`1px solid ${color.lineStrong}`, borderRadius: radius.md, padding:"6px 0", minWidth:200, boxShadow:"0 16px 40px rgba(0,0,0,0.45)" }}>
          {ctx.playlists.length > 0 && (
            <>
              <div style={{ fontSize:10, fontWeight:650, letterSpacing:0.8, color: color.faint, padding:"6px 14px", textTransform:"uppercase" }}>Add to playlist</div>
              {ctx.playlists.map(pl => (
                <button key={pl.id} type="button" onClick={()=>handleAddTo(pl.id)}
                  style={{ display:"block", width:"100%", textAlign:"left", background:"none", border:"none", color: color.ink, fontSize:14, padding:"10px 14px", cursor:"pointer" }}>
                  {pl.name}
                </button>
              ))}
              <div style={{ height:1, background: color.line, margin:"4px 14px" }}/>
            </>
          )}
          {showNewPl ? (
            <div style={{ padding:"8px 12px" }}>
              <input autoFocus value={newPlName} onChange={e=>setNewPlName(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter")handleCreateAndAdd();if(e.key==="Escape")setShowNewPl(false);}}
                placeholder="Playlist name…"
                style={{ ...INPUT_ST, marginBottom:6, padding:"8px 10px", fontSize:13 }}/>
              <div style={{ display:"flex", gap:6 }}>
                <button type="button" onClick={handleCreateAndAdd} style={{ flex:1, background: color.accent, border:"none", borderRadius:8, color: color.onAccent, fontSize:13, fontWeight:600, padding:"8px 0", cursor:"pointer" }}>Create</button>
                <button type="button" onClick={()=>setShowNewPl(false)} style={{ flex:1, background:"transparent", border:`1px solid ${color.line}`, borderRadius:8, color: color.muted, fontSize:13, padding:"8px 0", cursor:"pointer" }}>Cancel</button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={()=>setShowNewPl(true)}
              style={{ display:"flex", alignItems:"center", gap:8, width:"100%", textAlign:"left", background:"none", border:"none", color: color.ink, fontSize:14, padding:"10px 14px", cursor:"pointer", fontWeight:500 }}>
              + New playlist
            </button>
          )}
          {activePlaylistId && activePlaylistId !== "liked" && (
            <>
              <div style={{ height:1, background: color.line, margin:"4px 14px" }}/>
              <button type="button" onClick={()=>{if(ctx.onResonance) ctx.onResonance(track); setMenuOpen(false);}}
                style={{ width:"100%", textAlign:"left", background:"none", border:"none", padding:"10px 14px", fontSize:13, color: color.ink, cursor:"pointer" }}>Find similar</button>
              <button type="button" onClick={()=>{ctx.onRemove(track.id, activePlaylistId);setMenuOpen(false);}}
                style={{ display:"block", width:"100%", textAlign:"left", background:"none", border:"none", color: color.alert, fontSize:14, padding:"10px 14px", cursor:"pointer" }}>
                Remove from playlist
              </button>
            </>
          )}
          <div style={{ height:1, background: color.line, margin:"4px 14px" }}/>
          <button type="button" onClick={()=>setMenuOpen(false)}
            style={{ display:"block", width:"100%", textAlign:"left", background:"none", border:"none", color: color.faint, fontSize:13, padding:"8px 14px", cursor:"pointer" }}>
            Close
          </button>
        </div>
      )}
    </div>
  );
}

const SectionLabel = ({ children, style={} }) => (
  <div style={{ fontSize:13, fontWeight:650, letterSpacing:-0.2, color: color.ink, marginBottom:12, fontFamily: fontDisplay, ...style }}>{children}</div>
);

// ─── LOGIN ────────────────────────────────────────────────────────────────────

function BrandGlyph({ size=84, light=false }) {
  return (
    <div aria-label="4AM" style={{
      fontSize: Math.max(14, Math.round(size * 0.42)),
      fontWeight: 800,
      letterSpacing: size >= 48 ? -1.8 : -0.9,
      color: light ? color.onDark : color.ink,
      lineHeight: 1,
      fontFamily: fontDisplay,
      userSelect: "none",
    }}>4AM</div>
  );
}

// ─── LOGIN SCREEN — wired to real Firebase auth ───────────────────────────────
function LoginScreen({ onSignUp, onLogIn, onGoogleSignIn, onPhoneOTP, onVerifyOTP, onResetPassword }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState("email");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmResult, setConfirmResult] = useState(null);
  const [phoneStep, setPhoneStep] = useState("enter");

  function resetMessages() {
    setError("");
    setNotice("");
  }

  function switchMethod(method) {
    setAuthMethod(method);
    resetMessages();
    setPhoneStep("enter");
    setOtp("");
    setConfirmResult(null);
  }

  async function handleGoogleSignIn() {
    resetMessages();
    setLoading(true);
    try {
      await onGoogleSignIn();
    } catch (e) {
      setError(e.message || "Google sign-in failed");
    }
    setLoading(false);
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      setError("Enter your email first, then tap Forgot password.");
      return;
    }
    resetMessages();
    setLoading(true);
    try {
      await onResetPassword(email.trim());
      setNotice("Password reset email sent. Check your inbox.");
    } catch (e) {
      const msg = {
        "auth/invalid-email": "That doesn't look like a valid email address.",
        "auth/user-not-found": "No account found with that email.",
        "auth/too-many-requests": "Too many attempts. Wait a moment and try again.",
      }[e.code] || "Couldn't send reset email right now.";
      setError(msg);
    }
    setLoading(false);
  }

  async function handleSendOTP() {
    if (!phone.trim()) {
      setError("Enter a phone number");
      return;
    }
    resetMessages();
    setLoading(true);
    try {
      const result = await onPhoneOTP(phone.trim(), "recaptcha-container");
      setConfirmResult(result);
      setPhoneStep("verify");
      setNotice("Verification code sent.");
    } catch (e) {
      const msg = {
        "auth/invalid-phone-number": "Invalid phone number format. Use +1234567890.",
        "auth/too-many-requests": "Too many attempts. Wait a moment.",
      }[e.code] || (e.message || "Couldn't send code");
      setError(msg);
    }
    setLoading(false);
  }

  async function handleVerifyOTP() {
    if (!otp.trim()) {
      setError("Enter the verification code");
      return;
    }
    resetMessages();
    setLoading(true);
    try {
      await onVerifyOTP(confirmResult, otp.trim());
    } catch (e) {
      setError("Invalid code — try again");
    }
    setLoading(false);
  }

  async function handleSubmit() {
    resetMessages();
    setLoading(true);
    try {
      if (mode === "signup") {
        if (!name.trim()) {
          setError("Enter a username");
          setLoading(false);
          return;
        }
        await onSignUp(email, pass, name.trim());
      } else {
        await onLogIn(email, pass);
      }
    } catch (e) {
      const msg = {
        "auth/invalid-email": "That doesn't look like a valid email address.",
        "auth/user-not-found": "No account found with that email.",
        "auth/wrong-password": "Wrong password — try again.",
        "auth/invalid-credential": "Wrong email or password.",
        "auth/email-already-in-use": "An account with that email already exists.",
        "auth/weak-password": "Password must be at least 6 characters.",
        "auth/too-many-requests": "Too many attempts. Wait a moment and try again.",
        "auth/network-request-failed": "Network error. Check your internet connection.",
      }[e.code] || "Something went wrong — please try again.";
      setError(msg);
    }
    setLoading(false);
  }

  return (
    <div style={{ ...APP_STYLE, background: color.canvas, justifyContent:"center" }}>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100%", gap:28, padding:24, width:"100%", maxWidth:420, margin:"0 auto" }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ margin:"0 auto 18px" }}>
            <BrandGlyph size={96} />
          </div>
          <div style={{ fontSize:14, color: color.muted, letterSpacing:0.2 }}>House music for late nights</div>
        </div>

        <div style={{ width:"100%", display:"flex", flexDirection:"column", gap:12, padding:22, borderRadius: radius.xl, background: color.surfaceSolid, border:`1px solid ${color.line}` }}>
          <div style={{ display:"flex", background: color.canvas, borderRadius: radius.sm, padding:3, gap:2 }}>
            {["login","signup"].map(m => (
              <button key={m} type="button" onClick={() => { setMode(m); resetMessages(); }} style={{ flex:1, padding:"10px 0", borderRadius:8, border:"none", cursor:"pointer", fontSize:13, fontWeight:600, background:mode===m? color.accent :"transparent", color:mode===m? color.onAccent: color.muted }}>
                {m === "login" ? "Log In" : "Sign Up"}
              </button>
            ))}
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
            {[{id:"email",label:"Email"},{id:"phone",label:"Phone"}].map(item => (
              <button key={item.id} type="button" onClick={() => switchMethod(item.id)} style={{ border:`1px solid ${color.line}`, background:authMethod===item.id? color.accentSoft:"transparent", color:authMethod===item.id? color.ink: color.muted, borderRadius: radius.sm, padding:"10px 12px", fontWeight:600, cursor:"pointer", fontSize:13 }}>
                {item.label}
              </button>
            ))}
          </div>

          {authMethod === "email" && (
            <>
              {mode === "signup" && <input placeholder="Username" aria-label="Username" style={INPUT_ST} value={name} onChange={e => setName(e.target.value)} />}
              <input placeholder="Email" type="email" aria-label="Email" style={INPUT_ST} value={email} onChange={e => setEmail(e.target.value)} />
              <input placeholder="Password" type="password" aria-label="Password" style={INPUT_ST} value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()} />
              {mode === "login" && (
                <button type="button" onClick={handleForgotPassword} disabled={loading} style={{ alignSelf:"flex-end", marginTop:-4, background:"none", border:"none", cursor:"pointer", color: color.muted, fontWeight:600, fontSize:12 }}>
                  Forgot password?
                </button>
              )}
              <button type="button" onClick={handleSubmit} disabled={loading} style={{ ...BTN_PRIMARY, opacity:loading ? 0.7 : 1 }}>
                {loading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
              </button>
            </>
          )}

          {authMethod === "phone" && (
            <>
              {phoneStep === "enter" ? (
                <>
                  <input placeholder="Phone (+15551234567)" type="tel" aria-label="Phone number" style={INPUT_ST} value={phone} onChange={e => setPhone(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSendOTP()} />
                  <button type="button" onClick={handleSendOTP} disabled={loading} style={{ ...BTN_PRIMARY, opacity:loading ? 0.7 : 1 }}>
                    {loading ? "Sending…" : "Send code"}
                  </button>
                </>
              ) : (
                <>
                  <input placeholder="6-digit code" inputMode="numeric" aria-label="Verification code" style={INPUT_ST} value={otp} onChange={e => setOtp(e.target.value)} onKeyDown={e => e.key === "Enter" && handleVerifyOTP()} />
                  <div style={{ display:"flex", gap:10 }}>
                    <button type="button" onClick={() => { setPhoneStep("enter"); setOtp(""); setConfirmResult(null); resetMessages(); }} style={{ ...BTN_SECONDARY, flex:1 }}>Edit number</button>
                    <button type="button" onClick={handleVerifyOTP} disabled={loading} style={{ ...BTN_PRIMARY, flex:1, opacity:loading ? 0.7 : 1 }}>
                      {loading ? "Verifying…" : "Verify"}
                    </button>
                  </div>
                </>
              )}
              <div id="recaptcha-container" />
            </>
          )}

          <div style={{ display:"flex", alignItems:"center", gap:10, margin:"2px 0" }}>
            <div style={{ flex:1, height:1, background: color.line }}/>
            <span style={{ fontSize:11, color: color.faint }}>or</span>
            <div style={{ flex:1, height:1, background: color.line }}/>
          </div>

          <button type="button" onClick={handleGoogleSignIn} disabled={loading} style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, width:"100%", padding:"13px 20px", borderRadius: radius.md, border:`1px solid ${color.lineStrong}`, background: color.surfaceSolid, cursor:"pointer", opacity:loading?0.6:1 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 0 0 0 12c0 1.94.46 3.77 1.28 5.39l3.56-2.77.01-.53z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            <span style={{ fontSize:14, fontWeight:600, color: color.ink }}>Continue with Google</span>
          </button>

          {error && (
            <div role="alert" style={{ fontSize:13, color: color.alert, background:"rgba(229,72,77,0.06)", border:`1px solid rgba(229,72,77,0.15)`, borderRadius: radius.sm, padding:"12px 14px", lineHeight:1.45 }}>
              {error}
            </div>
          )}
          {notice && (
            <div role="status" style={{ fontSize:13, color: color.body, background: color.canvas, border:`1px solid ${color.line}`, borderRadius: radius.sm, padding:"12px 14px", lineHeight:1.45 }}>
              {notice}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ROUTE BUILDER MODAL ──────────────────────────────────────────────────────
function RouteBuilderModal({ tracks, onClose, onPlayRoute }) {
  const [step, setStep] = useState(1);
  const [duration, setDuration] = useState(60);
  const [activity, setActivity] = useState(null);
  const [session, setSession] = useState(null);

  const activities = Object.entries(SESSION_PROFILES);

  function handleGenerate(act) {
    setActivity(act);
    const built = buildSession(tracks, duration, act);
    setSession(built);
    setStep(3);
  }

  function handleRegenerate() {
    if (activity) {
      const built = buildSession(tracks, duration, activity);
      setSession(built);
    }
  }

  const phases = session ? (() => {
    const groups = [];
    let current = null;
    session.forEach(t => {
      if (!current || current.name !== t._phase) {
        current = { name: t._phase, tracks: [] };
        groups.push(current);
      }
      current.tracks.push(t);
    });
    return groups;
  })() : [];

  const profile = activity ? SESSION_PROFILES[activity] : null;
  const totalMins = session ? Math.round(session.reduce((s,t)=>s+(t.duration||210),0)/60) : 0;

  // Full-screen immersive overlay
  return (
    <div style={{ position:"fixed", inset:0, zIndex:100, overflow:"hidden" }}>
      {/* Layered background */}
      <div style={{ position:"absolute", inset:0, background:"linear-gradient(180deg, rgba(12,12,16,0.95) 0%, rgba(8,8,12,0.98) 100%)" }}/>
      <BgMist color={session?.[0]?.color || "#6B7280"}/>
      <div style={{ position:"absolute", inset:0, background:"rgba(6,6,10,0.4)" }}/>

      {/* Content */}
      <div className="hide-scroll" style={{ position:"relative", zIndex:1, height:"100%", overflowY:"auto", display:"flex", flexDirection:"column" }}>

        {/* Header bar */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"20px 24px", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            {step > 1 && (
              <button onClick={()=>{ setStep(step-1); if(step===3) setSession(null); }}
                style={{ background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"8px 14px", fontSize:12, fontWeight:500, color:"rgba(255,255,255,0.5)", cursor:"pointer", backdropFilter:"blur(20px)" }}>Back</button>
            )}
            <div style={{ fontSize:11, fontWeight:600, letterSpacing:2, color:"rgba(255,255,255,0.3)", textTransform:"uppercase" }}>Session</div>
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"50%", width:36, height:36, cursor:"pointer", color:"rgba(255,255,255,0.4)", display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(20px)" }}>
            <Icon name="x" size={16}/>
          </button>
        </div>

        {/* Main content area — centered */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"0 32px 40px", maxWidth:560, margin:"0 auto", width:"100%" }}>

          {/* ── STEP 1: Duration ── */}
          {step === 1 && (
            <div style={{ width:"100%", textAlign:"center" }}>
              <div style={{ fontSize:32, fontWeight:700, color:"#FFFFFF", letterSpacing:-0.5, marginBottom:8 }}>Pick your timeline</div>
              <div style={{ fontSize:14, color:"rgba(255,255,255,0.35)", marginBottom:40 }}>How long do you want to listen?</div>
              <div style={{ display:"flex", gap:10, justifyContent:"center", marginBottom:48 }}>
                {[30,60,120,240,480].map(m => (
                  <button key={m} onClick={()=>setDuration(m)} style={{
                    width:64, height:64, borderRadius:16, border: duration===m ? "1px solid rgba(255,255,255,0.3)" : "1px solid rgba(255,255,255,0.08)",
                    background: duration===m ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)",
                    backdropFilter:"blur(24px)", color: duration===m ? "#FFFFFF" : "rgba(255,255,255,0.35)",
                    fontSize:16, fontWeight:600, cursor:"pointer", transition:"all 0.25s",
                    display:"flex", alignItems:"center", justifyContent:"center",
                  }}>
                    {m < 60 ? `${m}m` : `${m/60}h`}
                  </button>
                ))}
              </div>
              <button onClick={()=>setStep(2)} style={{ padding:"16px 48px", borderRadius:16, background:"rgba(255,255,255,0.1)", backdropFilter:"blur(24px)", border:"1px solid rgba(255,255,255,0.15)", color:"#FFFFFF", fontSize:16, fontWeight:600, cursor:"pointer", transition:"all 0.2s" }}>
                Continue
              </button>
            </div>
          )}

          {/* ── STEP 2: Activity ── */}
          {step === 2 && (
            <div style={{ width:"100%", textAlign:"center" }}>
              <div style={{ fontSize:32, fontWeight:700, color:"#FFFFFF", letterSpacing:-0.5, marginBottom:8 }}>What's the vibe?</div>
              <div style={{ fontSize:14, color:"rgba(255,255,255,0.35)", marginBottom:32 }}>{duration < 60 ? `${duration} minute` : `${Math.round(duration/60)} hour`} session</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(2, 1fr)", gap:10, textAlign:"left" }}>
                {activities.map(([id, prof]) => (
                  <button key={id} onClick={()=>handleGenerate(id)}
                    style={{ padding:"16px 18px", borderRadius:16, border:"1px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.04)", backdropFilter:"blur(32px)", cursor:"pointer", textAlign:"left", transition:"all 0.2s" }}>
                    <div style={{ fontSize:16, fontWeight:600, color:"#FFFFFF", letterSpacing:-0.2, marginBottom:10 }}>{prof.label}</div>
                    <div style={{ display:"flex", gap:2, alignItems:"flex-end", marginBottom:8 }}>
                      {prof.phases.map((ph,i) => (
                        <div key={i} style={{ flex:ph.p, height: 2 + ph.e * 2, borderRadius:2, background:`rgba(255,255,255,${0.06 + ph.e * 0.04})` }}/>
                      ))}
                    </div>
                    <div style={{ fontSize:10, color:"rgba(255,255,255,0.25)", letterSpacing:0.3 }}>{prof.phases.map(p=>p.name).join(" · ")}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 3: Session Generated — immersive preview ── */}
          {step === 3 && session && profile && (
            <div style={{ width:"100%" }}>
              {/* Hero */}
              <div style={{ textAlign:"center", marginBottom:32 }}>
                <div style={{ fontSize:11, fontWeight:600, letterSpacing:2, color:"rgba(255,255,255,0.25)", textTransform:"uppercase", marginBottom:8 }}>{profile.label} · {duration < 60 ? `${duration}min` : `${Math.round(duration/60)}h`}</div>
                <div style={{ fontSize:36, fontWeight:700, color:"#FFFFFF", letterSpacing:-0.5, marginBottom:4 }}>Your session is ready</div>
                <div style={{ fontSize:14, color:"rgba(255,255,255,0.35)" }}>{session.length} tracks · ~{totalMins} minutes</div>
              </div>

              {/* Phase timeline — visual arc */}
              <div style={{ marginBottom:32, padding:"0 8px" }}>
                <div style={{ display:"flex", borderRadius:12, overflow:"hidden", height:8, marginBottom:8, background:"rgba(255,255,255,0.04)" }}>
                  {profile.phases.map((ph,i) => (
                    <div key={i} style={{ flex:ph.p, background:`rgba(255,255,255,${0.05 + ph.e * 0.06})`, transition:"flex 0.3s" }}/>
                  ))}
                </div>
                <div style={{ display:"flex" }}>
                  {profile.phases.map((ph,i) => (
                    <div key={i} style={{ flex:ph.p, textAlign:"center" }}>
                      <div style={{ fontSize:9, fontWeight:600, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:0.5 }}>{ph.name}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Track list by phase */}
              <div style={{ maxHeight:320, overflowY:"auto", marginBottom:32, borderRadius:16, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", padding:"8px 0" }}>
                {phases.map((phase, pi) => (
                  <div key={pi}>
                    <div style={{ fontSize:9, fontWeight:700, letterSpacing:1.5, color:"rgba(255,255,255,0.2)", textTransform:"uppercase", padding:"12px 16px 6px" }}>{phase.name}</div>
                    {phase.tracks.map((t) => (
                      <div key={t.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"6px 16px" }}>
                        <div style={{ width:32, height:32, borderRadius:6, overflow:"hidden", flexShrink:0 }}><AlbumArt track={t} size={32} borderRadius={0}/></div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:13, fontWeight:500, color:"#FFFFFF", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.title}</div>
                          <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)" }}>{t.artist}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
                <button onClick={()=>{onPlayRoute(session.map(t=>{const {_phase,...rest}=t; return rest;}));onClose();}}
                  style={{ flex:1, maxWidth:280, padding:"16px 32px", borderRadius:16, background:"rgba(255,255,255,0.1)", backdropFilter:"blur(24px)", border:"1px solid rgba(255,255,255,0.15)", color:"#FFFFFF", fontSize:16, fontWeight:600, cursor:"pointer" }}>
                  Play
                </button>
                <button onClick={handleRegenerate}
                  style={{ width:52, height:52, borderRadius:16, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.4)", fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(20px)" }}>
                  ↻
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// ─── HARMONIC MAP — 2D visualization of library by key × energy ──────────────
function HarmonicMap({ tracks, onPlay, currentTrack }) {
  const canvasRef = useRef(null);
  const [hover, setHover] = useState(null);
  const singles = tracks.filter(t => t.camelot && t.energy && (t.duration||0) <= 900);

  // Parse camelot key to x position (1-12, A/B variants)
  function keyToX(camelot) {
    const num = parseInt(camelot);
    const isMinor = camelot.includes("A");
    return ((num - 1) / 11) * 0.85 + 0.075 + (isMinor ? 0 : 0.02);
  }

  // Energy to y position (inverted — high energy at top)
  function energyToY(e) {
    return 1 - ((e - 1) / 9) * 0.85 - 0.075;
  }

  const nodes = singles.map(t => ({
    track: t,
    x: keyToX(t.camelot),
    y: energyToY(t.energy),
    color: t.color || "#888",
    active: currentTrack?.id === t.id,
  }));

  return (
    <div style={{ padding:"24px 16px" }}>
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:18, fontWeight:700, color: color.ink, letterSpacing:-0.3, marginBottom:4 }}>Harmonic Map</div>
        <div style={{ fontSize:12, color: color.muted, lineHeight:1.5, marginBottom:12 }}>Your library visualized by musical key and energy. Each dot is a track — click to play. Tracks nearby sound great together.</div>
        <div style={{ display:"flex", gap:16, fontSize:10, color: color.muted }}>
          <span>← Low key · High key →</span>
          <span>↑ High energy · Low energy ↓</span>
          {currentTrack && <span style={{ color: color.ink, fontWeight:600 }}>● Now playing</span>}
        </div>
      </div>
      <div style={{ position:"relative", width:"100%", aspectRatio:"2/1", background: color.surfaceRaised, borderRadius:16, border:`1px solid ${color.line}`, overflow:"hidden", cursor:"crosshair" }}>
        {/* Grid lines */}
        {[1,2,3,4,5,6,7,8,9,10].map(e => (
          <div key={`e${e}`} style={{ position:"absolute", left:0, right:0, top:`${(1-((e-1)/9)*0.85-0.075)*100}%`, height:1, background: color.line }}/>
        ))}
        {[1,2,3,4,5,6,7,8,9,10,11,12].map(k => (
          <div key={`k${k}`} style={{ position:"absolute", top:0, bottom:0, left:`${((k-1)/11)*0.85*100+7.5}%`, width:1, background: color.line }}/>
        ))}

        {/* Key labels along bottom */}
        {[1,2,3,4,5,6,7,8,9,10,11,12].map(k => (
          <div key={`kl${k}`} style={{ position:"absolute", bottom:4, left:`${((k-1)/11)*0.85*100+7.5}%`, transform:"translateX(-50%)", fontSize:8, color: color.muted, fontWeight:500 }}>{k}</div>
        ))}

        {/* Energy labels along left */}
        {[2,4,6,8,10].map(e => (
          <div key={`el${e}`} style={{ position:"absolute", left:4, top:`${(1-((e-1)/9)*0.85-0.075)*100}%`, transform:"translateY(-50%)", fontSize:8, color: color.muted, fontWeight:500 }}>{e}</div>
        ))}

        {/* Track dots */}
        {nodes.map((n, i) => (
          <div key={n.track.id}
            onClick={()=>onPlay(n.track)}
            onMouseEnter={()=>setHover(n.track)}
            onMouseLeave={()=>setHover(null)}
            style={{
              position:"absolute",
              left:`${n.x * 100}%`, top:`${n.y * 100}%`,
              transform:"translate(-50%,-50%)",
              width: n.active ? 14 : 8,
              height: n.active ? 14 : 8,
              borderRadius:"50%",
              background: n.active ? color.accent : `rgba(${hexToRgbStr(n.color)},0.6)`,
              border: n.active ? "2px solid #FFFFFF" : "1px solid rgba(255,255,255,0.5)",
              boxShadow: n.active ? `0 0 12px rgba(${hexToRgbStr(n.color)},0.4)` : "none",
              transition:"all 0.2s",
              cursor:"pointer",
              zIndex: n.active ? 10 : hover?.id === n.track.id ? 5 : 1,
            }}/>
        ))}

        {/* Hover tooltip */}
        {hover && (
          <div style={{
            position:"absolute",
            left:`${keyToX(hover.camelot) * 100}%`,
            top:`${energyToY(hover.energy) * 100 - 5}%`,
            transform:"translate(-50%,-100%)",
            background:"rgba(26,29,38,0.9)", backdropFilter:"blur(12px)",
            borderRadius:8, padding:"6px 10px", pointerEvents:"none",
            whiteSpace:"nowrap", zIndex:20,
          }}>
            <div style={{ fontSize:11, fontWeight:600, color:"#FFF" }}>{hover.title}</div>
            <div style={{ fontSize:9, color:"rgba(255,255,255,0.5)" }}>{hover.artist} · {hover.camelot} · E{hover.energy}</div>
          </div>
        )}
      </div>
    </div>
  );
}




// ─── HYPNO VISION OVERLAY — "sounds like this" full-screen ──────────────────────
function HypnoVisionOverlay({ sourceTrack, tracks, onPlay, onClose }) {
  const similar = findResonant(sourceTrack, tracks, 12);
  const rgb = hexToRgbStr(sourceTrack.color);

  return (
    <div style={{ position:"fixed", inset:0, zIndex:95, overflow:"auto" }}>
      <div style={{ position:"absolute", inset:0, background:`radial-gradient(ellipse at 50% 20%, rgba(${rgb},0.08) 0%, rgba(8,8,12,0.92) 60%)`, backdropFilter:"blur(40px)" }} onClick={onClose}/>
      <div style={{ position:"relative", zIndex:1, maxWidth:520, margin:"0 auto", padding:"40px 24px" }}>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:32 }}>
          <div style={{ width:64, height:64, borderRadius:14, overflow:"hidden", flexShrink:0, boxShadow:`0 8px 32px rgba(${rgb},0.25)` }}>
            <AlbumArt track={sourceTrack} size={64} borderRadius={0}/>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:2, color:"rgba(255,255,255,0.25)", textTransform:"uppercase", marginBottom:4 }}>Hypno Vision</div>
            <div style={{ fontSize:18, fontWeight:700, color:"#FFFFFF", letterSpacing:-0.3 }}>{sourceTrack.title}</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginTop:2 }}>{sourceTrack.artist} · Tracks that feel like this</div>
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"50%", width:36, height:36, cursor:"pointer", color:"rgba(255,255,255,0.4)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Icon name="x" size={16}/>
          </button>
        </div>

        {/* Trait signature of source */}
        {sourceTrack._signal && (
          <div style={{ display:"flex", gap:12, marginBottom:24, justifyContent:"center" }}>
            {["grip","hold","pull","lift"].map(k => (
              <div key={k} style={{ textAlign:"center" }}>
                <div style={{ fontSize:16, fontWeight:700, color:"rgba(255,255,255,0.6)" }}>{sourceTrack._signal[k]}</div>
                <div style={{ fontSize:8, fontWeight:600, letterSpacing:1, color:"rgba(255,255,255,0.15)", textTransform:"uppercase" }}>{k}</div>
              </div>
            ))}
          </div>
        )}

        {/* Similar tracks grid */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:12 }}>
          {similar.map(t => (
            <div key={t.id} onClick={() => { onPlay(t); onClose(); }} style={{ cursor:"pointer", textAlign:"center" }}>
              <div style={{ width:"100%", aspectRatio:"1", borderRadius:12, overflow:"hidden", marginBottom:6, boxShadow:"0 4px 16px rgba(0,0,0,0.2)" }}>
                <AlbumArt track={t} size={200} borderRadius={0}/>
              </div>
              <div style={{ fontSize:11, fontWeight:500, color:"#FFFFFF", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.title}</div>
              <div style={{ fontSize:9, color:"rgba(255,255,255,0.35)" }}>{t.artist}</div>
              {t._signal && <div style={{ fontSize:8, color:"rgba(255,255,255,0.15)", marginTop:2 }}>{t._signal.label}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── SESSION AFTERGLOW — end-of-session overlay ──────────────────────────────
function AfterglowOverlay({ data, onClose, onSavePlaylist }) {
  if (!data || !data.tracks.length) return null;

  const tracks = data.tracks;
  const energies = tracks.map(t => t.energy || 5);
  const genres = [...new Set(tracks.map(t => t.genre).filter(Boolean))];
  const avgEnergy = (energies.reduce((s, e) => s + e, 0) / energies.length).toFixed(1);

  // Build energy arc SVG
  const width = 320;
  const height = 60;
  const step = width / Math.max(energies.length - 1, 1);
  const points = energies.map((e, i) => `${i * step},${height - ((e - 1) / 9) * height}`).join(" ");

  return (
    <div style={{ position:"fixed", inset:0, zIndex:95, display:"flex", alignItems:"center", justifyContent:"center", padding:32 }}>
      <div style={{ position:"absolute", inset:0, background:"rgba(8,8,12,0.85)", backdropFilter:"blur(40px)" }} onClick={onClose}/>
      <div style={{ position:"relative", zIndex:1, maxWidth:420, width:"100%", textAlign:"center" }}>
        {/* Hero */}
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:2, color:"rgba(255,255,255,0.25)", textTransform:"uppercase", marginBottom:12 }}>Session Complete</div>
        <div style={{ fontSize:32, fontWeight:700, color:"#FFFFFF", letterSpacing:-0.5, marginBottom:6 }}>{data.durationMins} minutes</div>
        <div style={{ fontSize:14, color:"rgba(255,255,255,0.35)", marginBottom:32 }}>{tracks.length} tracks · {genres.length} genres · avg energy {avgEnergy}</div>

        {/* Energy arc */}
        <div style={{ marginBottom:32 }}>
          <svg width={width} height={height} style={{ display:"block", margin:"0 auto" }}>
            <defs>
              <linearGradient id="arcGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(255,255,255,0.15)"/>
                <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
              </linearGradient>
            </defs>
            <polyline points={points} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <polygon points={`0,${height} ${points} ${width},${height}`} fill="url(#arcGrad)"/>
          </svg>
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
            <span style={{ fontSize:9, color:"rgba(255,255,255,0.2)" }}>Start</span>
            <span style={{ fontSize:9, color:"rgba(255,255,255,0.2)" }}>End</span>
          </div>
        </div>

        {/* Genre pills */}
        <div style={{ display:"flex", gap:6, justifyContent:"center", flexWrap:"wrap", marginBottom:32 }}>
          {genres.slice(0, 6).map(g => (
            <span key={g} style={{ fontSize:10, fontWeight:500, padding:"4px 10px", borderRadius:8, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.4)" }}>{g}</span>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
          <button onClick={() => {
            if (onSavePlaylist) {
              const name = `Session · ${new Date(data.startTime).toLocaleDateString()} ${new Date(data.startTime).toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"})}`;
              onSavePlaylist(name, tracks.map(t => t.id));
            }
            onClose();
          }} style={{
            padding:"14px 28px", borderRadius:14,
            background:"rgba(255,255,255,0.1)", backdropFilter:"blur(20px)",
            border:"1px solid rgba(255,255,255,0.12)",
            color:"#FFFFFF", fontSize:14, fontWeight:600, cursor:"pointer",
          }}>Save as playlist</button>
          <button onClick={onClose} style={{
            padding:"14px 28px", borderRadius:14,
            background:"transparent", border:"1px solid rgba(255,255,255,0.08)",
            color:"rgba(255,255,255,0.4)", fontSize:14, fontWeight:500, cursor:"pointer",
          }}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── DRIFT — immersive cinematic playback ─────────────────────────────────────
function ImmersivePlayer({ currentTrack, isPlaying, onTogglePlay, onSkip, onPrev, onClose, signalState }) {
  const [showUI, setShowUI] = useState(true);
  const [artLoaded, setArtLoaded] = useState(false);
  const hideTimer = useRef(null);

  // Auto-hide controls after 3 seconds of no interaction
  const resetHide = useCallback(() => {
    setShowUI(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowUI(false), 3000);
  }, []);

  useEffect(() => {
    resetHide();
    return () => clearTimeout(hideTimer.current);
  }, [currentTrack?.id]);

  // Reset art loaded state on track change
  useEffect(() => { setArtLoaded(false); }, [currentTrack?.id]);

  if (!currentTrack) return null;

  const rgb = hexToRgbStr(currentTrack.color);
  const traits = currentTrack._signal;
  const energy = currentTrack.energy || 5;
  const stateLabel = signalState?.label || "";

  // Pick the top 2 traits to display
  const traitPairs = traits ? Object.entries(traits)
    .filter(([k]) => k !== "label")
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2) : [];

  return (
    <div
      onMouseMove={resetHide}
      onClick={resetHide}
      style={{ position:"fixed", inset:0, zIndex:100, overflow:"hidden", background:"#0A0A0C", cursor: showUI ? "default" : "none" }}>

      {/* ── Layer 0: Deep background color wash ── */}
      <div style={{
        position:"absolute", inset:0,
        background:`radial-gradient(ellipse at 50% 30%, rgba(${rgb},0.15) 0%, rgba(${rgb},0.04) 40%, #0A0A0C 80%)`,
        transition:"background 2s ease",
      }}/>

      {/* ── Layer 1: Album art — full bleed, slowly zooming ── */}
      <div style={{
        position:"absolute", inset:-40,
        backgroundImage: currentTrack.albumCover ? `url(${currentTrack.albumCover})` : "none",
        backgroundSize:"cover", backgroundPosition:"center",
        filter:"blur(80px) saturate(150%) brightness(0.35)",
        transform:"scale(1.15)",
        transition:"background-image 1.5s ease, filter 1.5s ease",
        opacity: 0.7,
      }}/>

      {/* ── Layer 2: Center album art — sharp, floating ── */}
      <div style={{
        position:"absolute", inset:0,
        display:"flex", alignItems:"center", justifyContent:"center",
      }}>
        <div style={{
          width:"min(55vh, 55vw)", height:"min(55vh, 55vw)",
          borderRadius:20, overflow:"hidden",
          boxShadow:"0 24px 64px rgba(0,0,0,0.45)",
          transition:"box-shadow 2s ease",
        }}>
          {currentTrack.albumCover ? (
            <img
              src={currentTrack.albumCover} alt=""
              onLoad={()=>setArtLoaded(true)}
              style={{ width:"100%", height:"100%", objectFit:"cover", display:"block", opacity:artLoaded?1:0, transition:"opacity 0.8s ease" }}
            />
          ) : (
            <div style={{ width:"100%", height:"100%", background:`linear-gradient(135deg, rgba(${rgb},0.4), #141416)`, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <div style={{ fontSize:80, fontWeight:700, color:`rgba(${rgb},0.3)`, letterSpacing:-4 }}>{(currentTrack.title||"V")[0]}</div>
            </div>
          )}
        </div>
      </div>


      {/* ── Layer 4: Track info — bottom left ── */}
      <div style={{
        position:"absolute", bottom:48, left:48,
        opacity: showUI ? 1 : 0.6,
        transition:"opacity 0.5s ease",
        maxWidth:"50%",
      }}>
        <div style={{ fontSize:32, fontWeight:700, color:"#FFFFFF", letterSpacing:-0.5, lineHeight:1.2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
          {currentTrack.title}
        </div>
        <div style={{ fontSize:16, color:"rgba(255,255,255,0.5)", marginTop:6, letterSpacing:-0.2 }}>
          {currentTrack.artist}
        </div>
        <div style={{ fontSize:12, color:"rgba(255,255,255,0.25)", marginTop:4 }}>
          {currentTrack.album}{currentTrack.album && currentTrack.genre ? " · " : ""}{currentTrack.genre}
        </div>
      </div>

      {/* ── Layer 5: Aura data — bottom right ── */}
      <div style={{
        position:"absolute", bottom:48, right:48,
        opacity: showUI ? 1 : 0.4,
        transition:"opacity 0.5s ease",
        textAlign:"right",
      }}>
        {/* Energy bar — vertical */}
        <div style={{ display:"flex", gap:2, justifyContent:"flex-end", alignItems:"flex-end", marginBottom:12 }}>
          {[1,2,3,4,5,6,7,8,9,10].map(i => (
            <div key={i} style={{
              width:3, height: 4 + i * 2.5, borderRadius:2,
              background: i <= energy ? `rgba(${rgb},0.5)` : "rgba(255,255,255,0.06)",
              transition:"background 1s ease",
            }}/>
          ))}
        </div>

        {/* BPM + Key */}
        <div style={{ fontSize:11, color:"rgba(255,255,255,0.2)", letterSpacing:1, fontVariantNumeric:"tabular-nums" }}>
          {currentTrack.bpm && `${currentTrack.bpm} BPM`}
          {currentTrack.bpm && currentTrack.camelot && "  ·  "}
          {currentTrack.camelot && currentTrack.camelot}
        </div>

        {/* Aura traits */}
        {traitPairs.length > 0 && (
          <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:8 }}>
            {traitPairs.map(([name, val]) => (
              <div key={name} style={{ fontSize:9, fontWeight:600, letterSpacing:1, color:"rgba(255,255,255,0.15)", textTransform:"uppercase" }}>
                {name} {val}
              </div>
            ))}
          </div>
        )}

        {/* State label */}
        {stateLabel && (
          <div style={{ fontSize:10, fontWeight:600, letterSpacing:1.5, color:"rgba(255,255,255,0.12)", textTransform:"uppercase", marginTop:6 }}>
            {stateLabel}
          </div>
        )}
      </div>

      {/* ── Layer 6: Minimal floating controls — center bottom, fade on idle ── */}
      <div style={{
        position:"absolute", bottom:48, left:"50%", transform:"translateX(-50%)",
        display:"flex", alignItems:"center", gap:24,
        opacity: showUI ? 1 : 0,
        transition:"opacity 0.5s ease",
        pointerEvents: showUI ? "auto" : "none",
      }}>
        <button onClick={onPrev} style={{ background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,0.4)", padding:8 }}>
          <Icon name="prev" size={18}/>
        </button>
        <button onClick={onTogglePlay} style={{
          width:52, height:52, borderRadius:"50%",
          background:"rgba(255,255,255,0.08)", backdropFilter:"blur(20px)",
          border:"1px solid rgba(255,255,255,0.12)",
          color:"#FFFFFF", cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          <Icon name={isPlaying?"pause":"play"} size={22}/>
        </button>
        <button onClick={onSkip} style={{ background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,0.4)", padding:8 }}>
          <Icon name="skip" size={18}/>
        </button>
      </div>

      {/* ── Top bar — back to browse ── */}
      <div style={{
        position:"absolute", top:20, left:20, right:20,
        display:"flex", justifyContent:"space-between", alignItems:"center",
        opacity: showUI ? 1 : 0,
        transition:"opacity 0.5s ease",
        pointerEvents: showUI ? "auto" : "none",
        zIndex: 2,
      }}>
        <button type="button" onClick={onClose} aria-label="Back to browse"
          style={{
            display:"flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.08)",
            border:"1px solid rgba(255,255,255,0.12)", borderRadius:999, padding:"10px 14px",
            color:"rgba(255,255,255,0.85)", cursor:"pointer", fontSize:13, fontWeight:600,
          }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>
          Browse
        </button>
        <div style={{ fontSize:12, fontWeight:750, letterSpacing:-0.5, color:"rgba(255,255,255,0.35)" }}>4AM</div>
      </div>
    </div>
  );
}

// ── Home — three acts only ────────────────────────────────────────────────────
const HomeSection = ({ label, count, children, delay = 0 }) => (
  <section style={{ margin:"0 0 44px", animation:`rise 0.6s cubic-bezier(0.22,1,0.36,1) ${delay}s both` }}>
    <div style={{ padding:"0 20px 18px", display:"flex", alignItems:"baseline", gap:12 }}>
      <h2 style={{ margin:0, fontSize:22, fontWeight:750, letterSpacing:-0.6, color: color.ink, fontFamily: fontDisplay }}>{label}</h2>
      {count != null && <span style={{ fontSize:12, color: color.faint, fontVariantNumeric:"tabular-nums" }}>{count}</span>}
    </div>
    {children}
  </section>
);

function HomeScreen({ tracks, onPlayRadio, onTogglePlay, onPlayTrack, currentTrack, isPlaying, onLike, isRadioMode, playlistCtx, signalLabel }) {
  const singles = tracks.filter(t => (t.duration || 0) <= 900);
  const topTracks = [...singles].sort((a, b) => (b.playCount || 0) - (a.playCount || 0)).slice(0, 8);
  const recentlySaved = [...singles].filter(t => t.liked).slice(0, 12);
  const activeId = currentTrack?.id;

  return (
    <div style={{ position:"relative", paddingBottom:36 }}>
      <div aria-hidden="true" style={{
        position:"absolute", top:0, left:0, right:0, height:340, pointerEvents:"none",
        background: timeOfDayGradient(),
      }}/>

      <header style={{ position:"relative", padding:"20px 20px 2px", display:"flex", alignItems:"center", justifyContent:"space-between", animation:"fadeIn 0.45s ease both" }}>
        <div style={{ fontSize:16, fontWeight:800, letterSpacing:-0.5, color: color.ink, fontFamily: fontDisplay }}>4AM</div>
        <div style={{ fontSize:11, fontWeight:600, letterSpacing:1.4, textTransform:"uppercase", color: color.faint, fontFamily: fontDisplay }}>Home</div>
      </header>

      {/* 1 — Radio */}
      <div style={{ position:"relative", padding:"18px 16px 40px" }}>
        <DeepCutsCard
          onPlay={onPlayRadio}
          onTogglePlay={onTogglePlay}
          currentTrack={isRadioMode ? currentTrack : null}
          isPlaying={isPlaying}
          isRadioMode={isRadioMode}
          signalLabel={signalLabel}
          previewTracks={tracks}
        />
      </div>

      {/* 2 — Top played */}
      {topTracks.length > 0 && (
        <HomeSection label="Top played" count={topTracks.length} delay={0.05}>
          <div style={{
            margin:"0 16px",
            borderRadius:22,
            background: color.surfaceSolid,
            border:`1px solid ${color.line}`,
            overflow:"hidden",
            boxShadow:"0 1px 0 rgba(255,255,255,0.03) inset",
          }}>
            {topTracks.map((t, i) => {
              const active = activeId === t.id;
              const plays = t.playCount || 0;
              return (
                <div
                  key={t.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onPlayTrack(t, tracks)}
                  onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPlayTrack(t, tracks); } }}
                  style={{
                    display:"flex", alignItems:"center", gap:14, padding:"14px 16px",
                    cursor:"pointer",
                    background: active ? color.accentSoft : "transparent",
                    borderTop: i === 0 ? "none" : `1px solid ${color.line}`,
                    transition:"background 0.18s",
                  }}
                >
                  <div style={{
                    width:26, flexShrink:0, textAlign:"center",
                    fontSize:14, fontWeight:700, fontFamily: fontDisplay, fontVariantNumeric:"tabular-nums",
                    color: i < 3 ? color.accent : color.faint,
                  }}>{String(i + 1).padStart(2, "0")}</div>
                  <div style={{
                    width:56, height:56, borderRadius:12, overflow:"hidden", flexShrink:0, position:"relative",
                    boxShadow: active ? `0 0 0 2px ${color.accent}` : "0 8px 20px rgba(0,0,0,0.35)",
                  }}>
                    <AlbumArt track={t} size={56} borderRadius={0}/>
                    {active && isPlaying && (
                      <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.45)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <div style={{ width:7, height:7, borderRadius:"50%", background: color.accent, animation:"pulse 1.2s ease-in-out infinite" }}/>
                      </div>
                    )}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{
                      fontSize:15, fontWeight: active ? 650 : 550, letterSpacing:-0.3,
                      color: active ? color.accent : color.ink,
                      overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                    }}>{t.title}</div>
                    <div style={{ fontSize:12, color: color.muted, marginTop:4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {t.artist}{normalizeGenre(t.genre) ? ` · ${normalizeGenre(t.genre)}` : ""}
                    </div>
                  </div>
                  <div style={{ flexShrink:0, textAlign:"right" }}>
                    <div style={{ fontSize:11, color: color.faint, fontVariantNumeric:"tabular-nums" }}>{plays > 0 ? `${plays}×` : "—"}</div>
                  </div>
                  {onLike && (
                    <button
                      type="button"
                      aria-label={t.liked ? "Unlike" : "Like"}
                      onClick={e => { e.stopPropagation(); onLike(t.id); }}
                      style={{ background:"none", border:"none", cursor:"pointer", color: t.liked ? color.accent : color.faint, padding:6, marginLeft:2 }}
                    >
                      <Icon name={t.liked ? "heart" : "heartempty"} size={15}/>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </HomeSection>
      )}

      {/* 3 — Recently saved */}
      {recentlySaved.length > 0 && (
        <HomeSection label="Recently saved" count={recentlySaved.length} delay={0.1}>
          <div className="hide-scroll" style={{ display:"flex", gap:16, overflowX:"auto", padding:"0 16px 10px" }}>
            {recentlySaved.map((t, i) => {
              const active = activeId === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => onPlayTrack(t, tracks)}
                  style={{
                    flexShrink:0, width:160, cursor:"pointer",
                    animation:`rise 0.55s cubic-bezier(0.22,1,0.36,1) ${0.08 + i * 0.03}s both`,
                  }}
                >
                  <div style={{
                    width:160, height:160, borderRadius:18, overflow:"hidden", marginBottom:12, position:"relative",
                    boxShadow: active ? `0 0 0 2px ${color.accent}` : "0 16px 40px rgba(0,0,0,0.42)",
                    transform: active ? "translateY(-3px)" : "none",
                    transition:"box-shadow 0.25s, transform 0.25s",
                  }}>
                    <AlbumArt track={t} size={160} borderRadius={0}/>
                    <div aria-hidden="true" style={{
                      position:"absolute", inset:0,
                      background:"linear-gradient(180deg, transparent 55%, rgba(9,11,13,0.55) 100%)",
                      opacity: active ? 1 : 0.35,
                      transition:"opacity 0.25s",
                    }}/>
                  </div>
                  <div style={{
                    fontSize:14, fontWeight: active ? 650 : 560, letterSpacing:-0.25,
                    color: active ? color.accent : color.ink,
                    overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                  }}>{t.title}</div>
                  <div style={{ fontSize:12, color: color.muted, marginTop:4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.artist}</div>
                </div>
              );
            })}
          </div>
        </HomeSection>
      )}
    </div>
  );
}

// ─── SEARCH ───────────────────────────────────────────────────────────────────
function SearchScreen({ query, setQuery, results, onPlay, onLike, currentTrack, isPlaying, playlistCtx }) {
  const suggestions = ["e7", "120bpm", "Soul", "8A", "House", "Jazz"];
  return (
    <div style={{ padding:"28px 16px 16px" }}>
      <div style={{ position:"relative", marginBottom:20 }}>
        <div style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color: color.faint }}><Icon name="search" size={16}/></div>
        <input
          placeholder="Track, artist, key, energy…"
          aria-label="Search"
          style={{...INPUT_ST, paddingLeft:42}}
          value={query}
          onChange={e=>setQuery(e.target.value)}
          autoFocus
        />
      </div>
      {!query && (
        <div style={{ display:"flex", gap:8, marginBottom:24, flexWrap:"wrap" }}>
          {CANONICAL_GENRES.map(g=>(
            <button key={g} type="button" onClick={()=>setQuery(g)} style={{
              padding:"8px 14px", borderRadius: radius.sm, border:`1px solid ${color.line}`,
              background: color.surface, color: color.body, fontSize:12, fontWeight:500, cursor:"pointer",
            }}>{g}</button>
          ))}
        </div>
      )}
      {query.length>1&&!results.length&&(
        <div style={{ textAlign:"center", padding:"56px 0", color: color.muted, fontSize:14 }}>No results for “{query}”</div>
      )}
      {results.map(t=>(
        <TrackRow key={t.id} track={t} onPlay={()=>onPlay(t)} active={currentTrack?.id===t.id} isPlaying={isPlaying} onLike={onLike} playlistCtx={playlistCtx}/>
      ))}
      {!query && (
        <div style={{ paddingTop:8 }}>
          <div style={{ fontSize:12, fontWeight:650, letterSpacing:-0.2, color: color.muted, marginBottom:12, fontFamily: fontDisplay }}>Try</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {suggestions.map(s => (
              <button key={s} type="button" onClick={() => setQuery(s)} style={{
                padding:"8px 14px", borderRadius: radius.sm, background:"transparent",
                border:`1px solid ${color.line}`, color: color.muted, fontSize:12, fontWeight:500, cursor:"pointer",
              }}>{s}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ENERGY SPARKLINE ─────────────────────────────────────────────────────────
function EnergySparkline({ tracks, width=120, height=24 }) {
  if (!tracks.length) return null;
  const energies = tracks.map(t => t.energy || 5);
  const max = 10;
  const step = width / Math.max(energies.length - 1, 1);
  const points = energies.map((e, i) => `${i * step},${height - (e / max) * height}`).join(" ");
  return (
    <svg width={width} height={height} style={{ display:"block", opacity:0.6 }}>
      <polyline points={points} fill="none" stroke={color.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ─── LIBRARY ─────────────────────────────────────────────────────────────────
function FavoritesScreen({ tracks, onPlay, onLike, currentTrack, isPlaying, userPlaylists, onCreatePlaylist, onAddToPlaylist, onRemoveFromPlaylist, onDeletePlaylist, playlistCtx }) {
  const [view, setView] = useState("discover"); // "discover" | "liked" | "genres" | "playlists" | playlist id
  const [showNewInput, setShowNewInput] = useState(false);
  const [newName, setNewName] = useState("");
  const [genreFilter, setGenreFilter] = useState(null);
  const [moodFilter, setMoodFilter] = useState(null);

  const singles = tracks.filter(t=>(t.duration||0)<=900);
  const likedTracks = tracks.filter(t => t.liked);
  const hour = new Date().getHours();
  const [eMin, eMax] = getEnergyRangeForHour(hour);

  // Genre map — only canonical labels
  const genreMap = {};
  CANONICAL_GENRES.forEach(g => { genreMap[g] = []; });
  singles.forEach(t => {
    const g = normalizeGenre(t.genre);
    if (!g) return;
    genreMap[g].push(t);
  });
  const genres = CANONICAL_GENRES.filter(g => genreMap[g].length > 0);

  // Mood system — curated late-night contexts using canonical genres only
  const MOOD_DEFS = [
    { id:"nocturnal",  label:"Nocturnal",  desc:"Late & locked in",     tone:"#141C28", filter: t => (t.energy||5) >= 3 && (t.energy||5) <= 6 && ["House","Drum and Bass"].includes(normalizeGenre(t.genre)) },
    { id:"deep",       label:"Deep",       desc:"Low lights, long builds", tone:"#121820", filter: t => (t.energy||5) <= 4 && ["House","Soul","Jazz","Classical"].includes(normalizeGenre(t.genre)) },
    { id:"groovy",     label:"Groovy",     desc:"Locked pocket",        tone:"#161E24", filter: t => (t.energy||5) >= 4 && (t.energy||5) <= 7 && ["R&B","Soul","House"].includes(normalizeGenre(t.genre)) },
    { id:"driving",    label:"Driving",    desc:"Forward motion",       tone:"#151C26", filter: t => (t.energy||5) >= 6 && (t.energy||5) <= 8 && (t.bpm||120) >= 115 },
    { id:"euphoric",   label:"Peak",       desc:"Hands up, eyes closed", tone:"#1A222C", filter: t => (t.energy||5) >= 7 && ["House","Drum and Bass"].includes(normalizeGenre(t.genre)) },
    { id:"warm",       label:"Warm",       desc:"Afterhours hush",      tone:"#181E24", filter: t => (t.energy||5) >= 3 && (t.energy||5) <= 5 && ["Soul","R&B","Jazz","Country"].includes(normalizeGenre(t.genre)) },
    { id:"melancholy", label:"Melancholy", desc:"Reflective & deep",    tone:"#141820", filter: t => (t.energy||5) <= 3 && ["Soul","Jazz","Classical","Country"].includes(normalizeGenre(t.genre)) },
    { id:"raw",        label:"Raw",        desc:"Gritty & unpolished",  tone:"#1A1C20", filter: t => (t.energy||5) >= 5 && ["Rock","Metal","Hip-Hop"].includes(normalizeGenre(t.genre)) },
  ];

  const moods = {};
  const moodMeta = {};
  MOOD_DEFS.forEach(def => {
    const matched = singles.filter(def.filter);
    if (matched.length >= 1) {
      moods[def.label] = matched;
      moodMeta[def.label] = def;
    }
  });
  const moodKeys = Object.keys(moods);

  // Time-based recommendations
  const timeRecs = singles.filter(t => (t.energy||5) >= eMin && (t.energy||5) <= eMax);
  const timeLabel = hour>=22||hour<=5?"Late night":hour<=8?"Early morning":hour<=12?"Morning":hour<=17?"Afternoon":"Evening";

  // For You — memoized, only reshuffles when tracks array changes
  const likedGenres = [...new Set(likedTracks.map(t=>t.genre).filter(Boolean))];
  const [forYou, setForYou] = useState([]);
  const forYouInitRef = useRef(null);
  useEffect(() => {
    const key = tracks.length + ":" + likedTracks.length;
    if (forYouInitRef.current === key) return;
    forYouInitRef.current = key;
    const likedG = [...new Set(likedTracks.map(t=>t.genre).filter(Boolean))];
    const candidates = likedG.length > 0
      ? singles.filter(t => likedG.includes(t.genre) && (t.energy||5)>=eMin && (t.energy||5)<=eMax && !t.liked)
      : singles.filter(t => (t.energy||5) >= eMin && (t.energy||5) <= eMax);
    const shuffled = [...candidates].sort(() => Math.random() - 0.5).slice(0, 24);
    setForYou(shuffled);
  }, [tracks.length, likedTracks.length]);

  // Active view tracks
  const isPlaylistView = view.startsWith("pl_");
  const activeTracks = view === "liked" ? likedTracks
    : view === "genres" ? (genreFilter ? (genreMap[genreFilter]||[]) : [])
    : isPlaylistView ? (() => { const pl = userPlaylists.find(p=>p.id===view); return (pl?.trackIds||[]).map(id=>tracks.find(t=>t.id===id)).filter(Boolean); })()
    : [];
  const activeLabel = view === "liked" ? "Saved" : view === "genres" ? (genreFilter||"Genres") : isPlaylistView ? (userPlaylists.find(p=>p.id===view)?.name||"Playlist") : "";

  function handleCreate() {
    if(!newName.trim()) return;
    onCreatePlaylist(newName.trim());
    setNewName(""); setShowNewInput(false);
  }

  const Pill = ({label, active, onClick}) => (
    <button type="button" onClick={onClick} style={{
      padding:"9px 15px", borderRadius:8, border:"none",
      background: active? color.accent :"transparent",
      color: active? color.onAccent: color.muted,
      fontSize:13, fontWeight:active?650:500, cursor:"pointer", flexShrink:0, letterSpacing:-0.1,
    }}>{label}</button>
  );

  const SectionHead = ({children, sub}) => (
    <div style={{ marginBottom:14 }}>
      <div style={{ fontSize:18, fontWeight:700, letterSpacing:-0.4, color: color.ink, fontFamily: fontDisplay }}>{children}</div>
      {sub && <div style={{ fontSize:12, color: color.muted, marginTop:4 }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ overflowY:"auto", height:"100%", minHeight:"calc(100vh - 112px)" }}>
      {/* Tab bar */}
      <div style={{ position:"sticky", top:0, zIndex:10, padding:"14px 16px 10px", background:"rgba(9,11,13,0.88)", backdropFilter:"blur(16px)" }}>
        <div style={{
          background: color.surfaceSolid,
          border: `1px solid ${color.line}`,
          borderRadius: radius.md,
          padding: 4,
          display:"inline-flex",
          gap: 2,
          maxWidth:"100%",
          overflowX:"auto",
        }}>
          <Pill label="Discover" active={view==="discover"} onClick={()=>setView("discover")}/>
          <Pill label="Saved" active={view==="liked"} onClick={()=>setView("liked")}/>
          <Pill label="Genres" active={view==="genres"} onClick={()=>{setView("genres");setGenreFilter(null);}}/>
          <Pill label="Playlists" active={view==="playlists"||isPlaylistView} onClick={()=>setView("playlists")}/>
        </div>
      </div>

      {/* ══ DISCOVER view — editorial late-night browse ══ */}
      {view === "discover" && (
        <div style={{ padding:"4px 0 32px" }}>
          <div style={{ padding:"8px 18px 22px", animation:"fadeIn 0.45s ease both" }}>
            <div style={{ fontSize:36, fontWeight:800, letterSpacing:-1.4, color: color.ink, fontFamily: fontDisplay, lineHeight:1 }}>Discover</div>
            <div style={{ fontSize:14, color: color.muted, marginTop:8, maxWidth:320, lineHeight:1.45 }}>
              Dig by hour, mood, and crate — not playlists that look like everyone else’s.
            </div>
          </div>

          {/* For You — large horizontal editorial cards */}
          {forYou.length > 0 && (
            <div style={{ marginBottom:28 }}>
              <div style={{ padding:"0 18px" }}>
                <SectionHead sub="Based on what you save and the hour">For you</SectionHead>
              </div>
              <div className="hide-scroll" style={{ display:"flex", gap:14, overflowX:"auto", padding:"0 18px 4px" }}>
                {forYou.slice(0, 12).map((t, i) => (
                  <div key={t.id} onClick={()=>onPlay(t)} style={{
                    flexShrink:0, width: i === 0 ? 220 : 156, cursor:"pointer",
                    animation:`rise 0.5s cubic-bezier(0.22,1,0.36,1) ${Math.min(i,6)*0.04}s both`,
                  }}>
                    <div style={{
                      width:"100%", aspectRatio: i===0 ? "1/1.05" : "1",
                      borderRadius:14, overflow:"hidden", marginBottom:10, position:"relative",
                      boxShadow: currentTrack?.id===t.id ? `0 0 0 2px ${color.accent}` : "0 10px 28px rgba(0,0,0,0.4)",
                    }}>
                      <AlbumArt track={t} size={240} borderRadius={0}/>
                      {i === 0 && (
                        <div style={{
                          position:"absolute", inset:0,
                          background:"linear-gradient(180deg, transparent 45%, rgba(9,11,13,0.85) 100%)",
                          display:"flex", alignItems:"flex-end", padding:14,
                        }}>
                          <div>
                            <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.4, color: color.accent, textTransform:"uppercase", marginBottom:4 }}>Featured</div>
                            <div style={{ fontSize:16, fontWeight:700, color:"#FFF", letterSpacing:-0.3, fontFamily: fontDisplay }}>{t.title}</div>
                            <div style={{ fontSize:12, color:"rgba(255,255,255,0.55)", marginTop:2 }}>{t.artist}</div>
                          </div>
                        </div>
                      )}
                    </div>
                    {i !== 0 && (
                      <>
                        <div style={{ fontSize:13, fontWeight:600, color: color.ink, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", letterSpacing:-0.2 }}>{t.title}</div>
                        <div style={{ fontSize:11, color: color.muted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", marginTop:3 }}>{t.artist}</div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Right now — time-based horizontal strip */}
          {timeRecs.length > 0 && (
            <div style={{ marginBottom:28 }}>
              <div style={{ padding:"0 18px" }}>
                <SectionHead sub="Energy matched to this hour">{timeLabel} picks</SectionHead>
              </div>
              <div className="hide-scroll" style={{ display:"flex", gap:12, overflowX:"auto", padding:"0 18px 4px" }}>
                {timeRecs.slice(0,14).map(t => (
                  <div key={t.id} onClick={()=>onPlay(t)} style={{ flexShrink:0, width:118, cursor:"pointer" }}>
                    <div style={{
                      width:118, height:118, borderRadius:12, overflow:"hidden", marginBottom:8,
                      boxShadow: currentTrack?.id===t.id ? `0 0 0 2px ${color.accent}` : "0 6px 18px rgba(0,0,0,0.35)",
                    }}>
                      <AlbumArt track={t} size={118} borderRadius={0}/>
                    </div>
                    <div style={{ fontSize:12, fontWeight:550, color: color.ink, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.title}</div>
                    <div style={{ fontSize:11, color: color.muted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", marginTop:2 }}>{t.artist}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Moods — tonal field tiles */}
          {moodKeys.length > 0 && (
          <div style={{ marginBottom:28, padding:"0 18px" }}>
            <SectionHead sub="Contexts for the booth and the walk home">Moods</SectionHead>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {moodKeys.map(mood => {
                const meta = moodMeta[mood];
                const cover = moods[mood][0];
                return (
                  <div key={mood} onClick={()=>{setView("genres");setGenreFilter(null);setMoodFilter(mood);}}
                    style={{
                      position:"relative", borderRadius:16, overflow:"hidden", cursor:"pointer",
                      minHeight:108, border:`1px solid ${color.line}`,
                      background: meta?.tone || color.surfaceRaised,
                    }}>
                    {cover && (
                      <div aria-hidden="true" style={{
                        position:"absolute", inset:0, opacity:0.35,
                        backgroundImage: cover.albumCover ? `url(${cover.albumCover})` : "none",
                        backgroundSize:"cover", backgroundPosition:"center", filter:"saturate(120%)",
                      }}/>
                    )}
                    <div style={{
                      position:"absolute", inset:0,
                      background:"linear-gradient(160deg, rgba(9,11,13,0.15) 0%, rgba(9,11,13,0.72) 100%)",
                    }}/>
                    <div style={{ position:"relative", zIndex:1, padding:"16px 14px", display:"flex", flexDirection:"column", justifyContent:"flex-end", minHeight:108 }}>
                      <div style={{ fontSize:16, fontWeight:700, color: color.ink, fontFamily: fontDisplay, letterSpacing:-0.3 }}>{mood}</div>
                      <div style={{ fontSize:11, color:"rgba(232,236,240,0.55)", marginTop:3 }}>{meta?.desc}</div>
                      <div style={{ fontSize:10, color: color.accent, marginTop:8, fontWeight:600 }}>{moods[mood].length} tracks</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          )}

          {/* Genre grid — art-backed tiles */}
          <div style={{ padding:"0 18px" }}>
            <SectionHead sub="Browse the collection by lane">Genres</SectionHead>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {genres.map(g => {
              const sample = genreMap[g][0];
              return (
                <div key={g} onClick={()=>{setView("genres");setGenreFilter(g);}}
                  style={{
                    position:"relative", borderRadius:14, overflow:"hidden", cursor:"pointer",
                    minHeight:88, border:`1px solid ${color.line}`,
                    background: GENRE_TONES[g] || color.surfaceRaised,
                  }}>
                  {sample?.albumCover && (
                    <div aria-hidden="true" style={{
                      position:"absolute", right:-8, top:-8, width:84, height:84, borderRadius:10, overflow:"hidden",
                      opacity:0.55, transform:"rotate(8deg)",
                    }}>
                      <AlbumArt track={sample} size={84} borderRadius={0}/>
                    </div>
                  )}
                  <div style={{ position:"relative", zIndex:1, padding:"16px 14px" }}>
                    <div style={{ fontSize:15, fontWeight:700, color: color.ink, fontFamily: fontDisplay, letterSpacing:-0.2 }}>{g}</div>
                    <div style={{ fontSize:11, color: color.muted, marginTop:4 }}>{genreMap[g].length} tracks</div>
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        </div>
      )}

      {/* ══ LIKED / GENRE / PLAYLIST views — track list ══ */}
      {(view === "liked" || view === "genres" || isPlaylistView) && (
        <div style={{ padding:"0 16px 16px" }}>
          {view === "genres" && !genreFilter && !moodFilter && (
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:16 }}>
              {genres.map(g => <Pill key={g} label={`${g} (${genreMap[g].length})`} active={false} onClick={()=>setGenreFilter(g)}/>)}
            </div>
          )}
          {view === "genres" && moodFilter && (
            <div style={{ marginBottom:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ fontSize:24, fontWeight:750, color: color.ink, fontFamily: fontDisplay, letterSpacing:-0.6 }}>{moodFilter}</div>
                <button type="button" onClick={()=>{setMoodFilter(null);setView("discover");}} style={{ background:"none", border:"none", color: color.muted, fontSize:13, cursor:"pointer" }}>← back</button>
              </div>
              <div style={{ fontSize:13, color: color.muted, marginTop:6 }}>{moods[moodFilter]?.length||0} tracks · {moodMeta[moodFilter]?.desc}</div>
            </div>
          )}
          {view === "genres" && genreFilter && !moodFilter && (
            <div style={{ marginBottom:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ fontSize:24, fontWeight:750, color: color.ink, fontFamily: fontDisplay, letterSpacing:-0.6 }}>{genreFilter}</div>
                <button type="button" onClick={()=>setGenreFilter(null)} style={{ background:"none", border:"none", color: color.muted, fontSize:13, cursor:"pointer" }}>← all genres</button>
              </div>
              <div style={{ fontSize:13, color: color.muted, marginTop:6 }}>{(genreMap[genreFilter]||[]).length} tracks</div>
            </div>
          )}
          {(view === "liked" || (view === "genres" && (genreFilter || moodFilter)) || isPlaylistView) && (
            <>
              {view === "liked" && (
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                  <div style={{ fontSize:24, fontWeight:750, color: color.ink, fontFamily: fontDisplay, letterSpacing:-0.6 }}>Saved</div>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:12, color: color.muted }}>{likedTracks.length}</span>
                    <EnergySparkline tracks={likedTracks}/>
                  </div>
                </div>
              )}
              {isPlaylistView && (
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                  <div style={{ fontSize:24, fontWeight:750, color: color.ink, fontFamily: fontDisplay, letterSpacing:-0.6 }}>{activeLabel}</div>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:12, color: color.muted }}>{activeTracks.length}</span>
                    <EnergySparkline tracks={activeTracks}/>
                  </div>
                </div>
              )}
              {(moodFilter ? (moods[moodFilter]||[]) : (genreFilter ? (genreMap[genreFilter]||[]) : activeTracks)).length === 0 ? (
                <div style={{ textAlign:"center", color: color.faint, paddingTop:48 }}>
                  <div style={{ fontSize:14 }}>No tracks yet</div>
                </div>
              ) : (moodFilter ? (moods[moodFilter]||[]) : (genreFilter ? (genreMap[genreFilter]||[]) : activeTracks)).map(t => (
                <TrackRow key={t.id} track={t} onPlay={()=>onPlay(t)} active={currentTrack?.id===t.id} isPlaying={isPlaying} onLike={onLike} playlistCtx={playlistCtx} activePlaylistId={isPlaylistView?view:undefined}/>
              ))}
            </>
          )}
        </div>
      )}

      {/* ══ PLAYLISTS view ══ */}
      {view === "playlists" && !isPlaylistView && (
        <div style={{ padding:"0 16px 16px" }}>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {userPlaylists.map(pl => {
              const plTracks = (pl.trackIds||[]).map(id=>tracks.find(t=>t.id===id)).filter(Boolean);
              return (
                <div key={pl.id} onClick={()=>setView(pl.id)}
                  style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", borderRadius:14, background: color.surface, border:`1px solid ${color.line}`, cursor:"pointer", transition:"all 0.2s" }}>
                  <div style={{ display:"flex", gap:2, flexShrink:0 }}>
                    {plTracks.slice(0,3).map((t,i)=>(
                      <div key={i} style={{ width:36, height:36, borderRadius:6, overflow:"hidden", marginLeft:i>0?-8:0, border:`1px solid ${color.canvas}` }}>
                        <AlbumArt track={t} size={36} borderRadius={0}/>
                      </div>
                    ))}
                    {plTracks.length === 0 && <div style={{ width:36, height:36, borderRadius:6, background: color.surfaceRaised, display:"flex", alignItems:"center", justifyContent:"center", color: color.faint }}><Icon name="plus" size={14}/></div>}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:14, fontWeight:600, color: color.ink }}>{pl.name}</div>
                    <div style={{ fontSize:11, color: color.muted }}>{plTracks.length} tracks</div>
                  </div>
                  <EnergySparkline tracks={plTracks} width={60} height={16}/>
                  <button type="button" onClick={e=>{e.stopPropagation();onDeletePlaylist(pl.id);}} style={{ background:"none", border:"none", color: color.faint, cursor:"pointer", padding:4, fontSize:14 }}>×</button>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop:12 }}>
            {showNewInput ? (
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <input autoFocus value={newName} onChange={e=>setNewName(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")handleCreate();if(e.key==="Escape"){setShowNewInput(false);setNewName("");}}} placeholder="Playlist name…" style={{ flex:1, ...INPUT_ST, padding:"10px 12px", fontSize:13 }}/>
                <button type="button" onClick={handleCreate} style={{ background: color.accent, border:"none", borderRadius:10, color: color.onAccent, fontSize:13, fontWeight:600, padding:"10px 16px", cursor:"pointer" }}>Create</button>
              </div>
            ) : (
              <button type="button" onClick={()=>setShowNewInput(true)} style={{ width:"100%", padding:"14px", borderRadius:14, border:`1px dashed ${color.lineStrong}`, background: color.surface, color: color.muted, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                <Icon name="plus" size={14}/> New playlist
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PROFILE ─────────────────────────────────────────────────────────────────
const ALL_GENRES = CANONICAL_GENRES;

function ProfileScreen({ user, setUser, tracks, onLogout }) {
  const liked = tracks.filter(t => t.liked);
  const singles = tracks.filter(t => (t.duration||0) <= 900);
  const played = singles.filter(t => (t.playCount||0) > 0);

  // ── Compute fingerprint data ──
  const topGenres = Object.entries(
    singles.reduce((acc, t) => { if(t.genre) acc[t.genre] = (acc[t.genre]||0) + (t.playCount||0) + (t.liked?3:0); return acc; }, {})
  ).sort((a,b) => b[1] - a[1]);
  const totalWeight = topGenres.reduce((s, g) => s + g[1], 0) || 1;

  const avgBpm = played.filter(t=>t.bpm).length
    ? Math.round(played.filter(t=>t.bpm).reduce((s,t) => s + t.bpm, 0) / played.filter(t=>t.bpm).length) : null;
  const avgEnergy = played.length
    ? (played.reduce((s,t) => s + (t.energy||5), 0) / played.length).toFixed(1) : null;

  // Energy personality — distribution across 1-10
  const energyDist = Array(10).fill(0);
  played.forEach(t => { energyDist[Math.min(9, Math.max(0, (t.energy||5) - 1))] += (t.playCount||1); });
  const maxEDist = Math.max(...energyDist, 1);

  // Top return tracks (highest pull)
  const returnTracks = singles
    .filter(t => t._signal?.pull >= 5)
    .sort((a, b) => (b._signal?.pull||0) - (a._signal?.pull||0))
    .slice(0, 5);

  // Skip tolerance
  const totalPlays = played.reduce((s,t) => s + (t.playCount||0), 0);
  const totalSkips = played.reduce((s,t) => s + (t.skipCount||0), 0);
  const skipRate = totalPlays > 0 ? Math.round((totalSkips / totalPlays) * 100) : 0;

  // Genre breadth
  const genreCount = new Set(singles.map(t => t.genre).filter(Boolean)).size;

  // Aura trait averages
  const traitAvgs = {};
  const traitKeys = ["grip","hold","pull","gravity","lift","descent"];
  traitKeys.forEach(k => {
    const vals = singles.filter(t => t._signal?.[k]).map(t => t._signal[k]);
    traitAvgs[k] = vals.length ? (vals.reduce((s,v) => s+v, 0) / vals.length).toFixed(1) : "—";
  });

  const CARD = { background: color.surfaceSolid, border: `1px solid ${color.line}`, borderRadius: radius.md, padding:"16px" };

  return (
    <div style={{ padding:"24px 16px 16px" }}>
      {/* Header */}
      <div style={{ textAlign:"center", padding:"16px 0 24px" }}>
        <div style={{ width:72, height:72, borderRadius:"50%", background: color.surfaceRaised, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 10px", fontSize:36, border: `1px solid ${color.lineStrong}` }}>{user.image}</div>
        <div style={{ fontSize:22, fontWeight:700, letterSpacing:-0.3, color: color.ink }}>{user.name}</div>
        <div style={{ fontSize:11, color: color.muted, marginTop:4 }}>{tracks.length} tracks · {genreCount} genres · {liked.length} saved</div>
      </div>

      {/* ── LISTENING FINGERPRINT ── */}
      <div style={{ fontSize:11, fontWeight:700, letterSpacing:1, color: color.ink, textTransform:"uppercase", marginBottom:12 }}>Listening Fingerprint</div>

      {/* Stats row */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:6, marginBottom:16 }}>
        {[
          [avgEnergy || "—", "avg energy"],
          [avgBpm || "—", "avg bpm"],
          [`${skipRate}%`, "skip rate"],
          [genreCount, "genres"],
        ].map(([val, label]) => (
          <div key={label} style={{...CARD, padding:"12px 10px", textAlign:"center" }}>
            <div style={{ fontSize:20, fontWeight:700, color: color.ink, letterSpacing:-0.3 }}>{val}</div>
            <div style={{ fontSize:8, color: color.muted, letterSpacing:0.8, marginTop:3, fontWeight:600, textTransform:"uppercase" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Energy personality — bar chart */}
      <div style={{...CARD, marginBottom:16 }}>
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:0.8, color: color.muted, textTransform:"uppercase", marginBottom:12 }}>Energy Personality</div>
        <div style={{ display:"flex", gap:4, alignItems:"flex-end", height:60 }}>
          {energyDist.map((count, i) => (
            <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
              <div style={{ width:"100%", height: Math.max(2, (count / maxEDist) * 52), borderRadius:4, background: count > 0 ? color.accent : "rgba(232,236,240,0.06)", transition:"height 0.3s", opacity: count > 0 ? 0.15 + (count/maxEDist) * 0.85 : 0.3 }}/>
              <div style={{ fontSize:8, color: color.muted, fontWeight:500 }}>{i+1}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Genre constellation */}
      <div style={{...CARD, marginBottom:16 }}>
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:0.8, color: color.muted, textTransform:"uppercase", marginBottom:12 }}>Genre Map</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
          {topGenres.slice(0, 12).map(([genre, weight]) => {
            const pct = weight / totalWeight;
            const size = Math.max(11, Math.min(20, 11 + pct * 60));
            return (
              <span key={genre} style={{
                fontSize:size, fontWeight:pct > 0.1 ? 700 : 500,
                color: pct > 0.15 ? color.ink : pct > 0.05 ? color.body : color.faint,
                letterSpacing:-0.2, lineHeight:1.8,
              }}>{genre}</span>
            );
          })}
        </div>
      </div>

      {/* Aura traits */}
      <div style={{...CARD, marginBottom:16 }}>
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:0.8, color: color.muted, textTransform:"uppercase", marginBottom:12 }}>Aura Profile</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
          {traitKeys.map(k => (
            <div key={k} style={{ textAlign:"center" }}>
              <div style={{ fontSize:18, fontWeight:700, color: color.ink, letterSpacing:-0.3 }}>{traitAvgs[k]}</div>
              <div style={{ fontSize:8, color: color.muted, letterSpacing:0.8, fontWeight:600, textTransform:"uppercase", marginTop:2 }}>{k}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Return tracks — highest pull */}
      {returnTracks.length > 0 && (
        <div style={{...CARD, marginBottom:16 }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:0.8, color: color.muted, textTransform:"uppercase", marginBottom:10 }}>Always come back to</div>
          {returnTracks.map(t => (
            <div key={t.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"4px 0" }}>
              <div style={{ width:32, height:32, borderRadius:6, overflow:"hidden", flexShrink:0 }}><AlbumArt track={t} size={32} borderRadius={0}/></div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:500, color: color.ink, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.title}</div>
                <div style={{ fontSize:10, color: color.muted }}>{t.artist}</div>
              </div>
              <div style={{ fontSize:9, color: color.muted, fontWeight:600 }}>pull {t._signal?.pull}</div>
            </div>
          ))}
        </div>
      )}

      {/* Preferred Genres */}
      <div style={{ fontSize:11, fontWeight:700, letterSpacing:1, color: color.ink, textTransform:"uppercase", marginBottom:8, marginTop:8 }}>Preferred Genres</div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:24 }}>
        {ALL_GENRES.map(g => {
          const on = user.genres.includes(g);
          return <div key={g} onClick={() => setUser(u => ({...u, genres: on ? u.genres.filter(x=>x!==g) : [...u.genres, g]}))}
            style={{ padding:"6px 14px", borderRadius:20, fontSize:12, fontWeight:on?600:400, cursor:"pointer", transition:"all 0.15s",
              background: on ? color.accent : color.surface,
              color: on ? color.onAccent : color.muted, border:`1px solid ${on ? "transparent" : color.line}` }}>{g}</div>;
        })}
      </div>

      <button onClick={onLogout} style={{...BTN_SECONDARY, width:"100%"}}>Sign Out</button>
    </div>
  );
}

// ─── ANALYTICS ROW ───────────────────────────────────────────────────────────
function AnalyticsRow({ rank, track, value, label, max, color: trackColor, accent }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", background: color.surfaceSolid, borderRadius:12, marginBottom:4, border:`1px solid ${color.line}` }}>
      <div style={{ width:22, textAlign:"right", fontSize:14, fontWeight:700, color: color.faint, flexShrink:0 }}>{rank}</div>
      <div style={{ width:36, height:36, borderRadius:7, overflow:"hidden", flexShrink:0 }}>
        <AlbumArt track={track} size={36} borderRadius={0}/>
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:14, fontWeight:600, color: color.ink, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{track.title}</div>
        <div style={{ marginTop:5, background: "rgba(232,236,240,0.08)", borderRadius:2, height:3, overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${pct}%`, borderRadius:3, background: accent || trackColor || color.accent, transition:"width 0.4s ease" }}/>
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
function AdminScreen({ tracks, setTracks, tab, setTab, editTrack, setEditTrack, showToast }) {
  const EMPTY = { title:"",artist:"",album:"",genre:"",energy:"",camelot:"",bpm:"",albumCover:"" };
  const [nt, setNt] = useState(EMPTY);
  const [assigning, setAssigning] = useState(false);
  const [assigned, setAssigned] = useState(0);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState("");
  const fileInputRef = useRef(null);

  // ── CSV EXPORT ──
  function exportCSV() {
    const fields = ["id","title","artist","album","genre","energy","camelot","bpm","audioUrl","albumCover","color","duration"];
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
    const cols = ["#8899aa","#7a9e8a","#9090b0","#a09898","#88a8b0","#a0a0b8","#7aaa98"];

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
      setTracks(computeSignalTraits(loaded));
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
    const cols = ["#8899aa","#7a9e8a","#9090b0","#a09898","#88a8b0","#a0a0b8","#7aaa98"];
    setTracks(ts=>[...ts,{ id:Date.now(),...nt,energy:parseInt(nt.energy)||5,bpm:parseInt(nt.bpm)||null,liked:false,color:cols[Math.floor(Math.random()*cols.length)] }]);
    setNt(EMPTY); showToast("Track added");
  };
  return (
    <div style={{ padding:"24px 16px 16px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
        <div style={{ fontSize:20 }}>⚙️</div>
        <div style={{ fontSize:28, fontWeight:700, letterSpacing:-0.5, color: color.ink, fontFamily: fontDisplay }}>Admin</div>
      </div>
      <div style={{ display:"flex", gap:6, marginBottom:20, background: color.surfaceSolid, borderRadius:12, padding:3, border:`1px solid ${color.line}` }}>
        {["tracks","analytics","audit"].map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{ flex:1, padding:"8px 0", borderRadius:10, border:"none", cursor:"pointer", fontSize:13, fontWeight:600, textTransform:"capitalize", background:tab===t? color.accent:"transparent", color:tab===t? color.onAccent: color.muted, boxShadow:"none" }}>
            {t.charAt(0).toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>
      {tab==="tracks"&&(
        <div>
          {editTrack&&(
            <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", backdropFilter:"blur(8px)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
              <div style={{ background: color.surfaceSolid, borderRadius:20, padding:24, width:"100%", maxWidth:380, boxShadow:"0 16px 64px rgba(0,0,0,0.45)", border:`1px solid ${color.line}` }}>
                <div style={{ fontSize:18, fontWeight:600, color: color.ink, marginBottom:16 }}>Edit Track</div>
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
            <div key={t.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", background:"rgba(255,255,255,0.15)", backdropFilter:"blur(32px)", borderRadius:10, marginBottom:4, border:"1px solid rgba(255,255,255,0.16)" }}>
              <div style={{ width:36, height:36, borderRadius:7, overflow:"hidden", flexShrink:0 }}><AlbumArt track={t} size={36} borderRadius={0}/></div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:14, fontWeight:500, color: color.ink, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.title}</div>
                <div style={{ fontSize:12, color: color.muted }}>{t.artist}</div>
              </div>
              <div style={{ display:"flex", gap:4, flexShrink:0, flexWrap:"wrap", justifyContent:"flex-end", maxWidth:180 }}>
                {t.genre&&<span style={{ fontSize:10, fontWeight:500, padding:"2px 8px", borderRadius:6, background:"rgba(26,29,38,0.06)", color: color.ink }}>{t.genre}</span>}
                {t.camelot&&<span style={{ fontSize:10, fontWeight:600, padding:"2px 8px", borderRadius:6, background:"rgba(26,29,38,0.08)", color: color.ink }}>{t.camelot}</span>}
                {t.bpm&&<span style={{ fontSize:10, fontWeight:500, padding:"2px 8px", borderRadius:6, background:"rgba(0,0,0,0.04)", color: color.muted }}>{t.bpm}bpm</span>}
                {t.energy&&<span style={{ fontSize:10, fontWeight:500, padding:"2px 8px", borderRadius:6, background:"rgba(0,0,0,0.04)", color: color.muted }}>E{t.energy}</span>}
              </div>
              <button onClick={()=>setEditTrack(t)} style={{ background:"none",border:"none",cursor:"pointer",color: color.muted,padding:6 }}><Icon name="edit" size={14}/></button>
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
            {[["Tracks",tracks.length],["Liked",tracks.filter(t=>t.liked).length],["Genres",[...new Set(tracks.map(t=>t.genre))].length],["BPMs",[...new Set(tracks.filter(t=>t.bpm).map(t=>t.bpm))].length]].map(([l,v])=>(
              <div key={l} style={{ padding:"14px 16px", background: color.surfaceSolid, borderRadius:14, border:"0.5px solid rgba(60,60,67,0.12)", boxShadow:"0 1px 4px rgba(0,0,0,0.04)" }}>
                <div style={{ fontSize:11, fontWeight:600, letterSpacing:0.5, color: color.faint, textTransform:"uppercase", marginBottom:4 }}>{l}</div>
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
      {tab==="audit"&&(
        <div>
          {/* Export / Import */}
          <SectionLabel>Export & Import</SectionLabel>
          <div style={{ display:"flex", gap:8, marginBottom:20 }}>
            <button onClick={exportCSV} style={{ flex:1, padding:"14px", borderRadius:14, background: color.accent, color:"#FFF", border:"none", fontSize:14, fontWeight:600, cursor:"pointer" }}>
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
            <strong style={{ color: color.muted }}>How it works:</strong> Export downloads all tracks as CSV (keep the <code>id</code> column). Edit titles/artists/genres/BPM/Camelot in Sheets, then Import. Matching is by <strong>id first</strong> so renames stick; title+artist is only a fallback when id is blank. New rows without id are created. Columns: id, title, artist, album, genre, energy, camelot, bpm, audioUrl, albumCover, color, duration.
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
                        <div style={{ fontSize:11, fontWeight:600, color:"#FFFFFF", letterSpacing:0.5, marginBottom:8, textTransform:"uppercase" }}>{label}</div>
                        <div style={{ fontSize:28, fontWeight:700, color: color.ink }}>{has}<span style={{ fontSize:14, color: color.muted }}>/{total}</span></div>
                        <div style={{ height:4, background:"rgba(0,0,0,0.06)", borderRadius:2, marginTop:8, overflow:"hidden" }}>
                          <div style={{ width:`${pct}%`, height:"100%", background: pct === 100 ? "#22C55E" : pct > 50 ? "#1A1D26" : "#EF4444", borderRadius:2, transition:"width 0.5s" }}/>
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
                        style={{ width:"100%", background:assigning?"#6B7280":"#1A1D26", color:"#FFF", border:"none", borderRadius:12, padding:"12px", fontSize:14, fontWeight:600, cursor:assigning?"wait":"pointer", transition:"all 0.2s" }}>
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
    </div>
  );
}

// ─── NOW PLAYING BAR ──────────────────────────────────────────────────────────
function NowPlayingBar({ track, isPlaying, progress, duration, onTogglePlay, onSkip, onPrev, onLike, onSeek, repeat, setRepeat, isRadioMode, onOpen }) {
  const pct = duration > 0 ? (progress/duration)*100 : 0;
  return (
    <div style={{ position:"fixed", bottom:56, left:0, right:0, zIndex:80, padding:"0 10px 8px" }}>
      <div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={e=>{ if(e.key==="Enter") onOpen?.(); }}
        aria-label="Open now playing"
        style={{
          background: "rgba(20,20,22,0.94)", border:`1px solid ${color.lineStrong}`, borderRadius: radius.md,
          padding:"8px 10px", display:"flex", alignItems:"center", gap:10, cursor:"pointer",
          boxShadow: "0 8px 28px rgba(0,0,0,0.45)",
          backdropFilter: "blur(20px)",
        }}
      >
        <div style={{ width:40, height:40, borderRadius:8, overflow:"hidden", flexShrink:0 }}><AlbumArt track={track} size={40} borderRadius={0}/></div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:600, color: color.ink, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {isRadioMode && <span style={{ fontSize:9, fontWeight:700, letterSpacing:1, marginRight:6, color: color.accent }}>●</span>}
            {track.title}
          </div>
          <div style={{ fontSize:11, color: color.muted }}>{track.artist}</div>
          <div style={{ marginTop:5, background: "rgba(232,236,240,0.1)", borderRadius:1, height:2 }}>
            <div style={{ width:`${pct}%`, background: color.accent, height:"100%", borderRadius:1, transition:"width 1s linear" }}/>
          </div>
        </div>
        <button type="button" aria-label={track.liked?"Unlike":"Like"} onClick={e=>{e.stopPropagation();onLike();}} style={{ background:"none",border:"none",cursor:"pointer",color:track.liked?color.accent:color.faint,padding:4 }}><Icon name={track.liked?"heart":"heartempty"} size={16}/></button>
        <button type="button" aria-label={isPlaying?"Pause":"Play"} onClick={e=>{e.stopPropagation();onTogglePlay();}} style={{ background: color.accent, border:"none", borderRadius:"50%", width:34, height:34, cursor:"pointer", color: color.onAccent, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <Icon name={isPlaying?"pause":"play"} size={16}/>
        </button>
        <button type="button" aria-label="Next" onClick={e=>{e.stopPropagation();onSkip();}} style={{ background:"none",border:"none",cursor:"pointer",color: color.muted, padding:4 }}><Icon name="skip" size={16}/></button>
      </div>
    </div>
  );
}

function MetaChip({ children }) {
  return <span style={{ fontSize:10, padding:"4px 8px", borderRadius:6, background:"rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.45)", fontVariantNumeric:"tabular-nums" }}>{children}</span>;
}

// ─── BOTTOM NAV ───────────────────────────────────────────────────────────────
function BottomNav({ screen, setScreen, showAdmin = false }) {
  const items = [
    {id:"home",label:"Home",icon:"home"},
    {id:"search",label:"Search",icon:"search"},
    {id:"favorites",label:"Library",icon:"heartempty"},
    {id:"profile",label:"You",icon:"profile"},
  ];
  if (showAdmin) items.push({id:"admin",label:"Admin",icon:"settings"});
  return (
    <nav aria-label="Main" style={{
      position:"fixed", bottom:0, left:0, right:0, height:56,
      background: "rgba(9,11,13,0.92)", backdropFilter:"blur(20px)",
      borderTop: `1px solid ${color.line}`, display:"flex", zIndex:85,
    }}>
      {items.map(({id,icon,label})=>(
        <button key={id} type="button" aria-label={label} aria-current={screen===id?"page":undefined}
          onClick={()=>setScreen(id)}
          style={{
            flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:3,
            background:"none", border:"none", cursor:"pointer",
            color: screen===id ? color.accent : color.faint,
          }}>
          <Icon name={id==="favorites"?(screen===id?"heart":"heartempty"):icon} size={18}/>
          <span style={{ fontSize:9, fontWeight: screen===id ? 650 : 500, letterSpacing:0.2 }}>{label}</span>
        </button>
      ))}
    </nav>
  );
}

// ─── PULSE — ambient energy visualization ─────────────────────────────────────
function Pulse({ track, isPlaying }) {
  // Kept intentionally empty for the minimal shell — ambient motion lives in the player only.
  return null;
}

function BgMist({ color: mistColor = "#909090" }) {
  return (
    <div style={{ position:"absolute", inset:0, pointerEvents:"none", zIndex:0, overflow:"hidden" }}>
      <div style={{
        position:"absolute", top:"-10%", left:"30%", width:280, height:280, borderRadius:"50%",
        background:`radial-gradient(circle,rgba(${hexToRgbStr(mistColor)},0.045) 0%,transparent 70%)`,
        filter:"blur(40px)",
      }}/>
    </div>
  );
}

const ToastEl = ({msg}) => (
  <div role="status" style={{
    position:"fixed", bottom:120, left:"50%", transform:"translateX(-50%)",
    background: color.surfaceRaised, color: color.ink, padding:"10px 18px", borderRadius: radius.md,
    fontSize:13, zIndex:200, whiteSpace:"nowrap", fontWeight:550,
    border:`1px solid ${color.lineStrong}`, boxShadow:"0 12px 32px rgba(0,0,0,0.4)",
  }}>{msg}</div>
);

// ─── ROOT APP ─────────────────────────────────────────────────────────────────

// ─── ROOT APP — Firebase wired ────────────────────────────────────────────────
export default function App() {
  // ── Auth (login/signup/logout + user profile) ───────────────────────────
  const { firebaseUser, profile, setProfile, loading: authLoading, signUp, logIn, logOut, signInWithGoogle, sendPhoneOTP, verifyPhoneOTP, resetPassword } = useAuth();

  // ── App state ────────────────────────────────────────────────────────────
  const [screen, setScreen]           = useState("home");
  // Legacy: Drift was removed as a tab — bounce any stale screen id home
  useEffect(() => { if (screen === "drift") setScreen("home"); }, [screen]);
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
  const [immersive, setImmersive]     = useState(false);
  const audioRef                      = useRef(null); // the real HTML5 audio element
  // ── Desktop detection (must be before any early returns) ─────────────────
  const [isDesktop, setIsDesktop]     = useState(() => window.innerWidth >= 900);
  useEffect(() => {
    const handle = () => setIsDesktop(window.innerWidth >= 900);
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);
  const [userPlaylists, setUserPlaylists] = useState([]); // [{id, name, trackIds:[]}]
  const [showRouteBuilder, setShowRouteBuilder] = useState(false);
  const [afterglow, setAfterglow] = useState(null);
  const [resonanceTrack, setResonanceTrack] = useState(null); // { tracks, duration, startTime }

  // ── Listening Memory — tracks recently played with timestamps ──
  const recentlyPlayedRef = useRef([]); // [{id, genre, energy, timestamp}]
  const playHistoryRef = useRef([]); // previous tracks for "prev" button
  const sessionStartRef = useRef(null);
  const [signalState, setSignalState] = useState({ intensity:0.5, openness:0.5, momentum:0, depth:0, direction:0, label:"arrival" });

  function logTrackPlay(track) {
    const now = Date.now();
    if (!sessionStartRef.current) sessionStartRef.current = now;
    recentlyPlayedRef.current = [
      { id: track.id, genre: track.genre, energy: track.energy || 5, ts: now },
      ...recentlyPlayedRef.current
    ].slice(0, 100);
    // Update Aura human state
    setSignalState(computeHumanState(recentlyPlayedRef.current, sessionStartRef.current));
  }

  // Get genre of last N played tracks for momentum
  // Flush session to Firestore when session boundary detected
  const lastFlushRef = useRef(Date.now());
  function flushSession() {
    const plays = recentlyPlayedRef.current;
    const start = sessionStartRef.current;
    if (!start || plays.length < 3 || !firebaseUser) return;
    const sessionPlays = plays.filter(p => p.ts >= start);
    if (sessionPlays.length < 3) return;
    const genres = [...new Set(sessionPlays.map(p => p.genre).filter(Boolean))];
    const avgEnergy = Math.round(sessionPlays.reduce((s, p) => s + p.energy, 0) / sessionPlays.length * 10) / 10;
    const sessionData = {
      uid: firebaseUser.uid,
      startTime: new Date(start),
      endTime: new Date(),
      trackCount: sessionPlays.length,
      genres,
      avgEnergy,
      durationMins: Math.round((Date.now() - start) / 60000),
      trackIds: sessionPlays.map(p => p.id),
    };
    addDoc(collection(db, "sessions"), sessionData).catch(() => {});
    sessionStartRef.current = null;
    lastFlushRef.current = Date.now();
  }

  // Auto-flush: check on each play if >30min gap from previous play
  useEffect(() => {
    if (!recentlyPlayedRef.current.length) return;
    const latest = recentlyPlayedRef.current[0]?.ts;
    const prev = recentlyPlayedRef.current[1]?.ts;
    if (prev && latest && (latest - prev > 30 * 60 * 1000)) {
      flushSession();
    }
  }, [currentTrack?.id]);


  // Check if a track was played recently (within hours)

  useEffect(() => { document.title = '4AM'; }, []);

  // ── Anticipatory Queue — pre-generate when tracks load ──
  const anticipatoryBuilt = useRef(false);
  useEffect(() => {
    if (anticipatoryBuilt.current || !tracks.length || queue.length > 0 || currentTrack) return;
    anticipatoryBuilt.current = true;
    const hour = new Date().getHours();
    const [eMin, eMax] = getEnergyRangeForHour(hour);
    const singles = tracks.filter(t => (t.duration||0) <= 900);
    // Prefer liked tracks in the right energy range, then any in range, then random
    const liked = singles.filter(t => t.liked && (t.energy||5) >= eMin && (t.energy||5) <= eMax);
    const energyMatch = singles.filter(t => (t.energy||5) >= eMin && (t.energy||5) <= eMax);
    const pool = liked.length >= 4 ? liked : energyMatch.length >= 4 ? energyMatch : singles;
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setQueue(shuffled.slice(0, 8));
  }, [tracks]);
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
        setTracks(computeSignalTraits(loaded));
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

    const next = pickNextTrack(tracksRef.current, currentRef.current, recentlyPlayedRef.current);
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
        if (currentRef.current) {
          playHistoryRef.current = [currentRef.current, ...playHistoryRef.current].slice(0, 50);
        }
        logTrackPlay(next);
        // Delay clearing the crossfade flag so the currentTrack useEffect
        // sees isCrossfading=true and skips reloading the audio
        setTimeout(() => { isCrossfading.current = false; }, 100);
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
    if (currentTrack && currentTrack.id !== track.id) {
      playHistoryRef.current = [currentTrack, ...playHistoryRef.current].slice(0, 50);
    }
    setCurrent(track); setIsPlaying(true); setProgress(0); setIsRadioMode(false); setImmersive(true);
    if (q) setQueue(q.filter(t => t.id !== track.id));
    logTrackPlay(track);
    if (firebaseUser) recordPlay(track.id, profile?.recentTracks || []).catch(()=>{});
  };

  const playRadio = () => {
    if (!tracks.length) return;
    const first = pickNextTrack(tracks, null, recentlyPlayedRef.current);
    if (currentTrack) playHistoryRef.current = [currentTrack, ...playHistoryRef.current].slice(0, 50);
    setCurrent(first); setIsPlaying(true); setProgress(0); setIsRadioMode(true); setQueue([]); setImmersive(true);
    logTrackPlay(first);
    showToast("Radio on");
    if (firebaseUser) recordPlay(first.id, profile?.recentTracks || []).catch(()=>{});
  };

  // Play a generated route as a queue
  const playRoute = (routeTracks) => {
    if (!routeTracks.length) return;
    const first = routeTracks[0];
    setCurrent(first); setIsPlaying(true); setProgress(0); setIsRadioMode(false); setImmersive(true);
    setQueue(routeTracks.slice(1));
    showToast(`Session: ${routeTracks.length} tracks queued`);
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
    if (currentTrack) playHistoryRef.current = [currentTrack, ...playHistoryRef.current].slice(0, 50);
    if (isRadioMode) {
      const next = pickNextTrack(tracks, currentTrack, recentlyPlayedRef.current);
      if (next) {
        setCurrent(next); setProgress(0); setIsPlaying(true);
        logTrackPlay(next);
        if (firebaseUser) recordPlay(next.id, profile?.recentTracks || []).catch(()=>{});
      }
      return;
    }
    if (!queue.length) { setIsPlaying(false); return; }
    const next = queue[0];
    setQueue(repeat ? [...queue.filter(t=>t.id!==next.id), currentTrack] : queue.filter(t=>t.id!==next.id));
    setCurrent(next); setProgress(0); setIsPlaying(true);
    logTrackPlay(next);
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
      return;
    }
    const prev = playHistoryRef.current[0];
    if (prev) {
      playHistoryRef.current = playHistoryRef.current.slice(1);
      if (currentTrack) setQueue(q => [currentTrack, ...q.filter(t => t.id !== currentTrack.id)]);
      setCurrent(prev); setProgress(0); setIsPlaying(true);
      return;
    }
    if (audioRef.current) audioRef.current.currentTime = 0;
    setProgress(0);
  };

  // Media Session — lock screen / headset / OS transport controls
  useEffect(() => {
    if (!("mediaSession" in navigator) || !currentTrack) return;
    try {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: currentTrack.title || "Unknown",
        artist: currentTrack.artist || "",
        album: currentTrack.album || "",
        artwork: currentTrack.albumCover
          ? [{ src: currentTrack.albumCover, sizes: "512x512", type: "image/jpeg" }]
          : [],
      });
      navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
      navigator.mediaSession.setActionHandler("play", () => setIsPlaying(true));
      navigator.mediaSession.setActionHandler("pause", () => setIsPlaying(false));
      navigator.mediaSession.setActionHandler("previoustrack", () => handlePrev());
      navigator.mediaSession.setActionHandler("nexttrack", () => handleSkipRef.current?.());
      navigator.mediaSession.setActionHandler("seekto", (details) => {
        if (details.seekTime != null && audioRef.current) {
          audioRef.current.currentTime = details.seekTime;
          setProgress(Math.floor(details.seekTime));
        }
      });
    } catch (e) {
      // MediaSession unsupported or rejected — ignore
    }
  }, [currentTrack?.id, isPlaying]);


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
  const searchResults = searchQuery.length > 0
    ? (() => {
        const q = searchQuery.toLowerCase().trim();
        // Energy search: "e7", "energy 5", etc.
        const energyMatch = q.match(/^e(?:nergy)?\s*(\d+)$/i);
        if (energyMatch) {
          const eVal = parseInt(energyMatch[1]);
          return tracks.filter(t => t.energy === eVal);
        }
        // BPM range search: "120bpm", "bpm 130"
        const bpmMatch = q.match(/^(?:bpm)?\s*(\d+)\s*(?:bpm)?$/i);
        if (bpmMatch && parseInt(bpmMatch[1]) > 50) {
          const bVal = parseInt(bpmMatch[1]);
          return tracks.filter(t => t.bpm && Math.abs(t.bpm - bVal) <= 5);
        }
        // Standard text search (title, artist, genre, camelot)
        return tracks.filter(t => [t.title, t.artist, t.genre, t.album || "", String(t.bpm || "")].some(v => String(v || "").toLowerCase().includes(q)));
      })()
    : [];

  // ── Loading states ────────────────────────────────────────────────────────
  // Show nothing while we check if someone is already logged in
  if (authLoading) return (
    <div style={{...APP_STYLE, alignItems:"center", justifyContent:"center"}}>
      <BrandGlyph size={40}/>
      <div style={{ fontSize:13, color: color.muted, marginTop:14 }}>Loading…</div>
    </div>
  );

  // Not logged in — show login screen
  if (!firebaseUser) return <LoginScreen onSignUp={signUp} onLogIn={logIn} onGoogleSignIn={signInWithGoogle} onPhoneOTP={sendPhoneOTP} onVerifyOTP={verifyPhoneOTP} onResetPassword={resetPassword}/>;

  // ── Inner app (shared between mobile + desktop phone column) ─────────────
  const innerApp = (
    <div style={{ ...APP_STYLE, position:"relative" }}>
      <BgMist color={currentTrack?.color}/>
      {toast && <ToastEl msg={toast}/>}
      {tracksLoading && (
        <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", zIndex:50, textAlign:"center" }}>
          <div style={{ width:56, height:56, borderRadius:14, background: color.surfaceRaised, border:`1px solid ${color.line}`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px", overflow:"hidden" }}><BrandGlyph size={40}/></div>
          <div style={{ fontSize:14, color: color.muted }}>Loading your collection…</div>
        </div>
      )}
      <div style={{ flex:1, overflow:"auto", paddingBottom:currentTrack?120:56, zIndex:1, position:"relative" }}>
        {screen==="home"      && !tracksLoading && <HomeScreen tracks={tracks} onPlayRadio={playRadio} onTogglePlay={()=>setIsPlaying(p=>!p)} onPlayTrack={playTrack} currentTrack={currentTrack} isPlaying={isPlaying} onLike={toggleLike} isRadioMode={isRadioMode} playlistCtx={playlistCtx} signalLabel={signalState?.label}/>}
        {screen==="search"    && <SearchScreen query={searchQuery} setQuery={setSearch} results={searchResults} onPlay={t=>playTrack(t,tracks)} onLike={toggleLike} currentTrack={currentTrack} isPlaying={isPlaying} playlistCtx={playlistCtx}/>}
        {screen==="favorites" && <FavoritesScreen tracks={tracks} onPlay={t=>{setIsRadioMode(false);playTrack(t,tracks);}} onLike={toggleLike} currentTrack={currentTrack} isPlaying={isPlaying} userPlaylists={userPlaylists} onCreatePlaylist={createPlaylist} onAddToPlaylist={addToPlaylist} onRemoveFromPlaylist={removeFromPlaylist} onDeletePlaylist={deletePlaylist} playlistCtx={playlistCtx}/>}
        {screen==="profile"   && <ProfileScreen user={user} setUser={setUser} tracks={tracks} onLogout={logOut}/>}
        {screen==="map"       && <HarmonicMap tracks={tracks} onPlay={t=>playTrack(t,tracks)} currentTrack={currentTrack}/>}
        {screen==="admin"     && <AdminScreen tracks={tracks} setTracks={setTracks} tab={adminTab} setTab={setAdminTab} editTrack={editTrack} setEditTrack={setEditTrack} showToast={showToast}/>}
      </div>
      {currentTrack && !immersive && (
        <NowPlayingBar track={currentTrack} isPlaying={isPlaying} progress={progress} duration={duration}
          onTogglePlay={()=>setIsPlaying(p=>!p)} onSkip={handleSkip} onPrev={handlePrev}
          onLike={()=>toggleLike(currentTrack.id)} onSeek={handleSeek}
          repeat={repeat} setRepeat={setRepeat} isRadioMode={isRadioMode}
          onOpen={()=>setImmersive(true)}/>
      )}
      <BottomNav screen={screen} setScreen={setScreen} showAdmin={firebaseUser?.uid === ADMIN_UID}/>
      {immersive && currentTrack && (
        <ImmersivePlayer
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          onTogglePlay={()=>setIsPlaying(p=>!p)}
          onSkip={handleSkip}
          onPrev={handlePrev}
          onClose={()=>setImmersive(false)}
          signalState={signalState}
        />
      )}
    </div>
  );

  // ── Mobile: render as-is ─────────────────────────────────────────────────
  if (!isDesktop) return innerApp;

  // ── Desktop: 3-column shell ───────────────────────────────────────────────
  const NAV_TOP = [
    { id:"home",      icon:"home",   label:"Home" },
    { id:"favorites", icon:"heart",  label:"Library" },
  ];
  const NAV_BOTTOM = [
    { id:"map",       icon:"grid",   label:"Map" },
    { id:"search",    icon:"search", label:"Search" },
  ];

  const recentTracks = [...tracks].slice(0, 6);

  // Build queue/next-up from current context
  const queueSource = queue?.length ? queue : tracks.filter(t => t.id !== currentTrack?.id && (t.duration||0) <= 900);
  const nextUpTracks = isRadioMode
    ? queueSource.filter(t => {
        if (!currentTrack) return true;
        return camelotCompatible(currentTrack.camelot, t.camelot);
      }).slice(0, 8)
    : queueSource.slice(0, 8);

  // Accent glow color from current track
  const glowRgb = currentTrack ? hexToRgbStr(currentTrack.color) : "200,200,210";

  return (
    <div style={{ display:"flex", height:"100vh", background: color.canvas, overflow:"hidden", fontFamily: font }}>

      {/* ── LEFT NAV RAIL ─────────────────────────────────────────────── */}
      <div style={{ width:72, flexShrink:0, background: color.surfaceSolid, borderRight:`1px solid ${color.line}`, display:"flex", flexDirection:"column", alignItems:"center", padding:"16px 0 16px" }}>
        {/* Logo */}
        <div style={{ marginBottom:16 }}>
          <BrandGlyph size={28}/>
        </div>

        {/* Top nav: Home, Library, Session */}
        <div style={{ display:"flex", flexDirection:"column", gap:4, alignItems:"center" }}>
          {NAV_TOP.map(item => (
            <button key={item.id} onClick={()=>setScreen(item.id)} title={item.label} style={{
              width:44, height:44, borderRadius:12,
              background:screen===item.id? color.accentSoft:"none",
              border:"none", color:screen===item.id? color.accent: color.faint,
              cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
              transition:"all 0.2s",
            }}>
              <Icon name={item.icon} size={20}/>
            </button>
          ))}
          <button onClick={()=>setShowRouteBuilder(true)} title="Session" style={{
            width:44, height:44, borderRadius:12, background:"none",
            border:"none", color: color.faint, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
            transition:"all 0.2s",
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 12h4l3-9 4 18 3-9h4"/></svg>
          </button>

        </div>

        {/* Spacer */}
        <div style={{ flex:1 }}/>

        {/* Bottom nav: Search, Admin, Avatar */}
        <div style={{ display:"flex", flexDirection:"column", gap:4, alignItems:"center" }}>
          {NAV_BOTTOM.map(item => (
            <button key={item.id} onClick={()=>setScreen(item.id)} title={item.label} style={{
              width:44, height:44, borderRadius:12,
              background:screen===item.id? color.accentSoft:"none",
              border:"none", color:screen===item.id? color.accent: color.faint,
              cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
              transition:"all 0.2s",
            }}>
              <Icon name={item.icon} size={20}/>
            </button>
          ))}
          {firebaseUser?.uid === ADMIN_UID && (
            <button onClick={()=>setScreen("admin")} title="Admin" style={{
              width:44, height:44, borderRadius:12,
              background:screen==="admin"? color.accentSoft:"none",
              border:"none", color:screen==="admin"? color.accent: color.faint,
              cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
              transition:"all 0.2s",
            }}>
              <Icon name="settings" size={20}/>
            </button>
          )}
          <div style={{ width:32, height:32, borderRadius:"50%", background: color.surfaceRaised, border:`1px solid ${color.line}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, cursor:"pointer", marginTop:4 }} onClick={()=>setScreen("profile")} title={user.name}>
            {user.image}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT — full width ─────────────────────────────────── */}
      <div style={{ flex:1, overflow:"auto", position:"relative" }}>
        <>
        {/* Accent glow behind content */}
        {currentTrack && <div style={{ position:"absolute", top:0, right:0, width:"40%", height:"30%", background:`radial-gradient(ellipse at 80% 0%, rgba(${glowRgb},0.07) 0%, transparent 70%)`, pointerEvents:"none", zIndex:0 }}/>}
        <div style={{ position:"relative", zIndex:1, maxWidth:960, margin:"0 auto", padding:"24px 32px", paddingBottom:currentTrack?120:24 }}>
          <BgMist color={currentTrack?.color}/>
          <Pulse track={currentTrack} isPlaying={isPlaying}/>
          {toast && <ToastEl msg={toast}/>}
          {tracksLoading ? (
            <div style={{ textAlign:"center", paddingTop:120 }}>
              <BrandGlyph size={40}/>
              <div style={{ fontSize:14, color: color.muted, marginTop:12 }}>Loading…</div>
            </div>
          ) : (
            <>
              {screen==="home"      && <HomeScreen tracks={tracks} onPlayRadio={playRadio} onTogglePlay={()=>setIsPlaying(p=>!p)} onPlayTrack={playTrack} currentTrack={currentTrack} isPlaying={isPlaying} onLike={toggleLike} isRadioMode={isRadioMode} playlistCtx={playlistCtx} signalLabel={signalState?.label}/>}
              {screen==="search"    && <SearchScreen query={searchQuery} setQuery={setSearch} results={searchResults} onPlay={t=>playTrack(t,tracks)} onLike={toggleLike} currentTrack={currentTrack} isPlaying={isPlaying} playlistCtx={playlistCtx}/>}
              {screen==="favorites" && <FavoritesScreen tracks={tracks} onPlay={t=>{setIsRadioMode(false);playTrack(t,tracks);}} onLike={toggleLike} currentTrack={currentTrack} isPlaying={isPlaying} userPlaylists={userPlaylists} onCreatePlaylist={createPlaylist} onAddToPlaylist={addToPlaylist} onRemoveFromPlaylist={removeFromPlaylist} onDeletePlaylist={deletePlaylist} playlistCtx={playlistCtx}/>}
              {screen==="profile"   && <ProfileScreen user={user} setUser={setUser} tracks={tracks} onLogout={logOut}/>}
              {screen==="map"       && <HarmonicMap tracks={tracks} onPlay={t=>playTrack(t,tracks)} currentTrack={currentTrack}/>}
              {screen==="admin"     && <AdminScreen tracks={tracks} setTracks={setTracks} tab={adminTab} setTab={setAdminTab} editTrack={editTrack} setEditTrack={setEditTrack} showToast={showToast}/>}
            </>
          )}
        </div>
        </>
        {/* Desktop mini-player bar */}
        {currentTrack && !immersive && (
          <div style={{ position:"fixed", bottom:0, left:72, right:320, zIndex:80, padding:"0 16px 12px" }}>
            <div onClick={()=>setImmersive(true)} style={{ background: "rgba(20,20,22,0.92)", backdropFilter:"blur(24px)", borderRadius:16, display:"flex", flexDirection:"column", border:`1px solid ${color.lineStrong}`, boxShadow:`0 12px 40px rgba(0,0,0,0.4)`, cursor:"pointer", overflow:"hidden", position:"relative" }}>
              {/* Content row */}
              <div style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 16px" }}>
                <div style={{ width:44, height:44, borderRadius:10, overflow:"hidden", flexShrink:0 }}><AlbumArt track={currentTrack} size={44} borderRadius={0}/></div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:14, fontWeight:600, color: color.ink, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", letterSpacing:-0.2 }}>
                    {isRadioMode&&<span style={{ fontSize:9, color: color.accent, fontWeight:700, letterSpacing:1.5, marginRight:8 }}>●</span>}
                    {currentTrack.title}
                  </div>
                  <div style={{ fontSize:11, color: color.muted }}>{currentTrack.artist}</div>
                </div>
                <span style={{ fontSize:10, color: color.faint, fontVariantNumeric:"tabular-nums", flexShrink:0 }}>{fmtTime(progress)}</span>
                <button onClick={e=>{e.stopPropagation();onLikeToggle();}} style={{ background:"none",border:"none",cursor:"pointer",color:currentTrack.liked?color.accent:color.faint,padding:4 }}><Icon name={currentTrack.liked?"heart":"heartempty"} size={16}/></button>
                <button onClick={e=>{e.stopPropagation();setIsPlaying(p=>!p);}} style={{ background: color.accent,border:"none",borderRadius:"50%",width:34,height:34,cursor:"pointer",color: color.onAccent,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                  <Icon name={isPlaying?"pause":"play"} size={15}/>
                </button>
                <button onClick={e=>{e.stopPropagation();handleSkip();}} style={{ background:"none",border:"none",cursor:"pointer",color: color.muted,padding:4 }}><Icon name="skip" size={16}/></button>
              </div>
              {/* Full-width progress bar — color-tinted ambient strip */}
              <div style={{ height:3, background:"rgba(232,236,240,0.08)", width:"100%" }}>
                <div style={{ height:"100%", width:`${duration?((progress/duration)*100):0}%`, background: color.accent, borderRadius:"0 2px 2px 0", transition:"width 1s linear" }}/>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── RIGHT PANEL ─────────────────────────────────────────────── */}
      <div className="hide-scroll" style={{ width:320, flexShrink:0, background: color.surfaceSolid, borderLeft:`1px solid ${color.line}`, display:"flex", flexDirection:"column", overflowY:"auto" }}>

        {/* Now Playing */}
        {currentTrack ? (
          <div style={{ padding:"16px 16px 12px", position:"relative" }}>
            {/* Ambient color wash behind art */}
            <div style={{ position:"absolute", top:0, left:0, right:0, height:"70%", background:`radial-gradient(ellipse at 50% 30%, rgba(${glowRgb},0.12) 0%, transparent 70%)`, pointerEvents:"none" }}/>
            {/* Album art */}
            <div style={{ position:"relative", width:"100%", aspectRatio:"1", borderRadius:16, overflow:"hidden", marginBottom:4, boxShadow:`0 16px 48px rgba(0,0,0,0.45)` }}>
              <img src={currentTrack.albumCover||"/covers/default.jpg"} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e=>{e.target.src="/covers/default.jpg";}}/>
            </div>
            {/* Progress bar under art */}
            <div style={{ height:3, background:"rgba(232,236,240,0.08)", borderRadius:2, marginBottom:12, overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${duration?((progress/duration)*100):0}%`, background: color.accent, borderRadius:2, transition:"width 1s linear" }}/>
            </div>
            {/* Track info */}
            <div style={{ position:"relative" }}>
              <div style={{ fontSize:15, fontWeight:600, color: color.ink, letterSpacing:-0.3, marginBottom:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{currentTrack.title}</div>
              <div style={{ fontSize:12, color: color.muted, marginBottom:8, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{currentTrack.artist}</div>
              {/* Metadata + state label row */}
              <div style={{ display:"flex", gap:4, alignItems:"center" }}>
                {currentTrack.genre && <span style={{ fontSize:9, fontWeight:500, padding:"3px 8px", borderRadius:6, background: color.surface, color: color.muted }}>{currentTrack.genre}</span>}
                {currentTrack.bpm && <span style={{ fontSize:9, fontWeight:500, padding:"3px 8px", borderRadius:6, background: color.surface, color: color.faint }}>{currentTrack.bpm} bpm</span>}
                <div style={{ flex:1 }}/>
                {signalState?.label && <span style={{ fontSize:9, fontWeight:600, letterSpacing:0.8, color: color.faint, textTransform:"uppercase" }}>{signalState.label}</span>}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding:"60px 16px", textAlign:"center" }}>
            <BrandGlyph size={28}/>
          </div>
        )}


        {/* Flow Trail — session energy path */}
        {recentlyPlayedRef.current.length > 2 && (
          <div style={{ padding:"8px 16px 4px" }}>
            <div style={{ fontSize:9, fontWeight:700, letterSpacing:1.2, color: color.faint, textTransform:"uppercase", marginBottom:6 }}>Flow</div>
            <svg width="100%" height="40" viewBox="0 0 288 40" preserveAspectRatio="none" style={{ display:"block", opacity:0.7 }}>
              <defs>
                <linearGradient id="flowGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={`rgba(${glowRgb},0.05)`}/>
                  <stop offset="100%" stopColor={`rgba(${glowRgb},0.25)`}/>
                </linearGradient>
              </defs>
              {(() => {
                const plays = recentlyPlayedRef.current.slice(0, 15).reverse();
                if (plays.length < 2) return null;
                const w = 288;
                const h = 40;
                const step = w / (plays.length - 1);
                const pts = plays.map((p, i) => ({
                  x: i * step,
                  y: h - ((((p.energy || 5) - 1) / 9) * (h - 6) + 3),
                }));
                const line = pts.map(p => `${p.x},${p.y}`).join(" ");
                const area = `0,${h} ${line} ${w},${h}`;
                return (
                  <>
                    <polygon points={area} fill="url(#flowGrad)"/>
                    <polyline points={line} fill="none" stroke={color.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/>
                    <circle cx={pts[pts.length-1].x} cy={pts[pts.length-1].y} r="3" fill={color.accent} opacity="0.9"/>
                  </>
                );
              })()}
            </svg>
          </div>
        )}
        {/* Divider */}
        <div style={{ height:1, background: color.line, margin:"0 16px" }}/>

        {/* Up Next */}
        <div style={{ flex:1, padding:"12px 12px 16px" }}>
          {/* Header with actions */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"4px 4px 10px" }}>
            <div style={{ fontSize:12, fontWeight:700, letterSpacing:-0.2, color: color.ink, fontFamily: fontDisplay }}>Up Next</div>
            <div style={{ display:"flex", gap:4 }}>
              <button onClick={()=>{const pool=tracks.filter(t=>t.id!==currentTrack?.id&&(t.duration||0)<=900);const shuffled=[...pool];for(let i=shuffled.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];}setQueue(shuffled.slice(0,8));}}
                style={{ background: color.surface, border:"none", borderRadius:6, padding:"4px 8px", cursor:"pointer", color: color.muted, fontSize:9, fontWeight:600, letterSpacing:0.3, transition:"all 0.15s" }}>
                Shuffle
              </button>
              {queue.length > 0 && (
                <button onClick={()=>setQueue([])}
                  style={{ background: color.surface, border:"none", borderRadius:6, padding:"4px 8px", cursor:"pointer", color: color.muted, fontSize:9, fontWeight:600, letterSpacing:0.3 }}>
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Track list */}
          <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
            {nextUpTracks.map((t,i) => (
              <div key={t.id}
                style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 8px", borderRadius:10,
                  background: currentTrack?.id===t.id ? color.accentSoft : color.surface,
                  border: currentTrack?.id===t.id ? "1px solid rgba(122,145,164,0.35)" : `1px solid ${color.line}`,
                  transition:"all 0.2s" }}>

                <div style={{ width:16, fontSize:10, fontWeight:500, color: color.faint, textAlign:"center", flexShrink:0 }}>{i+1}</div>

                <div onClick={()=>playTrack(t,tracks)} style={{ display:"flex", alignItems:"center", gap:8, flex:1, minWidth:0, cursor:"pointer" }}>
                  <div style={{ width:36, height:36, borderRadius:8, overflow:"hidden", flexShrink:0 }}>
                    <img src={t.albumCover||"/covers/default.jpg"} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e=>{e.target.src="/covers/default.jpg";}}/>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:500, color: color.ink, letterSpacing:-0.1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.title}</div>
                    <div style={{ fontSize:10, color: color.muted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.artist}</div>
                  </div>
                </div>

                {t._signal?.label && (
                  <span style={{ fontSize:8, fontWeight:600, padding:"2px 6px", borderRadius:4, background: color.surfaceRaised, color: color.faint, flexShrink:0, letterSpacing:0.3, textTransform:"uppercase" }}>{t._signal.label}</span>
                )}

                {!isRadioMode && (
                  <div style={{ display:"flex", alignItems:"center", gap:2, flexShrink:0 }}>
                    <button onClick={e=>{e.stopPropagation(); if(i>0){const nq=[...nextUpTracks];[nq[i-1],nq[i]]=[nq[i],nq[i-1]];setQueue(nq);}}}
                      style={{ background:"none", border:"none", cursor:i>0?"pointer":"default", padding:"2px", opacity:i>0?0.4:0, transition:"opacity 0.15s" }}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke={color.ink} strokeWidth="1.5" strokeLinecap="round"><path d="M3 7L6 4L9 7"/></svg>
                    </button>
                    <button onClick={e=>{e.stopPropagation(); if(i<nextUpTracks.length-1){const nq=[...nextUpTracks];[nq[i],nq[i+1]]=[nq[i+1],nq[i]];setQueue(nq);}}}
                      style={{ background:"none", border:"none", cursor:i<nextUpTracks.length-1?"pointer":"default", padding:"2px", opacity:i<nextUpTracks.length-1?0.4:0, transition:"opacity 0.15s" }}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke={color.ink} strokeWidth="1.5" strokeLinecap="round"><path d="M3 5L6 8L9 5"/></svg>
                    </button>
                  </div>
                )}
                <button onClick={e=>{e.stopPropagation();setQueue(prev=>{const nq=[...nextUpTracks];nq.splice(i,1);return nq;});}}
                  style={{ background:"none", border:"none", cursor:"pointer", padding:"2px", opacity:0.35, transition:"opacity 0.15s", flexShrink:0 }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke={color.ink} strokeWidth="1.5" strokeLinecap="round"><path d="M2.5 2.5L7.5 7.5M7.5 2.5L2.5 7.5"/></svg>
                </button>
              </div>
            ))}
          </div>

          {nextUpTracks.length === 0 && (
            <div style={{ textAlign:"center", padding:"32px 0", color: color.faint, fontSize:12 }}>
              No tracks queued
            </div>
          )}
        </div>
      </div>

      {/* Route Builder Modal */}
      {resonanceTrack && <HypnoVisionOverlay sourceTrack={resonanceTrack} tracks={tracks} onPlay={t=>playTrack(t,tracks)} onClose={()=>setResonanceTrack(null)}/>}
      {afterglow && <AfterglowOverlay data={afterglow} onClose={()=>setAfterglow(null)} onSavePlaylist={(name, ids) => { createPlaylist(name); /* TODO: add tracks */ }}/>}
      {showRouteBuilder && <RouteBuilderModal tracks={tracks} onClose={()=>setShowRouteBuilder(false)} onPlayRoute={playRoute}/>}

      {immersive && currentTrack && (
        <ImmersivePlayer
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          onTogglePlay={()=>setIsPlaying(p=>!p)}
          onSkip={handleSkip}
          onPrev={handlePrev}
          onClose={()=>setImmersive(false)}
          signalState={signalState}
        />
      )}
    </div>
  );

  function onLikeToggle() { if(currentTrack) toggleLike(currentTrack.id); }
}

