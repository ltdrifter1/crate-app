import React, { useState } from "react";
import { populateAllRooms, roomPosterStyle, KIND_LABELS } from "../../lib/rooms";
import {
  font, fontDisplay, fontMono, color, radius, BRAND_NAME,
} from "../../theme";

/**
 * First-visit ritual: press into Rooms that feel like home — posters, not checkboxes.
 */
export default function OnboardingRitual({ tracks, onComplete, onSkip }) {
  const rooms = populateAllRooms(tracks).slice(0, 12);
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
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "42vh",
          background: "radial-gradient(ellipse at 40% 0%, #1A1612 0%, #0C0B0A 55%, transparent 100%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", maxWidth: 560, margin: "0 auto", padding: "48px 20px 120px" }}>
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
            fontSize: "clamp(34px, 9vw, 48px)",
            fontWeight: 800,
            letterSpacing: -1.6,
            fontFamily: fontDisplay,
            color: color.ink,
            lineHeight: 0.98,
          }}
        >
          Which rooms feel like home?
        </h1>
        <p
          style={{
            margin: "14px 0 32px",
            fontSize: 15,
            color: color.body,
            lineHeight: 1.5,
            maxWidth: 340,
          }}
        >
          Press into up to three. We’ll leave the door cracked.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))",
            gap: 12,
          }}
        >
          {rooms.map((room, i) => {
            const on = selected.includes(room.id);
            const poster = roomPosterStyle(room);
            const cover = room.coverTrack?.albumCover;
            return (
              <button
                key={room.id}
                type="button"
                onClick={() => toggle(room.id)}
                aria-pressed={on}
                style={{
                  position: "relative",
                  minHeight: 168,
                  padding: 0,
                  border: on ? `2px solid ${color.accent}` : `1px solid ${color.line}`,
                  overflow: "hidden",
                  background: color.surfaceSolid,
                  cursor: "pointer",
                  textAlign: "left",
                  color: color.onDark,
                  animation: `rise 0.5s cubic-bezier(0.22,1,0.36,1) ${Math.min(i, 8) * 0.03}s both`,
                }}
              >
                <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: poster.gradient }} />
                {cover && (
                  <div
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      inset: 0,
                      backgroundImage: `url(${cover})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      opacity: on ? 0.55 : 0.35,
                      filter: `saturate(${poster.coverSat}%) brightness(${Math.min(1, poster.coverBright + 0.2)})`,
                    }}
                  />
                )}
                {poster.texture && (
                  <div
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      inset: 0,
                      opacity: poster.textureOpacity * 0.7,
                      backgroundImage: poster.texture,
                      backgroundSize: poster.textureSize || "auto",
                      mixBlendMode: poster.textureBlend || "soft-light",
                      pointerEvents: "none",
                    }}
                  />
                )}
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(180deg, transparent 20%, rgba(12,11,10,0.92) 100%)",
                  }}
                />
                <div
                  style={{
                    position: "relative",
                    zIndex: 1,
                    height: "100%",
                    minHeight: 168,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    padding: "14px 14px 16px",
                  }}
                >
                  <div
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: 1.4,
                      color: on ? color.accent : color.faint,
                      fontFamily: fontMono,
                      textTransform: "uppercase",
                      marginBottom: 6,
                    }}
                  >
                    {KIND_LABELS[room.kind] || "Room"}
                    {on ? " · In" : ""}
                  </div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 750,
                      fontFamily: fontDisplay,
                      letterSpacing: -0.4,
                      color: color.onDark,
                      lineHeight: 1.15,
                    }}
                  >
                    {room.label}
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
