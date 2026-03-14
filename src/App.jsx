import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth }                                  from "./useAuth";
import { toggleLike as fbToggleLike, recordPlay, saveGenres } from "./useUserData";
import { collection, getDocs, query, orderBy, doc, updateDoc } from "firebase/firestore";
import { db }                                       from "./firebase";
import vLogo                                         from "./v-logo.png";

const injectStyles = () => {
  if (document.getElementById("verse-app-global-styles")) return;
  const s = document.createElement("style");
  s.id = "verse-app-global-styles";
  s.textContent = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    :root { --font: -apple-system, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif; --accent: #8B95A7; }
    body { font-family: var(--font); background: linear-gradient(180deg, #eef2f7 0%, #e7ecf3 100%); color:#111827; }
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
    @keyframes floaty      { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
    @keyframes glow-shift  { 0%,100%{opacity:0.5;transform:scale(1)} 50%{opacity:0.8;transform:scale(1.06)} }
    @keyframes soft-in     { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
    input:focus { outline: none; }
    button { transition: transform 180ms cubic-bezier(0.22,1,0.36,1), opacity 180ms cubic-bezier(0.22,1,0.36,1), background 180ms cubic-bezier(0.22,1,0.36,1), box-shadow 180ms cubic-bezier(0.22,1,0.36,1), border-color 180ms cubic-bezier(0.22,1,0.36,1), color 180ms cubic-bezier(0.22,1,0.36,1), filter 180ms cubic-bezier(0.22,1,0.36,1); font-family: var(--font); }
    img { transition: transform 240ms cubic-bezier(0.22,1,0.36,1), opacity 180ms cubic-bezier(0.22,1,0.36,1), filter 180ms cubic-bezier(0.22,1,0.36,1), box-shadow 180ms cubic-bezier(0.22,1,0.36,1); }
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

const TOKENS = {
  space: { xs:4, sm:8, md:12, lg:16, xl:24 },
  radius: { sm:12, md:16, lg:20, xl:24, pill:999 },
  blur: { panel:'blur(28px) saturate(180%)', active:'blur(20px) saturate(170%)', modal:'blur(34px) saturate(190%)' },
  border: { soft:'1px solid rgba(255,255,255,0.62)', strong:'1px solid rgba(255,255,255,0.82)', ghost:'1px solid rgba(255,255,255,0.24)' },
  shadow: {
    panel:'0 20px 44px rgba(98,132,190,0.10), inset 0 1px 0 rgba(255,255,255,0.82)',
    active:'0 16px 30px rgba(75,140,255,0.18), inset 0 1px 0 rgba(255,255,255,0.84)',
    modal:'0 28px 80px rgba(66,88,128,0.18), inset 0 1px 0 rgba(255,255,255,0.88)'
  },
  text: { primary:'#0F172A', secondary:'#667085', tertiary:'#98A2B3', accent:'#4B6FA4' },
  accent: { base:'#79C3FF', strong:'#4B8CFF' },
  artwork: { rail:36, row:44, mini:44, queue:40, panel:216 },
  motion: { fast:'180ms cubic-bezier(0.22,1,0.36,1)', med:'240ms cubic-bezier(0.22,1,0.36,1)', slow:'320ms cubic-bezier(0.22,1,0.36,1)' },
};

const glassSurface = (level='panel') => ({
  background: level === 'active'
    ? 'linear-gradient(180deg, rgba(255,255,255,0.78), rgba(255,255,255,0.40))'
    : level === 'modal'
      ? 'linear-gradient(180deg, rgba(255,255,255,0.84), rgba(255,255,255,0.46))'
      : 'linear-gradient(180deg, rgba(255,255,255,0.68), rgba(255,255,255,0.32))',
  border: level === 'active' ? TOKENS.border.strong : TOKENS.border.soft,
  boxShadow: TOKENS.shadow[level] || TOKENS.shadow.panel,
  backdropFilter: TOKENS.blur[level] || TOKENS.blur.panel,
});

function GlassPanel({ children, level='panel', style={}, onClick }) {
  return <div onClick={onClick} style={{ ...glassSurface(level), borderRadius: TOKENS.radius.xl, ...style }}>{children}</div>;
}

function IconButton({ icon, label, active=false, onClick, size=40, subtle=false, style={}, title }) {
  return (
    <button
      aria-label={label}
      title={title || label}
      onClick={onClick}
      style={{
        width:size, height:size, borderRadius:Math.round(size*0.34),
        display:'inline-flex', alignItems:'center', justifyContent:'center',
        background: active ? 'linear-gradient(180deg, rgba(121,195,255,0.26), rgba(75,140,255,0.16))' : (subtle ? 'rgba(255,255,255,0.34)' : 'transparent'),
        color: active ? TOKENS.text.accent : TOKENS.text.secondary,
        border: active || subtle ? TOKENS.border.soft : '1px solid transparent',
        boxShadow: active ? TOKENS.shadow.active : 'none',
        backdropFilter: active || subtle ? TOKENS.blur.active : 'none',
        transition: `transform ${TOKENS.motion.fast}, background ${TOKENS.motion.fast}, box-shadow ${TOKENS.motion.fast}, color ${TOKENS.motion.fast}`,
        cursor:'pointer', ...style
      }}
    >
      <Icon name={icon} size={Math.max(16, Math.floor(size*0.42))}/>
    </button>
  );
}

function Pill({ children, accent=false, style={} }) {
  return <span style={{ fontSize:10, fontWeight:700, padding:'4px 8px', borderRadius:TOKENS.radius.pill, color: accent ? TOKENS.text.accent : TOKENS.text.secondary, background: accent ? 'rgba(75,111,164,0.10)' : 'rgba(255,255,255,0.50)', border: TOKENS.border.soft, ...style }}>{children}</span>;
}

function RailNav({ items, screen, setScreen, showAdmin }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:TOKENS.space.sm, flex:1, alignItems:'center' }}>
      {items.map(item => (
        <div key={item.id} style={{ position:'relative' }}>
          <IconButton icon={item.icon} label={item.label} title={item.label} active={screen===item.id} onClick={()=>setScreen(item.id)} size={48} subtle={screen!==item.id} />
          <div style={{ position:'absolute', left:'calc(100% + 10px)', top:'50%', transform:'translateY(-50%)', opacity:screen===item.id?1:0, pointerEvents:'none', transition:`opacity ${TOKENS.motion.fast}` }}>
            <Pill accent>{item.label}</Pill>
          </div>
        </div>
      ))}
      {showAdmin && (
        <div style={{ position:'relative' }}>
          <IconButton icon='settings' label='Admin' title='Admin' active={screen==='admin'} onClick={()=>setScreen('admin')} size={48} subtle={screen!=='admin'} />
          <div style={{ position:'absolute', left:'calc(100% + 10px)', top:'50%', transform:'translateY(-50%)', opacity:screen==='admin'?1:0, pointerEvents:'none', transition:`opacity ${TOKENS.motion.fast}` }}>
            <Pill accent>Admin</Pill>
          </div>
        </div>
      )}
    </div>
  );
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
          background: i < level ? "#8B95A7" : "#E5E5EA",
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
    dots:       <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>,
    wave:       <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 12h2m2-4v8m4-10v12m4-7v2m4-5v10"/></svg>,
    disc:       <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.5"/></svg>,
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

  useEffect(() => {
    if (!tracks.length) {
      setIdx(0);
      return;
    }
    if (idx > tracks.length - 1) {
      setIdx(tracks.length - 1);
    }
  }, [tracks.length, idx]);

  if (!tracks.length) {
    return (
      <GlassPanel level='panel' style={{ minHeight: 236, padding: 20, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12 }}>
        <BrandGlyph size={34} />
        <div style={{ fontSize:14, fontWeight:700, color:TOKENS.text.primary }}>No tracks yet</div>
        <div style={{ fontSize:12, color:TOKENS.text.secondary, textAlign:'center', maxWidth:220 }}>Add tracks in Firestore and the home feed will show up here.</div>
      </GlassPanel>
    );
  }

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
            background:"#8B95A7",
            border:"none",
            color:"#FFFFFF", cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow:"0 4px 16px rgba(139,149,167,0.4)",
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
              background: i===idx?"#8B95A7":"#E5E5EA",
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
        ? `linear-gradient(135deg, rgba(139,149,167,0.08) 0%, #FFFFFF 100%)`
        : "#FFFFFF",
      backdropFilter:"blur(28px) saturate(1.6)",
      border:`1px solid ${isRadioMode?"rgba(139,149,167,0.25)":"rgba(60,60,67,0.12)"}`,
      borderRadius:20, padding:"20px 18px", transition:"all 0.3s",
      marginBottom:24, position:"relative", overflow:"hidden",
      boxShadow: isRadioMode
        ? "0 4px 24px rgba(139,149,167,0.1)"
        : "0 1px 8px rgba(0,0,0,0.06)",
    }}>
      {/* Background glow when on air */}
      {isRadioMode && <div style={{ position:"absolute", top:-40, right:-40, width:160, height:160, borderRadius:"50%", background:"radial-gradient(circle, rgba(139,149,167,0.06) 0%, transparent 70%)", pointerEvents:"none" }}/>}

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {/* Live dot */}
          <div style={{ position:"relative", width:10, height:10, flexShrink:0 }}>
            <div style={{ position:"absolute", inset:0, borderRadius:"50%", background: isRadioMode?"#8B95A7":"#AEAEB2", animation:isRadioMode&&isPlaying?"breathe 1.8s ease-in-out infinite":"none" }}/>
            {isRadioMode&&isPlaying&&<div style={{ position:"absolute", inset:-4, borderRadius:"50%", border:"1px solid rgba(139,149,167,0.5)", animation:"pulse-ring 1.8s ease-out infinite" }}/>}
          </div>
          <span style={{ fontSize:11, fontWeight:800, letterSpacing:2, color:isRadioMode&&isPlaying?"#8B95A7":"#8E8E93", textTransform:"uppercase" }}>
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
              {currentTrack.camelot&&<span style={{ fontSize:10, fontWeight:600, color:"#8B95A7", background:"rgba(139,149,167,0.08)", padding:"2px 6px", borderRadius:4, marginTop:4, display:"inline-block" }}>{currentTrack.camelot}</span>}
            </div>
          </div>
          {/* Energy bar + play/pause button row — button on left */}
          <div style={{ marginTop:12, display:"flex", alignItems:"center", gap:12 }}>
            <button onClick={e=>{e.stopPropagation();onTogglePlay();}} style={{ width:40, height:40, borderRadius:"50%", background:"#8B95A7", border:"none", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, color:"#FFFFFF", cursor:"pointer" }}>
              <Icon name={isPlaying?"pause":"play"} size={18}/>
            </button>
            <EnergyBar level={currentTrack.energy} color={currentTrack.color} size="lg"/>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ marginBottom:10, display:"flex", justifyContent:"flex-start" }}><BrandGlyph size={34} /></div>
          <button onClick={e=>{e.stopPropagation();onPlay();}} style={{ width:48, height:48, borderRadius:"50%", background:"#8B95A7", border:"none", display:"flex", alignItems:"center", justifyContent:"center", color:"#FFFFFF", cursor:"pointer" }}>
            <Icon name="play" size={22}/>
          </button>
        </div>
      )}

      {/* Animated waveform */}
      <div style={{ position:"absolute", right:18, bottom:18, display:"flex", gap:2.5, alignItems:"flex-end", opacity:isRadioMode&&isPlaying?0.45:0.12 }}>
        {[4,7,5,9,6,4,8,5,7,4].map((h,i)=>(
          <div key={i} style={{ width:2.5, height:h*1.6, borderRadius:2, background:"#8B95A7", animation:isRadioMode&&isPlaying?`pulse ${0.55+i*0.07}s ease-in-out infinite alternate`:"none" }}/>
        ))}
      </div>
    </div>
  );
}

