/**
 * Tactile feedback — one delegated listener gives every button a light haptic
 * tick on press. Best-effort: silent where vibrate() is unsupported, and skipped
 * when the user prefers reduced motion or the control opts out.
 */
export function tick(ms = 6) {
  try {
    if (typeof navigator === "undefined" || !navigator.vibrate) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    navigator.vibrate(ms);
  } catch {
    /* best-effort */
  }
}

export function installButtonFeedback(doc = typeof document !== "undefined" ? document : null) {
  if (!doc) return () => {};
  const onDown = (e) => {
    const el = e.target?.closest?.("button, [role='button']");
    if (!el || el.disabled || el.getAttribute("aria-disabled") === "true") return;
    if (el.closest("[data-no-haptic]")) return;
    tick(el.hasAttribute("data-haptic-strong") ? 12 : 6);
  };
  doc.addEventListener("pointerdown", onDown, { passive: true });
  return () => doc.removeEventListener("pointerdown", onDown);
}
