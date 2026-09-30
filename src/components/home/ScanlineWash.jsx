/**
 * CRT wash — LCD only. Ice-cyan phosphor lines, not a full-screen gimmick.
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
        opacity: 0.14,
        backgroundImage:
          "repeating-linear-gradient(180deg, rgba(183,228,238,0.45) 0px, rgba(183,228,238,0.45) 1px, transparent 1px, transparent 3px)",
        mixBlendMode: "overlay",
      }}
    />
  );
}
