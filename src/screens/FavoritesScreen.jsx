import { useEffect, useMemo, useState, memo } from "react";
import Icon from "../components/ui/Icon";
import CoverImage from "../components/ui/CoverImage";
import VirtualList from "../components/ui/VirtualList";
import { AlbumArt } from "../components/listen/AlbumArt";
import {
  TrackActionsMenu,
  TrackRow,
  useTrackMenu,
} from "../components/listen/TrackRow";
import { useCurrentTrack } from "../usePlayerTransport";
import { savedTracks } from "../lib/homeCollections";
import { isCommunityPlaylist } from "../lib/mixes";
import {
  BTN_PRIMARY,
  BTN_SECONDARY,
  INPUT_ST,
  artShadow,
  color,
  fontDisplay,
  fontMono,
  glass,
  homeSpace,
  motion,
  radius,
} from "../theme";

// ── Key feature: Build a custom mix — quiet modern plate ──
function CustomMixFeature({ onClick, inset = true }) {
  const gutter = inset ? homeSpace.gutter : 0;

  return (
    <button
      type="button"
      className="custom-mix"
      onClick={onClick}
      aria-label="Build a custom mix — pick length, then vibe"
      style={{
        position: "relative",
        overflow: "hidden",
        display: "block",
        minHeight: 0,
        margin: inset ? `0 ${gutter}px` : 0,
        width: inset ? `calc(100% - ${gutter * 2}px)` : "100%",
        padding: "22px 20px",
        borderRadius: radius.xl,
        border: "1px solid rgba(255,255,255,0.1)",
        background: `
          linear-gradient(145deg, rgba(255,255,255,0.07) 0%, transparent 42%),
          linear-gradient(165deg, rgba(34,38,45,0.72) 0%, rgba(18,20,24,0.88) 100%)
        `,
        boxShadow: `inset 0 1px 0 ${glass.highlight}, ${glass.shadowSoft}`,
        backdropFilter: glass.blurSoft,
        WebkitBackdropFilter: glass.blurSoft,
        cursor: "pointer",
        textAlign: "left",
        color: color.ink,
        animation: "rise 0.55s cubic-bezier(0.22,1,0.36,1) both",
      }}
    >
      <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontSize: 12,
            fontWeight: 550,
            letterSpacing: 0.15,
            fontFamily: fontDisplay,
            color: color.muted,
            marginBottom: 6,
          }}>
            Custom mix
          </div>
          <div style={{
            fontSize: "clamp(20px, 4.2vw, 24px)",
            fontWeight: 650,
            fontFamily: fontDisplay,
            letterSpacing: -0.4,
            lineHeight: 1.12,
            marginBottom: 6,
          }}>
            Build a set
          </div>
          <p style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 500,
            color: color.muted,
            lineHeight: 1.4,
            maxWidth: 340,
          }}>
            Choose a length and vibe — we shape the energy arc with you.
          </p>
          <div style={{
            marginTop: 12,
            fontSize: 12,
            fontWeight: 500,
            color: color.faint,
            letterSpacing: 0.1,
          }}>
            Length · Vibe · Preview
          </div>
        </div>
        <span
          aria-hidden="true"
          style={{
            flexShrink: 0,
            height: 44,
            padding: "0 16px",
            borderRadius: 980,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            border: "1px solid rgba(255,255,255,0.35)",
            background: "rgba(247,248,250,0.96)",
            color: color.onAccent,
            fontSize: 13,
            fontWeight: 650,
            fontFamily: fontDisplay,
            boxShadow: "0 8px 20px rgba(0,0,0,0.28)",
          }}
        >
          Start
          <span style={{ fontSize: 15, lineHeight: 1 }}>→</span>
        </span>
      </div>
    </button>
  );
}




