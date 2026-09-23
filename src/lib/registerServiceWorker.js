/**
 * App-shell service worker — fonts + hashed /static only.
 * index.html stays network-first so a deploy is never stuck on an old shell.
 */

export const SW_PATH = "/sw.js";

export function shouldRegisterServiceWorker({
  nodeEnv = typeof process !== "undefined" ? process.env.NODE_ENV : "",
  locator = typeof navigator !== "undefined" ? navigator : null,
} = {}) {
  return nodeEnv === "production" && typeof locator?.serviceWorker?.register === "function";
}

export function registerServiceWorker(opts = {}) {
  if (!shouldRegisterServiceWorker(opts)) return false;
  const win = opts.win || (typeof window !== "undefined" ? window : null);
  const locator = opts.locator || (typeof navigator !== "undefined" ? navigator : null);
  if (!win || !locator?.serviceWorker) return false;
  const path = opts.path || SW_PATH;
  const onLoad = () => {
    locator.serviceWorker.register(path).catch(() => {});
  };
  if (opts.immediate) {
    onLoad();
    return true;
  }
  win.addEventListener("load", onLoad, { once: true });
  return true;
}