// ─── PLAYLIST MENU CONTEXT ────────────────────────────────────────────────────
// Passed down from App so every TrackRow can access playlists + handlers
const PlaylistCtx = { playlists:[], onCreate:()=>{}, onAdd:()=>{}, onRemove:()=>{}, activePlaylistId:null };

// ─── TRACK ROW ────────────────────────────────────────────────────────────────
function TrackRow({ track, onPlay, active, isPlaying, onLike, extraAction, playlistCtx, activePlaylistId, density="comfortable" }) {
  const [hover, setHover]         = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);
  const [newPlName, setNewPlName] = useState("");
  const [showNewPl, setShowNewPl] = useState(false);
  const ctx = playlistCtx || PlaylistCtx;
  const compact = density === "compact";
  const art = compact ? 40 : TOKENS.artwork.row;
  const padY = compact ? TOKENS.space.sm : TOKENS.space.md;

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
        style={{
          display:"grid", gridTemplateColumns:`${art}px minmax(0,1fr) auto auto`, alignItems:"center", columnGap:TOKENS.space.md,
          padding:`${padY}px ${TOKENS.space.md}px`, borderRadius:TOKENS.radius.lg, cursor:"pointer", marginBottom:TOKENS.space.sm,
          ...glassSurface(active ? 'active' : hover ? 'panel' : 'panel'),
          background: active ? glassSurface('active').background : hover ? 'linear-gradient(180deg, rgba(255,255,255,0.58), rgba(255,255,255,0.28))' : 'rgba(255,255,255,0.22)',
          border: active ? TOKENS.border.strong : hover ? TOKENS.border.soft : '1px solid transparent',
          boxShadow: active ? TOKENS.shadow.active : hover ? TOKENS.shadow.panel : 'none',
          transform: hover ? "translateY(-1px)" : "translateY(0)",
        }}>
        <div style={{ width:art, height:art, borderRadius:compact?12:14, overflow:"hidden", flexShrink:0, position:"relative", boxShadow:hover||active?"0 8px 18px rgba(40,55,90,0.12)":"0 2px 6px rgba(0,0,0,0.06)" }}>
          <AlbumArt track={track} size={art} borderRadius={0}/>
          {(active||hover)&&<div style={{ position:"absolute", inset:0, background:(active&&isPlaying)?"rgba(8,10,16,0.34)":"rgba(8,10,16,0.18)", display:"flex", alignItems:"center", justifyContent:"center", opacity:(active||hover)?1:0 }}><Icon name={active&&isPlaying?"pause":"play"} size={14}/></div>}
        </div>
        <div style={{ minWidth:0 }}>
          <div style={{ fontSize:compact?13:14, lineHeight:1.1, fontWeight:active?650:560, letterSpacing:-0.24, color:active?TOKENS.text.accent:TOKENS.text.primary, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{track.title}</div>
          <div style={{ fontSize:compact?11:12, color:TOKENS.text.secondary, marginTop:4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{track.artist}</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:TOKENS.space.sm, justifySelf:"end", opacity:hover||active?1:0.9 }}>
          {track.camelot&&<Pill accent>{track.camelot}</Pill>}
          <div style={{ opacity:0.9 }}><EnergyBar level={track.energy} color={track.color}/></div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:TOKENS.space.xs, justifySelf:"end" }}>
          {onLike&&<IconButton title={track.liked?"Unlike":"Like"} label={track.liked?"Unlike":"Like"} icon={track.liked?"heart":"heartempty"} active={!!track.liked} subtle onClick={e=>{e.stopPropagation();onLike(track.id);}} size={compact?34:36} style={{ color:track.liked?TOKENS.text.accent:TOKENS.text.tertiary }} />}
          <IconButton title="More" label="More" icon="dots" subtle active={menuOpen} onClick={e=>{e.stopPropagation();setMenuOpen(o=>!o);setShowNewPl(false);}} size={compact?34:36} style={{ color:TOKENS.text.tertiary }} />
          {extraAction||null}
        </div>
      </div>

      {menuOpen && (
        <GlassPanel level='modal' style={{ position:"absolute", right:8, top:52, zIndex:50, padding:"8px 0", minWidth:220 }}>
          {ctx.playlists.length > 0 && (
            <>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.1, color:TOKENS.text.tertiary, padding:"6px 14px", textTransform:"uppercase" }}>Save to</div>
              {ctx.playlists.map(pl => (
                <button key={pl.id} onClick={()=>handleAddTo(pl.id)} style={{ display:"block", width:"100%", textAlign:"left", background:"none", border:"none", color:TOKENS.text.primary, fontSize:14, padding:"11px 14px", cursor:"pointer" }}>{pl.name}</button>
              ))}
              <div style={{ height:1, background:"rgba(148,163,184,0.18)", margin:"6px 14px" }}/>
            </>
          )}

          {showNewPl ? (
            <div style={{ padding:"8px 12px" }}>
              <input autoFocus value={newPlName} onChange={e=>setNewPlName(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")handleCreateAndAdd();if(e.key==="Escape")setShowNewPl(false);}} placeholder="New playlist" style={{ ...INPUT_ST, marginBottom:8, fontSize:13, padding:'10px 12px', borderRadius:12 }}/>
              <div style={{ display:"flex", gap:6 }}>
                <button onClick={handleCreateAndAdd} style={{ ...BTN_PRIMARY, flex:1, borderRadius:12, fontSize:13, padding:'9px 0' }}>Add</button>
                <button onClick={()=>setShowNewPl(false)} style={{ ...BTN_SECONDARY, flex:1, borderRadius:12, fontSize:13, padding:'9px 0' }}>Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={()=>setShowNewPl(true)} style={{ display:"block", width:"100%", textAlign:"left", background:"none", border:"none", color:TOKENS.text.accent, fontSize:14, padding:"11px 14px", cursor:"pointer", fontWeight:700 }}>+ New playlist</button>
          )}

          {activePlaylistId && (
            <>
              <div style={{ height:1, background:"rgba(148,163,184,0.18)", margin:"6px 14px" }}/>
              <button onClick={()=>{ctx.onRemove(track.id, activePlaylistId);setMenuOpen(false);}} style={{ display:"block", width:"100%", textAlign:"left", background:"none", border:"none", color:"#DC2626", fontSize:14, padding:"11px 14px", cursor:"pointer" }}>Remove from playlist</button>
            </>
          )}
        </GlassPanel>
      )}
    </div>
  );
}

