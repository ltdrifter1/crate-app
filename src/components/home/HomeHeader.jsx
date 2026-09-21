import { chromeIconButton, color, fontMono, homeSpace, radio, y2k } from "../../theme";
import Icon from "../ui/Icon";

function MoreButton({ onClick }) {
  if (!onClick) return null;
  return (
    <button
      type="button"
      aria-label="More"
      onClick={onClick}
      className="pmp-press"
      style={{ ...chromeIconButton(44), flexShrink: 0 }}
    >
      <Icon name="menu" size={16} />
    </button>
  );
}

function OnAirMark() {
  return (
    <div
      className="pmp-home-mark"
      aria-label="On air"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        flexShrink: 0,
        height: 44,
        padding: "0 10px 0 8px",
        borderRadius: radio.radiusLcd,
        border: radio.lcdBorder,
        background: radio.lcdFace,
        boxShadow: radio.lcdShadow,
      }}
    >
      <span
        aria-hidden="true"
        className="pmp-live-led"
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: y2k.live,
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontFamily: fontMono,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 0.12,
          textTransform: "uppercase",
          color: color.lcdSignal,
        }}
      >
        On air
      </span>
    </div>
  );
}

/**
 * HomeHeader — ON AIR mark + labeled Find + overflow.
 * Club lives on the tab bar.
 */
export default function HomeHeader({
  onOpenSearch = null,
  onOpenMenu = null,
}) {
  return (
    <header
      className="pmp-home-header"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: `calc(12px + env(safe-area-inset-top, 0px)) ${homeSpace.gutter}px 8px`,
      }}
    >
      <h1 className="sr-only">Home</h1>
      <OnAirMark />
      {onOpenSearch && (
        <button
          type="button"
          className="pmp-explore-find"
          onClick={onOpenSearch}
          aria-label="Search"
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            alignItems: "center",
            gap: 10,
            minHeight: 44,
            padding: "0 12px",
            borderRadius: radio.radiusLcd,
            border: radio.lcdBorder,
            background: radio.lcdFace,
            boxShadow: radio.lcdShadow,
            color: color.lcdMute,
            cursor: "pointer",
            textAlign: "left",
            fontFamily: fontMono,
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: 0.04,
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <span style={{ color: color.lcdSignal, display: "flex" }}>
            <Icon name="search" size={14} />
          </span>
          Find
        </button>
      )}
      <MoreButton onClick={onOpenMenu} />
    </header>
  );
}
