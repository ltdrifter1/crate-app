import { color, fontDisplay, homeSpace, y2k } from "../../theme";
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
      style={{
        width: 36,
        height: 36,
        padding: 0,
        borderRadius: "50%",
        border: "1px solid rgba(255,255,255,0.1)",
        background: "rgba(255,255,255,0.06)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        color: y2k.offWhite,
        flexShrink: 0,
      }}
    >
      <Icon name={icon} size={16} />
    </button>
  );
}

/**
 * HomeHeader — App Store–clean: brand left, quiet circular controls right.
 */
export default function HomeHeader({ onOpenSearch = null, onOpenProfile = null }) {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: `calc(10px + env(safe-area-inset-top, 0px)) ${homeSpace.gutter}px 8px`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          minWidth: 0,
        }}
      >
        <BrandGlyph size={28} />
        <span
          style={{
            fontFamily: fontDisplay,
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: -0.5,
            color: y2k.offWhite,
            whiteSpace: "nowrap",
          }}
        >
          Planet<span style={{ color: color.muted }}> MP3</span>
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <HeaderButton label="Search" icon="search" onClick={onOpenSearch} />
        <HeaderButton label="Profile" icon="profile" onClick={onOpenProfile} />
      </div>
    </header>
  );
}
