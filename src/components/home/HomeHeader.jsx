import { chromeIconButton, color, fontMono, homeSpace } from "../../theme";
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
      style={chromeIconButton(36)}
    >
      <Icon name={icon} size={16} />
    </button>
  );
}

/**
 * HomeHeader — device masthead, not App Store date title.
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
        padding: `calc(18px + env(safe-area-inset-top, 0px)) ${homeSpace.gutter}px 6px`,
      }}
    >
      <div style={{ minWidth: 0, display: "flex", alignItems: "center", gap: 10 }}>
        <h1
          style={{
            margin: 0,
            fontFamily: fontMono,
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: 0.14,
            textTransform: "uppercase",
            color: color.accent,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          PLANET / 003
        </h1>
        {BETA_LAUNCH && <BetaBadge />}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {onOpenMenu && <HeaderButton label="Browse" icon="menu" onClick={onOpenMenu} />}
        <HeaderButton label="Search" icon="search" onClick={onOpenSearch} />
        <HeaderButton label="Profile" icon="profile" onClick={onOpenProfile} />
      </div>
    </header>
  );
}
