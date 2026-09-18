/**
 * Compact dedicate composer — lazy-loaded from App so StationChrome
 * visuals stay off the Home boot graph.
 */
import { useState } from "react";
import {
  color, font, fontDisplay, fontMono, glass, motion, radius, chrome,
} from "../../theme";
import { addDedication } from "../../lib/station";

export default function DedicateSheet({ track, defaultName = "Listener", onClose, onSubmit }) {
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
              color: text.trim() ? color.ink : color.faint,
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
