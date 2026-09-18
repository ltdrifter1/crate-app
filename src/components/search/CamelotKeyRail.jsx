import { color, fontMono, radio } from "../../theme";
import { CAMELOT_SLOTS, tracksForCamelotSlot } from "../../lib/harmony";

/** Compact Camelot wheel — 12 slots, A/B share a number. */
export default function CamelotKeyRail({
  tracks = [],
  onPlayPool = null,
  label = "Keys",
}) {
  if (!onPlayPool) return null;
  const slots = CAMELOT_SLOTS.filter((n) => tracksForCamelotSlot(tracks, n).length > 0);
  if (!slots.length) return null;

  return (
    <div style={{ margin: "16px 0 8px" }}>
      <div
        style={{
          fontFamily: fontMono,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 0.14,
          textTransform: "uppercase",
          color: color.accent,
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {slots.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => {
              const pool = tracksForCamelotSlot(tracks, n);
              if (pool[0]) onPlayPool(pool[0], pool);
            }}
            aria-label={`Play tracks in Camelot ${n}`}
            style={{
              minWidth: 36,
              height: 32,
              padding: "0 8px",
              borderRadius: 4,
              border: radio.lcdBorder,
              background: radio.lcdFace,
              color: color.lcdPhosphor,
              boxShadow: `${radio.lcdShadow}, ${color.lcdPhosphorGlow}`,
              fontFamily: fontMono,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 0.08,
              cursor: "pointer",
            }}
          >
            {n}A
          </button>
        ))}
      </div>
    </div>
  );
}
