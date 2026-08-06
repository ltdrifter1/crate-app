import { useMemo } from "react";
import { font, fontDisplay, fontMono, color, radius, glass, motion, BTN_PRIMARY } from "../../theme";
import { listPaths, findPath } from "../../lib/paths";
import { roomPosterStyle } from "../../lib/rooms";
import RoomPosterBackdrop from "../brand/RoomPosterBackdrop";

/** Listening journeys — paths across rooms and pockets. */
export default function PathsScreen({
  tracks,
  pathId,
  onOpenPath,
  onPlayPath,
  onOpenRoom,
  seedTrack,
  preferredGenres,
}) {
  const paths = useMemo(
    () => listPaths(tracks, { seedTrack }),
    [tracks, seedTrack]
  );
  const active = pathId ? findPath(pathId, tracks, { seedTrack }) : null;

  if (active) {
    return (
      <PathDetail
        path={active}
        onBack={() => onOpenPath(null)}
        onPlayPath={onPlayPath}
        onOpenRoom={onOpenRoom}
      />
    );
  }

  return (
    <div style={{ padding: "28px 0 40px", fontFamily: font }}>
      <div style={{ padding: "0 20px 28px" }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 1.8,
            color: color.accent,
            fontFamily: fontMono,
            textTransform: "uppercase",
            marginBottom: 10,
          }}
        >
          Journeys
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: "clamp(28px, 8vw, 40px)",
            fontWeight: 800,
            letterSpacing: -1.2,
            fontFamily: fontDisplay,
            color: color.ink,
            lineHeight: 1.05,
          }}
        >
          Paths worth walking
        </h1>
        <p style={{ margin: "12px 0 0", fontSize: 14, color: color.muted, lineHeight: 1.5, maxWidth: 340 }}>
          Not playlists — routes through rooms, cities, and pockets. Each stop tells you why you’re there.
        </p>
      </div>

      <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 10 }}>
        {paths.map((path) => (
          <button
            key={path.id}
            type="button"
            onClick={() => onOpenPath(path.id)}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: "18px 16px",
              borderRadius: radius.xl,
              border: `1px solid rgba(255,255,255,0.12)`,
              background: `
                linear-gradient(165deg, rgba(38,43,51,0.8) 0%, rgba(28,32,38,0.48) 100%)
              `,
              boxShadow: `inset 0 1px 0 ${glass.highlight}, ${glass.shadowSoft}`,
              backdropFilter: glass.blurSoft,
              WebkitBackdropFilter: glass.blurSoft,
              cursor: "pointer",
              color: color.ink,
              animation: `rise 0.4s ${motion.ease} both`,
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 1.4,
                color: color.faint,
                fontFamily: fontMono,
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              {path.kind}
              {path.ready === false ? " · needs a seed" : ""}
            </div>
            <div style={{ fontSize: 18, fontWeight: 750, fontFamily: fontDisplay, letterSpacing: -0.4 }}>
              {path.title}
            </div>
            <div style={{ fontSize: 13, color: color.muted, marginTop: 6, lineHeight: 1.45 }}>
              {path.story}
            </div>
            {path.stops?.length > 0 && (
              <div
                style={{
                  marginTop: 12,
                  fontSize: 11,
                  color: color.faint,
                  fontFamily: fontMono,
                  letterSpacing: 0.3,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {path.stops.map((s) => s.label).join(" → ")}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function PathDetail({ path, onBack, onPlayPath, onOpenRoom }) {
  const cover = path.stops?.[0]?.track?.albumCover;
  const atmosphere = path.stops?.[0]?.room?.atmosphere || "night-fog";
  const poster = roomPosterStyle(atmosphere);

  return (
    <div style={{ minHeight: "100%", animation: "fadeIn 0.35s ease both", fontFamily: font }}>
      <RoomPosterBackdrop
        atmosphere={atmosphere}
        coverUrl={cover}
        minHeight={240}
        style={{ padding: "20px 20px 28px" }}
      >
        <button
          type="button"
          onClick={onBack}
          style={{
            alignSelf: "flex-start",
            marginBottom: 18,
            background: "none",
            border: "none",
            color: color.muted,
            fontSize: 13,
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          ← All paths
        </button>
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1.8,
              color: color.accent,
              fontFamily: fontMono,
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Path · {path.kind}
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: poster.titleSize,
              fontWeight: poster.fontWeight,
              letterSpacing: poster.letterSpacing,
              fontFamily: fontDisplay,
              color: color.onDark,
              lineHeight: poster.lineHeight,
            }}
          >
            {path.title}
          </h1>
          <p style={{ margin: "12px 0 0", fontSize: 14, color: color.body, lineHeight: 1.5, maxWidth: 360 }}>
            {path.story}
          </p>
          {path.ready && path.playlist?.length > 0 && (
            <button
              type="button"
              className="play-primary"
              onClick={() => onPlayPath(path)}
              style={{
                ...BTN_PRIMARY,
                width: "auto",
                marginTop: 20,
                padding: "12px 18px",
                borderRadius: radius.lg,
                fontWeight: 650,
                fontSize: 13,
              }}
            >
              Walk this path · {path.playlist.length} stops
            </button>
          )}
        </div>
      </RoomPosterBackdrop>

      <div style={{ padding: "8px 20px 40px" }}>
        <div style={{ fontSize: 13, fontWeight: 650, fontFamily: fontDisplay, color: color.ink, marginBottom: 12 }}>
          Stops
        </div>
        {path.stops?.map((stop, i) => (
          <div
            key={`${stop.type}-${stop.id || stop.track?.id || i}`}
            style={{
              display: "flex",
              gap: 14,
              padding: "14px 14px",
              marginBottom: 6,
              borderRadius: radius.lg,
              background: `
                linear-gradient(165deg, rgba(32,36,43,0.68) 0%, rgba(28,32,38,0.38) 100%)
              `,
              border: `1px solid ${glass.borderSoft}`,
              boxShadow: `inset 0 1px 0 ${glass.highlight}`,
              backdropFilter: glass.blurSoft,
              WebkitBackdropFilter: glass.blurSoft,
            }}
          >
            <div
              style={{
                width: 28,
                fontFamily: fontMono,
                fontSize: 12,
                color: color.accent,
                fontWeight: 700,
                paddingTop: 2,
              }}
            >
              {String(i + 1).padStart(2, "0")}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, fontFamily: fontDisplay, letterSpacing: -0.2 }}>
                {stop.label}
              </div>
              <div style={{ fontSize: 12, color: color.muted, marginTop: 4 }}>{stop.note}</div>
              {stop.track && (
                <div style={{ fontSize: 12, color: color.faint, marginTop: 6, fontFamily: fontMono }}>
                  {stop.track.title} · {stop.track.artist}
                </div>
              )}
              {stop.type === "room" && onOpenRoom && (
                <button
                  type="button"
                  onClick={() => onOpenRoom(stop.id)}
                  style={{
                    marginTop: 10,
                    background: "none",
                    border: "none",
                    padding: 0,
                    color: color.accent,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Enter room →
                </button>
              )}
            </div>
          </div>
        ))}
        {(!path.stops || path.stops.length === 0) && (
          <div style={{ color: color.muted, fontSize: 14, padding: "24px 0" }}>
            Save a track or start listening to seed this lineage path.
          </div>
        )}
      </div>
    </div>
  );
}
