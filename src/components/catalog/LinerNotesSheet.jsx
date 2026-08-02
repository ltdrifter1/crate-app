import { font, fontDisplay, fontMono, color, radius } from "../../theme";
import { linerNotesFor } from "../../lib/catalog";

/** Interactive liner notes — credits & listening context for a track. */
export default function LinerNotesSheet({ track, roomLabel, onClose, onOpenArtist, onOpenAlbum, onOpenRoom }) {
  const notes = linerNotesFor(track);
  if (!notes) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 120 }}>
      <div
        onClick={onClose}
        style={{ position: "absolute", inset: 0, background: "rgba(26,29,36,0.38)", backdropFilter: "blur(10px)" }}
      />
      <div
        role="dialog"
        aria-label="Liner notes"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          maxHeight: "78vh",
          background: color.surfaceSolid,
          borderTop: `1px solid ${color.lineStrong}`,
          borderRadius: "16px 16px 0 0",
          display: "flex",
          flexDirection: "column",
          animation: "rise 0.35s cubic-bezier(0.22,1,0.36,1) both",
          fontFamily: font,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "18px 18px 10px", gap: 12 }}>
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 1.6,
                color: color.accent,
                fontFamily: fontMono,
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              Liner notes
              {roomLabel ? ` · ${roomLabel}` : ""}
            </div>
            <div style={{ fontSize: 22, fontWeight: 750, fontFamily: fontDisplay, letterSpacing: -0.5, color: color.ink }}>
              {notes.title}
            </div>
            <div style={{ fontSize: 14, color: color.muted, marginTop: 4 }}>{notes.artist}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{ background: "none", border: "none", color: color.faint, cursor: "pointer", fontSize: 18, padding: 4 }}
          >
            ×
          </button>
        </div>

        <div className="hide-scroll" style={{ overflowY: "auto", padding: "8px 18px 32px" }}>
          {notes.paragraphs.map((p, i) => (
            <p key={i} style={{ fontSize: 15, color: color.body, lineHeight: 1.55, margin: "0 0 14px", maxWidth: 420 }}>
              {p}
            </p>
          ))}

          <div style={{ height: 1, background: color.line, margin: "8px 0 16px" }} />

          <div style={{ fontSize: 12, fontWeight: 650, fontFamily: fontDisplay, color: color.ink, marginBottom: 10 }}>
            Credits & signals
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {notes.credits.map((c) => (
              <div
                key={c.label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 16,
                  padding: "12px 0",
                  borderBottom: `1px solid ${color.line}`,
                }}
              >
                <span style={{ fontSize: 12, color: color.faint, fontFamily: fontMono, letterSpacing: 0.4, textTransform: "uppercase" }}>
                  {c.label}
                </span>
                <span style={{ fontSize: 14, color: color.ink, fontWeight: 550, textAlign: "right" }}>{c.value}</span>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 20 }}>
            {onOpenArtist && track.artist && (
              <Chip onClick={() => { onOpenArtist(track.artist); onClose(); }}>Artist →</Chip>
            )}
            {onOpenAlbum && track.album && (
              <Chip onClick={() => { onOpenAlbum(track); onClose(); }}>Album →</Chip>
            )}
            {onOpenRoom && roomLabel && (
              <Chip onClick={() => { onOpenRoom(); onClose(); }}>Room →</Chip>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Chip({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "10px 14px",
        borderRadius: radius.sm,
        border: `1px solid ${color.lineStrong}`,
        background: color.surface,
        color: color.body,
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: font,
      }}
    >
      {children}
    </button>
  );
}
