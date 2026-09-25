import { color, fontDisplay, fontMono, glass, radio, radius } from "../../theme";
import { BrandLockup } from "../brand/BrandMark";
import Icon from "../ui/Icon";
import {
  SIDEBAR_PRIMARY,
  SIDEBAR_TOOLS,
  sidebarActiveId,
} from "../../lib/nav";
import { SCENE_CHANNELS } from "../../lib/sceneChannels";

/** Source-list group label — the rack idiom, not a settings menu. */
function RailLabel({ children }) {
  return (
    <div
      style={{
        fontFamily: fontMono,
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: 0.22,
        textTransform: "uppercase",
        color: color.faint,
        padding: "0 11px 6px",
      }}
    >
      {children}
    </div>
  );
}

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
          ? "rgba(91,101,116,0.12)"
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
          ? "inset 2px 0 0 #5B6574, inset 0 1px 0 rgba(216,223,232,0.35)"
          : "none",
      }}
    >
      <span style={{ width: 18, display: "flex", justifyContent: "center", flexShrink: 0, color: active ? color.accent : color.muted }}>
        <Icon name={item.icon} size={16} />
      </span>
      <span
        style={{
          fontFamily: fontDisplay,
          fontSize: 13,
          fontWeight: active ? 700 : 600,
          letterSpacing: 0.08,
          textTransform: "uppercase",
          lineHeight: 1.2,
        }}
      >
        {item.label}
      </span>
    </button>
  );
}

/**
 * Left source list — desktop rail keeps Home / Library / Discover.
 * Mobile More drawer is overflow only: Charts + Build a set.
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
      aria-label={isDrawer ? "More" : "Source list"}
      style={{
        width: isDrawer ? "100%" : 232,
        flexShrink: 0,
        height: "100%",
        background: isDrawer
          ? color.canvas
          : radio.moduleFace,
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
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 0.14,
            textTransform: "uppercase",
            color: color.muted,
            padding: "10px 10px 8px",
          }}
        >
          More
        </div>
      )}

      {!isDrawer && (
        <>
          <RailLabel>Dial</RailLabel>
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
              background: "rgba(91,101,116,0.18)",
            }}
          />
        </>
      )}

      {!isDrawer && <RailLabel>Tools</RailLabel>}
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

      {isDrawer && showAdmin && (
        <div style={{ paddingTop: 8 }}>
          <NavRow
            item={{ id: "admin", label: "Admin", icon: "settings" }}
            active={activeId === "admin"}
            onClick={() => {
              onNavigate?.("admin");
              onClose?.();
            }}
          />
        </div>
      )}

      {!isDrawer && (
        <div
          aria-hidden="true"
          style={{
            fontFamily: fontMono,
            fontSize: 8,
            fontWeight: 600,
            letterSpacing: 0.28,
            textTransform: "uppercase",
            color: "rgba(61,70,84,0.34)",
            lineHeight: 1.7,
            padding: "0 11px 10px",
            borderTop: "1px solid rgba(91,101,116,0.14)",
            paddingTop: 10,
            marginTop: 8,
          }}
        >
          Planet MP3
          <br />
          {SCENE_CHANNELS.length} CH · 320 KBPS · STEREO
        </div>
      )}

      {!isDrawer && (
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
            title={user?.name || "Profile"}
            aria-label="Profile"
            aria-current={activeId === "profile" ? "page" : undefined}
            style={{
              width: "100%",
              height: 44,
              borderRadius: radius.sm,
              background: activeId === "profile" ? "rgba(91, 101, 116, 0.16)" : "transparent",
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
              {user?.name || "Profile"}
            </span>
          </button>
        </div>
      )}
    </nav>
  );
}
