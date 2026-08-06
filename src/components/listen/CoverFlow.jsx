/**
 * Cover Flow — center-focused sleeve carousel.
 * Perspective neighbors, snap-to-center, one dominant jewel case.
 * Digging feels like flipping a crate, not scrolling a stream.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { color, glass, radius, fontDisplay, artShadow, motion } from "../../theme";

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(!!mq.matches);
    sync();
    mq.addEventListener?.("change", sync);
    return () => mq.removeEventListener?.("change", sync);
  }, []);
  return reduced;
}

function SleeveArt({ track, size }) {
  if (track.albumCover) {
    return (
      <img
        src={track.albumCover}
        alt=""
        draggable={false}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
    );
  }
  return (
    <div style={{
      width: "100%", height: "100%",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: fontDisplay, fontSize: size * 0.28, fontWeight: 700,
      color: color.faint, letterSpacing: -1,
      background: `linear-gradient(160deg, rgba(46,51,60,0.88), ${color.surfaceRaised})`,
    }}>
      {(track.title || "P")[0]}
    </div>
  );
}

function Sleeve({ track, size, active, playing }) {
  return (
    <div
      className="cover-tile"
      style={{
        width: size,
        height: size,
        borderRadius: radius.md,
        overflow: "hidden",
        background: color.surfaceRaised,
        border: `1px solid ${active ? "rgba(255,255,255,0.2)" : glass.borderSoft}`,
        boxShadow: active ? artShadow.raised : artShadow.quiet,
        position: "relative",
      }}
    >
      <SleeveArt track={track} size={size} />
      <div aria-hidden="true" style={{
        pointerEvents: "none", position: "absolute", inset: 0, borderRadius: radius.md,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
        background: "linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 42%)",
      }}/>
      {active && playing && (
        <div style={{
          position: "absolute", inset: 0, background: "rgba(26,29,36,0.22)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: "50%", background: color.accent,
            boxShadow: `0 0 0 3px ${color.accentSoft}`,
            animation: "pulse 1.2s ease-in-out infinite",
          }}/>
        </div>
      )}
    </div>
  );
}

/**
 * @param {object} props
 * @param {Array} props.tracks
 * @param {(track: object, pool: Array) => void} props.onPlayTrack
 * @param {string} [props.activeId]
 * @param {boolean} [props.isPlaying]
 * @param {number} [props.limit]
 * @param {number} [props.size] — center sleeve edge length in px
 */
