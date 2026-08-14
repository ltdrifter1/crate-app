/**
 * Interests panel — listening snapshot (genres, taste dials, energy, recent, likes).
 * Used inline on Club → Interests settings tab.
 */
import { useMemo } from "react";
import {
  fontDisplay, fontMono, color, radius, glass, motion, chrome,
} from "../../theme";
import { buildListenInsights } from "../../lib/listenInsights";
import { collectionStatsLabel } from "../../lib/collectionStats";
import {
  normalizeTasteProfile,
  tasteProfileStats,
  tasteProfileBlurb,
  TASTE_AXIS_DEFAULT,
} from "../../lib/tasteProfile";
import FlaskTasteButton from "./FlaskTasteButton";
import CoverImage from "../ui/CoverImage";

function CoverThumb({ track, size = 40 }) {
  if (!track) return null;
  return (
    <div style={{
      width: size, height: size, borderRadius: 8, overflow: "hidden", flexShrink: 0,
      background: color.surfaceRaised,
    }}>
      {track.albumCover ? (
        <CoverImage src={track.albumCover} width={size} height={size} alt="" draggable={false} />
      ) : (
        <div style={{
          width: "100%", height: "100%",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: fontDisplay, fontSize: size * 0.32, fontWeight: 700, color: color.faint,
          background: `linear-gradient(160deg, rgba(52,58,68,0.9), ${color.surfaceRaised})`,
        }}>
          {(track.title || "P")[0]}
        </div>
      )}
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: 1.3,
      textTransform: "uppercase",
      color: color.faint,
      fontFamily: fontMono,
      marginBottom: 12,
    }}>
      {children}
    </div>
  );
}

function GlassCard({ children, style = null }) {
  return (
    <div style={{
      borderRadius: radius.lg,
      border: `1px solid ${glass.border}`,
      background: glass.plate,
      boxShadow: `inset 0 1px 0 ${glass.highlight}, ${glass.shadowSoft}`,
      backdropFilter: glass.blur,
      WebkitBackdropFilter: glass.blur,
      padding: "18px 18px 16px",
      ...(style || {}),
    }}>
      {children}
    </div>
  );
}

function EnergySpark({ series = [] }) {
  if (!series.length) {
    return (
      <div style={{ fontSize: 14, color: color.muted, lineHeight: 1.45 }}>
        Play a few tracks — your energy shows up here.
      </div>
    );
  }
  const w = 280;
  const h = 56;
  const step = series.length > 1 ? w / (series.length - 1) : w;
  const points = series.map((e, i) => {
    const x = i * step;
    const y = h - ((e - 1) / 9) * (h - 8) - 4;
    return `${x},${y}`;
  }).join(" ");
  const area = `0,${h} ${points} ${w},${h}`;

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: "block" }}>
      <defs>
        <linearGradient id="insightArcFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(42,46,56,0.22)" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#insightArcFill)" />
      <polyline
        points={points}
        fill="none"
        stroke={color.ink}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {series.map((e, i) => (
        <circle
          key={i}
          cx={i * step}
          cy={h - ((e - 1) / 9) * (h - 8) - 4}
          r="2.4"
          fill={color.ink}
          opacity={i === series.length - 1 ? 1 : 0.35}
        />
      ))}
    </svg>
  );
}

function TrackRow({ track, meta = null }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "8px 0",
    }}>
      <CoverThumb track={track} size={40} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 14, fontWeight: 650, color: color.ink,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          fontFamily: fontDisplay, letterSpacing: -0.2,
        }}>
          {track.title}
        </div>
        <div style={{
          fontSize: 12, color: color.muted, marginTop: 2,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {track.artist}
          {meta ? ` · ${meta}` : ""}
        </div>
      </div>
    </div>
  );
}

