import { color, fontMono, motion, radio } from "../../theme";
import { EXPLORE_MODES } from "../../lib/explore";

/** iPod-menu / Winamp ML tabs — one canvas at a time. */
export default function ExploreModes({ mode, onChange }) {
  return (
    <div
      role="tablist"
      aria-label="Explore directory"
      className="pmp-explore-modes"
    >
      {EXPLORE_MODES.map((item) => {
        const selected = mode === item.id;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-label={item.label}
            className="pmp-press"
            onClick={() => onChange?.(item.id)}
            style={{
              flex: "1 1 0",
              minHeight: 44,
              padding: "8px 4px",
              border: selected ? radio.lcdBorder : radio.borderQuiet,
              borderRadius: radio.radiusLcd,
              background: selected ? radio.lcdFace : "transparent",
              boxShadow: selected ? `${radio.lcdShadow}` : "none",
              color: selected ? color.lcdSignal : color.muted,
              cursor: "pointer",
              fontFamily: fontMono,
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: 0.02,
              textTransform: "none",
              transition: `background ${motion.base}, color ${motion.base}, border-color ${motion.base}`,
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
