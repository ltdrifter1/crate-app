/**
 * Product IA — four dock destinations (MP3 player first):
 * Home / Library / Discover / Profile. Club membership lives on Profile.
 * Charts and Build a set stay overflow (desktop source list + mobile More).
 * Admin stays in the source list, never on the consumer dock.
 */

export const PRIMARY_TABS = [
  { id: "home",      label: "Home",     icon: "home"    },
  { id: "favorites", label: "Library",  icon: "dig"     },
  { id: "explore",   label: "Discover", icon: "map"     },
  { id: "profile",   label: "Profile",  icon: "profile" },
];

/** Primary destinations in the left source list. */
export const SIDEBAR_PRIMARY = PRIMARY_TABS.slice(0, 3).map((item) => ({
  ...item,
  kind: "screen",
}));

/** First-class tools — not dock tabs. */
export const SIDEBAR_TOOLS = [
  { id: "charts", label: "Charts",      icon: "chart",    kind: "screen" },
  { id: "set",    label: "Build a set", icon: "timedmix", kind: "action" },
];

const TAB_IDS = new Set(PRIMARY_TABS.map((t) => t.id));

/** Dock tabs stay mounted so sleeves / scroll do not reload on return. */
export const KEEP_ALIVE_SCREENS = PRIMARY_TABS.map((t) => t.id);

export function isKeepAliveScreen(screen) {
  return TAB_IDS.has(screen);
}

/**
 * Map any screen (including Charts, Search, artist/album) to the dock tab
 * that should appear selected.
 */
export function dockActiveTab(screen, { hasAdmin = false } = {}) {
  if (TAB_IDS.has(screen)) return screen;
  if (screen === "admin" && hasAdmin) return "admin";
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
