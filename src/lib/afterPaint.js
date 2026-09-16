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

/**
 * Run after the first paints + network have had a beat.
 * Full-catalog hydrate uses this so Home images aren't fighting Firestore.
 */
export function runWhenIdle(fn, { timeout = 1200 } = {}) {
  if (typeof fn !== "function") return () => {};
  let cancelled = false;
  const run = () => {
    if (!cancelled) fn();
  };
  if (typeof requestIdleCallback === "function") {
    const id = requestIdleCallback(run, { timeout });
    return () => {
      cancelled = true;
      if (typeof cancelIdleCallback === "function") cancelIdleCallback(id);
    };
  }
  const delay = Math.max(0, Math.min(Number(timeout) || 1200, 1200));
  const id = setTimeout(run, delay);
  return () => {
    cancelled = true;
    clearTimeout(id);
  };
}
