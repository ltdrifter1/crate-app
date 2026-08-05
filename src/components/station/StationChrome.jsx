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

/** Pulsing ON AIR pill — station identity. */
export function OnAirBadge({ daypartLabel = null, showTitle = null, compact = false }) {
  const secondary = showTitle || daypartLabel;
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: compact ? 6 : 8,
        padding: compact ? "6px 10px" : "8px 12px",
        borderRadius: 999,
        background: "rgba(22,24,30,0.88)",
        border: "1px solid rgba(255,255,255,0.14)",
        boxShadow: "0 8px 22px rgba(22,24,30,0.22), inset 0 1px 0 rgba(255,255,255,0.12)",
        color: color.onDark,
        pointerEvents: "none",
        maxWidth: compact ? 220 : 280,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: compact ? 7 : 8,
          height: compact ? 7 : 8,
          borderRadius: "50%",
          background: "#FF3B4E",
          boxShadow: "0 0 0 3px rgba(255,59,78,0.28)",
          animation: "stageLiveDot 1.4s ease-in-out infinite",
          flexShrink: 0,
        }}
      />
      <span style={{
        fontFamily: fontMono,
        fontSize: compact ? 9 : 10,
        fontWeight: 700,
        letterSpacing: 1.6,
        textTransform: "uppercase",
        flexShrink: 0,
      }}>
        On Air
      </span>
      {secondary && (
        <span style={{
          fontFamily: fontMono,
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: 1.1,
          textTransform: "uppercase",
          color: "rgba(242,244,247,0.62)",
          borderLeft: "1px solid rgba(255,255,255,0.16)",
          paddingLeft: 8,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {secondary}
        </span>
      )}
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

/** MTV-style lower third for now playing. */
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
        maxWidth: 420,
        width: "100%",
        animation: `stationLowerIn 0.45s ${motion.ease} both`,
      }}
    >
      <div style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "5px 10px",
        background: "#FF3B4E",
        color: "#fff",
        fontFamily: fontMono,
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: 1.5,
        textTransform: "uppercase",
        clipPath: "polygon(0 0, 100% 0, calc(100% - 8px) 100%, 0 100%)",
        marginBottom: 0,
      }}>
        {line.kicker}
      </div>
      <div style={{
        background: "rgba(22,24,30,0.9)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderLeft: "3px solid #FF3B4E",
        padding: "10px 14px 12px",
        boxShadow: "0 12px 28px rgba(22,24,30,0.28)",
      }}>
        <div style={{
          fontFamily: fontDisplay,
          fontSize: "clamp(16px, 3.4vw, 22px)",
          fontWeight: 750,
          letterSpacing: -0.4,
          color: color.onDark,
          lineHeight: 1.15,
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
        }}>
          {line.title}
        </div>
        <div style={{
          marginTop: 4,
          fontSize: 13,
          fontWeight: 550,
          color: "rgba(242,244,247,0.78)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {line.artist}
        </div>
        <div style={{
          marginTop: 6,
          fontFamily: fontMono,
          fontSize: 10,
          fontWeight: 650,
          letterSpacing: 1.2,
          textTransform: "uppercase",
          color: "rgba(242,244,247,0.5)",
        }}>
          {line.meta}
        </div>
      </div>
    </div>
  );
}

