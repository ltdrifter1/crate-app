import { chromeIconButton, fontLcd, fontPoster, homeSpace, y2k } from "../../theme";
import { STATION_FREQ } from "../../lib/mtvChannel";
import { BrandGlyph } from "../brand/BrandGlyphs";
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
        borderRadius: 10,
        border: "1px solid rgba(255,255,255,0.16)",
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%), rgba(18,20,24,0.55)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -1px 0 rgba(0,0,0,0.4)",
      }}
    >
      <Icon name={icon} size={16} />
    </button>
  );
}

/**
 * HomeHeader — TRL-era wordmark, hardware keys. Search / Browse / Profile unchanged.
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
        {onOpenMenu && <HeaderButton label="Browse" icon="menu" onClick={onOpenMenu} />}
        <BrandGlyph size={26} />
        <span
          style={{
            display: "inline-flex",
            alignItems: "baseline",
            gap: 0,
            minWidth: 0,
            whiteSpace: "nowrap",
          }}
        >
          <span
            style={{
              fontFamily: fontPoster,
              fontSize: 22,
              fontWeight: 800,
              fontStyle: "italic",
              letterSpacing: -0.7,
              lineHeight: 1,
              color: y2k.offWhite,
            }}
          >
            Planet
          </span>
          <span
            style={{
              fontFamily: fontPoster,
              fontSize: 22,
              fontWeight: 800,
              fontStyle: "italic",
              letterSpacing: -0.4,
              lineHeight: 1,
              color: y2k.cyan,
              textShadow: "0 0 16px rgba(101,230,255,0.35)",
              marginLeft: 5,
            }}
          >
            MP3
          </span>
          <span
            aria-hidden="true"
            style={{
              marginLeft: 8,
              fontFamily: fontLcd,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 1.4,
              color: "rgba(244,246,248,0.42)",
            }}
          >
            {STATION_FREQ}
          </span>
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <HeaderButton label="Search" icon="search" onClick={onOpenSearch} />
        <HeaderButton label="Profile" icon="profile" onClick={onOpenProfile} />
      </div>
    </header>
  );
}
