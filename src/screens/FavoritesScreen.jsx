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
import { savedTracks, tracksFromRecentIds } from "../lib/homeCollections";
import { isCommunityPlaylist } from "../lib/mixes";
import { catalogSleeveUrl } from "../lib/catalogSleeve";
import { collectionStats } from "../lib/collectionStats";
import {
  BTN_PRIMARY,
  BTN_SECONDARY,
  INPUT_ST,
  artShadow,
  chromeIconButton,
  color,
  fontDisplay,
  fontMono,
  glass,
  hardware,
  homeSpace,
  motion,
  neons,
  radio as radioStyle,
  radius,
  type,
} from "../theme";

/** Y2K stat tile — shows one crate metric with a neon accent. */
function CrateStat({ value, label, accent = neons.cyan }) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        padding: "10px 12px",
        borderRadius: 8,
        background: radioStyle.lcdFace,
        border: `1px solid ${accent}44`,
        boxShadow: `0 0 12px ${accent}18, inset 0 1px 0 rgba(216,223,232,0.08)`,
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontFamily: fontMono,
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: -0.5,
          color: neons.phosphor,
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          marginTop: 3,
          fontFamily: fontMono,
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: 0.18,
          textTransform: "uppercase",
          color: "#5AA8B8",
        }}
      >
        {label}
      </div>
    </div>
  );
}

/** Record-shop style crate header — shown at top of Library tab. */
function CrateHero({ saved = [], playlists = [], likedCount = 0 }) {
  const stats = useMemo(() => collectionStats(saved), [saved]);
  const playlistCount = playlists.filter((pl) => !isCommunityPlaylist(pl)).length;

  if (saved.length === 0 && playlistCount === 0) return null;

  return (
    <div
      style={{
        margin: `0 ${homeSpace.gutter}px 18px`,
        padding: "16px 14px 14px",
        borderRadius: 12,
        background: radioStyle.moduleFace,
        border: "1px solid rgba(91,101,116,0.18)",
        boxShadow: "inset 0 1px 0 rgba(216,223,232,0.42), 0 8px 24px rgba(58,66,80,0.14)",
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: neons.cyan,
            boxShadow: `0 0 6px ${neons.cyan}`,
            flexShrink: 0,
            animation: "pmpLcdPip 2s ease-in-out infinite",
          }}
        />
        <span
          style={{
            fontFamily: fontMono,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 0.18,
            textTransform: "uppercase",
            color: "#5AA8B8",
          }}
        >
          Your Crate
        </span>
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 6 }}>
        {stats.albums > 0 && (
          <CrateStat value={stats.albums} label="Albums" accent={neons.cyan} />
        )}
        {stats.eps > 0 && (
          <CrateStat value={stats.eps} label="EPs" accent={neons.violet} />
        )}
        {stats.singles > 0 && (
          <CrateStat value={stats.singles} label="Singles" accent={neons.lime} />
        )}
        {playlistCount > 0 && (
          <CrateStat value={playlistCount} label="Playlists" accent={neons.orange} />
        )}
        {likedCount > 0 && (
          <CrateStat value={likedCount} label="Liked" accent={neons.phosphor} />
        )}
      </div>
    </div>
  );
}

