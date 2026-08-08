import { useMemo } from "react";
import { color, fontDisplay, fontMono, y2k } from "../../theme";
import CoverImage from "../ui/CoverImage";

/**
 * PlaylistCard — a user "stack" tile. 2x2 art mosaic from its cuts,
 * falling back to a purple monogram plate.
 */
export default function PlaylistCard({ playlist, tracks = [], onClick = null, size = 148 }) {
  const covers = useMemo(() => {
    const byId = new Map(tracks.map((t) => [t.id, t]));
    const out = [];
    for (const id of playlist.trackIds || []) {
      const cover = byId.get(id)?.albumCover;
      if (cover && !out.includes(cover)) out.push(cover);
      if (out.length >= 4) break;
    }
    return out;
  }, [playlist.trackIds, tracks]);

  const count = (playlist.trackIds || []).length;
  const cell = Math.floor(size / 2);

  return (
    <button
      type="button"
      aria-label={`Open playlist ${playlist.name || playlist.title}`}
      onClick={onClick || undefined}
      className="pmp-lift"
      style={{
        flex: "0 0 auto",
        scrollSnapAlign: "start",
        width: size,
        background: "none",
        border: "none",
        padding: 0,
        cursor: "pointer",
        textAlign: "left",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <span
        style={{
          position: "relative",
          display: "block",
          width: size,
          height: size,
          borderRadius: 16,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.08)",
          background: y2k.artGradient,
          boxShadow: "0 10px 24px rgba(0,0,0,0.35)",
        }}
      >
        {covers.length >= 4 ? (
          <span
            style={{
              position: "absolute",
              inset: 0,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gridTemplateRows: "1fr 1fr",
            }}
          >
            {covers.slice(0, 4).map((src, i) => (
              <span key={i} style={{ overflow: "hidden" }}>
                <CoverImage src={src} alt="" width={cell} height={cell} />
              </span>
            ))}
          </span>
        ) : covers.length > 0 ? (
          <CoverImage src={covers[0]} alt="" width={size} height={size} />
        ) : (
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: fontDisplay,
              fontStyle: "italic",
              fontSize: 44,
              fontWeight: 800,
              color: "rgba(242,239,230,0.85)",
              textShadow: `0 0 24px ${y2k.purpleGlow}`,
            }}
          >
            {String(playlist.name || playlist.title || "?").trim().charAt(0).toUpperCase()}
          </span>
        )}
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, transparent 55%, rgba(8,6,14,0.55) 100%)",
          }}
        />
        <span
          style={{
            position: "absolute",
            left: 10,
            bottom: 8,
            fontFamily: fontMono,
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: 1.4,
            textTransform: "uppercase",
            color: "rgba(242,239,230,0.8)",
          }}
        >
          {count} {count === 1 ? "cut" : "cuts"}
        </span>
      </span>
      <span
        style={{
          display: "block",
          marginTop: 9,
          fontSize: 13,
          fontWeight: 650,
          fontFamily: fontDisplay,
          letterSpacing: -0.2,
          color: y2k.offWhite,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {playlist.name || playlist.title}
      </span>
      <span
        style={{
          display: "block",
          marginTop: 3,
          fontSize: 11,
          fontWeight: 500,
          color: color.faint,
        }}
      >
        Your stack
      </span>
    </button>
  );
}
