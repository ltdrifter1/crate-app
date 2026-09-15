import { color, fontDisplay, glass, radius } from "../../theme";
import Icon from "../ui/Icon";
import { AlbumArt } from "./AlbumArt";

export default function QueueSheet({ queue, currentTrack, onPlay, onClose, onClear, onShuffle, isRadioMode, radioHint, onRemove = null, onPlayNext = null }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:110 }}>
      <div onClick={onClose} style={{ position:"absolute", inset:0, background:"rgba(5,6,8,0.55)", backdropFilter: glass.blurSoft, WebkitBackdropFilter: glass.blurSoft }}/>
      <div style={{
        position:"absolute", left:0, right:0, bottom:0, maxHeight:"72vh",
        background: glass.plate,
        borderTop: `1px solid ${glass.border}`,
        borderRadius: `${radius.xl}px ${radius.xl}px 0 0`,
        display:"flex", flexDirection:"column",
        boxShadow: `inset 0 1px 0 ${glass.highlight}, ${glass.shadowLift}`,
        backdropFilter: glass.blurHeavy,
        WebkitBackdropFilter: glass.blurHeavy,
        animation:"rise 0.35s cubic-bezier(0.22,1,0.36,1) both",
      }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 18px 10px" }}>
          <div>
            <div style={{ fontSize:16, fontWeight:750, color: color.ink, fontFamily: fontDisplay, letterSpacing:-0.3 }}>Up Next</div>
            {isRadioMode && (
              <div style={{ fontSize:11, color: color.muted, marginTop:2 }}>
                {radioHint || "Choosing the next song…"}
              </div>
            )}
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            {onShuffle && (
              <button type="button" onClick={onShuffle} style={{ background: color.surface, border:"none", borderRadius:8, padding:"6px 10px", color: color.muted, fontSize:11, fontWeight:600, cursor:"pointer" }}>Shuffle</button>
            )}
            {queue.length > 0 && onClear && (
              <button type="button" onClick={onClear} style={{ background: color.surface, border:"none", borderRadius:8, padding:"6px 10px", color: color.muted, fontSize:11, fontWeight:600, cursor:"pointer" }}>Clear</button>
            )}
            <button type="button" onClick={onClose} aria-label="Close" style={{ background:"none", border:"none", color: color.faint, cursor:"pointer", padding:4 }}>
              <Icon name="x" size={18}/>
            </button>
          </div>
        </div>
        <div className="hide-scroll" style={{ overflowY:"auto", padding:"4px 12px 28px" }}>
          {currentTrack && (
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 8px", marginBottom:6, borderRadius:10, background: color.accentSoft, border:`1px solid ${color.accentSoft}` }}>
              <div style={{ width:40, height:40, overflow:"hidden", flexShrink:0 }}><AlbumArt track={currentTrack} size={40} borderRadius={0}/></div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:1, color: color.accent, textTransform:"uppercase", marginBottom:2 }}>Now</div>
                <div style={{ fontSize:13, fontWeight:600, color: color.ink, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{currentTrack.title}</div>
                <div style={{ fontSize:11, color: color.muted }}>{currentTrack.artist}</div>
              </div>
            </div>
          )}
          {queue.length === 0 && (
            <div style={{ textAlign:"center", padding:"36px 12px", color: color.faint, fontSize:13 }}>
              {isRadioMode ? "Next pick lands after the crossfade" : "Nothing on deck"}
            </div>
          )}
          {queue.map((t, i) => (
            <div key={t.id} style={{
              display:"flex", alignItems:"center", gap:10, width:"100%", padding:"6px 0 6px 8px",
              borderBottom:`1px solid ${color.line}`,
            }}>
              <button type="button" onClick={() => { onPlay(t); onClose(); }}
                style={{
                  display:"flex", alignItems:"center", gap:10, flex:1, minWidth:0, padding:"4px 0",
                  background:"none", border:"none", cursor:"pointer", textAlign:"left",
                }}>
                <div style={{ width:16, fontSize:10, color: color.faint, fontVariantNumeric:"tabular-nums" }}>{i + 1}</div>
                <div style={{ width:40, height:40, overflow:"hidden", flexShrink:0 }}><AlbumArt track={t} size={40} borderRadius={0}/></div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:550, color: color.ink, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.title}</div>
                  <div style={{ fontSize:11, color: color.muted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.artist}</div>
                </div>
              </button>
              {!isRadioMode && onPlayNext && i > 0 && (
                <button type="button" onClick={() => onPlayNext(t)} aria-label={`Play ${t.title} next`}
                  style={{ background:"none", border:"none", cursor:"pointer", color: color.faint, padding:10, flexShrink:0 }}>
                  <Icon name="chev_up" size={15}/>
                </button>
              )}
              {!isRadioMode && onRemove && (
                <button type="button" onClick={() => onRemove(t)} aria-label={`Remove ${t.title} from queue`}
                  style={{ background:"none", border:"none", cursor:"pointer", color: color.faint, padding:10, flexShrink:0 }}>
                  <Icon name="x" size={15}/>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
