/**
 * PlanetMascot — hard-drawn Y2K ink planet for the Cover Stage hero.
 * Plays the pure-vector Lottie (`planet-mascot.json`): sphere, tapered swoosh,
 * decreasing dot trail, optional moons. No wordmark. Transparent bg.
 * Falls back to the static SVG frame when reduced-motion is preferred.
 */

import { useEffect, useState } from "react";
import Lottie from "lottie-react";
import planetMascotAnimation from "./planet-mascot.json";

const STATIC_SRC = "/brand/planet-mascot.svg";

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
      {live ? (
        <Lottie
          animationData={planetMascotAnimation}
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
      ) : (
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
      )}
    </div>
  );
}
