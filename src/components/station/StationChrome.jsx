import { useEffect, useMemo, useState } from "react";
import {
  color, font, fontDisplay, fontMono, glass, motion, radius,
} from "../../theme";
import {
  STATION_REACTIONS,
  addDedication,
  buildStationTicker,
  estimateLockedIn,
  listDedications,
  nowPlayingLowerThird,
  stationDaypart,
} from "../../lib/station";
import {
  STATION_CALLSIGN,
  resolveChannelBug,
} from "../../lib/mtvChannel";

/** Soft neon kinetic bars — visualizer stand-in when no music video. */
export function HypnoVisualizer({ playing = false, colorHex = null }) {
  const bars = 18;
  const rgb = colorHex || "42,46,56";
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: "32%",
        height: 64,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        gap: 3,
        opacity: playing ? 0.55 : 0.18,
        pointerEvents: "none",
        zIndex: 1,
        transition: `opacity ${motion.settle} ${motion.ease}`,
      }}
    >
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          style={{
            width: 5,
            borderRadius: 2,
            background: `linear-gradient(180deg, rgba(${rgb},0.95) 0%, rgba(${rgb},0.25) 100%)`,
            height: playing ? undefined : 8,
            animation: playing
              ? `stationBar ${0.55 + (i % 5) * 0.12}s ease-in-out ${i * 0.04}s infinite alternate`
              : "none",
            boxShadow: playing ? `0 0 10px rgba(${rgb},0.35)` : "none",
          }}
        />
      ))}
    </div>
  );
}

