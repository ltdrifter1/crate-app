import React, { useState } from "react";
import { populateAllRooms, atmosphereGradient, KIND_LABELS } from "../../lib/rooms";
import {
  font, fontDisplay, fontMono, color, radius, BRAND_NAME,
} from "../../theme";

/**
 * First-visit ritual: pick Rooms that feel like home.
 */
export default function OnboardingRitual({ tracks, onComplete, onSkip }) {
  const rooms = populateAllRooms(tracks).slice(0, 14);
  const [selected, setSelected] = useState([]);

  function toggle(id) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  }

  const ready = selected.length >= 1;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        background: color.canvas,
        overflow: "auto",
        fontFamily: font,
        animation: "fadeIn 0.4s ease both",
      }}
    >
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "48px 20px 120px" }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 2,
            color: color.accent,
            fontFamily: fontMono,
            textTransform: "uppercase",
            marginBottom: 14,
          }}
        >
          Welcome to {BRAND_NAME}
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: "clamp(32px, 8vw, 44px)",
            fontWeight: 800,
            letterSpacing: -1.4,
            fontFamily: fontDisplay,
            color: color.ink,
            lineHeight: 1.05,
          }}
        >
          Which rooms feel like home?
        </h1>
        <p
          style={{
            margin: "14px 0 28px",
            fontSize: 15,
            color: color.body,
            lineHeight: 1.5,
            maxWidth: 360,
          }}
        >
          Pick up to three. We’ll leave the door cracked — you can always wander later.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {rooms.map((room) => {
            const on = selected.includes(room.id);
            const bg = atmosphereGradient(room.atmosphere || room.id);
            return (
              <button
                key={room.id}
                type="button"
                onClick={() => toggle(room.id)}
                aria-pressed={on}
                style={{
                  display: "flex",
                  alignItems: "stretch",
                  gap: 0,
                  padding: 0,
                  border: on ? `1px solid ${color.accent}` : `1px solid ${color.line}`,
                  borderRadius: radius.md,
                  overflow: "hidden",
                  background: color.surfaceSolid,
                  cursor: "pointer",
                  textAlign: "left",
                  color: color.ink,
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    width: 8,
                    flexShrink: 0,
                    background: on ? color.accent : bg,
                  }}
                />
                <div style={{ flex: 1, padding: "14px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div>
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: 1.2,
                          color: color.faint,
                          fontFamily: fontMono,
                          textTransform: "uppercase",
                          marginBottom: 4,
                        }}
                      >
                        {KIND_LABELS[room.kind] || "Room"}
                      </div>
                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 700,
                          fontFamily: fontDisplay,
                          letterSpacing: -0.3,
                          color: on ? color.accent : color.ink,
                        }}
                      >
                        {room.label}
                      </div>
                      <div style={{ fontSize: 12, color: color.muted, marginTop: 4 }}>
                        {room.desc || room.story}
                      </div>
                    </div>
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 6,
                        border: `1px solid ${on ? color.accent : color.lineStrong}`,
                        background: on ? color.accent : "transparent",
                        color: on ? color.onAccent : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 700,
                        flexShrink: 0,
                        marginTop: 4,
                      }}
                    >
                      ✓
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          padding: "16px 20px 28px",
          background: `linear-gradient(180deg, transparent, ${color.canvas} 28%)`,
          display: "flex",
          gap: 10,
          justifyContent: "center",
        }}
      >
        <button
          type="button"
          onClick={onSkip}
          style={{
            padding: "14px 18px",
            borderRadius: radius.sm,
            border: `1px solid ${color.lineStrong}`,
            background: "none",
            color: color.muted,
            fontWeight: 600,
            fontSize: 14,
            cursor: "pointer",
            fontFamily: font,
          }}
        >
          Wander first
        </button>
        <button
          type="button"
          disabled={!ready}
          onClick={() => onComplete(selected)}
          style={{
            padding: "14px 22px",
            borderRadius: radius.sm,
            border: "none",
            background: ready ? color.accent : color.surfaceRaised,
            color: ready ? color.onAccent : color.faint,
            fontWeight: 650,
            fontSize: 14,
            cursor: ready ? "pointer" : "default",
            fontFamily: font,
            minWidth: 160,
          }}
        >
          {selected.length === 0
            ? "Pick a room"
            : selected.length === 1
              ? "Enter with 1 room"
              : `Enter with ${selected.length} rooms`}
        </button>
      </div>
    </div>
  );
}
