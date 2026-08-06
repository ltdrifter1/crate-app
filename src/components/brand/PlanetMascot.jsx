/**
 * PlanetMascot — hard-drawn Y2K ink planet for the Cover Stage hero.
 * Lottie + animation JSON load on demand (not in the main chunk).
 * Falls back to the static SVG frame when reduced-motion is preferred
 * or while the animation chunk is loading.
 */

import { useEffect, useState, lazy, Suspense } from "react";

const STATIC_SRC = "/brand/planet-mascot.svg";
const PUBLIC_LOTTIE_URL = "/brand/planet-mascot.json";

const LazyLottie = lazy(() =>
  import("lottie-react").then((m) => ({ default: m.default }))
);

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(!!mq.matches);
    sync();
    mq.addEventListener?.("change", sync);
    return () => mq.removeEventListener?.("change", sync);
  }, []);
  return reduced;
}

function StaticFrame({ size }) {
  return (
    <img
      src={STATIC_SRC}
      alt=""
      width={size}
      height={size}
      draggable={false}
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        objectFit: "contain",
      }}
    />
  );
}

/**
 * @param {object} props
 * @param {number} [props.size=340]
 * @param {string} [props.title="Planet MP3"]
 * @param {boolean} [props.animated=true]
 */
export default function PlanetMascot({
  size = 340,
  title = "Planet MP3",
  animated = true,
}) {
  const reduced = usePrefersReducedMotion();
  const live = animated && !reduced;
  const [animation, setAnimation] = useState(null);

  useEffect(() => {
    if (!live) return undefined;
    let cancelled = false;
    fetch(PUBLIC_LOTTIE_URL, { cache: "force-cache" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data) setAnimation(data);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [live]);

  return (
    <div
      role="img"
      aria-label={title}
      style={{
        width: size,
        height: size,
        maxWidth: "100%",
        margin: "0 auto",
        position: "relative",
        display: "block",
        flexShrink: 0,
        userSelect: "none",
        pointerEvents: "none",
      }}
    >
      {live && animation ? (
        <Suspense fallback={<StaticFrame size={size} />}>
          <LazyLottie
            animationData={animation}
            loop
            autoplay
            rendererSettings={{
              preserveAspectRatio: "xMidYMid meet",
              clearCanvas: true,
              progressiveLoad: true,
              hideOnTransparent: true,
            }}
            style={{ width: "100%", height: "100%" }}
            aria-hidden
          />
        </Suspense>
      ) : (
        <StaticFrame size={size} />
      )}
    </div>
  );
}
