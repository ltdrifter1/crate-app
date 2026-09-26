/**
 * Catalog cover display URLs — Firebase Storage originals are heavy
 * for 168px Home tiles. Prefer Cloudflare Image Resizing (same-origin
 * `/cdn-cgi/image/…`). If CF is down (local CRA, missing zone, 404),
 * show the original. Empty tiles are worse than a larger JPEG.
 *
 * Optional: Firebase "Resize Images" extension thumbs when
 * REACT_APP_COVER_RESIZE=firebase (Luke enables the extension).
 */

export const ORIGINAL_COVER_MIN_PX = 640;
export const ORIGINAL_COVER_MIN_CSS_PX = ORIGINAL_COVER_MIN_PX;
export const COVER_WIDTH_BUCKETS = [80, 168, 336, 480, 640, 800, 960, 1280];
export const FIREBASE_THUMB_SIZES = [200, 400, 800];

/** Rails stay on thumbs. Only the immersive stage may fetch the Storage master. */
export function allowOriginalCover(cssPx) {
  return Math.max(0, Number(cssPx) || 0) >= ORIGINAL_COVER_MIN_PX;
}

const STORAGE_HOST_SUFFIXES = [
  "storage.googleapis.com",
  "firebasestorage.googleapis.com",
  "firebasestorage.app",
];

/** Session circuit-breaker: one /cdn-cgi/image 404 turns CF off for everyone. */
let cloudflareResizeOk = true;

export function isCloudflareResizeAvailable() {
  return cloudflareResizeOk;
}

export function markCloudflareResizeUnavailable() {
  cloudflareResizeOk = false;
}

export function resetCloudflareResizeForTests() {
  cloudflareResizeOk = true;
}

/** CRA / local Vite never serve `/cdn-cgi/image`. Jest keeps CF so unit tests stay honest. */
export function isLocalCoverHost() {
  if (typeof process !== "undefined" && process.env.NODE_ENV === "test") return false;
  if (typeof window === "undefined") return false;
  const host = String(window.location?.hostname || "").toLowerCase();
  return host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0";
}

function envResizeMode() {
  const raw = typeof process !== "undefined" ? process.env.REACT_APP_COVER_RESIZE : "";
  const mode = String(raw || "cf").trim().toLowerCase();
  if (mode === "off" || mode === "0" || mode === "false" || mode === "none") return "off";
  if (mode === "firebase" || mode === "ext" || mode === "thumbs") return "firebase";
  if (isLocalCoverHost()) return "off";
  return "cf";
}

