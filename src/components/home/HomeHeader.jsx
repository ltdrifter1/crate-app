import { chromeIconButton, color, homeSpace, type, y2k } from "../../theme";
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
        background: "linear-gradient(180deg, #FFFFFF 0%, #E8EBEF 55%, #D4D8E0 100%)",
        border: "1px solid rgba(28,32,40,0.12)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.95), 0 1px 3px rgba(28,32,40,0.12)",
      }}
    >
      <Icon name={icon} size={16} />
    </button>
  );
}

function formatStoreDate(date = new Date()) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

/**
 * HomeHeader — App Store large title: date caption + product name.
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
            ...type.footnote,
            fontWeight: 600,
            letterSpacing: -0.2,
            textTransform: "none",
            color: color.muted,
            marginBottom: 4,
          }}
        >
          {formatStoreDate()}
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
