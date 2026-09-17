import { chromeIconButton, color, fontMono, homeSpace, type, y2k } from "../../theme";
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
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: 12,
        padding: `calc(18px + env(safe-area-inset-top, 0px)) ${homeSpace.gutter}px 6px`,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontFamily: fontMono,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 0.14,
            textTransform: "uppercase",
            color: color.accent,
            marginBottom: 6,
          }}
        >
          PLANET / 003
        </div>
        <h1
          style={{
            ...type.largeTitle,
            margin: 0,
            color: y2k.offWhite,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          Planet MP3
          {BETA_LAUNCH && <BetaBadge />}
        </h1>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 4 }}>
        {onOpenMenu && <HeaderButton label="Browse" icon="menu" onClick={onOpenMenu} />}
        <HeaderButton label="Search" icon="search" onClick={onOpenSearch} />
        <HeaderButton label="Profile" icon="profile" onClick={onOpenProfile} />
      </div>
    </header>
  );
}
