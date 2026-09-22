import { chromeIconButton, color, fontDisplay, fontMono, homeSpace, neons, radio } from "../../theme";
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

/** Time-aware DJ greeting — changes through the day like a real station. */
function stationGreeting() {
  const h = new Date().getHours();
  if (h >= 0  && h < 5)  return { line: "Late signal.", sub: "Headphones on. One more track." };
  if (h >= 5  && h < 9)  return { line: "Sunrise block.", sub: "Soft open. First spins of the day." };
  if (h >= 9  && h < 12) return { line: "Morning session.", sub: "Office speakers. Open windows." };
  if (h >= 12 && h < 15) return { line: "Midday broadcast.", sub: "The crate is open." };
  if (h >= 15 && h < 19) return { line: "After school chaos.", sub: "Bags down. Volume up." };
  if (h >= 19 && h < 22) return { line: "Prime time.", sub: "Appointment listening." };
  return { line: "Night crash.", sub: "Last call. One more." };
}

/**
 * HomeHeader — DJ greeting strip + search field.
 * The greeting makes the app feel like you tuned in, not logged in.
 */
export default function HomeHeader({
  onOpenSearch = null,
  onOpenMenu = null,
  daypart = null,
}) {
  const { line, sub } = stationGreeting();

  return (
    <header
      className="pmp-home-header"
      style={{
        padding: `calc(10px + env(safe-area-inset-top, 0px)) ${homeSpace.gutter}px 6px`,
      }}
    >
      <h1 className="sr-only">Home</h1>

      {/* ── DJ GREETING BAR ─────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 8,
        }}
      >
        <MoreButton onClick={onOpenMenu} />

        <div
          style={{
            flex: 1,
            minWidth: 0,
            padding: "8px 14px",
            borderRadius: radio.radiusLcd,
            background: radio.lcdFace,
            border: radio.lcdBorder,
            boxShadow: radio.lcdShadow,
            display: "flex",
            alignItems: "center",
            gap: 10,
            overflow: "hidden",
          }}
        >
          {/* Live pip */}
          <span
            className="pmp-lcd-pip"
            aria-hidden="true"
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: neons.red,
              boxShadow: `0 0 6px ${neons.red}`,
              flexShrink: 0,
            }}
          />

          {/* Greeting text */}
          <div style={{ minWidth: 0, overflow: "hidden" }}>
            <div
              style={{
                fontFamily: fontMono,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 0.12,
                color: neons.phosphor,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {line}
            </div>
            <div
              style={{
                fontFamily: fontDisplay,
                fontSize: 11,
                fontWeight: 500,
                color: color.lcdMute,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                marginTop: 1,
              }}
            >
              {sub}
            </div>
          </div>

          {/* PLANET MP3 badge */}
          <span
            aria-hidden="true"
            style={{
              marginLeft: "auto",
              flexShrink: 0,
              fontFamily: fontMono,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: 0.2,
              textTransform: "uppercase",
              color: color.lcdSignal,
              opacity: 0.7,
            }}
          >
            PMP
          </span>
        </div>
      </div>

      {/* ── SEARCH ──────────────────────────────────────────────────── */}
      {onOpenSearch && (
        <button
          type="button"
          className="pmp-explore-find"
          onClick={onOpenSearch}
          aria-label="Search"
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 10,
            minHeight: 40,
            padding: "0 12px",
            borderRadius: radio.radiusLcd,
            border: radio.lcdBorder,
            background: "rgba(58,66,80,0.12)",
            boxShadow: "inset 0 1px 3px rgba(58,66,80,0.22)",
            color: color.lcdMute,
            cursor: "pointer",
            textAlign: "left",
            fontFamily: fontMono,
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: 0.04,
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <span style={{ color: color.lcdSignal, display: "flex" }}>
            <Icon name="search" size={13} />
          </span>
          Find a track, artist or scene
        </button>
      )}
    </header>
  );
}
