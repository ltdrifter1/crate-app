import { color, fontDisplay, glassPill, homeSpace, y2k } from "../../theme";
import { BrandGlyph } from "../brand/BrandGlyphs";
import Icon from "../ui/Icon";

function HeaderButton({ label, icon, onClick }) {
  if (!onClick) return <span style={{ width: 40, height: 40 }} aria-hidden="true" />;
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="pmp-press"
      style={{
        ...glassPill({ compact: true }),
        width: 40,
        height: 40,
        padding: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        color: color.muted,
        flexShrink: 0,
      }}
    >
      <Icon name={icon} size={17} />
    </button>
  );
}

/**
 * HomeHeader — centered wordmark + frosted glass controls.
 */
export default function HomeHeader({ onOpenSearch = null, onOpenProfile = null }) {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: `calc(14px + env(safe-area-inset-top, 0px)) ${homeSpace.gutter}px 16px`,
      }}
    >
      <HeaderButton label="Search" icon="search" onClick={onOpenSearch} />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          minWidth: 0,
        }}
      >
        <BrandGlyph size={26} />
        <span
          style={{
            fontFamily: fontDisplay,
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: -0.3,
            color: y2k.offWhite,
            whiteSpace: "nowrap",
          }}
        >
          Planet<span style={{ color: y2k.chromeBright }}> MP3</span>
        </span>
      </div>
      <HeaderButton label="Profile" icon="profile" onClick={onOpenProfile} />
    </header>
  );
}
