import { color, fontDisplay, fontMono, hardware, homeSpace, type, y2k } from "../../theme";
import { resolveChannelArt } from "../../lib/channelArt";
import { formatChannelNum } from "../../lib/mtvChannel";
import CoverImage from "../ui/CoverImage";
import DefaultSleeve from "../ui/DefaultSleeve";
import Icon from "../ui/Icon";

/**
 * ChannelCard — square station tile.
 * Catalog sleeve first; PS1 plate only as fallback. CH number stays an LCD bug.
 */
function ChannelArt({
  channel,
  covers = [],
  size,
  priority = false,
  eager = false,
}) {
  const sleeve = Array.isArray(covers) ? covers.find(Boolean) : null;
  if (sleeve) {
    return (
      <CoverImage
        src={sleeve}
        alt=""
        width={size}
        height={size}
        priority={priority}
        eager={eager}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    );
  }

  const { src, focus } = resolveChannelArt(channel);
  if (src) {
    return (
      <CoverImage
        src={src}
        alt=""
        width={size}
        height={size}
        priority={priority}
        eager={eager}
        raw
        objectPosition={focus}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    );
  }

  return <DefaultSleeve size={size} />;
}

export default function ChannelCard({
  channel,
  covers = [],
  active = false,
  onClick = null,
  size = Math.round(homeSpace.tileTicket),
  priority = false,
  eager = false,
}) {
  const width = size;
  const title = channel.shortTitle || channel.title;
  const dial = formatChannelNum(channel.num);
  const iceRing = `0 0 0 2px ${color.lcdSignal}, 0 0 18px ${color.lcdSignalGlow}, 0 16px 36px rgba(58,66,80,0.3), inset 0 1px 0 rgba(255,255,255,0.55), inset 0 -3px 8px rgba(58,66,80,0.28)`;
  /** Station ink — printed divider-card colour. Identity, never state. */
  const ink = channel.accent || color.accent;

  return (
    <button
      type="button"
      aria-label={`Tune ${channel.title} — ${channel.tagline}`}
      aria-pressed={active || undefined}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
      className="pmp-lift pmp-channel-card"
      style={{
        flex: "0 0 auto",
        scrollSnapAlign: "start",
        width,
        padding: 0,
        margin: 0,
        border: "none",
        background: "transparent",
        cursor: "pointer",
        textAlign: "left",
        WebkitTapHighlightColor: "transparent",
        touchAction: "manipulation",
      }}
    >
      <span
        className="pmp-channel-card-frame"
        style={{
          position: "relative",
          display: "block",
          width,
          height: width,
          borderRadius: 8,
          overflow: "hidden",
          background: y2k.artGradient,
          boxShadow: active
            ? iceRing
            : "inset 0 1px 0 rgba(255,255,255,0.62), inset 0 -3px 8px rgba(58,66,80,0.22), 0 14px 32px rgba(58,66,80,0.24)",
          border: active
            ? `1.5px solid ${color.lcdSignal}`
            : "1.5px solid rgba(216,223,232,0.55)",
        }}
      >
        <span
          className="pmp-channel-card-art"
          style={{
            position: "relative",
            zIndex: 1,
            display: "block",
            width: "100%",
            height: "100%",
            overflow: "hidden",
            background: y2k.artGradient,
          }}
        >
          <ChannelArt
            channel={channel}
            covers={covers}
            size={width}
            priority={priority}
            eager={eager}
          />

          <span
            aria-hidden="true"
            style={{
              pointerEvents: "none",
              position: "absolute",
              inset: 0,
              zIndex: 1,
              background:
                "linear-gradient(165deg, rgba(255,255,255,0.28) 0%, rgba(232,241,248,0.06) 32%, transparent 58%)",
            }}
          />

          <span
            aria-hidden="true"
            className="pmp-channel-ch-bug"
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              zIndex: 2,
              minWidth: 28,
              height: 20,
              padding: "0 7px",
              borderRadius: 3,
              background: ink,
              border: "1px solid rgba(20,24,30,0.32)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.30), 0 2px 5px rgba(28,34,42,0.35)",
              color: "#F4F7FA",
              fontFamily: fontMono,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: 0.8,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {dial.replace("CH-", "")}
          </span>

          {active && (
            <span
              style={{
                position: "absolute",
                top: 10,
                left: 10,
                zIndex: 2,
                height: 20,
                padding: "0 7px",
                borderRadius: 3,
                background: "rgba(42,51,60,0.78)",
                border: "1px solid rgba(90,196,214,0.32)",
                color: color.lcdSignal,
                letterSpacing: 0.1,
                textTransform: "uppercase",
                ...type.caption,
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              Playing
            </span>
          )}

          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              right: 10,
              bottom: 10,
              zIndex: 2,
              width: 32,
              height: 32,
              borderRadius: 8,
              background: active ? color.accent : hardware.keyFace,
              color: active ? color.onAccent : color.ink,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: active
                ? hardware.keyPressed
                : hardware.keyRaised,
              border: `1px solid ${active ? "rgba(91,101,116,0.45)" : "rgba(91,101,116,0.22)"}`,
              paddingLeft: active ? 0 : 1,
            }}
          >
            <Icon name={active ? "pause" : "play"} size={13} />
          </span>
        </span>
      </span>

      <span
        aria-hidden="true"
        style={{
          display: "block",
          marginTop: 7,
          height: 3,
          borderRadius: 2,
          background: ink,
          opacity: active ? 1 : 0.82,
        }}
      />

      <span
        style={{
          display: "block",
          marginTop: 6,
          fontFamily: fontDisplay,
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: 0.55,
          textTransform: "uppercase",
          color: color.ink,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {title}
      </span>
      <span
        style={{
          display: "block",
          marginTop: 2,
          ...type.tileMeta,
          color: color.muted,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {channel.tagline}
      </span>
    </button>
  );
}
