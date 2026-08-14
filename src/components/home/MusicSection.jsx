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
 * MusicSection — Home / Explore shelf shell.
 * Titles align to the same top + left edge as each other and the Rail.
 * (Previous flex-end + View all shifted baselines so shelves looked crooked.)
 */
export default function MusicSection({
  title,
  subtitle = null,
  action = null,
  accent = null,
  children,
  first = false,
  delay = 0,
  style = {},
  /** When true, wrap non-rail children in the shared gutter. */
  inset = false,
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
          display: "grid",
          gridTemplateColumns: action ? "minmax(0, 1fr) auto" : "minmax(0, 1fr)",
          alignItems: "start",
          columnGap: 12,
          padding: `0 ${homeSpace.gutter}px`,
          marginBottom: homeSpace.titleToRail,
          minHeight: subtitle ? 40 : 22,
        }}
      >
        <div style={{ minWidth: 0 }}>
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
              marginTop: 1,
              cursor: "pointer",
              padding: "7px 11px",
              fontFamily: fontDisplay,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: -0.1,
              textTransform: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              color: y2k.offWhite,
              height: 32,
            }}
          >
            {action.label || "View all"}
            <span aria-hidden="true" style={{ fontSize: 13, lineHeight: 1, color: color.muted }}>
              ›
            </span>
          </button>
        )}
      </div>
      {inset ? (
        <div style={{ padding: `0 ${homeSpace.gutter}px` }}>{children}</div>
      ) : (
        children
      )}
    </section>
  );
}

/**
 * Horizontal snap rail — same gutter as MusicSection titles.
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
