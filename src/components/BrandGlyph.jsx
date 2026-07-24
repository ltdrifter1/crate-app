import { color, fontDisplay, BRAND_NAME } from "../theme";

/** Nested doorway mark — brass threshold on charcoal. */
export function BrandMark({ size = 40, withTile = true, title = BRAND_NAME }) {
  const uid = `bm-${size}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
      style={{ display: "block", flexShrink: 0 }}
    >
      <defs>
        <linearGradient id={`${uid}-brass`} x1="12" y1="8" x2="52" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#D4C09A" />
          <stop offset="0.45" stopColor="#A8926A" />
          <stop offset="1" stopColor="#8A734F" />
        </linearGradient>
        <radialGradient id={`${uid}-glow`} cx="32" cy="54" r="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#A8926A" stopOpacity="0.35" />
          <stop offset="1" stopColor="#A8926A" stopOpacity="0" />
        </radialGradient>
      </defs>
      {withTile && <rect width="64" height="64" rx="14" fill="#0C0B0A" />}
      <ellipse cx="32" cy="54" rx="18" ry="10" fill={`url(#${uid}-glow)`} />
      <path
        d="M16 52V22c0-6.627 5.373-12 12-12h8c6.627 0 12 5.373 12 12v30"
        stroke={`url(#${uid}-brass)`}
        strokeWidth="3.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M24 52V28c0-4.418 3.582-8 8-8s8 3.582 8 8v24"
        stroke={`url(#${uid}-brass)`}
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.92"
      />
    </svg>
  );
}

/**
 * Brand lockup — mark alone when compact, mark + wordmark when larger.
 * @param {{ size?: number, light?: boolean, markOnly?: boolean }} props
 */
export default function BrandGlyph({ size = 84, light = false, markOnly = false }) {
  const compact = size < 40 || markOnly;
  const markSize = compact ? size : Math.round(size * 0.72);
  const showWord = !compact && size >= 48;

  return (
    <div
      aria-label={BRAND_NAME}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: Math.max(8, Math.round(size * 0.14)),
        userSelect: "none",
        lineHeight: 1,
      }}
    >
      <BrandMark size={markSize} withTile />
      {showWord && (
        <span
          style={{
            fontSize: Math.max(14, Math.round(size * 0.34)),
            fontWeight: 800,
            letterSpacing: size >= 48 ? -1.4 : -0.7,
            color: light ? color.onDark : color.ink,
            fontFamily: fontDisplay,
          }}
        >
          {BRAND_NAME}
        </span>
      )}
    </div>
  );
}
