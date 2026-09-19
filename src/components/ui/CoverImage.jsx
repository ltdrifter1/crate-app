/**
 * Shared cover art image — always sized, lazy by default.
 * Remote Firebase Storage covers go through Cloudflare Image Resizing
 * (`/cdn-cgi/image/…`). One CF 404 disables resize for the session so Home
 * does not double-request every sleeve. Failed / missing photos show a disc.
 */
import { useEffect, useState } from "react";
import {
  coverDisplayUrl,
  coverSrcSet,
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
 * @param {boolean} [props.priority] — eager + fetchPriority=high (LCP)
 * @param {boolean} [props.eager] — eager load without stealing LCP priority
 * @param {boolean} [props.raw] — skip CDN/transform (channel photos, data URLs)
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
  objectPosition,
  style,
  className,
  draggable = false,
  onLoad,
  onError,
}) {
  const [failed, setFailed] = useState(false);
  const [useOriginal, setUseOriginal] = useState(false);

  useEffect(() => {
    setFailed(false);
    setUseOriginal(false);
  }, [src]);

  const w = Math.max(1, Math.round(Number(width) || 1));
  const h = Math.max(1, Math.round(Number(height) || w));

  if (!src || failed) {
    return <DefaultSleeve size={Math.min(w, h)} />;
  }

  const displaySrc = (!raw && !useOriginal)
    ? coverDisplayUrl(src, { width: w })
    : src;
  const srcSet = (!raw && !useOriginal)
    ? coverSrcSet(src, w)
    : undefined;

  return (
    <img
      src={displaySrc}
      srcSet={srcSet || undefined}
      alt={alt}
      width={w}
      height={h}
      sizes={sizes || `${w}px`}
      loading={priority || eager ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      draggable={draggable}
      className={className}
      onLoad={onLoad}
      onError={(e) => {
        if (!raw && !useOriginal && displaySrc !== src) {
          markCloudflareResizeUnavailable();
          setUseOriginal(true);
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
  );
}
