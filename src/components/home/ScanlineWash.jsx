/**
 * Hairline CRT wash — modern Y2K, never blocks clicks.
 */
export default function ScanlineWash({ opacity = 0.055 }) {
  return (
    <span
      aria-hidden="true"
      className="pmp-scanlines"
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 1,
        pointerEvents: "none",
        background: `
          repeating-linear-gradient(
            180deg,
            rgba(255,255,255,${opacity}) 0px,
            rgba(255,255,255,${opacity}) 1px,
            transparent 1px,
            transparent 3px
          )
        `,
        mixBlendMode: "overlay",
      }}
    />
  );
}
