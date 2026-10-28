import { useEffect, useState } from "react";
import { chromeIconButton, color, fontMono, fontPoster, homeSpace, SEARCH_FIELD } from "../../theme";
import { BRAND_NAME, BRAND_TAGLINE } from "../../brand/identity";
import Icon from "../ui/Icon";
import { BrandGlyph } from "../brand/BrandGlyphs";

const RULE = "2px solid #F1E5D7";

function clockLabel(date) {
  return date
    .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    .replace(" ", " ")
    .toUpperCase();
}

function MoreButton({ onClick }) {
  if (!onClick) return null;
  return (
    <button
      type="button"
      aria-label="More"
      onClick={onClick}
      className="pmp-press pmp-stamp-btn"
      style={{ ...chromeIconButton(44), flexShrink: 0 }}
    >
      <Icon name="menu" size={16} />
    </button>
  );
}

/**
 * HomeHeader — Courier status line, plain Tanker wordmark, Find off to the side.
 * Player context lives in the hero, not a DJ greeting.
 */
export default function HomeHeader({
  onOpenSearch = null,
  onOpenMenu = null,
}) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <header
      className="pmp-home-header"
      style={{
        padding: `calc(8px + env(safe-area-inset-top, 0px)) ${homeSpace.gutter}px 0`,
      }}
    >
      <h1 className="sr-only">Home</h1>

      <div
        className="wav-meta"
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          margin: `0 -${homeSpace.gutter}px`,
          padding: `0 ${homeSpace.gutter}px 8px`,
          borderBottom: RULE,
          fontFamily: fontMono,
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: color.ink,
        }}
      >
        <span>{BRAND_NAME}</span>
        <span style={{ textAlign: "right" }}>
          {clockLabel(now)}
          <span style={{ color: color.muted }}> · {BRAND_TAGLINE}</span>
        </span>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 12,
          padding: "12px 0 14px",
          borderBottom: RULE,
        }}
      >
        <MoreButton onClick={onOpenMenu} />
        <BrandGlyph size={32} />
        <div aria-label={BRAND_NAME} style={{ minWidth: 0, flex: 1 }}>
          <span
            className="wav-word"
            style={{
              fontFamily: fontPoster,
              fontSize: "clamp(44px, 8vw, 76px)",
              fontWeight: 400,
              letterSpacing: -0.4,
              textTransform: "uppercase",
              color: color.ink,
              lineHeight: 0.8,
              display: "block",
            }}
          >
            {BRAND_NAME}
          </span>
        </div>
        {onOpenSearch && (
          <button
            type="button"
            className="pmp-explore-find pmp-press pmp-stamp-btn"
            onClick={onOpenSearch}
            aria-label="Search"
            style={{
              ...SEARCH_FIELD,
              width: "auto",
              flexShrink: 0,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              minHeight: 40,
              padding: "0 14px",
              boxShadow: "3px 3px 0 #F1E5D7",
              color: color.ink,
              cursor: "pointer",
              fontFamily: fontMono,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <Icon name="search" size={14} />
            Find
          </button>
        )}
      </div>
    </header>
  );
}
