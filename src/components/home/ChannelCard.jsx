import { color, glass, hardware, homeSpace, type, y2k } from "../../theme";
import { isChannelPictogram, resolveChannelArt } from "../../lib/channelArt";
import CoverImage from "../ui/CoverImage";
import Icon from "../ui/Icon";

/**
 * ChannelCard — square station tile.
 * Catalog sleeves first; Channel Surfing pictogram is a corner bug.
 */
function ChannelArt({
  src,
  covers = [],
  title,
  size,
  accent,
  objectPosition,
  priority = false,
  eager = false,
}) {
  const mosaic = (covers || []).filter(Boolean).slice(0, 4);
  const initial = (title || "?").trim().charAt(0).toUpperCase() || "?";

  if (mosaic.length >= 2) {
    return (
      <span
        aria-hidden="true"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: mosaic.length >= 4 ? "1fr 1fr" : "1fr",
          width: "100%",
          height: "100%",
        }}
      >
        {mosaic.slice(0, 4).map((url, i) => (
          <span key={`${url}-${i}`} style={{ overflow: "hidden" }}>
            <CoverImage
              src={url}
              alt=""
              width={Math.round(size / 2)}
              height={Math.round(size / 2)}
              priority={priority && i === 0}
              eager={eager && i < 2}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </span>
        ))}
      </span>
    );
  }

  const lead = mosaic[0] || src;
  if (lead) {
    return (
      <CoverImage
        src={lead}
        alt=""
        width={size}
        height={size}
        priority={priority}
        eager={eager}
        raw={!mosaic[0]}
        objectPosition={mosaic[0] ? "center" : objectPosition}
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
          ? `linear-gradient(160deg, ${accent} 0%, #6A7482 78%)`
          : y2k.artGradient,
        fontFamily: type.title2.fontFamily,
        fontSize: Math.round(size * 0.28),
        fontWeight: 600,
        letterSpacing: -0.8,
        color: color.lcdInk,
      }}
    >
      {initial}
    </span>
  );
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
  const { src: photo, focus } = resolveChannelArt(channel);
  const sleeves = (covers || []).filter((url) => url && !isChannelPictogram(url));
  const showBug = sleeves.length > 0 && photo;

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
          borderRadius: 10,
          overflow: "hidden",
          background: y2k.artGradient,
          boxShadow: active
            ? `0 0 0 2px ${color.accent}, 0 14px 32px rgba(58,66,80,0.28), inset 0 1px 0 rgba(255,255,255,0.45)`
            : "inset 0 1px 0 rgba(255,255,255,0.5), 0 10px 26px rgba(58,66,80,0.2)",
          border: "1px solid rgba(216,223,232,0.42)",
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
            covers={sleeves}
            title={title}
            size={width}
            accent={channel.accent}
            objectPosition={focus}
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

          {showBug && (
            <span
              aria-hidden="true"
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                zIndex: 2,
                width: 28,
                height: 28,
                borderRadius: 8,
                overflow: "hidden",
                border: "1px solid rgba(216,223,232,0.5)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4), 0 4px 10px rgba(58,66,80,0.28)",
                background: glass.fillStrong,
                backdropFilter: glass.blurSoft,
                WebkitBackdropFilter: glass.blurSoft,
              }}
            >
              <CoverImage
                src={photo}
                alt=""
                width={28}
                height={28}
                raw
                objectPosition={focus}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </span>
          )}

          {active && (
            <span
              style={{
                position: "absolute",
                top: 10,
                left: 10,
                zIndex: 2,
                height: 20,
                padding: "0 7px",
                borderRadius: 4,
                background: "rgba(74,83,96,0.55)",
                backdropFilter: "blur(12px) saturate(1.12)",
                WebkitBackdropFilter: "blur(12px) saturate(1.12)",
                border: "1px solid rgba(216,223,232,0.35)",
                color: color.lcdInk,
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
        style={{
          display: "block",
          marginTop: 8,
          ...type.tileTitle,
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
