import {
  BTN_PRIMARY,
  color,
  font,
  fontDisplay,
  fontMono,
  homeSpace,
  motion,
  y2k,
} from "../../theme";
import CoverImage from "../ui/CoverImage";
import Icon from "../ui/Icon";
import ArtFrame from "../ui/ArtFrame";

/**
 * In-Explore destination — genre / mood / scene crate.
 * Play the pool, or tap a sleeve. Back stays on Explore.
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
            position: "relative",
            borderRadius: 16,
            overflow: "hidden",
            minHeight: 180,
            aspectRatio: "16 / 8",
            background: y2k.artGradient,
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 16px 40px rgba(0,0,0,0.4)",
          }}
        >
          {art && (
            <CoverImage
              src={art}
              alt=""
              width={1200}
              height={600}
              objectPosition={focus.photoFocus || "center"}
              priority
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          )}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(8,10,13,0.1) 0%, rgba(8,10,13,0.82) 100%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 18,
              right: 18,
              bottom: 16,
            }}
          >
            <div
              style={{
                fontFamily: fontMono,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                color: y2k.cyan,
                marginBottom: 6,
              }}
            >
              {focus.eyebrow}
              {focus.cities?.[0] ? `  ·  ${focus.cities[0]}` : ""}
            </div>
            <h1
              style={{
                margin: 0,
                fontFamily: fontDisplay,
                fontSize: 28,
                fontWeight: 750,
                letterSpacing: -0.6,
                color: color.onDark,
              }}
            >
              {focus.label}
            </h1>
            {focus.story && (
              <p
                style={{
                  margin: "6px 0 0",
                  fontSize: 14,
                  fontWeight: 500,
                  color: "rgba(244,246,248,0.72)",
                  lineHeight: 1.4,
                  maxWidth: 420,
                  fontFamily: font,
                }}
              >
                {focus.story}
              </p>
            )}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginTop: 16,
          }}
        >
          <div
            style={{
              fontSize: 13,
              color: color.muted,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {pool.length} {pool.length === 1 ? "cut" : "cuts"}
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
                borderRadius: 980,
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

      {pool.length > 0 ? (
        <div
          className="pmp-explore-grid"
          style={{
            padding: `16px ${homeSpace.gutter}px 0`,
          }}
        >
          {pool.slice(0, 48).map((track) => (
            <button
              key={track.id}
              type="button"
              className="pmp-lift"
              aria-label={`Play ${track.title} by ${track.artist}`}
              onClick={() => onPlayTrack?.(track, pool)}
              style={{
                width: "100%",
                padding: 0,
                border: "none",
                background: "none",
                cursor: "pointer",
                textAlign: "left",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <ArtFrame
                src={track.albumCover || null}
                width="100%"
                height="auto"
                active={activeId === track.id}
                radius={12}
                style={{ aspectRatio: "1 / 1", height: "auto", width: "100%" }}
              />
              <span
                style={{
                  display: "block",
                  marginTop: 8,
                  fontFamily: fontDisplay,
                  fontSize: 13,
                  fontWeight: 650,
                  letterSpacing: -0.2,
                  color: color.ink,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {track.title}
              </span>
              <span
                style={{
                  display: "block",
                  marginTop: 2,
                  fontSize: 12,
                  color: color.muted,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {track.artist}
              </span>
            </button>
          ))}
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
          Nothing in this crate yet. Search the catalog or pick another lane.
        </p>
      )}
    </div>
  );
}
