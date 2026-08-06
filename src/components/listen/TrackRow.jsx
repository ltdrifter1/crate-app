import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Icon from "../ui/Icon";
import { AlbumArt } from "./AlbumArt";
import { displaySceneLabel } from "../../lib/scenes";
import { normalizeGenre } from "../../lib/genres";
import {
  artShadow,
  color,
  fontDisplay,
  fontMono,
  glass,
  motion,
  radius,
  INPUT_ST,
} from "../../theme";

// ─── PLAYLIST MENU CONTEXT ────────────────────────────────────────────────────
// Passed down so every track surface can add/remove playlists
const PlaylistCtx = {
  playlists: [],
  onCreate: () => {},
  onAdd: () => {},
  onRemove: () => {},
  onToast: () => {},
  onResonance: null,
  onLike: null,
};

function clampMenuPos(x, y, w = 240, h = 320) {
  const pad = 8;
  const left = Math.max(pad, Math.min(x, (typeof window !== "undefined" ? window.innerWidth : 400) - w - pad));
  const top = Math.max(pad, Math.min(y, (typeof window !== "undefined" ? window.innerHeight : 700) - h - pad));
  return { left, top };
}

/** Spotify/iTunes-style track menu — ⋯ or right-click. Portaled so it never clips. */
export function TrackActionsMenu({ track, playlistCtx, activePlaylistId, x, y, onClose }) {
  const ctx = playlistCtx || PlaylistCtx;
  const [newPlName, setNewPlName] = useState("");
  const [showNewPl, setShowNewPl] = useState(false);
  const menuRef = useRef(null);
  const pos = clampMenuPos(x, y);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    const onDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [onClose]);

  function inPlaylist(pl) {
    return (pl.trackIds || []).includes(track.id);
  }

  function handleTogglePlaylist(pl) {
    if (inPlaylist(pl)) {
      ctx.onRemove(track.id, pl.id);
    } else {
      ctx.onAdd(track.id, pl.id);
    }
    onClose();
  }

  function handleCreateAndAdd() {
    if (!newPlName.trim()) return;
    ctx.onCreate(newPlName.trim(), track.id);
    setNewPlName("");
    setShowNewPl(false);
    onClose();
  }

  const menu = (
    <div
      ref={menuRef}
      role="menu"
      aria-label="Track actions"
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
      style={{
        position: "fixed",
        left: pos.left,
        top: pos.top,
        zIndex: 400,
        background: "rgba(52,58,68,0.92)",
        border: `1px solid ${glass.border}`,
        borderRadius: radius.md,
        padding: "6px 0",
        minWidth: 220,
        maxWidth: 280,
        maxHeight: "min(70vh, 420px)",
        overflowY: "auto",
        boxShadow: `inset 0 1px 0 ${glass.highlight}, 0 16px 40px rgba(26,29,36,0.16)`,
        backdropFilter: glass.blur,
        WebkitBackdropFilter: glass.blur,
        animation: "fadeIn 0.12s ease both",
      }}
    >
      <div style={{ padding: "8px 14px 10px", borderBottom: `1px solid ${glass.borderFaint}` }}>
        <div style={{ fontSize: 13, fontWeight: 650, color: color.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: fontDisplay }}>
          {track.title}
        </div>
        <div style={{ fontSize: 11, color: color.muted, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {track.artist}
        </div>
      </div>

      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, color: color.faint, padding: "10px 14px 4px", textTransform: "uppercase", fontFamily: fontMono }}>
        Add to Playlist
      </div>

      {ctx.playlists.length === 0 && !showNewPl && (
        <div style={{ fontSize: 13, color: color.muted, padding: "8px 14px 4px" }}>
          No playlists yet — create one below.
        </div>
      )}

      {ctx.playlists.map((pl) => {
        const has = inPlaylist(pl);
        return (
          <button
            key={pl.id}
            type="button"
            role="menuitem"
            onClick={() => handleTogglePlaylist(pl)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
              width: "100%", textAlign: "left", background: "none", border: "none",
              color: color.ink, fontSize: 14, padding: "10px 14px", cursor: "pointer",
            }}
          >
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pl.name}</span>
            <span style={{
              flexShrink: 0, fontSize: 12, fontFamily: fontMono,
              color: has ? color.accent : color.faint,
            }}>
              {has ? "✓" : "+"}
            </span>
          </button>
        );
      })}

      <div style={{ height: 1, background: color.line, margin: "4px 14px" }} />

      {showNewPl ? (
        <div style={{ padding: "8px 12px" }}>
          <input
            autoFocus
            value={newPlName}
            onChange={(e) => setNewPlName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateAndAdd();
              if (e.key === "Escape") setShowNewPl(false);
            }}
            placeholder="Playlist name…"
            style={{ ...INPUT_ST, marginBottom: 6, padding: "8px 10px", fontSize: 16 }}
          />
          <div style={{ display: "flex", gap: 6 }}>
            <button type="button" onClick={handleCreateAndAdd} style={{ flex: 1, background: color.accent, border: "none", borderRadius: radius.sm, color: color.onAccent, fontSize: 13, fontWeight: 600, padding: "8px 0", cursor: "pointer" }}>
              Create
            </button>
            <button type="button" onClick={() => setShowNewPl(false)} style={{ flex: 1, background: "transparent", border: `1px solid ${color.line}`, borderRadius: radius.sm, color: color.muted, fontSize: 13, padding: "8px 0", cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          role="menuitem"
          onClick={() => setShowNewPl(true)}
          style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left", background: "none", border: "none", color: color.ink, fontSize: 14, padding: "10px 14px", cursor: "pointer", fontWeight: 500 }}
        >
          <Icon name="plus" size={14} /> New Playlist
        </button>
      )}

      {ctx.onLike && (
        <>
          <div style={{ height: 1, background: color.line, margin: "4px 14px" }} />
          <button
            type="button"
            role="menuitem"
            onClick={() => { ctx.onLike(track.id); onClose(); }}
            style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", color: color.ink, fontSize: 14, padding: "10px 14px", cursor: "pointer" }}
          >
            {track.liked ? "Remove from Saved" : "Save track"}
          </button>
        </>
      )}

      {(ctx.onOpenArtist || ctx.onOpenAlbum) && (
        <>
          <div style={{ height: 1, background: color.line, margin: "4px 14px" }} />
          {ctx.onOpenArtist && track.artist && (
            <button
              type="button"
              role="menuitem"
              onClick={() => { ctx.onOpenArtist(track.artist); onClose(); }}
              style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", color: color.ink, fontSize: 14, padding: "10px 14px", cursor: "pointer" }}
            >
              View artist
            </button>
          )}
          {ctx.onOpenAlbum && track.album && (
            <button
              type="button"
              role="menuitem"
              onClick={() => { ctx.onOpenAlbum(track); onClose(); }}
              style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", color: color.ink, fontSize: 14, padding: "10px 14px", cursor: "pointer" }}
            >
              View album
            </button>
          )}
        </>
      )}

      {ctx.onResonance && (
        <button
          type="button"
          role="menuitem"
          onClick={() => { ctx.onResonance(track); onClose(); }}
          style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", color: color.ink, fontSize: 14, padding: "10px 14px", cursor: "pointer" }}
        >
          Find similar
        </button>
      )}

      {ctx.onHypnoRadio && (
        <button
          type="button"
          role="menuitem"
          onClick={() => { ctx.onHypnoRadio(track); onClose(); }}
          style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", color: color.ink, fontSize: 14, padding: "10px 14px", cursor: "pointer" }}
        >
          Play similar mix
        </button>
      )}

      {activePlaylistId && activePlaylistId !== "liked" && (
        <>
          <div style={{ height: 1, background: color.line, margin: "4px 14px" }} />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              ctx.onRemove(track.id, activePlaylistId);
              onClose();
            }}
            style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", color: color.alert, fontSize: 14, padding: "10px 14px", cursor: "pointer" }}
          >
            Remove from this playlist
          </button>
        </>
      )}
    </div>
  );

  return createPortal(menu, document.body);
}

