import { chromeIconButton, color, fontMono, homeSpace, radio } from "../../theme";
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
 * HomeHeader — labeled Find field + overflow. Club lives on the tab bar.
 */
export default function HomeHeader({
  onOpenSearch = null,
  onOpenMenu = null,
}) {
  return (
    <header
      className="pmp-home-header"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: `calc(12px + env(safe-area-inset-top, 0px)) ${homeSpace.gutter}px 8px`,
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
            flex: 1,
            minWidth: 0,
            display: "flex",
            alignItems: "center",
            gap: 10,
            minHeight: 44,
            padding: "0 12px",
            borderRadius: radio.radiusLcd,
            border: radio.lcdBorder,
            background: radio.lcdFace,
            boxShadow: radio.lcdShadow,
            color: color.lcdMute,
            cursor: "pointer",
            textAlign: "left",
            fontFamily: fontMono,
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: 0.04,
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <span style={{ color: color.lcdSignal, display: "flex" }}>
            <Icon name="search" size={14} />
          </span>
          Find
        </button>
      )}
    </header>
  );
}
