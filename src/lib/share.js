/**
 * Share helpers — Web Share API with clipboard fallback.
 */

export async function shareOrCopy({ title, text, url }) {
  const payload = {
    title: title || "Planet MP3",
    text: text || "",
    url: url || (typeof window !== "undefined" ? window.location.href : ""),
  };

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share(payload);
      return { method: "share", ok: true };
    } catch (e) {
      if (e?.name === "AbortError") return { method: "share", ok: false, aborted: true };
      // fall through to clipboard
    }
  }

  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(payload.url);
      return { method: "clipboard", ok: true };
    }
  } catch {
    /* ignore */
  }

  return { method: "none", ok: false };
}

export function absoluteAppUrl(path = "/") {
  if (typeof window === "undefined") return path;
  try {
    return new URL(path, window.location.origin).toString();
  } catch {
    return path;
  }
}
