/** Path ↔ screen mapping for shareable ROOMS URLs. */

export const SCREEN_TO_PATH = {
  rooms: "/rooms",
  home: "/home",
  favorites: "/discover",
  search: "/search",
  profile: "/you",
  map: "/map",
  admin: "/admin",
};

export const PATH_TO_SCREEN = {
  "/": "rooms",
  "/rooms": "rooms",
  "/home": "home",
  "/discover": "favorites",
  "/favorites": "favorites",
  "/search": "search",
  "/you": "profile",
  "/profile": "profile",
  "/map": "map",
  "/admin": "admin",
};

/** Parse location.pathname → { screen, roomId }. */
export function parsePath(pathname = "/") {
  const path = (pathname || "/").replace(/\/+$/, "") || "/";
  const roomMatch = path.match(/^\/rooms\/([^/]+)$/);
  if (roomMatch) {
    return { screen: "rooms", roomId: decodeURIComponent(roomMatch[1]) };
  }
  const screen = PATH_TO_SCREEN[path] || PATH_TO_SCREEN["/"];
  return { screen, roomId: null };
}

/** Build path for a screen (+ optional room id). */
export function buildPath(screen, roomId = null) {
  if (screen === "rooms" && roomId) {
    return `/rooms/${encodeURIComponent(roomId)}`;
  }
  return SCREEN_TO_PATH[screen] || "/rooms";
}

export function documentTitleFor(screen, roomLabel) {
  if (screen === "rooms" && roomLabel) return `${roomLabel} · ROOMS`;
  const labels = {
    rooms: "Rooms",
    home: "Home",
    favorites: "Discover",
    search: "Search",
    profile: "You",
    map: "Map",
    admin: "Admin",
  };
  return labels[screen] ? `${labels[screen]} · ROOMS` : "ROOMS";
}