/** Pulsing ON AIR plate — hard broadcast edge, not a soft pill. */
export function OnAirBadge({ daypartLabel = null, showTitle = null, compact = false, callsign = STATION_CALLSIGN }) {
  const secondary = showTitle || daypartLabel;
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "stretch",
        gap: 0,
        borderRadius: 0,
        overflow: "hidden",
        background: "rgba(22,24,30,0.92)",
        border: "1px solid rgba(255,255,255,0.14)",
        boxShadow: "0 8px 22px rgba(22,24,30,0.22)",
        color: color.onDark,
        pointerEvents: "none",
        maxWidth: compact ? 240 : 300,
      }}
    >
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: compact ? 6 : 8,
        padding: compact ? "6px 10px" : "7px 11px",
        background: "#FF3B4E",
        flexShrink: 0,
      }}>
        <span
          aria-hidden="true"
          style={{
            width: compact ? 6 : 7,
            height: compact ? 6 : 7,
            borderRadius: "50%",
            background: "#fff",
            boxShadow: "0 0 0 3px rgba(255,255,255,0.28)",
            animation: "stageLiveDot 1.4s ease-in-out infinite",
            flexShrink: 0,
          }}
        />
        <span style={{
          fontFamily: fontMono,
          fontSize: compact ? 9 : 10,
          fontWeight: 800,
          letterSpacing: 1.6,
          textTransform: "uppercase",
          color: "#fff",
        }}>
          On Air
        </span>
      </div>
      <div style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: compact ? "4px 10px" : "5px 12px",
        minWidth: 0,
        gap: 1,
      }}>
        <span style={{
          fontFamily: fontMono,
          fontSize: 8,
          fontWeight: 800,
          letterSpacing: 1.4,
          textTransform: "uppercase",
          color: "rgba(242,244,247,0.55)",
        }}>
          {callsign}
        </span>
        {secondary && (
          <span style={{
            fontFamily: fontMono,
            fontSize: compact ? 9 : 10,
            fontWeight: 700,
            letterSpacing: 1.0,
            textTransform: "uppercase",
            color: color.onDark,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {secondary}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Persistent channel bug — top-right CH-03 · RAP CITY plate.
 * MTV corner graphic energy.
 */
export function ChannelBug({
  sceneChannel = null,
  show = null,
  daypartLabel = null,
  compact = false,
}) {
  const bug = resolveChannelBug({ sceneChannel, show });
  return (
    <div
      aria-label={`${bug.ch} ${bug.slug}`}
      style={{
        display: "inline-flex",
        alignItems: "stretch",
        borderRadius: 0,
        overflow: "hidden",
        pointerEvents: "none",
        boxShadow: "0 10px 24px rgba(22,24,30,0.28)",
        animation: `channelBugIn 0.4s ${motion.ease} both`,
        maxWidth: compact ? 160 : 200,
      }}
    >
      <div style={{
        padding: compact ? "6px 8px" : "7px 10px",
        background: bug.accent || "#FF3B4E",
        color: "#fff",
        fontFamily: fontMono,
        fontSize: compact ? 11 : 12,
        fontWeight: 900,
        letterSpacing: 0.6,
        display: "flex",
        alignItems: "center",
        clipPath: "polygon(0 0, 100% 0, calc(100% - 6px) 100%, 0 100%)",
        paddingRight: compact ? 12 : 14,
      }}>
        {bug.ch}
      </div>
      <div style={{
        padding: compact ? "5px 10px" : "6px 12px",
        background: "rgba(22,24,30,0.94)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderLeft: "none",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 1,
        minWidth: 0,
      }}>
        <span style={{
          fontFamily: fontMono,
          fontSize: 8,
          fontWeight: 800,
          letterSpacing: 1.3,
          textTransform: "uppercase",
          color: "rgba(242,244,247,0.5)",
        }}>
          {daypartLabel || STATION_CALLSIGN}
        </span>
        <span style={{
          fontFamily: fontMono,
          fontSize: compact ? 9 : 10,
          fontWeight: 800,
          letterSpacing: 1.1,
          textTransform: "uppercase",
          color: color.onDark,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {bug.slug}
        </span>
      </div>
    </div>
  );
}

/** Scrolling station ticker — MuchMusic crawl energy. */
export function StationTicker({ text = "", dense = false }) {
  if (!text) return null;
  const loop = `${text}   ◆   ${text}`;
  return (
    <div
      aria-hidden="true"
      style={{
        overflow: "hidden",
        width: "100%",
        background: "rgba(22,24,30,0.82)",
        borderTop: "1px solid rgba(255,255,255,0.1)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        color: color.onDark,
        height: dense ? 22 : 26,
        display: "flex",
        alignItems: "center",
      }}
    >
      <div
        style={{
          display: "inline-block",
          whiteSpace: "nowrap",
          fontFamily: fontMono,
          fontSize: dense ? 9 : 10,
          fontWeight: 600,
          letterSpacing: 1.4,
          textTransform: "uppercase",
          animation: "stationTicker 42s linear infinite",
          paddingLeft: "100%",
        }}
      >
        {loop}
      </div>
    </div>
  );
}

/** MTV-style lower third for now playing — hard rectangles, hot red kicker. */
export function LowerThird({ track, rank = null, daypart = null, show = null }) {
  const line = useMemo(
    () => nowPlayingLowerThird(track, { rank, daypart, show }),
    [track, rank, daypart, show]
  );
  if (!line) return null;
  return (
    <div
      key={track?.id || line.title}
      style={{
        pointerEvents: "none",
        maxWidth: 400,
        width: "100%",
        animation: `stationLowerIn 0.45s ${motion.ease} both`,
      }}
    >
      <div style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "4px 10px 4px 8px",
        background: "#FF3B4E",
        color: "#fff",
        fontFamily: fontMono,
        fontSize: 10,
        fontWeight: 900,
        letterSpacing: 1.6,
        textTransform: "uppercase",
        clipPath: "polygon(0 0, 100% 0, calc(100% - 10px) 100%, 0 100%)",
        marginBottom: 0,
        boxShadow: "4px 0 0 rgba(22,24,30,0.35)",
      }}>
        {line.kicker}
      </div>
      <div style={{
        background: "rgba(12,14,18,0.94)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderTop: "none",
        borderLeft: "4px solid #FF3B4E",
        padding: "9px 14px 10px",
        boxShadow: "0 14px 32px rgba(12,14,18,0.4)",
      }}>
        <div style={{
          fontFamily: fontDisplay,
          fontSize: "clamp(15px, 3.2vw, 20px)",
          fontWeight: 800,
          letterSpacing: -0.35,
          color: color.onDark,
          lineHeight: 1.12,
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          textTransform: "uppercase",
        }}>
          {line.title}
        </div>
        <div style={{
          marginTop: 3,
          fontSize: 12,
          fontWeight: 600,
          color: "rgba(242,244,247,0.72)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {line.artist}
        </div>
        <div style={{
          marginTop: 5,
          fontFamily: fontMono,
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: 1.3,
          textTransform: "uppercase",
          color: "rgba(242,244,247,0.45)",
        }}>
          {line.meta}
        </div>
      </div>
    </div>
  );
}

/** Up Next bumper strip — dark broadcast plate, not frosted glass. */
export function UpNextBumper({ track = null }) {
  if (!track) return null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        maxWidth: 340,
        padding: "6px 8px 6px 0",
        borderRadius: 0,
        background: "rgba(12,14,18,0.88)",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 8px 20px rgba(12,14,18,0.35)",
        pointerEvents: "none",
        animation: `rise 0.4s ${motion.ease} both`,
        overflow: "hidden",
      }}
    >
      <div style={{
        fontFamily: fontMono,
        fontSize: 8,
        fontWeight: 900,
        letterSpacing: 1.2,
        textTransform: "uppercase",
        color: "#fff",
        flexShrink: 0,
        background: "#FF3B4E",
        padding: "10px 8px",
        alignSelf: "stretch",
        display: "flex",
        alignItems: "center",
        clipPath: "polygon(0 0, 100% 0, calc(100% - 6px) 100%, 0 100%)",
        paddingRight: 12,
      }}>
        Up Next
      </div>
      {track.albumCover ? (
        <img
          src={track.albumCover}
          alt=""
          width={26}
          height={26}
          style={{ borderRadius: 0, objectFit: "cover", flexShrink: 0 }}
        />
      ) : (
        <div style={{
          width: 26, height: 26, borderRadius: 0, flexShrink: 0,
          background: "rgba(255,255,255,0.12)",
        }} />
      )}
      <div style={{ minWidth: 0, flex: 1, paddingRight: 6 }}>
        <div style={{
          fontSize: 12, fontWeight: 700, color: color.onDark,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {track.title}
        </div>
        <div style={{
          fontSize: 10, color: "rgba(242,244,247,0.55)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {track.artist}
        </div>
      </div>
    </div>
  );
}

/**
 * Compact request line — one slim plate so the lower third stays hero.
 * Reactions tuck into a secondary row (graphic-pack labels, not emoji parade).
 */
export function StationHeatBar({
  track,
  onReact = null,
  onRequest = null,
  requested = false,
  onDedicate = null,
  compact = true,
}) {
  const [lockedIn, setLockedIn] = useState(() => estimateLockedIn(track));
  const [burst, setBurst] = useState(null);
  const [open, setOpen] = useState(false);
  const [reactCounts, setReactCounts] = useState({});

  useEffect(() => {
    setLockedIn(estimateLockedIn(track));
    const id = setInterval(() => {
      setLockedIn(estimateLockedIn(track, new Date()));
    }, 20000);
    return () => clearInterval(id);
  }, [track?.id, track?.playCount, track?.likeCount, track?.requestCount]);

  const fireReact = (emoji) => {
    setReactCounts((c) => ({ ...c, [emoji]: (c[emoji] || 0) + 1 }));
    setBurst(emoji);
    window.setTimeout(() => setBurst(null), 700);
    onReact?.(emoji);
  };

  const REACT_LABELS = { "🔥": "HOT", "💥": "BANG", "🙌": "YES", "📺": "TV", "🕺": "MOVE" };

  return (
    <div style={{
      position: "relative",
      display: "flex",
      flexDirection: "column",
      gap: 6,
      width: "100%",
      maxWidth: 400,
      pointerEvents: "auto",
    }}>
      <div style={{
        display: "flex",
        alignItems: "stretch",
        gap: 0,
        background: "rgba(12,14,18,0.9)",
        border: "1px solid rgba(255,255,255,0.1)",
        color: color.onDark,
        overflow: "hidden",
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          padding: compact ? "7px 10px" : "8px 12px",
          minWidth: 0,
          flex: 1,
        }}>
          <span aria-hidden="true" style={{
            width: 7, height: 7, borderRadius: "50%", background: "#5CFF8F",
            boxShadow: "0 0 0 3px rgba(92,255,143,0.22)",
            animation: "stageLiveDot 1.6s ease-in-out infinite",
            flexShrink: 0,
          }} />
          <span style={{
            fontFamily: fontMono, fontSize: 9, fontWeight: 800,
            letterSpacing: 1.1, textTransform: "uppercase",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}>
            {lockedIn} locked in
          </span>
        </div>

        {onRequest && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRequest(); }}
            disabled={requested}
            style={{
              padding: "0 12px",
              border: "none",
              borderLeft: "1px solid rgba(255,255,255,0.1)",
              background: requested ? "rgba(255,255,255,0.06)" : "#FF3B4E",
              color: requested ? "rgba(242,244,247,0.55)" : "#fff",
              fontFamily: fontMono,
              fontSize: 9,
              fontWeight: 900,
              letterSpacing: 1.1,
              textTransform: "uppercase",
              cursor: requested ? "default" : "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {requested ? "Queued" : "Request"}
          </button>
        )}
        {onDedicate && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDedicate(); }}
            style={{
              padding: "0 12px",
              border: "none",
              borderLeft: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.06)",
              color: color.onDark,
              fontFamily: fontMono,
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: 1.1,
              textTransform: "uppercase",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Dedicate
          </button>
        )}
        <button
          type="button"
          aria-expanded={open}
          aria-label={open ? "Hide reactions" : "Show reactions"}
          onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
          style={{
            padding: "0 10px",
            border: "none",
            borderLeft: "1px solid rgba(255,255,255,0.1)",
            background: open ? "rgba(255,59,78,0.25)" : "rgba(255,255,255,0.04)",
            color: color.onDark,
            fontFamily: fontMono,
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: 1,
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          {open ? "−" : "+"}
        </button>
      </div>

      {open && (
        <div style={{
          display: "flex",
          gap: 4,
          animation: `rise 0.25s ${motion.ease} both`,
        }}>
          {STATION_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              aria-label={`React ${REACT_LABELS[emoji] || emoji}`}
              onClick={(e) => { e.stopPropagation(); fireReact(emoji); }}
              style={{
                flex: 1,
                background: "rgba(12,14,18,0.88)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 0,
                height: 30,
                cursor: "pointer",
                fontFamily: fontMono,
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: 0.8,
                color: color.onDark,
                position: "relative",
              }}
            >
              {REACT_LABELS[emoji] || emoji}
              {reactCounts[emoji] > 0 && (
                <span style={{
                  position: "absolute", top: -5, right: 2,
                  fontSize: 8, fontFamily: fontMono, fontWeight: 800,
                  background: "#FF3B4E", color: "#fff",
                  padding: "1px 4px",
                }}>
                  {reactCounts[emoji]}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {burst && (
        <div aria-hidden="true" style={{
          position: "absolute",
          left: "50%",
          bottom: "110%",
          transform: "translateX(-50%)",
          fontFamily: fontMono,
          fontSize: 18,
          fontWeight: 900,
          letterSpacing: 2,
          color: "#FF3B4E",
          textShadow: "0 2px 12px rgba(12,14,18,0.6)",
          animation: "stationBurst 0.7s ease forwards",
          pointerEvents: "none",
          zIndex: 6,
        }}>
          {REACT_LABELS[burst] || burst}
        </div>
      )}
    </div>
  );
}

/** Dedication lower-third flash. */
export function DedicationFlash({ dedication, onDone }) {
  useEffect(() => {
    if (!dedication) return undefined;
    const t = window.setTimeout(() => onDone?.(), 8000);
    return () => window.clearTimeout(t);
  }, [dedication?.id, onDone]);

  if (!dedication) return null;
  return (
    <div
      role="status"
      style={{
        maxWidth: 380,
        width: "100%",
        padding: "10px 14px",
        borderRadius: radius.sm,
        background: "rgba(255,255,255,0.92)",
        border: `1px solid ${glass.border}`,
        borderLeft: "4px solid #5C8CFF",
        boxShadow: glass.shadow,
        animation: `stationLowerIn 0.4s ${motion.ease} both`,
        pointerEvents: "none",
      }}
    >
      <div style={{
        fontFamily: fontMono, fontSize: 9, fontWeight: 800,
        letterSpacing: 1.4, textTransform: "uppercase", color: "#5C8CFF",
        marginBottom: 4,
      }}>
        Dedication · {dedication.fromName}
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: color.ink, lineHeight: 1.35 }}>
        “{dedication.text}”
      </div>
      {dedication.trackTitle && (
        <div style={{ marginTop: 4, fontSize: 11, color: color.muted }}>
          during {dedication.trackTitle}
        </div>
      )}
    </div>
  );
}

/** Compact dedicate composer sheet. */
export function DedicateSheet({ track, defaultName = "Listener", onClose, onSubmit }) {
  const [text, setText] = useState("");
  const [name, setName] = useState(defaultName);

  const submit = () => {
    const entry = addDedication({
      text,
      fromName: name,
      trackId: track?.id || null,
      trackTitle: track?.title || null,
    });
    if (entry) onSubmit?.(entry);
    onClose?.();
  };

  return (
    <div
      role="dialog"
      aria-label="Send a dedication"
      style={{
        position: "fixed", inset: 0, zIndex: 220,
        background: "rgba(22,24,30,0.45)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        className="glass-surface"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(100%, 420px)",
          borderRadius: radius.lg,
          padding: 18,
          animation: `rise 0.3s ${motion.ease} both`,
        }}
      >
        <div style={{
          fontFamily: fontMono, fontSize: 10, fontWeight: 800,
          letterSpacing: 1.5, textTransform: "uppercase", color: color.faint,
          marginBottom: 8,
        }}>
          On-air dedication
        </div>
        <div style={{
          fontFamily: fontDisplay, fontSize: 20, fontWeight: 700,
          color: color.ink, marginBottom: 14, letterSpacing: -0.3,
        }}>
          Shout it to the station
        </div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 24))}
          placeholder="Your name"
          aria-label="Your name"
          style={{
            width: "100%", marginBottom: 10, padding: "12px 14px",
            borderRadius: radius.sm, border: `1px solid ${glass.border}`,
            background: "rgba(255,255,255,0.8)", fontFamily: font, fontSize: 15,
          }}
        />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 72))}
          placeholder="Keep it short — dedications flash on the lower third"
          aria-label="Dedication message"
          rows={3}
          style={{
            width: "100%", marginBottom: 8, padding: "12px 14px",
            borderRadius: radius.sm, border: `1px solid ${glass.border}`,
            background: "rgba(255,255,255,0.8)", fontFamily: font, fontSize: 15,
            resize: "none",
          }}
        />
        <div style={{
          fontSize: 11, color: color.faint, fontFamily: fontMono,
          marginBottom: 14, textAlign: "right",
        }}>
          {text.length}/72
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={onClose} style={{
            flex: 1, padding: "12px 14px", borderRadius: radius.sm,
            border: `1px solid ${glass.border}`, background: "transparent",
            fontWeight: 650, cursor: "pointer", color: color.muted,
          }}>
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!text.trim()}
            style={{
              flex: 1, padding: "12px 14px", borderRadius: radius.sm,
              border: "none",
              background: text.trim()
                ? "linear-gradient(165deg, #5C8CFF 0%, #3A63D8 100%)"
                : color.surfaceRaised,
              color: text.trim() ? "#fff" : color.faint,
              fontWeight: 700, cursor: text.trim() ? "pointer" : "default",
            }}
          >
            Send live
          </button>
        </div>
      </div>
    </div>
  );
}

/** Hook helper — ticker + daypart + dedications for station surfaces. */
export function useStationFeed({
  countdown = [],
  communityMixTitle = null,
  show = null,
  nextShow = null,
  bumper = null,
} = {}) {
  const daypart = useMemo(() => stationDaypart(new Date()), []);
  const [dedicationFlash, setDedicationFlash] = useState(null);
  const [dedications, setDedications] = useState(() => listDedications(8));

  const ticker = useMemo(
    () => buildStationTicker({
      countdown,
      daypart,
      communityMixTitle,
      dedication: dedications[0] || null,
      show,
      nextShow,
      bumper,
    }),
    [countdown, daypart, communityMixTitle, dedications, show, nextShow, bumper]
  );

  const pushDedication = (entry) => {
    setDedications(listDedications(8));
    setDedicationFlash(entry);
  };

  return {
    daypart,
    ticker,
    dedications,
    dedicationFlash,
    setDedicationFlash,
    pushDedication,
  };
}
