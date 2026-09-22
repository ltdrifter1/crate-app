import { color, fontMono, motion, radio } from "../../theme";
import { EXPLORE_MODES } from "../../lib/explore";

/** iPod-menu / Winamp ML tabs — one canvas at a time. */
export default function ExploreModes({ mode, onChange, modes = EXPLORE_MODES }) {
  return (
    <div
      role="tablist"
      aria-label="Explore directory"
      className="pmp-explore-modes"
    >
      {modes.map((item) => {
        const selected = mode === item.id;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-label={item.aria || item.label}
            className="pmp-press"
            onClick={() => onChange?.(item.id)}
            style={{
              flex: "1 1 0",
              minHeight: 40,
              padding: "6px 4px 7px",
              border: selected ? radio.lcdBorder : radio.borderChrome,
              borderRadius: radio.radiusLcd,
              background: selected ? radio.lcdFace : radio.moduleFace,
              boxShadow: selected ? `${radio.lcdShadow}` : radio.stripShadow,
              color: selected ? color.lcdSignal : color.body,
              cursor: "pointer",
              fontFamily: fontMono,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 0.14,
              textTransform: "uppercase",
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