function CoverMosaic({ covers = [], title = "", size = homeSpace.tile }) {
  const tiles = covers.filter((c) => catalogSleeveUrl(c?.albumCover)).slice(0, 4);
  const half = Math.round(size / 2);
  const initial = (title || "P").trim().charAt(0).toUpperCase() || "P";

  if (tiles.length === 0) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(160deg, #8B95A4 0%, #5B6574 100%)",
          color: color.muted,
          fontFamily: fontDisplay,
          fontSize: Math.round(size * 0.34),
          fontWeight: 650,
          letterSpacing: -1,
        }}
      >
        {initial}
      </div>
    );
  }

  if (tiles.length === 1) {
    return (
      <CoverImage
        src={tiles[0].albumCover}
        alt=""
        width={size}
        height={size}
        sizes={`${size}px`}
        draggable={false}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    );
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gridTemplateRows: "1fr 1fr",
      }}
    >
      {[0, 1, 2, 3].map((i) => (
        <div key={i} style={{ overflow: "hidden", background: color.surfaceSolid, minHeight: 0 }}>
          {tiles[i]?.albumCover ? (
            <CoverImage
              src={tiles[i].albumCover}
              alt=""
              width={half}
              height={half}
              sizes={`${half}px`}
              draggable={false}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}

function FavoritesScreen({
  tracks, onPlay, onLike, playlistCtx,
  userPlaylists = [], onCreatePlaylist, onDeletePlaylist, onRenamePlaylist = null,
  onPlayTrack, onSharePlaylist = null, onOpenMix = null,
  openRequestId = null, onConsumeOpenRequest = null,
  /** URL-driven stack id (`/stack/:id`) — source of truth when set. */
  stackId = null,
  onOpenStack = null,
  onCloseStack = null,
  onReorderPlaylist = null,
  onOpenMenu = null,
  recentTrackIds = [],
}) {
  const { menu, close } = useTrackMenu();
  const currentTrack = useCurrentTrack();
  const activeId = currentTrack?.id;
  const saved = savedTracks(tracks, 80);
  /** The rendered list is capped; the stat must count the whole crate. */
  const likedCount = tracks.filter((t) => t.liked && (t.duration || 0) <= 900).length;
  const [libTab, setLibTab] = useState("playlists"); // playlists | liked | recents
  const [libQuery, setLibQuery] = useState("");
  const [plSort, setPlSort] = useState("recent"); // recent | name | size
  const [showNewInput, setShowNewInput] = useState(false);
  const [newName, setNewName] = useState("");
  const [openPlaylistId, setOpenPlaylistId] = useState(null);
  const [showAddCuts, setShowAddCuts] = useState(false);
  const [addQuery, setAddQuery] = useState("");
  const [openAddOnArrive, setOpenAddOnArrive] = useState(false);

  const trackById = useMemo(() => {
    const m = new Map();
    for (const t of tracks) m.set(t.id, t);
    return m;
  }, [tracks]);

  const openStack = (id, { addCuts = false } = {}) => {
    if (!id) return;
    if (addCuts) setOpenAddOnArrive(true);
    if (onOpenStack) onOpenStack(id);
    else setOpenPlaylistId(id);
  };

  const closeStack = () => {
    setShowAddCuts(false);
    setOpenAddOnArrive(false);
    if (onCloseStack) onCloseStack();
    else setOpenPlaylistId(null);
  };

  // URL stack deep link
  useEffect(() => {
    if (stackId) {
      setLibTab("playlists");
      setOpenPlaylistId(stackId);
      return;
    }
    // Leaving /stack/:id → Library list
    if (openPlaylistId && onCloseStack) {
      setOpenPlaylistId(null);
    }
  }, [stackId]); // eslint-disable-line react-hooks/exhaustive-deps -- sync from URL only

  // Legacy deep-open request (e.g. older sidebar path)
  useEffect(() => {
    if (!openRequestId) return;
    openStack(openRequestId);
    onConsumeOpenRequest?.();
  }, [openRequestId, onConsumeOpenRequest]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset / open the add-cuts picker when entering a stack
  useEffect(() => {
    setAddQuery("");
    if (openPlaylistId && openAddOnArrive) {
      setShowAddCuts(true);
      setOpenAddOnArrive(false);
    } else {
      setShowAddCuts(false);
    }
  }, [openPlaylistId]); // eslint-disable-line react-hooks/exhaustive-deps

  const playTrackFn = onPlayTrack || ((t, pool) => onPlay(t));

  function handleCreate() {
    if (!newName.trim() || !onCreatePlaylist) return;
    const created = onCreatePlaylist(newName.trim());
    setNewName("");
    setShowNewInput(false);
    if (created?.id) openStack(created.id, { addCuts: true });
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
  const recentTracks = useMemo(
    () => tracksFromRecentIds(tracks, recentTrackIds, 80),
    [tracks, recentTrackIds]
  );
  const filteredRecents = q
    ? recentTracks.filter((t) =>
        String(t.title || "").toLowerCase().includes(q)
        || String(t.artist || "").toLowerCase().includes(q))
    : recentTracks;

  const resolvedOpenId = stackId || openPlaylistId;
  const openPlaylist = resolvedOpenId
    ? userPlaylists.find((p) => p.id === resolvedOpenId)
    : null;
  const openPlaylistTracks = openPlaylist
    ? (openPlaylist.trackIds || []).map((id) => trackById.get(id)).filter(Boolean)
    : [];

  // Missing stack id from URL → fall back to Library list chrome
  if (resolvedOpenId && !openPlaylist) {
    return (
      <div style={{ padding: "24px 16px 36px" }}>
        <button type="button" onClick={closeStack} style={{
          background: "none", border: "none", color: color.body, fontSize: 17, cursor: "pointer", fontWeight: 500, marginBottom: 16,
        }}>‹ Library</button>
        <div style={{ fontSize: 16, color: color.muted, lineHeight: 1.45 }}>
          That stack isn’t in your library (or was deleted).
        </div>
      </div>
    );
  }

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
        <button type="button" onClick={closeStack} style={{
          background: "none", border: "none", color: color.body, fontSize: 16, cursor: "pointer", fontWeight: 550, marginBottom: 20, fontFamily: fontDisplay, letterSpacing: -0.2,
        }}>‹ Library</button>

        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
          marginBottom: 8,
        }}>
          <div style={{
            width: 112,
            height: 112,
            borderRadius: 10,
            overflow: "hidden",
            flexShrink: 0,
            boxShadow: artShadow.raised,
            background: color.surfaceRaised,
          }}>
            <CoverMosaic
              covers={openPlaylistTracks}
              title={openPlaylist.name}
              size={112}
            />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{
              fontSize: 13,
              fontWeight: 600,
              color: color.muted,
              marginBottom: 4,
              fontFamily: fontDisplay,
            }}>
              Playlist
            </div>
            <div style={{
              fontSize: 26, fontWeight: 700, color: color.ink, fontFamily: fontDisplay,
              letterSpacing: -0.7, lineHeight: 1.1,
            }}>
              {openPlaylist.name}
            </div>
            <div style={{ fontSize: 14, color: color.muted, marginTop: 8, fontFamily: fontDisplay }}>
              {community && openPlaylist.curatorName
                ? `${openPlaylist.curatorName} · ${openPlaylistTracks.length} song${openPlaylistTracks.length === 1 ? "" : "s"}`
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
                  closeStack();
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
                    background: color.accentSoft,
                    border: "none",
                    borderRadius: 8,
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
            {community
              ? "This playlist is empty"
              : "No songs yet. Add a few to get started."}
          </div>
        ) : openPlaylistTracks.map((t, index) => (
          <div key={t.id} style={{ display: "flex", alignItems: "stretch", gap: 4 }}>
            {!community && onReorderPlaylist && openPlaylistTracks.length > 1 && (
              <div style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: 2,
                paddingLeft: 2,
              }}>
                <button
                  type="button"
                  aria-label={`Move ${t.title} up`}
                  disabled={index === 0}
                  onClick={() => onReorderPlaylist(openPlaylist.id, t.id, -1)}
                  style={{
                    background: "none",
                    border: "none",
                    color: index === 0 ? color.faint : color.muted,
                    cursor: index === 0 ? "default" : "pointer",
                    padding: "2px 4px",
                    fontSize: 11,
                    lineHeight: 1,
                    fontFamily: fontMono,
                  }}
                >
                  ▲
                </button>
                <button
                  type="button"
                  aria-label={`Move ${t.title} down`}
                  disabled={index >= openPlaylistTracks.length - 1}
                  onClick={() => onReorderPlaylist(openPlaylist.id, t.id, 1)}
                  style={{
                    background: "none",
                    border: "none",
                    color: index >= openPlaylistTracks.length - 1 ? color.faint : color.muted,
                    cursor: index >= openPlaylistTracks.length - 1 ? "default" : "pointer",
                    padding: "2px 4px",
                    fontSize: 11,
                    lineHeight: 1,
                    fontFamily: fontMono,
                  }}
                >
                  ▼
                </button>
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <TrackRow
                track={t}
                onPlay={() => playTrackFn(t, openPlaylistTracks)}
                active={activeId === t.id}
                onLike={onLike}
                playlistCtx={playlistCtx}
                activePlaylistId={openPlaylist.id}
              />
            </div>
          </div>
        ))}
        {menu && (
          <TrackActionsMenu track={menu.track} playlistCtx={playlistCtx} activePlaylistId={menu.activePlaylistId} x={menu.x} y={menu.y} onClose={close}/>
        )}
      </div>
    );
  }

  const segmentBtn = (id, label) => {
    const active = libTab === id;
    return (
      <button
        key={id}
        type="button"
        role="tab"
        onClick={() => { setLibTab(id); setLibQuery(""); }}
        aria-selected={active}
        style={{
          border: "none",
          background: "none",
          cursor: "pointer",
          padding: "8px 2px 10px",
          marginRight: 22,
          color: active ? color.ink : color.muted,
          fontSize: 16,
          fontWeight: active ? 650 : 520,
          fontFamily: fontDisplay,
          letterSpacing: -0.25,
          boxShadow: active ? `inset 0 -2px 0 ${color.ink}` : "none",
        }}
      >
        {label}
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
            borderRadius: 10,
            marginBottom: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: color.muted,
            fontSize: 36,
            fontWeight: 200,
            background: "rgba(216,223,232,0.05)",
            border: "1px dashed rgba(216,223,232,0.16)",
          }}>
            +
          </div>
          <div style={{
            fontSize: 15,
            fontWeight: 650,
            letterSpacing: -0.28,
            fontFamily: fontDisplay,
            color: color.body,
          }}>
            New playlist
          </div>
          <div style={{
            fontSize: 13,
            color: color.faint,
            marginTop: 3,
            fontFamily: fontDisplay,
          }}>
            Add songs
          </div>
        </button>
      );
    }

    const plTracks = (pl.trackIds || []).map((id) => trackById.get(id)).filter(Boolean);
    const community = isCommunityPlaylist(pl);
    return (
      <div
        key={pl.id}
        role="button"
        tabIndex={0}
        onClick={() => {
          if (community && onOpenMix) onOpenMix();
          else openStack(pl.id);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (community && onOpenMix) onOpenMix();
            else openStack(pl.id);
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
          borderRadius: 10,
          overflow: "hidden",
          marginBottom: 10,
          position: "relative",
          background: color.surfaceRaised,
          boxShadow: artShadow.quiet,
        }}>
          <CoverMosaic covers={plTracks} title={pl.name} size={homeSpace.tile} />
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
                background: "rgba(247,248,250,0.96)",
                color: color.onAccent,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 18px rgba(58,66,80,0.35)",
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
          letterSpacing: -0.28,
          fontFamily: fontDisplay,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {pl.name}
        </div>
        <div style={{
          fontSize: 13,
          color: color.muted,
          marginTop: 3,
          fontFamily: fontDisplay,
        }}>
          {community && pl.curatorName
            ? pl.curatorName
            : plTracks.length === 0
              ? "Empty"
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
        maxWidth: 960,
        margin: "0 auto",
      }}>
        <div style={{ padding: `0 ${homeSpace.gutter}px 8px` }}>
          <div style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 18,
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, minWidth: 0 }}>
              {onOpenMenu && (
                <button
                  type="button"
                  aria-label="More"
                  onClick={onOpenMenu}
                  className="pmp-press"
                  style={{ ...chromeIconButton(44), marginTop: 4 }}
                >
                  <Icon name="menu" size={16} />
                </button>
              )}
              <div style={{ minWidth: 0 }}>
                <h1 style={{ ...type.largeTitle, margin: 0 }}>
                  Library
                </h1>
                <div style={{
                  marginTop: 4,
                  ...type.subhead,
                  color: color.muted,
                }}>
                  Playlists, likes, and recents
                  {saved.length ? ` · ${saved.length} liked` : ""}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { setLibTab("playlists"); setShowNewInput(true); }}
              aria-label="New playlist"
              style={{
                ...chromeIconButton(36),
                marginTop: 4,
              }}
            >
              <Icon name="plus" size={16} />
            </button>
          </div>

          <CrateHero saved={saved} playlists={userPlaylists} likedCount={likedCount} />

          <div
            role="tablist"
            aria-label="Library sections"
            style={{
              display: "flex",
              borderBottom: `1px solid ${color.line}`,
              marginBottom: 14,
            }}
          >
            {segmentBtn("playlists", "Playlists")}
            {segmentBtn("liked", "Liked")}
            {segmentBtn("recents", "Recents")}
          </div>

          <div style={{ position: "relative", marginBottom: 8 }}>
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
              placeholder={
                libTab === "playlists"
                  ? "Search playlists"
                  : libTab === "recents"
                    ? "Search recents"
                    : "Search liked songs"
              }
              aria-label={
                libTab === "playlists"
                  ? "Search playlists"
                  : libTab === "recents"
                    ? "Search recents"
                    : "Search liked songs"
              }
              style={{
                ...INPUT_ST,
                padding: "11px 14px 11px 36px",
                fontSize: 16,
                borderRadius: 10,
                background: color.surface,
                border: `1px solid ${color.line}`,
              }}
            />
          </div>

          {showNewInput && (
            <div style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              margin: "10px 0 4px",
            }}>
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                  if (e.key === "Escape") { setShowNewInput(false); setNewName(""); }
                }}
                placeholder="Playlist name"
                aria-label="Playlist name"
                style={{ flex: 1, ...INPUT_ST, padding: "10px 12px", fontSize: 16, borderRadius: 10 }}
              />
              <button
                type="button"
                onClick={handleCreate}
                style={{
                  ...BTN_PRIMARY,
                  width: "auto",
                  borderRadius: 10,
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
                  borderRadius: 10,
                  padding: "10px 12px",
                  fontSize: 14,
                }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>


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
                marginBottom: 16,
              }}>
                <div style={{
                  fontSize: 20,
                  fontWeight: 700,
                  letterSpacing: -0.4,
                  color: color.ink,
                  fontFamily: fontDisplay,
                }}>
                  Playlists
                </div>
                <div
                  role="group"
                  aria-label="Sort playlists"
                  style={{
                    display: "inline-flex",
                    gap: 4,
                    padding: 0,
                    borderRadius: 0,
                    background: "transparent",
                    border: "none",
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
                          border: `1px solid ${on ? "rgba(91,101,116,0.28)" : "rgba(91,101,116,0.16)"}`,
                          borderRadius: hardware.radius,
                          padding: "6px 10px",
                          fontSize: 11,
                          fontWeight: on ? 700 : 600,
                          cursor: "pointer",
                          background: on ? hardware.keyFace : "transparent",
                          color: on ? color.ink : color.muted,
                          fontFamily: fontMono,
                          letterSpacing: 0.1,
                          textTransform: "uppercase",
                          boxShadow: on ? hardware.keyRaised : "none",
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
                padding: "48px 12px 24px",
                textAlign: "center",
              }}>
                <div style={{
                  fontSize: 22,
                  fontWeight: 700,
                  fontFamily: fontDisplay,
                  color: color.ink,
                  letterSpacing: -0.45,
                  marginBottom: 8,
                }}>
                  No playlists yet
                </div>
                <div style={{
                  fontSize: 15,
                  color: color.muted,
                  lineHeight: 1.45,
                  marginBottom: 20,
                  maxWidth: 300,
                  marginLeft: "auto",
                  marginRight: "auto",
                  fontFamily: fontDisplay,
                }}>
                  Start one, add songs, then share it when it’s ready.
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
                gridTemplateColumns: "repeat(auto-fill, minmax(156px, 1fr))",
                gap: "24px 16px",
              }}>
                {filteredPlaylists.map((pl) => renderPlaylistTile(pl))}
                {!q && renderPlaylistTile(null, { create: true })}
              </div>
            )}

          </div>
        ) : libTab === "recents" ? (
          <div style={{ animation: `rise 0.4s ${motion.ease} both` }}>
            {filteredRecents.length > 0 ? (
              <>
                <div style={{
                  padding: `4px ${homeSpace.gutter}px 16px`,
                }}>
                  <div style={{
                    fontFamily: fontDisplay,
                    fontSize: 22,
                    fontWeight: 700,
                    letterSpacing: -0.45,
                    color: color.ink,
                  }}>
                    Recently played
                  </div>
                  <div style={{
                    fontSize: 14,
                    color: color.muted,
                    marginTop: 4,
                    fontFamily: fontDisplay,
                  }}>
                    {filteredRecents.length} song{filteredRecents.length === 1 ? "" : "s"}
                  </div>
                </div>
                <div style={{ padding: `0 ${homeSpace.gutter}px 24px` }}>
                  {filteredRecents.map((t) => (
                    <TrackRow
                      key={t.id}
                      track={t}
                      onPlay={() => playTrackFn(t, filteredRecents)}
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
                  {q ? `No songs match “${libQuery.trim()}”` : "Nothing played yet"}
                </div>
                <div style={{
                  fontSize: 14,
                  color: color.muted,
                  lineHeight: 1.45,
                }}>
                  {q ? "Try another search." : "Tracks you play show up here."}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ animation: `rise 0.4s ${motion.ease} both` }}>
            {filteredSaved.length > 0 ? (
              <>
                <div style={{
                  padding: `4px ${homeSpace.gutter}px 16px`,
                  display: "flex",
                  gap: 16,
                  alignItems: "center",
                }}>
                  <div style={{
                    width: 88,
                    height: 88,
                    borderRadius: 10,
                    overflow: "hidden",
                    flexShrink: 0,
                    boxShadow: artShadow.quiet,
                  }}>
                    <CoverMosaic covers={filteredSaved} title="Liked" size={88} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: fontDisplay,
                      fontSize: 22,
                      fontWeight: 700,
                      letterSpacing: -0.45,
                      color: color.ink,
                    }}>
                      Liked Songs
                    </div>
                    <div style={{
                      fontSize: 14,
                      color: color.muted,
                      marginTop: 4,
                      fontFamily: fontDisplay,
                    }}>
                      {filteredSaved.length} song{filteredSaved.length === 1 ? "" : "s"}
                    </div>
                  </div>
                </div>
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
                </div>
                <div style={{ padding: `4px ${Math.max(0, homeSpace.gutter - 8)}px 24px` }}>
                  {q && (
                    <div style={{
                      fontSize: 15,
                      fontWeight: 650,
                      letterSpacing: -0.2,
                      color: color.ink,
                      fontFamily: fontDisplay,
                      margin: "0 8px 10px",
                    }}>
                      Matches
                    </div>
                  )}
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
                  {q ? `No songs match “${libQuery.trim()}”` : "No liked songs"}
                </div>
                <div style={{
                  fontSize: 14,
                  color: color.muted,
                  lineHeight: 1.45,
                }}>
                  {q ? "Try another search." : "Songs you love live here."}
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

