import {
  BTN_PRIMARY,
  color,
  fontDisplay,
  fontMono,
  homeSpace,
  motion,
  radio,
  y2k,
} from "../../theme";
import Icon from "../ui/Icon";
import ArtFrame from "../ui/ArtFrame";
import { trackBrowseBits } from "../player/DeviceChrome";

function mp3FileName(track, index) {
  const n = String(index + 1).padStart(2, "0");
  const raw = String(track?.title || "UNTITLED")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 18)
    .toUpperCase();
  return `${n}  ${raw || "UNTITLED"}.MP3`;
}

/**
 * Walkman folder — LCD crate, disc in a well, filenames as the track list.
 */
export default function ExploreFocus({
  focus,
  onBack = null,
  onPlayPool = null,
  onPlayTrack = null,
  activeId = null,
}) {
  if (!focus) return null;
  const pool = focus.pool || [];
  const art = focus.photo || focus.covers?.[0] || null;

  return (
    <div
      style={{
        paddingBottom: 56,
        animation: `rise 0.4s ${motion.ease} both`,
      }}
    >
      <header
        style={{
          padding: `calc(12px + env(safe-area-inset-top, 0px)) ${homeSpace.gutter}px 8px`,
        }}
      >
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to Explore"
          className="pmp-press"
          style={{
            background: "none",
            border: "none",
            color: color.body,
            fontFamily: fontDisplay,
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: -0.2,
            cursor: "pointer",
            padding: "0 0 12px",
          }}
        >
          ‹ Explore
        </button>
      </header>

      <div style={{ padding: `0 ${homeSpace.gutter}px 8px` }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "auto minmax(0, 1fr)",
            gap: 16,
            alignItems: "center",
            padding: 14,
            borderRadius: radio.radius,
            border: radio.border,
            background: radio.moduleFace,
            boxShadow: radio.moduleShadow,
          }}
        >
          <ArtFrame
            src={art}
            covers={focus.covers}
            size={132}
            radius={8}
            priority
            style={{ width: 132, height: 132 }}
          />
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontFamily: fontMono,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 0.14,
                textTransform: "uppercase",
                color: color.lcdMute,
                marginBottom: 6,
              }}
            >
              {focus.eyebrow || "Folder"}
              {focus.cities?.[0] ? ` · ${focus.cities[0]}` : ""}
            </div>
            <h1
              style={{
                margin: 0,
                fontFamily: fontDisplay,
                fontSize: 24,
                fontWeight: 750,
                letterSpacing: -0.5,
                color: y2k.offWhite,
                lineHeight: 1.12,
              }}
            >
              {focus.label}
            </h1>
            {focus.story && (
              <p
                style={{
                  margin: "6px 0 0",
                  fontSize: 13,
                  color: color.muted,
                  lineHeight: 1.4,
                }}
              >
                {focus.story}
              </p>
            )}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginTop: 12,
              }}
            >
              <div
                style={{
                  fontFamily: fontMono,
                  fontSize: 11,
                  fontWeight: 700,
                  color: color.muted,
                }}
              >
                {pool.length} {pool.length === 1 ? "FILE" : "FILES"}
              </div>
              {pool.length > 0 && (
                <button
                  type="button"
                  className="pmp-press play-primary"
                  onClick={() => onPlayPool?.(pool[0], pool, focus)}
                  style={{
                    ...BTN_PRIMARY,
                    width: "auto",
                    minHeight: 40,
                    padding: "0 16px",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 650,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Icon name="play" size={13} />
                  Play
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {pool.length > 0 ? (
        <div
          role="list"
          aria-label="Folder files"
          style={{
            margin: `12px ${homeSpace.gutter}px 0`,
            borderRadius: radio.radiusLcd,
            border: radio.lcdBorder,
            background: radio.lcdFace,
            boxShadow: radio.lcdShadow,
            overflow: "hidden",
          }}
        >
          {pool.slice(0, 48).map((track, i) => {
            const active = activeId === track.id;
            return (
              <button
                key={track.id}
                type="button"
                role="listitem"
                className="pmp-press"
                aria-label={`Play ${track.title} by ${track.artist}`}
                onClick={() => onPlayTrack?.(track, pool)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr) auto",
                  gap: 10,
                  width: "100%",
                  padding: "10px 12px",
                  border: "none",
                  borderBottom:
                    i < Math.min(pool.length, 48) - 1
                      ? "1px solid rgba(183,228,238,0.08)"
                      : "none",
                  background: active ? "rgba(183,228,238,0.1)" : "transparent",
                  cursor: "pointer",
                  textAlign: "left",
                  color: active ? color.lcdInk : color.lcdSignal,
                  fontFamily: fontMono,
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: 0.02,
                }}
              >
                <span
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {mp3FileName(track, i)}
                </span>
                <span
                  style={{
                    color: color.lcdMute,
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: 120,
                    textAlign: "right",
                  }}
                >
                  {trackBrowseBits(track).join(" · ") || track.artist}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <p
          style={{
            margin: `20px ${homeSpace.gutter}px`,
            color: color.muted,
            fontSize: 14,
            lineHeight: 1.45,
          }}
        >
          Nothing in this folder yet. Search the catalog or pick another disc.
        </p>
      )}
    </div>
  );
}
