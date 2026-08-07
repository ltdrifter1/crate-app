import { useEffect, useMemo, useState } from "react";
import {
  color, font, fontDisplay, fontMono, glass, motion, radius, chrome,
  hardware, hardwareKey
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
import CoverImage from "../ui/CoverImage";

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

/** Machined ON AIR plate — live pulse + callsign. */
export function OnAirBadge({
  daypartLabel = null,
  showTitle = null,
  compact = false,
  callsign = STATION_CALLSIGN,
  integrated = false,
}) {
  const secondary = showTitle || daypartLabel;
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: compact ? 8 : 10,
        maxWidth: integrated ? "calc(100vw - 150px)" : (compact ? 240 : 300),
        boxSizing: "border-box",
        minHeight: compact ? 34 : 40,
        padding: integrated ? "0 14px" : (compact ? "6px 10px" : "7px 12px"),
        borderRadius: integrated ? 0 : 4,
        background: integrated ? "transparent" : glass.chrome,
        border: integrated ? "none" : `1px solid ${glass.border}`,
        boxShadow: integrated
          ? "none"
          : `inset 0 1px 0 ${glass.highlight}, inset 0 -1px 0 rgba(0,0,0,0.45)`,
        color: color.ink,
        pointerEvents: "none",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: compact ? 6 : 7,
          height: compact ? 6 : 7,
          borderRadius: "50%",
          background: "#E23B4C",
          boxShadow: "0 0 0 2px rgba(226,59,76,0.2)",
          animation: "stageLiveDot 1.4s ease-in-out infinite",
          flexShrink: 0,
        }}
      />
      <span style={{
        fontFamily: fontMono,
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: 1.5,
        textTransform: "uppercase",
        color: color.accent,
        flexShrink: 0,
      }}>
        On Air
      </span>
      <span style={{
        width: 1,
        height: 12,
        background: glass.border,
        flexShrink: 0,
      }} />
      <div style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        minWidth: 0,
        gap: 1,
      }}>
        <span style={{
          fontFamily: fontMono,
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: 1,
          textTransform: "uppercase",
          color: color.muted,
        }}>
          {callsign}
        </span>
        {secondary && (
          <span style={{
            fontFamily: fontMono,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: 0.65,
            textTransform: "uppercase",
            color: color.body,
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
 * Persistent channel bug — hard CH-ID plate with tuned signal.
 */
export function ChannelBug({
  sceneChannel = null,
  show = null,
  daypartLabel = null,
  compact = false,
  integrated = false,
}) {
  const bug = resolveChannelBug({ sceneChannel, show });
  return (
    <div
      aria-label={`${bug.ch} ${bug.slug}`}
      style={{
        display: "inline-flex",
        alignItems: "stretch",
        borderRadius: integrated ? 0 : 4,
        overflow: "hidden",
        pointerEvents: "none",
        boxShadow: integrated
          ? "none"
          : `inset 0 1px 0 ${glass.highlight}, inset 0 -1px 0 rgba(0,0,0,0.45)`,
        animation: `channelBugIn 0.4s ${motion.ease} both`,
        maxWidth: compact ? 168 : 210,
        border: integrated ? "none" : `1px solid ${glass.border}`,
        borderLeft: integrated ? `1px solid ${glass.border}` : undefined,
        background: integrated ? "transparent" : glass.chrome,
      }}
    >
      <div style={{
        padding: compact ? "7px 9px" : "8px 11px",
        background: integrated
          ? "rgba(8,9,11,0.28)"
          : "linear-gradient(160deg, rgba(48,53,61,0.95) 0%, rgba(22,25,30,0.95) 100%)",
        color: color.accent,
        fontFamily: fontMono,
        fontSize: compact ? 11 : 12,
        fontWeight: 900,
        letterSpacing: 0.6,
        display: "flex",
        alignItems: "center",
        borderRight: `1px solid ${glass.borderSoft}`,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), inset -1px 0 0 rgba(0,0,0,0.4)",
      }}>
        {bug.ch}
      </div>
      <div style={{
        padding: compact ? "5px 10px" : "6px 12px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 1,
        minWidth: 0,
      }}>
        <span style={{
          fontFamily: fontMono,
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: 0.8,
          textTransform: "uppercase",
          color: color.muted,
        }}>
          {daypartLabel || STATION_CALLSIGN}
        </span>
        <span style={{
          fontFamily: fontMono,
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: 0.8,
          textTransform: "uppercase",
          color: color.ink,
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

/** Scrolling station ticker — dense broadcast crawl. */
export function StationTicker({ text = "", dense = false }) {
  if (!text) return null;
  const loop = `${text}   ◆   ${text}`;
  return (
    <div
      aria-hidden="true"
      style={{
        overflow: "hidden",
        width: "100%",
        background: "rgba(8,9,11,0.94)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        borderBottom: "1px solid rgba(0,0,0,0.7)",
        boxShadow: "none",
        color: color.body,
        height: dense ? 18 : 22,
        display: "flex",
        alignItems: "center",
      }}
    >
      <div
        style={{
          display: "inline-block",
          whiteSpace: "nowrap",
          fontFamily: fontMono,
          fontSize: dense ? 8 : 9,
          fontWeight: 650,
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

/** Hard now-playing plate — monumental title, engraved broadcast metadata. */
export function LowerThird({
  track,
  rank = null,
  daypart = null,
  show = null,
  embedded = false,
}) {
  const line = useMemo(
    () => nowPlayingLowerThird(track, { rank, daypart, show }),
    [track, rank, daypart, show]
  );
  if (!line) return null;

  const kickerBits = String(line.kicker || "")
    .split("·")
    .map((s) => s.trim())
    .filter(Boolean);
  const isLive = kickerBits.some((bit) => bit.toUpperCase() === "NOW PLAYING");

  const body = (
    <>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        marginBottom: embedded ? 8 : 10,
      }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          minWidth: 0,
          padding: "4px 8px",
          borderRadius: 3,
          background: "rgba(8,9,11,0.48)",
          border: `1px solid ${glass.borderSoft}`,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05), inset 0 -1px 0 rgba(0,0,0,0.5)",
          fontFamily: fontMono,
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: 1.1,
          textTransform: "uppercase",
          color: color.body,
          overflow: "hidden",
          whiteSpace: "nowrap",
        }}>
          {isLive && (
            <span
              aria-hidden="true"
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: chrome.live,
                boxShadow: "0 0 0 2px rgba(224,60,75,0.18)",
                animation: "stageLiveDot 1.5s ease-in-out infinite",
                flexShrink: 0,
              }}
            />
          )}
          <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
            {kickerBits.map((bit, i) => (
              <span key={`${bit}-${i}`}>
                {i > 0 && <span style={{ color: color.faint }}> · </span>}
                <span
                  style={{
                    color: bit.toUpperCase() === "NOW PLAYING"
                      ? color.accent
                      : color.body,
                  }}
                >
                  {bit}
                </span>
              </span>
            ))}
          </span>
        </div>
      </div>

      <div style={{
        fontFamily: fontDisplay,
        fontSize: "clamp(24px, 5.5vw, 32px)",
        fontWeight: 800,
        letterSpacing: -0.7,
        color: color.ink,
        lineHeight: 1.08,
        overflow: "hidden",
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
      }}>
        {line.title}
      </div>
      <div style={{
        marginTop: 6,
        fontSize: 16,
        fontWeight: 550,
        letterSpacing: -0.2,
        color: color.body,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}>
        {line.artist}
      </div>
      <div style={{
        marginTop: 10,
        fontFamily: fontMono,
        fontSize: 11,
        fontWeight: 750,
        letterSpacing: 1.15,
        textTransform: "uppercase",
        color: isLive ? color.accent : color.muted,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}>
        {line.meta}
      </div>
    </>
  );

  if (embedded) {
    return (
      <div
        key={track?.id || line.title}
        style={{
          pointerEvents: "none",
          width: "100%",
          animation: `stationLowerIn 0.45s ${motion.ease} both`,
        }}
      >
        {body}
      </div>
    );
  }

  return (
    <div
      key={track?.id || line.title}
      style={{
        pointerEvents: "none",
        maxWidth: 400,
        width: "100%",
        padding: "14px 16px 15px",
        borderRadius: 8,
        background: glass.frame,
        border: `1px solid rgba(255,255,255,0.14)`,
        boxShadow: `inset 0 1px 0 ${glass.highlight}, inset 0 -1px 0 rgba(0,0,0,0.45), ${glass.shadowSoft}`,
        animation: `stationLowerIn 0.45s ${motion.ease} both`,
      }}
    >
      {body}
    </div>
  );
}

/** Up Next bumper — hard aluminum stamp that keys into the player dock. */
export function UpNextBumper({ track = null }) {
  if (!track) return null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        maxWidth: 340,
        width: "100%",
        padding: "8px 12px 8px 8px",
        borderRadius: 5,
        background: `
          repeating-linear-gradient(90deg, rgba(255,255,255,0.014) 0 1px, transparent 1px 4px),
          ${hardware.keyFace}
        `,
        border: `1px solid rgba(255,255,255,0.14)`,
        boxShadow: `${hardware.plateEdge}, 0 8px 22px rgba(0,0,0,0.34)`,
        pointerEvents: "none",
        animation: `rise 0.4s ${motion.ease} both`,
        overflow: "hidden",
      }}
    >
      <div style={{
        fontFamily: fontMono,
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: 1,
        textTransform: "uppercase",
        color: color.body,
        flexShrink: 0,
        padding: "5px 7px",
        borderRadius: 3,
        background: "rgba(8,9,11,0.42)",
        border: `1px solid rgba(255,255,255,0.12)`,
        boxShadow: hardware.plateEdge,
      }}>
        Up Next
      </div>
      <div style={{
        width: 28, height: 28, borderRadius: 4, flexShrink: 0,
        overflow: "hidden",
        background: "rgba(18,20,26,0.08)",
        border: `1px solid ${glass.borderSoft}`,
        boxShadow: "0 2px 8px rgba(18,20,26,0.12)",
      }}>
        <CoverImage src={track.albumCover} width={28} height={28} alt="" />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{
          fontSize: 12, fontWeight: 650, color: color.ink,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {track.title}
        </div>
        <div style={{
          fontSize: 11, fontWeight: 550, color: color.muted,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {track.artist}
        </div>
      </div>
    </div>
  );
}

/**
 * Hard request line — presence + request/dedicate controls.
 * When embedded, sits as a connected strip inside the stage dock.
 */
export function StationHeatBar({
  track,
  onReact = null,
  onRequest = null,
  requested = false,
  onDedicate = null,
  compact = true,
  embedded = false,
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

  const chipBase = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    height: compact ? 34 : 36,
    padding: "0 14px",
    ...hardwareKey({ size: compact ? "sm" : "md" }),
    borderRadius: 5,
    whiteSpace: "nowrap",
    flexShrink: 0,
  };

  return (
    <div style={{
      position: "relative",
      display: "flex",
      flexDirection: "column",
      gap: 8,
      width: "100%",
      maxWidth: embedded ? "none" : 400,
      pointerEvents: "auto",
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: embedded ? "2px 0" : (compact ? "8px 10px" : "9px 12px"),
        borderRadius: embedded ? 0 : radius.lg,
        background: embedded
          ? "transparent"
          : `
            ${glass.frame}
          `,
        border: embedded ? "none" : `1px solid ${glass.borderSoft}`,
        boxShadow: embedded
          ? "none"
          : `inset 0 1px 0 ${glass.highlight}, ${glass.shadowSoft}`,
        color: color.ink,
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          minWidth: 0,
          flex: 1,
          paddingLeft: embedded ? 2 : 4,
        }}>
          <span aria-hidden="true" style={{
            width: 7, height: 7, borderRadius: "50%", background: chrome.live,
            boxShadow: "0 0 0 3px rgba(224,60,75,0.22)",
            animation: "stageLiveDot 1.6s ease-in-out infinite",
            flexShrink: 0,
          }} />
          <span style={{
            fontFamily: fontMono, fontSize: 11, fontWeight: 800,
            letterSpacing: 1.05, textTransform: "uppercase",
            color: color.muted,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}>
            {lockedIn} locked in
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          {onRequest && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onRequest(); }}
              disabled={requested}
              style={{
                ...chipBase,
                ...hardwareKey({ pressed: requested, size: compact ? "sm" : "md" }),
                color: requested ? color.accent : color.ink,
                cursor: requested ? "default" : "pointer",
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
                ...chipBase,
                color: color.body,
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
              ...chipBase,
              ...hardwareKey({ pressed: open, size: compact ? "sm" : "md" }),
              width: compact ? 32 : 34,
              padding: 0,
              color: open ? color.accent : color.muted,
            }}
          >
            {open ? "−" : "+"}
          </button>
        </div>
      </div>

      {open && (
        <div style={{
          display: "flex",
          gap: 6,
          animation: `rise 0.25s ${motion.ease} both`,
        }}>
          {STATION_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              aria-label={`React ${REACT_LABELS[emoji] || emoji}`}
              onClick={(e) => { e.stopPropagation(); fireReact(emoji); }}
              style={{
                ...hardwareKey({ size: "sm" }),
                flex: 1,
                height: 34,
                borderRadius: 5,
                minHeight: 34,
                padding: 0,
                fontSize: 11,
                letterSpacing: 0.8,
                color: color.body,
                position: "relative",
              }}
            >
              {REACT_LABELS[emoji] || emoji}
              {reactCounts[emoji] > 0 && (
                <span style={{
                  position: "absolute", top: -6, right: 4,
                  fontSize: 11, fontFamily: fontMono, fontWeight: 800,
                  background: color.ink, color: color.onAccent,
                  padding: "1px 5px",
                  borderRadius: radius.pill,
                  boxShadow: "0 2px 6px rgba(18,20,26,0.16)",
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
          fontSize: 16,
          fontWeight: 900,
          letterSpacing: 2,
          color: color.ink,
          textShadow: "0 2px 12px rgba(0,0,0,0.5)",
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
        padding: "12px 14px",
        borderRadius: radius.lg,
        background: glass.plate,
        border: `1px solid ${glass.border}`,
        boxShadow: `inset 0 1px 0 ${glass.highlight}, ${glass.shadowLift}`,
        backdropFilter: glass.blur,
        WebkitBackdropFilter: glass.blur,
        animation: `stationLowerIn 0.4s ${motion.ease} both`,
        pointerEvents: "none",
      }}
    >
      <div style={{
        fontFamily: fontMono, fontSize: 9, fontWeight: 800,
        letterSpacing: 1.4, textTransform: "uppercase", color: color.muted,
        marginBottom: 5,
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
            background: "rgba(44,49,58,0.85)", fontFamily: font, fontSize: 15,
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
            background: "rgba(44,49,58,0.85)", fontFamily: font, fontSize: 15,
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
                ? `linear-gradient(165deg, ${chrome.bright} 0%, ${chrome.steel} 100%)`
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
