import { chromeIconButton, fontDisplay, homeSpace, y2k } from "../../theme";
import { BrandGlyph } from "../brand/BrandGlyphs";
import Icon from "../ui/Icon";

function HeaderButton({ label, icon, onClick }) {
  if (!onClick) return null;
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="pmp-press"
      style={{
        ...chromeIconButton(36),
        borderRadius: 10,
        border: "1px solid rgba(255,255,255,0.16)",
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%), rgba(18,20,24,0.55)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -1px 0 rgba(0,0,0,0.4)",
      }}
    >
      <Icon name={icon} size={16} />
    </button>
  );
}

/**
 * HomeHeader — Apple Music–clean wordmark. Search / Browse / Profile unchanged.
 */
export default function HomeHeader({
  onOpenSearch = null,
  onOpenProfile = null,
  onOpenMenu = null,
  overlay = false,
}) {
  return (
    <header
      className={overlay ? "pmp-home-header-overlay" : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: `calc(10px + env(safe-area-inset-top, 0px)) ${homeSpace.gutter}px 10px`,
        ...(overlay
          ? {
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              zIndex: 8,
              background:
                "linear-gradient(180deg, rgba(5,6,8,0.72) 0%, rgba(5,6,8,0.2) 70%, transparent 100%)",
              pointerEvents: "none",
            }
          : null),
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          minWidth: 0,
          pointerEvents: "auto",
        }}
      >
        {onOpenMenu && <HeaderButton label="Browse" icon="menu" onClick={onOpenMenu} />}
        <BrandGlyph size={26} />
        <span
          style={{
            fontFamily: fontDisplay,
            fontSize: 21,
            fontWeight: 700,
            letterSpacing: -0.55,
            lineHeight: 1,
            color: y2k.offWhite,
            whiteSpace: "nowrap",
          }}
        >
          Planet MP3
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, pointerEvents: "auto" }}>
        <HeaderButton label="Search" icon="search" onClick={onOpenSearch} />
        <HeaderButton label="Profile" icon="profile" onClick={onOpenProfile} />
      </div>
    </header>
  );
}
