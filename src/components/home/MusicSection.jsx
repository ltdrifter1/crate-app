import { useCallback, useRef } from "react";
import {
  color,
  fontDisplay,
  glassPill,
  homeSpace,
  motion,
  sectionSubtitle,
  sectionTitle,
  y2k,
} from "../../theme";

/**
 * MusicSection — premium Home / Explore shelf shell.
 * Title + subtitle share one left edge with the Rail (homeSpace.gutter).
 * No chrome tick — that offset made titles look cheap and misaligned.
 */
export default function MusicSection({
  title,
  subtitle = null,
  action = null, // { label, onClick }
  accent = null, // kept for API compat; unused after tick retirement
  children,
  first = false,
  delay = 0,
  style = {},
}) {
  void accent;
  return (
    <section
      aria-label={title}
      style={{
        marginTop: first ? homeSpace.sectionGapFirst : homeSpace.sectionGap,
        animation: `rise 0.5s ${motion.ease} ${delay}s both`,
        ...style,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 14,
          padding: `0 ${homeSpace.gutter}px`,
          marginBottom: homeSpace.titleToRail,
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <h2
            style={{
              ...sectionTitle,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {title}
          </h2>
          {subtitle && (
            <p
              style={{
                ...sectionSubtitle,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className="pmp-view-all"
            style={{
              ...glassPill({ compact: true }),
              flexShrink: 0,
              alignSelf: "center",
              cursor: "pointer",
              padding: "8px 12px",
              fontFamily: fontDisplay,
              fontSize: 12,
              fontWeight: 650,
              letterSpacing: -0.1,
              textTransform: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              color: y2k.offWhite,
            }}
          >
            {action.label || "View all"}
            <span
              aria-hidden="true"
              style={{
                fontSize: 13,
                lineHeight: 1,
                color: color.muted,
                transform: "translateY(-0.5px)",
              }}
            >
              ›
            </span>
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

/**
 * Horizontal snap rail — shared scroller for card shelves.
 * Padding uses the same gutter as MusicSection titles so edges line up.
 */
export function Rail({ children, gap = 14, padBottom = 4 }) {
  const ref = useRef(null);
  const drag = useRef({ active: false, startX: 0, scrollLeft: 0, moved: false });

  const onPointerDown = useCallback((e) => {
    const el = ref.current;
    if (!el || e.pointerType === "touch") return;
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
        padding: `2px ${homeSpace.gutter}px ${padBottom}px`,
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
