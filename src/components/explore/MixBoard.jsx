import { color, fontDisplay, fontMono, homeSpace, motion, radio } from "../../theme";
import { CAMELOT_SLOTS, tracksForCamelotSlot } from "../../lib/harmony";

/**
 * Mix board — Camelot pads as a DJ crate index, not a chip rail on Home.
 */
export default function MixBoard({ tracks = [], onPlayPool = null }) {
  if (!onPlayPool) return null;
  const pads = CAMELOT_SLOTS.map((n) => ({
    n,
    pool: tracksForCamelotSlot(tracks, n),
  })).filter((p) => p.pool.length > 0);

  if (!pads.length) {
    return (
      <div style={{ padding: `12px ${homeSpace.gutter}px` }}>
        <p
          style={{
            margin: 0,
            fontSize: 14,
            color: color.muted,
            lineHeight: 1.45,
          }}
        >
          Keys show up here when cuts carry Camelot tags — a crate you can mix, not a genre list.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: `8px ${homeSpace.gutter}px 0` }}>
      <p
        style={{
          margin: "0 0 12px",
          fontSize: 13,
          color: color.muted,
          lineHeight: 1.4,
          maxWidth: 420,
        }}
      >
        Compatible keys sit next to each other. Tap a pad to play that crate.
      </p>
      <div className="pmp-mix-board">
        {pads.map((pad, i) => (
          <button
            key={pad.n}
            type="button"
            className="pmp-press"
            onClick={() => {
              if (pad.pool[0]) onPlayPool(pad.pool[0], pad.pool);
            }}
            aria-label={`Play tracks in Camelot ${pad.n}`}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              justifyContent: "space-between",
              minHeight: 72,
              padding: "10px 12px",
              borderRadius: radio.radiusLcd,
              border: radio.lcdBorder,
              background: radio.lcdFace,
              boxShadow: radio.lcdShadow,
              color: color.lcdSignal,
              cursor: "pointer",
              textAlign: "left",
              animation: `rise 0.4s ${motion.ease} ${Math.min(i, 8) * 0.03}s both`,
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <span
              style={{
                fontFamily: fontDisplay,
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: -0.4,
                color: color.lcdInk,
                lineHeight: 1,
              }}
            >
              {pad.n}A
            </span>
            <span
              style={{
                fontFamily: fontMono,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 0.08,
                textTransform: "uppercase",
                color: color.lcdMute,
              }}
            >
              {pad.pool.length} {pad.pool.length === 1 ? "cut" : "cuts"}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