export function useTrackMenu() {
  const [menu, setMenu] = useState(null); // { track, x, y, activePlaylistId } | null
  const openAt = useCallback((track, x, y, activePlaylistId = null) => {
    setMenu({ track, x, y, activePlaylistId });
  }, []);
  const openFromButton = useCallback((e, track, activePlaylistId = null) => {
    e.preventDefault();
    e.stopPropagation();
    const r = e.currentTarget.getBoundingClientRect();
    openAt(track, r.right - 220, r.bottom + 4, activePlaylistId);
  }, [openAt]);
  const openFromContext = useCallback((e, track, activePlaylistId = null) => {
    e.preventDefault();
    e.stopPropagation();
    openAt(track, e.clientX, e.clientY, activePlaylistId);
  }, [openAt]);
  const close = useCallback(() => setMenu(null), []);
  return { menu, openFromButton, openFromContext, close };
}

export function TrackMoreButton({ onClick, size = 18 }) {
  return (
    <button
      type="button"
      aria-label="More"
      aria-haspopup="menu"
      onClick={onClick}
      style={{
        background: "none", border: "none", cursor: "pointer",
        color: color.faint, padding: "8px 10px", fontSize: size, lineHeight: 1, flexShrink: 0,
      }}
    >
      ⋯
    </button>
  );
}

