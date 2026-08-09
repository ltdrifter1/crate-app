import { useCallback, useRef } from "react";
import { color, fontDisplay, fontMono, homeSpace, motion, y2k } from "../../theme";

/**
 * MusicSection — one consistent section shell for Home.
 * Uppercase display title, optional muted subtitle, optional "VIEW ALL" action.
 */
export default function MusicSection({
  title,
  subtitle = null,
  action = null, // { label, onClick }
  accent = null, // small colored tick before the title
  children,
  first = false,
  delay = 0,
  style = {},
}) {
  return (
    <section
      aria-label={title}
      style={{
        marginTop: first ? 0 : 36,
        animation: `rise 0.5s ${motion.ease} ${delay}s both`,
        ...style,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 12,
          padding: `0 ${homeSpace.gutter}px`,
          marginBottom: 14,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <h2
            style={{
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontFamily: fontDisplay,
              fontSize: 15,
              fontWeight: 800,
              letterSpacing: 2.2,
              textTransform: "uppercase",
              color: y2k.offWhite,
              lineHeight: 1.1,
            }}
          >
            {accent && (
              <span
                aria-hidden="true"
                style={{
                  width: 3,
                  height: 13,
                  borderRadius: 1,
                  background: accent,
                  boxShadow: `0 0 8px ${accent}55`,
                  flexShrink: 0,
                }}
              />
            )}
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {title}
            </span>
          </h2>
          {subtitle && (
            <div
              style={{
                marginTop: 5,
                fontSize: 12,
                fontWeight: 500,
                color: color.muted,
                letterSpacing: 0.15,
                lineHeight: 1.35,
              }}
            >
              {subtitle}
            </div>
          )}
        </div>
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className="pmp-view-all"
            style={{
              flexShrink: 0,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "6px 0 6px 12px",
              fontFamily: fontMono,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1.4,
              textTransform: "uppercase",
              color: y2k.chromeBright,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {action.label || "View all"}
            <span aria-hidden="true" style={{ fontSize: 12, lineHeight: 1 }}>→</span>
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

/**
 * Horizontal snap rail — shared scroller for card shelves.
 * Pointer drag + touch-action so channel surfing (and other shelves) actually scroll.
 */
export function Rail({ children, gap = 14, padBottom = 10 }) {
  const ref = useRef(null);
  const drag = useRef({ active: false, startX: 0, scrollLeft: 0, moved: false });

  const onPointerDown = useCallback((e) => {
    const el = ref.current;
    if (!el || e.pointerType === "touch") return;
    // Only primary button / pen — let nested buttons still click when not dragged
    if (e.button != null && e.button !== 0) return;
    drag.current = {
      active: true,
      startX: e.clientX,
      scrollLeft: el.scrollLeft,
      moved: false,
      pointerId: e.pointerId,
    };
    el.setPointerCapture?.(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e) => {
    const el = ref.current;
    const d = drag.current;
    if (!el || !d.active) return;
    const dx = e.clientX - d.startX;
    if (Math.abs(dx) > 4) d.moved = true;
    if (d.moved) {
      el.scrollLeft = d.scrollLeft - dx;
      e.preventDefault();
    }
  }, []);

  const endDrag = useCallback((e) => {
    const el = ref.current;
    const d = drag.current;
    if (!d.active) return;
    if (el && d.pointerId != null) {
      try {
        el.releasePointerCapture?.(d.pointerId);
      } catch {
        /* already released */
      }
    }
    // Swallow the click that follows a drag so tiles don't fire accidentally
    if (d.moved && e?.target) {
      const swallow = (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        el?.removeEventListener("click", swallow, true);
      };
      el?.addEventListener("click", swallow, true);
      window.setTimeout(() => el?.removeEventListener("click", swallow, true), 0);
    }
    drag.current = { active: false, startX: 0, scrollLeft: 0, moved: false };
  }, []);

  return (
    <div
      ref={ref}
      className="hide-scroll pmp-rail"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      style={{
        display: "flex",
        gap,
        overflowX: "auto",
        overflowY: "hidden",
        padding: `4px ${homeSpace.gutter}px ${padBottom}px`,
        scrollSnapType: "x proximity",
        WebkitOverflowScrolling: "touch",
        touchAction: "pan-x",
        overscrollBehaviorX: "contain",
        cursor: "grab",
      }}
    >
      {children}
    </div>
  );
}
