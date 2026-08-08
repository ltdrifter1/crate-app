import { color, fontDisplay, homeSpace, y2k } from "../../theme";
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
        width: 40,
        height: 40,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        border: "1px solid rgba(255,255,255,0.1)",
        background: "rgba(24,27,32,0.55)",
        color: color.muted,
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        flexShrink: 0,
      }}
    >
      <Icon name={icon} size={17} />
    </button>
  );
}

/**
 * HomeHeader — centered PlanetMP3 wordmark, minimal search / profile controls.
 */
export default function HomeHeader({ onOpenSearch = null, onOpenProfile = null }) {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: `calc(14px + env(safe-area-inset-top, 0px)) ${homeSpace.gutter}px 18px`,
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
            fontSize: 19,
            fontWeight: 800,
            fontStyle: "italic",
            letterSpacing: 1.2,
            color: y2k.offWhite,
            whiteSpace: "nowrap",
            textShadow: `0 0 24px ${y2k.purpleWash}`,
          }}
        >
          PLANET<span style={{ color: y2k.purpleBright }}>MP3</span>
        </span>
      </div>
      <HeaderButton label="Profile" icon="profile" onClick={onOpenProfile} />
    </header>
  );
}
