import { chromeIconButton, color, homeSpace, type, y2k } from "../../theme";
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
        background: "rgba(255,255,255,0.12)",
        border: "none",
        boxShadow: "none",
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
            letterSpacing: 0.2,
            textTransform: "uppercase",
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
          }}
        >
          Planet MP3
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