export default function CoverFlow({
  tracks = [],
  onPlayTrack,
  activeId = null,
  isPlaying = false,
  limit = 25,
  size = 200,
  reasons = null,
}) {
  const list = tracks.slice(0, limit);
  const reduced = usePrefersReducedMotion();
  const [focus, setFocus] = useState(0);
  const stageRef = useRef(null);
  const drag = useRef({ active: false, x: 0, moved: false });

  // Keep focus on the playing track when it changes from outside.
  useEffect(() => {
    if (!activeId || !list.length) return;
    const i = list.findIndex((t) => t.id === activeId);
    if (i >= 0) setFocus(i);
  }, [activeId]); // eslint-disable-line react-hooks/exhaustive-deps — list identity flips often

  useEffect(() => {
    if (focus > list.length - 1) setFocus(Math.max(0, list.length - 1));
  }, [list.length, focus]);

  const go = useCallback((dir) => {
    setFocus((i) => Math.max(0, Math.min(list.length - 1, i + dir)));
  }, [list.length]);

  const select = useCallback((i) => {
    const t = list[i];
    if (!t) return;
    if (i === focus) onPlayTrack?.(t, list);
    else setFocus(i);
  }, [focus, list, onPlayTrack]);

  if (!list.length) return null;

  const focused = list[focus];
  const stageH = Math.round(size * 1.28);
  const stepX = reduced ? size * 0.78 : size * 0.52;

  return (
    <div style={{ paddingBottom: 8 }}>
      <div
        ref={stageRef}
        role="listbox"
        aria-label="Cover Flow"
        aria-activedescendant={focused ? `coverflow-${focused.id}` : undefined}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
          else if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
          else if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (focused) onPlayTrack?.(focused, list);
          }
          else if (e.key === "Home") { e.preventDefault(); setFocus(0); }
          else if (e.key === "End") { e.preventDefault(); setFocus(list.length - 1); }
        }}
        onPointerDown={(e) => {
          drag.current = { active: true, x: e.clientX, moved: false };
          stageRef.current?.setPointerCapture?.(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drag.current.active) return;
          const dx = e.clientX - drag.current.x;
          if (Math.abs(dx) > 28) {
            drag.current.moved = true;
            drag.current.x = e.clientX;
            go(dx < 0 ? 1 : -1);
          }
        }}
        onPointerUp={() => { drag.current.active = false; }}
        onPointerCancel={() => { drag.current.active = false; }}
        style={{
          position: "relative",
          height: stageH + (reduced ? 0 : Math.round(size * 0.22)),
          outline: "none",
          cursor: "grab",
          userSelect: "none",
          WebkitUserSelect: "none",
          touchAction: "pan-y",
        }}
        className="cover-flow-stage"
      >
        {/* Glass table / floor bloom — Y2K jewel-case stage */}
        {!reduced && (
          <div aria-hidden="true" style={{
            position: "absolute",
            left: "12%",
            right: "12%",
            bottom: Math.round(size * 0.02),
            height: Math.round(size * 0.28),
            borderRadius: "50%",
            background: `
              radial-gradient(ellipse at 50% 30%, rgba(32,36,43,0.65) 0%, rgba(255,255,255,0.12) 42%, transparent 72%),
              linear-gradient(180deg, rgba(255,255,255,0.05) 0%, transparent 100%)
            `,
            filter: "blur(2px)",
            pointerEvents: "none",
            zIndex: 0,
          }}/>
        )}

        {/* Perspective stage */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            perspective: reduced ? "none" : 1100,
            perspectiveOrigin: "50% 42%",
            zIndex: 1,
          }}
        >
          <div style={{
            position: "absolute",
            left: "50%",
            top: "46%",
            width: 0,
            height: 0,
            transformStyle: reduced ? "flat" : "preserve-3d",
          }}>
            {list.map((t, i) => {
              const offset = i - focus;
              if (Math.abs(offset) > 5) return null;
              const abs = Math.abs(offset);
              const isCenter = offset === 0;
              const rot = reduced ? 0 : -offset * 52;
              const tx = offset * stepX;
              const tz = reduced ? 0 : (isCenter ? 56 : -90 - abs * 28);
              const sc = isCenter ? 1 : Math.max(0.72, 1 - abs * 0.1);
              const opacity = isCenter ? 1 : Math.max(0.28, 1 - abs * 0.22);

              return (
                <button
                  key={t.id}
                  id={`coverflow-${t.id}`}
                  type="button"
                  role="option"
                  aria-selected={isCenter}
                  aria-label={`${t.title} — ${t.artist}`}
                  onClick={() => {
                    if (drag.current.moved) return;
                    select(i);
                  }}
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: size,
                    marginLeft: -size / 2,
                    marginTop: -size / 2,
                    padding: 0,
                    border: "none",
                    background: "none",
                    cursor: isCenter ? "pointer" : "grab",
                    transform: `translateX(${tx}px) translateZ(${tz}px) rotateY(${rot}deg) scale(${sc})`,
                    transformOrigin: offset < 0 ? "100% 50%" : offset > 0 ? "0% 50%" : "50% 50%",
                    opacity,
                    zIndex: 40 - abs,
                    transition: `transform ${motion.settle} ${motion.ease}, opacity ${motion.base} ${motion.ease}`,
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  <Sleeve
                    track={t}
                    size={size}
                    active={t.id === activeId}
                    playing={!!isPlaying && t.id === activeId}
                  />
                  {/* Mirrored jewel-case floor — center sleeve only */}
                  {isCenter && !reduced && (
                    <div
                      className="cover-flow-reflect"
                      style={{
                        position: "absolute",
                        left: 0,
                        top: size + 4,
                        width: size,
                        height: Math.round(size * 0.34),
                        overflow: "hidden",
                        borderRadius: `0 0 ${radius.md}px ${radius.md}px`,
                        opacity: 0.42,
                        pointerEvents: "none",
                        maskImage: "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, transparent 88%)",
                        WebkitMaskImage: "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, transparent 88%)",
                      }}
                    >
                      <div style={{
                        transform: "scaleY(-1)",
                        transformOrigin: "center top",
                        height: size,
                        filter: "blur(0.4px) saturate(0.85)",
                      }}>
                        <SleeveArt track={t} size={size} />
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quiet chevrons — desktop affordance */}
        {focus > 0 && (
          <button
            type="button"
            aria-label="Previous cover"
            onClick={(e) => { e.stopPropagation(); go(-1); }}
            style={{
              position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)",
              zIndex: 50, width: 36, height: 36, borderRadius: "50%",
              border: `1px solid ${glass.border}`, background: glass.fillStrong,
              color: color.body, cursor: "pointer",
              boxShadow: `inset 0 1px 0 ${glass.highlight}, ${glass.shadowSoft}`,
              backdropFilter: glass.blurSoft, WebkitBackdropFilter: glass.blurSoft,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, lineHeight: 1,
            }}
          >
            ‹
          </button>
        )}
        {focus < list.length - 1 && (
          <button
            type="button"
            aria-label="Next cover"
            onClick={(e) => { e.stopPropagation(); go(1); }}
            style={{
              position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
              zIndex: 50, width: 36, height: 36, borderRadius: "50%",
              border: `1px solid ${glass.border}`, background: glass.fillStrong,
              color: color.body, cursor: "pointer",
              boxShadow: `inset 0 1px 0 ${glass.highlight}, ${glass.shadowSoft}`,
              backdropFilter: glass.blurSoft, WebkitBackdropFilter: glass.blurSoft,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, lineHeight: 1,
            }}
          >
            ›
          </button>
        )}
      </div>

      {/* Caption — only the focused sleeve speaks */}
      {focused && (
        <div
          key={focused.id}
          style={{
            textAlign: "center",
            padding: "4px 48px 0",
            animation: `trackSwap 0.35s ${motion.ease} both`,
          }}
        >
          <div style={{
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: -0.35,
            fontFamily: fontDisplay,
            color: focused.id === activeId ? color.accent : color.ink,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {focused.title}
          </div>
          <div style={{
            marginTop: 4,
            fontSize: 13,
            color: color.muted,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {focused.artist}
          </div>
        </div>
      )}
    </div>
  );
}
