import { chromeIconButton, color, font, fontDisplay, homeSpace, motion, type, y2k } from "../../theme";
import Icon from "../ui/Icon";

/**
 * PageHeader — one header for the browse pages (Discover, Library, Search):
 * menu key or back link, a left-aligned large title, one line of subtitle.
 * Home (station bar) and Charts (poster masthead) keep their own on purpose.
 */
export default function PageHeader({
  title,
  subtitle = null,
  onOpenMenu = null,
  back = null,
  style = null,
}) {
  return (
    <header
      className="pmp-page-header"
      style={{
        position: "relative",
        padding: `calc(12px + env(safe-area-inset-top, 0px)) ${homeSpace.gutter}px 4px`,
        animation: `rise 0.45s ${motion.ease} both`,
        ...style,
      }}
    >
      {back && (
        <button
          type="button"
          onClick={back.onClick}
          aria-label={`Back to ${back.label}`}
          className="pmp-press"
          style={{
            background: "none",
            border: "none",
            color: color.muted,
            fontFamily: fontDisplay,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            padding: "0 0 10px",
          }}
        >
          ‹ {back.label}
        </button>
      )}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, minWidth: 0 }}>
        {onOpenMenu && (
          <button
            type="button"
            aria-label="More"
            onClick={onOpenMenu}
            className="pmp-press"
            style={{ ...chromeIconButton(44), marginTop: 4 }}
          >
            <Icon name="menu" size={16} />
          </button>
        )}
        <div style={{ minWidth: 0 }}>
          <h1 style={{
            ...type.largeTitle,
            margin: 0,
            color: y2k.offWhite,
            textShadow: "0.045em 0.045em 0 #F74D7A",
          }}>{title}</h1>
          {subtitle && (
            <p
              style={{
                margin: "6px 0 0",
                fontFamily: font,
                fontSize: 14,
                color: color.muted,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </header>
  );
}
