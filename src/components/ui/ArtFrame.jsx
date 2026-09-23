import { artFrameStyle, color } from "../../theme";
import CoverImage from "./CoverImage";
import DefaultSleeve from "./DefaultSleeve";

/**
 * ArtFrame — jewel-case sleeve: tight radius, raised shadow, acid/Aqua pip when playing.
 * Mosaic when `covers` has 2+ URLs (2-up, or 2×2 at 3–4).
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
  wellColor = "",
  children = null,
  style = {},
}) {
  const w = width ?? size;
  const h = height ?? size;
  const mosaic = Array.isArray(covers) ? covers.filter(Boolean).slice(0, 4) : [];
  const useMosaic = mosaic.length >= 2;
  const twoUp = mosaic.length === 2;
  const cells = mosaic.length === 3 ? [...mosaic, mosaic[0]] : mosaic;
  const cellW = Math.ceil(w / (twoUp ? 2 : 2));
  const cellH = Math.ceil(h / (twoUp ? 1 : 2));

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
            gridTemplateRows: twoUp ? "1fr" : "1fr 1fr",
          }}
        >
          {cells.map((url, i) => (
            <span key={`${url}-${i}`} style={{ overflow: "hidden" }}>
              <CoverImage src={url} alt="" width={cellW} height={cellH} wellColor={wellColor} />
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
          wellColor={wellColor}
        />
      ) : (
        <DefaultSleeve size={typeof w === "number" ? w : 160} color={wellColor} />
      )}

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
