import { chromeIconButton, color, font, fontDisplay, homeSpace, SEARCH_FIELD } from "../../theme";
import { BRAND_NAME, brandWordmark } from "../../brand/identity";
import Icon from "../ui/Icon";
import { BrandGlyph } from "../brand/BrandGlyphs";

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
        <div
          aria-label={BRAND_NAME}
          style={{
            minWidth: 0,
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <BrandGlyph size={32} />
          <span
            style={{
              fontFamily: fontDisplay,
              fontSize: 16,
              fontWeight: brandWordmark.weight,
              letterSpacing: brandWordmark.letterSpacing,
              color: color.ink,
              lineHeight: 1.05,
            }}
          >
            {BRAND_NAME}
          </span>
        </div>
      </div>

      {onOpenSearch && (
        <button
          type="button"
          className="pmp-explore-find"
          onClick={onOpenSearch}
          aria-label="Search"
          style={{
            ...SEARCH_FIELD,
            width: "100%",
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
