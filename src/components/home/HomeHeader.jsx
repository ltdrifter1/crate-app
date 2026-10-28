import { chromeIconButton, color, font, fontMono, fontPoster, homeSpace, SEARCH_FIELD } from "../../theme";
import { BRAND_NAME, BRAND_TAGLINE } from "../../brand/identity";
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
        className="wav-meta"
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          margin: `0 -${homeSpace.gutter}px 8px`,
          padding: "0 0 8px",
          borderBottom: "2px solid #F1E5D7",
          fontFamily: fontMono,
          fontSize: 12,
          letterSpacing: 0.08,
          textTransform: "uppercase",
          color: color.ink,
        }}
      >
        <span>{BRAND_NAME}</span>
        <span style={{ color: color.muted }}>{BRAND_TAGLINE}</span>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 10,
          marginBottom: 10,
        }}
      >
        <MoreButton onClick={onOpenMenu} />
        <BrandGlyph size={36} />
        <div
          aria-label={BRAND_NAME}
          style={{
            minWidth: 0,
            flex: 1,
          }}
        >
          <span
            className="wav-word"
            style={{
              fontFamily: fontPoster,
              fontSize: "clamp(40px, 8vw, 64px)",
              fontWeight: 400,
              letterSpacing: -0.4,
              textTransform: "uppercase",
              color: color.ink,
              lineHeight: 0.84,
              textShadow: "0.045em 0.045em 0 #F74D7A",
              display: "block",
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
