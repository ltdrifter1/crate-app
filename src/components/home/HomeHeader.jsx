import { chromeIconButton, color, fontDisplay, fontMono, homeSpace, y2k } from "../../theme";
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
 * HomeHeader — station ID strip: ON AIR chip, wordmark, chrome controls.
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
        <span
          aria-hidden="true"
          className="pmp-onair-chip"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            height: 26,
            padding: "0 8px",
            borderRadius: 6,
            border: "1px solid rgba(101,230,255,0.28)",
            background: "rgba(101,230,255,0.1)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.16), 0 0 14px rgba(101,230,255,0.12)",
            fontFamily: fontMono,
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: 1.4,
            textTransform: "uppercase",
            color: y2k.cyan,
            flexShrink: 0,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: y2k.neon,
              boxShadow: `0 0 8px ${y2k.neon}`,
              animation: "stageLiveDot 1.8s ease-in-out infinite",
            }}
          />
          <span className="pmp-onair-chip-label">On air</span>
        </span>
        <BrandGlyph size={26} />
        <span
          style={{
            fontFamily: fontDisplay,
            fontSize: 21,
            fontWeight: 750,
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
