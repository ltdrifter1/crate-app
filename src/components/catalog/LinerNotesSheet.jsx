import { font, fontDisplay, fontMono, color, radius, glass, glassSheet } from "../../theme";
import { linerNotesFor } from "../../lib/catalog";
import { physicalStatusFor, canBuyPhysical, memberPrice } from "../../lib/physicalStatus";

/** Interactive liner notes — credits & listening context for a track. */
export default function LinerNotesSheet({
  track,
  roomLabel,
  onClose,
  onOpenArtist,
  onOpenAlbum,
  onOpenRoom,
  memberPricing = false,
}) {
  const notes = linerNotesFor(track);
  if (!notes) return null;
  const physical = physicalStatusFor(track);
  const retail = track?.retailPrice != null ? Number(track.retailPrice) : null;
  const price = retail != null ? memberPrice(retail, {
    member: memberPricing,
    memberRetail: track?.memberPrice,
  }) : null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 120 }}>
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(255,255,255,0.2)",
          backdropFilter: glass.blurSoft,
          WebkitBackdropFilter: glass.blurSoft,
        }}
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
          ...glassSheet,
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
            <div style={{
              marginTop: 10,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "5px 10px",
              borderRadius: radius.sm,
              border: `1px solid ${glass.borderSoft}`,
              background: "rgba(22,24,30,0.35)",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1.1,
              textTransform: "uppercase",
              fontFamily: fontMono,
              color: color.accent,
            }}>
              {physical.label}
              {track?.catalogNumber ? ` · ${track.catalogNumber}` : ""}
            </div>
            {canBuyPhysical(physical) && price != null && (
              <div style={{ marginTop: 8, fontSize: 13, color: color.body }}>
                {memberPricing ? "Club price" : "Retail"} · ${price.toFixed(2)}
                {memberPricing && retail != null && retail !== price ? ` (was $${retail.toFixed(2)})` : ""}
              </div>
            )}
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
        borderRadius: radius.pill,
        border: `1px solid ${glass.borderSoft}`,
        background: `
          linear-gradient(165deg, rgba(38,43,51,0.82) 0%, rgba(28,32,38,0.5) 100%)
        `,
        boxShadow: `inset 0 1px 0 ${glass.highlight}`,
        backdropFilter: glass.blurSoft,
        WebkitBackdropFilter: glass.blurSoft,
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
