import { useEffect, useState } from "react";
import Icon from "../components/ui/Icon";
import VirtualList from "../components/ui/VirtualList";
import GenreSceneBrowse from "../components/search/GenreSceneBrowse";
import { AlbumArt } from "../components/listen/AlbumArt";
import { TrackRow } from "../components/listen/TrackRow";
import { useIsPlaying } from "../usePlayerTransport";
import {
  BTN_SECONDARY,
  INPUT_ST,
  color,
  font,
  fontDisplay,
  fontMono,
  glass,
  radius,
} from "../theme";

export default function SearchScreen({
  query, setQuery, results, onPlay, onLike, currentTrack, playlistCtx,
  entityHits, onOpenArtist, onOpenAlbum, tracks = [], onListenIntent = null,
  recentSearches = [], onPickRecent = null, onClearRecent = null,
}) {
  const [showAllResults, setShowAllResults] = useState(false);
  const isPlaying = useIsPlaying();
  useEffect(() => { setShowAllResults(false); }, [query]);
  const RESULT_CAP = 50;
  const visibleResults = showAllResults ? results : results.slice(0, RESULT_CAP);
  const useVirtual = showAllResults && results.length > RESULT_CAP;
  const hintChip = {
    background: `
      linear-gradient(165deg, rgba(38,43,51,0.82) 0%, rgba(28,32,38,0.5) 100%)
    `,
    border: `1px solid ${glass.borderSoft}`,
    borderRadius: 980,
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
    <div style={{ padding: "0 0 16px" }}>
      <div style={{
        padding: `calc(14px + env(safe-area-inset-top, 0px)) 16px 0`,
      }}>
      <div style={{ position:"relative", marginBottom:14 }}>
        <div style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color: color.faint, zIndex: 1 }}><Icon name="search" size={16}/></div>
        <input
          placeholder="Search"
          aria-label="Search"
          style={{
            ...INPUT_ST,
            paddingLeft:42,
            paddingRight: query ? 42 : 16,
            borderRadius: radius.xl,
            background: `
              linear-gradient(165deg, rgba(38,43,51,0.82) 0%, rgba(28,32,38,0.5) 100%)
            `,
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
      {query.length > 1 && entityHits?.artists?.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          {entityHits.artists.map((a) => (
            <button
              key={a.slug}
              type="button"
              onClick={() => onOpenArtist?.(a.slug)}
              style={{
                display:"flex", alignItems:"center", gap:12, width:"100%", padding:"12px 12px",
                marginBottom: 6,
                background: `
                  linear-gradient(165deg, rgba(32,36,43,0.68) 0%, rgba(28,32,38,0.38) 100%)
                `,
                border: `1px solid ${glass.borderSoft}`,
                borderRadius: radius.lg,
                boxShadow: `inset 0 1px 0 ${glass.highlight}`,
                backdropFilter: glass.blurSoft,
                WebkitBackdropFilter: glass.blurSoft,
                cursor:"pointer", textAlign:"left", color: color.ink,
              }}
            >
              <div style={{ width:48, height:48, overflow:"hidden", flexShrink:0, background: color.surfaceRaised, borderRadius: 24, border: `1px solid ${glass.borderSoft}` }}>
                {a.coverTrack && <AlbumArt track={a.coverTrack} size={48} borderRadius={24}/>}
              </div>
              <div style={{ minWidth:0, fontSize:17, fontWeight:600, fontFamily: fontDisplay }}>{a.name}</div>
            </button>
          ))}
        </div>
      )}
      {query.length > 1 && entityHits?.albums?.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          {entityHits.albums.map((a) => (
            <button
              key={a.slug}
              type="button"
              onClick={() => onOpenAlbum?.(a.slug)}
              style={{
                display:"flex", alignItems:"center", gap:12, width:"100%", padding:"12px 12px",
                marginBottom: 6,
                background: `
                  linear-gradient(165deg, rgba(32,36,43,0.68) 0%, rgba(28,32,38,0.38) 100%)
                `,
                border: `1px solid ${glass.borderSoft}`,
                borderRadius: radius.lg,
                boxShadow: `inset 0 1px 0 ${glass.highlight}`,
                backdropFilter: glass.blurSoft,
                WebkitBackdropFilter: glass.blurSoft,
                cursor:"pointer", textAlign:"left", color: color.ink,
              }}
            >
              <div style={{ width:48, height:48, overflow:"hidden", flexShrink:0, background: color.surfaceRaised, borderRadius: radius.sm, border: `1px solid ${glass.borderSoft}` }}>
                {a.coverTrack && <AlbumArt track={a.coverTrack} size={48} borderRadius={radius.sm}/>}
              </div>
              <div style={{ minWidth:0, fontSize:17, fontWeight:600, fontFamily: fontDisplay }}>{a.title}</div>
            </button>
          ))}
        </div>
      )}
      {query.length>1&&!results.length&&!(entityHits?.artists?.length || entityHits?.albums?.length)&&(
        <div style={{ textAlign:"center", padding:"56px 0" }}>
          <div style={{ color: color.ink, fontSize:17, fontWeight:600, fontFamily: fontDisplay }}>No results</div>
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
      {!query && (
        <GenreSceneBrowse
          tracks={tracks}
          onPlayPool={(t, pool) => onPlay(t, pool)}
          onListenIntent={onListenIntent}
          currentTrack={currentTrack}
         
          TrackRow={TrackRow}
          onLike={onLike}
          playlistCtx={playlistCtx}
        />
      )}
      </div>
    </div>
  );
}

