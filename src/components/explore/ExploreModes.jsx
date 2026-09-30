import { color, fontMono, fontDisplay, glassPill, homeSpace, motion, radio } from "../../theme";
import { EXPLORE_DESTINATIONS, EXPLORE_TOOLS } from "../../lib/explore";

/** Primary Discover destinations — New / Trending / Genres / Artists. */
export default function ExploreModes({ mode, onChange, modes = EXPLORE_DESTINATIONS }) {
  return (
    <div
      role="tablist"
      aria-label="Discover"
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
              ...glassPill({ active: selected, compact: true }),
              flex: "1 1 0",
              minHeight: 38,
              padding: "6px 10px",
              cursor: "pointer",
              fontFamily: fontDisplay,
              fontSize: 14,
              fontWeight: selected ? 650 : 520,
              letterSpacing: -0.2,
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

/** Compact tools — Keys, Dig, Charts, Energy. Not peer tabs of New / Genres. */
export function ExploreTools({
  mode,
  onChange,
  onOpenCharts = null,
  tools = EXPLORE_TOOLS,
}) {
  const visible = tools.filter((item) => item.action !== "charts" || onOpenCharts);
  if (!visible.length) return null;
  return (
    <div
      role="toolbar"
      aria-label="Discover tools"
      className="pmp-explore-tools"
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 6,
        margin: `8px ${homeSpace.gutter}px 2px`,
        padding: "6px 8px",
        borderRadius: 12,
        background: "rgba(14,18,23,0.6)",
        border: "1px solid rgba(200,210,222,0.08)",
        boxShadow: "inset 0 2px 6px rgba(6,10,16,0.5)",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          fontFamily: fontMono,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 0.4,
          color: color.faint,
          padding: "0 6px 0 4px",
        }}
      >
        TOOLS
      </span>
      {visible.map((item) => {
        const isAction = item.action === "charts";
        const selected = !isAction && mode === item.id;
        return (
          <button
            key={item.id}
            type="button"
            aria-label={item.aria || item.label}
            aria-pressed={isAction ? undefined : selected}
            className="pmp-press"
            onClick={() => {
              if (isAction) {
                onOpenCharts?.();
                return;
              }
              onChange?.(item.id);
            }}
            style={{
              minHeight: 32,
              padding: "0 12px",
              borderRadius: 8,
              border: selected
                ? `1px solid rgba(168,180,198,0.42)`
                : "1px solid rgba(200,210,222,0.10)",
              background: selected ? radio.lcdFace : "rgba(24,29,36,0.72)",
              color: selected ? color.lcdSignal : color.muted,
              cursor: "pointer",
              fontFamily: fontMono,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 0.3,
              textTransform: "uppercase",
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
