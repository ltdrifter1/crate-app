import { chromeIconButton, color, font, homeSpace, radio } from "../../theme";
import Icon from "../ui/Icon";
import BrandMark from "../brand/BrandMark";

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
 * HomeHeader — wordmark + Find.
 * Player context lives in the hero, not a DJ greeting.
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
      }}
    >
      <h1 className="sr-only">Home</h1>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 10,
        }}
      >
        <MoreButton onClick={onOpenMenu} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <BrandMark size={32} showWordmark />
        </div>
      </div>

      {onOpenSearch && (
        <button
          type="button"
          className="pmp-explore-find"
          onClick={onOpenSearch}
          aria-label="Search"
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 10,
            minHeight: 40,
            padding: "0 14px",
            borderRadius: 980,
            border: radio.lcdBorder,
            background: radio.lcdFace,
            boxShadow: radio.lcdShadow,
            color: color.lcdMute,
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
