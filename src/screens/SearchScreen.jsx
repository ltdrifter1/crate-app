import { useEffect, useMemo, useState, memo } from "react";
import Icon from "../components/ui/Icon";
import VirtualList from "../components/ui/VirtualList";
import GenreSceneBrowse from "../components/search/GenreSceneBrowse";
import CamelotKeyRail from "../components/search/CamelotKeyRail";
import { AlbumArt } from "../components/listen/AlbumArt";
import { TrackRow } from "../components/listen/TrackRow";
import CrateDig from "../components/explore/CrateDig";
import { inkForTrack } from "../lib/board";
import { useCurrentTrack } from "../usePlayerTransport";
import { rankSearchResults, searchEntityHits } from "../lib/searchRank";
import {
  BTN_SECONDARY,
  SEARCH_FIELD,
  color,
  font,
  fontDisplay,
  fontMono,
  fontPoster,
  glass,
  radius,
} from "../theme";

/** A hit on the shelf — square sleeve, station ink along the foot, the name. */
function HitTile({ label, kind, coverTrack, onClick }) {
  const ink = kind === "artist" ? inkForTrack(coverTrack) : "rgba(200,210,222,0.35)";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Open ${label}`}
      style={{
        flexShrink: 0,
        width: 112,
        background: "none",
        border: "none",
        padding: 0,
        cursor: "pointer",
        textAlign: "left",
        color: color.ink,
      }}
    >
      <div
        style={{
          position: "relative",
          width: 112,
          height: 112,
          overflow: "hidden",
          borderRadius: 6,
          background: color.surfaceRaised,
          border: "1px solid rgba(255,255,255,0.08)",
          marginBottom: 8,
        }}
      >
        {coverTrack ? <AlbumArt track={coverTrack} size={112} borderRadius={6} /> : null}
        <span aria-hidden="true" style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 3, background: ink }} />
      </div>
      <div style={{ fontFamily: fontMono, fontSize: 10, fontWeight: 700, letterSpacing: 0.12, textTransform: "uppercase", color: color.faint, marginBottom: 2 }}>
        {kind}
      </div>
      <div style={{ fontFamily: fontDisplay, fontSize: 14, fontWeight: 650, letterSpacing: -0.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {label}
      </div>
    </button>
  );
}

function SearchScreen({
  query, setQuery, results: resultsProp, onPlay, onLike, playlistCtx,
  entityHits: entityHitsProp, onOpenArtist, onOpenAlbum, tracks = [], onListenIntent = null,
  recentSearches = [], onPickRecent = null, onClearRecent = null,
  onBack = null,
  backLabel = "Discover",
}) {
  const currentTrack = useCurrentTrack();
  const [showAllResults, setShowAllResults] = useState(false);
  const [debounced, setDebounced] = useState(query);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 180);
    return () => clearTimeout(t);
  }, [query]);
  useEffect(() => { setShowAllResults(false); }, [query]);
  const computedResults = useMemo(() => rankSearchResults(tracks, debounced), [tracks, debounced]);
  const computedEntities = useMemo(() => searchEntityHits(tracks, debounced), [tracks, debounced]);
  const results = resultsProp || computedResults;
  const entityHits = entityHitsProp || computedEntities;
  const RESULT_CAP = 50;
  const visibleResults = showAllResults ? results : results.slice(0, RESULT_CAP);
  const useVirtual = showAllResults && results.length > RESULT_CAP;
  const hintChip = {
    background: "rgba(12, 15, 19, 0.88)",
    border: `1px solid ${glass.borderSoft}`,
    borderRadius: 4,
    padding: "7px 13px",
    fontSize: 12.5,
    fontWeight: 600,
    color: color.body,
    cursor: "pointer",
    fontFamily: fontMono,
    letterSpacing: 0.2,
    boxShadow: `inset 0 1px 0 ${glass.highlight}`,
    backdropFilter: glass.blurSoft,
    WebkitBackdropFilter: glass.blurSoft,
  };
  return (
    <div style={{ padding: "0 0 16px", maxWidth: 1120, margin: "0 auto", width: "100%" }}>
      <div style={{
        padding: `calc(14px + env(safe-area-inset-top, 0px)) 16px 0`,
      }}>
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label={`Back to ${backLabel}`}
          style={{
            background: "none",
            border: "none",
            color: color.muted,
            fontFamily: fontDisplay,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            padding: "0 0 10px",
          }}
        >
          ‹ {backLabel}
        </button>
      )}
      <div style={{ position:"relative", marginBottom:14 }}>
        <div style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color: color.faint, zIndex: 1 }}><Icon name="search" size={16}/></div>
        <input
          placeholder="Find a track, artist or scene"
          aria-label="Search"
          style={{
            ...SEARCH_FIELD,
            paddingLeft:42,
            paddingRight: query ? 42 : 16,
          }}
          value={query}
          onChange={e=>setQuery(e.target.value)}
          autoFocus={typeof window !== "undefined" && window.innerWidth >= 900}
        />
        {query && (
          <button type="button" onClick={()=>setQuery("")} aria-label="Clear search"
            style={{ position:"absolute", right:6, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color: color.faint, padding:10 }}>
            <Icon name="x" size={15}/>
          </button>
        )}
      </div>
      {!query && recentSearches.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display:"flex", alignItems:"baseline", justifyContent:"space-between", marginBottom:8 }}>
            <div style={{ fontSize:12, fontWeight:650, color: color.muted, textTransform:"uppercase", letterSpacing:0.6 }}>Recent</div>
            {onClearRecent && (
              <button type="button" onClick={onClearRecent}
                style={{ background:"none", border:"none", cursor:"pointer", color: color.faint, fontSize:12, fontWeight:600, padding:"2px 4px" }}>
                Clear
              </button>
            )}
          </div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {recentSearches.map((q) => (
              <button key={q} type="button" onClick={() => (onPickRecent || setQuery)(q)}
                style={{ ...hintChip, fontFamily: font, letterSpacing: 0 }}>
                {q}
              </button>
            ))}
          </div>
        </div>
      )}
      {query.length > 1 && (entityHits?.artists?.length > 0 || entityHits?.albums?.length > 0) && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontFamily: fontMono, fontSize: 11, fontWeight: 700, letterSpacing: 0.14, textTransform: "uppercase", color: color.faint, marginBottom: 10 }}>
            On the shelf
          </div>
          <div className="hide-scroll" style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 6 }}>
            {(entityHits.artists || []).map((a) => (
              <HitTile key={`a-${a.slug}`} kind="artist" label={a.name} coverTrack={a.coverTrack} onClick={() => onOpenArtist?.(a.slug)} />
            ))}
            {(entityHits.albums || []).map((a) => (
              <HitTile key={`al-${a.slug}`} kind="album" label={a.title} coverTrack={a.coverTrack} onClick={() => onOpenAlbum?.(a.slug)} />
            ))}
          </div>
        </div>
      )}
      {query.length>1&&!results.length&&!(entityHits?.artists?.length || entityHits?.albums?.length)&&(
        <div style={{ padding: "28px 0 8px" }}>
          <div style={{ fontFamily: fontPoster, fontSize: 26, fontWeight: 800, letterSpacing: 0.2, textTransform: "uppercase", color: color.ink, lineHeight: 1 }}>
            Nothing by that name
          </div>
          <div style={{ marginTop: 6, fontSize: 14, color: color.muted, lineHeight: 1.45 }}>
            Not on the shelves yet. Pull one from the crate instead — or browse the keys and genres below.
          </div>
          <div style={{ margin: "0 -20px" }}>
            <CrateDig tracks={tracks} onPlay={(t, pool) => onPlay(t, pool || tracks)} compact />
          </div>
        </div>
      )}
      {useVirtual ? (
        <VirtualList
          items={results}
          estimateSize={68}
          maxHeight={typeof window !== "undefined" ? Math.min(window.innerHeight * 0.7, 720) : 560}
          renderItem={(t) => (
            <TrackRow track={t} onPlay={()=>onPlay(t)} active={currentTrack?.id===t.id} onLike={onLike} playlistCtx={playlistCtx}/>
          )}
        />
      ) : (
        visibleResults.map(t=>(
          <TrackRow key={t.id} track={t} onPlay={()=>onPlay(t)} active={currentTrack?.id===t.id} onLike={onLike} playlistCtx={playlistCtx}/>
        ))
      )}
      {!showAllResults && results.length > RESULT_CAP && (
        <button type="button" onClick={() => setShowAllResults(true)}
          style={{ ...BTN_SECONDARY, marginTop: 12, fontSize: 14, padding: "11px 16px" }}>
          Show all {results.length}
        </button>
      )}
      {(!query || (query.length > 1 && !results.length && !(entityHits?.artists?.length || entityHits?.albums?.length))) && (
        <>
        <CamelotKeyRail tracks={tracks} onPlayPool={(t, pool) => onPlay(t, pool)} />
        <GenreSceneBrowse
          tracks={tracks}
          onPlayPool={(t, pool) => onPlay(t, pool)}
          onListenIntent={onListenIntent}
          currentTrack={currentTrack}
         
          TrackRow={TrackRow}
          onLike={onLike}
          playlistCtx={playlistCtx}
        />
        </>
      )}
      </div>
    </div>
  );
}

export default memo(SearchScreen);

