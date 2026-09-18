/**
 * SplashScreen — auth / boot loading.
 * CSS-only spinning planet (no Lottie on the critical path).
 */
import { color, font, motion } from "../../theme";

/**
 * @param {object} [props]
 * @param {number} [props.size=176] — planet edge length (responsive capped)
 * @param {string} [props.label="Loading"] — visible boot status copy
 */
export default function SplashScreen({ size = 220, label = "Loading" } = {}) {
  const edge = `min(${size}px, 52vw)`;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
      className="pmp-splash"
      style={{
        minHeight: "100dvh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 28,
        background: `
          radial-gradient(ellipse 70% 48% at 50% 42%, rgba(255,106,43,0.07) 0%, transparent 58%),
          radial-gradient(ellipse 90% 70% at 50% 100%, rgba(18,20,26,0.9) 0%, transparent 55%),
          ${color.canvas}
        `,
        position: "relative",
        overflow: "hidden",
        margin: 0,
        padding: 24,
        boxSizing: "border-box",
      }}
    >
      <div
        className="pmp-spin-planet"
        aria-hidden="true"
        style={{ width: edge, height: edge }}
      >
        <span className="pmp-spin-planet__bloom" />
        <span className="pmp-spin-planet__ring" />
        <span className="pmp-spin-planet__core">
          <span className="pmp-spin-planet__map" />
          <span className="pmp-spin-planet__shade" />
          <span className="pmp-spin-planet__spec" />
          <span className="pmp-spin-planet__limb" />
        </span>
        <span className="pmp-spin-planet__ring pmp-spin-planet__ring--inner" />
      </div>
      <p
        className="pmp-splash-label"
        style={{
          margin: 0,
          fontFamily: font,
          fontSize: 13,
          fontWeight: 500,
          letterSpacing: "0.36em",
          textTransform: "uppercase",
          color: color.body,
          animation: `pmpSplashPulse 2.4s ${motion.ease} infinite`,
        }}
      >
        {label}
      </p>
    </div>
  );
}
