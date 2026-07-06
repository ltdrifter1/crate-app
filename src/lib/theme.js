// src/lib/theme.js
// ─────────────────────────────────────────────────────────────────────────────
// Design tokens — the single source of truth for Crate's look:
// ultra-minimal, heavy glass, a touch of retro. Import these instead of
// re-typing colors/blurs/spacing inline. Adopt incrementally.
// ─────────────────────────────────────────────────────────────────────────────

// Type
export const font = "-apple-system,'SF Pro Display','SF Pro Text','Helvetica Neue',Arial,sans-serif";
// Gear-readout numerals — the retro touch for time / BPM / energy / counts.
export const fontMono = "'SF Mono','Menlo','Monaco','Courier New',monospace";

// Ink + neutral text ramp.
// Grays are intentionally a little darker than the old ad-hoc values
// (#6B7280 / #9CA3AF) to improve legibility on translucent light glass.
export const color = {
  ink:    "#1A1D26", // primary text on light
  body:   "#3A3F4A", // secondary text
  muted:  "#5B6472", // tertiary text / active labels
  faint:  "#7A828F", // lightest labels (still readable on light glass)
  onDark: "#FFFFFF",
  alert:  "#FF3B30",
};

// Corner radii (aligned to the app's existing dominant values)
export const radius = { sm: 12, md: 16, lg: 20, pill: 999 };

// 4px spatial rhythm — space(2) => 8px, space(4) => 16px …
export const space = (n) => n * 4;

// Glass tiers — keep to these three. Depth comes from varying them,
// not from blurring everything equally.
export const glass = {
  hero: {
    background: "rgba(255,255,255,0.18)",
    backdropFilter: "blur(80px) saturate(220%)",
    border: "1px solid rgba(255,255,255,0.25)",
    boxShadow: "0 12px 48px rgba(0,0,0,0.10)",
  },
  panel: {
    background: "rgba(255,255,255,0.12)",
    backdropFilter: "blur(60px) saturate(200%)",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "0 4px 24px rgba(0,0,0,0.04)",
  },
  quiet: {
    background: "rgba(255,255,255,0.06)",
    backdropFilter: "blur(40px) saturate(160%)",
    border: "1px solid rgba(255,255,255,0.06)",
  },
};

// Motion — default to on-interaction; ambient loops are the exception
// and are already curtailed under prefers-reduced-motion.
export const motion = {
  fast: "0.12s",
  base: "0.2s",
  slow: "0.3s",
  ease: "cubic-bezier(0.4, 0, 0.2, 1)",
};

export const shadow = {
  soft: "0 4px 16px rgba(0,0,0,0.12)",
  card: "0 1px 3px rgba(0,0,0,0.04)",
};
