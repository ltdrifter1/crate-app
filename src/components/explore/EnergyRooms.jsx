import { color, fontDisplay, fontMono, homeSpace, motion, radio, y2k } from "../../theme";
import CoverImage from "../ui/CoverImage";

function EqBars({ min, max }) {
  const mid = (min + max) / 2;
  const levels = [1, 3, 5, 7, 9, 8, 6].map((v) =>
    Math.max(0.18, 1 - Math.abs(v - mid) / 9)
  );
  return (
    <span
      aria-hidden="true"
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 3,
        height: 28,
      }}
    >
      {levels.map((level, i) => (
        <span
          key={i}
          style={{
            width: 4,
            height: `${Math.round(level * 100)}%`,
            borderRadius: 1,
            background: color.lcdSignal,
            opacity: 0.45 + level * 0.45,
            boxShadow: `0 0 6px ${color.lcdSignalSoft}`,
          }}
        />
      ))}
    </span>
  );
}

/**
 * Energy rooms — club floors / Discman EQ, not mood posters.
 */
export default function EnergyRooms({ rooms = [], onOpen = null }) {
  if (!rooms.length) return null;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: `8px ${homeSpace.gutter}px 0`,
      }}
    >
      {rooms.map((room, i) => {
        const sleeves = (room.covers || []).slice(0, 3);
        return (
          <button
            key={room.id}
            type="button"
            className="pmp-lift pmp-energy-room"
            onClick={() => onOpen?.({ type: "mood", id: room.id })}
            aria-label={`${room.label} — ${room.blurb}`}
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) auto",
              gap: 12,
              alignItems: "center",
              width: "100%",
              padding: "14px 14px 14px 16px",
              border: radio.border,
              borderRadius: radio.radius,
              background: radio.moduleFace,
              boxShadow: radio.moduleShadow,
              cursor: "pointer",
              textAlign: "left",
              animation: `rise 0.45s ${motion.ease} ${0.04 + i * 0.04}s both`,
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <span>
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 6,
                }}
              >
                <span
                  style={{
                    fontFamily: fontMono,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: 0.14,
                    textTransform: "uppercase",
                    color: color.lcdMute,
                  }}
                >
                  {room.minEnergy}–{room.maxEnergy}
                </span>
                <span
                  style={{
                    fontFamily: fontMono,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: 0.08,
                    color: color.muted,
                  }}
                >
                  {room.count} {room.count === 1 ? "cut" : "cuts"}
                </span>
              </span>
              <span
                style={{
                  display: "block",
                  fontFamily: fontDisplay,
                  fontSize: 20,
                  fontWeight: 700,
                  letterSpacing: -0.4,
                  color: y2k.offWhite,
                  lineHeight: 1.1,
                }}
              >
                {room.label}
              </span>
              <span
                style={{
                  display: "block",
                  marginTop: 4,
                  fontSize: 13,
                  color: color.muted,
                  lineHeight: 1.35,
                }}
              >
                {room.blurb}
              </span>
              {sleeves.length > 0 && (
                <span
                  style={{
                    display: "flex",
                    gap: 6,
                    marginTop: 10,
                  }}
                >
                  {sleeves.map((src) => (
                    <span
                      key={src}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 4,
                        overflow: "hidden",
                        flexShrink: 0,
                        border: "1px solid rgba(61,70,84,0.18)",
                      }}
                    >
                      <CoverImage
                        src={src}
                        alt=""
                        width={36}
                        height={36}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </span>
                  ))}
                </span>
              )}
            </span>
            <span
              style={{
                width: 72,
                height: 72,
                borderRadius: radio.radiusLcd,
                background: radio.lcdFace,
                border: radio.lcdBorder,
                boxShadow: radio.lcdShadow,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <EqBars min={room.minEnergy} max={room.maxEnergy} />
            </span>
          </button>
        );
      })}
    </div>
  );
}