function BrandGlyph({ size=84 }) {
  return (
    <img
      src={vLogo}
      alt="V"
      style={{
        width:size,
        height:size,
        objectFit:"contain",
        display:"block",
        filter:"drop-shadow(0 10px 28px rgba(12,18,32,0.12))",
      }}
    />
  );
}

function GoogleGlyph({ size=20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.74 1.22 9.26 3.6l6.9-6.9C35.95 2.28 30.4 0 24 0 14.62 0 6.53 5.38 2.56 13.22l8.04 6.24C12.53 13.53 17.77 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.14-3.09-.4-4.55H24v9.02h12.94c-.56 3-2.25 5.54-4.8 7.23l7.73 5.99C44.38 38.1 46.98 31.9 46.98 24.55z"/>
      <path fill="#FBBC05" d="M10.6 28.54a14.5 14.5 0 0 1 0-9.08l-8.04-6.24A23.95 23.95 0 0 0 0 24c0 3.86.92 7.51 2.56 10.78l8.04-6.24z"/>
      <path fill="#34A853" d="M24 48c6.4 0 11.77-2.11 15.69-5.76l-7.73-5.99c-2.15 1.44-4.9 2.3-7.96 2.3-6.23 0-11.47-4.03-13.4-9.96l-8.04 6.24C6.53 42.62 14.62 48 24 48z"/>
    </svg>
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
    <div style={APP_STYLE}>
      <BgMist color="#7FB6FF"/>
      <div style={{ position:"absolute", inset:0, background:"radial-gradient(circle at 20% 10%, rgba(127,182,255,0.18), transparent 28%), radial-gradient(circle at 80% 18%, rgba(162,121,255,0.14), transparent 24%), linear-gradient(180deg, rgba(244,247,252,0.86) 0%, rgba(236,241,248,0.82) 42%, rgba(232,238,246,0.88) 100%)", backdropFilter:"blur(40px) saturate(145%)" }} />
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100%", gap:26, padding:24, position:"relative", zIndex:2 }}>
        <div style={{ textAlign:"center", maxWidth:420 }}>
          <div style={{ width:110, height:110, borderRadius:32, margin:"0 auto 8px", background:"linear-gradient(135deg, rgba(255,255,255,0.5), rgba(255,255,255,0.18) 45%, rgba(180,206,255,0.14) 100%)", border:"1px solid rgba(255,255,255,0.48)", boxShadow:"0 24px 70px rgba(98,132,190,0.14), inset 0 1px 0 rgba(255,255,255,0.75), 0 0 50px rgba(127,182,255,0.08)", display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(32px) saturate(180%)" }}>
            <BrandGlyph size={82} />
          </div>
        </div>

        <div style={{ width:"100%", maxWidth:380, display:"flex", flexDirection:"column", gap:14, padding:18, borderRadius:28, background:"linear-gradient(180deg, rgba(255,255,255,0.62), rgba(255,255,255,0.34))", border:"1px solid rgba(255,255,255,0.58)", boxShadow:"0 24px 80px rgba(91,116,162,0.12), inset 0 1px 0 rgba(255,255,255,0.72), 0 0 40px rgba(127,182,255,0.06)", backdropFilter:"blur(34px) saturate(180%)" }}>
          <div style={{ display:"flex", background:"rgba(255,255,255,0.08)", borderRadius:16, padding:4, gap:4, border:"1px solid rgba(255,255,255,0.14)", backdropFilter:"blur(20px)" }}>
            {["login","signup"].map(m => (
              <button key={m} onClick={() => { setMode(m); resetMessages(); }} style={{ flex:1, padding:"10px 0", borderRadius:12, border:"none", cursor:"pointer", fontSize:14, fontWeight:600, background:mode===m?"linear-gradient(180deg, rgba(109,188,255,0.92), rgba(78,141,255,0.92))":"transparent", color:mode===m?"#FFFFFF":"rgba(37,52,78,0.64)", boxShadow:mode===m?"0 16px 36px rgba(76,126,255,0.32)":"none" }}>
                {m === "login" ? "Log In" : "Sign Up"}
              </button>
            ))}
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:8 }}>
            {[
              { id:"email", label:"Email" },
              { id:"google", label:"Google", icon:true },
              { id:"phone", label:"Phone" },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => switchMethod(item.id)}
                title={item.label}
                aria-label={item.label}
                style={{
                  border:"1px solid rgba(255,255,255,0.6)",
                  background:authMethod===item.id?"rgba(109,188,255,0.16)":"rgba(255,255,255,0.08)",
                  color:authMethod===item.id?"#34517E":"rgba(37,52,78,0.66)",
                  borderRadius:14,
                  padding:"10px 12px",
                  fontWeight:600,
                  cursor:"pointer",
                  minHeight:46,
                  display:'flex',
                  alignItems:'center',
                  justifyContent:'center',
                  gap:8,
                }}
              >
                {item.id === "google" ? <GoogleGlyph size={18} /> : item.label}
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

          {authMethod === "google" && (
            <>
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                title="Continue with Google"
                aria-label="Continue with Google"
                style={{
                  ...BTN_PRIMARY,
                  opacity:loading ? 0.7 : 1,
                  width:'100%',
                  minHeight:54,
                  display:'flex',
                  alignItems:'center',
                  justifyContent:'center',
                  gap:10,
                }}
              >
                {loading ? <span style={{ fontSize:14, fontWeight:700 }}>…</span> : <GoogleGlyph size={22} />}
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

function HomeScreen({ tracks, onPlayRadio, onTogglePlay, onPlayTrack, currentTrack, isPlaying, onLike, isRadioMode, playlistCtx }) {
  const hour = new Date().getHours();
  // Sort tracks by playCount descending for Top Tracks section
  const topTracks = [...tracks].filter(t=>(t.duration||0)<=900).sort((a,b) => (b.playCount||0) - (a.playCount||0)).slice(0,8);
  // Mixtapes: tracks with duration > 900 seconds (15 minutes)
  const mixtapes  = tracks.filter(t => (t.duration||0) > 900).sort((a,b) => (b.duration||0) - (a.duration||0));
  return (
    <div>
      <div style={{ padding:"18px 16px 10px", display:"flex", justifyContent:"center", alignItems:"center" }}>
        <div style={{ width:52, height:52, borderRadius:18, background:"linear-gradient(135deg, rgba(255,255,255,0.58), rgba(255,255,255,0.2))", border:"1px solid rgba(255,255,255,0.58)", boxShadow:"0 18px 40px rgba(90,110,150,0.12), inset 0 1px 0 rgba(255,255,255,0.8)", display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(24px) saturate(180%)" }}>
          <BrandGlyph size={30} />
        </div>
      </div>

      {/* Radio card — top of page */}
      <div style={{ padding:"0 16px", marginBottom:8 }}>
        <DeepCutsCard onPlay={onPlayRadio} onTogglePlay={onTogglePlay} currentTrack={isRadioMode?currentTrack:null} isPlaying={isPlaying} isRadioMode={isRadioMode}/>
      </div>

            <div style={{ padding:"8px 16px 0" }} />
      <div style={{ marginBottom:26, display:"flex", justifyContent:"center" }}>
        <div style={{ width:"100%", maxWidth:336, borderRadius:22, overflow:"hidden", background:"linear-gradient(180deg, rgba(255,255,255,0.5), rgba(255,255,255,0.22))", border:"1px solid rgba(255,255,255,0.62)", boxShadow:"0 20px 46px rgba(98,132,190,0.08)", backdropFilter:"blur(24px) saturate(170%)" }}>
          <VerseFlipper tracks={tracks.filter(t=>(t.duration||0)<=900)} onSelect={t=>onPlayTrack(t,tracks)} currentTrack={currentTrack} isPlaying={isPlaying}/>
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
                  background: currentTrack?.id===t.id ? "rgba(139,149,167,0.06)" : "#FFFFFF",
                  border: currentTrack?.id===t.id ? "0.5px solid rgba(139,149,167,0.2)" : "0.5px solid rgba(60,60,67,0.12)",
                  transition:"all 0.15s" }}>
                <div style={{ width:48, height:48, borderRadius:9, overflow:"hidden", flexShrink:0, position:"relative" }}>
                  <AlbumArt track={t} size={48} borderRadius={0}/>
                  {currentTrack?.id===t.id && isPlaying && (
                    <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <div style={{ width:7, height:7, borderRadius:"50%", background:"#8B95A7", animation:"pulse 1s ease-in-out infinite" }}/>
                    </div>
                  )}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:15, fontWeight:600, color: currentTrack?.id===t.id ? "#8B95A7" : "#1C1C1E", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", letterSpacing:-0.2 }}>{t.title}</div>
                  <div style={{ fontSize:13, color:"#8E8E93", marginTop:1 }}>{t.artist}</div>
                </div>
                <div style={{ flexShrink:0, textAlign:"right" }}>
                  <div style={{ fontSize:13, fontWeight:600, color:"#8B95A7", background:"rgba(139,149,167,0.08)", padding:"3px 8px", borderRadius:6 }}>
                    {t.duration ? `${Math.floor(t.duration/60)}m` : "—"}
                  </div>
                  <div style={{ fontSize:11, color:"#AEAEB2", marginTop:3 }}>{t.genre}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

            <div style={{ padding:"6px 16px 0" }} />
      <div style={{ padding:"0 14px 6px" }}>
        {topTracks.map((t,i)=>(
          <div key={t.id} style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:22, textAlign:"right", fontSize:14, fontWeight:700, color:"#AEAEB2", flexShrink:0 }}>{i+1}</div>
            <div style={{ flex:1 }}>
              <TrackRow track={t} onPlay={()=>onPlayTrack(t,tracks)} active={currentTrack?.id===t.id} isPlaying={isPlaying} onLike={onLike} playlistCtx={playlistCtx} density={density}/>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SEARCH ───────────────────────────────────────────────────────────────────
function SearchScreen({ query, setQuery, results, onPlay, onLike, currentTrack, isPlaying, playlistCtx, density="comfortable" }) {
  return (
    <div style={{ padding:"24px 16px 16px" }}>
            <div style={{ position:"relative", marginBottom:24 }}>
        <div style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:"#AEAEB2" }}><Icon name="search" size={16}/></div>
        <input placeholder="Tracks, artists, genres…" style={{...INPUT_ST,paddingLeft:42}} value={query} onChange={e=>setQuery(e.target.value)} autoFocus/>
      </div>
      {query.length>1&&!results.length&&<div style={{ textAlign:"center", color:"#AEAEB2", padding:"48px 0" }}><div style={{ fontSize:32, marginBottom:12 }}>🔍</div><div style={{ fontSize:15, color:"#8E8E93" }}>No results for "{query}"</div></div>}
      {results.map(t=><TrackRow key={t.id} track={t} onPlay={()=>onPlay(t)} active={currentTrack?.id===t.id} isPlaying={isPlaying} onLike={onLike} playlistCtx={playlistCtx} density={density}/>)}
      {!query&&<div style={{ color:"#AEAEB2", textAlign:"center", paddingTop:56 }}><div style={{ width:58, height:58, borderRadius:20, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(180deg, rgba(255,255,255,0.72), rgba(255,255,255,0.34))", border:"1px solid rgba(255,255,255,0.72)", boxShadow:"0 14px 30px rgba(98,132,190,0.08)" }}><Icon name="search" size={22}/></div></div>}
    </div>
  );
}

// ─── LIBRARY ─────────────────────────────────────────────────────────────────
function FavoritesScreen({ tracks, onPlay, onLike, currentTrack, isPlaying, userPlaylists, onCreatePlaylist, onAddToPlaylist, onRemoveFromPlaylist, onDeletePlaylist, playlistCtx, density="comfortable" }) {
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
                {/* Liked Songs row */}
        <button onClick={()=>setActiveList("liked")} style={{ background:activeList==="liked"?"#FFFFFF":"none", border:"none", cursor:"pointer", textAlign:"left", padding:"10px 14px", color:activeList==="liked"?"#8B95A7":"#1C1C1E", boxShadow:activeList==="liked"?"0 1px 3px rgba(0,0,0,0.06)":"none", fontSize:13, fontWeight:activeList==="liked"?600:400, display:"flex", alignItems:"center", gap:8, borderRadius:8, margin:"0 6px", transition:"all 0.15s" }}>
          <Icon name="heart" size={13}/> Liked Songs
        </button>
        {/* User playlists */}
        {userPlaylists.map(pl => (
          <div key={pl.id} style={{ position:"relative", margin:"0 6px" }}>
            <button onClick={()=>setActiveList(pl.id)} style={{ background:activeList===pl.id?"#FFFFFF":"none", border:"none", cursor:"pointer", textAlign:"left", padding:"10px 28px 10px 14px", color:activeList===pl.id?"#8B95A7":"#1C1C1E", boxShadow:activeList===pl.id?"0 1px 3px rgba(0,0,0,0.06)":"none", fontSize:13, fontWeight:activeList===pl.id?600:400, display:"flex", alignItems:"center", gap:8, borderRadius:8, width:"100%", transition:"all 0.15s" }}>
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
                <button onClick={handleCreate} style={{ flex:1, background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:7, color:"#1C1C1E", fontSize:11, fontWeight:600, padding:"5px 0", cursor:"pointer" }}>Create</button>
                <button onClick={()=>{setShowNewInput(false);setNewName("");}} style={{ flex:1, background:"#F2F2F7", border:"1px solid rgba(60,60,67,0.12)", borderRadius:8, color:"#8E8E93", fontSize:11, padding:"5px 0", cursor:"pointer" }}>Cancel</button>
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
          <TrackRow key={t.id} track={t} onPlay={()=>onPlay(t)} active={currentTrack?.id===t.id} isPlaying={isPlaying} onLike={onLike} playlistCtx={playlistCtx} activePlaylistId={activeList} density={density}/>
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
        <div style={{ fontSize:12, color:"#8E8E93", marginTop:4, letterSpacing:1, fontWeight:600, textTransform:"uppercase" }}>Music Lover</div>
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
              border:`1px solid ${on?"rgba(139,149,167,0.3)":"rgba(60,60,67,0.12)"}`,
              background:on?"rgba(139,149,167,0.08)":"#FFFFFF",
              color:on?"#8B95A7":"#8E8E93" }}>{g}</div>;
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
                {t.camelot&&<span style={{ fontSize:9, color:"#8B95A7", fontWeight:600 }}>{t.camelot}</span>}
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
  const pct = duration ? ((progress / duration) * 100) : 0;

  if (expanded) return (
    <div onClick={()=>setExpanded(false)} style={{ position:"fixed", inset:0, zIndex:95, background:"rgba(232,238,246,0.5)", backdropFilter:"blur(30px) saturate(180%)" }}>
      <div style={{ position:"absolute", inset:0, background:`radial-gradient(circle at 50% 0%, rgba(${hexToRgbStr(track.color)},0.18), transparent 36%)` }}/>
      <BgMist color={track.color}/>
      <div onClick={e=>e.stopPropagation()} style={{ height:"100%", display:"flex", flexDirection:"column", justifyContent:"center", padding:"34px 28px 42px", animation:"soft-in 0.22s ease" }}>
        <div style={{ alignSelf:"center", width:54, height:5, borderRadius:999, background:"rgba(15,23,42,0.12)", marginBottom:28 }} />
        <div style={{ alignSelf:"center", width:"min(78vw, 360px)", aspectRatio:"1", borderRadius:28, overflow:"hidden", boxShadow:"0 28px 80px rgba(66,88,128,0.18), inset 0 1px 0 rgba(255,255,255,0.85)", border:"1px solid rgba(255,255,255,0.72)", background:"linear-gradient(180deg, rgba(255,255,255,0.5), rgba(255,255,255,0.22))" }}>
          <AlbumArt track={track} size={420} borderRadius={0}/>
        </div>
        <div style={{ marginTop:28, textAlign:"center" }}>
          <div style={{ fontSize:28, fontWeight:750, letterSpacing:-0.7, color:"#0F172A" }}>{track.title}</div>
          <div style={{ fontSize:15, color:"#667085", marginTop:6 }}>{track.artist}</div>
        </div>
        <div style={{ marginTop:26, padding:"0 4px" }}>
          <div style={{ height:6, background:"rgba(15,23,42,0.08)", borderRadius:999, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${pct}%`, background:"linear-gradient(90deg, rgba(121,195,255,0.95), rgba(75,140,255,0.95))", borderRadius:999, boxShadow:"0 0 20px rgba(75,140,255,0.28)" }}/>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:8, color:"#7B8190", fontSize:12, fontVariantNumeric:"tabular-nums" }}>
            <span>{fmtTime(progress)}</span><span>{fmtTime(duration)}</span>
          </div>
          <input type="range" min={0} max={duration||0} value={progress} onChange={e=>onSeek(+e.target.value)} style={{ width:"100%", marginTop:10, accentColor:"#4B8CFF" }}/>
        </div>
        <div style={{ marginTop:22, display:"flex", alignItems:"center", justifyContent:"center", gap:18 }}>
          <button onClick={onLike} style={{ width:44, height:44, borderRadius:16, background:"rgba(255,255,255,0.55)", border:"1px solid rgba(255,255,255,0.78)", color:track.liked?"#4B6FA4":"#7B8190", display:"flex", alignItems:"center", justifyContent:"center" }}><Icon name={track.liked?"heart":"heartempty"} size={18}/></button>
          <button onClick={onPrev} style={{ width:48, height:48, borderRadius:18, background:"rgba(255,255,255,0.55)", border:"1px solid rgba(255,255,255,0.78)", color:"#344054", display:"flex", alignItems:"center", justifyContent:"center" }}><Icon name="prev" size={18}/></button>
          <button onClick={onTogglePlay} style={{ width:68, height:68, borderRadius:24, background:"linear-gradient(180deg, #79C3FF 0%, #4B8CFF 100%)", border:"1px solid rgba(255,255,255,0.5)", color:"#FFFFFF", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 20px 44px rgba(75,140,255,0.34)" }}><Icon name={isPlaying?"pause":"play"} size={28}/></button>
          <button onClick={onSkip} style={{ width:48, height:48, borderRadius:18, background:"rgba(255,255,255,0.55)", border:"1px solid rgba(255,255,255,0.78)", color:"#344054", display:"flex", alignItems:"center", justifyContent:"center" }}><Icon name="skip" size={18}/></button>
          <button onClick={()=>setRepeat(!repeat)} style={{ width:44, height:44, borderRadius:16, background:repeat?"rgba(121,195,255,0.18)":"rgba(255,255,255,0.55)", border:"1px solid rgba(255,255,255,0.78)", color:repeat?"#4B6FA4":"#7B8190", display:"flex", alignItems:"center", justifyContent:"center" }}><Icon name="repeat" size={18}/></button>
        </div>
      </div>
    </div>
  );

  return (
    <div onClick={()=>setExpanded(true)} style={{ position:"fixed", left:12, right:12, bottom:78, zIndex:90, padding:8, borderRadius:24, background:"linear-gradient(180deg, rgba(255,255,255,0.82), rgba(255,255,255,0.58))", backdropFilter:"blur(28px) saturate(180%)", border:"1px solid rgba(255,255,255,0.86)", boxShadow:"0 22px 54px rgba(98,132,190,0.16), inset 0 1px 0 rgba(255,255,255,0.86)" }}>
      <div style={{ position:"absolute", left:10, right:10, top:0, height:3, background:"rgba(15,23,42,0.05)", borderRadius:999, overflow:"hidden" }}>
        <div style={{ width:`${pct}%`, height:"100%", background:"linear-gradient(90deg, rgba(121,195,255,0.95), rgba(75,140,255,0.95))" }}/>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"44px minmax(0,1fr) auto", alignItems:"center", gap:10 }}>
        <div style={{ width:44, height:44, borderRadius:14, overflow:"hidden", boxShadow:"0 8px 18px rgba(40,55,90,0.12)" }}><AlbumArt track={track} size={44} borderRadius={0}/></div>
        <div style={{ minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:700, color:"#111827", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{track.title}</div>
          <div style={{ fontSize:12, color:"#7B8190", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{track.artist}</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:4 }}>
          <button onClick={e=>{e.stopPropagation();onLike();}} style={{ width:36, height:36, borderRadius:12, background:"rgba(255,255,255,0.5)", border:"1px solid rgba(255,255,255,0.78)", color:track.liked?"#4B6FA4":"#98A1B2", display:"flex", alignItems:"center", justifyContent:"center" }}><Icon name={track.liked?"heart":"heartempty"} size={15}/></button>
          <button onClick={e=>{e.stopPropagation();onTogglePlay();}} style={{ width:42, height:42, borderRadius:14, background:"linear-gradient(180deg, #79C3FF 0%, #4B8CFF 100%)", border:"1px solid rgba(255,255,255,0.52)", color:"#FFFFFF", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 14px 30px rgba(75,140,255,0.26)" }}><Icon name={isPlaying?"pause":"play"} size={18}/></button>
        </div>
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
    <div style={{ position:"fixed", bottom:10, left:12, right:12, height:60, background:"linear-gradient(180deg, rgba(255,255,255,0.8), rgba(255,255,255,0.56))", backdropFilter:"blur(26px) saturate(1.7)", border:"1px solid rgba(255,255,255,0.82)", borderRadius:22, display:"flex", zIndex:85, boxShadow:"0 18px 42px rgba(98,132,190,0.14), inset 0 1px 0 rgba(255,255,255,0.85)" }}>
      {items.map(({id,icon,label})=>(
        <button key={id} title={label} onClick={()=>setScreen(id)} style={{ flex:1,display:"flex",alignItems:"center",justifyContent:"center",background:"none",border:"none",cursor:"pointer",color:screen===id?"#4B6FA4":"#98A1B2",transition:"all 0.18s", position:"relative" }}>
          <div style={{ width:38, height:38, borderRadius:14, display:"flex", alignItems:"center", justifyContent:"center", background:screen===id?"linear-gradient(180deg, rgba(255,255,255,0.82), rgba(255,255,255,0.44))":"transparent", border:screen===id?"1px solid rgba(255,255,255,0.82)":"1px solid transparent", boxShadow:screen===id?"0 10px 26px rgba(98,132,190,0.12)":"none" }}>
            <Icon name={id==="favorites"?(screen===id?"heart":"heartempty"):icon} size={18}/>
          </div>
          {screen===id && <div style={{ position:"absolute", bottom:6, left:"50%", transform:"translateX(-50%)", width:4, height:4, borderRadius:"50%", background:"#4B6FA4" }}/> }
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
  const [density, setDensity]         = useState("comfortable");
  const audioRef                      = useRef(null); // the real HTML5 audio element
  // ── Desktop detection (must be before any early returns) ─────────────────
  const [isDesktop, setIsDesktop]     = useState(() => window.innerWidth >= 900);
  useEffect(() => {
    const handle = () => setIsDesktop(window.innerWidth >= 900);
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);
  useEffect(() => {
    document.title = "V_APP";
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
    showToast("VERSE Radio — on air");
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
      <div style={{ width:60, height:60, borderRadius:15, background:"linear-gradient(135deg, #8B95A7, #C7D0DE)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:16, fontSize:28 }}>🎵</div>
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
          <div style={{ width:56, height:56, borderRadius:14, background:"linear-gradient(135deg, #8B95A7, #C7D0DE)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px", fontSize:24 }}>🎵</div>
          <div style={{ fontSize:14, color:"#8E8E93" }}>Loading your collection…</div>
        </div>
      )}
      <div style={{ flex:1, overflow:"auto", paddingBottom:currentTrack?154:84, zIndex:1, position:"relative" }}>
        {screen==="home"      && !tracksLoading && <HomeScreen tracks={tracks} onPlayRadio={playRadio} onTogglePlay={()=>setIsPlaying(p=>!p)} onPlayTrack={playTrack} currentTrack={currentTrack} isPlaying={isPlaying} onLike={toggleLike} isRadioMode={isRadioMode} playlistCtx={playlistCtx} density={density}/>}
        {screen==="search"    && <SearchScreen query={searchQuery} setQuery={setSearch} results={searchResults} onPlay={t=>playTrack(t,tracks)} onLike={toggleLike} currentTrack={currentTrack} isPlaying={isPlaying} playlistCtx={playlistCtx} density={density}/>}
        {screen==="favorites" && <FavoritesScreen tracks={tracks} onPlay={t=>{setIsRadioMode(false);playTrack(t,tracks);}} onLike={toggleLike} currentTrack={currentTrack} isPlaying={isPlaying} userPlaylists={userPlaylists} onCreatePlaylist={createPlaylist} onAddToPlaylist={addToPlaylist} onRemoveFromPlaylist={removeFromPlaylist} onDeletePlaylist={deletePlaylist} playlistCtx={playlistCtx} density={density}/>}
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
    { id:"profile",   icon:"profile",   label:"Profile" },
  ];

  const recentTracks = [...tracks].slice(0, 6);
  const queueSource = queue?.length ? queue : tracks;
  const currentIndex = currentTrack ? queueSource.findIndex(t => t.id === currentTrack.id) : -1;
  const nextUp = currentIndex >= 0 ? queueSource.slice(currentIndex + 1, currentIndex + 6) : recentTracks.slice(0,5);

  return (
    <div style={{ display:"flex", height:"100vh", background:"#F2F2F7", overflow:"hidden", fontFamily:"-apple-system,'SF Pro Display','Helvetica Neue',Arial,sans-serif" }}>

      {/* ── LEFT SIDEBAR ─────────────────────────────────────────────────── */}
      <div style={{ width:84, flexShrink:0, background:"linear-gradient(180deg, rgba(255,255,255,0.6), rgba(255,255,255,0.26))", borderRight:"1px solid rgba(255,255,255,0.58)", display:"flex", flexDirection:"column", padding:"16px 0 16px", backdropFilter:"blur(30px) saturate(180%)", boxShadow:"inset -1px 0 0 rgba(255,255,255,0.52)" }}>

        <div style={{ padding:"0 0 24px", display:"flex", justifyContent:"center" }}>
          <div style={{ width:52, height:52, borderRadius:18, background:"linear-gradient(135deg, rgba(255,255,255,0.7), rgba(255,255,255,0.22))", border:"1px solid rgba(255,255,255,0.68)", boxShadow:"0 18px 40px rgba(90,110,150,0.1), inset 0 1px 0 rgba(255,255,255,0.8)", display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(24px) saturate(180%)" }}>
            <BrandGlyph size={28} />
          </div>
        </div>

        <RailNav items={NAV_ITEMS} screen={screen} setScreen={setScreen} showAdmin={firebaseUser?.uid === "5lPAI9N1jkMbVkUyIqLTqBvBf1t1"} />

        {/* User footer */}
        <div style={{ padding:"14px 0 0", borderTop:"1px solid rgba(255,255,255,0.52)", display:"flex", justifyContent:"center" }}>
          <div title={user.name} style={{ width:42, height:42, borderRadius:"50%", background:"linear-gradient(180deg, rgba(255,255,255,0.7), rgba(255,255,255,0.28))", border:"1px solid rgba(255,255,255,0.72)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:17, boxShadow:"0 10px 24px rgba(113,143,192,0.12)", backdropFilter:"blur(20px)", overflow:'hidden' }}>{typeof user.image === 'string' && /^https?:/i.test(user.image) ? <img src={user.image} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : user.image}</div>
        </div>
      </div>

      {/* ── CENTRE: Phone frame ───────────────────────────────────────────── */}
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"24px 0" }}>
        <div style={{
          width:420, height:"calc(100vh - 48px)", maxHeight:860,
          borderRadius:28, overflow:"hidden",
          boxShadow:"0 22px 70px rgba(100,125,170,0.14), 0 0 0 1px rgba(255,255,255,0.6), inset 0 1px 0 rgba(255,255,255,0.9)", backdropFilter:"blur(32px) saturate(180%)", background:"linear-gradient(180deg, rgba(255,255,255,0.64), rgba(255,255,255,0.32))",
          position:"relative", flexShrink:0,
        }}>
          {innerApp}
        </div>
      </div>

      {/* ── RIGHT PANEL ──────────────────────────────────────────────────── */}
      <div style={{ width:280, flexShrink:0, background:"linear-gradient(180deg, rgba(255,255,255,0.58), rgba(255,255,255,0.26))", borderLeft:"1px solid rgba(255,255,255,0.56)", display:"flex", flexDirection:"column", padding:"24px 16px", overflowY:"auto", backdropFilter:"blur(30px) saturate(180%)", boxShadow:"inset 1px 0 0 rgba(255,255,255,0.5)", gap:TOKENS.space.lg }}>
        <GlassPanel level='panel' style={{ padding:TOKENS.space.lg, position:'relative', overflow:'hidden' }}>
          {currentTrack ? <div style={{ position:'absolute', inset:-40, background:`radial-gradient(circle at 50% 0%, rgba(${hexToRgbStr(currentTrack.color)},0.18), transparent 55%)`, pointerEvents:'none' }}/> : null}
          {currentTrack ? (
            <>
              <div style={{ width:'100%', aspectRatio:'1', borderRadius:20, overflow:'hidden', marginBottom:TOKENS.space.lg, boxShadow:'0 12px 28px rgba(40,55,90,0.12)' }}>
                <img src={currentTrack.albumCover||"/covers/default.jpg"} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>{e.target.src='/covers/default.jpg';}}/>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', gap:TOKENS.space.sm, alignItems:'flex-start', marginBottom:TOKENS.space.md }}>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontSize:16, fontWeight:750, color:TOKENS.text.primary, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', letterSpacing:-0.3 }}>{currentTrack.title}</div>
                  <div style={{ fontSize:13, color:TOKENS.text.secondary, marginTop:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{currentTrack.artist}</div>
                </div>
                <Pill accent>{currentTrack.camelot || 'LIVE'}</Pill>
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:TOKENS.space.xs, marginBottom:TOKENS.space.md }}>
                {currentTrack.genre && <Pill>{currentTrack.genre}</Pill>}
                {currentTrack.bpm && <Pill>{currentTrack.bpm} BPM</Pill>}
              </div>
              <div style={{ height:4, background:'rgba(15,23,42,0.06)', borderRadius:999, overflow:'hidden' }}><div style={{ height:'100%', width:`${duration?((progress/duration)*100):0}%`, background:`linear-gradient(90deg, rgba(${hexToRgbStr(currentTrack.color)},0.65), rgba(75,140,255,0.95))`, borderRadius:999, transition:'width 0.35s linear', boxShadow:`0 0 20px rgba(${hexToRgbStr(currentTrack.color)},0.18)` }}/></div>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:8, fontSize:11, color:TOKENS.text.tertiary, fontVariantNumeric:'tabular-nums' }}><span>{fmtTime(progress)}</span><span>{fmtTime(duration)}</span></div>
              <div style={{ display:'flex', alignItems:'center', gap:TOKENS.space.sm, marginTop:TOKENS.space.md }}>
                <IconButton icon='prev' label='Previous' subtle onClick={handlePrev} />
                <button onClick={()=>setIsPlaying(p=>!p)} style={{ flex:1, height:44, borderRadius:16, background:'linear-gradient(180deg, #79C3FF 0%, #4B8CFF 100%)', border:'1px solid rgba(255,255,255,0.56)', color:'#FFFFFF', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 16px 34px rgba(75,140,255,0.24)', cursor:'pointer' }}><Icon name={isPlaying?'pause':'play'} size={18}/></button>
                <IconButton icon='skip' label='Next' subtle onClick={handleSkip} />
              </div>
            </>
          ) : <div style={{ display:'grid', placeItems:'center', padding:'32px 0' }}><BrandGlyph size={32} /></div>}
        </GlassPanel>

        <GlassPanel level='panel' style={{ padding:TOKENS.space.md }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:TOKENS.space.md }}>
            <Pill accent>Density</Pill>
            <div style={{ display:'flex', gap:TOKENS.space.xs }}>
              <button onClick={()=>setDensity('compact')} style={{ ...glassSurface(density==='compact' ? 'active' : 'panel'), borderRadius:12, padding:'8px 10px', fontSize:12, fontWeight:700, color:density==='compact'?TOKENS.text.accent:TOKENS.text.secondary, cursor:'pointer' }}>Compact</button>
              <button onClick={()=>setDensity('comfortable')} style={{ ...glassSurface(density==='comfortable' ? 'active' : 'panel'), borderRadius:12, padding:'8px 10px', fontSize:12, fontWeight:700, color:density==='comfortable'?TOKENS.text.accent:TOKENS.text.secondary, cursor:'pointer' }}>Comfort</button>
            </div>
          </div>
        </GlassPanel>

        <GlassPanel level='panel' style={{ padding:TOKENS.space.md }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:TOKENS.space.md }}>
            <Pill accent>Next up</Pill>
            <Pill>{nextUp.length}</Pill>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:TOKENS.space.sm }}>
            {nextUp.map(t => (
              <div key={t.id} onClick={()=>playTrack(t, queueSource)} style={{ display:'grid', gridTemplateColumns:`${TOKENS.artwork.queue}px minmax(0,1fr) auto`, alignItems:'center', gap:TOKENS.space.sm, cursor:'pointer', padding:'8px 10px', borderRadius:16, background:currentTrack?.id===t.id?'linear-gradient(180deg, rgba(255,255,255,0.82), rgba(255,255,255,0.46))':'rgba(255,255,255,0.22)', border:currentTrack?.id===t.id?TOKENS.border.strong:'1px solid transparent' }}>
                <div style={{ width:TOKENS.artwork.queue, height:TOKENS.artwork.queue, borderRadius:12, overflow:'hidden' }}><AlbumArt track={t} size={TOKENS.artwork.queue} borderRadius={0}/></div>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:650, color:currentTrack?.id===t.id?TOKENS.text.accent:TOKENS.text.primary, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.title}</div>
                  <div style={{ fontSize:11, color:TOKENS.text.secondary, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginTop:2 }}>{t.artist}</div>
                </div>
                <IconButton icon='play' label='Play next track' subtle size={32} />
              </div>
            ))}
            {!nextUp.length && <div style={{ fontSize:12, color:TOKENS.text.tertiary, padding:'8px 4px' }}>Queue fills as soon as a track starts.</div>}
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}

// ─── SHARED STYLES ────────────────────────────────────────────────────────────
const APP_STYLE = {
  background:"radial-gradient(circle at 18% 12%, rgba(127,182,255,0.16), transparent 24%), radial-gradient(circle at 82% 16%, rgba(162,121,255,0.12), transparent 20%), linear-gradient(180deg, #eef2f7 0%, #e7edf5 52%, #e3e9f1 100%)",
  minHeight:"100vh", height:"100vh", overflow:"hidden",
  fontFamily:"-apple-system,'SF Pro Display','SF Pro Text','Helvetica Neue',Arial,sans-serif",
  color:"#1C1C1E", position:"relative", display:"flex", flexDirection:"column",
  WebkitFontSmoothing:"antialiased", MozOsxFontSmoothing:"grayscale",
};
const INPUT_ST = {
  background:"rgba(255,255,255,0.52)", border:"1px solid rgba(255,255,255,0.7)",
  borderRadius:18, padding:"13px 15px", color:"#1E293B", fontSize:15,
  boxShadow:"inset 0 1px 0 rgba(255,255,255,0.85), 0 12px 30px rgba(98,132,190,0.08)", backdropFilter:"blur(22px)",
  fontFamily:"-apple-system,'SF Pro Text','Helvetica Neue',Arial,sans-serif", width:"100%", display:"block",
};
const BTN_PRIMARY = {
  background:"linear-gradient(180deg, #79C3FF 0%, #4B8CFF 100%)", color:"#FFFFFF",
  border:"1px solid rgba(255,255,255,0.22)", borderRadius:18, padding:"13px 20px", fontSize:15, fontWeight:700,
  boxShadow:"0 18px 42px rgba(75,140,255,0.34), inset 0 1px 0 rgba(255,255,255,0.24)",
  fontFamily:"-apple-system,'SF Pro Text','Helvetica Neue',Arial,sans-serif", cursor:"pointer",
};
const BTN_SECONDARY = {
  background:"rgba(255,255,255,0.5)", color:"#334155", border:"1px solid rgba(255,255,255,0.7)",
  borderRadius:18, padding:"13px 20px", fontSize:15, fontWeight:600,
  backdropFilter:"blur(22px)",
  fontFamily:"-apple-system,'SF Pro Text','Helvetica Neue',Arial,sans-serif", cursor:"pointer",
};
const CTRL_BTN = {
  background:"none", border:"none", cursor:"pointer", color:"#8E8E93",
  display:"flex", alignItems:"center", justifyContent:"center", padding:8,
};
