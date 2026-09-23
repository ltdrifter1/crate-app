/**
 * Firebase redirect result is only needed after an OAuth full-page bounce.
 * Calling getRedirectResult on every cold boot adds a persistence round-trip
 * before Home can paint.
 */

/** Sync localStorage flag so returning members can paint Home before Auth resolves. */
export const AUTH_SESSION_KEY = "planetmp3.authed";

function readStorage(store, key) {
  if (!store) return null;
  try {
    return store.getItem(key);
  } catch {
    return null;
  }
}

export function peekAuthSession(store = typeof localStorage !== "undefined" ? localStorage : null) {
  if (!store) return false;
  try {
    if (readStorage(store, AUTH_SESSION_KEY) === "1") return true;
    const len = store.length || 0;
    for (let i = 0; i < len; i += 1) {
      const key = store.key(i) || "";
      if (key.startsWith("firebase:authUser:")) return true;
    }
  } catch {
    return false;
  }
  return false;
}

export function markAuthSession(store = typeof localStorage !== "undefined" ? localStorage : null) {
  if (!store) return false;
  try {
    store.setItem(AUTH_SESSION_KEY, "1");
    return true;
  } catch {
    return false;
  }
}

export function clearAuthSession(store = typeof localStorage !== "undefined" ? localStorage : null) {
  if (!store) return false;
  try {
    store.removeItem(AUTH_SESSION_KEY);
    return true;
  } catch {
    return false;
  }
}

export function hasPendingAuthRedirect(win = typeof window !== "undefined" ? window : null) {
  if (!win) return false;
  try {
    const search = String(win.location?.search || "");
    const hash = String(win.location?.hash || "");
    if (/[?&]apiKey=/.test(search) || /[?&]oobCode=/.test(search)) return true;
    if (hash.includes("access_token") || hash.includes("id_token")) return true;
    const storage = win.sessionStorage;
    if (!storage) return false;
    for (let i = 0; i < storage.length; i += 1) {
      const key = storage.key(i) || "";
      if (/firebase:.*(pendingRedirect|redirect)/i.test(key)) return true;
    }
  } catch {
    return false;
  }
  return false;
}
