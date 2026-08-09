import { useMemo } from "react";
import { color, fontDisplay, fontMono, homeSpace, y2k } from "../../theme";
import ArtFrame from "../ui/ArtFrame";

/**
 * PlaylistCard — a user "stack" tile. 2x2 art mosaic from its cuts,
 * falling back to a chrome monogram plate.
 */
export default function PlaylistCard({ playlist, tracks = [], onClick = null, size = homeSpace.tile }) {
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
  const initial = String(playlist.name || playlist.title || "?").trim().charAt(0).toUpperCase();

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
      <ArtFrame
        covers={covers.length >= 4 ? covers : null}
        src={covers.length > 0 && covers.length < 4 ? covers[0] : null}
        size={size}
        radius={12}
      >
        {covers.length === 0 && (
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
              textShadow: `0 0 20px ${y2k.chromeGlow}`,
              zIndex: 1,
            }}
          >
            {initial}
          </span>
        )}
        <span
          style={{
            position: "absolute",
            left: 10,
            bottom: 8,
            zIndex: 1,
            fontFamily: fontMono,
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: 1.4,
            textTransform: "uppercase",
            color: "rgba(244,246,248,0.8)",
          }}
        >
          {count} {count === 1 ? "cut" : "cuts"}
        </span>
      </ArtFrame>
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
          color: color.muted,
        }}
      >
        Your stack
      </span>
    </button>
  );
}
