/**
 * HTML boot planet lives *outside* #root so React does not remount a second
 * splash. Dismiss once the app has a real surface (login or Home).
 */
export const BOOT_SPLASH_ID = "boot-splash";

export function dismissBootSplash(doc = typeof document !== "undefined" ? document : null) {
  if (!doc) return false;
  const el = doc.getElementById(BOOT_SPLASH_ID);
  if (!el) return false;
  el.setAttribute("hidden", "");
  el.setAttribute("aria-busy", "false");
  el.style.display = "none";
  return true;
}

export function isBootSplashVisible(doc = typeof document !== "undefined" ? document : null) {
  if (!doc) return false;
  const el = doc.getElementById(BOOT_SPLASH_ID);
  if (!el) return false;
  if (el.hasAttribute("hidden")) return false;
  const display = el.style?.display;
  return display !== "none";
}