/** Up Next bumper strip. */
export function UpNextBumper({ track = null }) {
  if (!track) return null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        maxWidth: 360,
        padding: "8px 10px",
        borderRadius: radius.sm,
        background: "rgba(255,255,255,0.72)",
        border: `1px solid ${glass.border}`,
        boxShadow: `inset 0 1px 0 ${glass.highlight}, ${glass.shadowSoft}`,
        backdropFilter: glass.blurSoft,
        WebkitBackdropFilter: glass.blurSoft,
        pointerEvents: "none",
        animation: `rise 0.4s ${motion.ease} both`,
      }}
    >
      <div style={{
        fontFamily: fontMono,
        fontSize: 9,
        fontWeight: 800,
        letterSpacing: 1.3,
        textTransform: "uppercase",
        color: "#FF3B4E",
        flexShrink: 0,
      }}>
        Up Next
      </div>
      {track.albumCover ? (
        <img
          src={track.albumCover}
          alt=""
          width={28}
          height={28}
          style={{ borderRadius: 4, objectFit: "cover", flexShrink: 0 }}
        />
      ) : (
        <div style={{
          width: 28, height: 28, borderRadius: 4, flexShrink: 0,
          background: color.surfaceRaised,
        }} />
      )}
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{
          fontSize: 12, fontWeight: 650, color: color.ink,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {track.title}
        </div>
        <div style={{
          fontSize: 11, color: color.muted,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {track.artist}
        </div>
      </div>
    </div>
  );
}

/** Locked-in presence + quick reactions. */
export function StationHeatBar({
  track,
  onReact = null,
  onRequest = null,
  requested = false,
  onDedicate = null,
}) {
  const [lockedIn, setLockedIn] = useState(() => estimateLockedIn(track));
  const [burst, setBurst] = useState(null);
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

  return (
    <div style={{
      position: "relative",
      display: "flex",
      flexDirection: "column",
      gap: 8,
      width: "100%",
      maxWidth: 420,
      pointerEvents: "auto",
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        padding: "8px 12px",
        borderRadius: radius.md,
        background: "rgba(22,24,30,0.78)",
        border: "1px solid rgba(255,255,255,0.1)",
        color: color.onDark,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <span aria-hidden="true" style={{
            width: 8, height: 8, borderRadius: "50%", background: "#5CFF8F",
            boxShadow: "0 0 0 3px rgba(92,255,143,0.25)",
            animation: "stageLiveDot 1.6s ease-in-out infinite",
          }} />
          <span style={{
            fontFamily: fontMono, fontSize: 10, fontWeight: 700,
            letterSpacing: 1.2, textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}>
            {lockedIn} locked in
          </span>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {STATION_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              aria-label={`React ${emoji}`}
              onClick={(e) => { e.stopPropagation(); fireReact(emoji); }}
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                width: 32,
                height: 28,
                cursor: "pointer",
                fontSize: 13,
                position: "relative",
              }}
            >
              {emoji}
              {reactCounts[emoji] > 0 && (
                <span style={{
                  position: "absolute", top: -6, right: -4,
                  fontSize: 8, fontFamily: fontMono, fontWeight: 800,
                  background: "#FF3B4E", color: "#fff",
                  borderRadius: 8, padding: "1px 4px",
                }}>
                  {reactCounts[emoji]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        {onRequest && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRequest(); }}
            disabled={requested}
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: radius.sm,
              border: requested ? `1px solid ${glass.border}` : "1px solid rgba(255,59,78,0.45)",
              background: requested
                ? glass.fillStrong
                : "linear-gradient(165deg, #FF5A6A 0%, #D61F33 100%)",
              color: requested ? color.muted : "#fff",
              fontFamily: fontMono,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              cursor: requested ? "default" : "pointer",
              boxShadow: requested ? "none" : "0 8px 18px rgba(214,31,51,0.28)",
            }}
          >
            {requested ? "Requested ✓" : "Request this"}
          </button>
        )}
        {onDedicate && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDedicate(); }}
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: radius.sm,
              border: `1px solid ${glass.border}`,
              background: glass.fillStrong,
              color: color.ink,
              fontFamily: fontMono,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              cursor: "pointer",
              boxShadow: `inset 0 1px 0 ${glass.highlight}`,
            }}
          >
            Dedicate
          </button>
        )}
      </div>

      {burst && (
        <div aria-hidden="true" style={{
          position: "absolute",
          left: "50%",
          bottom: "42%",
          transform: "translateX(-50%)",
          fontSize: 42,
          animation: "stationBurst 0.7s ease forwards",
          pointerEvents: "none",
          zIndex: 6,
        }}>
          {burst}
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
