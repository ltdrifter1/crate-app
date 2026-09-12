import { chromeIconButton, color, fontDisplay, homeSpace, y2k } from "../../theme";
import { BrandGlyph } from "../brand/BrandGlyphs";
import Icon from "../ui/Icon";

function HeaderButton({ label, icon, onClick }) {
  if (!onClick) return <span style={{ width: 36, height: 36 }} aria-hidden="true" />;
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
 * HomeHeader — wordmark + quiet iOS header controls.
 */
export default function HomeHeader({
  onOpenSearch = null,
  onOpenCharts = null,
  onOpenProfile = null,
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
        <BrandGlyph size={26} />
        <span
          style={{
            fontFamily: fontDisplay,
            fontSize: 21,
            fontWeight: 700,
            letterSpacing: -0.45,
            color: y2k.offWhite,
            whiteSpace: "nowrap",
          }}
        >
          Planet<span style={{ color: color.muted }}> MP3</span>
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <HeaderButton label="Charts" icon="chart" onClick={onOpenCharts} />
        <HeaderButton label="Search" icon="search" onClick={onOpenSearch} />
        <HeaderButton label="Profile" icon="profile" onClick={onOpenProfile} />
      </div>
    </header>
  );
}
