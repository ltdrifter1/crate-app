/**
 * Home banner — this month's Community Mix from Mixtape Club.
 */
import {
  font, fontDisplay, fontMono, color, radius, glass, homeSpace, BTN_PRIMARY,
} from "../../theme";
import { COMMUNITY_MIX_TITLE, formatMonthLabel } from "../../lib/mixes";

export default function CommunityMixBanner({
  mix,
  onOpen,
  onPlay,
  delay = 0.08,
}) {
  if (!mix) return null;
  const curator = mix.featuredCurator?.displayName || mix.ownerName;
  const count = (mix.trackIds || []).length;

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
          border: `1px solid ${glass.borderSoft}`,
          borderRadius: radius.lg,
          padding: "20px 20px 18px",
          cursor: "pointer",
          color: color.ink,
          background: `
            radial-gradient(ellipse 70% 100% at 100% 0%, rgba(255,255,255,0.06) 0%, transparent 50%),
            ${glass.fill}
          `,
          boxShadow: `inset 0 1px 0 ${glass.highlight}`,
        }}
      >
        <div style={{
          fontSize: 13,
          fontWeight: 600,
          color: color.muted,
          marginBottom: 8,
          fontFamily: font,
        }}>
          {mix.monthKey ? formatMonthLabel(mix.monthKey) : "This month"}
        </div>
        <div style={{
          fontSize: "clamp(24px, 5.5vw, 30px)",
          fontWeight: 700,
          letterSpacing: -0.8,
          fontFamily: fontDisplay,
          lineHeight: 1.1,
          marginBottom: 8,
        }}>
          {mix.title || COMMUNITY_MIX_TITLE}
        </div>
        <div style={{ fontSize: 14, color: color.body, lineHeight: 1.45, marginBottom: 16 }}>
          {curator
            ? `Curated by ${curator} · ${count} track${count === 1 ? "" : "s"} · everyone gets it`
            : `${count} track${count === 1 ? "" : "s"} · everyone gets it`}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <span
            role="presentation"
            onClick={(e) => {
              e.stopPropagation();
              onPlay?.();
            }}
            style={{
              ...BTN_PRIMARY,
              borderRadius: 980,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "10px 18px",
              fontSize: 14,
            }}
          >
            Play
          </span>
          <span style={{
            fontSize: 14,
            color: color.muted,
            alignSelf: "center",
            fontFamily: font,
          }}>
            Open mix →
          </span>
        </div>
      </button>
    </section>
  );
}
