import { color, fontDisplay, motion } from "../../theme";
import Icon from "../ui/Icon";

/**
 * BottomNavigation — dark device selector, accent pip.
 */
export default function BottomNavigation({ items = [], activeId, onSelect }) {
  return (
    <nav
      aria-label="Main"
      className="pill-nav"
      style={{
        display: "flex",
        gap: 4,
        padding: 6,
        borderRadius: 10,
        pointerEvents: "auto",
      }}
    >
      {items.map(({ id, icon, label }) => {
        const active = activeId === id;
        return (
          <button
            key={id}
            type="button"
            aria-label={label}
            aria-current={active ? "page" : undefined}
            onClick={() => onSelect?.(id)}
            className="pill-tab"
            style={{
              flex: 1,
              minWidth: 0,
              height: 50,
              borderRadius: 8,
              border: active
                ? `1px solid ${color.accentGlow}`
                : "1px solid transparent",
              background: active ? "rgba(255,106,43,0.08)" : "none",
              boxShadow: active
                ? "inset 2px 0 0 #FF6A2B, inset 0 1px 0 rgba(255,255,255,0.08)"
                : "none",
              color: active ? color.ink : color.muted,
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              transition: `color ${motion.base} ${motion.ease}, background ${motion.base} ${motion.ease}`,
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <span
              style={{
                display: "flex",
                transform: active ? "translateY(-1px)" : "none",
                transition: `transform ${motion.settle} ${motion.ease}`,
              }}
            >
              <Icon name={icon} size={18} />
            </span>
            <span
              style={{
                fontFamily: fontDisplay,
                fontSize: 11,
                fontWeight: active ? 600 : 500,
                letterSpacing: "-0.01em",
                textTransform: "none",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "100%",
                padding: "0 4px",
              }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
