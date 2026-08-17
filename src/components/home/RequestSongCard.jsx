import { color, fontDisplay, y2k } from "../../theme";
import Icon from "../ui/Icon";

/**
 * RequestSongCard — quiet App Store–style prompt into Search.
 */
export default function RequestSongCard({ onClick = null }) {
  return (
    <button
      type="button"
      aria-label="Request a song — open search"
      onClick={onClick || undefined}
      className="pmp-lift"
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "18px 18px",
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.1)",
        background: `
          linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 42%),
          linear-gradient(165deg, #1A1F26 0%, #10141A 100%)
        `,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1), 0 12px 28px rgba(0,0,0,0.28)",
        cursor: "pointer",
        textAlign: "left",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: fontDisplay,
            fontSize: 17,
            fontWeight: 700,
            letterSpacing: -0.3,
            color: y2k.offWhite,
          }}
        >
          Request a Song
        </div>
        <div
          style={{
            marginTop: 4,
            fontSize: 14,
            fontWeight: 500,
            letterSpacing: -0.08,
            color: color.muted,
          }}
        >
          What do you wanna hear?
        </div>
      </div>
      <span
        aria-hidden="true"
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          padding: 0,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(255,255,255,0.92)",
          color: "#0B0C0F",
        }}
      >
        <span style={{ display: "flex", marginLeft: 2 }}>
          <Icon name="play" size={14} />
        </span>
      </span>
    </button>
  );
}
