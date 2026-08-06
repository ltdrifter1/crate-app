import { useEffect, useRef, useState } from "react";
import {
  fontDisplay, fontMono, color, glass, motion,
} from "../../theme";
import { BrandGlyph as DoorGlyph } from "../brand/BrandMark";

/** Sticky compact title that appears once the page hero scrolls away. */
export default function CollapsingHeader({ title, subtitle }) {
  const sentinelRef = useRef(null);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    let root = sentinel.parentElement;
    while (root && root !== document.body) {
      const { overflowY } = window.getComputedStyle(root);
      if (overflowY === "auto" || overflowY === "scroll") break;
      root = root.parentElement;
    }
    if (!root || root === document.body) root = null;

    const io = new IntersectionObserver(
      ([entry]) => setCompact(!entry.isIntersecting),
      { root, threshold: 0, rootMargin: "-56px 0px 0px 0px" }
    );
    io.observe(sentinel);
    return () => io.disconnect();
  }, []);

  return (
    <>
      <div ref={sentinelRef} aria-hidden="true" style={{ height: 1 }} />
      <div
        aria-hidden={!compact}
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          height: 48,
          marginTop: -1,
          marginBottom: -48,
          opacity: compact ? 1 : 0,
          overflow: "hidden",
          pointerEvents: compact ? "auto" : "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          background: `
            linear-gradient(165deg, rgba(38,43,51,0.82) 0%, rgba(28,32,38,0.5) 100%)
          `,
          WebkitBackdropFilter: glass.blurSoft,
          backdropFilter: glass.blurSoft,
          borderBottom: compact ? `1px solid ${glass.borderSoft}` : "none",
          boxShadow: compact ? `inset 0 1px 0 ${glass.highlight}, 0 8px 24px rgba(26,29,36,0.06)` : "none",
          transition: `opacity ${motion.base} ${motion.ease}`,
        }}
      >
        <DoorGlyph size={22} title="" />
        <div style={{
          fontSize: 16, fontWeight: 650, letterSpacing: -0.3,
          color: color.ink, fontFamily: fontDisplay,
        }}>
          {title}
        </div>
      </div>
      <div style={{
        padding: subtitle ? "28px 16px 12px" : "32px 22px 18px",
        opacity: compact ? 0 : 1,
        transform: compact ? "translateY(-6px)" : "none",
        transition: `opacity ${motion.base} ${motion.ease}, transform ${motion.base} ${motion.ease}`,
        pointerEvents: compact ? "none" : "auto",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
          <DoorGlyph size={28} title="Planet MP3" />
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase",
            color: color.faint, fontFamily: fontMono,
          }}>
            Planet MP3
          </div>
        </div>
        <h1 style={{
          margin: 0,
          fontSize: 34,
          fontWeight: 700,
          fontFamily: fontDisplay,
          letterSpacing: -1,
          color: color.ink,
          lineHeight: 1.05,
        }}>
          {title}
        </h1>
        {subtitle ? (
          <p style={{
            margin: "10px 0 0",
            fontSize: 15,
            color: color.body,
            lineHeight: 1.45,
          }}>
            {subtitle}
          </p>
        ) : null}
      </div>
    </>
  );
}
