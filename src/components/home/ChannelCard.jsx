import { color, homeSpace, type, y2k } from "../../theme";
import { resolveChannelArt } from "../../lib/channelArt";
import CoverImage from "../ui/CoverImage";
import Icon from "../ui/Icon";

/**
 * ChannelCard — square station tile.
 * Original icon, name, blurb, play. Local is the same card as every other station.
 */
function ChannelArt({ src, title, size, accent, objectPosition, priority = false, eager = false }) {
  const initial = (title || "?").trim().charAt(0).toUpperCase() || "?";

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
        objectPosition={objectPosition}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: accent
          ? `linear-gradient(160deg, ${accent} 0%, #10141A 78%)`
          : y2k.artGradient,
        fontFamily: type.title2.fontFamily,
        fontSize: Math.round(size * 0.28),
        fontWeight: 600,
        letterSpacing: -0.8,
        color: "rgba(244,246,248,0.82)",
      }}
    >
      {initial}
    </span>
  );
}

export default function ChannelCard({
  channel,
  active = false,
  onClick = null,
  size = Math.round(homeSpace.tileTicket),
  priority = false,
  eager = false,
}) {
  const width = size;
  const title = channel.shortTitle || channel.title;
  const { src: photo, focus } = resolveChannelArt(channel);

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
            ? "0 0 0 3px rgba(245,245,247,0.92), 0 10px 24px rgba(0,0,0,0.38)"
            : "0 8px 22px rgba(0,0,0,0.32)",
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
            src={photo}
            title={title}
            size={width}
            accent={channel.accent}
            objectPosition={focus}
            priority={priority}
            eager={eager}
          />

          {active && (
            <span
              style={{
                position: "absolute",
                top: 10,
                left: 10,
                zIndex: 2,
                height: 22,
                padding: "0 9px",
                borderRadius: 11,
                background: "rgba(0,0,0,0.55)",
                color: color.onDark,
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
              borderRadius: "50%",
              background: "rgba(255,255,255,0.94)",
              color: "#0B0C0F",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(0,0,0,0.28)",
              paddingLeft: active ? 0 : 1,
            }}
          >
            <Icon name={active ? "pause" : "play"} size={13} />
          </span>
        </span>
      </span>

      <span
        style={{
          display: "block",
          marginTop: 8,
          ...type.tileTitle,
          color: y2k.offWhite,
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
