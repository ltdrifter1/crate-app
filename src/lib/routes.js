/** Path ↔ screen mapping for shareable URLs. Home is the start page. */
import { BRAND_NAME } from "../theme";

export const SCREEN_TO_PATH = {
  home: "/home",
  favorites: "/discover",
  search: "/search",
  profile: "/you",
  admin: "/admin",
  artist: "/artist",
  album: "/album",
  mix: "/mix",
};

export const PATH_TO_SCREEN = {
  "/": "home",
  "/home": "home",
  "/discover": "favorites",
  "/favorites": "favorites",
  "/search": "search",
  "/you": "profile",
  "/profile": "profile",
  "/admin": "admin",
  // Retired surfaces — redirect to Home
  "/rooms": "home",
  "/map": "home",
  "/paths": "home",
};

/**
 * Parse location.pathname → route state.
 * { screen, roomId, artistSlug, albumSlug, pathId, mixId }
 */
export function parsePath(pathname = "/") {
  const path = (pathname || "/").replace(/\/+$/, "") || "/";

  // Legacy room / path deep links → Home
  if (/^\/rooms(\/|$)/.test(path) || /^\/paths(\/|$)/.test(path) || path === "/map") {
    return emptyExtras({ screen: "home" });
  }

  const artistMatch = path.match(/^\/artist\/([^/]+)$/);
  if (artistMatch) {
    return emptyExtras({ screen: "artist", artistSlug: decodeURIComponent(artistMatch[1]) });
  }

  const albumMatch = path.match(/^\/album\/([^/]+)$/);
  if (albumMatch) {
    return emptyExtras({ screen: "album", albumSlug: decodeURIComponent(albumMatch[1]) });
  }

  const mixMatch = path.match(/^\/mix\/([^/]+)$/);
  if (mixMatch) {
    return emptyExtras({ screen: "mix", mixId: decodeURIComponent(mixMatch[1]) });
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
    mixId: null,
    ...base,
  };
}

/**
 * Build path for a screen.
 * param: string id OR { roomId | artistSlug | albumSlug | pathId | mixId }
 */
export function buildPath(screen, param = null) {
  const p = normalizeParam(param);

  if (screen === "artist" && p.artistSlug) {
    return `/artist/${encodeURIComponent(p.artistSlug)}`;
  }
  if (screen === "album" && p.albumSlug) {
    return `/album/${encodeURIComponent(p.albumSlug)}`;
  }
  if (screen === "mix" && p.mixId) {
    return `/mix/${encodeURIComponent(p.mixId)}`;
  }
  if (screen === "artist") return "/search";
  if (screen === "album") return "/search";
  if (screen === "mix") return "/discover";

  // Retired screens land on Home
  if (screen === "rooms" || screen === "paths" || screen === "map" || screen === "drift") {
    return "/home";
  }

  return SCREEN_TO_PATH[screen] || "/home";
}

function normalizeParam(param) {
  if (param == null) return {};
  if (typeof param === "string") {
    return { roomId: param, artistSlug: param, albumSlug: param, pathId: param, mixId: param };
  }
  return param;
}

export function documentTitleFor(screen, label) {
  if (label) return `${label} · ${BRAND_NAME}`;
  const labels = {
    home: "Home",
    favorites: "Your Saved Tracks",
    search: "Search",
    profile: "You",
    admin: "Admin",
    artist: "Artist",
    album: "Album",
    mix: "Mixtape",
  };
  return labels[screen] ? `${labels[screen]} · ${BRAND_NAME}` : BRAND_NAME;
}
