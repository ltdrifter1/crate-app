/**
 * Product IA — four dock destinations (device selector).
 * Charts and Build a set live in the desktop source list and the mobile More drawer.
 * Admin stays in the source list, not on the consumer dock.
 */

export const PRIMARY_TABS = [
  { id: "home",      label: "Home",    icon: "home"    },
  { id: "explore",   label: "Explore", icon: "map"     },
  { id: "charts",    label: "Charts",  icon: "chart"   },
  { id: "favorites", label: "Library", icon: "dig"     },
];

/** Primary destinations in the left source list (same four as the dock). */
export const SIDEBAR_PRIMARY = PRIMARY_TABS.slice(0, 3).map((item) => ({
  ...item,
  kind: "screen",
}));

/** First-class tools — not dock tabs. */
export const SIDEBAR_TOOLS = [
  { id: "profile", label: "Club",        icon: "profile",   kind: "screen" },
  { id: "set",     label: "Build a set", icon: "timedmix",  kind: "action" },
];

const TAB_IDS = new Set(PRIMARY_TABS.map((t) => t.id));

/**
 * Map any screen (including Charts, Search, artist/album) to the dock tab
 * that should appear selected.
 */
export function dockActiveTab(screen, { hasAdmin = false } = {}) {
  if (TAB_IDS.has(screen)) return screen;
  if (screen === "admin" && hasAdmin) return "admin";
  if (screen === "charts") return "charts";
  if (screen === "search" || screen === "artist" || screen === "album") return "explore";
  if (screen === "mix" || screen === "stack") return "favorites";
  return "home";
}

/** Which source-list row should appear selected. */
export function sidebarActiveId(screen, { buildingSet = false } = {}) {
  if (buildingSet) return "set";
  if (screen === "charts") return "charts";
  if (screen === "admin") return "admin";
  if (screen === "profile") return "profile";
  return dockActiveTab(screen);
}

export function primaryNavItems(_opts = {}) {
  return PRIMARY_TABS.slice();
}
