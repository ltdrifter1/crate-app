import { artFrameStyle, color } from "../../theme";
import CoverImage from "./CoverImage";

/**
 * ArtFrame — jewel-case sleeve: tight radius, raised shadow, acid/Aqua pip when playing.
 * Optional 2×2 mosaic when `covers` has 4+ URLs; otherwise single `src`.
 */
export default function ArtFrame({
  src = null,
  covers = null,
  size = 168,
  width = null,
  height = null,
  active = false,
  radius = 6,
  priority = false,
  eager = false,
  children = null,
  style = {},
}) {
  const w = width ?? size;
  const h = height ?? size;
  const mosaic = Array.isArray(covers) ? covers.filter(Boolean).slice(0, 4) : [];
  const useMosaic = mosaic.length >= 4;
  const cellW = Math.ceil(w / 2);
  const cellH = Math.ceil(h / 2);

  return (
    <span
      style={{
        ...artFrameStyle({ size: w, width: w, height: h, active, radius }),
        ...style,
      }}
    >
      {useMosaic ? (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gridTemplateRows: "1fr 1fr",
          }}
        >
          {mosaic.map((url, i) => (
            <span key={`${url}-${i}`} style={{ overflow: "hidden" }}>
              <CoverImage src={url} alt="" width={cellW} height={cellH} />
            </span>
          ))}
        </span>
      ) : src || mosaic[0] ? (
        <CoverImage
          src={src || mosaic[0]}
          alt=""
          width={w}
          height={h}
          priority={priority}
          eager={eager}
        />
      ) : null}

      {active && (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            right: 8,
            bottom: 8,
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: color.accent,
          }}
        />
      )}

      {children}
    </span>
  );
}
