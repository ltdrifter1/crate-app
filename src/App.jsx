import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal }                             from "react-dom";
import { useNavigate, useLocation }                 from "react-router-dom";
import { useAuth }                                  from "./useAuth";
import { toggleLike as fbToggleLike, recordPlay, completeOnboarding } from "./useUserData";
import { collection, getDocs, addDoc, query, orderBy, doc, updateDoc, setDoc } from "firebase/firestore";
import { db }                                       from "./firebase";
import {
  font, fontDisplay, fontMono, color, radius, motion, timeOfDayGradient,
  glass, glassControl, homeSpace, sectionRule,
  APP_STYLE, INPUT_ST, BTN_PRIMARY, BTN_SECONDARY, CTRL_BTN, ADMIN_UID,
  BRAND_NAME, BRAND_TAGLINE,
} from "./theme";
import { camelotCompatible, getEnergyRangeForHour, fmtTime, hexToRgbStr } from "./lib/harmony";
import {
  computeHumanState, findResonant, computeSignalTraits, pickNextTrack,
  buildSession, buildRoute, SESSION_PROFILES,
} from "./lib/engine";
import { tracksForMixLane, mixLaneById, MIX_LANES } from "./lib/mixLanes";
import { CANONICAL_GENRES, normalizeGenre } from "./lib/genres";
import { getFloorPhase } from "./lib/club";
import { parsePath, buildPath, documentTitleFor } from "./lib/routes";
import { explainPick, SEARCH_PROMPTS } from "./lib/explain";
import { buildHomeCollections, savedTracks } from "./lib/homeCollections";
import { slugify, findArtist, findAlbum, searchEntities } from "./lib/catalog";
import {
  enrichTracksWithScenes,
  displaySceneLabel,
  trackMatchesScene,
  matchSceneFromText,
} from "./lib/scenes";
import ArtistPage, { AlbumPage } from "./components/catalog/ArtistPage";
import LinerNotesSheet from "./components/catalog/LinerNotesSheet";
import LoginScreen from "./components/auth/LoginScreen";
import BrandMark, { BrandGlyph as DoorGlyph } from "./components/brand/BrandMark";
import BrandTagline from "./components/brand/BrandTagline";

const injectStyles = () => {
  if (document.getElementById("rooms-app-global-styles")) return;
  const s = document.createElement("style");
  s.id = "rooms-app-global-styles";
  s.textContent = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --font: ${font}; --font-display: ${fontDisplay};
      --ink: ${color.ink}; --muted: ${color.muted}; --faint: ${color.faint};
      --line: ${color.line}; --canvas: ${color.canvas}; --accent: ${color.accent};
      --body: ${color.body}; --surface-raised: ${color.surfaceRaised};
      --glass-fill: ${glass.fillStrong}; --glass-border: ${glass.border};
      --glass-blur: ${glass.blur};
    }
    body { font-family: var(--font); background: var(--canvas); color: var(--ink); }
    ::-webkit-scrollbar { width: 4px; height: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.14); border-radius: 4px; }
    button { transition: opacity ${motion.fast}, background ${motion.base}, transform ${motion.fast}, box-shadow ${motion.base}; font-family: var(--font); }
    button:active { opacity: 0.72; }
    button.play-primary:active { transform: scale(0.96); opacity: 0.9; }
    button.glass-control:hover { background: ${glass.fillStrong}; border-color: ${glass.border}; }
    button:focus-visible, input:focus-visible { outline: 2px solid ${color.accent}; outline-offset: 2px; }
    input:focus { outline: none; }
    input[type="range"] { -webkit-appearance: none; height: 3px; background: rgba(255,255,255,0.12); border-radius: 2px; outline: none; cursor: pointer; }
    input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%; background: ${color.accent}; border: none; cursor: pointer; }
    input[type="range"]::-moz-range-thumb { width: 14px; height: 14px; border-radius: 50%; background: ${color.accent}; border: none; cursor: pointer; }
    .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
    .hide-scroll::-webkit-scrollbar { display: none; }
    .glass-surface {
      background: ${glass.fillStrong};
      border: 1px solid ${glass.borderSoft};
      box-shadow: inset 0 1px 0 ${glass.highlight}, ${glass.shadowSoft};
      -webkit-backdrop-filter: ${glass.blur};
      backdrop-filter: ${glass.blur};
    }
    @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }
    @keyframes pulse-ring { 0%{transform:scale(1);opacity:0.3} 100%{transform:scale(1.5);opacity:0} }
    @keyframes breathe { 0%,100%{opacity:0.55} 50%{opacity:1} }
    @keyframes rise { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }
    @keyframes fadeIn { from{opacity:0} to{opacity:1} }
    @keyframes shimmer { 0%{opacity:0.35} 50%{opacity:0.7} 100%{opacity:0.35} }
    @keyframes stationIn { from{opacity:0;transform:translateY(18px) scale(0.985)} to{opacity:1;transform:none} }
    @keyframes roomEnter { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }
    @keyframes trackSwap { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:none} }
    @keyframes dialArc {
      from { stroke-dashoffset: 92; opacity: 0.55; }
      to { stroke-dashoffset: 28; opacity: 1; }
    }
    @keyframes markIn {
      from { opacity: 0; transform: scale(0.92); }
      to { opacity: 1; transform: none; }
    }
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
    }
    @media (prefers-reduced-transparency: reduce) {
      .glass-surface, .glass-control {
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
        background: ${color.surfaceSolid} !important;
      }
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
          background: i < level ? color.accent : "rgba(255,255,255,0.12)",
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
    door:       <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="square" strokeLinejoin="miter"><path d="M6 4h12v16H6z"/><path d="M9 7h5.2l1.3 10H9z"/><circle cx="13.2" cy="12" r="0.9" fill="currentColor" stroke="none"/></svg>,
    dig:        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M4 8h16v3H4z"/><path d="M5 11h14v3H5z"/><path d="M6 14h12v3H6z"/><path d="M8 6l2-2h4l2 2"/></svg>,
    map:        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"><path d="M12 3l7 4v10l-7 4-7-4V7l7-4z"/><path d="M12 8v8M9 10.5h6"/></svg>,
    drift:      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 3c2 4 2 8 0 12s-2 8 0 12" opacity="0.5"/><path d="M3 12c4-2 8-2 12 0s8 2 12 0" opacity="0.5"/></svg>,
    grid:       <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><circle cx="5" cy="7" r="2"/><circle cx="19" cy="7" r="2"/><circle cx="5" cy="17" r="2"/><circle cx="19" cy="17" r="2"/><path d="M7 8l3 3M17 8l-3 3M7 16l3-3M17 16l-3-3"/></svg>,
    x:          <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>,
    edit:       <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>,
    trash:      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>,
    chev_up:    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 15l-6-6-6 6"/></svg>,
    chev_down:  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>,
    queue:      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h10"/><circle cx="18" cy="18" r="2" fill="currentColor" stroke="none"/></svg>,
    volume:     <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M3 10v4h4l5 5V5L7 10H3zm13.5 2c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>,
    hypno:      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/></svg>,
    // Session Dial — length (arc) + vibe (playlist bars). Key feature mark.
    timedmix:   <TimedMixMark size={size} />,
  };
  return icons[name] || null;
};

/** Custom mark for timed playlist builder — duration dial + track bars. */
function TimedMixMark({ size = 28, accent = color.accent }) {
  const r = 9.2;
  const c = 2 * Math.PI * r;
  const arc = c * 0.72;
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      {/* Quiet dial track */}
      <circle cx="16" cy="16" r={r} stroke="rgba(255,255,255,0.16)" strokeWidth="1.6"/>
      {/* Length arc — accent segment */}
      <circle
        cx="16" cy="16" r={r}
        stroke={accent}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeDasharray={`${arc} ${c}`}
        strokeDashoffset={28}
        transform="rotate(-95 16 16)"
        style={{ animation: "dialArc 1.1s cubic-bezier(0.22,1,0.36,1) both" }}
      />
      {/* Vibe bars — a short playlist inside the dial */}
      <rect x="10.2" y="12.1" width="11.6" height="1.7" rx="0.85" fill="rgba(255,255,255,0.88)"/>
      <rect x="10.2" y="15.15" width="8.4" height="1.7" rx="0.85" fill="rgba(255,255,255,0.55)"/>
      <rect x="10.2" y="18.2" width="5.6" height="1.7" rx="0.85" fill={accent}/>
    </svg>
  );
}

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

// ─── Booth HUD — BPM / key / energy ───────────────────────────────────────────
function BoothHud({ track, size = "md", align = "left" }) {
  if (!track) return null;
  const bpm = track.bpm ? String(track.bpm) : "—";
  const key = track.camelot || "—";
  const energy = track.energy != null ? String(track.energy) : "—";
  const big = size === "lg";
  const compact = size === "sm";
  if (compact) {
    return (
      <div style={{
        fontFamily: fontMono, fontVariantNumeric:"tabular-nums",
        fontSize:10, letterSpacing:0.6, color: color.accent, fontWeight:600,
      }}>
        {bpm}<span style={{ color: color.faint }}> BPM</span>
        <span style={{ color: color.faint }}>  ·  </span>
        {key}
        <span style={{ color: color.faint }}>  ·  E</span>{energy}
      </div>
    );
  }
  const cells = [
    { label: "BPM", value: bpm },
    { label: "KEY", value: key },
    { label: "NRG", value: energy },
  ];
  return (
    <div style={{
      display:"flex", gap: big ? 22 : 14,
      justifyContent: align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start",
      fontFamily: fontMono, fontVariantNumeric:"tabular-nums",
    }}>
      {cells.map(c => (
        <div key={c.label} style={{ textAlign: align === "right" ? "right" : "left" }}>
          <div style={{
            fontSize: big ? 10 : 9, letterSpacing:1.6, color: color.faint,
            textTransform:"uppercase", marginBottom:4, fontWeight:600,
          }}>{c.label}</div>
          <div style={{
            fontSize: big ? 28 : 15, fontWeight:600, color: color.accent,
            letterSpacing: big ? -0.5 : 0, lineHeight:1,
          }}>{c.value}</div>
        </div>
      ))}
    </div>
  );
}

// ─── RADIO — Listen Now hero (one composition) ────────────────────────────────
function MixLanePicker({ mixLane, onMixLaneChange, disabled = false }) {
  return (
    <div
      role="radiogroup"
      aria-label="Choose a mix"
      onClick={(e) => e.stopPropagation()}
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 18,
      }}
    >
      {MIX_LANES.map((lane) => {
        const on = mixLane === lane.id;
        return (
          <button
            key={lane.id}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={disabled}
            onClick={() => onMixLaneChange(lane.id)}
            style={{
              padding: "8px 14px",
              borderRadius: 980,
              border: `1px solid ${on ? color.accent : color.line}`,
              background: on ? color.accentSoft : "rgba(0,0,0,0.35)",
              color: on ? color.accent : color.onDarkMuted,
              fontSize: 13,
              fontWeight: on ? 650 : 500,
              cursor: disabled ? "default" : "pointer",
              fontFamily: font,
              letterSpacing: 0.2,
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}
          >
            {lane.label}
          </button>
        );
      })}
    </div>
  );
}

