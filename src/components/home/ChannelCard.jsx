import { chrome, color, fontDisplay, fontMono, homeSpace, y2k } from "../../theme";
import CoverImage from "../ui/CoverImage";

/**
 * ChannelCard — future concert/admit ticket for Channel Surfing.
 * Landscape stub + perforation + holographic rim; sleeve strip on the face.
 */
export default function ChannelCard({
  channel,
  covers = [],
  active = false,
  onClick = null,
  size = Math.round(homeSpace.tileTicket),
}) {
  const num = String(channel.num ?? 0).padStart(2, "0");
  const width = size;
  const height = Math.round(size * 0.52);
  const stub = Math.round(height * 0.42);
  const art = covers.find(Boolean) || null;
  const title = channel.shortTitle || channel.title;

  return (
    <button
      type="button"
      aria-label={`Tune ${channel.title} — ${channel.tagline}`}
      aria-pressed={active || undefined}
      onClick={onClick || undefined}
      className="pmp-lift pmp-channel-ticket"
      style={{
        flex: "0 0 auto",
        scrollSnapAlign: "start",
        width,
        height,
        padding: 0,
        margin: 0,
        border: "none",
        background: "transparent",
        cursor: "pointer",
        textAlign: "left",
        WebkitTapHighlightColor: "transparent",
        touchAction: "pan-x",
        position: "relative",
      }}
    >
      <span
        aria-hidden="true"
        className={active ? "pmp-ticket-shell pmp-ticket-shell--live" : "pmp-ticket-shell"}
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          borderRadius: 18,
          overflow: "hidden",
          isolation: "isolate",
          background: active
            ? `
              linear-gradient(135deg, rgba(101,230,255,0.22) 0%, rgba(255,255,255,0.08) 28%, transparent 58%),
              linear-gradient(165deg, #1A222C 0%, #0C1016 55%, #080A0D 100%)
            `
            : `
              linear-gradient(135deg, rgba(255,255,255,0.14) 0%, rgba(123,167,255,0.08) 32%, transparent 60%),
              linear-gradient(165deg, #1C2128 0%, #10141A 52%, #0A0C10 100%)
            `,
          border: active
            ? "1px solid rgba(101,230,255,0.42)"
            : "1px solid rgba(255,255,255,0.14)",
          boxShadow: active
            ? `
              inset 0 1px 0 rgba(255,255,255,0.22),
              0 0 0 1px rgba(101,230,255,0.12),
              0 16px 36px rgba(0,0,0,0.45),
              0 0 28px rgba(101,230,255,0.12)
            `
            : `
              inset 0 1px 0 rgba(255,255,255,0.16),
              0 14px 32px rgba(0,0,0,0.4),
              0 0 0 1px rgba(255,255,255,0.03)
            `,
        }}
      >
        {/* Holographic edge wash */}
        <span
          className="pmp-ticket-holo"
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background: `
              linear-gradient(
                115deg,
                transparent 0%,
                rgba(101,230,255,0.1) 18%,
                rgba(255,255,255,0.14) 32%,
                rgba(123,167,255,0.12) 48%,
                transparent 68%
              )
            `,
            mixBlendMode: "screen",
            opacity: active ? 0.9 : 0.55,
          }}
        />

        {/* Stub */}
        <span
          style={{
            width: stub,
            flexShrink: 0,
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 8px",
            background: active
              ? `
                linear-gradient(180deg, rgba(101,230,255,0.18) 0%, rgba(101,230,255,0.04) 100%),
                linear-gradient(90deg, rgba(255,255,255,0.05) 0%, transparent 100%)
              `
              : `
                linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 100%),
                linear-gradient(90deg, rgba(255,255,255,0.04) 0%, transparent 100%)
              `,
            boxShadow: "inset -1px 0 0 rgba(255,255,255,0.06)",
          }}
        >
          <span
            style={{
              fontFamily: fontMono,
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: 1.8,
              textTransform: "uppercase",
              color: active ? chrome.signal : color.muted,
            }}
          >
            CH
          </span>
          <span
            style={{
              fontFamily: fontDisplay,
              fontSize: Math.round(height * 0.28),
              fontWeight: 750,
              letterSpacing: -1.2,
              lineHeight: 1,
              color: y2k.offWhite,
            }}
          >
            {num}
          </span>
          <span
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              width: "70%",
            }}
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                style={{
                  height: i % 2 === 0 ? 2 : 1,
                  borderRadius: 1,
                  background:
                    i === 2
                      ? active
                        ? "rgba(101,230,255,0.55)"
                        : "rgba(255,255,255,0.35)"
                      : "rgba(255,255,255,0.18)",
                }}
              />
            ))}
          </span>
        </span>

        {/* Perforation — dashed tear + punch holes */}
        <span
          aria-hidden="true"
          style={{
            width: 14,
            flexShrink: 0,
            position: "relative",
            display: "flex",
            alignItems: "stretch",
            justifyContent: "center",
            background: "transparent",
          }}
        >
          <span
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: "50%",
              width: 0,
              borderLeft: "2px dashed rgba(255,255,255,0.28)",
              transform: "translateX(-50%)",
            }}
          />
          {/* Micro punch dots along the tear */}
          {Array.from({ length: 7 }).map((_, i) => (
            <span
              key={i}
              style={{
                position: "absolute",
                left: "50%",
                top: `${12 + i * 12}%`,
                width: 5,
                height: 5,
                marginLeft: -2.5,
                borderRadius: "50%",
                background: "#080A0D",
                boxShadow: "0 0 0 1px rgba(255,255,255,0.14)",
              }}
            />
          ))}
          <span
            style={{
              position: "absolute",
              top: -8,
              left: "50%",
              width: 16,
              height: 16,
              marginLeft: -8,
              borderRadius: "50%",
              background: "#080A0D",
              boxShadow: "0 0 0 1px rgba(255,255,255,0.08)",
            }}
          />
          <span
            style={{
              position: "absolute",
              bottom: -8,
              left: "50%",
              width: 16,
              height: 16,
              marginLeft: -8,
              borderRadius: "50%",
              background: "#080A0D",
              boxShadow: "0 0 0 1px rgba(255,255,255,0.08)",
            }}
          />
        </span>

        {/* Face */}
        <span
          style={{
            flex: 1,
            minWidth: 0,
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "14px 14px 12px",
            overflow: "hidden",
          }}
        >
          {art && (
            <span
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                width: Math.round(height * 0.42),
                height: Math.round(height * 0.42),
                borderRadius: 10,
                overflow: "hidden",
                boxShadow:
                  "0 8px 18px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.12)",
              }}
            >
              <CoverImage
                src={art}
                alt=""
                width={Math.round(height * 0.42)}
                height={Math.round(height * 0.42)}
              />
            </span>
          )}

          <span style={{ position: "relative", zIndex: 1, paddingRight: art ? 56 : 0 }}>
            <span
              style={{
                display: "block",
                fontFamily: fontMono,
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: 1.4,
                textTransform: "uppercase",
                color: active ? chrome.signal : color.faint,
                marginBottom: 6,
              }}
            >
              {active ? "On air" : "Admit one"}
            </span>
            <span
              style={{
                display: "block",
                fontFamily: fontDisplay,
                fontSize: 17,
                fontWeight: 700,
                letterSpacing: -0.35,
                lineHeight: 1.12,
                color: y2k.offWhite,
                maxWidth: "100%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {title}
            </span>
            <span
              style={{
                display: "block",
                marginTop: 4,
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: -0.05,
                color: "rgba(244,246,248,0.58)",
                lineHeight: 1.3,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: art ? "72%" : "100%",
              }}
            >
              {channel.tagline}
            </span>
          </span>

          <span
            style={{
              position: "relative",
              zIndex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              marginTop: 10,
            }}
          >
            <span
              style={{
                fontFamily: fontMono,
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: 1.2,
                textTransform: "uppercase",
                color: color.faint,
              }}
            >
              Planet · {num}
            </span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                height: 28,
                padding: "0 11px",
                borderRadius: 980,
                border: active
                  ? "1px solid rgba(101,230,255,0.4)"
                  : "1px solid rgba(255,255,255,0.16)",
                background: active
                  ? "rgba(101,230,255,0.14)"
                  : "rgba(255,255,255,0.08)",
                color: active ? chrome.signal : y2k.offWhite,
                fontFamily: fontDisplay,
                fontSize: 11,
                fontWeight: 650,
                letterSpacing: 0.2,
              }}
            >
              {active ? "Listening" : "Tune"}
              <span aria-hidden="true" style={{ fontSize: 13, lineHeight: 1 }}>
                ›
              </span>
            </span>
          </span>
        </span>
      </span>
    </button>
  );
}
