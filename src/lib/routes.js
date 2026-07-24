/** Path ↔ screen mapping for shareable ROOMS URLs. */

export const SCREEN_TO_PATH = {
  rooms: "/rooms",
  home: "/home",
  favorites: "/discover",
  search: "/search",
  profile: "/you",
  map: "/map",
  admin: "/admin",
  paths: "/paths",
  artist: "/artist",
  album: "/album",
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
  "/paths": "paths",
};

/**
 * Parse location.pathname → route state.
 * { screen, roomId, artistSlug, albumSlug, pathId }
 */
export function parsePath(pathname = "/") {
  const path = (pathname || "/").replace(/\/+$/, "") || "/";

  const roomMatch = path.match(/^\/rooms\/([^/]+)$/);
  if (roomMatch) {
    return emptyExtras({ screen: "rooms", roomId: decodeURIComponent(roomMatch[1]) });
  }

  const artistMatch = path.match(/^\/artist\/([^/]+)$/);
  if (artistMatch) {
    return emptyExtras({ screen: "artist", artistSlug: decodeURIComponent(artistMatch[1]) });
  }

  const albumMatch = path.match(/^\/album\/([^/]+)$/);
  if (albumMatch) {
    return emptyExtras({ screen: "album", albumSlug: decodeURIComponent(albumMatch[1]) });
  }

  const pathMatch = path.match(/^\/paths\/([^/]+)$/);
  if (pathMatch) {
    return emptyExtras({ screen: "paths", pathId: decodeURIComponent(pathMatch[1]) });
  }

  const screen = PATH_TO_SCREEN[path] || PATH_TO_SCREEN["/"];
  return emptyExtras({ screen });
}

function emptyExtras(base) {
  return {
    roomId: null,
    artistSlug: null,
    albumSlug: null,
    pathId: null,
    ...base,
  };
}

/**
 * Build path for a screen.
 * param: string id OR { roomId | artistSlug | albumSlug | pathId }
 */
export function buildPath(screen, param = null) {
  const p = normalizeParam(param);

  if (screen === "rooms" && p.roomId) {
    return `/rooms/${encodeURIComponent(p.roomId)}`;
  }
  if (screen === "artist" && p.artistSlug) {
    return `/artist/${encodeURIComponent(p.artistSlug)}`;
  }
  if (screen === "album" && p.albumSlug) {
    return `/album/${encodeURIComponent(p.albumSlug)}`;
  }
  if (screen === "paths" && p.pathId) {
    return `/paths/${encodeURIComponent(p.pathId)}`;
  }
  if (screen === "paths") return "/paths";
  if (screen === "artist") return "/search";
  if (screen === "album") return "/search";

  return SCREEN_TO_PATH[screen] || "/rooms";
}

function normalizeParam(param) {
  if (param == null) return {};
  if (typeof param === "string") {
    // Heuristic: callers pass roomId / slug as bare string depending on screen
    return { roomId: param, artistSlug: param, albumSlug: param, pathId: param };
  }
  return param;
}

export function documentTitleFor(screen, label) {
  if (label) return `${label} · ROOMS`;
  const labels = {
    rooms: "Rooms",
    home: "Home",
    favorites: "Dig",
    search: "Search",
    profile: "You",
    map: "Map",
    admin: "Admin",
    paths: "Paths",
    artist: "Artist",
    album: "Album",
  };
  return labels[screen] ? `${labels[screen]} · ROOMS` : "ROOMS";
}