function DeepCutsCard({
  onPlay, onTogglePlay, currentTrack, isPlaying, isRadioMode, signalLabel,
  featuredTrack = null, mixLane, onMixLaneChange,
}) {
  const live = isRadioMode && currentTrack;
  const artTrack = live ? currentTrack : (featuredTrack || currentTrack);
  const cover = artTrack?.albumCover;

  return (
    <div
      onClick={live ? undefined : onPlay}
      role={live ? undefined : "button"}
      style={{
        position: "relative",
        minHeight: "min(72vh, 580px)",
        padding: "0",
        cursor: live ? "default" : "pointer",
        background: color.canvas,
        overflow: "hidden",
        animation: "stationIn 0.75s cubic-bezier(0.22,1,0.36,1) both",
      }}
    >
      {/* Full-bleed artwork plane */}
      <div aria-hidden="true" style={{ position: "absolute", inset: 0 }}>
        {cover ? (
          <img
            src={cover}
            alt=""
            style={{
              width: "100%", height: "100%", objectFit: "cover",
              transform: "scale(1.04)",
              filter: live ? "saturate(1.05)" : "saturate(1.08) brightness(0.92)",
            }}
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", background: timeOfDayGradient() }} />
        )}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.42) 36%, rgba(0,0,0,0.82) 72%, #000 100%)",
        }}/>
        {/* Soft glass veil at the hero foot — bridges into the library plane */}
        <div aria-hidden="true" style={{
          position: "absolute", left: 0, right: 0, bottom: 0, height: 120,
          background: "linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.03) 55%, rgba(0,0,0,0.55) 100%)",
          borderBottom: `1px solid ${glass.borderFaint}`,
        }}/>
      </div>

      <div style={{
        position: "relative", zIndex: 1,
        minHeight: "min(72vh, 580px)",
        display: "flex", flexDirection: "column",
        justifyContent: "flex-end",
        padding: `36px ${homeSpace.gutter}px 64px`,
        maxWidth: 520,
      }}>
        <div style={{
          fontSize: "clamp(42px, 11vw, 56px)",
          fontWeight: 700, letterSpacing: -1.8, lineHeight: 0.95,
          color: color.onDark, fontFamily: fontDisplay,
          marginBottom: 12,
        }}>
          {BRAND_NAME}
        </div>
        {!live ? (
          <BrandTagline light style={{ marginBottom: 16 }} />
        ) : (
          <div style={{
            fontSize: 16, color: color.onDarkMuted, marginBottom: 16,
            lineHeight: 1.45, maxWidth: 320, fontWeight: 500,
          }}>
            {`${currentTrack.title} · ${currentTrack.artist}`}
          </div>
        )}

        <MixLanePicker
          mixLane={mixLane}
          onMixLaneChange={onMixLaneChange}
          disabled={live}
        />

        {live ? (
          <div style={{ display: "flex", alignItems: "center", gap: 14 }} onClick={(e) => e.stopPropagation()}>
            <button type="button" className="play-primary" aria-label={isPlaying ? "Pause" : "Play"}
              onClick={onTogglePlay}
              style={{
                width: 56, height: 56, borderRadius: 28, background: color.accent, border: "none",
                display: "flex", alignItems: "center", justifyContent: "center", color: color.onAccent,
                cursor: "pointer", flexShrink: 0,
                boxShadow: "0 10px 28px rgba(0,0,0,0.35)",
              }}>
              <Icon name={isPlaying ? "pause" : "play"} size={20}/>
            </button>
            {signalLabel && (
              <div className="glass-surface" style={{
                fontSize: 13, color: color.ink, fontWeight: 500,
                padding: "8px 12px", borderRadius: 980,
              }}>{signalLabel}</div>
            )}
            <div className="glass-surface" style={{
              fontSize: 12, color: color.body, fontWeight: 600,
              padding: "8px 12px", borderRadius: 980, letterSpacing: 0.3,
            }}>
              {mixLaneById(mixLane).label} mix
            </div>
          </div>
        ) : (
          <button type="button" className="play-primary" aria-label="Play" onClick={(e) => { e.stopPropagation(); onPlay(); }}
            style={{
              display: "inline-flex", alignItems: "center", gap: 10, alignSelf: "flex-start",
              padding: "14px 26px", borderRadius: 980,
              background: color.accent, border: "none", color: color.onAccent,
              cursor: "pointer", fontSize: 17, fontWeight: 600, letterSpacing: -0.2,
              boxShadow: "0 10px 28px rgba(0,0,0,0.35)",
            }}>
            <Icon name="play" size={16}/>
            Play {mixLaneById(mixLane).label}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── PLAYLIST MENU CONTEXT ────────────────────────────────────────────────────
// Passed down so every track surface can add/remove playlists
const PlaylistCtx = {
  playlists: [],
  onCreate: () => {},
  onAdd: () => {},
  onRemove: () => {},
  onToast: () => {},
  onResonance: null,
  onLike: null,
};

function clampMenuPos(x, y, w = 240, h = 320) {
  const pad = 8;
  const left = Math.max(pad, Math.min(x, (typeof window !== "undefined" ? window.innerWidth : 400) - w - pad));
  const top = Math.max(pad, Math.min(y, (typeof window !== "undefined" ? window.innerHeight : 700) - h - pad));
  return { left, top };
}

/** Spotify/iTunes-style track menu — ⋯ or right-click. Portaled so it never clips. */
function TrackActionsMenu({ track, playlistCtx, activePlaylistId, x, y, onClose }) {
  const ctx = playlistCtx || PlaylistCtx;
  const [newPlName, setNewPlName] = useState("");
  const [showNewPl, setShowNewPl] = useState(false);
  const menuRef = useRef(null);
  const pos = clampMenuPos(x, y);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    const onDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [onClose]);

  function inPlaylist(pl) {
    return (pl.trackIds || []).includes(track.id);
  }

  function handleTogglePlaylist(pl) {
    if (inPlaylist(pl)) {
      ctx.onRemove(track.id, pl.id);
    } else {
      ctx.onAdd(track.id, pl.id);
    }
    onClose();
  }

  function handleCreateAndAdd() {
    if (!newPlName.trim()) return;
    ctx.onCreate(newPlName.trim(), track.id);
    setNewPlName("");
    setShowNewPl(false);
    onClose();
  }

  const menu = (
    <div
      ref={menuRef}
      role="menu"
      aria-label="Track actions"
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
      style={{
        position: "fixed",
        left: pos.left,
        top: pos.top,
        zIndex: 400,
        background: "rgba(28,28,30,0.82)",
        border: `1px solid ${glass.border}`,
        borderRadius: radius.md,
        padding: "6px 0",
        minWidth: 220,
        maxWidth: 280,
        maxHeight: "min(70vh, 420px)",
        overflowY: "auto",
        boxShadow: `inset 0 1px 0 ${glass.highlight}, 0 20px 48px rgba(0,0,0,0.55)`,
        backdropFilter: glass.blur,
        WebkitBackdropFilter: glass.blur,
        animation: "fadeIn 0.12s ease both",
      }}
    >
      <div style={{ padding: "8px 14px 10px", borderBottom: `1px solid ${glass.borderFaint}` }}>
        <div style={{ fontSize: 13, fontWeight: 650, color: color.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: fontDisplay }}>
          {track.title}
        </div>
        <div style={{ fontSize: 11, color: color.muted, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {track.artist}
        </div>
      </div>

      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, color: color.faint, padding: "10px 14px 4px", textTransform: "uppercase", fontFamily: fontMono }}>
        Add to playlist
      </div>

      {ctx.playlists.length === 0 && !showNewPl && (
        <div style={{ fontSize: 13, color: color.muted, padding: "8px 14px 4px" }}>
          No playlists yet — create one below.
        </div>
      )}

      {ctx.playlists.map((pl) => {
        const has = inPlaylist(pl);
        return (
          <button
            key={pl.id}
            type="button"
            role="menuitem"
            onClick={() => handleTogglePlaylist(pl)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
              width: "100%", textAlign: "left", background: "none", border: "none",
              color: color.ink, fontSize: 14, padding: "10px 14px", cursor: "pointer",
            }}
          >
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pl.name}</span>
            <span style={{
              flexShrink: 0, fontSize: 12, fontFamily: fontMono,
              color: has ? color.accent : color.faint,
            }}>
              {has ? "✓" : "+"}
            </span>
          </button>
        );
      })}

      <div style={{ height: 1, background: color.line, margin: "4px 14px" }} />

      {showNewPl ? (
        <div style={{ padding: "8px 12px" }}>
          <input
            autoFocus
            value={newPlName}
            onChange={(e) => setNewPlName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateAndAdd();
              if (e.key === "Escape") setShowNewPl(false);
            }}
            placeholder="Playlist name…"
            style={{ ...INPUT_ST, marginBottom: 6, padding: "8px 10px", fontSize: 13 }}
          />
          <div style={{ display: "flex", gap: 6 }}>
            <button type="button" onClick={handleCreateAndAdd} style={{ flex: 1, background: color.accent, border: "none", borderRadius: radius.sm, color: color.onAccent, fontSize: 13, fontWeight: 600, padding: "8px 0", cursor: "pointer" }}>
              Create
            </button>
            <button type="button" onClick={() => setShowNewPl(false)} style={{ flex: 1, background: "transparent", border: `1px solid ${color.line}`, borderRadius: radius.sm, color: color.muted, fontSize: 13, padding: "8px 0", cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          role="menuitem"
          onClick={() => setShowNewPl(true)}
          style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left", background: "none", border: "none", color: color.ink, fontSize: 14, padding: "10px 14px", cursor: "pointer", fontWeight: 500 }}
        >
          <Icon name="plus" size={14} /> New playlist
        </button>
      )}

      {ctx.onLike && (
        <>
          <div style={{ height: 1, background: color.line, margin: "4px 14px" }} />
          <button
            type="button"
            role="menuitem"
            onClick={() => { ctx.onLike(track.id); onClose(); }}
            style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", color: color.ink, fontSize: 14, padding: "10px 14px", cursor: "pointer" }}
          >
            {track.liked ? "Remove from Saved" : "Save track"}
          </button>
        </>
      )}

      {(ctx.onOpenArtist || ctx.onOpenAlbum) && (
        <>
          <div style={{ height: 1, background: color.line, margin: "4px 14px" }} />
          {ctx.onOpenArtist && track.artist && (
            <button
              type="button"
              role="menuitem"
              onClick={() => { ctx.onOpenArtist(track.artist); onClose(); }}
              style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", color: color.ink, fontSize: 14, padding: "10px 14px", cursor: "pointer" }}
            >
              View artist
            </button>
          )}
          {ctx.onOpenAlbum && track.album && (
            <button
              type="button"
              role="menuitem"
              onClick={() => { ctx.onOpenAlbum(track); onClose(); }}
              style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", color: color.ink, fontSize: 14, padding: "10px 14px", cursor: "pointer" }}
            >
              View album
            </button>
          )}
        </>
      )}

      {ctx.onResonance && (
        <button
          type="button"
          role="menuitem"
          onClick={() => { ctx.onResonance(track); onClose(); }}
          style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", color: color.ink, fontSize: 14, padding: "10px 14px", cursor: "pointer" }}
        >
          Find similar
        </button>
      )}

      {ctx.onHypnoRadio && (
        <button
          type="button"
          role="menuitem"
          onClick={() => { ctx.onHypnoRadio(track); onClose(); }}
          style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", color: color.ink, fontSize: 14, padding: "10px 14px", cursor: "pointer" }}
        >
          Play similar mix
        </button>
      )}

      {activePlaylistId && activePlaylistId !== "liked" && (
        <>
          <div style={{ height: 1, background: color.line, margin: "4px 14px" }} />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              ctx.onRemove(track.id, activePlaylistId);
              onClose();
            }}
            style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", color: color.alert, fontSize: 14, padding: "10px 14px", cursor: "pointer" }}
          >
            Remove from this playlist
          </button>
        </>
      )}
    </div>
  );

  return createPortal(menu, document.body);
}

function useTrackMenu() {
  const [menu, setMenu] = useState(null); // { track, x, y, activePlaylistId } | null
  const openAt = useCallback((track, x, y, activePlaylistId = null) => {
    setMenu({ track, x, y, activePlaylistId });
  }, []);
  const openFromButton = useCallback((e, track, activePlaylistId = null) => {
    e.preventDefault();
    e.stopPropagation();
    const r = e.currentTarget.getBoundingClientRect();
    openAt(track, r.right - 220, r.bottom + 4, activePlaylistId);
  }, [openAt]);
  const openFromContext = useCallback((e, track, activePlaylistId = null) => {
    e.preventDefault();
    e.stopPropagation();
    openAt(track, e.clientX, e.clientY, activePlaylistId);
  }, [openAt]);
  const close = useCallback(() => setMenu(null), []);
  return { menu, openFromButton, openFromContext, close };
}

function TrackMoreButton({ onClick, size = 18 }) {
  return (
    <button
      type="button"
      aria-label="More"
      aria-haspopup="menu"
      onClick={onClick}
      style={{
        background: "none", border: "none", cursor: "pointer",
        color: color.faint, padding: "4px 6px", fontSize: size, lineHeight: 1, flexShrink: 0,
      }}
    >
      ⋯
    </button>
  );
}

// ─── TRACK ROW ────────────────────────────────────────────────────────────────
function TrackRow({ track, onPlay, active, isPlaying, onLike, extraAction, playlistCtx, activePlaylistId }) {
  const { menu, openFromButton, openFromContext, close } = useTrackMenu();

  return (
    <div style={{ position: "relative" }}>
      <div
        role="button"
        tabIndex={0}
        onClick={onPlay}
        onContextMenu={(e) => openFromContext(e, track, activePlaylistId)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPlay(); } }}
        style={{
          display: "flex", alignItems: "center", gap: 12, padding: "10px 8px", borderRadius: radius.sm,
          cursor: "pointer", marginBottom: 1,
          background: active ? color.accentSoft : "transparent",
        }}
      >
        <div style={{ width: 44, height: 44, borderRadius: 9, overflow: "hidden", flexShrink: 0, position: "relative" }}>
          <AlbumArt track={track} size={44} borderRadius={0} />
          {active && isPlaying && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: color.accent, animation: "pulse 1.2s ease-in-out infinite" }} />
            </div>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: active ? 600 : 500, letterSpacing: -0.15, color: active ? color.accent : color.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track.title}</div>
          <div style={{ fontSize: 12, color: color.muted, marginTop: 2 }}>{track.artist}{displaySceneLabel(track) ? ` · ${displaySceneLabel(track)}` : (normalizeGenre(track.genre) ? ` · ${normalizeGenre(track.genre)}` : "")}</div>
        </div>
        {onLike && (
          <button type="button" aria-label={track.liked ? "Unlike" : "Like"} onClick={(e) => { e.stopPropagation(); onLike(track.id); }}
            style={{ background: "none", border: "none", cursor: "pointer", color: track.liked ? color.accent : color.faint, padding: 6 }}>
            <Icon name={track.liked ? "heart" : "heartempty"} size={16} />
          </button>
        )}
        <TrackMoreButton onClick={(e) => openFromButton(e, track, activePlaylistId)} />
        {extraAction || null}
      </div>

      {menu && (
        <TrackActionsMenu
          track={menu.track}
          playlistCtx={playlistCtx}
          activePlaylistId={menu.activePlaylistId}
          x={menu.x}
          y={menu.y}
          onClose={close}
        />
      )}
    </div>
  );
}

const SectionLabel = ({ children, style={} }) => (
  <div style={{ fontSize:13, fontWeight:650, letterSpacing:-0.2, color: color.ink, marginBottom:12, fontFamily: fontDisplay, ...style }}>{children}</div>
);

function BrandGlyph({ size = 40, light = false, showWordmark }) {
  // Compact chrome: door glyph only. Larger moments keep the wordmark.
  const withWord = showWordmark ?? size >= 36;
  return <BrandMark size={size} light={light} showWordmark={withWord} />;
}

