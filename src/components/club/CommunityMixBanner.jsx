/**
 * Home / Library — this month's Community Mix as a frosted press plate.
 */
import {
  fontDisplay, fontMono, color, radius, glass, homeSpace, BTN_PRIMARY,
} from "../../theme";
import { COMMUNITY_MIX_TITLE, formatMonthLabel } from "../../lib/mixes";
import { CLUB_NAME, CLUB_TAGLINE } from "../../lib/memberNumber";

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
        marginBottom: 4,
      }}>
        {CLUB_NAME}
      </div>
      <div style={{
        fontSize: 12,
        color: color.body,
        marginBottom: 12,
        lineHeight: 1.4,
      }}>
        {CLUB_TAGLINE} · this month’s pressing
      </div>
      <button
        type="button"
        onClick={onOpen}
        style={{
          width: "100%",
          textAlign: "left",
          border: `1px solid rgba(255,255,255,0.14)`,
          borderRadius: radius.xl,
          padding: 0,
          cursor: "pointer",
          color: color.ink,
          overflow: "hidden",
          background: `
            linear-gradient(165deg, rgba(38,43,51,0.82) 0%, rgba(28,32,38,0.5) 100%)
          `,
          boxShadow: `inset 0 1px 0 ${glass.highlight}, ${glass.shadowLift}`,
          backdropFilter: glass.blur,
          WebkitBackdropFilter: glass.blur,
        }}
      >
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
              background: "linear-gradient(135deg, #A8B0BC 0%, #5A6270 55%, #2A2E38 100%)",
            }}/>
          )}
          <div aria-hidden="true" style={{
            position: "absolute", inset: 0,
            background: `
              linear-gradient(180deg, rgba(216,222,232,0.15) 0%, rgba(18,20,26,0.35) 48%, rgba(18,20,26,0.72) 100%)
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
              color: "rgba(244,246,249,0.7)",
              fontFamily: fontMono,
              marginBottom: 6,
            }}>
              {mix.monthKey ? formatMonthLabel(mix.monthKey) : "This month"}
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
            linear-gradient(180deg, rgba(32,36,43,0.65) 0%, rgba(242,244,247,0.42) 100%)
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
                ...BTN_PRIMARY,
                width: "auto",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "9px 16px",
                borderRadius: radius.lg,
                fontSize: 13,
                fontWeight: 650,
              }}
            >
              Play
            </span>
            <span style={{
              fontSize: 13,
              color: color.muted,
              fontFamily: fontMono,
              letterSpacing: 0.2,
            }}>
              Open the plate →
            </span>
          </div>
        </div>
      </button>
    </section>
  );
}
