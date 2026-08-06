/**
 * RoomsScreen — first-class destination browser for ROOMS.
 * Living spaces — enter choreography, quiet presence, shareable doors.
 */
import { useMemo, useState } from "react";
import {
  font, fontDisplay, fontMono, color, radius, motion, glass, BTN_PRIMARY, BTN_SECONDARY,
} from "../../theme";
import {
  duration as motionDuration,
  ease as motionEase,
  stagger,
} from "../../motion/tokens";
import {
  populateAllRooms,
  tonightRoom,
  roomsByKind,
  roomPosterStyle,
  KIND_LABELS,
  presencePhrase,
} from "../../lib/rooms";
import { explainPick } from "../../lib/explain";
import { enterRoomCue } from "../../lib/club";
import RoomPosterBackdrop from "../brand/RoomPosterBackdrop";

function RoomHero({ room, onEnter, onPlay }) {
  const cover = room.coverTrack?.albumCover;
  const poster = roomPosterStyle(room);

  return (
    <RoomPosterBackdrop
      room={room}
      coverUrl={cover}
      minHeight="min(58vh, 480px)"
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
        padding: "44px 20px 32px",
        cursor: "pointer",
        animation: `stationIn ${motionDuration.enter + 0.15}s ${motionEase.out} both`,
      }}
    >
      <div style={{ maxWidth: 420 }}>
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
          <span style={{ color: color.faint }}> · {presencePhrase(room)}</span>
        </div>
        <div
          style={{
            fontSize: poster.titleSize,
            fontWeight: poster.fontWeight,
            letterSpacing: poster.letterSpacing,
            lineHeight: poster.lineHeight,
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
              On the table
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
              ...BTN_PRIMARY,
              width: "auto",
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "13px 18px 13px 14px",
              borderRadius: radius.lg,
              fontSize: 14,
              fontWeight: 650,
              letterSpacing: -0.2,
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
              ...BTN_SECONDARY,
              width: "auto",
              padding: "13px 16px",
              borderRadius: radius.lg,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Dig · {room.count}
          </button>
        </div>
      </div>
    </RoomPosterBackdrop>
  );
}

function RoomRow({ room, onEnter, isActive }) {
  const poster = roomPosterStyle(room);
  return (
    <button
      type="button"
      onClick={() => onEnter(room)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        padding: "14px 14px",
        marginBottom: 6,
        background: isActive
          ? `
            linear-gradient(165deg, rgba(44,49,58,0.86) 0%, rgba(28,32,38,0.62) 100%)
          `
          : `
            linear-gradient(165deg, rgba(32,36,43,0.68) 0%, rgba(28,32,38,0.38) 100%)
          `,
        border: `1px solid ${isActive ? glass.border : glass.borderSoft}`,
        borderRadius: radius.lg,
        boxShadow: `inset 0 1px 0 ${glass.highlight}${isActive ? `, ${glass.shadowSoft}` : ""}`,
        backdropFilter: glass.blurSoft,
        WebkitBackdropFilter: glass.blurSoft,
        cursor: "pointer",
        textAlign: "left",
        color: color.ink,
        transition: `background ${motion.base}`,
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: 36,
          height: 36,
          marginRight: 12,
          flexShrink: 0,
          borderRadius: radius.sm,
          background: poster.gradient,
          border: `1px solid ${glass.borderSoft}`,
          position: "relative",
          overflow: "hidden",
          boxShadow: `inset 0 1px 0 ${glass.highlight}`,
        }}
      >
        {poster.texture && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: poster.textureOpacity,
              backgroundImage: poster.texture,
              backgroundSize: poster.textureSize || "auto",
              mixBlendMode: poster.textureBlend || "soft-light",
            }}
          />
        )}
      </div>
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

