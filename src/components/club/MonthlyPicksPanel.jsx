/**
 * This month's picks — three tracks from the member's taste profile.
 */
import { useMemo } from "react";
import {
  fontDisplay, fontMono, color, radius, glass, motion,
} from "../../theme";
import {
  normalizeTasteProfile,
  pickMonthlyTracks,
  tasteMonthKey,
} from "../../lib/tasteProfile";
import CoverImage from "../ui/CoverImage";

export default function MonthlyPicksPanel({
  tracks = [],
  genres = [],
  adventurous,
  depth,
  userKey = "",
  onPlayTrack = null,
  onEditTaste = null,
}) {
  const taste = useMemo(
    () => normalizeTasteProfile({ genres, adventurous, depth }),
    [genres, adventurous, depth]
  );
  const slate = useMemo(
    () =>
      pickMonthlyTracks(tracks, taste, {
        limit: 3,
        userKey,
        monthKey: tasteMonthKey(),
      }),
    [tracks, taste, userKey]
  );

  if (!slate.picks.length) return null;

  return (
    <section
      style={{
        marginBottom: 26,
        animation: `rise 0.55s ${motion.ease} 0.08s both`,
      }}
    >
      <div style={{
        fontSize: 12,
        fontWeight: 650,
        color: color.muted,
        textTransform: "uppercase",
        letterSpacing: 1.1,
        fontFamily: fontMono,
        marginBottom: 12,
      }}>
        This month&apos;s picks
      </div>
      <div
        style={{
          borderRadius: radius.xl,
          border: `1px solid ${glass.border}`,
          background: glass.plate,
          boxShadow: `inset 0 1px 0 ${glass.highlight}, ${glass.shadowLift}`,
          backdropFilter: glass.blur,
          WebkitBackdropFilter: glass.blur,
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "16px 18px 10px" }}>
          <div style={{
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: -0.5,
            fontFamily: fontDisplay,
            color: color.ink,
            lineHeight: 1.15,
            marginBottom: 6,
          }}>
            {slate.monthLabel}
          </div>
          <div style={{ fontSize: 13, color: color.body, lineHeight: 1.4 }}>
            {taste.genres.length
              ? "Three records matched to your taste."
              : "Three records to start from. Set your taste to refine these."}
          </div>
        </div>

        <div style={{ padding: "4px 10px 12px" }}>
          {slate.picks.map((pick, i) => {
            const t = pick.track;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onPlayTrack?.(t, slate.picks.map((p) => p.track))}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  width: "100%",
                  padding: "10px 8px",
                  background: "none",
                  border: "none",
                  borderRadius: radius.md,
                  cursor: onPlayTrack ? "pointer" : "default",
                  textAlign: "left",
                  color: color.ink,
                }}
              >
                <span style={{
                  width: 22,
                  flexShrink: 0,
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: fontMono,
                  color: color.accent,
                  letterSpacing: 0.4,
                }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 8,
                  overflow: "hidden",
                  flexShrink: 0,
                  background: color.surfaceRaised,
                }}>
                  {t.albumCover ? (
                    <CoverImage src={t.albumCover} width={44} height={44} alt="" draggable={false} />
                  ) : (
                    <div style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: fontDisplay,
                      fontSize: 14,
                      fontWeight: 700,
                      color: color.faint,
                    }}>
                      {(t.title || "P")[0]}
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 14,
                    fontWeight: 650,
                    fontFamily: fontDisplay,
                    letterSpacing: -0.2,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    {t.title}
                  </div>
                  <div style={{
                    fontSize: 12,
                    color: color.muted,
                    marginTop: 2,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    {t.artist}
                    {pick.reason ? ` · ${pick.reason}` : ""}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {onEditTaste && (
          <button
            type="button"
            onClick={onEditTaste}
            style={{
              display: "block",
              width: "100%",
              padding: "12px 18px",
              background: "rgba(27,31,37,0.52)",
              border: "none",
              borderTop: `1px solid ${glass.borderSoft}`,
              fontSize: 12,
              fontWeight: 650,
              letterSpacing: 0.8,
              textTransform: "uppercase",
              color: color.body,
              fontFamily: fontMono,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            Adjust taste →
          </button>
        )}
      </div>
    </section>
  );
}
