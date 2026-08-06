/**
 * Shared cover art image — always sized, lazy by default.
 * Use for list thumbs and sleeves so the browser can reserve layout
 * and skip decoding offscreen art.
 */
import { useState } from "react";

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
 * @param {boolean} [props.priority] — eager load (hero / above-fold)
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
  style,
  className,
  draggable = false,
  onLoad,
  onError,
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return null;

  const w = Math.max(1, Math.round(Number(width) || 1));
  const h = Math.max(1, Math.round(Number(height) || w));

  return (
    <img
      src={src}
      alt={alt}
      width={w}
      height={h}
      sizes={sizes || `${w}px`}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      draggable={draggable}
      className={className}
      onLoad={onLoad}
      onError={(e) => {
        setFailed(true);
        onError?.(e);
      }}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block",
        ...style,
      }}
    />
  );
}
