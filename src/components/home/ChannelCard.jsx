import { chrome, fontDisplay, fontMono, homeSpace, radio, y2k } from "../../theme";
import ArtFrame from "../ui/ArtFrame";

/**
 * ChannelCard — dial channel poster with sleeve mosaic + CH bug.
 */
export default function ChannelCard({
  channel,
  covers = [],
  active = false,
  onClick = null,
  size = Math.round(homeSpace.tile * 1.05),
}) {
  const num = String(channel.num ?? 0).padStart(2, "0");
  const h = Math.round(size * 1.18);

  const bugBase = {
    position: "absolute",
    zIndex: 1,
    fontFamily: fontMono,
    fontWeight: 800,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    borderRadius: radio.radiusLcd,
    border: active
      ? "1px solid rgba(101,230,255,0.42)"
      : "1px solid rgba(255,255,255,0.18)",
    background: active
      ? `
        linear-gradient(180deg, rgba(101,230,255,0.18) 0%, rgba(101,230,255,0.05) 100%),
        rgba(8,12,16,0.62)
      `
      : `
        linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 100%),
        rgba(10,11,13,0.55)
      `,
    backdropFilter: "blur(16px) saturate(1.3)",
    WebkitBackdropFilter: "blur(16px) saturate(1.3)",
    boxShadow: active
      ? `inset 0 1px 0 rgba(255,255,255,0.22), 0 0 14px rgba(${chrome.cyanRgb},0.18)`
      : "inset 0 1px 0 rgba(255,255,255,0.16), 0 6px 16px rgba(0,0,0,0.3)",
  };

  return (
    <button
      type="button"
      aria-label={`Tune ${channel.title} — ${channel.tagline}`}
      aria-pressed={active || undefined}
      onClick={onClick || undefined}
      className="pmp-lift"
      style={{
        flex: "0 0 auto",
        scrollSnapAlign: "start",
        width: size,
        background: "none",
        border: "none",
        padding: 0,
        cursor: "pointer",
        textAlign: "left",
        WebkitTapHighlightColor: "transparent",
        touchAction: "pan-x",
      }}
    >
      <ArtFrame
        covers={covers}
        size={size}
        width={size}
        height={h}
        active={active}
        radius={14}
      >
        <span
          style={{
            ...bugBase,
            top: 10,
            left: 10,
            fontSize: 10,
            color: active ? chrome.signal : y2k.offWhite,
            padding: "6px 9px",
          }}
        >
          CH·{num}
        </span>

        {active && (
          <span
            style={{
              ...bugBase,
              top: 10,
              right: 10,
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontSize: 9,
              letterSpacing: 1.4,
              color: chrome.signal,
              padding: "6px 8px",
            }}
          >
            <span
              aria-hidden="true"
              className="pmp-live-led"
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: chrome.live,
                boxShadow: `0 0 6px rgba(${chrome.liveRgb},0.55)`,
              }}
            />
            On air
          </span>
        )}

        {/* Lower-third plate */}
        <span
          style={{
            position: "absolute",
            left: 8,
            right: 8,
            bottom: 8,
            zIndex: 1,
            padding: "12px 12px 11px",
            borderRadius: radio.radiusTight,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 100%), rgba(10,11,13,0.58)",
            border: "1px solid rgba(255,255,255,0.14)",
            backdropFilter: "blur(16px) saturate(1.3)",
            WebkitBackdropFilter: "blur(16px) saturate(1.3)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.16), 0 8px 20px rgba(0,0,0,0.35)",
          }}
        >
          <span
            style={{
              display: "block",
              fontFamily: fontDisplay,
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: -0.25,
              color: y2k.offWhite,
              lineHeight: 1.15,
            }}
          >
            {channel.shortTitle || channel.title}
          </span>
          <span
            style={{
              display: "block",
              marginTop: 4,
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: -0.05,
              color: "rgba(244,246,248,0.62)",
              lineHeight: 1.3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {channel.tagline}
          </span>
        </span>
      </ArtFrame>
    </button>
  );
}
