/**
 * Shared cover art image — always sized, lazy by default.
 * Remote Firebase Storage covers go through Cloudflare Image Resizing
 * (`/cdn-cgi/image/…`). One CF 404 switches the session to Firebase thumbs
 * — never original masters on rails. Failed photos show a disc on a color well.
 */
import { useEffect, useState } from "react";
import {
  coverDisplayUrl,
  coverSrcSet,
  firebaseThumbUrl,
  markCloudflareResizeUnavailable,
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
  /** cf → thumb → original. Never jump straight to the master JPEG. */
  const [tier, setTier] = useState("cf");

  useEffect(() => {
    setFailed(false);
    setTier("cf");
  }, [src]);

  const w = Math.max(1, Math.round(Number(width) || 1));
  const h = Math.max(1, Math.round(Number(height) || w));

  if (!src || failed) {
    return <DefaultSleeve size={Math.min(w, h)} color={wellColor} />;
  }

  let displaySrc = src;
  let srcSet;
  if (!raw) {
    if (tier === "original") {
      displaySrc = src;
      srcSet = undefined;
    } else if (tier === "thumb") {
      displaySrc = firebaseThumbUrl(src, w);
      srcSet = undefined;
    } else {
      displaySrc = coverDisplayUrl(src, { width: w });
      srcSet = coverSrcSet(src, w) || undefined;
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
        onLoad={onLoad}
        onError={(e) => {
          if (!raw && tier === "cf" && displaySrc !== src) {
            markCloudflareResizeUnavailable();
            setTier("thumb");
            return;
          }
          if (!raw && tier === "thumb" && displaySrc !== src) {
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
