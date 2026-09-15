/**
 * Run work after the browser has committed at least one frame.
 * Home uses this so Channel Surfing / hero paint before catalog hydrate
 * and below-fold shelves compete for the main thread.
 */
export function runAfterPaint(fn) {
  if (typeof fn !== "function") return () => {};
  let cancelled = false;
  const run = () => {
    if (!cancelled) fn();
  };
  if (typeof requestAnimationFrame !== "function") {
    const id = setTimeout(run, 0);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }
  const outer = requestAnimationFrame(() => {
    requestAnimationFrame(run);
  });
  return () => {
    cancelled = true;
    if (typeof cancelAnimationFrame === "function") cancelAnimationFrame(outer);
  };
}
