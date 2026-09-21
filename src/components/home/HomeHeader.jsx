import { chromeIconButton, homeSpace } from "../../theme";
import Icon from "../ui/Icon";

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
 * HomeHeader — actions only. No wordmark, callsign, or back control.
 */
export default function HomeHeader({
  onOpenSearch = null,
  onOpenProfile = null,
  onOpenMenu = null,
}) {
  return (
    <header
      className="pmp-home-header"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 8,
        padding: `calc(18px + env(safe-area-inset-top, 0px)) ${homeSpace.gutter}px 6px`,
      }}
    >
      <h1 className="sr-only">Home</h1>
      {onOpenMenu && <HeaderButton label="Browse" icon="menu" onClick={onOpenMenu} />}
      <HeaderButton label="Search" icon="search" onClick={onOpenSearch} />
      <HeaderButton label="Profile" icon="profile" onClick={onOpenProfile} />
    </header>
  );
}