// ─── SESSION BUILDER — pick a length + vibe → get a playlist ─────────────────
function SessionBuilderModal({ tracks, onClose, onPlayRoute }) {
  const [step, setStep] = useState(1); // 1 duration · 2 vibe · 3 preview
  const [duration, setDuration] = useState(60);
  const [activity, setActivity] = useState(null);
  const [session, setSession] = useState(null);

  const activities = Object.entries(SESSION_PROFILES);
  const profile = activity ? SESSION_PROFILES[activity] : null;
  const totalMins = session ? Math.round(session.reduce((s, t) => s + (t.duration || 210), 0) / 60) : 0;

  const phases = session ? (() => {
    const groups = [];
    let current = null;
    session.forEach((t) => {
      if (!current || current.name !== t._phase) {
        current = { name: t._phase, tracks: [] };
        groups.push(current);
      }
      current.tracks.push(t);
    });
    return groups;
  })() : [];

  function handleGenerate(act) {
    setActivity(act);
    setSession(buildSession(tracks, duration, act));
    setStep(3);
  }

  function handleRegenerate() {
    if (!activity) return;
    setSession(buildSession(tracks, duration, activity));
  }

  const durationLabel = duration < 60 ? `${duration} min` : duration === 60 ? "1 hour" : `${duration / 60} hours`;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, overflow: "hidden" }}>
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(180deg, #0A0A0A 0%, #000 55%, #000 100%)",
      }}/>
      {session?.[0]?.albumCover && (
        <div aria-hidden="true" style={{
          position: "absolute", inset: 0, opacity: 0.22,
          backgroundImage: `url(${session[0].albumCover})`,
          backgroundSize: "cover", backgroundPosition: "center",
          filter: "blur(48px) saturate(1.15)", transform: "scale(1.08)",
        }}/>
      )}
      <div aria-hidden="true" style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.82) 55%, #000 100%)",
      }}/>

      <div className="hide-scroll" style={{
        position: "relative", zIndex: 1, height: "100%", overflowY: "auto",
        display: "flex", flexDirection: "column",
      }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "20px 20px 8px", flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {step > 1 && (
              <button type="button" onClick={() => {
                if (step === 3) { setSession(null); setStep(2); }
                else setStep(1);
              }} style={{
                background: "none", border: "none", color: color.accent,
                fontSize: 17, fontWeight: 500, cursor: "pointer", padding: "6px 0",
              }}>‹ Back</button>
            )}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" style={{
            background: color.surfaceRaised, border: "none", borderRadius: 980,
            width: 36, height: 36, cursor: "pointer", color: color.muted,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon name="x" size={16}/>
          </button>
        </div>

        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: step === 3 ? "flex-start" : "center",
          padding: "12px 20px 40px", maxWidth: 520, margin: "0 auto", width: "100%",
        }}>

          {step === 1 && (
            <div style={{ width: "100%", textAlign: "center", animation: "rise 0.45s cubic-bezier(0.22,1,0.36,1) both" }}>
              <div style={{
                fontSize: 34, fontWeight: 700, color: color.ink, letterSpacing: -1,
                marginBottom: 10, fontFamily: fontDisplay,
              }}>How long?</div>
              <div style={{ fontSize: 16, color: color.body, marginBottom: 36, lineHeight: 1.45 }}>
                We’ll build a playlist that fits the time.
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 40, flexWrap: "wrap" }}>
                {[
                  { m: 30, label: "30 min" },
                  { m: 60, label: "1 hour" },
                  { m: 120, label: "2 hours" },
                  { m: 240, label: "4 hours" },
                  { m: 480, label: "All night" },
                ].map(({ m, label }) => (
                  <button type="button" key={m} onClick={() => setDuration(m)} style={{
                    minWidth: 88, height: 56, padding: "0 16px", borderRadius: 980,
                    border: duration === m ? "none" : `1px solid ${color.lineStrong}`,
                    background: duration === m ? color.accent : "transparent",
                    color: duration === m ? color.onAccent : color.body,
                    fontSize: 15, fontWeight: 600, cursor: "pointer",
                  }}>
                    {label}
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => setStep(2)} style={{
                ...BTN_PRIMARY, width: "auto", minWidth: 200, borderRadius: 980, padding: "16px 36px",
              }}>
                Continue
              </button>
            </div>
          )}

          {step === 2 && (
            <div style={{ width: "100%", textAlign: "center", animation: "rise 0.45s cubic-bezier(0.22,1,0.36,1) both" }}>
              <div style={{
                fontSize: 34, fontWeight: 700, color: color.ink, letterSpacing: -1,
                marginBottom: 8, fontFamily: fontDisplay,
              }}>What’s the vibe?</div>
              <div style={{ fontSize: 16, color: color.body, marginBottom: 28 }}>
                {durationLabel} playlist
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, textAlign: "left" }}>
                {activities.map(([id, prof]) => (
                  <button type="button" key={id} onClick={() => handleGenerate(id)} style={{
                    padding: "16px 16px", borderRadius: 16,
                    border: `1px solid ${color.line}`,
                    background: color.surfaceSolid, cursor: "pointer", textAlign: "left",
                  }}>
                    <div style={{
                      fontSize: 17, fontWeight: 650, color: color.ink,
                      letterSpacing: -0.2, marginBottom: 6, fontFamily: fontDisplay,
                    }}>{prof.label}</div>
                    <div style={{ fontSize: 12, color: color.muted, lineHeight: 1.4 }}>
                      {prof.blurb}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && session && profile && (
            <div style={{ width: "100%", animation: "rise 0.45s cubic-bezier(0.22,1,0.36,1) both" }}>
              <div style={{ textAlign: "center", marginBottom: 28, paddingTop: 8 }}>
                <div style={{
                  fontSize: 13, fontWeight: 600, color: color.accent, marginBottom: 8,
                }}>
                  {profile.label} · {durationLabel}
                </div>
                <div style={{
                  fontSize: 32, fontWeight: 700, color: color.ink, letterSpacing: -0.8,
                  marginBottom: 6, fontFamily: fontDisplay,
                }}>
                  Your playlist is ready
                </div>
                <div style={{ fontSize: 15, color: color.body }}>
                  {session.length} songs · about {totalMins} minutes
                </div>
              </div>

              <div style={{ marginBottom: 24, padding: "0 4px" }}>
                <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", height: 6, marginBottom: 8, background: color.surface }}>
                  {profile.phases.map((ph, i) => (
                    <div key={i} style={{ flex: ph.p, background: i % 2 ? color.accent : color.accentSoft }}/>
                  ))}
                </div>
                <div style={{ display: "flex" }}>
                  {profile.phases.map((ph, i) => (
                    <div key={i} style={{ flex: ph.p, textAlign: "center" }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: color.faint }}>{ph.name}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{
                maxHeight: "42vh", overflowY: "auto", marginBottom: 24, borderRadius: 16,
                background: color.surfaceSolid, border: `1px solid ${color.line}`, padding: "8px 0",
              }}>
                {phases.map((phase, pi) => (
                  <div key={pi}>
                    <div style={{
                      fontSize: 11, fontWeight: 700, letterSpacing: 0.4, color: color.faint,
                      textTransform: "uppercase", padding: "12px 16px 6px",
                    }}>{phase.name}</div>
                    {phase.tracks.map((t) => (
                      <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 16px" }}>
                        <div style={{ width: 36, height: 36, borderRadius: 6, overflow: "hidden", flexShrink: 0 }}>
                          <AlbumArt track={t} size={36} borderRadius={6}/>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: 14, fontWeight: 550, color: color.ink,
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          }}>{t.title}</div>
                          <div style={{ fontSize: 12, color: color.muted }}>{t.artist}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <button type="button" onClick={() => {
                  const cleaned = session.map((t) => { const { _phase, ...rest } = t; return rest; });
                  onPlayRoute(cleaned, "night");
                  onClose();
                }} style={{
                  ...BTN_PRIMARY, flex: 1, maxWidth: 280, borderRadius: 980, padding: "16px 28px",
                }}>
                  Start listening
                </button>
                <button type="button" onClick={handleRegenerate} aria-label="Shuffle again" style={{
                  width: 52, height: 52, borderRadius: 980, background: color.surfaceRaised,
                  border: "none", color: color.body, fontSize: 18, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
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
            <div style={{ fontSize:11, fontWeight:600, color: color.ink }}>{hover.title}</div>
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
      <div style={{ position:"absolute", inset:0, background:`radial-gradient(ellipse at 50% 20%, rgba(${rgb},0.12) 0%, ${color.canvas} 58%)` }} onClick={onClose}/>
      <div style={{ position:"relative", zIndex:1, maxWidth:520, margin:"0 auto", padding:"40px 24px 56px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:28 }}>
          <div style={{ width:72, height:72, overflow:"hidden", flexShrink:0, boxShadow:`0 12px 32px rgba(${rgb},0.22)` }}>
            <AlbumArt track={sourceTrack} size={72} borderRadius={0}/>
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:12, fontWeight:700, letterSpacing:0.4, color: color.accent, marginBottom:6 }}>Similar songs</div>
            <div style={{ fontSize:20, fontWeight:750, color: color.ink, letterSpacing:-0.4, fontFamily: fontDisplay, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{sourceTrack.title}</div>
            <div style={{ fontSize:13, color: color.muted, marginTop:4 }}>{sourceTrack.artist} · tracks that feel like this</div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" style={{ background: color.surface, border:`1px solid ${color.lineStrong}`, borderRadius:"50%", width:36, height:36, cursor:"pointer", color: color.muted, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Icon name="x" size={16}/>
          </button>
        </div>

        {sourceTrack._signal && (
          <div style={{ display:"flex", gap:20, marginBottom:28, justifyContent:"flex-start", paddingBottom:20, borderBottom:`1px solid ${color.line}` }}>
            {["grip","hold","pull","lift"].map(k => (
              <div key={k}>
                <div style={{ fontSize:18, fontWeight:700, color: color.ink, fontFamily: fontDisplay }}>{sourceTrack._signal[k]}</div>
                <div style={{ fontSize:9, fontWeight:700, letterSpacing:1.4, color: color.faint, textTransform:"uppercase", fontFamily: fontMono, marginTop:2 }}>{k}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display:"flex", flexDirection:"column" }}>
          {similar.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => { onPlay(t); onClose(); }}
              style={{
                display:"flex", alignItems:"center", gap:14, width:"100%",
                padding:"12px 0", background:"none", border:"none",
                borderBottom:`1px solid ${color.line}`, cursor:"pointer", textAlign:"left",
              }}
            >
              <div style={{ width:52, height:52, overflow:"hidden", flexShrink:0 }}>
                <AlbumArt track={t} size={52} borderRadius={0}/>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:14, fontWeight:650, color: color.ink, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontFamily: fontDisplay, letterSpacing:-0.2 }}>{t.title}</div>
                <div style={{ fontSize:12, color: color.muted, marginTop:2 }}>{t.artist}{t._signal?.label ? ` · ${t._signal.label}` : ""}</div>
              </div>
            </button>
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

  const width = 320;
  const height = 60;
  const step = width / Math.max(energies.length - 1, 1);
  const points = energies.map((e, i) => `${i * step},${height - ((e - 1) / 9) * height}`).join(" ");

  return (
    <div style={{ position:"fixed", inset:0, zIndex:95, display:"flex", alignItems:"center", justifyContent:"center", padding:32 }}>
      <div style={{ position:"absolute", inset:0, background:"rgba(12,11,10,0.88)" }} onClick={onClose}/>
      <div style={{ position:"relative", zIndex:1, maxWidth:420, width:"100%", textAlign:"center", animation:"rise 0.45s cubic-bezier(0.22,1,0.36,1) both" }}>
        <div style={{ fontSize:12, fontWeight:700, letterSpacing:0.4, color: color.accent, marginBottom:12 }}>Session summary</div>
        <div style={{ fontSize:36, fontWeight:800, color: color.ink, letterSpacing:-1, marginBottom:8, fontFamily: fontDisplay }}>{data.durationMins} minutes</div>
        <div style={{ fontSize:14, color: color.muted, marginBottom:32 }}>{tracks.length} tracks · {genres.length} scenes · energy {avgEnergy}</div>

        <div style={{ marginBottom:28 }}>
          <svg width={width} height={height} style={{ display:"block", margin:"0 auto" }}>
            <defs>
              <linearGradient id="arcGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color.accentSoft}/>
                <stop offset="100%" stopColor="transparent"/>
              </linearGradient>
            </defs>
            <polyline points={points} fill="none" stroke={color.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.85"/>
            <polygon points={`0,${height} ${points} ${width},${height}`} fill="url(#arcGrad)"/>
          </svg>
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:6, maxWidth:width, marginLeft:"auto", marginRight:"auto" }}>
            <span style={{ fontSize:10, color: color.faint, fontFamily: fontMono }}>Start</span>
            <span style={{ fontSize:10, color: color.faint, fontFamily: fontMono }}>End</span>
          </div>
        </div>

        {genres.length > 0 && (
          <div style={{ marginBottom:28, fontSize:13, color: color.body, lineHeight:1.5 }}>
            {genres.slice(0, 4).join(" · ")}
          </div>
        )}

        <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
          <button type="button" onClick={() => {
            if (onSavePlaylist) {
              const name = `Session · ${new Date(data.startTime).toLocaleDateString()} ${new Date(data.startTime).toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"})}`;
              onSavePlaylist(name, tracks.map(t => t.id));
            }
            onClose();
          }} style={{
            padding:"14px 24px", borderRadius: radius.sm,
            background: color.accent, border:"none",
            color: color.onAccent, fontSize:14, fontWeight:650, cursor:"pointer",
          }}>Save as playlist</button>
          <button type="button" onClick={onClose} style={{
            padding:"14px 24px", borderRadius: radius.sm,
            background:"none", border:`1px solid ${color.lineStrong}`,
            color: color.muted, fontSize:14, fontWeight:600, cursor:"pointer",
          }}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── DRIFT — immersive cinematic playback (Booth instrument) ─────────────────
function ImmersivePlayer({
  currentTrack, isPlaying, onTogglePlay, onSkip, onPrev, onClose,
  signalState, progress = 0, duration = 0, onSeek, onLike,
  volume = 1, onVolumeChange, onHypno, onHypnoRadio, onShowQueue,
  sessionArc = null, isRadioMode = false, hypnoPocket = false,
  roomLabel = null, onOpenRoom, onOpenLiner, onOpenArtist,
}) {
  const [showUI, setShowUI] = useState(true);
  const [artLoaded, setArtLoaded] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const hideTimer = useRef(null);
  const scrubRef = useRef(null);
  const pct = duration > 0 ? (progress / duration) * 100 : 0;

  const resetHide = useCallback(() => {
    setShowUI(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowUI(false), 3500);
  }, []);

  useEffect(() => {
    resetHide();
    setShowMore(false);
    return () => clearTimeout(hideTimer.current);
  }, [currentTrack?.id, resetHide]);

  useEffect(() => { setArtLoaded(false); }, [currentTrack?.id]);

  if (!currentTrack) return null;

  const rgb = hexToRgbStr(currentTrack.color);
  const stateLabel = signalState?.label || "";

  function seekFromClientX(clientX) {
    if (!scrubRef.current || !duration || !onSeek) return;
    const rect = scrubRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    onSeek(Math.floor(ratio * duration));
  }

  return (
    <div
      onMouseMove={resetHide}
      onClick={resetHide}
      style={{ position:"fixed", inset:0, zIndex:100, overflow:"hidden", background: color.canvas, cursor: showUI ? "default" : "none" }}>

      <div style={{
        position:"absolute", inset:0,
        backgroundImage: currentTrack.albumCover ? `url(${currentTrack.albumCover})` : "none",
        backgroundSize:"cover", backgroundPosition:"center",
        transform: artLoaded ? "scale(1.02)" : "scale(1.08)",
        transition:"transform 8s cubic-bezier(0.22,1,0.36,1), opacity 0.8s ease",
        opacity: artLoaded ? 1 : 0.4,
      }}>
        {currentTrack.albumCover && (
          <img src={currentTrack.albumCover} alt="" onLoad={()=>setArtLoaded(true)}
            style={{ position:"absolute", width:1, height:1, opacity:0, pointerEvents:"none" }}/>
        )}
      </div>
      {!currentTrack.albumCover && (
        <div style={{
          position:"absolute", inset:0,
          background:`linear-gradient(160deg, rgba(${rgb},0.35) 0%, ${color.canvas} 70%)`,
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          <div style={{ fontSize:120, fontWeight:800, color:`rgba(${rgb},0.25)`, letterSpacing:-6, fontFamily: fontDisplay }}>
            {(currentTrack.title||"4")[0]}
          </div>
        </div>
      )}

      <div aria-hidden="true" style={{
        position:"absolute", inset:0,
        background:"linear-gradient(180deg, rgba(12,11,10,0.25) 0%, rgba(12,11,10,0.15) 35%, rgba(12,11,10,0.78) 72%, rgba(12,11,10,0.96) 100%)",
      }}/>

      {/* Live session / flow arc */}
      {sessionArc?.energies?.length > 1 && (
        <div style={{
          position:"absolute", top:72, left:20, right:20, maxWidth:420,
          opacity: showUI ? 1 : 0, transition:"opacity 0.45s ease",
          pointerEvents: showUI ? "auto" : "none",
        }}>
          <div style={{ fontSize:9, fontWeight:700, letterSpacing:1.4, color: color.faint, textTransform:"uppercase", marginBottom:6 }}>
            {sessionArc.label || "Session arc"}
          </div>
          <svg width="100%" height="36" viewBox="0 0 320 36" preserveAspectRatio="none">
            {(() => {
              const energies = sessionArc.energies;
              const idx = Math.min(sessionArc.index || 0, energies.length - 1);
              const stepX = 320 / Math.max(energies.length - 1, 1);
              const pts = energies.map((e, i) => `${i * stepX},${36 - ((e - 1) / 9) * 28}`).join(" ");
              const cx = idx * stepX;
              const cy = 36 - (((energies[idx] || 5) - 1) / 9) * 28;
              return (
                <>
                  <polyline points={pts} fill="none" stroke="rgba(232,236,240,0.28)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx={cx} cy={cy} r="3.5" fill={color.accent}/>
                </>
              );
            })()}
          </svg>
        </div>
      )}

      {/* Track info + booth HUD */}
      <div
        key={currentTrack.id}
        style={{
          position:"absolute", bottom:168, left:20, right:20,
          opacity: showUI ? 1 : 0.55,
          transition:"opacity 0.5s ease",
          maxWidth:520,
          animation: "trackSwap 0.4s cubic-bezier(0.22,1,0.36,1) both",
        }}
      >
        <div style={{
          fontSize:"clamp(28px, 7vw, 42px)", fontWeight:750, color: color.onDark,
          letterSpacing:-1, lineHeight:1.05, fontFamily: fontDisplay,
          overflow:"hidden", textOverflow:"ellipsis", display:"-webkit-box",
          WebkitLineClamp:2, WebkitBoxOrient:"vertical",
        }}>
          {currentTrack.title}
        </div>
        <div style={{ fontSize:16, color: color.body, marginTop:10, letterSpacing:-0.2 }}>
          {onOpenArtist ? (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onOpenArtist(currentTrack.artist); }}
              style={{ background:"none", border:"none", padding:0, color: color.body, fontSize:16, cursor:"pointer", letterSpacing:-0.2 }}
            >
              {currentTrack.artist}
            </button>
          ) : currentTrack.artist}
        </div>
        {roomLabel && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onOpenRoom?.(); }}
            style={{
              marginTop:12, background:"none", border:`1px solid ${color.lineStrong}`,
              borderRadius: radius.sm, padding:"8px 12px", color: color.accent,
              fontSize:11, fontWeight:700, letterSpacing:1.2, fontFamily: fontMono,
              textTransform:"uppercase", cursor: onOpenRoom ? "pointer" : "default",
            }}
          >
            Playing in {roomLabel}
          </button>
        )}
        <div style={{ marginTop:18 }}>
          <BoothHud track={currentTrack} size="lg"/>
        </div>
        {(normalizeGenre(currentTrack.genre) || stateLabel || hypnoPocket || isRadioMode) && (
          <div style={{ fontSize:11, color: color.faint, marginTop:12, letterSpacing:0.4, fontFamily: fontMono, textTransform:"uppercase" }}>
            {[
              hypnoPocket ? "Similar mix" : (isRadioMode ? "Radio" : null),
              displaySceneLabel(currentTrack) || normalizeGenre(currentTrack.genre),
              stateLabel,
            ].filter(Boolean).join("  ·  ")}
          </div>
        )}
      </div>

      {/* Seekable progress */}
      <div
        ref={scrubRef}
        role="slider"
        aria-label="Seek"
        aria-valuemin={0}
        aria-valuemax={duration || 0}
        aria-valuenow={progress}
        tabIndex={0}
        onClick={(e) => { e.stopPropagation(); seekFromClientX(e.clientX); resetHide(); }}
        onKeyDown={(e) => {
          if (!onSeek || !duration) return;
          if (e.key === "ArrowRight") onSeek(Math.min(duration, progress + 5));
          if (e.key === "ArrowLeft") onSeek(Math.max(0, progress - 5));
        }}
        style={{
          position:"absolute", bottom:128, left:20, right:20, maxWidth:520,
          opacity: showUI ? 1 : 0, transition:"opacity 0.45s ease",
          pointerEvents: showUI ? "auto" : "none", cursor:"pointer",
        }}
      >
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6, fontSize:10, color: color.faint, fontFamily: fontMono, fontVariantNumeric:"tabular-nums" }}>
          <span>{fmtTime(progress)}</span>
          <span>{fmtTime(duration)}</span>
        </div>
        <div style={{ height:4, background:"rgba(237,232,225,0.12)", borderRadius:2, position:"relative" }}>
          <div style={{ width:`${pct}%`, background: color.accent, height:"100%", borderRadius:2, transition:"width 0.2s linear" }}/>
          <div style={{
            position:"absolute", top:"50%", left:`${pct}%`, transform:"translate(-50%,-50%)",
            width:12, height:12, borderRadius:"50%", background: color.accent,
            boxShadow:`0 0 0 3px ${color.accentSoft}`,
          }}/>
        </div>
      </div>

      {/* Controls */}
      <div style={{
        position:"absolute", bottom:36, left:20, right:20,
        display:"flex", alignItems:"center", justifyContent:"center", gap:18,
        opacity: showUI ? 1 : 0,
        transition:"opacity 0.5s ease",
        pointerEvents: showUI ? "auto" : "none",
      }}>
        <button type="button" onClick={(e)=>{ e.stopPropagation(); onLike?.(currentTrack.id); }} aria-label={currentTrack.liked?"Unlike":"Like"}
          style={{ background:"none", border:"none", cursor:"pointer", color: currentTrack.liked ? color.accent : color.body, padding:8 }}>
          <Icon name={currentTrack.liked?"heart":"heartempty"} size={18}/>
        </button>
        <button type="button" onClick={(e)=>{ e.stopPropagation(); onPrev(); }} aria-label="Previous"
          style={{ background:"none", border:"none", cursor:"pointer", color: color.body, padding:8 }}>
          <Icon name="prev" size={20}/>
        </button>
        <button type="button" className="play-primary" onClick={(e)=>{ e.stopPropagation(); onTogglePlay(); }} aria-label={isPlaying?"Pause":"Play"} style={{
          width:58, height:58, borderRadius: radius.sm,
          background: color.accent, border:"none",
          color: color.onAccent, cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center",
          boxShadow:`0 12px 32px ${color.accentGlow}`,
        }}>
          <Icon name={isPlaying?"pause":"play"} size={22}/>
        </button>
        <button type="button" onClick={(e)=>{ e.stopPropagation(); onSkip(); }} aria-label="Next"
          style={{ background:"none", border:"none", cursor:"pointer", color: color.body, padding:8 }}>
          <Icon name="skip" size={20}/>
        </button>
        <button type="button" onClick={(e)=>{ e.stopPropagation(); onShowQueue?.(); }} aria-label="Up Next"
          style={{ background:"none", border:"none", cursor:"pointer", color: color.body, padding:8 }}>
          <Icon name="queue" size={18}/>
        </button>
      </div>

      {/* Top chrome — quiet: back + overflow */}
      <div style={{
        position:"absolute", top:20, left:20, right:20,
        display:"flex", justifyContent:"space-between", alignItems:"center",
        opacity: showUI ? 1 : 0,
        transition:"opacity 0.5s ease",
        pointerEvents: showUI ? "auto" : "none",
        zIndex: 2,
      }}>
        <button type="button" onClick={(e)=>{ e.stopPropagation(); onClose(); }} aria-label="Back"
          style={{
            display:"flex", alignItems:"center", gap:8, background:"rgba(12,11,10,0.55)",
            border:`1px solid ${color.lineStrong}`, borderRadius: radius.sm, padding:"10px 14px",
            color: color.ink, cursor:"pointer", fontSize:13, fontWeight:600,
          }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>
          Back
        </button>
        <div style={{ display:"flex", alignItems:"center", gap:10, position:"relative" }}>
          <div style={{ fontSize:13, fontWeight:800, letterSpacing:-0.4, color: color.ink, fontFamily: fontDisplay }}>{BRAND_NAME}</div>
          <button type="button" onClick={(e)=>{ e.stopPropagation(); setShowVol(false); setShowMore(m => !m); }} aria-label="More"
            aria-expanded={showMore}
            style={{
              background:"rgba(12,11,10,0.55)", border:`1px solid ${color.lineStrong}`,
              borderRadius: radius.sm, padding:"10px 12px",
              color: color.ink, cursor:"pointer", fontSize:12, fontWeight:650,
            }}>
            ···
          </button>
          {showMore && (
            <div
              onClick={e=>e.stopPropagation()}
              style={{
                position:"absolute", top:"110%", right:0, minWidth:168,
                background: color.surfaceSolid, border:`1px solid ${color.lineStrong}`,
                padding:"6px 0", zIndex:5,
                animation:"rise 0.2s cubic-bezier(0.22,1,0.36,1) both",
              }}
            >
              {onOpenLiner && (
                <button type="button" onClick={() => { setShowMore(false); onOpenLiner(currentTrack); }}
                  style={{ display:"block", width:"100%", textAlign:"left", padding:"12px 16px", background:"none", border:"none", color: color.ink, fontSize:13, fontWeight:600, cursor:"pointer" }}>
                  Liner notes
                </button>
              )}
              {onHypno && (
                <button type="button" onClick={() => { setShowMore(false); onHypno(currentTrack); }}
                  style={{ display:"block", width:"100%", textAlign:"left", padding:"12px 16px", background:"none", border:"none", color: color.ink, fontSize:13, fontWeight:600, cursor:"pointer" }}>
                  Similar songs
                </button>
              )}
              {onHypnoRadio && (
                <button type="button" onClick={() => { setShowMore(false); onHypnoRadio(currentTrack); }}
                  style={{ display:"block", width:"100%", textAlign:"left", padding:"12px 16px", background:"none", border:"none", color: hypnoPocket ? color.accent : color.ink, fontSize:13, fontWeight:600, cursor:"pointer" }}>
                  {hypnoPocket ? "Similar mix on" : "Play similar mix"}
                </button>
              )}
              <div style={{ height:1, background: color.line, margin:"4px 0" }}/>
              <div style={{ padding:"10px 16px 14px" }}>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.2, color: color.faint, fontFamily: fontMono, textTransform:"uppercase", marginBottom:8 }}>Volume</div>
                <input
                  type="range" min={0} max={1} step={0.01} value={volume}
                  onChange={(e) => onVolumeChange?.(parseFloat(e.target.value))}
                  style={{ width:"100%" }}
                  aria-label="Volume level"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── UP NEXT SHEET (mobile queue) ─────────────────────────────────────────────
function QueueSheet({ queue, currentTrack, onPlay, onClose, onClear, onShuffle, isRadioMode, radioHint }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:110 }}>
      <div onClick={onClose} style={{ position:"absolute", inset:0, background:"rgba(12,11,10,0.72)", backdropFilter:"blur(8px)" }}/>
      <div style={{
        position:"absolute", left:0, right:0, bottom:0, maxHeight:"72vh",
        background: color.surfaceSolid, borderTop:`1px solid ${color.lineStrong}`,
        borderRadius:"16px 16px 0 0", display:"flex", flexDirection:"column",
        animation:"rise 0.35s cubic-bezier(0.22,1,0.36,1) both",
      }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 18px 10px" }}>
          <div>
            <div style={{ fontSize:16, fontWeight:750, color: color.ink, fontFamily: fontDisplay, letterSpacing:-0.3 }}>Up Next</div>
            {isRadioMode && (
              <div style={{ fontSize:11, color: color.muted, marginTop:2 }}>
                {radioHint || "Choosing the next song…"}
              </div>
            )}
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            {onShuffle && (
              <button type="button" onClick={onShuffle} style={{ background: color.surface, border:"none", borderRadius:8, padding:"6px 10px", color: color.muted, fontSize:11, fontWeight:600, cursor:"pointer" }}>Shuffle</button>
            )}
            {queue.length > 0 && onClear && (
              <button type="button" onClick={onClear} style={{ background: color.surface, border:"none", borderRadius:8, padding:"6px 10px", color: color.muted, fontSize:11, fontWeight:600, cursor:"pointer" }}>Clear</button>
            )}
            <button type="button" onClick={onClose} aria-label="Close" style={{ background:"none", border:"none", color: color.faint, cursor:"pointer", padding:4 }}>
              <Icon name="x" size={18}/>
            </button>
          </div>
        </div>
        <div className="hide-scroll" style={{ overflowY:"auto", padding:"4px 12px 28px" }}>
          {currentTrack && (
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 8px", marginBottom:6, borderRadius:10, background: color.accentSoft, border:`1px solid ${color.accentSoft}` }}>
              <div style={{ width:40, height:40, overflow:"hidden", flexShrink:0 }}><AlbumArt track={currentTrack} size={40} borderRadius={0}/></div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:1, color: color.accent, textTransform:"uppercase", marginBottom:2 }}>Now</div>
                <div style={{ fontSize:13, fontWeight:600, color: color.ink, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{currentTrack.title}</div>
                <div style={{ fontSize:11, color: color.muted }}>{currentTrack.artist}</div>
              </div>
            </div>
          )}
          {queue.length === 0 && (
            <div style={{ textAlign:"center", padding:"36px 12px", color: color.faint, fontSize:13 }}>
              {isRadioMode ? "Next pick lands after the crossfade" : "Queue is empty"}
            </div>
          )}
          {queue.map((t, i) => (
            <button type="button" key={t.id} onClick={() => { onPlay(t); onClose(); }}
              style={{
                display:"flex", alignItems:"center", gap:10, width:"100%", padding:"10px 8px",
                background:"none", border:"none", borderBottom:`1px solid ${color.line}`, cursor:"pointer", textAlign:"left",
              }}>
              <div style={{ width:16, fontSize:10, color: color.faint, fontVariantNumeric:"tabular-nums" }}>{i + 1}</div>
              <div style={{ width:40, height:40, overflow:"hidden", flexShrink:0 }}><AlbumArt track={t} size={40} borderRadius={0}/></div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:550, color: color.ink, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.title}</div>
                <div style={{ fontSize:11, color: color.muted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.artist}</div>
              </div>
              {t._signal?.label && (
                <span style={{ fontSize:9, color: color.faint, textTransform:"uppercase", letterSpacing:0.4 }}>{t._signal.label}</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Key feature: timed playlist CTA ───────────────────────────────────────────
// Concept: Session Dial — duration arc + playlist bars. Not a generic “+”.
function MakePlaylistFeature({ onClick }) {
  return (
    <button
      type="button"
      className="glass-control"
      onClick={onClick}
      aria-label="Make a playlist — choose a length and vibe"
      style={{
        width: "100%",
        position: "relative",
        overflow: "hidden",
        display: "block",
        padding: 0,
        borderRadius: radius.xl,
        border: `1px solid ${glass.border}`,
        background: `
          linear-gradient(135deg, rgba(234,231,220,0.14) 0%, rgba(234,231,220,0.03) 38%, transparent 62%),
          linear-gradient(180deg, rgba(234,231,220,0.10) 0%, rgba(234,231,220,0.04) 100%)
        `,
        boxShadow: `
          inset 0 1px 0 ${glass.highlight},
          inset 0 0 0 0.5px ${glass.borderFaint},
          0 18px 48px rgba(0,0,0,0.38)
        `,
        backdropFilter: glass.blur,
        WebkitBackdropFilter: glass.blur,
        cursor: "pointer",
        textAlign: "left",
        color: color.ink,
        animation: "rise 0.55s cubic-bezier(0.22,1,0.36,1) both",
      }}
    >
      {/* Soft specular edge */}
      <div aria-hidden="true" style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at 12% 0%, rgba(255,255,255,0.14) 0%, transparent 42%)",
      }}/>

      <div style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: "22px 18px 18px",
      }}>
        {/* Session Dial mark */}
        <div style={{
          width: 72, height: 72, borderRadius: 20, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: `
            radial-gradient(circle at 35% 28%, rgba(255,255,255,0.16) 0%, transparent 45%),
            linear-gradient(160deg, rgba(234,231,220,0.22) 0%, rgba(28,28,26,0.92) 55%, rgba(12,12,12,0.98) 100%)
          `,
          border: `1px solid ${glass.border}`,
          boxShadow: `
            inset 0 1px 0 ${glass.highlight},
            0 10px 28px rgba(0,0,0,0.35)
          `,
          animation: "markIn 0.65s cubic-bezier(0.22,1,0.36,1) both",
        }}>
          <TimedMixMark size={34} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 11, fontWeight: 650, letterSpacing: 1.2,
            textTransform: "uppercase", color: color.accent,
            marginBottom: 6,
          }}>
            Timed mix
          </div>
          <div style={{
            fontSize: 22, fontWeight: 700, fontFamily: fontDisplay,
            letterSpacing: -0.55, lineHeight: 1.1, marginBottom: 6,
          }}>
            Make a playlist
          </div>
          <div style={{
            fontSize: 14, color: color.body, lineHeight: 1.4,
            maxWidth: 240,
          }}>
            Set a length and vibe — we build the set.
          </div>
        </div>

        <div style={{
          width: 44, height: 44, borderRadius: 980, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: color.accent,
          color: color.onAccent,
          boxShadow: "0 10px 24px rgba(0,0,0,0.35)",
        }} aria-hidden="true">
          <Icon name="play" size={16}/>
        </div>
      </div>

      {/* Quiet length preview — feature promise, not a control cluster */}
      <div style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        margin: "0 14px 14px",
        padding: "12px 14px",
        borderRadius: radius.md,
        background: "rgba(0,0,0,0.28)",
        border: `1px solid ${glass.borderFaint}`,
        boxShadow: `inset 0 1px 0 ${glass.borderFaint}`,
      }}>
        <div style={{
          fontSize: 12, color: color.muted, fontWeight: 500,
          letterSpacing: 0.1, fontVariantNumeric: "tabular-nums",
        }}>
          <span style={{ color: color.ink }}>30m</span>
          <span style={{ color: color.faint }}>  ·  </span>
          <span style={{ color: color.ink }}>1h</span>
          <span style={{ color: color.faint }}>  ·  </span>
          <span style={{ color: color.ink }}>2h</span>
          <span style={{ color: color.faint }}>  ·  </span>
          <span style={{ color: color.ink }}>All night</span>
        </div>
        <div style={{
          fontSize: 12, fontWeight: 650, color: color.accent,
          letterSpacing: -0.1, flexShrink: 0,
        }}>
          Start
        </div>
      </div>
    </button>
  );
}

// ── Horizontal cover shelf (Apple Music–style) ───────────────────────────────
function CoverShelf({ tracks, onPlayTrack, activeId, isPlaying }) {
  if (!tracks?.length) return null;
  const tile = homeSpace.tile;
  return (
    <div
      className="hide-scroll"
      style={{
        display: "flex",
        gap: homeSpace.shelfGap,
        overflowX: "auto",
        padding: `0 ${homeSpace.gutter}px 10px`,
        scrollSnapType: "x mandatory",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {tracks.slice(0, 16).map((t) => {
        const active = activeId === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onPlayTrack(t, tracks)}
            style={{
              flex: "0 0 auto",
              width: tile,
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              textAlign: "left",
              color: color.ink,
              scrollSnapAlign: "start",
            }}
          >
            <div style={{
              width: tile, height: tile, borderRadius: radius.md, overflow: "hidden",
              marginBottom: 12, position: "relative",
              boxShadow: active
                ? `0 0 0 1.5px ${color.accent}, 0 16px 40px rgba(0,0,0,0.45)`
                : `0 0 0 1px ${glass.borderSoft}, 0 16px 40px rgba(0,0,0,0.42)`,
            }}>
              <AlbumArt track={t} size={tile} borderRadius={radius.md}/>
              {/* Transparent glass rim highlight */}
              <div aria-hidden="true" style={{
                pointerEvents: "none", position: "absolute", inset: 0, borderRadius: radius.md,
                boxShadow: `inset 0 1px 0 ${glass.highlight}`,
              }}/>
              {active && isPlaying && (
                <div style={{
                  position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)",
                  backdropFilter: "blur(2px)", WebkitBackdropFilter: "blur(2px)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%", background: color.accent,
                    animation: "pulse 1.2s ease-in-out infinite",
                  }}/>
                </div>
              )}
            </div>
            <div style={{
              fontSize: 14, fontWeight: 600, letterSpacing: -0.2,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              color: active ? color.accent : color.ink,
            }}>{t.title}</div>
            <div style={{
              fontSize: 12, color: color.muted, marginTop: 3,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>{t.artist}</div>
          </button>
        );
      })}
    </div>
  );
}

// ── Home — three acts only ────────────────────────────────────────────────────
const HomeSection = ({ label, count, children, delay = 0, first = false }) => (
  <section
    style={{
      margin: 0,
      paddingBottom: homeSpace.sectionPadBottom,
      animation: `rise 0.55s ${motion.ease} ${delay}s both`,
    }}
  >
    {!first && (
      <div aria-hidden="true" style={{
        padding: `${Math.round(homeSpace.sectionPadTop * 0.45)}px 0 ${Math.round(homeSpace.sectionPadTop * 0.55)}px`,
      }}>
        <div style={sectionRule(homeSpace.gutter)}/>
      </div>
    )}
    {first && <div style={{ height: homeSpace.sectionPadTopFirst }} aria-hidden="true"/>}
    <div style={{
      padding: `0 ${homeSpace.gutter}px 22px`,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    }}>
      <h2 style={{
        margin: 0,
        fontSize: 24,
        fontWeight: 700,
        letterSpacing: -0.6,
        color: color.ink,
        fontFamily: fontDisplay,
      }}>{label}</h2>
      {count != null && (
        <span className="glass-surface" style={{
          fontSize: 12,
          color: color.body,
          fontVariantNumeric: "tabular-nums",
          fontWeight: 600,
          padding: "5px 10px",
          borderRadius: 980,
          letterSpacing: 0.2,
        }}>{count}</span>
      )}
    </div>
    {children}
  </section>
);

function HomeScreen({
  tracks, onPlayRadio, onTogglePlay, onPlayTrack, currentTrack, isPlaying, onLike,
  isRadioMode, playlistCtx, signalLabel,
  userPlaylists = [], onCreatePlaylist, onDeletePlaylist,
  onMakePlaylist, mixLane, onMixLaneChange,
}) {
  const saved = savedTracks(tracks, 24);
  const collections = buildHomeCollections(tracks);
  const activeId = currentTrack?.id;
  const { menu, openFromButton, openFromContext, close } = useTrackMenu();
  const [showNewInput, setShowNewInput] = useState(false);
  const [newName, setNewName] = useState("");
  const [openPlaylistId, setOpenPlaylistId] = useState(null);

  function handleCreate() {
    if (!newName.trim() || !onCreatePlaylist) return;
    onCreatePlaylist(newName.trim());
    setNewName("");
    setShowNewInput(false);
  }

  const openPlaylist = openPlaylistId
    ? userPlaylists.find(p => p.id === openPlaylistId)
    : null;
  const openPlaylistTracks = openPlaylist
    ? (openPlaylist.trackIds || []).map(id => tracks.find(t => t.id === id)).filter(Boolean)
    : [];

  if (openPlaylist) {
    return (
      <div style={{ padding: "24px 16px 36px" }}>
        <button type="button" onClick={() => setOpenPlaylistId(null)} style={{
          background: "none", border: "none", color: color.accent, fontSize: 17, cursor: "pointer", fontWeight: 400, marginBottom: 16,
        }}>‹ Home</button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 18 }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: color.ink, fontFamily: fontDisplay, letterSpacing: -0.8 }}>{openPlaylist.name}</div>
          <span style={{ fontSize: 13, color: color.muted }}>{openPlaylistTracks.length}</span>
        </div>
        {openPlaylistTracks.length === 0 ? (
          <div style={{ fontSize: 15, color: color.faint, paddingTop: 32, textAlign: "center" }}>No songs yet — add tracks with ⋯</div>
        ) : openPlaylistTracks.map(t => (
          <TrackRow key={t.id} track={t} onPlay={() => onPlayTrack(t, openPlaylistTracks)} active={activeId === t.id} isPlaying={isPlaying} onLike={onLike} playlistCtx={playlistCtx} activePlaylistId={openPlaylist.id}/>
        ))}
        {menu && (
          <TrackActionsMenu track={menu.track} playlistCtx={playlistCtx} activePlaylistId={menu.activePlaylistId} x={menu.x} y={menu.y} onClose={close}/>
        )}
      </div>
    );
  }

  const featuredTrack = currentTrack
    || saved[0]
    || collections[0]?.tracks?.[0]
    || tracks.find((t) => t.albumCover && (t.duration || 0) <= 900)
    || null;

  const tile = homeSpace.tile;
  const mosaic = Math.round(tile / 2);

  return (
    <div style={{ position: "relative", paddingBottom: 48 }}>
      <DeepCutsCard
        onPlay={onPlayRadio}
        onTogglePlay={onTogglePlay}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        isRadioMode={isRadioMode}
        signalLabel={signalLabel}
        featuredTrack={featuredTrack}
        mixLane={mixLane}
        onMixLaneChange={onMixLaneChange}
      />

      {/* Library plane — soft glass atmosphere under the hero */}
      <div style={{
        position: "relative",
        background: `
          linear-gradient(180deg, rgba(255,255,255,0.035) 0%, transparent 140px),
          radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.04) 0%, transparent 55%),
          ${color.canvas}
        `,
      }}>
        {/* Key feature — timed playlist builder */}
        {onMakePlaylist && (
          <div style={{
            padding: `${homeSpace.bandPadY}px ${homeSpace.gutter}px ${Math.round(homeSpace.bandPadY * 0.55)}px`,
          }}>
            <MakePlaylistFeature onClick={onMakePlaylist} />
          </div>
        )}

        {/* Wide break + faded rule between action and first shelf */}
        {onMakePlaylist && (
          <div aria-hidden="true" style={{
            padding: `${Math.round(homeSpace.sectionPadTop * 0.4)}px 0 ${Math.round(homeSpace.sectionPadTop * 0.45)}px`,
          }}>
            <div style={sectionRule(homeSpace.gutter)}/>
          </div>
        )}

        {/* Library shelves — faded rules + wide vertical rhythm */}
        <div>
          {saved.length > 0 && (
            <HomeSection label="Liked Songs" count={saved.length} delay={0.04} first>
              <CoverShelf
                tracks={saved}
                onPlayTrack={onPlayTrack}
                activeId={activeId}
                isPlaying={isPlaying}
              />
            </HomeSection>
          )}

          <HomeSection
            label="Playlists"
            count={userPlaylists.length || undefined}
            delay={0.06}
            first={saved.length === 0}
          >
            <div
              className="hide-scroll"
              style={{
                display: "flex",
                gap: homeSpace.shelfGap,
                overflowX: "auto",
                padding: `0 ${homeSpace.gutter}px 10px`,
                scrollSnapType: "x mandatory",
                WebkitOverflowScrolling: "touch",
              }}
            >
              {userPlaylists.map((pl) => {
                const plTracks = (pl.trackIds || []).map((id) => tracks.find((t) => t.id === id)).filter(Boolean);
                const covers = plTracks.filter((t) => t.albumCover).slice(0, 4);
                return (
                  <button
                    key={pl.id}
                    type="button"
                    onClick={() => setOpenPlaylistId(pl.id)}
                    style={{
                      flex: "0 0 auto",
                      width: tile,
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      textAlign: "left",
                      color: color.ink,
                      scrollSnapAlign: "start",
                    }}
                  >
                    <div style={{
                      width: tile, height: tile, borderRadius: radius.md, overflow: "hidden",
                      marginBottom: 12, background: color.surfaceRaised,
                      display: "grid",
                      gridTemplateColumns: covers.length > 1 ? "1fr 1fr" : "1fr",
                      gridTemplateRows: covers.length > 1 ? "1fr 1fr" : "1fr",
                      boxShadow: `0 0 0 1px ${glass.borderSoft}, 0 16px 40px rgba(0,0,0,0.42)`,
                      position: "relative",
                    }}>
                      {covers.length === 0 ? (
                        <div style={{
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: color.faint, fontSize: 28, fontFamily: fontDisplay, fontWeight: 700,
                          background: glass.fillQuiet,
                        }}>♪</div>
                      ) : covers.length === 1 ? (
                        <AlbumArt track={covers[0]} size={tile} borderRadius={radius.md}/>
                      ) : (
                        <>
                          {[0, 1, 2, 3].map((i) => (
                            <div key={i} style={{ overflow: "hidden", background: color.surfaceSolid }}>
                              {covers[i] ? <AlbumArt track={covers[i]} size={mosaic} borderRadius={0}/> : null}
                            </div>
                          ))}
                        </>
                      )}
                      <div aria-hidden="true" style={{
                        pointerEvents: "none", position: "absolute", inset: 0, borderRadius: radius.md,
                        boxShadow: `inset 0 1px 0 ${glass.highlight}`,
                      }}/>
                    </div>
                    <div style={{
                      fontSize: 14, fontWeight: 600, letterSpacing: -0.2,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>{pl.name}</div>
                    <div style={{ fontSize: 12, color: color.muted, marginTop: 3 }}>
                      {plTracks.length} songs
                    </div>
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setShowNewInput(true)}
                style={{
                  flex: "0 0 auto",
                  width: tile,
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  textAlign: "left",
                  color: color.ink,
                  scrollSnapAlign: "start",
                }}
              >
                <div className="glass-surface" style={{
                  width: tile, height: tile, borderRadius: radius.md, marginBottom: 12,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: color.body, fontSize: 36, fontWeight: 300,
                }}>+</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: color.accent }}>New Playlist</div>
              </button>
            </div>
            {showNewInput && (
              <div style={{ display: "flex", gap: 8, alignItems: "center", padding: `16px ${homeSpace.gutter}px 0` }}>
                <input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") { setShowNewInput(false); setNewName(""); } }}
                  placeholder="Playlist name…" style={{ flex: 1, ...INPUT_ST, padding: "10px 12px", fontSize: 15 }}/>
                <button type="button" onClick={handleCreate} style={{
                  background: color.accent, border: "none", borderRadius: 980, color: color.onAccent,
                  fontSize: 15, fontWeight: 600, padding: "10px 16px", cursor: "pointer",
                }}>Create</button>
              </div>
            )}
          </HomeSection>

          {collections.map((col, ci) => (
            <HomeSection
              key={col.id}
              label={col.label}
              count={col.tracks.length}
              delay={0.08 + ci * 0.03}
            >
              <CoverShelf
                tracks={col.tracks}
                onPlayTrack={onPlayTrack}
                activeId={activeId}
                isPlaying={isPlaying}
              />
            </HomeSection>
          ))}

          {saved.length === 0 && collections.length === 0 && userPlaylists.length === 0 && (
            <div style={{ padding: `20px ${homeSpace.gutter}px 56px` }}>
              {!onMakePlaylist && (
                <div aria-hidden="true" style={{ ...sectionRule(0), marginBottom: 36 }}/>
              )}
              <div className="glass-surface" style={{
                padding: "28px 22px",
                borderRadius: radius.lg,
              }}>
                <div style={{ fontSize: 22, fontWeight: 700, fontFamily: fontDisplay, color: color.ink, marginBottom: 8, letterSpacing: -0.4 }}>
                  Nothing here yet
                </div>
                <div style={{ fontSize: 15, color: color.muted, lineHeight: 1.5, maxWidth: 280 }}>
                  Tap Play above, or like a song — Home fills in as you listen.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {menu && (
        <TrackActionsMenu
          track={menu.track}
          playlistCtx={playlistCtx}
          activePlaylistId={menu.activePlaylistId}
          x={menu.x}
          y={menu.y}
          onClose={close}
        />
      )}
    </div>
  );
}

// ─── SEARCH ───────────────────────────────────────────────────────────────────
function SearchScreen({ query, setQuery, results, onPlay, onLike, currentTrack, isPlaying, playlistCtx, entityHits, onOpenArtist, onOpenAlbum }) {
  return (
    <div style={{ padding:"28px 16px 16px" }}>
      <div style={{ marginBottom:18 }}>
        <div style={{ fontSize:34, fontWeight:700, fontFamily: fontDisplay, letterSpacing:-1, color: color.ink, marginBottom:16 }}>Search</div>
      </div>
      <div style={{ position:"relative", marginBottom:20 }}>
        <div style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color: color.faint }}><Icon name="search" size={16}/></div>
        <input
          placeholder="Artists, songs, albums…"
          aria-label="Search"
          style={{...INPUT_ST, paddingLeft:42, background: color.surfaceRaised, border: "none"}}
          value={query}
          onChange={e=>setQuery(e.target.value)}
          autoFocus
        />
      </div>
      {!query && (
        <div style={{ display:"flex", gap:8, marginBottom:24, flexWrap:"wrap" }}>
          {CANONICAL_GENRES.map(g=>(
            <button key={g} type="button" onClick={()=>setQuery(g)} style={{
              padding:"8px 14px", borderRadius: 980, border:`1px solid ${color.line}`,
              background: "transparent", color: color.body, fontSize:13, fontWeight:500, cursor:"pointer",
            }}>{g}</button>
          ))}
        </div>
      )}
      {query.length > 1 && entityHits?.artists?.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize:13, fontWeight:600, color: color.muted, marginBottom:10, textTransform:"uppercase", letterSpacing:0.4 }}>Artists</div>
          {entityHits.artists.map((a) => (
            <button
              key={a.slug}
              type="button"
              onClick={() => onOpenArtist?.(a.slug)}
              style={{
                display:"flex", alignItems:"center", gap:12, width:"100%", padding:"10px 4px",
                background:"none", border:"none", borderBottom:`1px solid ${color.line}`,
                cursor:"pointer", textAlign:"left", color: color.ink,
              }}
            >
              <div style={{ width:48, height:48, overflow:"hidden", flexShrink:0, background: color.surfaceRaised, borderRadius: 24 }}>
                {a.coverTrack && <AlbumArt track={a.coverTrack} size={48} borderRadius={24}/>}
              </div>
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:17, fontWeight:600, fontFamily: fontDisplay }}>{a.name}</div>
                <div style={{ fontSize:13, color: color.muted }}>Artist</div>
              </div>
            </button>
          ))}
        </div>
      )}
      {query.length > 1 && entityHits?.albums?.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize:13, fontWeight:600, color: color.muted, marginBottom:10, textTransform:"uppercase", letterSpacing:0.4 }}>Albums</div>
          {entityHits.albums.map((a) => (
            <button
              key={a.slug}
              type="button"
              onClick={() => onOpenAlbum?.(a.slug)}
              style={{
                display:"flex", alignItems:"center", gap:12, width:"100%", padding:"10px 4px",
                background:"none", border:"none", borderBottom:`1px solid ${color.line}`,
                cursor:"pointer", textAlign:"left", color: color.ink,
              }}
            >
              <div style={{ width:48, height:48, overflow:"hidden", flexShrink:0, background: color.surfaceRaised, borderRadius: 6 }}>
                {a.coverTrack && <AlbumArt track={a.coverTrack} size={48} borderRadius={6}/>}
              </div>
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:17, fontWeight:600, fontFamily: fontDisplay }}>{a.title}</div>
                <div style={{ fontSize:13, color: color.muted }}>{a.artist}</div>
              </div>
            </button>
          ))}
        </div>
      )}
      {query.length>1&&!results.length&&!(entityHits?.artists?.length || entityHits?.albums?.length)&&(
        <div style={{ textAlign:"center", padding:"56px 0" }}>
          <div style={{ color: color.ink, fontSize:17, fontWeight:600, fontFamily: fontDisplay, marginBottom:8 }}>No Results for “{query}”</div>
          <div style={{ color: color.muted, fontSize:15, lineHeight:1.5, maxWidth:260, margin:"0 auto" }}>
            Try another artist, song, or album.
          </div>
        </div>
      )}
      {results.length > 0 && query.length > 1 && (
        <div style={{ fontSize:13, fontWeight:600, color: color.muted, marginBottom:10, textTransform:"uppercase", letterSpacing:0.4 }}>Songs</div>
      )}
      {results.map(t=>(
        <TrackRow key={t.id} track={t} onPlay={()=>onPlay(t)} active={currentTrack?.id===t.id} isPlaying={isPlaying} onLike={onLike} playlistCtx={playlistCtx}/>
      ))}
      {!query && (
        <div style={{ paddingTop:8 }}>
          <div style={{ fontSize:20, fontWeight:700, letterSpacing:-0.4, color: color.ink, marginBottom:14, fontFamily: fontDisplay }}>Browse Categories</div>
          <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
            {SEARCH_PROMPTS.map(s => (
              <button key={s.q} type="button" onClick={() => setQuery(s.q)} style={{
                display:"flex", justifyContent:"space-between", alignItems:"center",
                padding:"14px 4px", background:"none", border:"none", borderBottom:`1px solid ${color.line}`,
                cursor:"pointer", textAlign:"left", color: color.ink,
              }}>
                <div>
                  <div style={{ fontSize:17, fontWeight:600, fontFamily: fontDisplay }}>{s.label}</div>
                  <div style={{ fontSize:13, color: color.muted, marginTop:2 }}>{s.hint}</div>
                </div>
              </button>
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

// ─── DIG (Discover) ───────────────────────────────────────────────────────────
function FavoritesScreen({
  tracks, preferredGenres = [], onPlay, onLike, currentTrack, isPlaying, playlistCtx,
}) {
  const { menu, close } = useTrackMenu();
  const singles = tracks.filter(t => (t.duration || 0) <= 900);
  const likedTracks = tracks.filter(t => t.liked);
  const hour = new Date().getHours();
  const [eMin, eMax] = getEnergyRangeForHour(hour);

  const [forYou, setForYou] = useState([]);
  const forYouInitRef = useRef(null);
  useEffect(() => {
    const preferredKey = (preferredGenres || []).join(",");
    const key = tracks.length + ":" + likedTracks.length + ":" + preferredKey;
    if (forYouInitRef.current === key) return;
    forYouInitRef.current = key;
    const likedG = [...new Set([
      ...likedTracks.map(t => t.genre).filter(Boolean),
      ...(preferredGenres || []),
    ])];
    const candidates = likedG.length > 0
      ? singles.filter(t => likedG.includes(t.genre) && (t.energy || 5) >= eMin && (t.energy || 5) <= eMax && !t.liked)
      : singles.filter(t => (t.energy || 5) >= eMin && (t.energy || 5) <= eMax);
    const preferredSet = new Set(preferredGenres || []);
    const ranked = [...candidates].sort((a, b) => {
      const ap = preferredSet.has(a.genre) ? 1 : 0;
      const bp = preferredSet.has(b.genre) ? 1 : 0;
      if (ap !== bp) return bp - ap;
      return Math.random() - 0.5;
    }).slice(0, 24);
    setForYou(ranked);
  }, [tracks.length, likedTracks.length, preferredGenres]);

  const timeRecs = singles.filter(t => (t.energy || 5) >= eMin && (t.energy || 5) <= eMax);
  const digPool = forYou.length > 0 ? forYou : (timeRecs.length > 0 ? timeRecs : singles);
  const digLead = digPool[0];
  const digLane = digPool.filter(t => t.id !== digLead?.id).slice(0, 16);

  return (
    <div style={{ overflowY: "auto", height: "100%", minHeight: "calc(100vh - 112px)" }}>
      <div style={{ padding: "28px 16px 32px" }}>
        <div style={{ fontSize:34, fontWeight:700, fontFamily: fontDisplay, letterSpacing:-1, color: color.ink, marginBottom:8 }}>Browse</div>
        <div style={{ fontSize:15, color: color.body, marginBottom:28, lineHeight:1.45 }}>
          Fresh picks for right now.
        </div>

        {digLead && (
          <button
            type="button"
            onClick={() => onPlay(digLead)}
            style={{
              display: "flex", alignItems: "center", gap: 16, width: "100%",
              padding: "0 0 28px", background: "none", border: "none",
              cursor: "pointer", textAlign: "left", color: color.ink,
            }}
          >
            <div style={{ width: 120, height: 120, borderRadius: 10, overflow: "hidden", flexShrink: 0, boxShadow: "0 12px 32px rgba(0,0,0,0.45)" }}>
              <AlbumArt track={digLead} size={120} borderRadius={10}/>
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: color.accent, marginBottom: 6, letterSpacing: 0.2 }}>Featured</div>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: fontDisplay, letterSpacing: -0.5, lineHeight: 1.15, marginBottom: 6 }}>
                {digLead.title}
              </div>
              <div style={{ fontSize: 15, color: color.muted }}>{digLead.artist}</div>
            </div>
          </button>
        )}

        {digLane.length > 0 && (
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.4, color: color.ink, fontFamily: fontDisplay, marginBottom: 14 }}>
              Recommended for You
            </div>
            {digLane.map((t) => (
              <TrackRow
                key={t.id}
                track={t}
                onPlay={() => onPlay(t)}
                active={currentTrack?.id === t.id}
                isPlaying={isPlaying}
                onLike={onLike}
                playlistCtx={playlistCtx}
              />
            ))}
          </div>
        )}
      </div>

      {menu && (
        <TrackActionsMenu
          track={menu.track}
          playlistCtx={playlistCtx}
          activePlaylistId={menu.activePlaylistId}
          x={menu.x}
          y={menu.y}
          onClose={close}
        />
      )}
    </div>
  );
}

