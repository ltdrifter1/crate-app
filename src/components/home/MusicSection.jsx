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
                  width: 4,
                  height: 14,
                  borderRadius: 2,
                  background: accent,
                  boxShadow: `0 0 10px ${accent}`,
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
                color: color.faint,
                letterSpacing: 0.2,
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
              color: y2k.purpleBright,
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

/** Horizontal snap rail — shared scroller for card shelves. */
export function Rail({ children, gap = 14, padBottom = 10 }) {
  return (
    <div
      className="hide-scroll"
      style={{
        display: "flex",
        gap,
        overflowX: "auto",
        padding: `4px ${homeSpace.gutter}px ${padBottom}px`,
        scrollSnapType: "x proximity",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {children}
    </div>
  );
}
