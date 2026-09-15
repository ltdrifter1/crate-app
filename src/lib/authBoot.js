/**
 * Firebase redirect result is only needed after an OAuth full-page bounce.
 * Calling getRedirectResult on every cold boot adds a persistence round-trip
 * before Home can paint.
 */
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
