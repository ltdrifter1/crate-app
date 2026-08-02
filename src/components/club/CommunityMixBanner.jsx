/**
 * Home / Library — this month's Community Mix as a pressed flyer plate.
 */
import {
  fontDisplay, fontMono, color, radius, glass, homeSpace,
} from "../../theme";
import { COMMUNITY_MIX_TITLE, formatMonthLabel } from "../../lib/mixes";

export default function CommunityMixBanner({
  mix,
  onOpen,
  onPlay,
  coverTracks = [],
  delay = 0.08,
}) {
  if (!mix) return null;
  const curator = mix.featuredCurator?.displayName || mix.ownerName;
  const count = (mix.trackIds || []).length;
  const covers = (coverTracks || []).filter((t) => t?.albumCover).slice(0, 4);

  return (
    <section
      style={{
        padding: `8px ${homeSpace.gutter}px 28px`,
        animation: `rise 0.55s cubic-bezier(0.22,1,0.36,1) ${delay}s both`,
      }}
    >
      <div style={{
        fontSize: 11,
        fontWeight: 650,
        letterSpacing: 1.5,
        textTransform: "uppercase",
        color: color.muted,
        fontFamily: fontMono,
        marginBottom: 12,
      }}>
        Mixtape Club
      </div>
      <button
        type="button"
        onClick={onOpen}
        style={{
          width: "100%",
          textAlign: "left",
          border: `1px solid ${glass.border}`,
          borderRadius: radius.lg,
          padding: 0,
          cursor: "pointer",
          color: color.ink,
          overflow: "hidden",
          background: color.ink,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.12), ${glass.shadow}`,
        }}
      >
        {/* Full-bleed sleeve mosaic */}
        <div style={{ position: "relative", height: 148, overflow: "hidden" }}>
          {covers.length > 0 ? (
            <div style={{
              display: "grid",
              gridTemplateColumns: covers.length === 1 ? "1fr" : "1fr 1fr",
              gridTemplateRows: covers.length <= 2 ? "1fr" : "1fr 1fr",
              width: "100%",
              height: "100%",
            }}>
              {covers.map((t) => (
                <div key={t.id} style={{
                  backgroundImage: `url(${t.albumCover})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}/>
              ))}
            </div>
          ) : (
            <div style={{
              width: "100%", height: "100%",
              background: "linear-gradient(135deg, #2a2e36 0%, #1A1D24 55%, #3D4450 100%)",
            }}/>
          )}
          <div aria-hidden="true" style={{
            position: "absolute", inset: 0,
            background: `
              linear-gradient(180deg, rgba(26,29,36,0.15) 0%, rgba(26,29,36,0.55) 55%, rgba(26,29,36,0.92) 100%)
            `,
          }}/>
          <div style={{
            position: "absolute", left: 18, right: 18, bottom: 16,
          }}>
            <div style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 1.6,
              textTransform: "uppercase",
              color: "rgba(244,246,249,0.55)",
              fontFamily: fontMono,
              marginBottom: 6,
            }}>
              {mix.monthKey ? formatMonthLabel(mix.monthKey) : "This month"} · Pressed plate
            </div>
            <div style={{
              fontSize: "clamp(22px, 5vw, 28px)",
              fontWeight: 750,
              letterSpacing: -0.7,
              fontFamily: fontDisplay,
              lineHeight: 1.1,
              color: color.onDark,
            }}>
              {mix.title || COMMUNITY_MIX_TITLE}
            </div>
          </div>
        </div>

        <div style={{
          padding: "14px 18px 16px",
          background: `
            linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(242,244,247,0.92) 100%)
          `,
          borderTop: `1px solid ${glass.borderSoft}`,
        }}>
          <div style={{ fontSize: 13, color: color.body, lineHeight: 1.45, marginBottom: 12 }}>
            {curator
              ? `Curated by ${curator} · ${count} track${count === 1 ? "" : "s"} · pressed for every member`
              : `${count} track${count === 1 ? "" : "s"} · pressed for every member`}
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span
              role="presentation"
              onClick={(e) => {
                e.stopPropagation();
                onPlay?.();
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "9px 16px",
                borderRadius: radius.sm,
                background: color.ink,
                color: color.onDark,
                fontSize: 13,
                fontWeight: 650,
                border: `1px solid ${glass.border}`,
              }}
            >
              Play mix
            </span>
            <span style={{
              fontSize: 13,
              color: color.muted,
              fontFamily: fontMono,
              letterSpacing: 0.2,
            }}>
              Open →
            </span>
          </div>
        </div>
      </button>
    </section>
  );
}
