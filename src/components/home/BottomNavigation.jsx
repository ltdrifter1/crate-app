import { color, fontDisplay, motion, y2k } from "../../theme";
import Icon from "../ui/Icon";

/**
 * BottomNavigation — floating pill tab bar.
 * Active destination gets a soft aluminum capsule; everything else stays quiet.
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
        borderRadius: 999,
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
              borderRadius: 999,
              border: active
                ? "1px solid rgba(232,236,242,0.35)"
                : "1px solid transparent",
              background: active ? y2k.chromeSoft : "none",
              boxShadow: active
                ? `0 0 16px ${y2k.chromeGlow}, inset 0 1px 0 rgba(255,255,255,0.1)`
                : "none",
              color: active ? y2k.chromeBright : color.muted,
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              transition: `color ${motion.base} ${motion.ease}, background ${motion.base} ${motion.ease}, box-shadow ${motion.base} ${motion.ease}`,
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
                fontSize: 9,
                fontWeight: active ? 800 : 600,
                letterSpacing: 1.2,
                textTransform: "uppercase",
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