// ─── TRACK ROW ────────────────────────────────────────────────────────────────
export function TrackRow({ track, onPlay, active, isPlaying, onLike, extraAction, playlistCtx, activePlaylistId, rank = null }) {
  const { menu, openFromButton, openFromContext, close } = useTrackMenu();

  return (
    <div style={{ position: "relative" }}>
      <div
        role="button"
        tabIndex={0}
        className="track-row"
        onClick={onPlay}
        onContextMenu={(e) => openFromContext(e, track, activePlaylistId)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPlay(); } }}
        style={{
          display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
          borderRadius: radius.lg,
          cursor: "pointer", marginBottom: 4,
          background: active
            ? `
              linear-gradient(165deg, rgba(42,47,55,0.85) 0%, rgba(28,32,38,0.58) 100%)
            `
            : `
              linear-gradient(165deg, rgba(255,255,255,0.28) 0%, rgba(28,32,38,0.12) 100%)
            `,
          border: active ? `1px solid ${glass.border}` : `1px solid ${glass.borderSoft}`,
          boxShadow: active
            ? `inset 0 1px 0 ${glass.highlight}, ${glass.shadowSoft}`
            : `inset 0 1px 0 ${glass.highlight}`,
          backdropFilter: glass.blurSoft,
          WebkitBackdropFilter: glass.blurSoft,
          transition: `background ${motion.fast} ${motion.ease}, border-color ${motion.fast}`,
        }}
      >
        {rank != null && (
          <span aria-hidden="true" style={{
            width: 22, textAlign: "center", flexShrink: 0,
            fontFamily: fontMono, fontVariantNumeric: "tabular-nums",
            fontSize: rank <= 3 ? 15 : 13,
            fontWeight: rank <= 3 ? 750 : 600,
            color: rank <= 3 ? color.accent : color.faint,
          }}>{rank}</span>
        )}
        <div style={{
          width: 44, height: 44, borderRadius: radius.sm, overflow: "hidden", flexShrink: 0,
          position: "relative", boxShadow: artShadow.quiet,
          border: `1px solid ${glass.borderSoft}`,
        }}>
          <AlbumArt track={track} size={44} borderRadius={radius.sm} />
          {active && isPlaying && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(26,29,36,0.28)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: color.accent, animation: "pulse 1.2s ease-in-out infinite" }} />
            </div>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: active ? 650 : 500, letterSpacing: -0.1, color: active ? color.accent : color.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track.title}</div>
          <div style={{ fontSize: 12, color: color.muted, marginTop: 2 }}>{track.artist}{displaySceneLabel(track) ? ` · ${displaySceneLabel(track)}` : (normalizeGenre(track.genre) ? ` · ${normalizeGenre(track.genre)}` : "")}</div>
        </div>
        {onLike && (
          <button type="button" aria-label={track.liked ? "Unlike" : "Like"} onClick={(e) => { e.stopPropagation(); onLike(track.id); }}
            style={{ background: "none", border: "none", cursor: "pointer", color: track.liked ? color.accent : color.faint, padding: 8 }}>
            <span style={{ display: "flex", animation: track.liked ? "likePop 0.25s ease" : "none" }}>
              <Icon name={track.liked ? "heart" : "heartempty"} size={18} />
            </span>
          </button>
        )}
        <TrackMoreButton onClick={(e) => openFromButton(e, track, activePlaylistId)} />
        {extraAction || null}
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


export default TrackRow;
