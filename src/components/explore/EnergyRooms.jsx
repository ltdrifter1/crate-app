import { color, fontDisplay, fontMono, homeSpace, motion, radio } from "../../theme";

const ROOM_ORDER = ["after-hours", "drive", "late-booth", "peak-time"];

/**
 * One pressure strip. Tap a zone to play that crate immediately.
 */
export default function EnergyRooms({ rooms = [], onPlay = null }) {
  if (!rooms.length) return null;
  const ordered = ROOM_ORDER.map((id) => rooms.find((r) => r.id === id)).filter(Boolean);
  const zones = ordered.length ? ordered : rooms;

  return (
    <div style={{ padding: `8px ${homeSpace.gutter}px 0` }}>
      <div
        className="pmp-energy-strip"
        role="group"
        aria-label="Pressure"
        style={{
          padding: 6,
          borderRadius: radio.radius,
          background: radio.lcdFace,
          border: radio.lcdBorder,
          boxShadow: radio.lcdShadow,
          overflow: "hidden",
        }}
      >
        {zones.map((room, i) => {
          const ready = (room.pool || []).length > 0;
          const heat = (room.minEnergy + room.maxEnergy) / 20;
          return (
            <button
              key={room.id}
              type="button"
              className="pmp-press pmp-energy-zone"
              disabled={!ready}
              onClick={() => {
                if (ready && room.pool[0]) onPlay?.(room.pool[0], room.pool, room);
              }}
              aria-label={`Play ${room.label}`}
              style={{
                minHeight: 112,
                padding: "12px 10px 10px",
                border: "none",
                borderRadius: radio.radiusLcd,
                background: `linear-gradient(180deg, rgba(183,228,238,${0.08 + heat * 0.28}) 0%, rgba(90,196,214,${0.05 + heat * 0.2}) 100%)`,
                cursor: ready ? "pointer" : "default",
                textAlign: "left",
                opacity: ready ? 1 : 0.4,
                animation: `rise 0.4s ${motion.ease} ${0.04 + i * 0.04}s both`,
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <span
                style={{
                  display: "block",
                  fontFamily: fontMono,
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: 0.12,
                  textTransform: "uppercase",
                  color: color.lcdMute,
                  marginBottom: 6,
                }}
              >
                {room.minEnergy}–{room.maxEnergy}
              </span>
              <span
                style={{
                  display: "block",
                  fontFamily: fontDisplay,
                  fontSize: 15,
                  fontWeight: 700,
                  letterSpacing: -0.25,
                  color: color.lcdInk,
                  lineHeight: 1.15,
                }}
              >
                {room.label}
              </span>
              <span
                style={{
                  display: "block",
                  marginTop: 6,
                  fontFamily: fontMono,
                  fontSize: 10,
                  fontWeight: 700,
                  color: color.lcdSignal,
                }}
              >
                {room.count} {room.count === 1 ? "cut" : "cuts"}
              </span>
            </button>
          );
        })}
      </div>
      <p
        style={{
          margin: "10px 0 0",
          fontSize: 13,
          color: color.muted,
          lineHeight: 1.4,
        }}
      >
        {zones.map((r) => r.label).join(" → ")}. Tap a zone to drop the needle.
      </p>
    </div>
  );
}
