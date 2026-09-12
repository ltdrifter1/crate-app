import { color, fontDisplay, motion, y2k } from "../../theme";
import Icon from "../ui/Icon";

/**
 * BottomNavigation — iOS tab bar.
 * Active destination is brighter off-white, no LED glow.
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
        borderRadius: 18,
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
              borderRadius: 14,
              border: "1px solid transparent",
              background: active ? "rgba(255,255,255,0.08)" : "none",
              boxShadow: "none",
              color: active ? y2k.offWhite : color.muted,
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
                fontSize: 10,
                fontWeight: active ? 650 : 550,
                letterSpacing: -0.08,
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
