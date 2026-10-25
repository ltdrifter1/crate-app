import { color, fontMono, fontPoster, homeSpace } from "../../theme";
import { EXPLORE_DESTINATIONS, EXPLORE_TOOLS } from "../../lib/explore";
import Icon from "../ui/Icon";

/**
 * Discover sections — one shelf of record-shop divider cards.
 *
 * New / Trending / Genres / Artists and the in-place tools (Keys, Energy,
 * History) share one row, numbered like bins. Charts is a door out of the
 * shop, so it rides the same shelf but is a button, not a tab. Dig is not
 * here: the crate sits at the counter above this row, on every section.
 */
function DividerCard({ index, label, aria, selected = false, door = false, onClick }) {
  return (
    <button
      type="button"
      role={door ? "button" : "tab"}
      aria-selected={door ? undefined : selected}
      aria-label={aria || label}
      className="pmp-press pmp-divider-card"
      data-selected={selected ? "true" : undefined}
      onClick={onClick}
      style={{
        flex: "0 0 auto",
        scrollSnapAlign: "start",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        minHeight: 40,
        padding: "0 14px 0 10px",
        borderRadius: 6,
        border: selected ? "1px solid transparent" : "1px solid rgba(200,210,222,0.14)",
        background: selected ? color.ink : "rgba(255,255,255,0.05)",
        color: selected ? color.onAccent : color.body,
        boxShadow: selected ? "0 6px 16px rgba(6,10,16,0.45)" : "inset 0 1px 0 rgba(200,210,222,0.08)",
        cursor: "pointer",
        WebkitTapHighlightColor: "transparent",
        transition: "background 0.2s ease, color 0.2s ease",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          fontFamily: fontMono,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 0.08,
          color: selected ? "rgba(12,15,19,0.55)" : color.faint,
        }}
      >
        {door ? <Icon name="chart" size={11} /> : String(index).padStart(2, "0")}
      </span>
      <span
        style={{
          fontFamily: fontPoster,
          fontSize: 16,
          fontWeight: 700,
          letterSpacing: 0.06,
          textTransform: "uppercase",
          lineHeight: 1,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
    </button>
  );
}

export default function ExploreModes({
  mode,
  onChange,
  modes = EXPLORE_DESTINATIONS,
  tools = EXPLORE_TOOLS,
  onOpenCharts = null,
}) {
  const tabs = [...modes, ...tools.filter((t) => t.action !== "charts")];
  const door = tools.find((t) => t.action === "charts");
  return (
    <div
      className="pmp-explore-shelf"
      aria-label="Discover sections"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: `10px ${homeSpace.gutter}px 4px`,
        overflowX: "auto",
        scrollSnapType: "x proximity",
        scrollPaddingLeft: homeSpace.gutter,
        scrollbarWidth: "none",
        WebkitOverflowScrolling: "touch",
      }}
    >
      <div role="tablist" aria-label="Discover" style={{ display: "flex", gap: 6 }}>
        {tabs.map((item, i) => (
          <DividerCard
            key={item.id}
            index={i + 1}
            label={item.label}
            aria={item.aria}
            selected={mode === item.id}
            onClick={() => onChange?.(item.id)}
          />
        ))}
      </div>
      {door && onOpenCharts && (
        <DividerCard
          door
          index={tabs.length + 1}
          label={door.label}
          aria={door.aria}
          onClick={() => onOpenCharts()}
        />
      )}
      <span aria-hidden="true" style={{ flex: "0 0 1px", width: 1, height: 1 }} />
    </div>
  );
}
