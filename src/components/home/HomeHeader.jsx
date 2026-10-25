import { chromeIconButton, color, font, homeSpace, SEARCH_FIELD } from "../../theme";
import Icon from "../ui/Icon";

function MoreButton({ onClick }) {
  if (!onClick) return null;
  return (
    <button
      type="button"
      aria-label="More"
      onClick={onClick}
      className="pmp-press"
      style={{ ...chromeIconButton(44), flexShrink: 0 }}
    >
      <Icon name="menu" size={16} />
    </button>
  );
}

/**
 * HomeHeader — one slim row: More (phone only) and Find.
 * No wordmark, no mark. The channel below is the identity; the desktop
 * source list already carries the lockup once, and the screen carries the callsign.
 */
export default function HomeHeader({
  onOpenSearch = null,
  onOpenMenu = null,
}) {
  return (
    <header
      className="pmp-home-header"
      style={{
        padding: `calc(10px + env(safe-area-inset-top, 0px)) ${homeSpace.gutter}px 6px`,
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <h1 className="sr-only">Home</h1>
      <MoreButton onClick={onOpenMenu} />
      {onOpenSearch && (
        <button
          type="button"
          className="pmp-explore-find"
          onClick={onOpenSearch}
          aria-label="Search"
          style={{
            ...SEARCH_FIELD,
            flex: 1,
            width: "auto",
            minWidth: 0,
            maxWidth: 560,
            display: "flex",
            alignItems: "center",
            gap: 10,
            minHeight: 40,
            padding: "0 14px",
            color: color.muted,
            cursor: "pointer",
            textAlign: "left",
            fontFamily: font,
            fontSize: 14,
            fontWeight: 500,
            letterSpacing: -0.08,
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <span style={{ color: color.lcdSignal, display: "flex" }}>
            <Icon name="search" size={14} />
          </span>
          Find a track, artist or scene
        </button>
      )}
    </header>
  );
}