function RoomDetail({
  room,
  onBack,
  onPlay,
  AlbumArt,
  TrackRow,
  currentTrack,
  isPlaying,
  onLike,
  playlistCtx,
  preferredGenres = [],
  onShareRoom,
}) {
  const poster = roomPosterStyle(room);
  const cover = room.coverTrack;
  const activity = presencePhrase(room);
  const why = cover ? explainPick(cover, { room, preferredGenres }) : "";
  const list = room.featured.length ? room.featured : room.tracks;

  return (
    <div
      style={{
        minHeight: "100%",
        animation: `roomEnter ${motionDuration.enter}s ${motionEase.out} both`,
      }}
    >
      <RoomPosterBackdrop
        room={room}
        coverUrl={cover?.albumCover}
        minHeight={260}
        style={{ padding: "20px 20px 28px" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <button
            type="button"
            onClick={onBack}
            style={{
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
          {onShareRoom && (
            <button
              type="button"
              onClick={() => onShareRoom(room)}
              style={{
                background: "none",
                border: `1px solid ${color.lineStrong}`,
                borderRadius: radius.sm,
                color: color.body,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                padding: "8px 12px",
              }}
            >
              Leave door open
            </button>
          )}
        </div>
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
              animation: `rise ${motionDuration.settle}s ${motionEase.out} both`,
            }}
          >
            {KIND_LABELS[room.kind] || "Room"}
            {` · ${activity}`}
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
              animation: `rise ${motionDuration.enter}s ${motionEase.out} 0.06s both`,
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
              animation: `rise ${motionDuration.enter}s ${motionEase.out} 0.1s both`,
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
              animation: `rise ${motionDuration.enter}s ${motionEase.out} 0.14s both`,
            }}
          >
            <span>{room.count} tracks</span>
          </div>
          {why && (
            <div
              style={{
                marginTop: 10,
                fontSize: 12,
                color: color.muted,
                lineHeight: 1.4,
                maxWidth: 320,
                animation: `rise ${motionDuration.enter}s ${motionEase.out} 0.16s both`,
              }}
            >
              {why}
            </div>
          )}
          {cover && (
            <button
              type="button"
              className="play-primary"
              onClick={() => onPlay(cover, room)}
              style={{
                ...BTN_PRIMARY,
                width: "auto",
                marginTop: 20,
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 18px",
                borderRadius: radius.lg,
                fontSize: 13,
                fontWeight: 650,
                animation: `rise ${motionDuration.enter}s ${motionEase.out} 0.18s both`,
              }}
            >
              Play room
            </button>
          )}
        </div>
      </RoomPosterBackdrop>

      <div style={{ padding: "8px 16px 40px" }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 650,
            fontFamily: fontDisplay,
            color: color.ink,
            marginBottom: 12,
            letterSpacing: -0.2,
            animation: `rise ${motionDuration.settle}s ${motionEase.out} 0.2s both`,
          }}
        >
          In this room
        </div>
        {list.map((t, i) =>
          TrackRow ? (
            <div
              key={t.id}
              style={{
                animation: `rise ${motionDuration.enter}s ${motionEase.out} ${0.22 + stagger(i)}s both`,
              }}
            >
              <TrackRow
                track={t}
                onPlay={() => onPlay(t, room)}
                active={currentTrack?.id === t.id}
                isPlaying={isPlaying}
                onLike={onLike}
                playlistCtx={playlistCtx}
              />
            </div>
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
                animation: `rise ${motionDuration.enter}s ${motionEase.out} ${0.22 + stagger(i)}s both`,
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
  preferredGenres = [],
  onOpenPaths,
  onShareRoom,
}) {
  const [internalId, setInternalId] = useState(null);
  const [expandedKinds, setExpandedKinds] = useState({});
  const [exiting, setExiting] = useState(false);
  const controlled = onActiveRoomChange != null;
  const activeId = controlled ? (activeRoomId || null) : internalId;

  const enterRoom = (id) => {
    if (!id) return;
    if (controlled) onActiveRoomChange(id);
    else {
      enterRoomCue();
      setInternalId(id);
    }
  };

  const leaveRoom = () => {
    setExiting(true);
    window.setTimeout(() => {
      if (controlled) onActiveRoomChange(null);
      else setInternalId(null);
      setExiting(false);
    }, motionDuration.settle * 1000);
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
      <div
        style={{
          opacity: exiting ? 0 : 1,
          transform: exiting ? "translateY(8px)" : "none",
          transition: `opacity ${motionDuration.settle}s ${motionEase.out}, transform ${motionDuration.settle}s ${motionEase.out}`,
        }}
      >
        <RoomDetail
          room={active}
          onBack={leaveRoom}
          onPlay={(t, room) => (onPlayRoom ? onPlayRoom(t, room) : onPlay(t))}
          AlbumArt={AlbumArt}
          TrackRow={TrackRow}
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          onLike={onLike}
          playlistCtx={playlistCtx}
          preferredGenres={preferredGenres}
          onShareRoom={onShareRoom}
        />
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 36, fontFamily: font, animation: `fadeIn ${motionDuration.settle}s ${motionEase.out} both` }}>
      <RoomHero
        room={featured}
        onEnter={(room) => enterRoom(room.id)}
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
        <p style={{ margin: "0 0 20px", fontSize: 14, color: color.muted, lineHeight: 1.5, maxWidth: 340 }}>
          Places built around music — enter one and stay awhile.
        </p>

        {onOpenPaths && (
          <button
            type="button"
            onClick={onOpenPaths}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              padding: "16px 0 24px",
              background: "none",
              border: "none",
              borderBottom: `1px solid ${color.lineStrong}`,
              cursor: "pointer",
              textAlign: "left",
              color: color.ink,
              marginBottom: 28,
            }}
          >
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.8, color: color.accent, fontFamily: fontMono, textTransform: "uppercase", marginBottom: 6 }}>
                Journeys
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, fontFamily: fontDisplay, letterSpacing: -0.3 }}>
                Walk a path
              </div>
            </div>
            <span style={{ fontSize: 13, color: color.faint }}>→</span>
          </button>
        )}

        {groups.map((group) => {
          const more = group.moreRooms || [];
          const expanded = !!expandedKinds[group.kind];
          const visible = expanded ? [...group.rooms, ...more] : group.rooms;
          return (
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
                      : group.kind === "scene"
                        ? "Culture rooms first — more scenes when you want them"
                        : "Enter and stay awhile"}
              </div>
              <div>
                {visible.map((room) => (
                  <RoomRow
                    key={room.id}
                    room={room}
                    isActive={featured?.id === room.id}
                    onEnter={(r) => enterRoom(r.id)}
                  />
                ))}
              </div>
              {more.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setExpandedKinds((prev) => ({ ...prev, [group.kind]: !expanded }))
                  }
                  style={{
                    marginTop: 8,
                    background: "none",
                    border: "none",
                    color: color.muted,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    padding: "8px 0",
                  }}
                >
                  {expanded ? "Show fewer" : `More scenes · ${more.length}`}
                </button>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
