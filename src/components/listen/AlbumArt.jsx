import { useState } from "react";
import CoverImage from "../ui/CoverImage";
import { color, fontDisplay } from "../../theme";
import { hexToRgbStr } from "../../lib/harmony";

// ─── ALBUM ART — jewel-case when framed by parent ─────────────────────────────
export function AlbumArt({ track, size=300, borderRadius=8, priority=false }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError]   = useState(false);
  if (!track.albumCover || error) {
    return (
      <div style={{
        width: size, height: size, borderRadius, flexShrink: 0,
        background: `linear-gradient(135deg,rgba(${hexToRgbStr(track.color)},0.45),rgba(${hexToRgbStr(track.color)},0.12))`,
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden",
      }}>
        <div style={{ fontSize: size * 0.25, fontWeight: 700, color: `rgba(${hexToRgbStr(track.color)},0.75)`, letterSpacing: -2, fontFamily: fontDisplay }}>
          {track.title.charAt(0)}{track.artist.charAt(0)}
        </div>
      </div>
    );
  }
  return (
    <div style={{ width: size, height: size, borderRadius, flexShrink: 0, position: "relative", overflow: "hidden", background: color.surfaceRaised }}>
      {!loaded && <div style={{ position: "absolute", inset: 0, background: `rgba(${hexToRgbStr(track.color)},0.12)`, animation: "shimmer 1.5s ease-in-out infinite" }}/>}
      <CoverImage
        src={track.albumCover}
        alt={track.album || ""}
        width={size}
        height={size}
        priority={priority}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        style={{ opacity: loaded ? 1 : 0, transition: "opacity 0.4s" }}
      />
    </div>
  );
}

// ─── VINYL RECORD ─────────────────────────────────────────────────────────────
export function VinylRecord({ track, isPlaying, size=190 }) {
  const c = size/2;
  const grooves = Array.from({length:8},(_,i)=>({ r:size*0.24+i*(size*0.23/7), op:0.06+i*0.022 }));
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", position:"relative", overflow:"hidden",
      animation:isPlaying?"spin 2.8s linear infinite":"none",
      boxShadow:"0 8px 32px rgba(0,0,0,0.25)",
    }}>
      {track.albumCover
        ? <CoverImage src={track.albumCover} alt="" width={size} height={size} priority />

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


export default AlbumArt;
