/**
 * Product IA — YouTube Music–style four destinations.
 * Charts and Search stay as routes, reached from Home / Explore chrome.
 */

export const PRIMARY_TABS = [
  { id: "home", label: "Home", icon: "home" },
  { id: "explore", label: "Explore", icon: "map" },
  { id: "favorites", label: "Library", icon: "dig" },
  { id: "profile", label: "Club", icon: "profile" },
];

const TAB_IDS = new Set(PRIMARY_TABS.map((t) => t.id));

/**
 * Map any screen (including Charts, Search, artist/album) to the dock tab
 * that should appear selected.
 */
export function dockActiveTab(screen, { hasAdmin = false } = {}) {
  if (TAB_IDS.has(screen)) return screen;
  if (screen === "admin" && hasAdmin) return "admin";
  if (screen === "charts") return "home";
  if (screen === "search" || screen === "artist" || screen === "album") return "explore";
  if (screen === "mix" || screen === "stack") return "favorites";
  return "home";
}

export function primaryNavItems({ showAdmin = false } = {}) {
  const items = PRIMARY_TABS.slice();
  if (showAdmin) items.push({ id: "admin", label: "Admin", icon: "settings" });
  return items;
}
