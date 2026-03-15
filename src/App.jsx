import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth }                                  from "./useAuth";
import { toggleLike as fbToggleLike, recordPlay, saveGenres } from "./useUserData";
import { collection, getDocs, query, orderBy, doc, updateDoc, setDoc } from "firebase/firestore";
import { db }                                       from "./firebase";
import vLogo                                         from "./v-logo-new.png";

const injectStyles = () => {
  if (document.getElementById("verse-app-global-styles")) return;
  const s = document.createElement("style");
  s.id = "verse-app-global-styles";
  s.textContent = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    :root { --font: -apple-system, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif; --accent: #1A1D26; }
    body { font-family: var(--font); background: #0A0F1E; }
    ::-webkit-scrollbar { width: 5px; height: 5px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.3); border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); }
    ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.45); }
    ::-webkit-scrollbar-corner { background: transparent; }
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
    input[type="range"] { -webkit-appearance: none; height: 6px; background: rgba(255,255,255,0.2); border-radius: 3px; outline: none; cursor: pointer; transition: height 0.15s; }
    input[type="range"]:hover { height: 8px; }
    input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%; background: rgba(255,255,255,0.95); border: none; box-shadow: 0 2px 8px rgba(0,0,0,0.2), 0 0 0 4px rgba(255,255,255,0.15); cursor: pointer; transition: transform 0.15s, box-shadow 0.15s; }
    input[type="range"]::-webkit-slider-thumb:hover { transform: scale(1.15); box-shadow: 0 2px 12px rgba(0,0,0,0.25), 0 0 0 6px rgba(255,255,255,0.2); }
    input[type="range"]::-webkit-slider-thumb:active { transform: scale(0.95); }
    input[type="range"]::-moz-range-thumb { width: 18px; height: 18px; border-radius: 50%; background: rgba(255,255,255,0.95); border: none; box-shadow: 0 2px 8px rgba(0,0,0,0.2), 0 0 0 4px rgba(255,255,255,0.15); cursor: pointer; }
    input[type="range"]::-moz-range-track { height: 6px; background: rgba(255,255,255,0.2); border-radius: 3px; border: none; }
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
function pickNextTrack(allTracks, currentTrack, memory = null) {
  if (!allTracks.length) return null;
  const hour = new Date().getHours();
  const [eMin, eMax] = getEnergyRangeForHour(hour);
  // Recency decay — exclude tracks played in last 2 hours
  const recentIds = memory ? new Set(
    memory.filter(r => r.ts > Date.now() - 2 * 60 * 60 * 1000).map(r => r.id)
  ) : new Set();
  // Genre momentum — boost the current genre streak
  const recentGenres = memory ? memory.slice(0, 3).map(r => r.genre).filter(Boolean) : [];
  const momentumGenre = recentGenres.length >= 2 && recentGenres[0] === recentGenres[1] ? recentGenres[0] : null;

  const pool = allTracks.filter(t => t.id !== currentTrack?.id && (t.duration||0) <= 900 && !recentIds.has(t.id));
  if (!pool.length) {
    // Fallback: if recency filter emptied the pool, ignore it
    const fallback = allTracks.filter(t => t.id !== currentTrack?.id && (t.duration||0) <= 900);
    if (!fallback.length) return allTracks[0];
    return fallback[Math.floor(Math.random() * fallback.length)];
  }

  function weightedPick(candidates) {
    const weighted = candidates.flatMap(t => {
      let w = t.liked ? 3 : 1;
      // Skip penalty
      const plays = t.playCount || 0;
      const skips = t.skipCount || 0;
      if (plays > 0 && skips > plays * 0.5) w = Math.max(1, Math.round(w * 0.3));
      else if (skips > 3) w = Math.max(1, Math.round(w * 0.6));
      // Genre momentum — 2× boost for tracks matching the streak
      if (momentumGenre && t.genre === momentumGenre) w *= 2;
      return Array(w).fill(t);
    });
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


// ─── ROUTE BUILDER ───────────────────────────────────────────────────────────
// Given a start track and end track, build a harmonic path between them.
// Steps through adjacent Camelot keys, interpolating energy from start to end.
function buildRoute(allTracks, startTrack, endTrack, maxSteps = 12) {
  if (!startTrack || !endTrack || startTrack.id === endTrack.id) return [startTrack, endTrack].filter(Boolean);
  const startE = startTrack.energy || 5;
  const endE = endTrack.energy || 5;
  const pool = allTracks.filter(t => t.id !== startTrack.id && t.id !== endTrack.id && (t.duration||0) <= 900);

  const route = [startTrack];
  let current = startTrack;
  const used = new Set([startTrack.id, endTrack.id]);

  for (let step = 1; step <= maxSteps; step++) {
    const progress = step / (maxSteps + 1);
    const targetEnergy = Math.round(startE + (endE - startE) * progress);

    // Find candidates: Camelot-adjacent to current, closest to target energy, not used
    const candidates = pool
      .filter(t => !used.has(t.id) && camelotCompatible(current.camelot, t.camelot, 1))
      .map(t => ({ track: t, score: Math.abs((t.energy||5) - targetEnergy) }))
      .sort((a, b) => a.score - b.score);

    if (!candidates.length) break;

    // Check if we can reach the end track from here
    if (camelotCompatible(candidates[0].track.camelot, endTrack.camelot, 2)) {
      // Close enough to bridge to end — pick best and stop
      route.push(candidates[0].track);
      used.add(candidates[0].track.id);
      break;
    }

    route.push(candidates[0].track);
    used.add(candidates[0].track.id);
    current = candidates[0].track;
  }

  route.push(endTrack);
  return route;
}

// ─── SESSION ENGINE ──────────────────────────────────────────────────────────
// Activity-based energy arc profiles. Each phase has a proportion (0-1) and target energy.
const SESSION_PROFILES = {
  party:      { label:"Party",       phases:[{name:"Warm Up",p:0.15,e:4},{name:"Build",p:0.2,e:6},{name:"Peak",p:0.35,e:9},{name:"Sustain",p:0.2,e:8},{name:"Wind Down",p:0.1,e:5}] },
  run:        { label:"Run",         phases:[{name:"Pace Up",p:0.1,e:6},{name:"Stride",p:0.4,e:8},{name:"Push",p:0.35,e:9},{name:"Cool",p:0.15,e:5}] },
  workout:    { label:"Workout",     phases:[{name:"Warm Up",p:0.12,e:5},{name:"Build",p:0.2,e:7},{name:"Peak",p:0.4,e:9},{name:"Push",p:0.18,e:8},{name:"Stretch",p:0.1,e:3}] },
  chill:      { label:"Chill",       phases:[{name:"Drift",p:0.3,e:3},{name:"Float",p:0.4,e:2},{name:"Settle",p:0.3,e:3}] },
  focus:      { label:"Focus",       phases:[{name:"Settle In",p:0.15,e:4},{name:"Flow",p:0.6,e:3},{name:"Sustain",p:0.2,e:4},{name:"Ease Out",p:0.05,e:3}] },
  drive:      { label:"Late Drive",  phases:[{name:"Depart",p:0.15,e:5},{name:"Cruise",p:0.5,e:6},{name:"Deep",p:0.25,e:4},{name:"Arrive",p:0.1,e:3}] },
  dinner:     { label:"Dinner",      phases:[{name:"Arrival",p:0.2,e:4},{name:"Conversation",p:0.5,e:3},{name:"Linger",p:0.3,e:4}] },
  predrinks:  { label:"Pre-drinks",  phases:[{name:"Ease In",p:0.2,e:4},{name:"Lift",p:0.35,e:6},{name:"Buzz",p:0.3,e:7},{name:"Ready",p:0.15,e:8}] },
  study:      { label:"Study",       phases:[{name:"Settle",p:0.1,e:3},{name:"Deep Work",p:0.7,e:2},{name:"Break",p:0.1,e:4},{name:"Close",p:0.1,e:2}] },
  recovery:   { label:"Recovery",    phases:[{name:"Ground",p:0.2,e:2},{name:"Restore",p:0.5,e:1},{name:"Ease Up",p:0.3,e:3}] },
};

function buildSession(allTracks, durationMins, activityId) {
  const profile = SESSION_PROFILES[activityId];
  if (!profile) return [];
  const pool = allTracks.filter(t => (t.duration||0) <= 900 && (t.duration||0) > 0);
  if (!pool.length) return [];

  const totalSecs = durationMins * 60;
  const avgTrackLen = pool.reduce((s,t)=>s+(t.duration||210),0) / pool.length;
  const targetCount = Math.max(3, Math.round(totalSecs / avgTrackLen));

  const session = [];
  const used = new Set();
  let accumulated = 0;

  for (const phase of profile.phases) {
    const phaseTarget = phase.e;
    const phaseTracks = Math.max(1, Math.round(targetCount * phase.p));

    // Find tracks near this energy level, prefer camelot compatibility with last track
    const lastTrack = session.length ? session[session.length-1] : null;
    let candidates = pool
      .filter(t => !used.has(t.id))
      .map(t => {
        let score = Math.abs((t.energy||5) - phaseTarget) * 3;
        if (lastTrack && !camelotCompatible(lastTrack.camelot, t.camelot, 2)) score += 2;
        if (t.liked) score -= 0.5;
        const skips = t.skipCount || 0;
        const plays = t.playCount || 0;
        if (plays > 0 && skips > plays * 0.5) score += 3;
        return { track:t, score };
      })
      .sort((a,b) => a.score - b.score);

    for (let i = 0; i < phaseTracks && candidates.length > 0; i++) {
      // Pick from top 3 randomly for variety
      const pick = candidates.splice(Math.floor(Math.random() * Math.min(3, candidates.length)), 1)[0];
      if (!pick) break;
      session.push({ ...pick.track, _phase: phase.name });
      used.add(pick.track.id);
      accumulated += (pick.track.duration || avgTrackLen);
      if (accumulated >= totalSecs * 1.05) break;
    }
    if (accumulated >= totalSecs * 1.05) break;
  }

  return session;
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
          background: i < level ? "#1A1D26" : "#E5E5EA",
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

// ─── VERS FLIPPER — vertical, full-bleed album art ────────────────────────────
function VerseFlipper({ tracks, onSelect, currentTrack, isPlaying }) {
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
            background:"#1A1D26",
            border:"none",
            color:"#FFFFFF", cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow:"0 4px 16px rgba(26,29,38,0.4)",
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
              background: i===idx?"#1A1D26":"#E5E5EA",
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
  const energyLevel = currentTrack?.energy || Math.round((eMin+eMax)/2);

  return (
    <div onClick={isRadioMode ? undefined : onPlay} style={{
      cursor: isRadioMode ? "default" : "pointer",
      background: isRadioMode
        ? `linear-gradient(135deg, rgba(26,29,38,0.92) 0%, rgba(20,22,30,0.88) 100%)`
        : "linear-gradient(135deg, rgba(26,29,38,0.88) 0%, rgba(30,33,42,0.85) 100%)",
      backdropFilter:"blur(40px) saturate(200%)",
      border:"1px solid rgba(255,255,255,0.08)",
      borderRadius:20, padding:"20px 20px", transition:"all 0.3s",
      position:"relative", overflow:"hidden",
      boxShadow:"0 8px 32px rgba(0,0,0,0.12)",
    }}>
      {/* Subtle accent glow from track color */}
      {isRadioMode && currentTrack && <div style={{ position:"absolute", top:-60, right:-60, width:200, height:200, borderRadius:"50%", background:`radial-gradient(circle, rgba(${rgb},0.15) 0%, transparent 70%)`, pointerEvents:"none" }}/>}

      {/* Top row — status + time */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ position:"relative", width:8, height:8, flexShrink:0 }}>
            <div style={{ position:"absolute", inset:0, borderRadius:"50%", background: isRadioMode&&isPlaying?"#FFFFFF":"rgba(255,255,255,0.3)", animation:isRadioMode&&isPlaying?"breathe 1.8s ease-in-out infinite":"none" }}/>
            {isRadioMode&&isPlaying&&<div style={{ position:"absolute", inset:-3, borderRadius:"50%", border:"1px solid rgba(255,255,255,0.3)", animation:"pulse-ring 1.8s ease-out infinite" }}/>}
          </div>
          <span style={{ fontSize:10, fontWeight:700, letterSpacing:2, color:isRadioMode&&isPlaying?"#FFFFFF":"rgba(255,255,255,0.4)", textTransform:"uppercase" }}>
            {isRadioMode&&isPlaying ? "live" : "radio"}
          </span>
        </div>
        <span style={{ fontSize:10, fontWeight:600, color:"rgba(255,255,255,0.4)", letterSpacing:0.5 }}>{currentTrack?.genre || ""}</span>
      </div>

      {isRadioMode&&currentTrack ? (
        <div>
          {/* Main content row */}
          <div style={{ display:"flex", gap:14, alignItems:"center", marginBottom:14 }}>
            <div style={{ width:56, height:56, borderRadius:12, overflow:"hidden", flexShrink:0, boxShadow:`0 4px 20px rgba(${rgb},0.25)` }}>
              <AlbumArt track={currentTrack} size={56} borderRadius={0}/>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:17, fontWeight:600, color:"#FFFFFF", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", letterSpacing:-0.3 }}>{currentTrack.title}</div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)", marginTop:3 }}>{currentTrack.artist}</div>
            </div>
          </div>
          {/* Controls + energy indicator */}
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <button onClick={e=>{e.stopPropagation();onTogglePlay();}} style={{ width:38, height:38, borderRadius:"50%", background:"rgba(255,255,255,0.15)", backdropFilter:"blur(12px)", border:"1px solid rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, color:"#FFFFFF", cursor:"pointer" }}>
              <Icon name={isPlaying?"pause":"play"} size={16}/>
            </button>
            <div style={{ fontSize:12, fontWeight:500, color:"rgba(255,255,255,0.4)" }}>{timeLabel} Mix</div>
            <div style={{ flex:1 }}/>
            {/* Energy level indicator — subtle bar */}
            <div style={{ display:"flex", gap:2, alignItems:"flex-end" }}>
              {[1,2,3,4,5,6,7,8,9,10].map(i => (
                <div key={i} style={{ width:3, height: 3 + i * 1.5, borderRadius:1.5, background: i <= energyLevel ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.08)", transition:"background 0.3s" }}/>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ fontSize:20, fontWeight:700, letterSpacing:-0.3, color:"#FFFFFF", marginBottom:4 }}>{timeLabel} Mix</div>
          <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)", marginBottom:14 }}>Tap to start your {timeLabel.toLowerCase()} session</div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <button onClick={e=>{e.stopPropagation();onPlay();}} style={{ width:42, height:42, borderRadius:"50%", background:"rgba(255,255,255,0.15)", backdropFilter:"blur(12px)", border:"1px solid rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center", color:"#FFFFFF", cursor:"pointer" }}>
              <Icon name="play" size={20}/>
            </button>
            {/* Static energy range preview */}
            <div style={{ display:"flex", gap:2, alignItems:"flex-end" }}>
              {[1,2,3,4,5,6,7,8,9,10].map(i => (
                <div key={i} style={{ width:3, height: 3 + i * 1.5, borderRadius:1.5, background: (i >= eMin && i <= eMax) ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.06)" }}/>
              ))}
            </div>
          </div>
        </div>
      )}
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
        style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px", borderRadius:12, cursor:"pointer", transition:"all 0.2s",
          background:active?"rgba(255,255,255,0.2)":hover?"rgba(255,255,255,0.12)":"rgba(255,255,255,0.06)",
          backdropFilter:"blur(20px) saturate(160%)",
          border:active?"1px solid rgba(255,255,255,0.25)":"1px solid rgba(255,255,255,0.08)",
          marginBottom:2 }}>
        <div style={{ width:38, height:38, borderRadius:8, overflow:"hidden", flexShrink:0, position:"relative" }}>
          <AlbumArt track={track} size={38} borderRadius={0}/>
          {active&&isPlaying&&<div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center" }}><div style={{ width:7, height:7, borderRadius:"50%", background:"#1A1D26", animation:"pulse 1s ease-in-out infinite" }}/></div>}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:14, fontWeight:active?600:400, letterSpacing:-0.15, color:active?"#1A1D26":"#4B5563", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{track.title}</div>
          <div style={{ fontSize:12, color:"#9CA3AF", marginTop:1 }}>{track.artist}</div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:3, flexShrink:0 }}>
          
          <div style={{ display:"flex", gap:4 }}>
            
            <span style={{ fontSize:10, color:"#C4C9D4" }}>{track.genre}</span>
          </div>
        </div>
        {onLike&&<button onClick={e=>{e.stopPropagation();onLike(track.id);}} style={{ background:"none", border:"none", cursor:"pointer", color:track.liked?"#1A1D26":"#C4C9D4", padding:4, transition:"color 0.2s" }}><Icon name={track.liked?"heart":"heartempty"} size={16}/></button>}
        {/* ⋯ menu button — always visible */}
        <button onClick={e=>{e.stopPropagation();setMenuOpen(o=>!o);setShowNewPl(false);}}
          style={{ background:"none", border:"none", cursor:"pointer", color:"#C4C9D4", padding:"4px 6px", fontSize:18, lineHeight:1, flexShrink:0 }}>⋯</button>
        {extraAction||null}
      </div>

      {/* ── Dropdown menu ── */}
      {menuOpen && (
        <div onClick={e=>e.stopPropagation()}
          style={{ position:"absolute", right:8, top:44, zIndex:50, background:"rgba(255,255,255,0.18)", backdropFilter:"blur(56px) saturate(240%)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:16, padding:"6px 0", minWidth:200, boxShadow:"0 12px 48px rgba(0,0,0,0.1)" }}>

          {/* Add to existing playlists */}
          {ctx.playlists.length > 0 && (
            <>
              <div style={{ fontSize:11, fontWeight:600, letterSpacing:0.5, color:"#C4C9D4", padding:"6px 14px", textTransform:"uppercase" }}>Add to playlist</div>
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
                <button onClick={handleCreateAndAdd} style={{ flex:1, background:"#1A1D26", border:"none", borderRadius:8, color:"#FFFFFF", fontSize:13, fontWeight:600, padding:"8px 0", cursor:"pointer" }}>Create & add</button>
                <button onClick={()=>setShowNewPl(false)} style={{ flex:1, background:"#F2F2F7", border:"1px solid rgba(60,60,67,0.12)", borderRadius:8, color:"#8E8E93", fontSize:13, padding:"8px 0", cursor:"pointer" }}>Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={()=>setShowNewPl(true)}
              style={{ display:"flex", alignItems:"center", gap:8, width:"100%", textAlign:"left", background:"none", border:"none", color:"#1A1D26", fontSize:14, padding:"10px 14px", cursor:"pointer", fontWeight:500 }}>
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
            style={{ display:"block", width:"100%", textAlign:"left", background:"none", border:"none", color:"#C4C9D4", fontSize:13, padding:"8px 14px", cursor:"pointer" }}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

const SectionLabel = ({ children, style={} }) => (
  <div style={{ fontSize:11, fontWeight:700, letterSpacing:1, color:"#1A1D26", marginBottom:10, textTransform:"uppercase", ...style }}>{children}</div>
);

// ─── LOGIN ────────────────────────────────────────────────────────────────────

function BrandGlyph({ size=84 }) {
  return <img src={vLogo} alt="" style={{ width:size, height:size, objectFit:"contain", display:"block" }}/>;
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
    <div style={APP_STYLE}>
      <BgMist color="#7FB6FF"/>
      <div style={{ position:"absolute", inset:0, background:"radial-gradient(circle at 20% 10%, rgba(127,182,255,0.12), transparent 28%), radial-gradient(circle at 80% 18%, rgba(162,121,255,0.12), transparent 24%), linear-gradient(180deg, rgba(8,12,24,0.78) 0%, rgba(9,14,28,0.72) 42%, rgba(7,10,20,0.82) 100%)", backdropFilter:"blur(34px) saturate(145%)" }} />
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100%", gap:26, padding:24, position:"relative", zIndex:2 }}>
        <div style={{ textAlign:"center", maxWidth:420 }}>
          <div style={{ width:96, height:96, borderRadius:28, margin:"0 auto 18px", background:"linear-gradient(135deg, rgba(255,255,255,0.24), rgba(127,182,255,0.08) 45%, rgba(162,121,255,0.1) 100%)", border:"1px solid rgba(255,255,255,0.24)", boxShadow:"0 30px 90px rgba(0,0,0,0.36), inset 0 1px 0 rgba(255,255,255,0.34), 0 0 50px rgba(127,182,255,0.12)", display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(30px) saturate(180%)" }}>
            <BrandGlyph size={76} />
          </div>
          
        </div>

        <div style={{ width:"100%", maxWidth:380, display:"flex", flexDirection:"column", gap:14, padding:18, borderRadius:28, background:"linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.05))", border:"1px solid rgba(255,255,255,0.14)", boxShadow:"0 24px 80px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.18), 0 0 40px rgba(127,182,255,0.08)", backdropFilter:"blur(34px) saturate(180%)" }}>
          <div style={{ display:"flex", background:"rgba(255,255,255,0.08)", borderRadius:16, padding:4, gap:4, border:"1px solid rgba(255,255,255,0.14)", backdropFilter:"blur(20px)" }}>
            {["login","signup"].map(m => (
              <button key={m} onClick={() => { setMode(m); resetMessages(); }} style={{ flex:1, padding:"10px 0", borderRadius:12, border:"none", cursor:"pointer", fontSize:14, fontWeight:600, background:mode===m?"linear-gradient(180deg, rgba(109,188,255,0.92), rgba(78,141,255,0.92))":"transparent", color:mode===m?"#FFFFFF":"rgba(232,240,255,0.72)", boxShadow:mode===m?"0 16px 36px rgba(76,126,255,0.32)":"none" }}>
                {m === "login" ? "Log In" : "Sign Up"}
              </button>
            ))}
          </div>

          {/* Email/Phone method toggle */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            {[{id:"email",label:"Email"},{id:"phone",label:"Phone"}].map(item => (
              <button key={item.id} onClick={() => switchMethod(item.id)} style={{ border:"1px solid rgba(255,255,255,0.2)", background:authMethod===item.id?"rgba(109,188,255,0.16)":"rgba(255,255,255,0.08)", color:authMethod===item.id?"#DCEBFF":"rgba(232,240,255,0.72)", borderRadius:14, padding:"10px 12px", fontWeight:600, cursor:"pointer", fontSize:13 }}>
                {item.label}
              </button>
            ))}
          </div>

          {authMethod === "email" && (
            <>
              {mode === "signup" && <input placeholder="Username" style={INPUT_ST} value={name} onChange={e => setName(e.target.value)} />}
              <input placeholder="Email" type="email" style={INPUT_ST} value={email} onChange={e => setEmail(e.target.value)} />
              <input placeholder="Password" type="password" style={INPUT_ST} value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()} />
              {mode === "login" && (
                <button onClick={handleForgotPassword} disabled={loading} style={{ alignSelf:"flex-end", marginTop:-4, background:"none", border:"none", cursor:"pointer", color:"#A9CCFF", fontWeight:600, fontSize:13 }}>
                  Forgot password?
                </button>
              )}
              <button onClick={handleSubmit} disabled={loading} style={{ ...BTN_PRIMARY, opacity:loading ? 0.7 : 1 }}>
                {loading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
              </button>
            </>
          )}

          {authMethod === "phone" && (
            <>
              {phoneStep === "enter" ? (
                <>
                  <input placeholder="Phone number (+15551234567)" type="tel" style={INPUT_ST} value={phone} onChange={e => setPhone(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSendOTP()} />
                  <button onClick={handleSendOTP} disabled={loading} style={{ ...BTN_PRIMARY, opacity:loading ? 0.7 : 1 }}>
                    {loading ? "Sending…" : "Send verification code"}
                  </button>
                </>
              ) : (
                <>
                  <input placeholder="6-digit code" inputMode="numeric" style={INPUT_ST} value={otp} onChange={e => setOtp(e.target.value)} onKeyDown={e => e.key === "Enter" && handleVerifyOTP()} />
                  <div style={{ display:"flex", gap:10 }}>
                    <button onClick={() => { setPhoneStep("enter"); setOtp(""); setConfirmResult(null); resetMessages(); }} style={{ ...BTN_SECONDARY, flex:1 }}>Edit number</button>
                    <button onClick={handleVerifyOTP} disabled={loading} style={{ ...BTN_PRIMARY, flex:1, opacity:loading ? 0.7 : 1 }}>
                      {loading ? "Verifying…" : "Verify code"}
                    </button>
                  </div>
                </>
              )}
              <div id="recaptcha-container" />
            </>
          )}

          {/* Divider */}
          <div style={{ display:"flex", alignItems:"center", gap:10, margin:"2px 0" }}>
            <div style={{ flex:1, height:"0.5px", background:"rgba(255,255,255,0.15)" }}/>
            <span style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>or</span>
            <div style={{ flex:1, height:"0.5px", background:"rgba(255,255,255,0.15)" }}/>
          </div>

          {/* Google — direct sign-in button with icon */}
          <button onClick={handleGoogleSignIn} disabled={loading} style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, width:"100%", padding:"13px 20px", borderRadius:16, border:"1px solid rgba(255,255,255,0.2)", background:"rgba(255,255,255,0.1)", backdropFilter:"blur(20px)", cursor:"pointer", opacity:loading?0.6:1, transition:"all 0.2s" }}>
            <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 0 0 0 12c0 1.94.46 3.77 1.28 5.39l3.56-2.77.01-.53z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            <span style={{ fontSize:14, fontWeight:600, color:"rgba(232,240,255,0.85)" }}>Continue with Google</span>
          </button>

          {error && (
            <div style={{ fontSize:13, color:"#FFD2CC", background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,120,99,0.18)", borderRadius:16, padding:"12px 14px", lineHeight:1.45 }}>
              {error}
            </div>
          )}
          {notice && (
            <div style={{ fontSize:13, color:"#D7E7FF", background:"rgba(255,255,255,0.08)", border:"1px solid rgba(127,182,255,0.16)", borderRadius:16, padding:"12px 14px", lineHeight:1.45 }}>
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
        <div style={{ fontSize:18, fontWeight:700, color:"#1A1D26", letterSpacing:-0.3, marginBottom:4 }}>Harmonic Map</div>
        <div style={{ fontSize:12, color:"#6B7280", lineHeight:1.5, marginBottom:12 }}>Your library visualized by musical key and energy. Each dot is a track — click to play. Tracks nearby sound great together.</div>
        <div style={{ display:"flex", gap:16, fontSize:10, color:"#9CA3AF" }}>
          <span>← Low key · High key →</span>
          <span>↑ High energy · Low energy ↓</span>
          {currentTrack && <span style={{ color:"#1A1D26", fontWeight:600 }}>● Now playing</span>}
        </div>
      </div>
      <div style={{ position:"relative", width:"100%", aspectRatio:"2/1", background:"rgba(255,255,255,0.55)", backdropFilter:"blur(40px)", borderRadius:16, border:"1px solid rgba(255,255,255,0.6)", overflow:"hidden", cursor:"crosshair" }}>
        {/* Grid lines */}
        {[1,2,3,4,5,6,7,8,9,10].map(e => (
          <div key={`e${e}`} style={{ position:"absolute", left:0, right:0, top:`${(1-((e-1)/9)*0.85-0.075)*100}%`, height:1, background:"rgba(0,0,0,0.03)" }}/>
        ))}
        {[1,2,3,4,5,6,7,8,9,10,11,12].map(k => (
          <div key={`k${k}`} style={{ position:"absolute", top:0, bottom:0, left:`${((k-1)/11)*0.85*100+7.5}%`, width:1, background:"rgba(0,0,0,0.03)" }}/>
        ))}

        {/* Key labels along bottom */}
        {[1,2,3,4,5,6,7,8,9,10,11,12].map(k => (
          <div key={`kl${k}`} style={{ position:"absolute", bottom:4, left:`${((k-1)/11)*0.85*100+7.5}%`, transform:"translateX(-50%)", fontSize:8, color:"#9CA3AF", fontWeight:500 }}>{k}</div>
        ))}

        {/* Energy labels along left */}
        {[2,4,6,8,10].map(e => (
          <div key={`el${e}`} style={{ position:"absolute", left:4, top:`${(1-((e-1)/9)*0.85-0.075)*100}%`, transform:"translateY(-50%)", fontSize:8, color:"#9CA3AF", fontWeight:500 }}>{e}</div>
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
              background: n.active ? "#1A1D26" : `rgba(${hexToRgbStr(n.color)},0.6)`,
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

// ── Shelf primitives — defined outside HomeScreen to prevent remount flashing ──
const GlassSection = ({label, children}) => (
  <div style={{ margin:"0 16px 16px", background:"rgba(255,255,255,0.55)", backdropFilter:"blur(40px)", border:"1px solid rgba(255,255,255,0.6)", borderRadius:20, overflow:"hidden" }}>
    {label && <div style={{ fontSize:11, fontWeight:700, letterSpacing:1, color:"#1A1D26", textTransform:"uppercase", padding:"14px 16px 0" }}>{label}</div>}
    <div style={{ padding:"12px 0 4px" }}>{children}</div>
  </div>
);

function HorizShelf({ items, onPlay, activeId }) {
  return (
    <div className="hide-scroll" style={{ display:"flex", gap:10, overflowX:"auto", padding:"0 16px 12px" }}>
      {items.map(t => (
        <div key={t.id} onClick={()=>onPlay(t)} style={{ flexShrink:0, width:110, cursor:"pointer" }}>
          <div style={{ width:110, height:110, borderRadius:10, overflow:"hidden", marginBottom:6, position:"relative",
            boxShadow: activeId===t.id ? "0 0 0 2px #1A1D26" : "0 1px 6px rgba(0,0,0,0.06)",
            opacity: activeId===t.id ? 1 : 0.92,
            transition:"box-shadow 0.3s, opacity 0.3s" }}>
            <AlbumArt track={t} size={110} borderRadius={0}/>
          </div>
          <div style={{ fontSize:11, fontWeight:activeId===t.id?600:500, color:"#1A1D26", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.title}</div>
          <div style={{ fontSize:10, color:"#4B5563", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.artist}</div>
        </div>
      ))}
    </div>
  );
}

function GridShelf({ items, onPlay, activeId }) {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(100px, 1fr))", gap:10, padding:"0 16px 12px" }}>
      {items.map(t => (
        <div key={t.id} onClick={()=>onPlay(t)} style={{ cursor:"pointer", minWidth:0 }}>
          <div style={{ width:"100%", aspectRatio:"1", borderRadius:8, overflow:"hidden", marginBottom:4, position:"relative",
            boxShadow: activeId===t.id ? "0 0 0 2px #1A1D26" : "0 1px 4px rgba(0,0,0,0.05)",
            opacity: activeId===t.id ? 1 : 0.92,
            transition:"box-shadow 0.3s, opacity 0.3s" }}>
            <AlbumArt track={t} size={200} borderRadius={0}/>
          </div>
          <div style={{ fontSize:10, fontWeight:activeId===t.id?600:500, color:"#1A1D26", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.title}</div>
          <div style={{ fontSize:9, color:"#4B5563", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.artist}</div>
        </div>
      ))}
    </div>
  );
}

function CrateShelf({ items, onPlay, activeId }) {
  return (
    <div className="hide-scroll" style={{ display:"flex", gap:3, overflowX:"auto", padding:"0 14px 10px" }}>
      {items.map(t => (
        <div key={t.id} onClick={()=>onPlay(t)}
          style={{ flexShrink:0, width:72, cursor:"pointer",
            transform: activeId===t.id ? "translateY(-4px)" : "none",
            transition:"transform 0.25s cubic-bezier(0.22,1,0.36,1)" }}>
          <div style={{ width:72, height:72, borderRadius:3, overflow:"hidden", position:"relative",
            boxShadow: activeId===t.id
              ? "0 4px 16px rgba(0,0,0,0.15), 0 0 0 2px #1A1D26"
              : "0 1px 2px rgba(0,0,0,0.08), -1px 0 0 rgba(0,0,0,0.03)" }}>
            <AlbumArt track={t} size={72} borderRadius={0}/>
          </div>
        </div>
      ))}
    </div>
  );
}

function HomeScreen({ tracks, onPlayRadio, onTogglePlay, onPlayTrack, currentTrack, isPlaying, onLike, isRadioMode, playlistCtx }) {
  const hour = new Date().getHours();
  const greeting = hour<12?"Good Morning":hour<18?"Good Afternoon":"Good Evening";
  const [eMin, eMax] = getEnergyRangeForHour(hour);
  const singles = tracks.filter(t=>(t.duration||0)<=900);
  const topTracks = [...singles].sort((a,b) => (b.playCount||0) - (a.playCount||0)).slice(0,6);
  const mixtapes = tracks.filter(t => (t.artist||"").toLowerCase() === "mixtape").sort((a,b) => (b.playCount||0) - (a.playCount||0));
  const recentlyLiked = [...singles].filter(t=>t.liked).slice(0,6);

  // Time-aware energy shelf — tracks matching current energy window
  
  

  // Harmonic neighbors — dynamically matched to current track
  const [mixSeed, setMixSeed] = useState(0);
  const prevMixTrackRef = useRef(null);
  // Re-shuffle when the current track changes
  if (currentTrack?.id !== prevMixTrackRef.current) {
    prevMixTrackRef.current = currentTrack?.id || null;
    // Trigger a new seed on next render won't work in render, so we use a ref-based approach
  }
  const harmonicNeighbors = currentTrack
    ? (() => {
        const cE = currentTrack.energy || 5;
        const cG = currentTrack.genre;
        const hasCamelot = currentTrack.camelot && currentTrack.camelot.trim();
        // Score each track by compatibility
        const scored = singles
          .filter(t => t.id !== currentTrack.id)
          .map(t => {
            let score = 0;
            // Camelot match (if both have keys)
            if (hasCamelot && t.camelot && camelotCompatible(currentTrack.camelot, t.camelot, 1)) score += 4;
            else if (hasCamelot && t.camelot && camelotCompatible(currentTrack.camelot, t.camelot, 2)) score += 2;
            // Genre match
            if (cG && t.genre === cG) score += 3;
            // Energy proximity
            const eDiff = Math.abs((t.energy||5) - cE);
            if (eDiff <= 1) score += 3;
            else if (eDiff <= 2) score += 2;
            else if (eDiff <= 3) score += 1;
            // BPM proximity
            if (currentTrack.bpm && t.bpm && Math.abs(currentTrack.bpm - t.bpm) <= 10) score += 1;
            // Slight random factor for variety
            score += Math.random() * 0.5;
            return { track: t, score };
          })
          .sort((a, b) => b.score - a.score)
          .slice(0, 12)
          .map(s => s.track);
        return scored;
      })()
    : [];

  const activeId = currentTrack?.id;
  // Memoize crate: set once when tracks first load, never reshuffle
  const [crateItems, setCrateItems] = useState([]);
  const crateInitRef = useRef(false);
  useEffect(() => {
    if (crateInitRef.current || !tracks.length) return;
    crateInitRef.current = true;
    const s = tracks.filter(t => (t.duration||0) <= 900);
    const shuffled = [...s];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setCrateItems(shuffled.slice(0, 50));
  }, [tracks]);

  // Smart section prioritization — max 4 sections below radio
  const hasHarmonic = harmonicNeighbors.length > 0;
  
  const hasLiked = recentlyLiked.length > 0;
  const hasMixes = mixtapes.length > 0;

  // Priority: harmonic (if playing) > energy > flipper (always) > liked > mixes > top
  // Cap at 4 content sections below radio card
  let sectionBudget = 4;
  const showHarmonic = hasHarmonic && sectionBudget > 0; if (showHarmonic) sectionBudget--;
  
  const showFlipper = sectionBudget > 0; if (showFlipper) sectionBudget--;
  const showLiked = hasLiked && sectionBudget > 0; if (showLiked) sectionBudget--;
  const showMixes = hasMixes && sectionBudget > 0; if (showMixes) sectionBudget--;
  const showTop = sectionBudget > 0;

  return (
    <div>
      <div style={{ padding:"16px 16px 8px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <BrandGlyph size={28}/>

      </div>

      <div style={{ padding:"0 16px 12px" }}>
        <DeepCutsCard onPlay={onPlayRadio} onTogglePlay={onTogglePlay} currentTrack={isRadioMode?currentTrack:null} isPlaying={isPlaying} isRadioMode={isRadioMode}/>
      </div>

      {/* Harmonic neighbors — highest priority when playing */}
      {showHarmonic && (
        <GlassSection label="mixes well with this">
          <GridShelf items={harmonicNeighbors} onPlay={t=>onPlayTrack(t,tracks)} activeId={activeId}/>
        </GlassSection>
      )}



      {/* CD Shelf */}
      {showFlipper && (
        <GlassSection label={crateItems.length ? `the crate · ${crateItems.length} records` : "the crate"}>
          <CrateShelf items={crateItems} onPlay={t=>onPlayTrack(t,tracks)} activeId={activeId}/>
        </GlassSection>
      )}

      {/* Recently liked */}
      {showLiked && (
        <GlassSection label="recently saved">
          <HorizShelf items={recentlyLiked} onPlay={t=>onPlayTrack(t,tracks)} activeId={activeId}/>
        </GlassSection>
      )}

      {/* Mixtapes */}
      {showMixes && (
        <GlassSection label="Mixtapes">
          <div style={{ padding:"0 14px 4px" }}>
            {mixtapes.map(t => (
              <div key={t.id} onClick={()=>onPlayTrack(t, mixtapes)}
                style={{ display:"flex", alignItems:"center", gap:12, padding:"8px 12px", borderRadius:10, cursor:"pointer", marginBottom:4,
                  background: currentTrack?.id===t.id ? "rgba(26,29,38,0.06)" : "rgba(255,255,255,0.5)",
                  border: currentTrack?.id===t.id ? "0.5px solid rgba(26,29,38,0.15)" : "0.5px solid rgba(255,255,255,0.5)",
                  transition:"all 0.2s" }}>
                <div style={{ width:44, height:44, borderRadius:8, overflow:"hidden", flexShrink:0 }}>
                  <AlbumArt track={t} size={44} borderRadius={0}/>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:500, color:"#1A1D26", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.title}</div>
                  <div style={{ fontSize:11, color:"#9CA3AF" }}>{t.artist}</div>
                </div>
                <span style={{ fontSize:11, fontWeight:500, color:"#9CA3AF", flexShrink:0 }}>{t.duration ? `${Math.floor(t.duration/60)}m` : ""}</span>
              </div>
            ))}
          </div>
        </GlassSection>
      )}

      {/* Top played — only if budget allows */}
      {showTop && <GlassSection label="top played">
        <div style={{ padding:"0 14px" }}>
          {topTracks.map((t,i)=>(
            <div key={t.id} style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:18, textAlign:"right", fontSize:12, fontWeight:600, color:"#C4C9D4", flexShrink:0 }}>{i+1}</div>
              <div style={{ flex:1 }}>
                <TrackRow track={t} onPlay={()=>onPlayTrack(t,tracks)} active={currentTrack?.id===t.id} isPlaying={isPlaying} onLike={onLike} playlistCtx={playlistCtx}/>
              </div>
            </div>
          ))}
        </div>
      </GlassSection>}
    </div>
  );
}

// ─── SEARCH ───────────────────────────────────────────────────────────────────
function SearchScreen({ query, setQuery, results, onPlay, onLike, currentTrack, isPlaying, playlistCtx }) {
  const [mixWith, setMixWith] = useState(null); // track to find mixes for
  const allTracks = results.length ? results : [];

  // Mix With results — Camelot compatible + similar energy
  const mixResults = mixWith ? allTracks.length === 0
    ? [] // placeholder, mixWith uses all tracks from parent
    : []
    : [];

  return (
    <div style={{ padding:"24px 16px 16px" }}>
      <div style={{ position:"relative", marginBottom:16 }}>
        <div style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:"#C4C9D4" }}><Icon name="search" size={16}/></div>
        <input placeholder="Tracks, artists, keys, energy…" style={{...INPUT_ST,paddingLeft:42}} value={query} onChange={e=>{setQuery(e.target.value);setMixWith(null);}} autoFocus/>
      </div>
      {/* Quick filters */}
      {!query && (
        <div style={{ display:"flex", gap:6, marginBottom:16, flexWrap:"wrap" }}>
          {["Soul","R&B","Jazz","House","Techno","Hip-Hop","Electronic","Ambient","Funk","Afrobeat","Rock","Indie"].map(g=>(
            <button key={g} onClick={()=>setQuery(g)} style={{ padding:"5px 12px", borderRadius:10, border:"1px solid rgba(255,255,255,0.5)", background:"rgba(255,255,255,0.4)", backdropFilter:"blur(20px)", color:"#6B7280", fontSize:11, fontWeight:500, cursor:"pointer", transition:"all 0.15s" }}>{g}</button>
          ))}
        </div>
      )}
      {query.length>1&&!results.length&&<div style={{ textAlign:"center", color:"#C4C9D4", padding:"48px 0" }}><div style={{ fontSize:14, color:"#9CA3AF" }}>No results for "{query}"</div></div>}
      {results.map(t=><TrackRow key={t.id} track={t} onPlay={()=>onPlay(t)} active={currentTrack?.id===t.id} isPlaying={isPlaying} onLike={onLike} playlistCtx={playlistCtx}/>)}
      {!query&&<div style={{ color:"#C4C9D4", textAlign:"center", paddingTop:32 }}><Icon name="search" size={28}/><div style={{ marginTop:8, fontSize:13, color:"#9CA3AF" }}>Search by name, genre, energy, or BPM</div></div>}
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
      <polyline points={points} fill="none" stroke="#1A1D26" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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

  // Genre map
  const genreMap = {};
  singles.forEach(t => { if(t.genre) { if(!genreMap[t.genre]) genreMap[t.genre]=[]; genreMap[t.genre].push(t); }});
  const genres = Object.keys(genreMap).sort((a,b) => genreMap[b].length - genreMap[a].length);

  // Mood system — uses energy, genre, and BPM to classify tracks into emotional contexts
  // Each mood defines a filter function that checks multiple signals
  const MOOD_DEFS = [
    { id:"meditative",  label:"Meditative",   desc:"Still & spacious",     filter: t => (t.energy||5) <= 2 },
    { id:"melancholy",  label:"Melancholy",    desc:"Reflective & deep",    filter: t => (t.energy||5) <= 3 && ["Soul","Jazz","Blues","Classical","Ambient","Folk"].includes(t.genre) },
    { id:"calm",        label:"Calm",          desc:"Gentle & easy",        filter: t => (t.energy||5) <= 3 },
    { id:"dreamy",      label:"Dreamy",        desc:"Floating & hazy",      filter: t => (t.energy||5) >= 2 && (t.energy||5) <= 4 && ["Ambient","Electronic","Indie","Experimental"].includes(t.genre) },
    { id:"focus",       label:"Focus",         desc:"Clear & undistracted", filter: t => (t.energy||5) >= 3 && (t.energy||5) <= 5 && (t.bpm||120) <= 120 },
    { id:"warm",        label:"Warm",          desc:"Comfortable & golden", filter: t => (t.energy||5) >= 3 && (t.energy||5) <= 5 && ["Soul","R&B","Jazz","Folk","World"].includes(t.genre) },
    { id:"groovy",      label:"Groovy",        desc:"Locked in & moving",   filter: t => (t.energy||5) >= 4 && (t.energy||5) <= 7 && ["Funk","R&B","Soul","House","Disco","Afrobeat"].includes(t.genre) },
    { id:"uplifting",   label:"Uplifting",     desc:"Bright & positive",    filter: t => (t.energy||5) >= 5 && (t.energy||5) <= 7 },
    { id:"driving",     label:"Driving",       desc:"Steady & forward",     filter: t => (t.energy||5) >= 6 && (t.energy||5) <= 8 && (t.bpm||120) >= 115 },
    { id:"euphoric",    label:"Euphoric",      desc:"Ecstatic & free",      filter: t => (t.energy||5) >= 7 && (t.energy||5) <= 9 && ["House","Techno","Electronic","Afrobeat"].includes(t.genre) },
    { id:"intense",     label:"Intense",       desc:"Raw power",            filter: t => (t.energy||5) >= 8 },
    { id:"chaotic",     label:"Chaotic",       desc:"Unhinged & wild",      filter: t => (t.energy||5) >= 9 },
    { id:"nocturnal",   label:"Nocturnal",     desc:"Late & introspective", filter: t => (t.energy||5) >= 3 && (t.energy||5) <= 6 && ["Electronic","Techno","House","Ambient","Experimental"].includes(t.genre) },
    { id:"cinematic",   label:"Cinematic",     desc:"Widescreen & epic",    filter: t => (t.energy||5) >= 4 && (t.energy||5) <= 7 && ["Classical","Ambient","Electronic","Experimental","World"].includes(t.genre) },
    { id:"social",      label:"Social",        desc:"Background buzz",      filter: t => (t.energy||5) >= 4 && (t.energy||5) <= 6 && ["Jazz","Soul","R&B","Latin","Afrobeat","Funk","Reggae"].includes(t.genre) },
    { id:"raw",         label:"Raw",           desc:"Gritty & unpolished",  filter: t => (t.energy||5) >= 5 && ["Rock","Alternative","Hip-Hop","Indie","Experimental"].includes(t.genre) },
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
  const timeLabel = hour>=22||hour<=5?"late night":hour<=8?"early morning":hour<=12?"morning":hour<=17?"afternoon":"evening";

  // For You — mix of liked genres, right energy, shuffled
  const likedGenres = [...new Set(likedTracks.map(t=>t.genre).filter(Boolean))];
  const forYou = likedGenres.length > 0
    ? singles.filter(t => likedGenres.includes(t.genre) && (t.energy||5)>=eMin && (t.energy||5)<=eMax && !t.liked).sort(()=>Math.random()-0.5).slice(0,8)
    : timeRecs.slice(0,8);

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
    <button onClick={onClick} style={{ padding:"8px 20px", borderRadius:10, border:"none", background: active?"#FFFFFF":"transparent", color: active?"#1A1D26":"#6B7280", fontSize:13, fontWeight:active?600:500, cursor:"pointer", transition:"all 0.2s", flexShrink:0, boxShadow:active?"0 1px 4px rgba(0,0,0,0.08)":"none", letterSpacing:-0.1 }}>{label}</button>
  );

  const SectionHead = ({children}) => (
    <div style={{ fontSize:11, fontWeight:700, letterSpacing:1, color:"#1A1D26", textTransform:"uppercase", marginBottom:10 }}>{children}</div>
  );

  return (
    <div style={{ overflowY:"auto", height:"100%", minHeight:"calc(100vh - 112px)" }}>
      {/* Tab bar */}
      <div style={{ padding:"20px 16px 14px", position:"sticky", top:0, zIndex:10, background:"rgba(245,245,247,0.92)", backdropFilter:"blur(32px)" }}>
        <div style={{ display:"inline-flex", gap:2, padding:3, borderRadius:12, background:"rgba(0,0,0,0.04)", boxShadow:"inset 0 1px 2px rgba(0,0,0,0.03)" }}>
          <Pill label="Discover" active={view==="discover"} onClick={()=>setView("discover")}/>
          <Pill label="Saved" active={view==="liked"} onClick={()=>setView("liked")}/>
          <Pill label="Genres" active={view==="genres"} onClick={()=>{setView("genres");setGenreFilter(null);}}/>
          <Pill label="Playlists" active={view==="playlists"||isPlaylistView} onClick={()=>setView("playlists")}/>
        </div>
      </div>

      {/* ══ DISCOVER view — intelligent recommendations ══ */}
      {view === "discover" && (
        <div style={{ padding:"0 0 24px" }}>
          {/* For You */}
          {forYou.length > 0 && (
            <div style={{ margin:"0 16px 16px", padding:"16px", borderRadius:16, background:"rgba(255,255,255,0.55)", backdropFilter:"blur(40px)", border:"1px solid rgba(255,255,255,0.6)" }}>
              <SectionHead>recommended for you</SectionHead>
              <div className="hide-scroll" style={{ display:"flex", gap:12, overflowX:"auto", padding:"0 0 4px" }}>
                {forYou.map(t => (
                  <div key={t.id} onClick={()=>onPlay(t)} style={{ flexShrink:0, width:110, cursor:"pointer" }}>
                    <div style={{ width:110, height:110, borderRadius:10, overflow:"hidden", marginBottom:6, boxShadow:"0 2px 10px rgba(0,0,0,0.08)", position:"relative" }}>
                      <AlbumArt track={t} size={110} borderRadius={0}/>
                    </div>
                    <div style={{ fontSize:12, fontWeight:600, color:"#1A1D26", letterSpacing:-0.2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.title}</div>
                    <div style={{ fontSize:10, color:"#6B7280" }}>{t.artist}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Right now — time-based */}
          {timeRecs.length > 0 && (
            <div style={{ margin:"0 16px 16px", padding:"16px", borderRadius:16, background:"rgba(255,255,255,0.55)", backdropFilter:"blur(40px)", border:"1px solid rgba(255,255,255,0.6)" }}>
              <SectionHead>{timeLabel} picks</SectionHead>
              <div className="hide-scroll" style={{ display:"flex", gap:12, overflowX:"auto", padding:"0 0 4px" }}>
                {timeRecs.slice(0,8).map(t => (
                  <div key={t.id} onClick={()=>onPlay(t)} style={{ flexShrink:0, width:90, cursor:"pointer" }}>
                    <div style={{ width:90, height:90, borderRadius:8, overflow:"hidden", marginBottom:4, boxShadow:"0 1px 6px rgba(0,0,0,0.06)" }}>
                      <AlbumArt track={t} size={90} borderRadius={0}/>
                    </div>
                    <div style={{ fontSize:11, fontWeight:500, color:"#1A1D26", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.title}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Moods */}
          {moodKeys.length > 0 && (
          <div style={{ margin:"0 16px 16px", padding:"16px", borderRadius:16, background:"rgba(255,255,255,0.55)", backdropFilter:"blur(40px)", border:"1px solid rgba(255,255,255,0.6)" }}>
            <SectionHead>moods</SectionHead>
            <div className="hide-scroll" style={{ display:"flex", gap:8, overflowX:"auto", padding:"0 0 4px" }}>
              {moodKeys.map(mood => (
                <div key={mood} onClick={()=>{setView("genres");setGenreFilter(null);setMoodFilter(mood);}}
                  style={{ flexShrink:0, width:140, padding:"14px 14px", borderRadius:12, background:"rgba(0,0,0,0.03)", border:"none", cursor:"pointer", transition:"all 0.15s" }}>
                  <div style={{ fontSize:14, fontWeight:700, color:"#1A1D26", marginBottom:2 }}>{mood}</div>
                  <div style={{ fontSize:10, color:"#6B7280", marginBottom:6 }}>{moodMeta[mood]?.desc}</div>
                  <div style={{ fontSize:10, color:"#9CA3AF" }}>{moods[mood].length} tracks</div>
                </div>
              ))}
            </div>
          </div>
          )}

          {/* Genre grid */}
          <div style={{ margin:"0 16px 16px", padding:"16px", borderRadius:16, background:"rgba(255,255,255,0.55)", backdropFilter:"blur(40px)", border:"1px solid rgba(255,255,255,0.6)" }}>
            <SectionHead>browse by genre</SectionHead>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(90px, 1fr))", gap:6 }}>
            {genres.map(g => (
              <div key={g} onClick={()=>{setView("genres");setGenreFilter(g);}}
                style={{ padding:"10px 8px", borderRadius:10, background:"rgba(0,0,0,0.03)", border:"none", cursor:"pointer", textAlign:"center", transition:"all 0.15s" }}>
                <div style={{ fontSize:12, fontWeight:600, color:"#1A1D26" }}>{g}</div>
                <div style={{ fontSize:10, color:"#6B7280", marginTop:2 }}>{genreMap[g].length}</div>
              </div>
            ))}
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
            <div style={{ marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ fontSize:18, fontWeight:700, color:"#1A1D26" }}>{moodFilter}</div>
                <button onClick={()=>{setMoodFilter(null);setView("discover");}} style={{ background:"none", border:"none", color:"#9CA3AF", fontSize:12, cursor:"pointer" }}>← back</button>
              </div>
              <div style={{ fontSize:12, color:"#9CA3AF", marginTop:4 }}>{moods[moodFilter]?.length||0} tracks</div>
            </div>
          )}
          {view === "genres" && genreFilter && !moodFilter && (
            <div style={{ marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ fontSize:18, fontWeight:700, color:"#1A1D26" }}>{genreFilter}</div>
                <button onClick={()=>setGenreFilter(null)} style={{ background:"none", border:"none", color:"#9CA3AF", fontSize:12, cursor:"pointer" }}>← all genres</button>
              </div>
              <div style={{ fontSize:12, color:"#9CA3AF", marginTop:4 }}>{(genreMap[genreFilter]||[]).length} tracks</div>
            </div>
          )}
          {(view === "liked" || (view === "genres" && (genreFilter || moodFilter)) || isPlaylistView) && (
            <>
              {view === "liked" && (
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                  <div style={{ fontSize:18, fontWeight:700, color:"#1A1D26" }}>Saved</div>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:12, color:"#9CA3AF" }}>{likedTracks.length}</span>
                    <EnergySparkline tracks={likedTracks}/>
                  </div>
                </div>
              )}
              {isPlaylistView && (
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                  <div style={{ fontSize:18, fontWeight:700, color:"#1A1D26" }}>{activeLabel}</div>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:12, color:"#9CA3AF" }}>{activeTracks.length}</span>
                    <EnergySparkline tracks={activeTracks}/>
                  </div>
                </div>
              )}
              {(moodFilter ? (moods[moodFilter]||[]) : (genreFilter ? (genreMap[genreFilter]||[]) : activeTracks)).length === 0 ? (
                <div style={{ textAlign:"center", color:"#C4C9D4", paddingTop:48 }}>
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
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {userPlaylists.map(pl => {
              const plTracks = (pl.trackIds||[]).map(id=>tracks.find(t=>t.id===id)).filter(Boolean);
              return (
                <div key={pl.id} onClick={()=>setView(pl.id)}
                  style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", borderRadius:14, background:"rgba(255,255,255,0.15)", backdropFilter:"blur(40px) saturate(200%)", border:"1px solid rgba(255,255,255,0.2)", cursor:"pointer", transition:"all 0.2s" }}>
                  <div style={{ display:"flex", gap:2, flexShrink:0 }}>
                    {plTracks.slice(0,3).map((t,i)=>(
                      <div key={i} style={{ width:36, height:36, borderRadius:6, overflow:"hidden", marginLeft:i>0?-8:0, boxShadow:"0 1px 4px rgba(0,0,0,0.1)", border:"1px solid rgba(255,255,255,0.6)" }}>
                        <AlbumArt track={t} size={36} borderRadius={0}/>
                      </div>
                    ))}
                    {plTracks.length === 0 && <div style={{ width:36, height:36, borderRadius:6, background:"rgba(0,0,0,0.04)", display:"flex", alignItems:"center", justifyContent:"center" }}><Icon name="plus" size={14}/></div>}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:14, fontWeight:600, color:"#1A1D26" }}>{pl.name}</div>
                    <div style={{ fontSize:11, color:"#9CA3AF" }}>{plTracks.length} tracks</div>
                  </div>
                  <EnergySparkline tracks={plTracks} width={60} height={16}/>
                  <button onClick={e=>{e.stopPropagation();onDeletePlaylist(pl.id);}} style={{ background:"none", border:"none", color:"#C4C9D4", cursor:"pointer", padding:4, fontSize:14 }}>×</button>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop:12 }}>
            {showNewInput ? (
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <input autoFocus value={newName} onChange={e=>setNewName(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")handleCreate();if(e.key==="Escape"){setShowNewInput(false);setNewName("");}}} placeholder="Playlist name…" style={{ flex:1, background:"rgba(255,255,255,0.6)", border:"1px solid rgba(255,255,255,0.5)", borderRadius:10, padding:"10px 12px", color:"#1A1D26", fontSize:13, fontFamily:"inherit" }}/>
                <button onClick={handleCreate} style={{ background:"#1A1D26", border:"none", borderRadius:10, color:"#FFF", fontSize:13, fontWeight:600, padding:"10px 16px", cursor:"pointer" }}>Create</button>
              </div>
            ) : (
              <button onClick={()=>setShowNewInput(true)} style={{ width:"100%", padding:"14px", borderRadius:14, border:"1px dashed rgba(0,0,0,0.1)", background:"rgba(255,255,255,0.3)", color:"#9CA3AF", fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
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
        <div style={{ fontSize:12, color:"#8E8E93", marginTop:4, letterSpacing:1, fontWeight:600, textTransform:"uppercase" }}></div>
      </div>
      {/* Listening personality */}
      {(() => {
        const likedTracks = tracks.filter(t=>t.liked);
        const avgEnergy = likedTracks.length ? (likedTracks.reduce((s,t)=>s+(t.energy||5),0)/likedTracks.length).toFixed(1) : "—";
        const topGenres = Object.entries(likedTracks.reduce((acc,t)=>{if(t.genre){acc[t.genre]=(acc[t.genre]||0)+1;}return acc;},{})).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([g])=>g);
        const avgBpm = likedTracks.filter(t=>t.bpm).length ? Math.round(likedTracks.filter(t=>t.bpm).reduce((s,t)=>s+t.bpm,0)/likedTracks.filter(t=>t.bpm).length) : null;
        return (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:24 }}>
            <div style={{ background:"rgba(255,255,255,0.15)", backdropFilter:"blur(40px) saturate(200%)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:14, padding:"16px", boxShadow:"0 1px 4px rgba(0,0,0,0.03)" }}>
              <div style={{ fontSize:28, fontWeight:700, letterSpacing:-0.5, color:"#1A1D26" }}>{liked}</div>
              <div style={{ fontSize:10, color:"#9CA3AF", letterSpacing:1, marginTop:2, fontWeight:600, textTransform:"uppercase" }}>saved</div>
            </div>
            <div style={{ background:"rgba(255,255,255,0.15)", backdropFilter:"blur(40px) saturate(200%)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:14, padding:"16px", boxShadow:"0 1px 4px rgba(0,0,0,0.03)" }}>
              <div style={{ fontSize:28, fontWeight:700, letterSpacing:-0.5, color:"#1A1D26" }}>{tracks.length}</div>
              <div style={{ fontSize:10, color:"#9CA3AF", letterSpacing:1, marginTop:2, fontWeight:600, textTransform:"uppercase" }}>tracks</div>
            </div>
            <div style={{ background:"rgba(255,255,255,0.15)", backdropFilter:"blur(40px) saturate(200%)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:14, padding:"16px", boxShadow:"0 1px 4px rgba(0,0,0,0.03)" }}>
              <div style={{ fontSize:16, fontWeight:700, color:"#1A1D26" }}>{avgBpm || "—"}</div>
              <div style={{ fontSize:10, color:"#9CA3AF", letterSpacing:1, marginTop:2, fontWeight:600, textTransform:"uppercase" }}>avg bpm</div>
            </div>
            <div style={{ background:"rgba(255,255,255,0.15)", backdropFilter:"blur(40px) saturate(200%)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:14, padding:"16px", boxShadow:"0 1px 4px rgba(0,0,0,0.03)" }}>
              <div style={{ fontSize:13, fontWeight:600, color:"#1A1D26", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{topGenres.length ? topGenres.join(", ") : "—"}</div>
              <div style={{ fontSize:10, color:"#9CA3AF", letterSpacing:1, marginTop:2, fontWeight:600, textTransform:"uppercase" }}>top genres</div>
            </div>
          </div>
        );
      })()}
      <SectionLabel>Preferred Genres</SectionLabel>
      <div style={{ fontSize:12, color:"rgba(200,200,205,0.6)", marginBottom:12 }}>Tap to select — {user.genres.length} selected</div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:7, marginBottom:28 }}>
        {ALL_GENRES.map(g=>{
          const on=user.genres.includes(g);
          return <div key={g} onClick={()=>setUser(u=>({...u,genres:on?u.genres.filter(x=>x!==g):[...u.genres,g]}))}
            style={{ padding:"6px 13px", borderRadius:20, fontSize:12.5, fontWeight:on?600:400, cursor:"pointer", transition:"all 0.15s",
              border:`1px solid ${on?"rgba(26,29,38,0.3)":"rgba(60,60,67,0.12)"}`,
              background:on?"rgba(26,29,38,0.08)":"#FFFFFF",
              color:on?"#1A1D26":"#8E8E93" }}>{g}</div>;
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
      <div style={{ width:22, textAlign:"right", fontSize:14, fontWeight:700, color:"#C4C9D4", flexShrink:0 }}>{rank}</div>
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
        <div style={{ fontSize:10, color:"#C4C9D4", fontWeight:600 }}>{label}</div>
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
    a.href = url; a.download = `v-music-tracks-${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    showToast(`Exported ${tracks.length} tracks`);
  }

  // ── CSV IMPORT ──
  async function importCSV(file) {
    setImporting(true); setImportProgress("Reading file...");
    const text = await file.text();
    const lines = text.split("\n").filter(l => l.trim());
    if (lines.length < 2) { showToast("CSV appears empty"); setImporting(false); return; }

    // Parse header
    const header = parseCSVLine(lines[0]);
    const titleIdx = header.findIndex(h => h.toLowerCase().trim() === "title");
    const artistIdx = header.findIndex(h => h.toLowerCase().trim() === "artist");
    if (titleIdx === -1 || artistIdx === -1) {
      showToast("CSV must have 'title' and 'artist' columns");
      setImporting(false); return;
    }

    // Parse rows
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const vals = parseCSVLine(lines[i]);
      if (!vals[titleIdx]?.trim()) continue;
      const row = {};
      header.forEach((h, idx) => { row[h.toLowerCase().trim()] = (vals[idx] || "").trim(); });
      rows.push(row);
    }

    setImportProgress(`Parsed ${rows.length} rows. Writing to Firestore...`);

    // Build a lookup of existing tracks by title+artist for matching
    const existing = {};
    tracks.forEach(t => { existing[`${(t.title||"").toLowerCase()}|||${(t.artist||"").toLowerCase()}`] = t; });

    let updated = 0, created = 0, errors = 0;
    const cols = ["#8899aa","#7a9e8a","#9090b0","#a09898","#88a8b0","#a0a0b8","#7aaa98"];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const matchKey = `${(r.title||"").toLowerCase()}|||${(r.artist||"").toLowerCase()}`;
      const match = existing[matchKey];

      try {
        if (match) {
          // Update existing track — merge CSV fields onto it
          const updates = {};
          if (r.genre && r.genre.trim()) updates.genre = r.genre.trim();
          if (r.camelot && r.camelot.trim()) updates.camelot = r.camelot.trim();
          if (r.bpm && !isNaN(parseInt(r.bpm))) updates.bpm = parseInt(r.bpm);
          if (r.energy && !isNaN(parseInt(r.energy))) updates.energy = parseInt(r.energy);
          if (r.album && r.album.trim()) updates.album = r.album.trim();
          if (r.audiourl || r.audioUrl) updates.audioUrl = (r.audiourl || r.audioUrl).trim();
          if (r.albumcover || r.albumCover) updates.albumCover = (r.albumcover || r.albumCover).trim();
          if (r.color && r.color.trim()) updates.color = r.color.trim();
          if (r.duration && !isNaN(parseFloat(r.duration))) updates.duration = parseFloat(r.duration);

          if (Object.keys(updates).length > 0) {
            await updateDoc(doc(db, "tracks", match.id), updates);
            setTracks(prev => prev.map(t => t.id === match.id ? { ...t, ...updates } : t));
            updated++;
          }
        } else if (r.id && r.id.trim()) {
          // Has an ID — try to update that specific doc, or create it
          const trackData = {
            title: r.title || "", artist: r.artist || "", album: r.album || "",
            genre: r.genre || "", camelot: r.camelot || "",
            energy: parseInt(r.energy) || 5, bpm: parseInt(r.bpm) || null,
            audioUrl: r.audiourl || r.audioUrl || "", albumCover: r.albumcover || r.albumCover || "",
            color: r.color || cols[Math.floor(Math.random() * cols.length)],
            duration: parseFloat(r.duration) || 0,
            createdAt: new Date(), likeCount: 0, playCount: 0, skipCount: 0,
          };
          await setDoc(doc(db, "tracks", r.id.trim()), trackData, { merge: true });
          created++;
        } else {
          // New track without ID — create with auto-generated key
          const trackData = {
            title: r.title || "", artist: r.artist || "", album: r.album || "",
            genre: r.genre || "", camelot: r.camelot || "",
            energy: parseInt(r.energy) || 5, bpm: parseInt(r.bpm) || null,
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

    // Reload all tracks from Firestore to get fresh state
    setImportProgress("Reloading library...");
    try {
      const q2 = query(collection(db, "tracks"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q2);
      const loaded = snap.docs.map(d => ({ ...d.data(), id: d.id, liked: false }));
      setTracks(loaded);
    } catch(e) {}

    setImporting(false);
    setImportProgress("");
    showToast(`Import done: ${updated} updated, ${created} created${errors ? `, ${errors} errors` : ""}`);
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
        <div style={{ fontSize:28, fontWeight:700, letterSpacing:-0.5, color:"#1C1C1E" }}>Admin</div>
      </div>
      <div style={{ display:"flex", gap:6, marginBottom:20, background:"rgba(18,18,20,0.65)", backdropFilter:"blur(16px)", borderRadius:12, padding:3, border:"1px solid rgba(255,255,255,0.07)" }}>
        {["tracks","analytics","audit"].map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{ flex:1, padding:"8px 0", borderRadius:10, border:"none", cursor:"pointer", fontSize:13, fontWeight:600, textTransform:"capitalize", background:tab===t?"#FFFFFF":"transparent", color:tab===t?"#1C1C1E":"#C4C9D4", boxShadow:tab===t?"0 1px 3px rgba(0,0,0,0.06)":"none" }}>
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
            <div key={t.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", background:"rgba(255,255,255,0.15)", backdropFilter:"blur(32px)", borderRadius:10, marginBottom:4, border:"1px solid rgba(255,255,255,0.16)" }}>
              <div style={{ width:36, height:36, borderRadius:7, overflow:"hidden", flexShrink:0 }}><AlbumArt track={t} size={36} borderRadius={0}/></div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:14, fontWeight:500, color:"#1A1D26", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.title}</div>
                <div style={{ fontSize:12, color:"#6B7280" }}>{t.artist}</div>
              </div>
              <div style={{ display:"flex", gap:4, flexShrink:0, flexWrap:"wrap", justifyContent:"flex-end", maxWidth:180 }}>
                {t.genre&&<span style={{ fontSize:10, fontWeight:500, padding:"2px 8px", borderRadius:6, background:"rgba(26,29,38,0.06)", color:"#1A1D26" }}>{t.genre}</span>}
                {t.camelot&&<span style={{ fontSize:10, fontWeight:600, padding:"2px 8px", borderRadius:6, background:"rgba(26,29,38,0.08)", color:"#1A1D26" }}>{t.camelot}</span>}
                {t.bpm&&<span style={{ fontSize:10, fontWeight:500, padding:"2px 8px", borderRadius:6, background:"rgba(0,0,0,0.04)", color:"#9CA3AF" }}>{t.bpm}bpm</span>}
                {t.energy&&<span style={{ fontSize:10, fontWeight:500, padding:"2px 8px", borderRadius:6, background:"rgba(0,0,0,0.04)", color:"#9CA3AF" }}>E{t.energy}</span>}
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
            {[["Tracks",tracks.length],["Liked",tracks.filter(t=>t.liked).length],["Genres",[...new Set(tracks.map(t=>t.genre))].length],["BPMs",[...new Set(tracks.filter(t=>t.bpm).map(t=>t.bpm))].length]].map(([l,v])=>(
              <div key={l} style={{ padding:"14px 16px", background:"#FFFFFF", borderRadius:14, border:"0.5px solid rgba(60,60,67,0.12)", boxShadow:"0 1px 4px rgba(0,0,0,0.04)" }}>
                <div style={{ fontSize:11, fontWeight:600, letterSpacing:0.5, color:"#C4C9D4", textTransform:"uppercase", marginBottom:4 }}>{l}</div>
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
            <button onClick={exportCSV} style={{ flex:1, padding:"14px", borderRadius:14, background:"#1A1D26", color:"#FFF", border:"none", fontSize:14, fontWeight:600, cursor:"pointer" }}>
              Export CSV ({tracks.length} tracks)
            </button>
            <button onClick={()=>fileInputRef.current?.click()} disabled={importing}
              style={{ flex:1, padding:"14px", borderRadius:14, background:"rgba(255,255,255,0.12)", backdropFilter:"blur(32px)", color:"#1A1D26", border:"1px solid rgba(255,255,255,0.18)", fontSize:14, fontWeight:600, cursor:importing?"wait":"pointer" }}>
              {importing ? "Importing..." : "Import CSV"}
            </button>
            <input ref={fileInputRef} type="file" accept=".csv" style={{ display:"none" }}
              onChange={e => { if(e.target.files[0]) importCSV(e.target.files[0]); e.target.value=""; }}/>
          </div>
          {importProgress && (
            <div style={{ padding:"10px 14px", borderRadius:10, background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.12)", marginBottom:16, fontSize:12, color:"#6B7280" }}>
              {importProgress}
            </div>
          )}
          <div style={{ padding:"10px 14px", borderRadius:10, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", marginBottom:24, fontSize:11, color:"#9CA3AF", lineHeight:1.6 }}>
            <strong style={{ color:"#6B7280" }}>How it works:</strong> Export downloads all tracks as CSV. Edit in a spreadsheet — add camelot keys, fix genres, update BPM. Import reads the CSV back and matches tracks by title + artist. Existing tracks get updated, new rows get created. Columns: id, title, artist, album, genre, energy, camelot, bpm, audioUrl, albumCover, color, duration.
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
                        <div style={{ fontSize:28, fontWeight:700, color:"#1A1D26" }}>{has}<span style={{ fontSize:14, color:"#9CA3AF" }}>/{total}</span></div>
                        <div style={{ height:4, background:"rgba(0,0,0,0.06)", borderRadius:2, marginTop:8, overflow:"hidden" }}>
                          <div style={{ width:`${pct}%`, height:"100%", background: pct === 100 ? "#22C55E" : pct > 50 ? "#1A1D26" : "#EF4444", borderRadius:2, transition:"width 0.5s" }}/>
                        </div>
                        <div style={{ fontSize:10, color:"#9CA3AF", marginTop:4 }}>{pct}% covered</div>
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
                          <span style={{ fontWeight:700, color:"#1A1D26", marginRight:4 }}>{key}</span>
                          <span style={{ color:"#9CA3AF" }}>{count}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Missing camelot keys */}
                <SectionLabel>Missing Camelot Keys ({withoutKey.length})</SectionLabel>
                {withoutKey.length === 0 ? (
                  <div style={{ padding:"24px 0", textAlign:"center", color:"#9CA3AF", fontSize:13 }}>All tracks have Camelot keys assigned</div>
                ) : (
                  <>
                    <div style={{ padding:"12px 14px", borderRadius:14, background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.12)", marginBottom:12 }}>
                      <div style={{ fontSize:12, color:"#1A1D26", fontWeight:600, marginBottom:4 }}>{withoutKey.length} tracks missing keys</div>
                      <div style={{ fontSize:11, color:"#6B7280", lineHeight:1.5, marginBottom:12 }}>You can batch-assign estimated keys based on BPM and genre. These are rough estimates — for accurate keys, use DJ software like Mixed In Key or Rekordbox to analyze audio.</div>
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
                            <div style={{ fontSize:12, fontWeight:600, color:"#1A1D26", letterSpacing:-0.2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.title}</div>
                            <div style={{ fontSize:10, color:"#9CA3AF" }}>{t.artist}</div>
                          </div>
                          <span style={{ fontSize:9, color:"#C4C9D4" }}>{t.bpm ? `${t.bpm}bpm` : "no bpm"}</span>
                          <span style={{ fontSize:9, color:"#C4C9D4" }}>{t.genre || "no genre"}</span>
                          <button onClick={()=>setEditTrack(t)} style={{ background:"none", border:"none", cursor:"pointer", color:"#9CA3AF", padding:4 }}><Icon name="edit" size={12}/></button>
                        </div>
                      ))}
                      {withoutKey.length > 50 && <div style={{ textAlign:"center", color:"#9CA3AF", fontSize:11, padding:8 }}>... and {withoutKey.length - 50} more</div>}
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
          {isRadioMode&&<div style={{ fontSize:11, color:"#1A1D26", letterSpacing:1.5, textTransform:"uppercase", marginBottom:6, fontWeight:700 }}>● V Radio</div>}
          <div style={{ fontSize:24, fontWeight:700, letterSpacing:-0.5, color:"#FFFFFF" }}>{track.title}</div>
          <div style={{ fontSize:15, color:"rgba(220,220,225,0.8)", marginTop:4 }}>{track.artist}</div>
          <div style={{ fontSize:12, color:"rgba(200,200,205,0.55)", marginTop:2 }}>{track.album} · {track.genre}</div>
          <div style={{ marginTop:10, display:"flex", justifyContent:"center", alignItems:"center", gap:12 }}>
            
            
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
          <button onClick={onLike} style={{ background:"none",border:"none",cursor:"pointer",color:track.liked?"#1A1D26":"rgba(255,255,255,0.55)",padding:4 }}><Icon name={track.liked?"heart":"heartempty"} size={20}/></button>
          <button onClick={onPrev} style={CTRL_BTN}><Icon name="prev" size={22}/></button>
          <button onClick={onTogglePlay} style={{ ...CTRL_BTN,width:56,height:56,background:"rgba(255,255,255,0.15)",backdropFilter:"blur(20px)",border:"1px solid rgba(255,255,255,0.25)",borderRadius:"50%",color:"#FFFFFF" }}>
            <Icon name={isPlaying?"pause":"play"} size={26}/>
          </button>
          <button onClick={onSkip} style={CTRL_BTN}><Icon name="skip" size={22}/></button>
          <button onClick={()=>setRepeat(r=>!r)} style={{ background:"none",border:"none",cursor:"pointer",color:repeat?"#1A1D26":"rgba(255,255,255,0.55)",padding:4 }}><Icon name="repeat" size={18}/></button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ position:"fixed", bottom:56, left:0, right:0, zIndex:80, padding:"0 8px" }}>
      <div onClick={()=>setExpanded(true)} style={{ background:"rgba(255,255,255,0.1)", backdropFilter:"blur(72px) saturate(260%)", borderRadius:18, padding:"8px 12px", display:"flex", alignItems:"center", gap:10, border:"1px solid rgba(255,255,255,0.2)", boxShadow:`0 8px 32px rgba(0,0,0,0.06), 0 0 40px rgba(${hexToRgbStr(track.color)},0.06)`, cursor:"pointer" }}>
        <div style={{ width:42, height:42, borderRadius:10, overflow:"hidden", flexShrink:0, boxShadow:"0 2px 8px rgba(0,0,0,0.1)" }}><AlbumArt track={track} size={42} borderRadius={0}/></div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:14, fontWeight:600, color:"#1C1C1E", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {isRadioMode&&<span style={{ fontSize:10, color:"#1A1D26", fontWeight:700, letterSpacing:1, marginRight:6 }}>●</span>}
            {track.title}
          </div>
          <div style={{ fontSize:12, color:"#8E8E93" }}>{track.artist}</div>
          <div style={{ marginTop:4, background:"rgba(255,255,255,0.25)", borderRadius:1.5, height:2 }}>
            <div style={{ width:`${pct}%`, background:"#1A1D26", height:"100%", borderRadius:2, transition:"width 1s linear" }}/>
          </div>
        </div>
        <button onClick={e=>{e.stopPropagation();onLike();}} style={{ background:"none",border:"none",cursor:"pointer",color:track.liked?"#1A1D26":"#C4C9D4",padding:4 }}><Icon name={track.liked?"heart":"heartempty"} size={16}/></button>
        <button onClick={e=>{e.stopPropagation();onTogglePlay();}} style={{ background:"#1A1D26",border:"none",borderRadius:"50%",width:34,height:34,cursor:"pointer",color:"#FFFFFF",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:"0 2px 8px rgba(0,0,0,0.15)" }}>
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
    {id:"home",label:"Home",icon:"home"},{id:"map",label:"Map",icon:"grid"},{id:"search",label:"Search",icon:"search"},
    {id:"favorites",label:"Library",icon:"heartempty"},{id:"profile",label:"Profile",icon:"profile"},
    {id:"admin",label:"Admin",icon:"settings"},
  ];
  return (
    <div style={{ position:"fixed", bottom:0, left:0, right:0, height:52, background:"rgba(255,255,255,0.1)", backdropFilter:"blur(64px) saturate(260%)", borderTop:"1px solid rgba(255,255,255,0.14)", display:"flex", zIndex:85 }}>
      {items.map(({id,icon,label})=>(
        <button key={id} onClick={()=>setScreen(id)} style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3,background:"none",border:"none",cursor:"pointer",color:screen===id?"#1A1D26":"#C4C9D4",transition:"all 0.2s",borderTop:screen===id?"2px solid #1A1D26":"2px solid transparent" }}>
          <Icon name={id==="favorites"?(screen===id?"heart":"heartempty"):icon} size={18}/>
          
        </button>
      ))}
    </div>
  );
}

function BgMist({ color="#909090" }) {
  return (
    <div style={{ position:"absolute", inset:0, pointerEvents:"none", zIndex:0, overflow:"hidden" }}>
      <div style={{ position:"absolute", top:"-15%", left:"20%", width:320, height:320, borderRadius:"50%", background:`radial-gradient(circle,rgba(${hexToRgbStr(color)},0.06) 0%,transparent 70%)`, filter:"blur(50px)", animation:"mist 14s ease-in-out infinite" }}/>
      <div style={{ position:"absolute", top:"40%", right:"-10%", width:260, height:260, borderRadius:"50%", background:"radial-gradient(circle,rgba(100,100,100,0.03) 0%,transparent 70%)", filter:"blur(60px)", animation:"mist 18s ease-in-out infinite reverse" }}/>
      <div style={{ position:"absolute", bottom:"20%", left:"-5%", width:200, height:200, borderRadius:"50%", background:"radial-gradient(circle,rgba(100,100,100,0.02) 0%,transparent 70%)", filter:"blur(45px)", animation:"mist 22s ease-in-out infinite" }}/>
    </div>
  );
}

const ToastEl = ({msg}) => (
  <div style={{ position:"fixed", bottom:120, left:"50%", transform:"translateX(-50%)", background:"rgba(20,22,30,0.75)", backdropFilter:"blur(48px) saturate(200%)", color:"#FFFFFF", padding:"10px 20px", borderRadius:24, fontSize:13, zIndex:200, border:"1px solid rgba(255,255,255,0.1)", whiteSpace:"nowrap", fontWeight:600 }}>{msg}</div>
);

// ─── ROOT APP ─────────────────────────────────────────────────────────────────

// ─── ROOT APP — Firebase wired ────────────────────────────────────────────────
export default function App() {
  // ── Auth (login/signup/logout + user profile) ───────────────────────────
  const { firebaseUser, profile, setProfile, loading: authLoading, signUp, logIn, logOut, signInWithGoogle, sendPhoneOTP, verifyPhoneOTP, resetPassword } = useAuth();

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
  const [showRouteBuilder, setShowRouteBuilder] = useState(false);

  // ── Listening Memory — tracks recently played with timestamps ──
  const recentlyPlayedRef = useRef([]); // [{id, genre, energy, timestamp}]
  const sessionStartRef = useRef(null);

  function logTrackPlay(track) {
    const now = Date.now();
    if (!sessionStartRef.current) sessionStartRef.current = now;
    recentlyPlayedRef.current = [
      { id: track.id, genre: track.genre, energy: track.energy || 5, ts: now },
      ...recentlyPlayedRef.current
    ].slice(0, 100); // keep last 100 plays in memory
  }

  // Get genre of last N played tracks for momentum
  function getRecentGenres(n = 3) {
    return recentlyPlayedRef.current.slice(0, n).map(r => r.genre).filter(Boolean);
  }

  // Check if a track was played recently (within hours)
  function wasPlayedRecently(trackId, hoursAgo = 2) {
    const cutoff = Date.now() - hoursAgo * 60 * 60 * 1000;
    return recentlyPlayedRef.current.some(r => r.id === trackId && r.ts > cutoff);
  }

  useEffect(() => { document.title = 'V Music'; }, []);

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
    setCurrent(track); setIsPlaying(true); setProgress(0); setIsRadioMode(false);
    if (q) setQueue(q.filter(t => t.id !== track.id));
    logTrackPlay(track);
    if (firebaseUser) recordPlay(track.id, profile?.recentTracks || []).catch(()=>{});
  };

  const playRadio = () => {
    if (!tracks.length) return;
    const first = pickNextTrack(tracks, null, recentlyPlayedRef.current);
    setCurrent(first); setIsPlaying(true); setProgress(0); setIsRadioMode(true); setQueue([]);
    logTrackPlay(first);
    showToast("V Radio — on air");
    if (firebaseUser) recordPlay(first.id, profile?.recentTracks || []).catch(()=>{});
  };

  // Play a generated route as a queue
  const playRoute = (routeTracks) => {
    if (!routeTracks.length) return;
    const first = routeTracks[0];
    setCurrent(first); setIsPlaying(true); setProgress(0); setIsRadioMode(false);
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
    if (isRadioMode) {
      const next = pickNextTrack(tracks, currentTrack, recentlyPlayedRef.current);
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
      <div style={{ width:60, height:60, borderRadius:15, background:"linear-gradient(135deg, #1A1D26, #C7D0DE)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:16, fontSize:28 }}>🎵</div>
      <div style={{ fontSize:15, color:"#8E8E93" }}>Loading…</div>
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
          <div style={{ width:56, height:56, borderRadius:14, background:"linear-gradient(135deg, #1A1D26, #C7D0DE)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px", overflow:"hidden" }}><BrandGlyph size={40}/></div>
          <div style={{ fontSize:14, color:"#8E8E93" }}>Loading your collection…</div>
        </div>
      )}
      <div style={{ flex:1, overflow:"auto", paddingBottom:currentTrack?120:56, zIndex:1, position:"relative" }}>
        {screen==="home"      && !tracksLoading && <HomeScreen tracks={tracks} onPlayRadio={playRadio} onTogglePlay={()=>setIsPlaying(p=>!p)} onPlayTrack={playTrack} currentTrack={currentTrack} isPlaying={isPlaying} onLike={toggleLike} isRadioMode={isRadioMode} playlistCtx={playlistCtx}/>}
        {screen==="search"    && <SearchScreen query={searchQuery} setQuery={setSearch} results={searchResults} onPlay={t=>playTrack(t,tracks)} onLike={toggleLike} currentTrack={currentTrack} isPlaying={isPlaying} playlistCtx={playlistCtx}/>}
        {screen==="favorites" && <FavoritesScreen tracks={tracks} onPlay={t=>{setIsRadioMode(false);playTrack(t,tracks);}} onLike={toggleLike} currentTrack={currentTrack} isPlaying={isPlaying} userPlaylists={userPlaylists} onCreatePlaylist={createPlaylist} onAddToPlaylist={addToPlaylist} onRemoveFromPlaylist={removeFromPlaylist} onDeletePlaylist={deletePlaylist} playlistCtx={playlistCtx}/>}
        {screen==="profile"   && <ProfileScreen user={user} setUser={setUser} tracks={tracks} onLogout={logOut}/>}
        {screen==="map"       && <HarmonicMap tracks={tracks} onPlay={t=>playTrack(t,tracks)} currentTrack={currentTrack}/>}
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
  const NAV_TOP = [
    { id:"home",      icon:"home",   label:"Home" },
    { id:"favorites", icon:"heart",  label:"Library" },
  ];
  const NAV_BOTTOM = [
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
    <div style={{ display:"flex", height:"100vh", background:(()=>{const h=new Date().getHours();const w=h>=6&&h<=10?1:0;const c=h>=18&&h<=23?1:h>=0&&h<=5?1:0;const center=w?"#FAF8F5":c?"#F3F4F8":"#F7F7F9";const mid=w?"#EDE8E3":c?"#DDDDE4":"#DCDCE0";const edge=w?"#CDC8C3":c?"#C4C5CE":"#C7C8CD";return `radial-gradient(ellipse at 50% 45%, ${center} 0%, ${mid} 40%, ${edge} 100%)`})(), overflow:"hidden", fontFamily:"-apple-system,'SF Pro Display','Helvetica Neue',Arial,sans-serif" }}>

      {/* ── LEFT NAV RAIL ─────────────────────────────────────────────── */}
      <div style={{ width:72, flexShrink:0, background:"rgba(255,255,255,0.12)", backdropFilter:"blur(64px) saturate(240%)", borderRight:"1px solid rgba(255,255,255,0.16)", display:"flex", flexDirection:"column", alignItems:"center", padding:"16px 0 16px" }}>
        {/* Logo */}
        <div style={{ marginBottom:16 }}>
          <BrandGlyph size={28}/>
        </div>

        {/* Top nav: Home, Library, Session */}
        <div style={{ display:"flex", flexDirection:"column", gap:4, alignItems:"center" }}>
          {NAV_TOP.map(item => (
            <button key={item.id} onClick={()=>setScreen(item.id)} title={item.label} style={{
              width:44, height:44, borderRadius:12,
              background:screen===item.id?"rgba(255,255,255,0.25)":"none",
              border:"none", color:screen===item.id?"#1A1D26":"#9CA3AF",
              cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
              transition:"all 0.2s",
            }}>
              <Icon name={item.icon} size={20}/>
            </button>
          ))}
          <button onClick={()=>setShowRouteBuilder(true)} title="Session" style={{
            width:44, height:44, borderRadius:12, background:"none",
            border:"none", color:"#9CA3AF", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
            transition:"all 0.2s",
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 12h4l3-9 4 18 3-9h4"/></svg>
          </button>
          <button onClick={()=>setScreen("map")} title="Map" style={{
            width:44, height:44, borderRadius:12,
            background:screen==="map"?"rgba(255,255,255,0.25)":"none",
            border:"none", color:screen==="map"?"#1A1D26":"#9CA3AF",
            cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
            transition:"all 0.2s",
          }}>
            <Icon name="grid" size={20}/>
          </button>
        </div>

        {/* Spacer */}
        <div style={{ flex:1 }}/>

        {/* Bottom nav: Search, Admin, Avatar */}
        <div style={{ display:"flex", flexDirection:"column", gap:4, alignItems:"center" }}>
          {NAV_BOTTOM.map(item => (
            <button key={item.id} onClick={()=>setScreen(item.id)} title={item.label} style={{
              width:44, height:44, borderRadius:12,
              background:screen===item.id?"rgba(255,255,255,0.25)":"none",
              border:"none", color:screen===item.id?"#1A1D26":"#9CA3AF",
              cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
              transition:"all 0.2s",
            }}>
              <Icon name={item.icon} size={20}/>
            </button>
          ))}
          {firebaseUser?.uid === "5lPAI9N1jkMbVkUyIqLTqBvBf1t1" && (
            <button onClick={()=>setScreen("admin")} title="Admin" style={{
              width:44, height:44, borderRadius:12,
              background:screen==="admin"?"rgba(255,255,255,0.25)":"none",
              border:"none", color:screen==="admin"?"#1A1D26":"#9CA3AF",
              cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
              transition:"all 0.2s",
            }}>
              <Icon name="settings" size={20}/>
            </button>
          )}
          <div style={{ width:32, height:32, borderRadius:"50%", background:"rgba(255,255,255,0.25)", border:"1px solid rgba(255,255,255,0.3)", backdropFilter:"blur(20px)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, cursor:"pointer", marginTop:4 }} onClick={()=>setScreen("profile")} title={user.name}>
            {user.image}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT — full width ─────────────────────────────────── */}
      <div style={{ flex:1, overflow:"auto", position:"relative" }}>
        {/* Accent glow behind content */}
        {currentTrack && <div style={{ position:"absolute", top:0, right:0, width:"40%", height:"30%", background:`radial-gradient(ellipse at 80% 0%, rgba(${glowRgb},0.07) 0%, transparent 70%)`, pointerEvents:"none", zIndex:0 }}/>}
        <div style={{ position:"relative", zIndex:1, maxWidth:960, margin:"0 auto", padding:"24px 32px", paddingBottom:currentTrack?120:24 }}>
          <BgMist color={currentTrack?.color}/>
          {toast && <ToastEl msg={toast}/>}
          {tracksLoading ? (
            <div style={{ textAlign:"center", paddingTop:120 }}>
              <BrandGlyph size={40}/>
              <div style={{ fontSize:14, color:"#9CA3AF", marginTop:12 }}>Loading…</div>
            </div>
          ) : (
            <>
              {screen==="home"      && <HomeScreen tracks={tracks} onPlayRadio={playRadio} onTogglePlay={()=>setIsPlaying(p=>!p)} onPlayTrack={playTrack} currentTrack={currentTrack} isPlaying={isPlaying} onLike={toggleLike} isRadioMode={isRadioMode} playlistCtx={playlistCtx}/>}
              {screen==="search"    && <SearchScreen query={searchQuery} setQuery={setSearch} results={searchResults} onPlay={t=>playTrack(t,tracks)} onLike={toggleLike} currentTrack={currentTrack} isPlaying={isPlaying} playlistCtx={playlistCtx}/>}
              {screen==="favorites" && <FavoritesScreen tracks={tracks} onPlay={t=>{setIsRadioMode(false);playTrack(t,tracks);}} onLike={toggleLike} currentTrack={currentTrack} isPlaying={isPlaying} userPlaylists={userPlaylists} onCreatePlaylist={createPlaylist} onAddToPlaylist={addToPlaylist} onRemoveFromPlaylist={removeFromPlaylist} onDeletePlaylist={deletePlaylist} playlistCtx={playlistCtx}/>}
              {screen==="profile"   && <ProfileScreen user={user} setUser={setUser} tracks={tracks} onLogout={logOut}/>}
              {screen==="map"       && <HarmonicMap tracks={tracks} onPlay={t=>playTrack(t,tracks)} currentTrack={currentTrack}/>}
              {screen==="admin"     && <AdminScreen tracks={tracks} setTracks={setTracks} tab={adminTab} setTab={setAdminTab} editTrack={editTrack} setEditTrack={setEditTrack} showToast={showToast}/>}
            </>
          )}
        </div>
        {/* Desktop mini-player bar */}
        {currentTrack && (
          <div style={{ position:"fixed", bottom:0, left:72, right:320, zIndex:80, padding:"0 16px 12px" }}>
            <div onClick={()=>setExpanded(true)} style={{ background:"rgba(255,255,255,0.12)", backdropFilter:"blur(72px) saturate(260%)", borderRadius:18, padding:"10px 16px", display:"flex", alignItems:"center", gap:12, border:"1px solid rgba(255,255,255,0.22)", boxShadow:`0 8px 32px rgba(0,0,0,0.06), 0 0 40px rgba(${glowRgb},0.06)`, cursor:"pointer" }}>
              <div style={{ width:44, height:44, borderRadius:10, overflow:"hidden", flexShrink:0, boxShadow:`0 2px 12px rgba(${glowRgb},0.2)` }}><AlbumArt track={currentTrack} size={44} borderRadius={0}/></div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:14, fontWeight:600, color:"#1A1D26", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {isRadioMode&&<span style={{ fontSize:9, color:"#1A1D26", fontWeight:700, letterSpacing:1.5, marginRight:8, opacity:0.4 }}>●</span>}
                  {currentTrack.title}
                </div>
                <div style={{ fontSize:12, color:"#9CA3AF" }}>{currentTrack.artist}</div>
              </div>
              {/* "Why this track" pill for radio mode */}
              {isRadioMode && currentTrack.energy && (
                <span style={{ fontSize:9, fontWeight:500, padding:"3px 6px", borderRadius:6, background:"rgba(0,0,0,0.04)", color:"#6B7280", flexShrink:0 }}>{currentTrack.genre||"mix"}</span>
              )}
              <div style={{ width:120, height:2, background:"rgba(0,0,0,0.06)", borderRadius:1, flexShrink:0 }}>
                <div style={{ width:`${duration?((progress/duration)*100):0}%`, height:"100%", background:"#1A1D26", borderRadius:1, transition:"width 1s linear" }}/>
              </div>
              <span style={{ fontSize:11, color:"#9CA3AF", fontVariantNumeric:"tabular-nums", flexShrink:0, width:36 }}>{fmtTime(progress)}</span>
              <button onClick={e=>{e.stopPropagation();onLikeToggle();}} style={{ background:"none",border:"none",cursor:"pointer",color:currentTrack.liked?"#1A1D26":"#C4C9D4",padding:4 }}><Icon name={currentTrack.liked?"heart":"heartempty"} size={16}/></button>
              <button onClick={e=>{e.stopPropagation();setIsPlaying(p=>!p);}} style={{ background:"#1A1D26",border:"none",borderRadius:"50%",width:36,height:36,cursor:"pointer",color:"#FFF",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                <Icon name={isPlaying?"pause":"play"} size={16}/>
              </button>
              <button onClick={e=>{e.stopPropagation();handleSkip();}} style={{ background:"none",border:"none",cursor:"pointer",color:"#9CA3AF",padding:4 }}><Icon name="skip" size={16}/></button>
            </div>
          </div>
        )}
      </div>

      {/* ── RIGHT PANEL ─────────────────────────────────────────────── */}
      <div className="hide-scroll" style={{ width:320, flexShrink:0, background:"rgba(255,255,255,0.08)", backdropFilter:"blur(64px) saturate(240%)", borderLeft:"1px solid rgba(255,255,255,0.1)", display:"flex", flexDirection:"column", overflowY:"auto" }}>

        {/* Now Playing */}
        {currentTrack ? (
          <div style={{ padding:"16px 16px 12px" }}>
            {/* Album art with glow */}
            <div style={{ position:"relative", width:"100%", aspectRatio:"1", borderRadius:16, overflow:"hidden", marginBottom:14, boxShadow:`0 12px 40px rgba(${glowRgb},0.2)` }}>
              <img src={currentTrack.albumCover||"/covers/default.jpg"} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e=>{e.target.src="/covers/default.jpg";}}/>
            </div>
            {/* Track info */}
            <div style={{ fontSize:15, fontWeight:600, color:"#1A1D26", letterSpacing:-0.3, marginBottom:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{currentTrack.title}</div>
            <div style={{ fontSize:12, color:"#6B7280", marginBottom:10, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{currentTrack.artist}</div>
            {/* Metadata pills */}
            <div style={{ display:"flex", gap:4 }}>
              {currentTrack.genre && <span style={{ fontSize:9, fontWeight:500, padding:"3px 8px", borderRadius:6, background:"rgba(0,0,0,0.04)", color:"#6B7280" }}>{currentTrack.genre}</span>}
              {currentTrack.bpm && <span style={{ fontSize:9, fontWeight:500, padding:"3px 8px", borderRadius:6, background:"rgba(0,0,0,0.04)", color:"#9CA3AF" }}>{currentTrack.bpm} bpm</span>}
            </div>
          </div>
        ) : (
          <div style={{ padding:"60px 16px", textAlign:"center" }}>
            <BrandGlyph size={28}/>
          </div>
        )}

        {/* Divider */}
        <div style={{ height:1, background:"rgba(0,0,0,0.04)", margin:"0 16px" }}/>

        {/* Up Next */}
        <div style={{ flex:1, padding:"12px 12px 16px" }}>
          {/* Header with actions */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"4px 4px 10px" }}>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.2, color:"#1A1D26", textTransform:"uppercase" }}>Up Next</div>
            <div style={{ display:"flex", gap:4 }}>
              <button onClick={()=>{const pool=tracks.filter(t=>t.id!==currentTrack?.id&&(t.duration||0)<=900);const shuffled=[...pool];for(let i=shuffled.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];}setQueue(shuffled.slice(0,8));}}
                style={{ background:"rgba(0,0,0,0.03)", border:"none", borderRadius:6, padding:"4px 8px", cursor:"pointer", color:"#9CA3AF", fontSize:9, fontWeight:600, letterSpacing:0.3, transition:"all 0.15s" }}>
                Shuffle
              </button>
              {queue.length > 0 && (
                <button onClick={()=>setQueue([])}
                  style={{ background:"rgba(0,0,0,0.03)", border:"none", borderRadius:6, padding:"4px 8px", cursor:"pointer", color:"#9CA3AF", fontSize:9, fontWeight:600, letterSpacing:0.3 }}>
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
                  background: currentTrack?.id===t.id ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.15)",
                  border: currentTrack?.id===t.id ? "1px solid rgba(255,255,255,0.5)" : "1px solid rgba(255,255,255,0.08)",
                  transition:"all 0.2s" }}>

                {/* Index number */}
                <div style={{ width:16, fontSize:10, fontWeight:500, color:"#9CA3AF", textAlign:"center", flexShrink:0 }}>{i+1}</div>

                {/* Art + info — clickable */}
                <div onClick={()=>playTrack(t,tracks)} style={{ display:"flex", alignItems:"center", gap:8, flex:1, minWidth:0, cursor:"pointer" }}>
                  <div style={{ width:36, height:36, borderRadius:8, overflow:"hidden", flexShrink:0, boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
                    <img src={t.albumCover||"/covers/default.jpg"} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e=>{e.target.src="/covers/default.jpg";}}/>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:500, color:"#1A1D26", letterSpacing:-0.1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.title}</div>
                    <div style={{ fontSize:10, color:"#6B7280", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.artist}</div>
                  </div>
                </div>

                {/* Reorder + delete — shown on all non-radio tracks */}
                {!isRadioMode && (
                  <div style={{ display:"flex", alignItems:"center", gap:2, flexShrink:0 }}>
                    {/* Move up */}
                    <button onClick={e=>{e.stopPropagation(); if(i>0){const nq=[...nextUpTracks];[nq[i-1],nq[i]]=[nq[i],nq[i-1]];setQueue(nq);}}}
                      style={{ background:"none", border:"none", cursor:i>0?"pointer":"default", padding:"2px", opacity:i>0?0.3:0, transition:"opacity 0.15s" }}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#1A1D26" strokeWidth="1.5" strokeLinecap="round"><path d="M3 7L6 4L9 7"/></svg>
                    </button>
                    {/* Move down */}
                    <button onClick={e=>{e.stopPropagation(); if(i<nextUpTracks.length-1){const nq=[...nextUpTracks];[nq[i],nq[i+1]]=[nq[i+1],nq[i]];setQueue(nq);}}}
                      style={{ background:"none", border:"none", cursor:i<nextUpTracks.length-1?"pointer":"default", padding:"2px", opacity:i<nextUpTracks.length-1?0.3:0, transition:"opacity 0.15s" }}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#1A1D26" strokeWidth="1.5" strokeLinecap="round"><path d="M3 5L6 8L9 5"/></svg>
                    </button>
                  </div>
                )}
                {/* Delete */}
                <button onClick={e=>{e.stopPropagation();setQueue(prev=>{const nq=[...nextUpTracks];nq.splice(i,1);return nq;});}}
                  style={{ background:"none", border:"none", cursor:"pointer", padding:"2px", opacity:0.2, transition:"opacity 0.15s", flexShrink:0 }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#1A1D26" strokeWidth="1.5" strokeLinecap="round"><path d="M2.5 2.5L7.5 7.5M7.5 2.5L2.5 7.5"/></svg>
                </button>
              </div>
            ))}
          </div>

          {/* Empty state */}
          {nextUpTracks.length === 0 && (
            <div style={{ textAlign:"center", padding:"32px 0", color:"#9CA3AF", fontSize:12 }}>
              No tracks queued
            </div>
          )}
        </div>
      </div>

      {/* Route Builder Modal */}
      {showRouteBuilder && <RouteBuilderModal tracks={tracks} onClose={()=>setShowRouteBuilder(false)} onPlayRoute={playRoute}/>}

      {/* Expanded NP overlay */}
      {expanded && currentTrack && (
        <div style={{ position:"fixed", inset:0, zIndex:90, overflow:"hidden" }}>
          <div style={{ position:"absolute", inset:0, background:`radial-gradient(ellipse at 50% 20%,rgba(${hexToRgbStr(currentTrack.color)},0.12) 0%,rgba(15,15,18,0.97) 65%)`, backdropFilter:"blur(40px)" }}/>
          <BgMist color={currentTrack.color}/>
          <div style={{ position:"absolute", inset:0, background:"rgba(6,6,8,0.5)" }}/>
          <div style={{ position:"relative", zIndex:1, height:"100%", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:32, gap:20 }}>
            <button onClick={()=>setExpanded(false)} style={{ position:"absolute", top:20, right:20, background:"rgba(255,255,255,0.15)", border:"none", borderRadius:"50%", width:36, height:36, cursor:"pointer", color:"#FFF", backdropFilter:"blur(12px)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Icon name="x" size={18}/>
            </button>
            <VinylRecord track={currentTrack} isPlaying={isPlaying} size={190}/>
            <div style={{ textAlign:"center" }}>
              {isRadioMode&&<div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:6, fontWeight:700 }}>● V Radio</div>}
              <div style={{ fontSize:24, fontWeight:700, letterSpacing:-0.5, color:"#FFF" }}>{currentTrack.title}</div>
              <div style={{ fontSize:15, color:"rgba(255,255,255,0.7)", marginTop:4 }}>{currentTrack.artist}</div>
            </div>
            <div style={{ width:"100%", maxWidth:340 }}>
              <input type="range" min={0} max={duration} value={progress} onChange={e=>handleSeek(+e.target.value)} style={{ width:"100%", accentColor:currentTrack.color }}/>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"rgba(255,255,255,0.4)", marginTop:4 }}>
                <span>{fmtTime(progress)}</span><span>{fmtTime(duration)}</span>
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:28 }}>
              <button onClick={()=>toggleLike(currentTrack.id)} style={{ background:"none",border:"none",cursor:"pointer",color:currentTrack.liked?"#FFF":"rgba(255,255,255,0.4)",padding:4 }}><Icon name={currentTrack.liked?"heart":"heartempty"} size={20}/></button>
              <button onClick={handlePrev} style={CTRL_BTN}><Icon name="prev" size={22}/></button>
              <button onClick={()=>setIsPlaying(p=>!p)} style={{ ...CTRL_BTN,width:56,height:56,background:"rgba(255,255,255,0.15)",backdropFilter:"blur(20px)",border:"1px solid rgba(255,255,255,0.25)",borderRadius:"50%",color:"#FFF" }}>
                <Icon name={isPlaying?"pause":"play"} size={26}/>
              </button>
              <button onClick={handleSkip} style={CTRL_BTN}><Icon name="skip" size={22}/></button>
              <button onClick={()=>setRepeat(r=>!r)} style={{ background:"none",border:"none",cursor:"pointer",color:repeat?"#FFF":"rgba(255,255,255,0.4)",padding:4 }}><Icon name="repeat" size={18}/></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function onLikeToggle() { if(currentTrack) toggleLike(currentTrack.id); }
}

// ─── SHARED STYLES ────────────────────────────────────────────────────────────
const APP_STYLE = {
  background:(()=>{const h=new Date().getHours();const w=h>=6&&h<=10?1:0;const c=h>=18&&h<=23?1:h>=0&&h<=5?1:0;const center=w?"#FAF8F5":c?"#F3F4F8":"#F7F7F9";const mid=w?"#EDE8E3":c?"#DDDDE4":"#DCDCE0";const edge=w?"#CDC8C3":c?"#C4C5CE":"#C7C8CD";return `radial-gradient(ellipse at 50% 45%, ${center} 0%, ${mid} 40%, ${edge} 100%)`})(),
  minHeight:"100vh", height:"100vh", overflow:"hidden",
  fontFamily:"-apple-system,'SF Pro Display','SF Pro Text','Helvetica Neue',Arial,sans-serif",
  color:"#1C1C1E", position:"relative", display:"flex", flexDirection:"column",
  WebkitFontSmoothing:"antialiased", MozOsxFontSmoothing:"grayscale",
};
const INPUT_ST = {
  background:"rgba(255,255,255,0.65)", border:"1px solid rgba(255,255,255,0.7)",
  borderRadius:12, padding:"12px 14px", color:"#1A1D26", fontSize:15,
  boxShadow:"0 1px 3px rgba(0,0,0,0.04)", backdropFilter:"blur(20px)",
  fontFamily:"-apple-system,'SF Pro Text','Helvetica Neue',Arial,sans-serif", width:"100%", display:"block",
};
const BTN_PRIMARY = {
  background:"#1A1D26", color:"#FFFFFF",
  border:"none", borderRadius:12, padding:"13px 20px", fontSize:15, fontWeight:600,
  boxShadow:"0 4px 16px rgba(0,0,0,0.12)",
  fontFamily:"-apple-system,'SF Pro Text','Helvetica Neue',Arial,sans-serif", cursor:"pointer",
};
const BTN_SECONDARY = {
  background:"rgba(255,255,255,0.6)", color:"#6B7280", border:"1px solid rgba(255,255,255,0.5)",
  borderRadius:12, padding:"13px 20px", fontSize:15, fontWeight:500,
  backdropFilter:"blur(20px)",
  fontFamily:"-apple-system,'SF Pro Text','Helvetica Neue',Arial,sans-serif", cursor:"pointer",
};
const CTRL_BTN = {
  background:"none", border:"none", cursor:"pointer", color:"#8E8E93",
  display:"flex", alignItems:"center", justifyContent:"center", padding:8,
};
