import { color, font, fontDisplay, glassPill, homeSpace, motion } from "../../theme";
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
        gap: 6,
        padding: `8px ${homeSpace.gutter}px 2px`,
      }}
    >
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
              borderRadius: 980,
              border: selected
                ? `1px solid rgba(110,168,255,0.32)`
                : "1px solid rgba(200,210,222,0.10)",
              background: selected ? "rgba(110,168,255,0.10)" : "rgba(36,42,51,0.72)",
              color: selected ? color.lcdSignal : color.muted,
              cursor: "pointer",
              fontFamily: font,
              fontSize: 13,
              fontWeight: selected ? 600 : 500,
              letterSpacing: -0.08,
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