/** gs://bucket/path → HTTPS download URL. Trim junk so img src is always fetchable. */
export function normalizeCoverSrc(src) {
  if (!src || typeof src !== "string") return "";
  const value = src.trim();
  if (!value) return "";
  if (value.startsWith("gs://")) {
    const rest = value.slice(5);
    const slash = rest.indexOf("/");
    if (slash < 1) return "";
    const bucket = rest.slice(0, slash);
    const objectPath = rest.slice(slash + 1);
    if (!bucket || !objectPath) return "";
    return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(objectPath)}?alt=media`;
  }
  return value;
}

export function isRemoteCoverUrl(src) {
  if (!src || typeof src !== "string") return false;
  const value = src.trim();
  if (!value) return false;
  if (value.startsWith("data:") || value.startsWith("blob:")) return false;
  if (value.startsWith("/") && !value.startsWith("//")) return false;
  try {
    const url = new URL(value, "https://planetmp3.invalid");
    const host = url.hostname.toLowerCase();
    return STORAGE_HOST_SUFFIXES.some((suffix) => host === suffix || host.endsWith(`.${suffix}`));
  } catch {
    return false;
  }
}

/** Snap CSS px × DPR to a small set of CDN cache keys. */
export function coverResizeWidth(cssPx, dpr = 2) {
  const css = Math.max(1, Math.round(Number(cssPx) || 168));
  const ratio = Math.min(3, Math.max(1, Number(dpr) || 2));
  const target = Math.round(css * ratio);
  return COVER_WIDTH_BUCKETS.find((b) => b >= target) || COVER_WIDTH_BUCKETS[COVER_WIDTH_BUCKETS.length - 1];
}

export function nearestFirebaseThumbSize(width) {
  const w = Math.max(1, Math.round(Number(width) || 336));
  return FIREBASE_THUMB_SIZES.find((s) => s >= w) || FIREBASE_THUMB_SIZES[FIREBASE_THUMB_SIZES.length - 1];
}

function injectSizeSuffix(filename, size) {
  const name = String(filename || "");
  if (!name) return name;
  if (/_\d+x\d+(\.[a-z0-9]+)?$/i.test(name)) return name;
  const i = name.lastIndexOf(".");
  if (i < 1) return `${name}_${size}x${size}`;
  return `${name.slice(0, i)}_${size}x${size}${name.slice(i)}`;
}

/** Firebase Resize Images extension convention: `file_200x200.jpg` beside the original. */
export function firebaseThumbUrl(src, width) {
  if (!src) return "";
  const size = nearestFirebaseThumbSize(width);
  try {
    const url = new URL(src);
    if (url.hostname === "firebasestorage.googleapis.com") {
      const marker = "/o/";
      const idx = url.pathname.indexOf(marker);
      if (idx < 0) return src;
      const encoded = url.pathname.slice(idx + marker.length);
      const path = decodeURIComponent(encoded);
      const slash = path.lastIndexOf("/");
      const dir = slash >= 0 ? path.slice(0, slash + 1) : "";
      const file = slash >= 0 ? path.slice(slash + 1) : path;
      const nextPath = `${dir}${injectSizeSuffix(file, size)}`;
      url.pathname = `${url.pathname.slice(0, idx + marker.length)}${encodeURIComponent(nextPath)}`;
      return url.toString();
    }
    const parts = url.pathname.split("/");
    const file = parts[parts.length - 1];
    if (!file) return src;
    parts[parts.length - 1] = injectSizeSuffix(file, size);
    url.pathname = parts.join("/") || "/";
    return url.toString();
  } catch {
    return src;
  }
}

/**
 * Cloudflare Image Resizing URL.
 * Requires Image Resizing enabled on the zone + allowlisted Storage hosts.
 * CoverImage falls back to the original src if this 404s.
 */
export function cloudflareImageUrl(src, { width, quality = 72 } = {}) {
  if (!src) return "";
  if (src.includes("/cdn-cgi/image/")) return src;
  const w = Math.max(16, Math.round(Number(width) || 336));
  const q = Math.min(90, Math.max(40, Math.round(Number(quality) || 72)));
  return `/cdn-cgi/image/width=${w},height=${w},fit=cover,quality=${q},format=auto/${src}`;
}

/**
 * @param {string} src
 * @param {{ width?: number, quality?: number, mode?: string }} [opts]
 */
export function coverDisplayUrl(src, opts = {}) {
  const href = normalizeCoverSrc(src);
  if (!href) return "";
  const mode = opts.mode || envResizeMode();
  if (mode === "off") return href;
  if (!isRemoteCoverUrl(href)) return href;
  const width = coverResizeWidth(opts.width || 168, opts.dpr);
  const quality = opts.quality;
  if (mode === "firebase") return firebaseThumbUrl(href, width);
  // One CF 404 turns the session onto originals so tiles still photograph.
  if (!cloudflareResizeOk) return href;
  return cloudflareImageUrl(href, { width, quality });
}

/** `1x, 2x` srcset so 1× screens skip the retina bucket. */
export function coverSrcSet(src, cssPx, opts = {}) {
  const href = normalizeCoverSrc(src);
  if (!href) return "";
  const mode = opts.mode || envResizeMode();
  const one = coverDisplayUrl(href, { ...opts, width: cssPx, dpr: 1 });
  const two = coverDisplayUrl(href, { ...opts, width: cssPx, dpr: 2 });
  if (!one || one === two) return "";
  return `${one} 1x, ${two} 2x`;
}