function FavoritesScreen({
  tracks, onPlay, onLike, playlistCtx,
  userPlaylists = [], onCreatePlaylist, onDeletePlaylist, onRenamePlaylist = null,
  onPlayTrack, onSharePlaylist = null, onOpenMix = null,
  communityMix = null,
  openRequestId = null, onConsumeOpenRequest = null,
  onCustomMix = null,
  preferredGenres = [],
  recentTrackIds = [],
  userKey = "",
}) {
  const { menu, close } = useTrackMenu();
  const currentTrack = useCurrentTrack();
  const activeId = currentTrack?.id;
  const saved = savedTracks(tracks, 80);
  const [libTab, setLibTab] = useState("playlists"); // playlists | liked
  const [libQuery, setLibQuery] = useState("");
  const [plSort, setPlSort] = useState("recent"); // recent | name | size
  const [showNewInput, setShowNewInput] = useState(false);
  const [newName, setNewName] = useState("");
  const [openPlaylistId, setOpenPlaylistId] = useState(null);
  const [showAddCuts, setShowAddCuts] = useState(false);
  const [addQuery, setAddQuery] = useState("");

  const trackById = useMemo(() => {
    const m = new Map();
    for (const t of tracks) m.set(t.id, t);
    return m;
  }, [tracks]);

  // Deep-open request (e.g. desktop sidebar stack click)
  useEffect(() => {
    if (!openRequestId) return;
    setLibTab("playlists");
    setOpenPlaylistId(openRequestId);
    onConsumeOpenRequest?.();
  }, [openRequestId, onConsumeOpenRequest]);

  // Reset the add-cuts picker when leaving a stack
  useEffect(() => {
    setShowAddCuts(false);
    setAddQuery("");
  }, [openPlaylistId]);

  const playTrackFn = onPlayTrack || ((t, pool) => onPlay(t));

  function handleCreate() {
    if (!newName.trim() || !onCreatePlaylist) return;
    const created = onCreatePlaylist(newName.trim());
    setNewName("");
    setShowNewInput(false);
    if (created?.id) setOpenPlaylistId(created.id);
  }

  const q = libQuery.trim().toLowerCase();
  const filteredPlaylists = useMemo(() => {
    const base = q
      ? userPlaylists.filter((p) => String(p.name || "").toLowerCase().includes(q))
      : [...userPlaylists];
    if (plSort === "name") {
      return base.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
    }
    if (plSort === "size") {
      return base.sort((a, b) => (b.trackIds?.length || 0) - (a.trackIds?.length || 0));
    }
    // recent — keep creation-ish order (ids embed timestamps as pl_*)
    return base.sort((a, b) => String(b.id || "").localeCompare(String(a.id || "")));
  }, [userPlaylists, q, plSort]);
  const filteredSaved = q
    ? saved.filter((t) =>
        String(t.title || "").toLowerCase().includes(q)
        || String(t.artist || "").toLowerCase().includes(q))
    : saved;

  const openPlaylist = openPlaylistId
    ? userPlaylists.find((p) => p.id === openPlaylistId)
    : null;
  const openPlaylistTracks = openPlaylist
    ? (openPlaylist.trackIds || []).map((id) => trackById.get(id)).filter(Boolean)
    : [];

  if (openPlaylist) {
    const community = isCommunityPlaylist(openPlaylist);
    const inStack = new Set(openPlaylist.trackIds || []);
    const addQ = addQuery.trim().toLowerCase();
    const addCandidates = showAddCuts
      ? tracks
          .filter((t) => !inStack.has(t.id) && (t.duration || 0) <= 900)
          .filter((t) => !addQ
            || String(t.title || "").toLowerCase().includes(addQ)
            || String(t.artist || "").toLowerCase().includes(addQ))
          .slice(0, 20)
      : [];
    return (
      <div style={{ padding: "24px 16px 36px" }}>
        <button type="button" onClick={() => setOpenPlaylistId(null)} style={{
          background: "none", border: "none", color: color.body, fontSize: 17, cursor: "pointer", fontWeight: 500, marginBottom: 16,
        }}>‹ Library</button>

        <div style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 8,
        }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{
              fontSize: 28, fontWeight: 700, color: color.ink, fontFamily: fontDisplay,
              letterSpacing: -0.8, lineHeight: 1.1,
            }}>
              {openPlaylist.name}
            </div>
            <div style={{ fontSize: 14, color: color.muted, marginTop: 8 }}>
              {community && openPlaylist.curatorName
                ? `Curated by ${openPlaylist.curatorName} · ${openPlaylistTracks.length} song${openPlaylistTracks.length === 1 ? "" : "s"}`
                : `${openPlaylistTracks.length} song${openPlaylistTracks.length === 1 ? "" : "s"}`}
            </div>
          </div>
        </div>

        {/* Best single upgrade: play the whole set without hunting a track */}
        <div style={{ display: "flex", gap: 10, margin: "18px 0 20px", flexWrap: "wrap", alignItems: "center" }}>
          <button
            type="button"
            disabled={openPlaylistTracks.length === 0}
            onClick={() => {
              if (!openPlaylistTracks[0]) return;
              playTrackFn(openPlaylistTracks[0], openPlaylistTracks);
            }}
            aria-label={`Play ${openPlaylist.name}`}
            style={{
              ...BTN_PRIMARY,
              width: "auto",
              minWidth: 132,
              borderRadius: radius.md,
              padding: "12px 20px",
              fontSize: 15,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              opacity: openPlaylistTracks.length === 0 ? 0.45 : 1,
              cursor: openPlaylistTracks.length === 0 ? "not-allowed" : "pointer",
            }}
          >
            <Icon name="play" size={14} />
            Play
          </button>
          {openPlaylistTracks.length > 1 && (
            <button
              type="button"
              onClick={() => {
                const shuffled = [...openPlaylistTracks];
                for (let i = shuffled.length - 1; i > 0; i--) {
                  const j = Math.floor(Math.random() * (i + 1));
                  [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
                }
                playTrackFn(shuffled[0], shuffled);
              }}
              aria-label={`Shuffle ${openPlaylist.name}`}
              style={{
                ...BTN_SECONDARY,
                width: "auto",
                borderRadius: radius.md,
                padding: "12px 16px",
                fontSize: 14,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Icon name="shuffle" size={14} />
              Shuffle
            </button>
          )}
          {!community && playlistCtx?.onAdd && (
            <button
              type="button"
              onClick={() => setShowAddCuts((s) => !s)}
              aria-expanded={showAddCuts}
              style={{
                ...BTN_SECONDARY, width: "auto", borderRadius: radius.md, padding: "12px 16px", fontSize: 14,
                ...(showAddCuts ? { background: color.accentSoft, color: color.accent, borderColor: color.accentSoft } : {}),
              }}
            >
              {showAddCuts ? "Done" : "Add songs"}
            </button>
          )}
          {onSharePlaylist && (
            <button
              type="button"
              onClick={() => onSharePlaylist(openPlaylist)}
              style={{ ...BTN_SECONDARY, width: "auto", borderRadius: radius.md, padding: "12px 16px", fontSize: 14 }}
            >
              Share
            </button>
          )}
        </div>
        {!community && (onRenamePlaylist || onDeletePlaylist) && (
          <div style={{ display: "flex", gap: 8, margin: "-8px 0 18px", flexWrap: "wrap" }}>
            {onRenamePlaylist && (
              <button
                type="button"
                onClick={() => {
                  const next = window.prompt("Rename this playlist", openPlaylist.name || "");
                  if (next != null && next.trim() && next.trim() !== openPlaylist.name) {
                    onRenamePlaylist(openPlaylist.id, next.trim());
                  }
                }}
                style={{
                  background: "none", border: "none", padding: "4px 2px",
                  fontSize: 12.5, fontWeight: 600, color: color.muted, cursor: "pointer",
                }}
              >
                Rename
              </button>
            )}
            {onDeletePlaylist && (
              <button
                type="button"
                onClick={() => {
                  if (!window.confirm(`Delete “${openPlaylist.name}”? This can’t be undone.`)) return;
                  onDeletePlaylist(openPlaylist.id);
                  setOpenPlaylistId(null);
                }}
                style={{
                  background: "none", border: "none", padding: "4px 2px",
                  fontSize: 12.5, fontWeight: 600, color: color.alert, cursor: "pointer",
                }}
              >
                Delete
              </button>
            )}
          </div>
        )}
        {showAddCuts && (
          <div style={{ marginBottom: 20, padding: 14, borderRadius: radius.lg, background: color.surfaceRaised, border: `1px solid ${glass.borderSoft}` }}>
            <input
              autoFocus
              value={addQuery}
              onChange={(e) => setAddQuery(e.target.value)}
              placeholder="Search songs to add…"
              aria-label="Search songs to add"
              style={{ ...INPUT_ST, padding: "10px 12px", fontSize: 15, marginBottom: 8 }}
            />
            {addCandidates.length === 0 ? (
              <div style={{ fontSize: 13, color: color.faint, padding: "14px 4px", textAlign: "center" }}>
                {addQ ? "No matches" : "All songs are already in this playlist"}
              </div>
            ) : addCandidates.map((t) => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 2px", borderBottom: `1px solid ${color.line}` }}>
                <div style={{ width: 36, height: 36, borderRadius: 5, overflow: "hidden", flexShrink: 0 }}>
                  <AlbumArt track={t} size={36} borderRadius={0}/>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 550, color: color.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</div>
                  <div style={{ fontSize: 11.5, color: color.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.artist}</div>
                </div>
                <button
                  type="button"
                  onClick={() => playlistCtx.onAdd(t.id, openPlaylist.id)}
                  aria-label={`Add ${t.title} to ${openPlaylist.name}`}
                  style={{
                    background: color.accentSoft, border: "none", borderRadius: 980,
                    width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center",
                    color: color.accent, cursor: "pointer", flexShrink: 0,
                  }}
                >
                  <Icon name="plus" size={16}/>
                </button>
              </div>
            ))}
          </div>
        )}
        {openPlaylistTracks.length === 0 ? (
          <div style={{ fontSize: 15, color: color.faint, paddingTop: 32, textAlign: "center" }}>
            {community ? "This playlist is empty" : "This playlist is empty"}
          </div>
        ) : openPlaylistTracks.length > 40 ? (
          <VirtualList
            items={openPlaylistTracks}
            estimateSize={68}
            maxHeight={typeof window !== "undefined" ? Math.min(window.innerHeight * 0.55, 640) : 480}
            renderItem={(t) => (
              <TrackRow
                track={t}
                onPlay={() => playTrackFn(t, openPlaylistTracks)}
                active={activeId === t.id}
                onLike={onLike}
                playlistCtx={playlistCtx}
                activePlaylistId={openPlaylist.id}
              />
            )}
          />
        ) : openPlaylistTracks.map((t) => (
          <TrackRow
            key={t.id}
            track={t}
            onPlay={() => playTrackFn(t, openPlaylistTracks)}
            active={activeId === t.id}
           
            onLike={onLike}
            playlistCtx={playlistCtx}
            activePlaylistId={openPlaylist.id}
          />
        ))}
        {menu && (
          <TrackActionsMenu track={menu.track} playlistCtx={playlistCtx} activePlaylistId={menu.activePlaylistId} x={menu.x} y={menu.y} onClose={close}/>
        )}
      </div>
    );
  }

  const segmentBtn = (id, label, count) => {
    const active = libTab === id;
    return (
      <button
        key={id}
        type="button"
        onClick={() => { setLibTab(id); setLibQuery(""); }}
        aria-pressed={active}
        style={{
          flex: 1,
          minHeight: 40,
          border: "none",
          borderRadius: radius.lg,
          cursor: "pointer",
          background: active ? glass.fillHeavy : "transparent",
          color: active ? color.ink : color.muted,
          boxShadow: active ? `inset 0 1px 0 ${glass.highlight}, ${glass.shadowSoft}` : "none",
          fontSize: 14,
          fontWeight: active ? 650 : 550,
          fontFamily: fontDisplay,
          letterSpacing: -0.2,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          transition: `background ${motion.fast} ${motion.ease}, color ${motion.fast} ${motion.ease}`,
        }}
      >
        {label}
        {count != null && (
          <span style={{
            fontSize: 11,
            fontWeight: 650,
            fontFamily: fontMono,
            color: active ? color.accent : color.faint,
            fontVariantNumeric: "tabular-nums",
          }}>
            {count}
          </span>
        )}
      </button>
    );
  };

  const renderPlaylistTile = (pl, { create = false } = {}) => {
    if (create) {
      return (
        <button
          key="__new"
          type="button"
          onClick={() => { setLibTab("playlists"); setShowNewInput(true); }}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            textAlign: "left",
            color: color.ink,
            minWidth: 0,
          }}
        >
          <div style={{
            aspectRatio: "1 / 1",
            width: "100%",
            borderRadius: radius.md,
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: color.muted,
            fontSize: 32,
            fontWeight: 200,
            border: `1px solid ${glass.border}`,
            background: `linear-gradient(160deg, rgba(52,58,68,0.92) 0%, rgba(242,244,247,0.72) 100%)`,
            boxShadow: `inset 0 1px 0 ${glass.highlight}`,
          }}>
            +
          </div>
          <div style={{
            fontSize: 15,
            fontWeight: 650,
            letterSpacing: -0.25,
            fontFamily: fontDisplay,
            color: color.body,
          }}>
            New playlist
          </div>
          <div style={{
            fontSize: 12,
            color: color.faint,
            marginTop: 4,
            lineHeight: 1.3,
          }}>
            Build a set
          </div>
        </button>
      );
    }

    const plTracks = (pl.trackIds || []).map((id) => trackById.get(id)).filter(Boolean);
    const covers = plTracks.filter((t) => t.albumCover).slice(0, 4);
    const community = isCommunityPlaylist(pl);
    return (
      <div
        key={pl.id}
        role="button"
        tabIndex={0}
        onClick={() => setOpenPlaylistId(pl.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpenPlaylistId(pl.id);
          }
        }}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          textAlign: "left",
          color: color.ink,
          minWidth: 0,
        }}
      >
        <div style={{
          aspectRatio: "1 / 1",
          width: "100%",
          borderRadius: radius.md,
          overflow: "hidden",
          marginBottom: 12,
          position: "relative",
          display: "grid",
          gridTemplateColumns: covers.length <= 1 ? "1fr" : "1fr 1fr",
          gridTemplateRows: covers.length <= 1 ? "1fr" : "1fr 1fr",
          background: color.surfaceRaised,
          border: `1px solid ${glass.borderSoft}`,
          boxShadow: artShadow.quiet,
        }}>
          {covers.length === 0 ? (
            <div style={{
              gridColumn: "1 / -1", gridRow: "1 / -1",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: color.faint, fontFamily: fontDisplay, fontSize: 28, fontWeight: 700,
            }}>
              {(pl.name || "P")[0]}
            </div>
          ) : covers.length === 1 ? (
            <div style={{ width: "100%", height: "100%", overflow: "hidden" }}>
              <CoverImage
                src={covers[0].albumCover}
                alt=""
                width={homeSpace.tile}
                height={homeSpace.tile}
                sizes={`${homeSpace.tile}px`}
                draggable={false}
              />
            </div>
          ) : (
            <>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} style={{ overflow: "hidden", background: color.surfaceSolid, minHeight: 0 }}>
                  {covers[i]?.albumCover ? (
                    <CoverImage
                      src={covers[i].albumCover}
                      alt=""
                      width={Math.round(homeSpace.tile / 2)}
                      height={Math.round(homeSpace.tile / 2)}
                      sizes={`${Math.round(homeSpace.tile / 2)}px`}
                      draggable={false}
                    />
                  ) : null}
                </div>
              ))}
            </>
          )}
          {plTracks.length > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                playTrackFn(plTracks[0], plTracks);
              }}
              aria-label={`Play ${pl.name}`}
              style={{
                position: "absolute",
                right: 8,
                bottom: 8,
                width: 34,
                height: 34,
                borderRadius: "50%",
                border: "none",
                background: color.ink,
                color: color.onDark,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: glass.shadowSoft,
                cursor: "pointer",
                padding: 0,
              }}
            >
              <Icon name="play" size={12} />
            </button>
          )}
        </div>
        <div style={{
          fontSize: 15,
          fontWeight: 650,
          letterSpacing: -0.3,
          fontFamily: fontDisplay,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {pl.name}
        </div>
        <div style={{
          fontSize: 12,
          color: color.faint,
          marginTop: 4,
          fontFamily: fontMono,
          letterSpacing: 0.2,
          fontVariantNumeric: "tabular-nums",
        }}>
          {community && pl.curatorName
            ? `Community · ${pl.curatorName}`
            : plTracks.length === 0
              ? "Empty — add songs"
              : `${plTracks.length} song${plTracks.length === 1 ? "" : "s"}`}
        </div>
      </div>
    );
  };

  return (
    <div style={{ position: "relative", paddingBottom: 56 }}>
      <div style={{
        position: "relative",
        background: color.canvas,
        padding: `16px 0 8px`,
      }}>
        {/* Library header — art leads; create actions stay compact */}
        <div style={{ padding: `0 ${homeSpace.gutter}px 12px` }}>
          <div style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 12,
          }}>
            <div style={{ minWidth: 0 }}>
              <h1 style={{
                margin: 0,
                fontSize: 28,
                fontWeight: 650,
                letterSpacing: -0.5,
                fontFamily: fontDisplay,
                color: color.ink,
                lineHeight: 1.05,
              }}>
                Library
              </h1>
              <div style={{
                marginTop: 5,
                fontSize: 13,
                color: color.muted,
                fontFamily: fontDisplay,
                letterSpacing: 0.1,
                fontVariantNumeric: "tabular-nums",
              }}>
                {userPlaylists.length} playlist{userPlaylists.length === 1 ? "" : "s"}
                {" · "}
                {saved.length} liked
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => { setLibTab("playlists"); setShowNewInput(true); }}
                style={{
                  ...BTN_PRIMARY,
                  width: "auto",
                  borderRadius: radius.lg,
                  padding: "9px 14px",
                  fontSize: 12.5,
                  fontWeight: 650,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Icon name="plus" size={13} />
                New
              </button>
            </div>
          </div>

          {/* Glass control plate — segments + search */}
          <div style={{
            borderRadius: radius.xl,
            border: `1px solid rgba(255,255,255,0.12)`,
            background: `
              linear-gradient(165deg, rgba(34,38,45,0.72) 0%, rgba(28,32,38,0.42) 100%)
            `,
            boxShadow: `inset 0 1px 0 ${glass.highlight}, ${glass.shadowSoft}`,
            backdropFilter: glass.blurSoft,
            WebkitBackdropFilter: glass.blurSoft,
            padding: 8,
            marginBottom: 10,
          }}>
            <div
              role="tablist"
              aria-label="Library sections"
              style={{
                display: "flex",
                gap: 4,
                padding: 2,
                borderRadius: radius.md,
                background: "rgba(22,24,30,0.06)",
                marginBottom: 8,
              }}
            >
              {segmentBtn("playlists", "Playlists", userPlaylists.length)}
              {segmentBtn("liked", "Liked", saved.length)}
            </div>
            <div style={{ position: "relative" }}>
              <span aria-hidden="true" style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: color.faint,
                display: "flex",
                pointerEvents: "none",
              }}>
                <Icon name="search" size={15} />
              </span>
              <input
                value={libQuery}
                onChange={(e) => setLibQuery(e.target.value)}
                placeholder={libTab === "playlists" ? "Search playlists…" : "Search liked songs…"}
                aria-label={libTab === "playlists" ? "Search playlists" : "Search liked songs"}
                style={{
                  ...INPUT_ST,
                  padding: "10px 14px 10px 36px",
                  fontSize: 15,
                  borderRadius: radius.md,
                  background: "rgba(38,43,51,0.82)",
                  border: `1px solid ${glass.borderSoft}`,
                }}
              />
            </div>
          </div>

          {showNewInput && (
            <div style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              marginBottom: 4,
              animation: `rise 0.35s ${motion.ease} both`,
            }}>
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                  if (e.key === "Escape") { setShowNewInput(false); setNewName(""); }
                }}
                placeholder="Playlist name…"
                aria-label="Playlist name"
                style={{ flex: 1, ...INPUT_ST, padding: "10px 12px", fontSize: 16 }}
              />
              <button
                type="button"
                onClick={handleCreate}
                style={{
                  ...BTN_PRIMARY,
                  width: "auto",
                  borderRadius: radius.md,
                  fontSize: 15,
                  fontWeight: 600,
                  padding: "10px 16px",
                }}
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => { setShowNewInput(false); setNewName(""); }}
                aria-label="Cancel"
                style={{
                  ...BTN_SECONDARY,
                  width: "auto",
                  borderRadius: radius.md,
                  padding: "10px 12px",
                  fontSize: 14,
                }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {onCustomMix && (
          <section
            aria-label="Custom mix"
            style={{
              margin: "4px 0 14px",
              padding: `0 ${homeSpace.gutter}px`,
              animation: `rise 0.5s ${motion.ease} both`,
            }}
          >
            <CustomMixFeature onClick={onCustomMix} inset={false} />
          </section>
        )}

        {libTab === "playlists" ? (
          <div style={{
            padding: `4px ${homeSpace.gutter}px 24px`,
            animation: `rise 0.4s ${motion.ease} both`,
          }}>
            {filteredPlaylists.length > 0 && (
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 14,
              }}>
                <div style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                  color: color.faint,
                  fontFamily: fontMono,
                }}>
                  Your playlists
                </div>
                <div
                  role="group"
                  aria-label="Sort playlists"
                  style={{
                    display: "inline-flex",
                    gap: 2,
                    padding: 3,
                    borderRadius: radius.sm,
                    background: "rgba(22,24,30,0.06)",
                    border: `1px solid ${glass.borderSoft}`,
                  }}
                >
                  {[
                    { id: "recent", label: "Recent" },
                    { id: "name", label: "A–Z" },
                    { id: "size", label: "Size" },
                  ].map((opt) => {
                    const on = plSort === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setPlSort(opt.id)}
                        aria-pressed={on}
                        style={{
                          border: "none",
                          borderRadius: 6,
                          padding: "5px 9px",
                          fontSize: 11,
                          fontWeight: on ? 700 : 550,
                          cursor: "pointer",
                          background: on ? color.surfaceSolid : "transparent",
                          color: on ? color.ink : color.muted,
                          boxShadow: on ? `inset 0 1px 0 ${glass.highlight}, ${glass.shadowSoft}` : "none",
                          fontFamily: fontMono,
                          letterSpacing: 0.2,
                        }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {filteredPlaylists.length === 0 && !q ? (
              <div style={{
                padding: "36px 18px",
                textAlign: "center",
                borderRadius: radius.lg,
                border: `1px solid ${glass.borderSoft}`,
                background: `
                  linear-gradient(165deg, rgba(42,47,55,0.85) 0%, rgba(238,241,245,0.5) 100%)
                `,
                boxShadow: `inset 0 1px 0 ${glass.highlight}`,
                backdropFilter: glass.blurSoft,
                WebkitBackdropFilter: glass.blurSoft,
              }}>
                <div style={{
                  fontSize: 18,
                  fontWeight: 700,
                  fontFamily: fontDisplay,
                  color: color.ink,
                  letterSpacing: -0.4,
                  marginBottom: 8,
                }}>
                  Start your first playlist
                </div>
                <div style={{
                  fontSize: 14,
                  color: color.muted,
                  lineHeight: 1.45,
                  marginBottom: 18,
                  maxWidth: 280,
                  marginLeft: "auto",
                  marginRight: "auto",
                }}>
                  Group tracks into a set — then share it with Planet Club when it’s ready.
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewInput(true)}
                  style={{
                    ...BTN_PRIMARY,
                    width: "auto",
                    minWidth: 160,
                    borderRadius: radius.md,
                    padding: "12px 22px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <Icon name="plus" size={14} />
                  New playlist
                </button>
              </div>
            ) : filteredPlaylists.length === 0 && q ? (
              <div style={{
                padding: "28px 8px",
                textAlign: "center",
                fontSize: 14,
                color: color.muted,
              }}>
                No playlists match “{libQuery.trim()}”
              </div>
            ) : (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                gap: "22px 16px",
              }}>
                {filteredPlaylists.map((pl) => renderPlaylistTile(pl))}
                {!q && renderPlaylistTile(null, { create: true })}
              </div>
            )}

          </div>
        ) : (
          <div style={{ animation: `rise 0.4s ${motion.ease} both` }}>
            {filteredSaved.length > 0 ? (
              <>
                <div style={{
                  padding: `0 ${homeSpace.gutter}px 12px`,
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}>
                  <button
                    type="button"
                    onClick={() => playTrackFn(filteredSaved[0], filteredSaved)}
                    aria-label="Play liked songs"
                    style={{
                      ...BTN_PRIMARY,
                      width: "auto",
                      minWidth: 120,
                      borderRadius: radius.md,
                      padding: "11px 18px",
                      fontSize: 14,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Icon name="play" size={13} />
                    Play all
                  </button>
                  {filteredSaved.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const shuffled = [...filteredSaved];
                        for (let i = shuffled.length - 1; i > 0; i--) {
                          const j = Math.floor(Math.random() * (i + 1));
                          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
                        }
                        playTrackFn(shuffled[0], shuffled);
                      }}
                      aria-label="Shuffle liked songs"
                      style={{
                        ...BTN_SECONDARY,
                        width: "auto",
                        borderRadius: radius.md,
                        padding: "11px 16px",
                        fontSize: 14,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <Icon name="shuffle" size={13} />
                      Shuffle
                    </button>
                  )}
                  <span style={{
                    marginLeft: "auto",
                    fontSize: 12,
                    color: color.faint,
                    fontFamily: fontMono,
                    fontVariantNumeric: "tabular-nums",
                  }}>
                    {filteredSaved.length} song{filteredSaved.length === 1 ? "" : "s"}
                  </span>
                </div>

                {!q && (
                  <CoverFlow
                    tracks={filteredSaved}
                    onPlayTrack={(t) => playTrackFn(t, filteredSaved)}
                    activeId={activeId}
                   
                    size={188}
                    limit={40}
                  />
                )}
                <div style={{ padding: `8px ${Math.max(0, homeSpace.gutter - 8)}px 24px` }}>
                  <div style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 1.2,
                    textTransform: "uppercase",
                    color: color.faint,
                    fontFamily: fontMono,
                    margin: q ? "0 8px 10px" : "10px 8px 10px",
                  }}>
                    {q ? "Matches" : "All liked"}
                  </div>
                  {filteredSaved.length > 40 ? (
                    <VirtualList
                      items={filteredSaved}
                      estimateSize={68}
                      maxHeight={typeof window !== "undefined" ? Math.min(window.innerHeight * 0.55, 640) : 480}
                      renderItem={(t) => (
                        <TrackRow
                          track={t}
                          onPlay={() => playTrackFn(t, filteredSaved)}
                          active={activeId === t.id}
                          onLike={onLike}
                          playlistCtx={playlistCtx}
                        />
                      )}
                    />
                  ) : filteredSaved.map((t) => (
                    <TrackRow
                      key={t.id}
                      track={t}
                      onPlay={() => playTrackFn(t, filteredSaved)}
                      active={activeId === t.id}
                     
                      onLike={onLike}
                      playlistCtx={playlistCtx}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div style={{
                padding: `28px ${homeSpace.gutter}px 40px`,
                textAlign: "center",
              }}>
                <div style={{
                  fontSize: 16,
                  fontWeight: 650,
                  fontFamily: fontDisplay,
                  color: color.ink,
                  marginBottom: 8,
                }}>
                  {q ? `No liked songs match “${libQuery.trim()}”` : "Nothing liked yet"}
                </div>
                <div style={{
                  fontSize: 14,
                  color: color.muted,
                  lineHeight: 1.45,
                }}>
                  {q ? "Try a different search." : "Heart a track anywhere and it lands here."}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {menu && (
        <TrackActionsMenu
          track={menu.track}
          playlistCtx={playlistCtx}
          activePlaylistId={menu.activePlaylistId}
          x={menu.x}
          y={menu.y}
          onClose={close}
        />
      )}
    </div>
  );
}

export default memo(FavoritesScreen);

