/**
 * Build a set — mix booth destination.
 * Sculpt length / vibe / genre on a live energy stage, then play or save.
 */
import { useEffect, useMemo, useState } from "react";
import {
  color, font, fontDisplay, fontMono, y2k, chrome, glass, radio, radius,
  homeSpace, motion, BTN_PRIMARY, BTN_SECONDARY, chromeIconButton,
} from "../../theme";
import Icon from "../ui/Icon";
import CoverImage from "../ui/CoverImage";
import { AlbumArt } from "../listen/AlbumArt";
import { buildSession, SESSION_PROFILES } from "../../lib/engine";
import { fmtTime } from "../../lib/harmony";
import {
  SET_DURATIONS,
  SET_VIBE_TINT,
  formatSetDuration,
  vibeEntries,
  groupSessionPhases,
  sessionStats,
  stripSessionMeta,
  filterTracksForSet,
  genresInPool,
  sampleEnergyArc,
  sampleSessionEnergy,
  setTitle,
} from "../../lib/setBuilder";
import EnergyArc from "./EnergyArc";

const BOOTH_CSS = `
  @keyframes pmpBoothGlow {
    0%, 100% { opacity: 0.55; }
    50% { opacity: 1; }
  }
  .pmp-booth-key { transition: transform ${"{fast}"} ${"{ease}"}, box-shadow ${"{base}"}, background ${"{base}"}; }
  .pmp-booth-key:hover { transform: translateY(-1px); }
  .pmp-booth-key:active { transform: scale(0.98); }
  .pmp-booth-clip { transition: transform ${"{fast}"} ${"{ease}"}, box-shadow ${"{base}"}; }
  .pmp-booth-clip:hover { transform: translateY(-2px); }
  @media (prefers-reduced-motion: reduce) {
    .pmp-booth-glow { animation: none !important; }
    .pmp-booth-key, .pmp-booth-clip { transition: none !important; transform: none !important; }
  }
`.replaceAll("{fast}", motion.fast).replaceAll("{base}", motion.base).replaceAll("{ease}", motion.ease);

