/**
 * Shared cover art image — always sized, lazy by default.
 * Defaults to the Storage original so Home photographs. Cloudflare
 * `/cdn-cgi/image` is opt-in; a CF 404 falls back to the original.
 * Failed photos show a disc on a color well.
 */
import { useEffect, useState } from "react";
import {
  coverDisplayUrl,
  coverSrcSet,
  markCloudflareResizeUnavailable,
  normalizeCoverSrc,
} from "../../lib/coverUrl";
import DefaultSleeve from "./DefaultSleeve";

/** Intrinsic attrs for a square cover at CSS `size` px. */
export function coverSizeAttrs(size) {
  const n = Math.max(1, Math.round(Number(size) || 1));
  return {
    width: n,
    height: n,
    sizes: `${n}px`,
  };
}

/**
 * @param {object} props
 * @param {string} [props.src]
 * @param {string} [props.alt]
 * @param {number} props.width
 * @param {number} props.height
 * @param {string} [props.sizes]
 * @param {boolean} [props.priority] — eager + fetchpriority=high (LCP)
 * @param {boolean} [props.eager] — eager load without stealing LCP priority
 * @param {boolean} [props.raw] — skip CDN/transform (channel photos, data URLs)
 * @param {string} [props.wellColor] — sleeve well while the photo loads
 * @param {string} [props.objectPosition] — CSS object-position for art crops
 * @param {object} [props.style]
 * @param {string} [props.className]
 * @param {boolean} [props.draggable]
 * @param {function} [props.onLoad]
 * @param {function} [props.onError]
 */
export default function CoverImage({
  src,
  alt = "",
  width,
  height,
  sizes,
  priority = false,
  eager = false,
  raw = false,
  wellColor = "",
  objectPosition,
  style,
  className,
  draggable = false,
  onLoad,
  onError,
}) {
  const [failed, setFailed] = useState(false);
  /** cf → thumb (firebase mode) → original. Originals always win over a blank tile. */
  const [tier, setTier] = useState("cf");
  const href = normalizeCoverSrc(src);

  useEffect(() => {
    setFailed(false);
    setTier("cf");
  }, [href]);

  const w = Math.max(1, Math.round(Number(width) || 1));
  const h = Math.max(1, Math.round(Number(height) || w));

  if (!href || failed) {
    return <DefaultSleeve size={Math.min(w, h)} color={wellColor} />;
  }

  let displaySrc = href;
  let srcSet;
  if (!raw) {
    if (tier === "original") {
      displaySrc = href;
      srcSet = undefined;
    } else {
      displaySrc = coverDisplayUrl(href, { width: w });
      srcSet = coverSrcSet(href, w) || undefined;
    }
  }

  return (
    <span
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        background: wellColor || undefined,
        overflow: "hidden",
      }}
    >
      <img
        src={displaySrc}
        srcSet={srcSet || undefined}
        alt={alt}
        width={w}
        height={h}
        sizes={sizes || `${w}px`}
        loading={priority || eager ? "eager" : "lazy"}
        // React 18 only forwards the lowercase DOM attribute; the camelCase prop
        // logged a warning for every image on every screen and buried real errors.
        fetchpriority={priority ? "high" : "auto"}
        decoding="async"
        draggable={draggable}
        className={className}
        referrerPolicy="no-referrer"
        onLoad={onLoad}
        onError={(e) => {
          if (!raw && displaySrc !== href && tier !== "original") {
            if (String(displaySrc).includes("/cdn-cgi/image/")) {
              markCloudflareResizeUnavailable();
            }
            setTier("original");
            return;
          }
          setFailed(true);
          onError?.(e);
        }}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: objectPosition || "center",
          display: "block",
          ...style,
        }}
      />
    </span>
  );
}
