import { useState } from "react";
import { color, fontDisplay, fontMono, homeSpace, motion, radio } from "../../theme";
import { CAMELOT_SLOTS, parseCamelot, tracksForCamelotKey } from "../../lib/harmony";
import CoverImage from "../ui/CoverImage";

function neighborNums(n) {
  const left = n === 1 ? 12 : n - 1;
  const right = n === 12 ? 1 : n + 1;
  return [left, n, right];
}

/**
 * 12-key Mix wheel — unlit hardware for empty slots, A/B, neighbor glow.
 */
export default function MixBoard({ tracks = [], onPlayPool = null }) {
  const [selected, setSelected] = useState(null);
  if (!onPlayPool) return null;

  const selectedParsed = parseCamelot(selected);
  const hotNums = selectedParsed ? neighborNums(selectedParsed.num) : [];

  return (
    <div style={{ padding: `8px ${homeSpace.gutter}px 0` }}>
      <p
        style={{
          margin: "0 0 12px",
          fontSize: 13,
          color: color.muted,
          lineHeight: 1.4,
          maxWidth: 440,
        }}
      >
        Twelve keys. Neighbors mix. Empty pads stay dark.
      </p>
      <div className="pmp-mix-wheel">
        {CAMELOT_SLOTS.map((n, i) => {
          const poolA = tracksForCamelotKey(tracks, `${n}A`);
          const poolB = tracksForCamelotKey(tracks, `${n}B`);
          const lit = poolA.length + poolB.length > 0;
          const neighbor = hotNums.includes(n);
          const sleeve =
            poolA[0]?.albumCover || poolB[0]?.albumCover || null;
          return (
            <div
              key={n}
              className="pmp-mix-slot"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                padding: 6,
                borderRadius: radio.radiusLcd,
                border: neighbor && lit ? radio.lcdBorder : radio.borderQuiet,
                background: lit ? radio.lcdFace : "rgba(58,66,80,0.16)",
                boxShadow: lit ? radio.lcdShadow : "none",
                opacity: lit ? 1 : 0.42,
                animation: `rise 0.35s ${motion.ease} ${Math.min(i, 8) * 0.02}s both`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {sleeve ? (
                  <CoverImage
                    src={sleeve}
                    alt=""
                    width={28}
                    height={28}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 3,
                      objectFit: "cover",
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 3,
                      background: "rgba(42,51,60,0.45)",
                      flexShrink: 0,
                    }}
                  />
                )}
                <span
                  style={{
                    fontFamily: fontDisplay,
                    fontSize: 18,
                    fontWeight: 700,
                    color: lit ? color.lcdInk : color.lcdMute,
                    lineHeight: 1,
                  }}
                >
                  {n}
                </span>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                {["A", "B"].map((mode) => {
                  const key = `${n}${mode}`;
                  const pool = mode === "A" ? poolA : poolB;
                  const on = selected === key;
                  return (
                    <button
                      key={mode}
                      type="button"
                      className="pmp-press"
                      disabled={!pool.length}
                      onClick={() => {
                        if (!pool[0]) return;
                        setSelected(key);
                        onPlayPool(pool[0], pool);
                      }}
                      aria-label={`Play Camelot ${key}`}
                      style={{
                        flex: 1,
                        minHeight: 28,
                        border: on ? radio.lcdBorder : "1px solid transparent",
                        borderRadius: 4,
                        background: on
                          ? "rgba(183,228,238,0.16)"
                          : "rgba(42,51,60,0.28)",
                        color: pool.length ? color.lcdSignal : color.lcdMute,
                        cursor: pool.length ? "pointer" : "default",
                        fontFamily: fontMono,
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: 0.06,
                      }}
                    >
                      {mode}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
