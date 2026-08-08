import { artFrameStyle, y2k } from "../../theme";
import CoverImage from "./CoverImage";

/**
 * ArtFrame — shared jewel-case sleeve chrome for Home discovery.
 * Optional 2×2 mosaic when `covers` has 4+ URLs; otherwise single `src`.
 */
export default function ArtFrame({
  src = null,
  covers = null,
  size = 168,
  width = null,
  height = null,
  active = false,
  radius = 14,
  priority = false,
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
        />
      ) : null}

      {/* Soft bevel wash — physical media edge */}
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: `
            linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 42%),
            linear-gradient(180deg, transparent 55%, rgba(8,6,14,0.28) 100%)
          `,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1)",
        }}
      />

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
            background: y2k.neon,
            boxShadow: `0 0 8px ${y2k.neon}`,
            animation: "stageLiveDot 1.6s ease-in-out infinite",
          }}
        />
      )}

      {children}
    </span>
  );
}