function useWideBooth() {
  const [wide, setWide] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= 900
  );
  useEffect(() => {
    const onResize = () => setWide(window.innerWidth >= 900);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return wide;
}

export default function SetBuilderScreen({
  tracks = [],
  onClose,
  onPlayRoute,
  onSavePlaylist = null,
  initialActivity = null,
  initialGenre = null,
  intentLabel = null,
  taste = null,
  coldStart = false,
}) {
  const wide = useWideBooth();
  const autoActivity = initialActivity && SESSION_PROFILES[initialActivity]
    ? initialActivity
    : "drive";
  const [duration, setDuration] = useState(60);
  const [activity, setActivity] = useState(autoActivity);
  const [genre, setGenre] = useState(initialGenre || null);
  const [reshuffle, setReshuffle] = useState(0);
  const [savedToLibrary, setSavedToLibrary] = useState(false);
  const [session, setSession] = useState(() =>
    buildSession(filterTracksForSet(tracks, initialGenre || null), 60, autoActivity, {
      taste,
      coldStart,
    })
  );

  const profile = SESSION_PROFILES[activity] || SESSION_PROFILES.drive;
  const tintRgb = SET_VIBE_TINT[activity]?.rgb || chrome.cyanRgb;
  const poolGenres = useMemo(() => genresInPool(tracks), [tracks]);

  useEffect(() => {
    const pool = filterTracksForSet(tracks, genre);
    setSession(buildSession(pool, duration, activity, { taste, coldStart }));
    setSavedToLibrary(false);
  }, [tracks, duration, activity, genre, reshuffle, taste, coldStart]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const stats = sessionStats(session);
  const phases = groupSessionPhases(session);
  const arcPoints = session.length
    ? sampleSessionEnergy(session, 56)
    : sampleEnergyArc(profile, 56);
  const headline = setTitle(profile, duration);
  const durationLabel = formatSetDuration(duration);

  function playSet() {
    if (!session.length) return;
    onPlayRoute?.(stripSessionMeta(session), "set", headline);
    onClose?.();
  }

  function saveSet() {
    if (!onSavePlaylist || !session.length || savedToLibrary) return;
    onSavePlaylist(headline, session.map((t) => t.id));
    setSavedToLibrary(true);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Build a set"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        overflow: "hidden",
        background: color.canvas,
        color: color.ink,
        fontFamily: font,
      }}
    >
      <style>{BOOTH_CSS}</style>
      <BoothAtmosphere covers={stats.covers} tintRgb={tintRgb} />

      <div style={{
        position: "relative",
        zIndex: 1,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}>
        <header style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: `calc(10px + env(safe-area-inset-top, 0px)) ${homeSpace.gutter}px 10px`,
          flexShrink: 0,
        }}>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="pmp-press"
            style={chromeIconButton(36)}
          >
            <Icon name="x" size={16} />
          </button>
          <div style={{ minWidth: 0, textAlign: "center" }}>
            <div style={{
              fontFamily: fontDisplay,
              fontSize: 17,
              fontWeight: 700,
              letterSpacing: -0.4,
              lineHeight: 1.15,
            }}>
              Build a set
            </div>
            <div style={{
              marginTop: 2,
              fontSize: 12,
              fontWeight: 500,
              color: color.muted,
              letterSpacing: -0.04,
            }}>
              {intentLabel ? `${intentLabel} · in the booth` : "Sculpt, then play"}
            </div>
          </div>
          <div
            aria-hidden="true"
            className="pmp-booth-glow"
            style={{
              minWidth: 36,
              padding: "6px 8px",
              borderRadius: 6,
              border: `1px solid rgba(${tintRgb},0.38)`,
              background: `rgba(${tintRgb},0.1)`,
              color: y2k.cyan,
              fontFamily: fontMono,
              fontSize: 8,
              fontWeight: 800,
              letterSpacing: 1.1,
              textAlign: "center",
              lineHeight: 1.2,
              animation: "pmpBoothGlow 3.2s ease-in-out infinite",
            }}
          >
            BOOTH
          </div>
        </header>

        <div className="hide-scroll" style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          width: "100%",
        }}>
        <div style={{
          width: "100%",
          maxWidth: wide ? 1080 : 640,
          margin: "0 auto",
          padding: `0 ${homeSpace.gutter}px 8px`,
          minWidth: 0,
        }}>
          <BoothStage
            session={session}
            covers={stats.covers}
            headline={headline}
            profile={profile}
            stats={stats}
            durationLabel={durationLabel}
            tintRgb={tintRgb}
            arcPoints={arcPoints}
            tall={wide}
          />
          <div style={{ marginTop: 16, minWidth: 0 }}>
            <BoothConsole
              duration={duration}
              onDuration={setDuration}
              activity={activity}
              onActivity={setActivity}
              genre={genre}
              onGenre={setGenre}
              poolGenres={poolGenres}
              tintRgb={tintRgb}
              wrapVibes
            />
          </div>

          <SetPreview
            session={session}
            phases={phases}
            stats={stats}
            tintRgb={tintRgb}
          />
        </div>
        </div>

        <div style={{
          flexShrink: 0,
          padding: `12px ${homeSpace.gutter}px calc(16px + env(safe-area-inset-bottom, 0px))`,
          background: `
            linear-gradient(180deg, rgba(8,10,13,0.2) 0%, ${color.canvas} 36%),
            ${color.canvas}
          `,
          borderTop: `1px solid ${glass.borderSoft}`,
        }}>
          <div style={{
            maxWidth: wide ? 1080 : 640,
            margin: "0 auto",
            display: "flex",
            gap: 10,
            alignItems: "center",
          }}>
            <button
              type="button"
              onClick={playSet}
              disabled={!session.length}
              style={{
                ...BTN_PRIMARY,
                flex: 1,
                borderRadius: radius.md,
                padding: "16px 28px",
                opacity: session.length ? 1 : 0.5,
                cursor: session.length ? "pointer" : "default",
              }}
            >
              Play set
            </button>
            <button
              type="button"
              onClick={() => setReshuffle((n) => n + 1)}
              aria-label="Shuffle again"
              className="pmp-booth-key"
              style={{
                ...chromeIconButton(52),
                borderRadius: radius.md,
                background: glass.fillStrong,
                border: `1px solid ${glass.border}`,
              }}
            >
              <Icon name="shuffle" size={18} />
            </button>
            {onSavePlaylist && (
              <button
                type="button"
                onClick={saveSet}
                disabled={!session.length || savedToLibrary}
                aria-label={savedToLibrary ? "Saved to Library" : "Save set to Library"}
                style={{
                  ...BTN_SECONDARY,
                  width: "auto",
                  minWidth: wide ? 160 : 0,
                  padding: wide ? "14px 22px" : "14px 16px",
                  borderRadius: radius.md,
                  opacity: savedToLibrary ? 0.72 : 1,
                  cursor: savedToLibrary || !session.length ? "default" : "pointer",
                }}
              >
                {savedToLibrary ? "Saved" : "Save"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function BoothAtmosphere({ covers, tintRgb }) {
  const bg = covers[0];
  return (
    <>
      {bg && (
        <div aria-hidden="true" style={{
          position: "absolute",
          inset: 0,
          opacity: 0.22,
          backgroundImage: `url(${bg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(64px) saturate(1.15) brightness(0.7)",
          transform: "scale(1.12)",
        }} />
      )}
      <div aria-hidden="true" style={{
        position: "absolute",
        inset: 0,
        background: `
          radial-gradient(ellipse 70% 42% at 18% -8%, rgba(${tintRgb},0.16) 0%, transparent 52%),
          radial-gradient(ellipse 50% 36% at 100% 8%, rgba(123,167,255,0.08) 0%, transparent 46%),
          linear-gradient(180deg, rgba(8,10,13,0.35) 0%, rgba(8,10,13,0.88) 100%)
        `,
      }} />
    </>
  );
}

function BoothStage({
  session,
  covers,
  headline,
  profile,
  stats,
  durationLabel,
  tintRgb,
  arcPoints,
  tall = false,
}) {
  return (
    <div style={{
      position: "relative",
      width: "100%",
      minHeight: tall ? 420 : 260,
      height: tall ? 420 : 260,
      borderRadius: radio.radius,
      overflow: "hidden",
      border: radio.borderChrome,
      boxShadow: radio.glassShadowLive,
      background: y2k.artGradient,
    }}>
      <StageArt covers={covers} session={session} />
      <div aria-hidden="true" style={{
        position: "absolute",
        inset: 0,
        background: `
          linear-gradient(180deg, rgba(8,10,13,0.15) 0%, rgba(8,10,13,0.2) 40%, rgba(8,10,13,0.92) 100%)
        `,
      }} />
      <div style={{
        position: "absolute",
        left: 14,
        top: 14,
        padding: "5px 8px",
        borderRadius: 5,
        background: "rgba(8,10,13,0.62)",
        border: "1px solid rgba(255,255,255,0.14)",
        fontFamily: fontMono,
        fontSize: 9,
        fontWeight: 800,
        letterSpacing: 1.3,
        color: y2k.offWhite,
      }}>
        IN THE BOOTH
      </div>

      <div style={{
        position: "absolute",
        left: 14,
        right: 14,
        bottom: 12,
      }}>
        <div style={{
          fontFamily: fontDisplay,
          fontSize: tall ? 32 : 26,
          fontWeight: 700,
          letterSpacing: -0.7,
          lineHeight: 1.05,
          marginBottom: 6,
        }}>
          {headline}
        </div>
        <div style={{
          fontSize: 13,
          fontWeight: 500,
          color: color.body,
          marginBottom: 12,
        }}>
          {session.length
            ? `${stats.tracks} cuts · about ${stats.minutes} min · ${profile.blurb}`
            : `Pick a length and vibe — ${durationLabel} ${profile.label.toLowerCase()}`}
        </div>
        <EnergyArc
          points={arcPoints}
          phases={profile.phases}
          tintRgb={tintRgb}
          height={tall ? 96 : 78}
        />
      </div>
    </div>
  );
}

function StageArt({ covers, session }) {
  if (covers.length >= 4) {
    return (
      <div aria-hidden="true" style={{
        position: "absolute",
        inset: 0,
        display: "grid",
        gridTemplateColumns: "1.4fr 1fr",
        gridTemplateRows: "1fr 1fr",
      }}>
        <div style={{ gridRow: "1 / 3", overflow: "hidden" }}>
          <CoverImage src={covers[0]} alt="" width={640} height={640} priority style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        {covers.slice(1, 3).map((src) => (
          <div key={src} style={{ overflow: "hidden" }}>
            <CoverImage src={src} alt="" width={320} height={320} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        ))}
      </div>
    );
  }
  if (covers[0]) {
    return (
      <CoverImage
        src={covers[0]}
        alt=""
        width={800}
        height={800}
        priority
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />
    );
  }
  const letter = (session[0]?.title || "P").trim().charAt(0).toUpperCase();
  return (
    <div aria-hidden="true" style={{
      position: "absolute",
      inset: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: fontDisplay,
      fontSize: 88,
      fontWeight: 650,
      letterSpacing: -4,
      color: "rgba(247,248,250,0.12)",
    }}>
      {letter}
    </div>
  );
}

function BoothConsole({
  duration,
  onDuration,
  activity,
  onActivity,
  genre,
  onGenre,
  poolGenres,
  tintRgb,
  wrapVibes = false,
}) {
  return (
    <div style={{
      padding: "16px 16px 18px",
      borderRadius: radio.radius,
      border: radio.borderQuiet,
      background: radio.moduleFace,
      boxShadow: radio.moduleShadow,
      display: "flex",
      flexDirection: "column",
      gap: 16,
      minWidth: 0,
      overflow: "hidden",
    }}>
      <ConsoleLabel>Length</ConsoleLabel>
      <div role="group" aria-label="Set length" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {SET_DURATIONS.map((d) => {
          const on = duration === d.minutes;
          return (
            <button
              key={d.minutes}
              type="button"
              className="pmp-booth-key"
              aria-pressed={on}
              onClick={() => onDuration(d.minutes)}
              style={hardwareChip(on, tintRgb)}
            >
              {d.label}
            </button>
          );
        })}
      </div>

      <ConsoleLabel>Vibe</ConsoleLabel>
      <div
        role="listbox"
        aria-label="Set vibe"
        className="hide-scroll"
        style={{
          display: "flex",
          gap: 8,
          flexWrap: wrapVibes ? "wrap" : "nowrap",
          overflowX: wrapVibes ? "visible" : "auto",
          paddingBottom: 4,
          margin: wrapVibes ? 0 : "0 -4px",
          paddingLeft: wrapVibes ? 0 : 4,
          paddingRight: wrapVibes ? 0 : 4,
        }}
      >
        {vibeEntries().map(([id, prof]) => {
          const on = activity === id;
          return (
            <button
              key={id}
              type="button"
              role="option"
              aria-selected={on}
              className="pmp-booth-key"
              onClick={() => onActivity(id)}
              style={{
                ...hardwareChip(on, SET_VIBE_TINT[id]?.rgb || tintRgb),
                flex: "0 0 auto",
                minWidth: 108,
                height: "auto",
                padding: "10px 12px",
                textAlign: "left",
                textTransform: "none",
                letterSpacing: -0.2,
                fontFamily: fontDisplay,
                fontSize: 14,
                fontWeight: on ? 700 : 600,
              }}
            >
              <div>{prof.label}</div>
              <div style={{
                marginTop: 3,
                fontSize: 11,
                fontWeight: 500,
                fontFamily: font,
                letterSpacing: 0,
                color: on ? "rgba(8,10,13,0.62)" : color.muted,
                lineHeight: 1.3,
                maxWidth: 140,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}>
                {prof.blurb}
              </div>
            </button>
          );
        })}
      </div>

      {poolGenres.length > 0 && (
        <>
          <ConsoleLabel>Genre</ConsoleLabel>
          <div role="group" aria-label="Set genre" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              className="pmp-booth-key"
              aria-pressed={!genre}
              onClick={() => onGenre(null)}
              style={hardwareChip(!genre, tintRgb)}
            >
              All
            </button>
            {poolGenres.map((g) => {
              const on = genre === g;
              return (
                <button
                  key={g}
                  type="button"
                  className="pmp-booth-key"
                  aria-pressed={on}
                  onClick={() => onGenre(on ? null : g)}
                  style={hardwareChip(on, tintRgb)}
                >
                  {g}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function ConsoleLabel({ children }) {
  return (
    <div style={{
      fontFamily: fontDisplay,
      fontSize: 13,
      fontWeight: 600,
      letterSpacing: -0.08,
      color: color.muted,
      marginBottom: -6,
    }}>
      {children}
    </div>
  );
}

function hardwareChip(selected, tintRgb) {
  return {
    minHeight: 40,
    padding: "0 14px",
    borderRadius: 8,
    border: selected
      ? `1px solid rgba(${tintRgb},0.55)`
      : "1px solid rgba(255,255,255,0.12)",
    background: selected
      ? `linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 42%), linear-gradient(165deg, #C5CAD3 0%, #5A6270 100%)`
      : "rgba(255,255,255,0.05)",
    color: selected ? color.onAccent : color.body,
    boxShadow: selected
      ? "inset 0 1px 0 rgba(255,255,255,0.62), 0 8px 18px rgba(0,0,0,0.28)"
      : "inset 0 1px 0 rgba(255,255,255,0.06)",
    cursor: "pointer",
    fontWeight: 650,
    fontSize: 13,
    fontFamily: font,
    letterSpacing: -0.1,
    WebkitTapHighlightColor: "transparent",
  };
}

function SetPreview({ session, phases, stats, tintRgb }) {
  if (!session.length) {
    return (
      <div role="status" style={{
        marginTop: 18,
        padding: "22px 16px",
        textAlign: "center",
        color: color.muted,
        fontSize: 14,
        lineHeight: 1.45,
        borderRadius: radius.lg,
        border: `1px solid ${glass.borderSoft}`,
        background: glass.fill,
      }}>
        Need a few more playable cuts in the crate to write this set.
      </div>
    );
  }

  return (
    <div style={{ marginTop: 20, paddingBottom: 28 }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        marginBottom: 10,
        gap: 12,
      }}>
        <div style={{
          fontFamily: fontDisplay,
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: -0.4,
        }}>
          Live set
        </div>
        <div style={{ fontSize: 13, color: color.muted }}>
          {stats.tracks} · {stats.minutes} min
        </div>
      </div>

      <div
        className="hide-scroll"
        style={{
          display: "flex",
          gap: 8,
          overflowX: "auto",
          paddingBottom: 12,
        }}
      >
        {session.slice(0, 18).map((t, i) => (
          <div
            key={t.id}
            className="pmp-booth-clip"
            title={`${t.title} — ${t.artist}`}
            style={{ flex: "0 0 auto" }}
          >
            <div style={{
              width: 64,
              height: 64,
              borderRadius: 8,
              overflow: "hidden",
              boxShadow: `0 8px 18px rgba(0,0,0,0.4), 0 0 0 1px rgba(${tintRgb},0.18)`,
            }}>
              <AlbumArt track={t} size={64} borderRadius={8} />
            </div>
            <div style={{
              marginTop: 4,
              fontFamily: fontMono,
              fontSize: 8,
              fontWeight: 700,
              letterSpacing: 0.6,
              textTransform: "uppercase",
              color: color.faint,
              width: 64,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>
              {i === 0 ? "In" : t._phase}
            </div>
          </div>
        ))}
      </div>

      {phases.map((phase) => (
        <div key={phase.name} style={{ marginBottom: 8 }}>
          <div style={{
            fontFamily: fontMono,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 1.1,
            textTransform: "uppercase",
            color: `rgba(${tintRgb},0.85)`,
            padding: "10px 2px 6px",
          }}>
            {phase.name}
          </div>
          {phase.tracks.map((t) => (
            <div key={t.id} style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "7px 4px",
            }}>
              <div style={{ width: 40, height: 40, borderRadius: 7, overflow: "hidden", flexShrink: 0 }}>
                <AlbumArt track={t} size={40} borderRadius={7} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: fontDisplay,
                  letterSpacing: -0.2,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                  {t.title}
                </div>
                <div style={{ fontSize: 12, color: color.muted }}>
                  {t.artist}
                </div>
              </div>
              <div style={{
                fontFamily: fontMono,
                fontSize: 11,
                color: color.faint,
                flexShrink: 0,
              }}>
                {fmtTime(t.duration || 0)}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