// ─── PROFILE ─────────────────────────────────────────────────────────────────
function ProfileScreen({ user, tracks, onLogout }) {
  const liked = tracks.filter(t => t.liked);
  const initial = (user.name || "R").trim().charAt(0).toUpperCase();

  return (
    <div style={{ padding: "36px 20px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 36 }}>
        <div
          aria-hidden="true"
          style={{
            width: 72, height: 72, borderRadius: 36,
            background: color.surfaceRaised,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {user.image ? (
            <span style={{ fontSize: 28 }}>{user.image}</span>
          ) : (
            <span style={{
              fontSize: 28, fontWeight: 700, fontFamily: fontDisplay,
              color: color.ink, letterSpacing: -1,
            }}>{initial}</span>
          )}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontSize: 28, fontWeight: 700, letterSpacing: -0.8,
            fontFamily: fontDisplay, color: color.ink, lineHeight: 1.1,
          }}>
            {user.name}
          </div>
          <div style={{ fontSize: 15, color: color.muted, marginTop: 6 }}>
            {liked.length} liked songs
          </div>
        </div>
      </div>

      <button type="button" onClick={onLogout} style={{ ...BTN_SECONDARY, width: "100%", borderRadius: 980 }}>
        Sign Out
      </button>
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
              <button onClick={()=>{setTracks(ts=>ts.filter(tr=>tr.id!==t.id));showToast("Deleted");}} style={{ background:"none",border:"none",cursor:"pointer",color: color.alert,padding:6 }}><Icon name="trash" size={14}/></button>
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
                        <div style={{ fontSize:11, fontWeight:600, color: color.ink, letterSpacing:0.5, marginBottom:8, textTransform:"uppercase" }}>{label}</div>
                        <div style={{ fontSize:28, fontWeight:700, color: color.ink }}>{has}<span style={{ fontSize:14, color: color.muted }}>/{total}</span></div>
                        <div style={{ height:4, background:"rgba(0,0,0,0.06)", borderRadius:2, marginTop:8, overflow:"hidden" }}>
                          <div style={{ width:`${pct}%`, height:"100%", background: pct === 100 ? color.accent : pct > 50 ? color.surfaceRaised : color.faint, borderRadius:2, transition:"width 0.5s" }}/>
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
    </div>
  );
}

// ─── NOW PLAYING BAR — flat station strip ─────────────────────────────────────
function NowPlayingBar({ track, isPlaying, progress, duration, onTogglePlay, onSkip, onPrev, onLike, onSeek, repeat, setRepeat, isRadioMode, onOpen, playlistCtx, onShowQueue, hypnoPocket }) {
  const pct = duration > 0 ? (progress/duration)*100 : 0;
  const bpm = track.bpm ? String(track.bpm) : "—";
  const key = track.camelot || "—";
  const energy = track.energy != null ? String(track.energy) : "—";
  const { menu, openFromButton, openFromContext, close } = useTrackMenu();
  const scrubRef = useRef(null);

  function seekFromClientX(clientX) {
    if (!scrubRef.current || !duration || !onSeek) return;
    const rect = scrubRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    onSeek(Math.floor(ratio * duration));
  }

  return (
    <div style={{ position:"fixed", bottom:56, left:0, right:0, zIndex:80 }}>
      <div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onContextMenu={(e) => openFromContext(e, track)}
        onKeyDown={e=>{ if(e.key==="Enter") onOpen?.(); }}
        aria-label="Open now playing"
        style={{
          background: "rgba(10,10,10,0.78)",
          backdropFilter: glass.blurSoft,
          WebkitBackdropFilter: glass.blurSoft,
          borderTop: `1px solid ${glass.border}`,
          borderBottom: "none",
          boxShadow: `inset 0 1px 0 ${glass.highlight}`,
          padding:"10px 12px 11px",
          display:"flex", alignItems:"center", gap:12, cursor:"pointer",
          position:"relative",
          borderLeft: isRadioMode ? `2px solid ${color.accent}` : "2px solid transparent",
        }}
      >
        {/* Seekable progress edge */}
        <div
          ref={scrubRef}
          role="slider"
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={duration || 0}
          aria-valuenow={progress}
          onClick={e=>{ e.stopPropagation(); seekFromClientX(e.clientX); }}
          style={{ position:"absolute", top:0, left:0, right:0, height:8, cursor:"pointer", zIndex:2 }}
        >
          <div aria-hidden="true" style={{ position:"absolute", top:0, left:0, right:0, height:2, background:"rgba(232,236,240,0.08)" }}>
            <div style={{ width:`${pct}%`, background: color.accent, height:"100%", transition:"width 0.25s linear" }}/>
          </div>
        </div>
        <div style={{ width:42, height:42, overflow:"hidden", flexShrink:0 }}><AlbumArt track={track} size={42} borderRadius={0}/></div>
        <div key={track.id} style={{ flex:1, minWidth:0, animation:"fadeIn 0.3s ease both" }}>
          <div style={{ fontSize:13, fontWeight:650, color: color.ink, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontFamily: fontDisplay, letterSpacing:-0.2 }}>
            {(isRadioMode || hypnoPocket) && (
              <span style={{
                display:"inline-block", width:6, height:6, borderRadius:"50%",
                background: color.accent, marginRight:8, verticalAlign:"middle",
                boxShadow: isPlaying ? `0 0 0 3px ${color.accentSoft}` : "none",
                animation: isPlaying ? "breathe 2s ease-in-out infinite" : "none",
              }}/>
            )}
            {track.title}
          </div>
          <div style={{
            fontSize:10, color: color.muted, marginTop:4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
            fontFamily: fontMono, fontVariantNumeric:"tabular-nums", letterSpacing:0.3,
          }}>
            {hypnoPocket ? "Similar mix" : isRadioMode ? "Radio" : track.artist}
            <span style={{ color: color.faint }}>  ·  </span>
            <span style={{ color: color.accent }}>{bpm}</span>
            <span style={{ color: color.faint }}> BPM · </span>
            <span style={{ color: color.accent }}>{key}</span>
            <span style={{ color: color.faint }}> · E</span>
            <span style={{ color: color.accent }}>{energy}</span>
          </div>
        </div>
        <button type="button" aria-label={track.liked?"Unlike":"Like"} onClick={e=>{e.stopPropagation();onLike();}} style={{ background:"none",border:"none",cursor:"pointer",color:track.liked?color.accent:color.faint,padding:4 }}><Icon name={track.liked?"heart":"heartempty"} size={16}/></button>
        {onShowQueue && (
          <button type="button" aria-label="Up Next" onClick={e=>{e.stopPropagation();onShowQueue();}} style={{ background:"none",border:"none",cursor:"pointer",color: color.faint,padding:4 }}>
            <Icon name="queue" size={16}/>
          </button>
        )}
        <TrackMoreButton onClick={(e) => openFromButton(e, track)} />
        <button type="button" className="play-primary" aria-label={isPlaying?"Pause":"Play"} onClick={e=>{e.stopPropagation();onTogglePlay();}} style={{ background: color.accent, border:"none", borderRadius: radius.sm, width:36, height:36, cursor:"pointer", color: color.onAccent, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <Icon name={isPlaying?"pause":"play"} size={16}/>
        </button>
        <button type="button" aria-label="Next" onClick={e=>{e.stopPropagation();onSkip();}} style={{ background:"none",border:"none",cursor:"pointer",color: color.muted, padding:4 }}><Icon name="skip" size={16}/></button>
      </div>
      {menu && (
        <TrackActionsMenu
          track={menu.track}
          playlistCtx={playlistCtx}
          activePlaylistId={menu.activePlaylistId}
          x={menu.x}
          y={menu.y}
          onClose={close}
        />
      )}
    </div>
  );
}

function MetaChip({ children }) {
  return <span style={{ fontSize:10, padding:"4px 8px", borderRadius:6, background:"rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.45)", fontVariantNumeric:"tabular-nums" }}>{children}</span>;
}

// ─── BOTTOM NAV ───────────────────────────────────────────────────────────────
function BottomNav({ screen, setScreen, showAdmin = false, hasPlayer = false }) {
  // IA: Home · Browse · Search · Library
  const items = [
    {id:"home",label:"Home",icon:"home"},
    {id:"favorites",label:"Browse",icon:"dig"},
    {id:"search",label:"Search",icon:"search"},
    {id:"profile",label:"Library",icon:"profile"},
  ];
  if (showAdmin) items.push({id:"admin",label:"Admin",icon:"settings"});
  return (
    <nav aria-label="Main" style={{
      position:"fixed", bottom:0, left:0, right:0, height:56,
      background: "rgba(0,0,0,0.82)",
      backdropFilter: glass.blurSoft,
      WebkitBackdropFilter: glass.blurSoft,
      borderTop: hasPlayer ? "none" : `1px solid ${glass.borderSoft}`,
      boxShadow: hasPlayer ? "none" : `inset 0 1px 0 ${glass.highlight}`,
      display:"flex", zIndex:85,
    }}>
      {items.map(({id,icon,label})=>{
        const active = screen === id;
        return (
          <button key={id} type="button" aria-label={label} aria-current={active?"page":undefined}
            onClick={()=>setScreen(id)}
            style={{
              flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:3,
              background:"none", border:"none", cursor:"pointer", position:"relative",
              color: active ? color.accent : color.faint,
            }}>
            {active && (
              <span aria-hidden="true" style={{
                position:"absolute", top:0, left:"28%", right:"28%", height:2, background: color.accent,
              }}/>
            )}
            <Icon name={icon} size={18}/>
            <span style={{ fontSize:10, fontWeight: active ? 650 : 500, letterSpacing:0.2 }}>{label}</span>
          </button>
        );
      })}
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
  const { firebaseUser, profile, setProfile, loading: authLoading, authError, clearAuthError, signUp, logIn, logOut, signInWithGoogle, sendPhoneOTP, verifyPhoneOTP, resetPassword } = useAuth();

  // ── URL ↔ screen ─────────────────────────────────────────────────────────
  const navigate = useNavigate();
  const location = useLocation();
  const { screen, artistSlug, albumSlug } = parsePath(location.pathname);
  const setScreen = useCallback((id, param = null) => {
    navigate(buildPath(id, param));
  }, [navigate]);
  const openArtist = useCallback((nameOrSlug) => {
    navigate(buildPath("artist", { artistSlug: slugify(nameOrSlug) }));
  }, [navigate]);
  const openAlbum = useCallback((trackOrSlug) => {
    if (typeof trackOrSlug === "string") {
      navigate(buildPath("album", { albumSlug: trackOrSlug }));
      return;
    }
    const artist = trackOrSlug?.artist || "Unknown";
    const album = trackOrSlug?.album || "Singles & Unknown";
    navigate(buildPath("album", { albumSlug: `${slugify(artist)}__${slugify(album)}` }));
  }, [navigate]);

  // Retired surfaces → Home
  useEffect(() => {
    if (screen === "drift" || screen === "rooms" || screen === "paths" || screen === "map") {
      setScreen("home");
    }
  }, [screen, setScreen]);

  // ── App state ────────────────────────────────────────────────────────────
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
  const [resonanceTrack, setResonanceTrack] = useState(null); // Hypno Vision source
  const [sessionMeta, setSessionMeta] = useState(null); // { tracks, startTime, kind, label }
  const [showQueue, setShowQueue] = useState(false);
  const [volume, setVolume] = useState(1);
  const [hypnoSeed, setHypnoSeed] = useState(null); // pocket-mode seed track
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);
  const [listeningRoom, setListeningRoom] = useState(null);
  const [linerTrack, setLinerTrack] = useState(null);
  const [mixLane, setMixLane] = useState(() => {
    try {
      const saved = localStorage.getItem("rooms.mixLane");
      return mixLaneById(saved).id;
    } catch {
      return "main";
    }
  });
  const volumeRef = useRef(1);
  useEffect(() => { volumeRef.current = volume; }, [volume]);
  useEffect(() => {
    try { localStorage.setItem("rooms.mixLane", mixLane); } catch { /* ignore */ }
  }, [mixLane]);

  const radioPool = useCallback(() => {
    const pool = tracksForMixLane(tracks, mixLane);
    if (pool.length) return pool;
    return tracks.filter((t) => (t.duration || 0) <= 900);
  }, [tracks, mixLane]);
  const mixLaneRef = useRef(mixLane);
  useEffect(() => { mixLaneRef.current = mixLane; }, [mixLane]);

  // ── Listening Memory — tracks recently played with timestamps ──
  const recentlyPlayedRef = useRef([]); // [{id, genre, energy, timestamp}]
  const playHistoryRef = useRef([]); // previous tracks for "prev" button
  const sessionStartRef = useRef(null);
  const [signalState, setSignalState] = useState({ intensity:0.5, openness:0.5, momentum:0, depth:0, direction:0, label:"Just started" });

  // Set arc for On Air floor (last 2 → now → next)
  const radioPickOpts = () => ({
    preferredGenres: [],
    signalState,
    seedTrack: hypnoSeed,
  });
  const setPrev = isRadioMode && currentTrack
    ? playHistoryRef.current.filter(t => t && t.id !== currentTrack.id).slice(0, 2).reverse()
    : [];
  const setNext = isRadioMode && currentTrack
    ? pickNextTrack(radioPool(), currentTrack, recentlyPlayedRef.current, radioPickOpts())
    : null;

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
  function buildAfterglowPayload() {
    const start = sessionStartRef.current || sessionMeta?.startTime;
    if (!start) return null;
    let trackObjs = [];
    if (sessionMeta?.tracks?.length) {
      // Prefer the crafted session order, clipped to what was actually reached
      const playedIds = new Set(recentlyPlayedRef.current.filter(p => p.ts >= start).map(p => p.id));
      const reached = [];
      for (const t of sessionMeta.tracks) {
        reached.push(t);
        if (!playedIds.has(t.id) && t.id !== currentTrack?.id) break;
      }
      trackObjs = reached.length ? reached : sessionMeta.tracks;
    } else {
      const sessionPlays = recentlyPlayedRef.current.filter(p => p.ts >= start);
      trackObjs = sessionPlays
        .map(p => tracksRef.current.find(t => t.id === p.id))
        .filter(Boolean)
        .reverse();
    }
    if (trackObjs.length < 2) return null;
    return {
      tracks: trackObjs,
      durationMins: Math.max(1, Math.round((Date.now() - start) / 60000)),
      startTime: start,
    };
  }

  function endSessionWithAfterglow(showGlow = true) {
    const glow = showGlow ? buildAfterglowPayload() : null;
    flushSession();
    setSessionMeta(null);
    setHypnoSeed(null);
    if (glow) setAfterglow(glow);
  }

  function flushSession() {
    const plays = recentlyPlayedRef.current;
    const start = sessionStartRef.current;
    if (!start || plays.length < 3 || !firebaseUser) {
      sessionStartRef.current = null;
      return;
    }
    const sessionPlays = plays.filter(p => p.ts >= start);
    if (sessionPlays.length < 3) {
      sessionStartRef.current = null;
      return;
    }
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
      if (sessionMeta) endSessionWithAfterglow(true);
      else flushSession();
    }
  }, [currentTrack?.id]);


  // Check if a track was played recently (within hours)

  useEffect(() => {
    let label = null;
    if (screen === "artist" && artistSlug) label = findArtist(tracks, artistSlug)?.name;
    if (screen === "album" && albumSlug) label = findAlbum(tracks, albumSlug)?.title;
    document.title = documentTitleFor(screen, label);
  }, [screen, artistSlug, albumSlug, tracks]);

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
    setTracks(prev => prev.map(t => ({
      ...t,
      liked: likedSet.has(t.id),
      // keep scene enrichment if already present
      _scene: t._scene,
      _scenes: t._scenes,
    })));
    if (profile.playlists) setUserPlaylists(profile.playlists);
  }, [profile?.likedTracks, tracks.length]);

  // ── User object shaped like the rest of the app expects ─────────────────
  const user = {
    name:   profile?.displayName || "Listener",
    image:  profile?.profileImage || "",
    genres: profile?.genres || [],
  };
  const needsOnboarding = !!firebaseUser && profile && profile.onboarded === false && !onboardingDismissed && !tracksLoading;

  // Skip room-picking onboarding — land on Home
  useEffect(() => {
    if (!needsOnboarding) return;
    let cancelled = false;
    (async () => {
      try {
        await completeOnboarding({ homeRooms: [] });
        if (!cancelled) {
          setProfile((p) => ({ ...(p || {}), onboarded: true, homeRooms: [] }));
        }
      } catch (e) { /* local dismiss still */ }
      if (!cancelled) setOnboardingDismissed(true);
    })();
    return () => { cancelled = true; };
  }, [needsOnboarding, setProfile]);

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

    const pool = tracksForMixLane(tracksRef.current, mixLaneRef.current);
    const library = pool.length
      ? pool
      : tracksRef.current.filter((t) => (t.duration || 0) <= 900);
    const next = pickNextTrack(library, currentRef.current, recentlyPlayedRef.current, {
      preferredGenres: [],
      signalState,
      seedTrack: hypnoSeed,
    });
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
      const targetVol = volumeRef.current;
      fadeOut.volume = Math.max(0, targetVol * (1 - t));
      fadeIn.volume  = Math.min(targetVol, targetVol * t);

      if (step >= steps) {
        clearInterval(crossfadeRef.current);
        fadeOut.pause();
        fadeOut.src = "";
        fadeOut.volume = targetVol;

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

  // Sync volume to both audio elements
  useEffect(() => {
    if (audioRef.current && !isCrossfading.current) audioRef.current.volume = volume;
    // nextAudioRef volume is managed during crossfade
  }, [volume]);

  // ── Playback actions ─────────────────────────────────────────────────────
  const playTrack = (track, q = null, opts = {}) => {
    if (currentTrack && currentTrack.id !== track.id) {
      playHistoryRef.current = [currentTrack, ...playHistoryRef.current].slice(0, 50);
    }
    // Quiet dig by default — only open Booth when asked (radio / session / explicit)
    const openImmersive = opts.immersive === true;
    setCurrent(track); setIsPlaying(true); setProgress(0); setIsRadioMode(false);
    if (!opts.keepSession) setSessionMeta(null);
    if (!opts.keepHypno) setHypnoSeed(null);
    if (opts.room) setListeningRoom(opts.room);
    else if (!opts.keepRoom) setListeningRoom(null);
    if (openImmersive) setImmersive(true);
    if (q) setQueue(q.filter(t => t.id !== track.id));
    logTrackPlay(track);
    if (firebaseUser) recordPlay(track.id, profile?.recentTracks || []).catch(()=>{});
  };

  const playPath = (path) => {
    if (!path?.playlist?.length) return;
    const first = path.playlist[0];
    setListeningRoom({ id: path.id, label: path.title });
    playTrack(first, path.playlist, { immersive: true, keepRoom: true, room: { id: path.id, label: path.title } });
    showToast(`Walking “${path.title}”`);
  };

  const playRadio = (seed = null) => {
    const pool = radioPool();
    if (!pool.length) return;
    const seedTrack = seed || null;
    setHypnoSeed(seedTrack);
    const first = pickNextTrack(pool, null, recentlyPlayedRef.current, {
      preferredGenres: [],
      signalState,
      seedTrack,
    }) || pool.find(t => (t.duration || 0) <= 900) || pool[0];
    if (currentTrack) playHistoryRef.current = [currentTrack, ...playHistoryRef.current].slice(0, 50);
    setCurrent(first); setIsPlaying(true); setProgress(0); setIsRadioMode(true); setQueue([]); setImmersive(true);
    setSessionMeta(null);
    if (!sessionStartRef.current) sessionStartRef.current = Date.now();
    logTrackPlay(first);
    showToast(seedTrack ? "Similar mix" : `${mixLaneById(mixLane).label} mix`);
    if (firebaseUser) recordPlay(first.id, profile?.recentTracks || []).catch(()=>{});
  };

  // Play a generated route / night as a queue — session ritual
  const playRoute = (routeTracks, kind = "night") => {
    if (!routeTracks.length) return;
    const first = routeTracks[0];
    const now = Date.now();
    setHypnoSeed(null);
    setCurrent(first); setIsPlaying(true); setProgress(0); setIsRadioMode(false); setImmersive(true);
    setQueue(routeTracks.slice(1));
    sessionStartRef.current = now;
    setSessionMeta({
      tracks: routeTracks,
      startTime: now,
      kind,
      label: "Your playlist",
    });
    logTrackPlay(first);
    showToast(`Playing ${routeTracks.length} songs`);
    if (firebaseUser) recordPlay(first.id, profile?.recentTracks || []).catch(()=>{});
  };

  const playHypnoRadio = (track) => {
    playRadio(track);
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
      const next = pickNextTrack(radioPool(), currentTrack, recentlyPlayedRef.current, radioPickOpts());
      if (next) {
        setCurrent(next); setProgress(0); setIsPlaying(true);
        logTrackPlay(next);
        if (firebaseUser) recordPlay(next.id, profile?.recentTracks || []).catch(()=>{});
      }
      return;
    }
    if (!queue.length) {
      setIsPlaying(false);
      if (sessionMeta) {
        endSessionWithAfterglow(true);
        setImmersive(false);
      }
      return;
    }
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

  // ── Genre preferences (removed from profile UI) ───────────────────────────

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

  const createPlaylist = (name, trackIdOrIds = null) => {
    const ids = Array.isArray(trackIdOrIds)
      ? trackIdOrIds.filter(Boolean)
      : (trackIdOrIds ? [trackIdOrIds] : []);
    const newPl = { id: `pl_${Date.now()}`, name, trackIds: ids };
    savePlaylists([...userPlaylists, newPl]);
    showToast(ids.length ? `Created “${name}”` : `Playlist “${name}” created`);
    return newPl;
  };

  const addToPlaylist = (trackId, playlistId) => {
    const pl = userPlaylists.find(p => p.id === playlistId);
    if (!pl) return;
    if ((pl.trackIds || []).includes(trackId)) {
      showToast(`Already in ${pl.name}`);
      return;
    }
    const updated = userPlaylists.map(p =>
      p.id === playlistId ? { ...p, trackIds: [...(p.trackIds || []), trackId] } : p
    );
    savePlaylists(updated);
    showToast(`Added to ${pl.name}`);
  };

  const removeFromPlaylist = (trackId, playlistId) => {
    const pl = userPlaylists.find(p => p.id === playlistId);
    const updated = userPlaylists.map(p =>
      p.id === playlistId ? { ...p, trackIds: (p.trackIds || []).filter(id => id !== trackId) } : p
    );
    savePlaylists(updated);
    if (pl) showToast(`Removed from ${pl.name}`);
  };

  const deletePlaylist = (playlistId) => {
    savePlaylists(userPlaylists.filter(pl => pl.id !== playlistId));
    showToast("Playlist deleted");
  };

  // ── Playlist context — ⋯ / right-click menu on every track surface
  const playlistCtx = {
    playlists: userPlaylists,
    onCreate:  createPlaylist,
    onAdd:     addToPlaylist,
    onRemove:  removeFromPlaylist,
    onToast:   showToast,
    onResonance: (t) => setResonanceTrack(t),
    onHypnoRadio: (t) => playHypnoRadio(t),
    onLike: (id) => toggleLike(id),
    onOpenArtist: (name) => openArtist(name),
    onOpenAlbum: (track) => openAlbum(track),
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
        // Standard text search (title, artist, genre, album, scene)
        return tracks.filter(t => {
          const sceneHit = matchSceneFromText(q);
          if (sceneHit && trackMatchesScene(t, sceneHit.id)) return true;
          const sceneLabel = (t._scene?.label || displaySceneLabel(t) || "").toLowerCase();
          return [t.title, t.artist, t.genre, t.album || "", String(t.bpm || ""), sceneLabel].some(v => String(v || "").toLowerCase().includes(q));
        });
      })()
    : [];
  const entityHits = searchQuery.length > 1 ? searchEntities(tracks, searchQuery) : { artists: [], albums: [] };

  // ── Loading states ────────────────────────────────────────────────────────
  // Show nothing while we check if someone is already logged in
  if (authLoading) return (
    <div style={{...APP_STYLE, alignItems:"center", justifyContent:"center"}}>
      <BrandMark size={44} />
      <div style={{ fontSize:13, color: color.muted, marginTop:14 }}>Loading…</div>
    </div>
  );

  // Not logged in — show login screen
  if (!firebaseUser) return (
    <LoginScreen
      onSignUp={signUp}
      onLogIn={logIn}
      onGoogleSignIn={signInWithGoogle}
      onPhoneOTP={sendPhoneOTP}
      onVerifyOTP={verifyPhoneOTP}
      onResetPassword={resetPassword}
      authError={authError}
      onClearAuthError={clearAuthError}
    />
  );

  const sessionArc = sessionMeta?.tracks?.length
    ? {
        label: sessionMeta.label || "Session arc",
        energies: sessionMeta.tracks.map(t => t.energy || 5),
        index: Math.max(0, sessionMeta.tracks.findIndex(t => t.id === currentTrack?.id)),
      }
    : (recentlyPlayedRef.current.length > 2
      ? {
          label: signalState?.label || "Listening",
          energies: recentlyPlayedRef.current.slice(0, 12).reverse().map(p => p.energy || 5),
          index: Math.min(11, recentlyPlayedRef.current.slice(0, 12).length - 1),
        }
      : null);

  const handleVolume = (v) => {
    setVolume(v);
    if (audioRef.current && !isCrossfading.current) audioRef.current.volume = v;
  };

  const shuffleQueue = () => {
    const pool = tracks.filter(t => t.id !== currentTrack?.id && (t.duration || 0) <= 900);
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setQueue(shuffled.slice(0, 8));
    setIsRadioMode(false);
    setHypnoSeed(null);
    setSessionMeta(null);
  };

  const listeningOverlays = (
    <>
      {showQueue && (
        <QueueSheet
          queue={queue}
          currentTrack={currentTrack}
          isRadioMode={isRadioMode}
          radioHint={hypnoSeed
            ? `Similar to ${hypnoSeed.title}`
            : explainPick(setNext || currentTrack, {
                signalLabel: signalState?.label,
                preferredGenres: profile?.genres || [],
              })}
          onPlay={(t) => playTrack(t, queue)}
          onClose={() => setShowQueue(false)}
          onClear={() => setQueue([])}
          onShuffle={shuffleQueue}
        />
      )}
      {resonanceTrack && (
        <HypnoVisionOverlay
          sourceTrack={resonanceTrack}
          tracks={tracks}
          onPlay={(t) => playTrack(t, tracks)}
          onClose={() => setResonanceTrack(null)}
        />
      )}
      {showRouteBuilder && (
        <SessionBuilderModal
          tracks={tracks}
          onClose={() => setShowRouteBuilder(false)}
          onPlayRoute={playRoute}
        />
      )}
      {linerTrack && (
        <LinerNotesSheet
          track={linerTrack}
          roomLabel={null}
          onClose={() => setLinerTrack(null)}
          onOpenArtist={(name) => openArtist(name)}
          onOpenAlbum={(t) => openAlbum(t)}
          onOpenRoom={null}
        />
      )}
    </>
  );

  const boothPlayer = immersive && currentTrack ? (
    <ImmersivePlayer
      currentTrack={currentTrack}
      isPlaying={isPlaying}
      onTogglePlay={() => setIsPlaying(p => !p)}
      onSkip={handleSkip}
      onPrev={handlePrev}
      onClose={() => setImmersive(false)}
      signalState={signalState}
      progress={progress}
      duration={duration}
      onSeek={handleSeek}
      onLike={toggleLike}
      volume={volume}
      onVolumeChange={handleVolume}
      onHypno={(t) => setResonanceTrack(t)}
      onHypnoRadio={playHypnoRadio}
      onShowQueue={() => setShowQueue(true)}
      sessionArc={sessionArc}
      isRadioMode={isRadioMode}
      hypnoPocket={!!hypnoSeed}
      roomLabel={null}
      onOpenRoom={null}
      onOpenLiner={(t) => setLinerTrack(t)}
      onOpenArtist={(name) => { setImmersive(false); openArtist(name); }}
    />
  ) : null;

  // ── Inner app (shared between mobile + desktop phone column) ─────────────
  const innerApp = (
    <div style={{ ...APP_STYLE, position:"relative" }}>
      <BgMist color={currentTrack?.color}/>
      {toast && <ToastEl msg={toast}/>}
      {tracksLoading && (
        <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", zIndex:50, textAlign:"center" }}>
          <div style={{ width:56, height:56, borderRadius:14, background: color.surfaceRaised, border:`1px solid ${color.line}`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px", overflow:"hidden" }}><BrandGlyph size={40} showWordmark={false}/></div>
          <div style={{ fontSize:14, color: color.muted }}>Loading your collection…</div>
        </div>
      )}
      <div style={{ flex:1, overflow:"auto", paddingBottom:currentTrack?120:56, zIndex:1, position:"relative" }}>
        {screen==="home"      && !tracksLoading && <HomeScreen tracks={tracks} onPlayRadio={playRadio} onTogglePlay={()=>setIsPlaying(p=>!p)} onPlayTrack={playTrack} currentTrack={currentTrack} isPlaying={isPlaying} onLike={toggleLike} isRadioMode={isRadioMode} playlistCtx={playlistCtx} signalLabel={signalState?.label} userPlaylists={userPlaylists} onCreatePlaylist={createPlaylist} onDeletePlaylist={deletePlaylist} onMakePlaylist={()=>setShowRouteBuilder(true)} mixLane={mixLane} onMixLaneChange={setMixLane}/>}
        {screen==="search"    && <SearchScreen query={searchQuery} setQuery={setSearch} results={searchResults} onPlay={t=>playTrack(t,tracks)} onLike={toggleLike} currentTrack={currentTrack} isPlaying={isPlaying} playlistCtx={playlistCtx} entityHits={entityHits} onOpenArtist={openArtist} onOpenAlbum={(slug)=>openAlbum(slug)}/>}
        {screen==="favorites" && <FavoritesScreen tracks={tracks} preferredGenres={user.genres} onPlay={t=>{setIsRadioMode(false);playTrack(t,tracks);}} onLike={toggleLike} currentTrack={currentTrack} isPlaying={isPlaying} playlistCtx={playlistCtx}/>}
        {screen==="artist"    && !tracksLoading && (
          <ArtistPage
            artist={findArtist(tracks, artistSlug)}
            onBack={() => setScreen("search")}
            onPlay={(t, pool) => playTrack(t, pool)}
            onOpenAlbum={(slug) => openAlbum(slug)}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            onLike={toggleLike}
            AlbumArt={AlbumArt}
            TrackRow={TrackRow}
            playlistCtx={playlistCtx}
          />
        )}
        {screen==="album"     && !tracksLoading && (
          <AlbumPage
            album={findAlbum(tracks, albumSlug)}
            onBack={() => setScreen("search")}
            onPlay={(t, pool) => playTrack(t, pool)}
            onOpenArtist={(slug) => openArtist(slug)}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            onLike={toggleLike}
            AlbumArt={AlbumArt}
            TrackRow={TrackRow}
            playlistCtx={playlistCtx}
          />
        )}
        {screen==="profile"   && <ProfileScreen user={user} tracks={tracks} onLogout={logOut}/>}
        {screen==="admin"     && <AdminScreen tracks={tracks} setTracks={setTracks} tab={adminTab} setTab={setAdminTab} editTrack={editTrack} setEditTrack={setEditTrack} showToast={showToast}/>}
      </div>
      {currentTrack && !immersive && (
        <NowPlayingBar track={currentTrack} isPlaying={isPlaying} progress={progress} duration={duration}
          onTogglePlay={()=>setIsPlaying(p=>!p)} onSkip={handleSkip} onPrev={handlePrev}
          onLike={()=>toggleLike(currentTrack.id)} onSeek={handleSeek}
          repeat={repeat} setRepeat={setRepeat} isRadioMode={isRadioMode}
          hypnoPocket={!!hypnoSeed}
          onOpen={()=>setImmersive(true)} onShowQueue={()=>setShowQueue(true)} playlistCtx={playlistCtx}/>
      )}
      <BottomNav screen={screen} setScreen={setScreen} showAdmin={firebaseUser?.uid === ADMIN_UID} hasPlayer={!!currentTrack && !immersive}/>
      {boothPlayer}
      {listeningOverlays}
    </div>
  );

  // ── Mobile: render as-is ─────────────────────────────────────────────────
  if (!isDesktop) return innerApp;

  // ── Desktop: 3-column shell ───────────────────────────────────────────────
  const NAV_TOP = [
    { id:"home",      icon:"home",   label:"Home" },
    { id:"favorites", icon:"dig",    label:"Browse" },
    { id:"search",    icon:"search", label:"Search" },
  ];
  const NAV_BOTTOM = [];

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
  const glowRgb = currentTrack ? hexToRgbStr(currentTrack.color) : "234,231,220";

  return (
    <div style={{ display:"flex", height:"100vh", background: color.canvas, overflow:"hidden", fontFamily: font }}>

      {/* ── LEFT NAV RAIL ─────────────────────────────────────────────── */}
      <div style={{ width:72, flexShrink:0, background: color.surfaceSolid, borderRight:`1px solid ${color.line}`, display:"flex", flexDirection:"column", alignItems:"center", padding:"16px 0 16px" }}>
        {/* Logo */}
        <div style={{ marginBottom:16 }}>
          <BrandGlyph size={28}/>
        </div>

        {/* Top nav: Home, Discover, Session */}
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
        <div style={{
          position:"relative", zIndex:1,
          maxWidth: (screen==="home" || screen==="favorites" || screen==="artist" || screen==="album") ? "none" : 960,
          margin:"0 auto",
          padding: (screen==="home" || screen==="favorites" || screen==="artist" || screen==="album")
            ? `0 0 ${currentTrack?120:24}px`
            : `24px 32px ${currentTrack?120:24}px`,
        }}>
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
              {screen==="home"      && <HomeScreen tracks={tracks} onPlayRadio={playRadio} onTogglePlay={()=>setIsPlaying(p=>!p)} onPlayTrack={playTrack} currentTrack={currentTrack} isPlaying={isPlaying} onLike={toggleLike} isRadioMode={isRadioMode} playlistCtx={playlistCtx} signalLabel={signalState?.label} userPlaylists={userPlaylists} onCreatePlaylist={createPlaylist} onDeletePlaylist={deletePlaylist} onMakePlaylist={()=>setShowRouteBuilder(true)} mixLane={mixLane} onMixLaneChange={setMixLane}/>}
              {screen==="search"    && <SearchScreen query={searchQuery} setQuery={setSearch} results={searchResults} onPlay={t=>playTrack(t,tracks)} onLike={toggleLike} currentTrack={currentTrack} isPlaying={isPlaying} playlistCtx={playlistCtx} entityHits={entityHits} onOpenArtist={openArtist} onOpenAlbum={(slug)=>openAlbum(slug)}/>}
              {screen==="favorites" && <FavoritesScreen tracks={tracks} preferredGenres={user.genres} onPlay={t=>{setIsRadioMode(false);playTrack(t,tracks);}} onLike={toggleLike} currentTrack={currentTrack} isPlaying={isPlaying} playlistCtx={playlistCtx}/>}
              {screen==="artist"    && (
                <ArtistPage
                  artist={findArtist(tracks, artistSlug)}
                  onBack={() => setScreen("search")}
                  onPlay={(t, pool) => playTrack(t, pool)}
                  onOpenAlbum={(slug) => openAlbum(slug)}
                  currentTrack={currentTrack}
                  isPlaying={isPlaying}
                  onLike={toggleLike}
                  AlbumArt={AlbumArt}
                  TrackRow={TrackRow}
                  playlistCtx={playlistCtx}
                />
              )}
              {screen==="album"     && (
                <AlbumPage
                  album={findAlbum(tracks, albumSlug)}
                  onBack={() => setScreen("search")}
                  onPlay={(t, pool) => playTrack(t, pool)}
                  onOpenArtist={(slug) => openArtist(slug)}
                  currentTrack={currentTrack}
                  isPlaying={isPlaying}
                  onLike={toggleLike}
                  AlbumArt={AlbumArt}
                  TrackRow={TrackRow}
                  playlistCtx={playlistCtx}
                />
              )}
              {screen==="profile"   && <ProfileScreen user={user} tracks={tracks} onLogout={logOut}/>}
                            {screen==="admin"     && <AdminScreen tracks={tracks} setTracks={setTracks} tab={adminTab} setTab={setAdminTab} editTrack={editTrack} setEditTrack={setEditTrack} showToast={showToast}/>}
            </>
          )}
        </div>
        </>
        {/* Desktop mini-player — flat station strip */}
        {currentTrack && !immersive && (
          <div style={{ position:"fixed", bottom:0, left:72, right:320, zIndex:80 }}>
            <div onClick={()=>setImmersive(true)} style={{
              background: color.station,
              borderTop:`1px solid ${color.lineStrong}`,
              display:"flex", flexDirection:"column",
              cursor:"pointer", overflow:"hidden", position:"relative",
            }}>
              <div aria-hidden="true" style={{ height:2, background:"rgba(232,236,240,0.08)", width:"100%" }}>
                <div style={{ height:"100%", width:`${duration?((progress/duration)*100):0}%`, background: color.accent, transition:"width 1s linear" }}/>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 18px" }}>
                <div style={{ width:44, height:44, overflow:"hidden", flexShrink:0 }}><AlbumArt track={currentTrack} size={44} borderRadius={0}/></div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:14, fontWeight:650, color: color.ink, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", letterSpacing:-0.2, fontFamily: fontDisplay }}>
                    {isRadioMode && (
                      <span style={{
                        display:"inline-block", width:6, height:6, borderRadius:"50%",
                        background: color.accent, marginRight:8, verticalAlign:"middle",
                        boxShadow: isPlaying ? `0 0 0 3px ${color.accentSoft}` : "none",
                        animation: isPlaying ? "breathe 2s ease-in-out infinite" : "none",
                      }}/>
                    )}
                    {currentTrack.title}
                  </div>
                  <div style={{ fontSize:11, color: color.muted, marginTop:2 }}>
                    {isRadioMode ? `On air · ${currentTrack.artist}` : currentTrack.artist}
                  </div>
                  <div style={{ marginTop:5 }}>
                    <BoothHud track={currentTrack} size="sm"/>
                  </div>
                </div>
                <span style={{ fontSize:10, color: color.faint, fontVariantNumeric:"tabular-nums", flexShrink:0 }}>{fmtTime(progress)}</span>
                <button onClick={e=>{e.stopPropagation();onLikeToggle();}} style={{ background:"none",border:"none",cursor:"pointer",color:currentTrack.liked?color.accent:color.faint,padding:4 }}><Icon name={currentTrack.liked?"heart":"heartempty"} size={16}/></button>
                <button className="play-primary" onClick={e=>{e.stopPropagation();setIsPlaying(p=>!p);}} style={{ background: color.accent,border:"none",borderRadius: radius.sm,width:36,height:36,cursor:"pointer",color: color.onAccent,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                  <Icon name={isPlaying?"pause":"play"} size={15}/>
                </button>
                <button onClick={e=>{e.stopPropagation();handleSkip();}} style={{ background:"none",border:"none",cursor:"pointer",color: color.muted,padding:4 }}><Icon name="skip" size={16}/></button>
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
            <div style={{ position:"relative", width:"100%", aspectRatio:"1", overflow:"hidden", marginBottom:4, boxShadow:`0 16px 40px rgba(0,0,0,0.4)` }}>
              <img src={currentTrack.albumCover||"/covers/default.jpg"} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e=>{e.target.src="/covers/default.jpg";}}/>
            </div>
            {/* Progress bar under art */}
            <div style={{ height:3, background: color.line, borderRadius:2, marginBottom:12, overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${duration?((progress/duration)*100):0}%`, background: color.accent, borderRadius:2, transition:"width 1s linear" }}/>
            </div>
            {/* Track info */}
            <div key={currentTrack.id} style={{ position:"relative", animation: "trackSwap 0.35s cubic-bezier(0.22,1,0.36,1) both" }}>
              <div style={{ fontSize:15, fontWeight:650, color: color.ink, letterSpacing:-0.3, marginBottom:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontFamily: fontDisplay }}>{currentTrack.title}</div>
              <div style={{ fontSize:12, color: color.muted, marginBottom:10, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{currentTrack.artist}</div>
              <BoothHud track={currentTrack} size="sm"/>
              {signalState?.label && (
                <div style={{ marginTop:10, fontSize:10, fontWeight:700, letterSpacing:1.2, color: color.faint, textTransform:"uppercase", fontFamily: fontMono }}>
                  {signalState.label}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ padding:"60px 16px", textAlign:"center" }}>
            <BrandGlyph size={28}/>
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
                  border: currentTrack?.id===t.id ? `1px solid ${color.accentSoft}` : `1px solid ${color.line}`,
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

      {/* Listening overlays + Booth */}
      {listeningOverlays}
      {boothPlayer}
    </div>
  );

  function onLikeToggle() { if(currentTrack) toggleLike(currentTrack.id); }
}

