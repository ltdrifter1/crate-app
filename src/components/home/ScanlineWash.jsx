/**
 * Hairline CRT wash — LCD only, 2% opacity. Not a full-screen gimmick.
 */
export default function ScanlineWash() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 1,
        opacity: 0.045,
        backgroundImage:
          "repeating-linear-gradient(180deg, rgba(216,223,232,0.35) 0px, rgba(216,223,232,0.35) 1px, transparent 1px, transparent 3px)",
        mixBlendMode: "overlay",
      }}
    />
  );
}
