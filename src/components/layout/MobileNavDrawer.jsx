import { color } from "../../theme";
import AppSidebar from "./AppSidebar";
import Icon from "../ui/Icon";

/**
 * Mobile source list — same IA as the desktop left rail.
 * Does not replace the four primary dock tabs.
 */
export default function MobileNavDrawer({
  open,
  onClose,
  screen,
  buildingSet = false,
  onNavigate,
  onBuildSet = null,
  user = null,
  showAdmin = false,
}) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Browse"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 80,
        display: "flex",
      }}
    >
      <div
        style={{
          width: "min(300px, 86vw)",
          height: "100%",
          background: color.canvas,
          borderRight: "1px solid rgba(216,223,232,0.08)",
          boxShadow: "12px 0 40px rgba(58,66,80,0.45)",
          display: "flex",
          flexDirection: "column",
          paddingTop: "env(safe-area-inset-top, 0px)",
          animation: "rise 0.28s cubic-bezier(0.22,1,0.36,1) both",
        }}
      >
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "10px 10px 0" }}>
          <button
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            className="pmp-press"
            style={{
              width: 36,
              height: 36,
              border: "none",
              borderRadius: 10,
              background: "rgba(216,223,232,0.06)",
              color: color.ink,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="x" size={16} />
          </button>
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          <AppSidebar
            variant="drawer"
            screen={screen}
            buildingSet={buildingSet}
            onNavigate={onNavigate}
            onBuildSet={onBuildSet}
            onClose={onClose}
            user={user}
            showAdmin={showAdmin}
          />
        </div>
      </div>
      <button
        type="button"
        aria-label="Close menu"
        onClick={onClose}
        style={{
          flex: 1,
          border: "none",
          background: "rgba(58,66,80,0.52)",
          cursor: "pointer",
        }}
      />
    </div>
  );
}
