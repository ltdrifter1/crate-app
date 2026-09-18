import {
  BTN_PRIMARY,
  BTN_SECONDARY,
  chrome,
  color,
  font,
  fontDisplay,
  fontMono,
  homeSpace,
  motion,
  radius,
  y2k,
} from "../../theme";
import CoverImage from "../ui/CoverImage";
import Icon from "../ui/Icon";

/**
 * Editorial hero — Mixmag-scale photography, iOS type, one Play.
 * Art is a licensed channel still or a catalog sleeve — never a generated plate.
 */
export default function ExploreHero({
  hero,
  onPlay = null,
  onOpen = null,
  playing = false,
}) {
  if (!hero) return null;
  const canPlay = (hero.pool || []).length > 0 || hero.kind === "idle";
  const playLabel =
    hero.kind === "channel"
      ? playing
        ? "Pause"
        : "Tune in"
      : playing
        ? "Pause"
        : "Play";

  return (
    <section
      aria-label={hero.title}
      style={{
        padding: `8px ${homeSpace.gutter}px 0`,
        animation: `rise 0.55s ${motion.ease} 0.04s both`,
      }}
    >
      <div
        className="pmp-explore-hero"
        style={{
          position: "relative",
          borderRadius: 10,
          overflow: "hidden",
          minHeight: 240,
          aspectRatio: "16 / 10",
          maxHeight: 420,
          background: y2k.artGradient,
          boxShadow: `
            inset 0 1px 0 rgba(255,255,255,0.16),
            0 18px 48px rgba(0,0,0,0.45)
          `,
          border: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        {hero.art && (
          <div className="pmp-explore-hero-art" style={{ position: "absolute", inset: 0 }}>
            <CoverImage
              src={hero.art}
              alt=""
              width={1200}
              height={750}
              sizes="(max-width: 720px) 100vw, 1120px"
              priority
              objectPosition={hero.artFocus || "center"}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        )}

        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background: `
              linear-gradient(180deg, rgba(8,10,13,0.08) 0%, rgba(8,10,13,0.2) 38%, rgba(8,10,13,0.88) 100%),
              linear-gradient(90deg, rgba(8,10,13,0.35) 0%, transparent 55%)
            `,
          }}
        />
        <div
          aria-hidden="true"
          className="pmp-explore-hero-scan"
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            opacity: 0.35,
            mixBlendMode: "screen",
            background: `repeating-linear-gradient(
              to bottom,
              transparent 0px, transparent 3px,
              rgba(${chrome.cyanRgb},0.04) 3px, rgba(${chrome.cyanRgb},0.04) 4px
            )`,
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 1,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            padding: "22px 20px 20px",
            gap: 10,
          }}
        >
          {(hero.eyebrow || hero.kicker) ? (
          <div
            style={{
              fontFamily: fontMono,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 1.6,
              textTransform: "uppercase",
              color: y2k.cyan,
              textShadow: `0 0 12px rgba(${chrome.cyanRgb},0.35)`,
            }}
          >
            {[hero.eyebrow, hero.kicker].filter(Boolean).join("  ·  ")}
          </div>
          ) : null}
          <h2
            style={{
              margin: 0,
              fontFamily: fontDisplay,
              fontSize: "clamp(26px, 5vw, 40px)",
              fontWeight: 750,
              letterSpacing: -0.9,
              lineHeight: 1.05,
              color: color.onDark,
              maxWidth: 560,
            }}
          >
            {hero.title}
          </h2>
          {hero.subtitle && (
            <p
              style={{
                margin: 0,
                fontFamily: font,
                fontSize: 15,
                fontWeight: 500,
                letterSpacing: -0.1,
                lineHeight: 1.4,
                color: color.onDarkMuted,
                maxWidth: 420,
              }}
            >
              {hero.subtitle}
            </p>
          )}

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 6 }}>
            {canPlay && hero.kind !== "idle" && (
              <button
                type="button"
                className="pmp-press play-primary"
                onClick={() => onPlay?.(hero)}
                aria-label={`${playLabel} ${hero.title}`}
                style={{
                  ...BTN_PRIMARY,
                  width: "auto",
                  minHeight: 44,
                  padding: "0 18px",
                  borderRadius: 8,
                  fontSize: 15,
                  fontWeight: 650,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Icon name={playing ? "pause" : "play"} size={14} />
                {playLabel}
              </button>
            )}
            {hero.kind === "release" && onOpen && (
              <button
                type="button"
                className="pmp-press"
                onClick={() => onOpen(hero)}
                style={{
                  ...BTN_SECONDARY,
                  width: "auto",
                  minHeight: 44,
                  padding: "0 16px",
                  borderRadius: 8,
                  fontSize: 15,
                  fontWeight: 600,
                  color: color.onDark,
                }}
              >
                Open album
              </button>
            )}
            {hero.kind === "idle" && (
              <span
                style={{
                  fontSize: 13,
                  color: color.muted,
                  fontFamily: font,
                }}
              >
                Load the catalog and this stage fills with stations.
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
