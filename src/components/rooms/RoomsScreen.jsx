/**
 * RoomsScreen — first-class destination browser for ROOMS.
 * Living spaces (mood, scene, city, season, floor) — not playlist shelves.
 */
import { useMemo, useState } from "react";
import {
  font, fontDisplay, fontMono, color, radius, motion,
} from "../../theme";
import {
  populateAllRooms,
  tonightRoom,
  roomsByKind,
  atmosphereGradient,
  KIND_LABELS,
} from "../../lib/rooms";

function RoomHero({ room, onEnter, onPlay }) {
  const cover = room.coverTrack?.albumCover;
  const bg = atmosphereGradient(room.atmosphere || room.id);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onEnter(room)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onEnter(room);
        }
      }}
      style={{
        position: "relative",
        overflow: "hidden",
        minHeight: "min(58vh, 480px)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        padding: "44px 20px 32px",
        cursor: "pointer",
        animation: "stationIn 0.7s cubic-bezier(0.22,1,0.36,1) both",
      }}
    >
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: bg }} />
      {cover && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${cover})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(36px) saturate(115%) brightness(0.42)",
            transform: "scale(1.15)",
            opacity: 0.85,
            animation: "fadeIn 1s ease both",
          }}
        />
      )}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(12,11,10,0.25) 0%, rgba(12,11,10,0.55) 42%, rgba(12,11,10,0.96) 100%)",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "-12%",
          right: "-6%",
          width: 320,
          height: 320,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${color.accentSoft} 0%, transparent 68%)`,
          pointerEvents: "none",
          animation: "breathe 7s ease-in-out infinite",
        }}
      />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 420 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 2,
            color: color.accent,
            fontFamily: fontMono,
            textTransform: "uppercase",
            marginBottom: 12,
          }}
        >
          {room.floor ? room.floor.label : KIND_LABELS[room.kind] || "Room"}
          {room.presence > 0 && (
            <span style={{ color: color.faint }}> · {room.presence} here</span>
          )}
        </div>
        <div
          style={{
            fontSize: "clamp(44px, 13vw, 64px)",
            fontWeight: 800,
            letterSpacing: -1.8,
            lineHeight: 0.94,
            color: color.onDark,
            fontFamily: fontDisplay,
            marginBottom: 14,
          }}
        >
          {room.label}
        </div>
        <div
          style={{
            fontSize: 15,
            color: color.body,
            lineHeight: 1.5,
            maxWidth: 300,
            marginBottom: 22,
          }}
        >
          {room.story || room.desc}
        </div>
        {room.coverTrack && (
          <div style={{ marginBottom: 20 }}>
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
              Featured
            </div>
            <div
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: color.onDark,
                fontFamily: fontDisplay,
                letterSpacing: -0.3,
              }}
            >
              {room.coverTrack.title}
            </div>
            <div style={{ fontSize: 13, color: color.muted, marginTop: 4 }}>
              {room.coverTrack.artist}
            </div>
          </div>
        )}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            className="play-primary"
            onClick={(e) => {
              e.stopPropagation();
              if (room.coverTrack) onPlay(room.coverTrack, room);
              else onEnter(room);
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "13px 18px 13px 14px",
              borderRadius: radius.sm,
              background: color.accent,
              border: "none",
              color: color.onAccent,
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 650,
              letterSpacing: -0.2,
              boxShadow: `0 12px 32px ${color.accentGlow || "rgba(168,146,106,0.28)"}`,
            }}
          >
            Enter room
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEnter(room);
            }}
            style={{
              padding: "13px 16px",
              borderRadius: radius.sm,
              background: "none",
              border: `1px solid ${color.lineStrong}`,
              color: color.body,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Explore · {room.count}
          </button>
        </div>
      </div>
    </div>
  );
}

function RoomRow({ room, onEnter, isActive }) {
  return (
    <button
      type="button"
      onClick={() => onEnter(room)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        padding: "16px 4px",
        background: "none",
        border: "none",
        borderBottom: `1px solid ${color.line}`,
        cursor: "pointer",
        textAlign: "left",
        color: color.ink,
        transition: `background ${motion.base}`,
      }}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              fontFamily: fontDisplay,
              letterSpacing: -0.3,
              color: isActive ? color.accent : color.ink,
            }}
          >
            {room.label}
          </div>
          {isActive && (
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: 1.2,
                color: color.accent,
                fontFamily: fontMono,
              }}
            >
              OPEN
            </span>
          )}
        </div>
        <div style={{ fontSize: 12, color: color.muted, marginTop: 3 }}>
          {room.desc || room.story}
        </div>
      </div>
      <div
        style={{
          fontSize: 12,
          color: color.faint,
          fontVariantNumeric: "tabular-nums",
          fontFamily: fontMono,
          flexShrink: 0,
          marginLeft: 12,
        }}
      >
        {room.count}
      </div>
    </button>
  );
}

function RoomDetail({ room, onBack, onPlay, AlbumArt, TrackRow, currentTrack, isPlaying, onLike, playlistCtx }) {
  const bg = atmosphereGradient(room.atmosphere || room.id);
  const cover = room.coverTrack;

  return (
    <div style={{ minHeight: "100%", animation: "fadeIn 0.35s ease both" }}>
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          minHeight: 220,
          padding: "20px 20px 28px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
        }}
      >
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: bg }} />
        {cover?.albumCover && (
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `url(${cover.albumCover})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "blur(28px) brightness(0.45)",
              transform: "scale(1.1)",
              opacity: 0.8,
            }}
          />
        )}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(12,11,10,0.3) 0%, rgba(12,11,10,0.92) 100%)",
          }}
        />
        <button
          type="button"
          onClick={onBack}
          style={{
            position: "relative",
            zIndex: 1,
            alignSelf: "flex-start",
            marginBottom: 20,
            background: "none",
            border: "none",
            color: color.muted,
            fontSize: 13,
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          ← All rooms
        </button>
        <div style={{ position: "relative", zIndex: 1 }}>
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
            {KIND_LABELS[room.kind] || "Room"}
            {room.presence > 0 ? ` · ${room.presence} listening` : ""}
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(32px, 9vw, 44px)",
              fontWeight: 800,
              letterSpacing: -1.4,
              fontFamily: fontDisplay,
              color: color.onDark,
              lineHeight: 1,
            }}
          >
            {room.label}
          </h1>
          <p
            style={{
              margin: "12px 0 0",
              fontSize: 14,
              color: color.body,
              lineHeight: 1.5,
              maxWidth: 360,
            }}
          >
            {room.story || room.desc}
          </p>
          <div
            style={{
              marginTop: 18,
              display: "flex",
              gap: 16,
              alignItems: "center",
              fontFamily: fontMono,
              fontSize: 11,
              color: color.faint,
              letterSpacing: 0.4,
            }}
          >
            <span>{room.count} tracks</span>
            <span>·</span>
            <span>E{room.avgEnergy}</span>
            <span>·</span>
            <span>{room.lastActivity}</span>
          </div>
          {cover && (
            <button
              type="button"
              className="play-primary"
              onClick={() => onPlay(cover, room)}
              style={{
                marginTop: 20,
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 18px",
                borderRadius: radius.sm,
                background: color.accent,
                border: "none",
                color: color.onAccent,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 650,
              }}
            >
              Play room
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: "8px 16px 40px" }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 650,
            fontFamily: fontDisplay,
            color: color.ink,
            marginBottom: 12,
            letterSpacing: -0.2,
          }}
        >
          In this room
        </div>
        {(room.featured.length ? room.featured : room.tracks).map((t) =>
          TrackRow ? (
            <TrackRow
              key={t.id}
              track={t}
              onPlay={() => onPlay(t, room)}
              active={currentTrack?.id === t.id}
              isPlaying={isPlaying}
              onLike={onLike}
              playlistCtx={playlistCtx}
            />
          ) : (
            <button
              key={t.id}
              type="button"
              onClick={() => onPlay(t, room)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                width: "100%",
                padding: "10px 0",
                background: "none",
                border: "none",
                borderBottom: `1px solid ${color.line}`,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              {AlbumArt && (
                <div style={{ width: 48, height: 48, overflow: "hidden", flexShrink: 0 }}>
                  <AlbumArt track={t} size={48} borderRadius={0} />
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: currentTrack?.id === t.id ? color.accent : color.ink,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {t.title}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: color.muted,
                    marginTop: 2,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {t.artist}
                </div>
              </div>
            </button>
          )
        )}
      </div>
    </div>
  );
}

export default function RoomsScreen({
  tracks,
  onPlay,
  onPlayRoom,
  currentTrack,
  isPlaying,
  onLike,
  playlistCtx,
  AlbumArt,
  TrackRow,
  activeRoomId,
  onActiveRoomChange,
}) {
  const [internalId, setInternalId] = useState(null);
  const controlled = onActiveRoomChange != null;
  const activeId = controlled ? (activeRoomId || null) : internalId;
  const setActiveId = (id) => {
    if (controlled) onActiveRoomChange(id);
    else setInternalId(id);
  };

  const populated = useMemo(() => populateAllRooms(tracks), [tracks]);
  const featured = useMemo(() => tonightRoom(tracks), [tracks]);
  const groups = useMemo(() => roomsByKind(populated), [populated]);
  const active = activeId
    ? populated.find((r) => r.id === activeId) ||
      (featured?.id === activeId ? featured : null)
    : null;

  if (active && activeId) {
    return (
      <RoomDetail
        room={active}
        onBack={() => setActiveId(null)}
        onPlay={(t, room) => (onPlayRoom ? onPlayRoom(t, room) : onPlay(t))}
        AlbumArt={AlbumArt}
        TrackRow={TrackRow}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onLike={onLike}
        playlistCtx={playlistCtx}
      />
    );
  }

  return (
    <div style={{ paddingBottom: 36, fontFamily: font }}>
      <RoomHero
        room={featured}
        onEnter={(room) => setActiveId(room.id)}
        onPlay={(t, room) => (onPlayRoom ? onPlayRoom(t, room) : onPlay(t))}
      />

      <div style={{ padding: "28px 20px 0" }}>
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
          Destinations
        </div>
        <h2
          style={{
            margin: "0 0 8px",
            fontSize: 22,
            fontWeight: 750,
            letterSpacing: -0.6,
            fontFamily: fontDisplay,
            color: color.ink,
          }}
        >
          Rooms worth inhabiting
        </h2>
        <p style={{ margin: "0 0 28px", fontSize: 14, color: color.muted, lineHeight: 1.5, maxWidth: 340 }}>
          Places built around music — cities, moods, scenes, and nights. Not playlists.
        </p>

        {groups.map((group) => (
          <section key={group.kind} style={{ marginBottom: 36 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 650,
                fontFamily: fontDisplay,
                color: color.ink,
                marginBottom: 4,
                letterSpacing: -0.2,
              }}
            >
              {group.label}
            </div>
            <div style={{ fontSize: 12, color: color.faint, marginBottom: 8 }}>
              {group.kind === "time"
                ? "The floor shifts with the hour"
                : group.kind === "city"
                  ? "Listen as if you were there"
                  : group.kind === "mood"
                    ? "Weather for the inner ear"
                    : "Enter and stay awhile"}
            </div>
            <div>
              {group.rooms.map((room) => (
                <RoomRow
                  key={room.id}
                  room={room}
                  isActive={featured?.id === room.id}
                  onEnter={(r) => setActiveId(r.id)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
