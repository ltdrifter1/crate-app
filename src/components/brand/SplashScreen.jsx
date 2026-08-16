/**
 * SplashScreen — initial auth boot.
 * Brand lockup stays hero-level; optional Lottie is a ring overlay only
 * when splash-loader.json is a real (non-PLACEHOLDER) animation.
 */
import { useEffect, useState, lazy, Suspense } from "react";
import { BRAND_NAME, chrome, fontMono, motion, y2k } from "../../theme";
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

function StaticLockup({ size, edge, reduced }) {
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
          position: "relative",
          zIndex: 1,
          animation: reduced ? "none" : `splashLockupIn 0.7s ${motion.ease} both`,
        }}
      />
    </picture>
  );
}

/**
 * @param {object} [props]
 * @param {number} [props.size=220] — logo edge length (responsive capped)
 * @param {string} [props.label="Loading…"] — visible boot status copy
 */
export default function SplashScreen({ size = 220, label = "Loading…" } = {}) {
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
      aria-busy="true"
      aria-label={label}
      style={{
        minHeight: "100dvh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 22,
        background: "transparent",
        position: "relative",
        overflow: "hidden",
        margin: 0,
        padding: 24,
        boxSizing: "border-box",
      }}
    >
      <style>{`
        @keyframes splashLockupIn {
          from { opacity: 0; transform: scale(0.94); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes splashRing {
          0%, 100% { opacity: 0.35; transform: scale(0.92); }
          50% { opacity: 0.7; transform: scale(1); }
        }
      `}</style>
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
        {/* Soft tuner ring — presence without replacing the brand lockup */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: "-8%",
            borderRadius: "50%",
            border: `1.5px solid rgba(${chrome.cyanRgb}, 0.45)`,
            boxShadow: `0 0 24px rgba(${chrome.cyanRgb}, 0.18)`,
            animation: reduced ? "none" : `splashRing 1.8s ${motion.ease} infinite`,
            zIndex: 0,
          }}
        />
        {playLottie && (
          <Suspense fallback={null}>
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: "-6%",
                zIndex: 0,
                opacity: 0.55,
              }}
            >
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
              />
            </div>
          </Suspense>
        )}
        <StaticLockup size={size} edge={edge} reduced={reduced} />
      </div>

      <p
        style={{
          margin: 0,
          fontFamily: fontMono,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 2.4,
          textTransform: "uppercase",
          color: y2k.chromeMid || "#8B939F",
          animation: reduced ? "none" : `breathe 1.4s ${motion.ease} infinite`,
        }}
      >
        {label}
      </p>

      {/* Quiet cyan hairline under the status — tuner signal */}
      <div
        aria-hidden="true"
        style={{
          width: 48,
          height: 2,
          borderRadius: 1,
          background: `linear-gradient(90deg, transparent, rgba(${chrome.cyanRgb},0.65), transparent)`,
          boxShadow: `0 0 12px rgba(${chrome.cyanRgb},0.35)`,
          animation: reduced ? "none" : `breathe 1.4s ${motion.ease} infinite`,
        }}
      />
    </div>
  );
}
