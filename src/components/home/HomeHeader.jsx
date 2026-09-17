import { chromeIconButton, fontDisplay, homeSpace, y2k } from "../../theme";
import { BrandGlyph } from "../brand/BrandGlyphs";
import Icon from "../ui/Icon";
import BetaBadge from "../billing/BetaLaunchNotice";
import { BETA_LAUNCH } from "../../lib/entitlements";

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
}) {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: `calc(10px + env(safe-area-inset-top, 0px)) ${homeSpace.gutter}px 10px`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          minWidth: 0,
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
        {BETA_LAUNCH && <BetaBadge />}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <HeaderButton label="Search" icon="search" onClick={onOpenSearch} />
        <HeaderButton label="Profile" icon="profile" onClick={onOpenProfile} />
      </div>
    </header>
  );
}
