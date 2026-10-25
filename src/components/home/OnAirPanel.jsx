import { memo } from "react";
import { color, fontDisplay, fontMono, hardware, homeSpace, motion, type } from "../../theme";
import { formatChannelNum } from "../../lib/mtvChannel";
import { useCurrentTrack } from "../../usePlayerTransport";
import CoverImage from "../ui/CoverImage";
import Icon from "../ui/Icon";
import HomeBandHeader from "./HomeBandHeader";

export const ON_AIR_PANEL_ROWS = 5;

/**
 * On air now — desktop Home side column. Every dial and the cut it is
 * spinning this minute; one click tunes in on that cut.
 */
function OnAirPanel({
  channels = [],
  onAir = {},
  activeChannelId = null,
  onTuneChannel = null,
  onShowAll = null,
  limit = ON_AIR_PANEL_ROWS,
  /** Full catalog still landing — hold the column's shape instead of jumping. */
  loading = false,
}) {
  const currentTrack = useCurrentTrack();
  const rows = channels
    .map((channel) => {
      const active = activeChannelId === channel.id;
      const track = active && currentTrack ? currentTrack : onAir[channel.id];
      return track ? { channel, track, active } : null;
    })
    .filter(Boolean)
    .slice(0, Math.max(1, limit));

  if (!rows.length && !loading) return null;

  return (
    <section
      aria-label="On air now"
      className="pmp-onair"
      style={{ animation: `rise 0.5s ${motion.ease} 0.06s both` }}
    >
      <HomeBandHeader
        title="On air now"
        subtitle="What every dial is spinning"
        meta={`${channels.length} channels`}
        flush
      />
      {loading && (
        <div aria-hidden="true" data-testid="onair-loading">
          {Array.from({ length: Math.max(1, limit) }, (_, i) => (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "48px minmax(0, 1fr)",
                alignItems: "center",
                gap: 12,
                padding: "10px 0",
                borderBottom: `1px solid ${color.line}`,
              }}
            >
              <span style={{ width: 48, height: 48, borderRadius: 6, background: color.select }} />
              <span>
                <span style={{ display: "block", width: "40%", height: 10, borderRadius: 3, background: color.select }} />
                <span style={{ display: "block", width: "75%", height: 12, marginTop: 8, borderRadius: 3, background: color.select }} />
              </span>
            </div>
          ))}
        </div>
      )}
      <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {rows.map(({ channel, track, active }) => (
          <li key={channel.id} style={{ borderBottom: `1px solid ${color.line}` }}>
            <button
              type="button"
              className="pmp-press pmp-onair-row"
              aria-pressed={active || undefined}
              aria-label={`Tune ${channel.title} — ${active ? "playing" : "on now"}: ${[track.title, track.artist].filter(Boolean).join(" — ")}`}
              onClick={() => onTuneChannel?.(channel, { startTrack: onAir[channel.id] || null })}
              style={{
                width: "100%",
                display: "grid",
                gridTemplateColumns: "48px minmax(0, 1fr) 32px",
                alignItems: "center",
                gap: 12,
                padding: "10px 0",
                border: "none",
                background: "transparent",
                color: color.ink,
                textAlign: "left",
                cursor: "pointer",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <span
                style={{
                  position: "relative",
                  width: 48,
                  height: 48,
                  borderRadius: 6,
                  overflow: "hidden",
                  boxShadow: `0 0 0 1px ${active ? color.lcdSignal : color.lineStrong}`,
                }}
              >
                <CoverImage
                  src={track.albumCover || null}
                  alt=""
                  width={48}
                  height={48}
                  wellColor={channel.accent || undefined}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </span>
              <span style={{ minWidth: 0 }}>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontFamily: fontMono,
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: 0.6,
                    textTransform: "uppercase",
                    color: color.muted,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      flexShrink: 0,
                      background: active ? color.lcdSignal : color.alert,
                    }}
                  />
                  <span style={{ color: channel.accent || color.muted }}>
                    {formatChannelNum(channel.num)}
                  </span>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                    {channel.shortTitle || channel.title}
                  </span>
                </span>
                <span
                  style={{
                    display: "block",
                    marginTop: 3,
                    fontFamily: fontDisplay,
                    fontSize: 15,
                    fontWeight: 650,
                    letterSpacing: -0.15,
                    lineHeight: 1.2,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {track.title}
                </span>
                <span
                  style={{
                    display: "block",
                    ...type.tileMeta,
                    color: color.body,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {track.artist}
                </span>
              </span>
              <span
                aria-hidden="true"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: active ? color.accent : hardware.keyFace,
                  color: active ? color.onAccent : color.ink,
                  boxShadow: active ? hardware.keyPressed : hardware.keyRaised,
                  border: `1px solid ${active ? "rgba(91,101,116,0.45)" : "rgba(91,101,116,0.22)"}`,
                }}
              >
                <Icon name={active ? "pause" : "play"} size={13} />
              </span>
            </button>
          </li>
        ))}
      </ol>
      {onShowAll && channels.length > rows.length && (
        <button
          type="button"
          onClick={onShowAll}
          className="pmp-press"
          style={{
            marginTop: 10,
            padding: "6px 0",
            border: "none",
            background: "transparent",
            color: color.body,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          All {channels.length} channels ↓
        </button>
      )}
      <div style={{ height: homeSpace.sectionGap }} />
    </section>
  );
}

export default memo(OnAirPanel);
