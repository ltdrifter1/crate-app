/**
 * SplashScreen — initial auth boot.
 * Logo only, oversized, transparent background. No copy.
 *
 * Lottie loads on demand (not in the main chunk). Prefer
 * public/brand/splash-loader.json when its `nm` is not a PLACEHOLDER.
 */
import { useEffect, useState, lazy, Suspense } from "react";
import { BRAND_NAME } from "../../theme";
import {
  BRAND_LOCKUP_SRC,
  BRAND_LOCKUP_SRCSET,
  BRAND_LOCKUP_WEBP,
} from "./BrandGlyphs";

const PUBLIC_LOTTIE_URL = "/brand/splash-loader.json";

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

function isPlaceholderAnimation(data) {
  if (!data || typeof data !== "object") return true;
  const nm = String(data.nm || "");
  return !nm || nm.startsWith("PLACEHOLDER");
}

function StaticLockup({ size, edge }) {
  const sizes = typeof edge === "string" ? edge : `${size}px`;
  return (
    <picture>
      <source type="image/webp" srcSet={BRAND_LOCKUP_WEBP} sizes={sizes} />
      <img
        src={BRAND_LOCKUP_SRC}
        srcSet={BRAND_LOCKUP_SRCSET}
        sizes={sizes}
        alt={BRAND_NAME}
        width={size}
        height={size}
        draggable={false}
        decoding="async"
        fetchPriority="high"
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          objectFit: "contain",
          background: "transparent",
        }}
      />
    </picture>
  );
}

/**
 * @param {object} [props]
 * @param {number} [props.size=220] — logo edge length (responsive capped)
 */
export default function SplashScreen({ size = 220 } = {}) {
  const reduced = usePrefersReducedMotion();
  const [animation, setAnimation] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch(PUBLIC_LOTTIE_URL, { cache: "no-cache" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (data && !isPlaceholderAnimation(data)) {
          setAnimation(data);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const edge = `min(${size}px, 56vw)`;
  const playLottie = !!animation && !reduced;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading"
      style={{
        minHeight: "100dvh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
        position: "relative",
        overflow: "hidden",
        margin: 0,
        padding: 0,
      }}
    >
      <div
        style={{
          width: edge,
          height: edge,
          maxWidth: "100%",
          position: "relative",
          flexShrink: 0,
          userSelect: "none",
          pointerEvents: "none",
        }}
      >
        {playLottie ? (
          <Suspense fallback={<StaticLockup size={size} edge={edge} />}>
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
              style={{ width: "100%", height: "100%", background: "transparent" }}
              aria-hidden
            />
          </Suspense>
        ) : (
          <StaticLockup size={size} edge={edge} />
        )}
      </div>
      <span className="sr-only">Loading Planet MP3</span>
    </div>
  );
}
