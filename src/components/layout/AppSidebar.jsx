import { color, fontDisplay, glass, radius } from "../../theme";
import { BrandLockup } from "../brand/BrandMark";
import Icon from "../ui/Icon";
import {
  SIDEBAR_PRIMARY,
  SIDEBAR_TOOLS,
  sidebarActiveId,
} from "../../lib/nav";

function NavRow({ item, active, onClick }) {
  return (
    <button
      type="button"
      className="nav-rail-btn"
      onClick={onClick}
      title={item.label}
      aria-label={item.label}
      aria-current={active ? "page" : undefined}
      style={{
        width: "100%",
        minHeight: 40,
        borderRadius: radius.sm,
        background: active
          ? "rgba(90,98,112,0.12)"
          : "transparent",
        border: "1px solid transparent",
        color: active ? color.accent : color.body,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 10px",
        textAlign: "left",
        boxShadow: active
          ? "inset 2px 0 0 #5A6270, inset 0 1px 0 rgba(255,255,255,0.06)"
          : "none",
      }}
    >
      <span style={{ width: 18, display: "flex", justifyContent: "center", flexShrink: 0, color: active ? color.accent : color.muted }}>
        <Icon name={item.icon} size={16} />
      </span>
      <span
        style={{
          fontFamily: fontDisplay,
          fontSize: 14,
          fontWeight: active ? 650 : 520,
          letterSpacing: -0.18,
          lineHeight: 1.2,
        }}
      >
        {item.label}
      </span>
    </button>
  );
}

/**
 * Left source list — desktop rail and mobile drawer share this IA.
 * Home / Explore / Library stay the four-tab dock; Charts + Build a set live here.
 */
export default function AppSidebar({
  screen,
  buildingSet = false,
  onNavigate,
  onBuildSet = null,
  onClose = null,
  user = null,
  showAdmin = false,
  variant = "rail",
}) {
  const activeId = sidebarActiveId(screen, { buildingSet });
  const isDrawer = variant === "drawer";

  const go = (item) => {
    if (item.kind === "action" && item.id === "set") {
      onBuildSet?.();
    } else {
      onNavigate?.(item.id);
    }
    onClose?.();
  };

  return (
    <nav
      aria-label={isDrawer ? "Browse" : "Source list"}
      style={{
        width: isDrawer ? "100%" : 232,
        flexShrink: 0,
        height: "100%",
        background: isDrawer
          ? color.canvas
          : `
            linear-gradient(180deg, #16181E 0%, #0C0E12 100%)
          `,
        borderRight: isDrawer ? "none" : `1px solid ${glass.border}`,
        boxShadow: isDrawer ? "none" : `inset -1px 0 0 ${glass.highlight}`,
        display: "flex",
        flexDirection: "column",
        padding: isDrawer ? "8px 12px 20px" : "18px 12px 16px",
      }}
    >
      {!isDrawer && (
        <div style={{ marginBottom: 22, padding: "0 4px" }}>
          <BrandLockup size={88} glassHalo={false} compact />
        </div>
      )}

      {isDrawer && (
        <div
          style={{
            fontFamily: fontDisplay,
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: -0.08,
            color: color.muted,
            padding: "10px 10px 8px",
          }}
        >
          Browse
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {SIDEBAR_PRIMARY.map((item) => (
          <NavRow
            key={item.id}
            item={item}
            active={activeId === item.id}
            onClick={() => go(item)}
          />
        ))}
      </div>

      <div
        aria-hidden="true"
        style={{
          height: 1,
          margin: "12px 8px",
          background: "rgba(255,255,255,0.08)",
        }}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, minHeight: 0 }}>
        {SIDEBAR_TOOLS.map((item) => (
          <NavRow
            key={item.id}
            item={item}
            active={activeId === item.id}
            onClick={() => go(item)}
          />
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingTop: 8 }}>
        {showAdmin && (
          <NavRow
            item={{ id: "admin", label: "Admin", icon: "settings" }}
            active={activeId === "admin"}
            onClick={() => {
              onNavigate?.("admin");
              onClose?.();
            }}
          />
        )}
        <button
          type="button"
          className="nav-rail-btn"
          onClick={() => {
            onNavigate?.("profile");
            onClose?.();
          }}
          title={user?.name || "Club"}
          aria-label="Club"
          aria-current={activeId === "profile" ? "page" : undefined}
          style={{
            width: "100%",
            height: 44,
            borderRadius: radius.sm,
            background: activeId === "profile" ? "rgba(10, 132, 255, 0.22)" : "transparent",
            border: "1px solid transparent",
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "0 8px",
            fontSize: 14,
            cursor: "pointer",
            color: color.ink,
          }}
        >
          <span
            style={{
              width: 26,
              height: 26,
              borderRadius: 7,
              background: color.surfaceSolid,
              border: `1px solid ${glass.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 650,
              flexShrink: 0,
              fontFamily: fontDisplay,
            }}
          >
            {user?.image || (user?.name || "R").toString().trim().charAt(0).toUpperCase()}
          </span>
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontFamily: fontDisplay,
              fontWeight: 550,
              letterSpacing: -0.15,
            }}
          >
            {user?.name || "Club"}
          </span>
        </button>
      </div>
    </nav>
  );
}