/** Inline interests body — Club settings tab (no overlay chrome). */
export function InterestsPanel({
  tracks = [],
  genres = [],
  adventurous = TASTE_AXIS_DEFAULT,
  depth = TASTE_AXIS_DEFAULT,
  recentTracks = [],
  signalLabel = null,
  onEditGenres = null,
  onPlayTrack = null,
  showIntro = true,
}) {
  const insight = useMemo(
    () => buildListenInsights(tracks, { genres, recentTracks, signalLabel }),
    [tracks, genres, recentTracks, signalLabel]
  );
  const taste = useMemo(
    () => normalizeTasteProfile({ genres, adventurous, depth }),
    [genres, adventurous, depth]
  );
  const tasteStats = useMemo(
    () =>
      tasteProfileStats(taste, {
        genreMix: insight.genreMix?.length ? insight.genreMix : null,
      }),
    [taste, insight.genreMix]
  );

  const nowLine = insight.signalLabel ? `Right now: ${insight.signalLabel}` : null;

  return (
    <div style={{ animation: `rise 0.4s ${motion.ease} both` }}>
      {showIntro && (
        <div style={{ marginBottom: 18 }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 10,
          }}>
            <FlaskTasteButton
              onClick={onEditGenres || null}
              active={false}
              size={44}
              labeled={false}
            />
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontFamily: fontMono,
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                color: chrome.steel,
                marginBottom: 4,
              }}>
                Settings · Interests
              </div>
              <h2 style={{
                margin: 0,
                fontSize: "clamp(22px, 5vw, 28px)",
                fontWeight: 750,
                letterSpacing: -0.6,
                fontFamily: fontDisplay,
                color: color.ink,
                lineHeight: 1.08,
                textTransform: "uppercase",
              }}>
                Your interests
              </h2>
            </div>
          </div>
          <p style={{
            margin: "0 0 6px",
            fontSize: 15,
            fontWeight: 500,
            color: color.body,
            lineHeight: 1.45,
            maxWidth: 360,
          }}>
            {tasteProfileBlurb(taste) || insight.leanLine}
          </p>
          {nowLine && (
            <p style={{
              margin: 0,
              fontSize: 13,
              color: color.muted,
              lineHeight: 1.4,
            }}>
              {nowLine}
            </p>
          )}
        </div>
      )}

      {/* Taste summary */}
      <GlassCard style={{ marginBottom: 14 }}>
        <SectionLabel>Your taste</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: onEditGenres ? 14 : 0 }}>
          {tasteStats.map((row) => (
            <div key={row.id}>
              <div style={{
                display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 5,
              }}>
                <span style={{ fontSize: 13, fontWeight: 650, color: color.ink }}>{row.label}</span>
                <span style={{
                  fontSize: 11, fontFamily: fontMono, color: color.faint, fontWeight: 700,
                  fontVariantNumeric: "tabular-nums",
                }}>
                  {row.pct}%
                </span>
              </div>
              <div style={{
                height: 6, borderRadius: 4, background: "rgba(22,24,30,0.07)", overflow: "hidden",
              }}>
                <div style={{
                  height: "100%", width: `${row.pct}%`, borderRadius: 4,
                  background: `linear-gradient(90deg, #A9C7E4 0%, #7FA3C4 100%)`,
                }}/>
              </div>
            </div>
          ))}
        </div>
        {insight.preferred.length ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: onEditGenres ? 14 : 0 }}>
            {insight.preferred.map((g) => (
              <span
                key={g}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "7px 12px",
                  borderRadius: radius.sm,
                  background: "rgba(22,24,30,0.06)",
                  border: `1px solid ${glass.borderSoft}`,
                  fontSize: 13,
                  fontWeight: 650,
                  color: color.ink,
                  letterSpacing: -0.1,
                }}
              >
                {g}
              </span>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 14, color: color.muted, marginBottom: onEditGenres ? 14 : 0, lineHeight: 1.45 }}>
            No genres yet. Add a few to steer what we play most.
          </div>
        )}
        {onEditGenres && (
          <button
            type="button"
            onClick={onEditGenres}
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: radius.md,
              border: `1px solid ${glass.border}`,
              background: glass.fillStrong,
              color: color.body,
              fontSize: 14,
              fontWeight: 650,
              cursor: "pointer",
              boxShadow: `inset 0 1px 0 ${glass.highlight}`,
            }}
          >
            Edit taste
          </button>
        )}
      </GlassCard>

      {/* Energy */}
      <GlassCard style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
          <SectionLabel>Energy</SectionLabel>
          {insight.avgEnergy != null && (
            <div style={{
              fontSize: 12, fontWeight: 700, fontFamily: fontMono,
              color: color.ink, fontVariantNumeric: "tabular-nums",
            }}>
              {insight.avgEnergy}/10
            </div>
          )}
        </div>
        <div style={{
          fontSize: 20, fontWeight: 700, fontFamily: fontDisplay,
          letterSpacing: -0.4, color: color.ink, marginBottom: 4,
        }}>
          {insight.band.label}
        </div>
        <div style={{ fontSize: 13, color: color.muted, marginBottom: 14, lineHeight: 1.4 }}>
          {insight.band.hint}
        </div>
        <EnergySpark series={insight.recentEnergy} />
        <div style={{
          display: "flex", justifyContent: "space-between",
          marginTop: 8, fontSize: 10, fontFamily: fontMono,
          color: color.faint, letterSpacing: 0.4, textTransform: "uppercase", fontWeight: 650,
        }}>
          <span>Earlier</span>
          <span>Now</span>
        </div>
      </GlassCard>

      {!insight.coldStart && insight.genreMix.length > 0 && (
        <GlassCard style={{ marginBottom: 14 }}>
          <SectionLabel>What you like</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {insight.genreMix.map((g) => (
              <div key={g.genre}>
                <div style={{
                  display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 5,
                }}>
                  <span style={{ fontSize: 13, fontWeight: 650, color: color.ink }}>{g.genre}</span>
                  <span style={{
                    fontSize: 11, fontFamily: fontMono, color: color.faint, fontWeight: 700,
                    fontVariantNumeric: "tabular-nums",
                  }}>
                    {g.pct}%
                  </span>
                </div>
                <div style={{
                  height: 6, borderRadius: 4, background: "rgba(22,24,30,0.07)", overflow: "hidden",
                }}>
                  <div style={{
                    height: "100%", width: `${g.pct}%`, borderRadius: 4,
                    background: `linear-gradient(90deg, #A9C7E4 0%, #7FA3C4 100%)`,
                    transition: "width 0.5s ease",
                  }}/>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: 8,
        marginBottom: 14,
      }}>
        {[
          { n: insight.likedCount, label: "Liked" },
          { n: insight.recentCount, label: "Recent" },
          { n: insight.collection.albums + insight.collection.eps, label: "Albums" },
        ].map((s) => (
          <GlassCard key={s.label} style={{ padding: "14px 12px", textAlign: "center" }}>
            <div style={{
              fontSize: 22, fontWeight: 750, fontFamily: fontDisplay,
              letterSpacing: -0.6, color: color.ink, fontVariantNumeric: "tabular-nums",
            }}>
              {s.n}
            </div>
            <div style={{
              marginTop: 4, fontSize: 10, fontWeight: 700, letterSpacing: 0.8,
              textTransform: "uppercase", color: color.faint, fontFamily: fontMono,
            }}>
              {s.label}
            </div>
          </GlassCard>
        ))}
      </div>

      {insight.likedCount > 0 && (
        <div style={{
          fontSize: 12, color: color.muted, marginBottom: 18,
          fontFamily: fontMono, letterSpacing: 0.2,
        }}>
          {collectionStatsLabel(insight.collection)}
        </div>
      )}

      {insight.recent.length > 0 && (
        <GlassCard style={{ marginBottom: 14 }}>
          <SectionLabel>Recently played</SectionLabel>
          {insight.recent.slice(0, 5).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onPlayTrack?.(t, insight.recent)}
              style={{
                display: "block", width: "100%", background: "none", border: "none",
                padding: 0, cursor: onPlayTrack ? "pointer" : "default", textAlign: "left",
              }}
            >
              <TrackRow track={t} meta={t.genre || null} />
            </button>
          ))}
        </GlassCard>
      )}

      {insight.topSaved.length > 0 && (
        <GlassCard style={{ marginBottom: 8 }}>
          <SectionLabel>Liked</SectionLabel>
          {insight.topSaved.slice(0, 4).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onPlayTrack?.(t, insight.topSaved)}
              style={{
                display: "block", width: "100%", background: "none", border: "none",
                padding: 0, cursor: onPlayTrack ? "pointer" : "default", textAlign: "left",
              }}
            >
              <TrackRow track={t} meta={t.genre || null} />
            </button>
          ))}
        </GlassCard>
      )}

      {insight.coldStart && (
        <GlassCard>
          <div style={{
            fontSize: 18, fontWeight: 700, fontFamily: fontDisplay,
            letterSpacing: -0.3, color: color.ink, marginBottom: 8,
          }}>
            Nothing here yet
          </div>
          <div style={{ fontSize: 14, color: color.muted, lineHeight: 1.5 }}>
            Like a few tracks or press Listen now. Your energy, genres, and recent plays will show up here.
          </div>
        </GlassCard>
      )}
    </div>
  );
}
