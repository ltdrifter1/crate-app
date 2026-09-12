import { color, fontDisplay, fontMono, y2k } from "../../theme";
import Icon from "../ui/Icon";

/**
 * RequestSongCard — chrome signal plate into Search.
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
        borderRadius: 16,
        border: "1px solid rgba(231,235,240,0.16)",
        background: `
          linear-gradient(135deg, rgba(101,230,255,0.12) 0%, rgba(255,79,216,0.06) 36%, transparent 58%),
          linear-gradient(165deg, #1A1F26 0%, #10141A 100%)
        `,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.16), 0 14px 32px rgba(0,0,0,0.32)",
        cursor: "pointer",
        textAlign: "left",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: fontMono,
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            color: y2k.cyan,
            marginBottom: 6,
          }}
        >
          Signal
        </div>
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
          width: 42,
          height: 42,
          borderRadius: 12,
          padding: 0,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(180deg, #FFFFFF 0%, #E7EBF0 55%, #C8CED6 100%)",
          color: "#0B0C0F",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8), 0 8px 18px rgba(0,0,0,0.32)",
        }}
      >
        <span style={{ display: "flex", marginLeft: 2 }}>
          <Icon name="play" size={14} />
        </span>
      </span>
    </button>
  );
}
