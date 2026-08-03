/**
 * PlanetMascot — clean Y2K vector brand planet for the Cover Stage hero.
 * Silhouette matches Planet MP3 (sphere + tilted ring + moon cluster).
 * No wordmark. SVG planet + CSS 3D ring for real front/behind parallax.
 * ~7s seamless loop. Respects prefers-reduced-motion.
 */

import { useEffect, useId, useState } from "react";

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(!!mq.matches);
    sync();
    mq.addEventListener?.("change", sync);
    return () => mq.removeEventListener?.("change", sync);
  }, []);
  return reduced;
}

/**
 * @param {object} props
 * @param {number} [props.size=340]
 * @param {string} [props.title="Planet MP3"]
 * @param {boolean} [props.animated=true]
 */
export default function PlanetMascot({
  size = 340,
  title = "Planet MP3",
  animated = true,
}) {
  const uid = useId().replace(/:/g, "");
  const reduced = usePrefersReducedMotion();
  const live = animated && !reduced;
  const cls = `pm-${uid}`;

  return (
    <div
      className={cls}
      role="img"
      aria-label={title}
      style={{
        width: size,
        height: size,
        maxWidth: "100%",
        margin: "0 auto",
        position: "relative",
        display: "block",
        flexShrink: 0,
        userSelect: "none",
        pointerEvents: "none",
      }}
    >
      <style>{`
        .${cls} {
          --pm-ink: #16181E;
          --pm-mid: #5C6572;
          --pm-silver: #C8CED8;
          --pm-white: #F4F6F9;
        }
        .${cls} .pm-bob {
          position: relative;
          width: 100%;
          height: 100%;
          transform-origin: 50% 52%;
          ${live ? `animation: pmBob-${uid} 3.5s ease-in-out infinite;` : ""}
        }
        .${cls} .pm-glow {
          position: absolute;
          inset: 16%;
          border-radius: 50%;
          background: radial-gradient(circle at 56% 40%,
            rgba(255,255,255,0.62) 0%,
            rgba(200,206,216,0.3) 32%,
            rgba(22,24,30,0.1) 58%,
            transparent 76%);
          filter: blur(12px);
          pointer-events: none;
          z-index: 0;
          ${live ? `animation: pmGlow-${uid} 3.8s ease-in-out infinite;` : "opacity: 0.88;"}
        }
        .${cls} .pm-space {
          position: absolute;
          inset: 0;
          z-index: 1;
          overflow: visible;
        }
        .${cls} .pm-system {
          position: absolute;
          inset: 0;
          z-index: 2;
          display: grid;
          place-items: center;
          perspective: 900px;
          perspective-origin: 50% 46%;
        }
        .${cls} .pm-tilt {
          position: relative;
          width: 72%;
          height: 72%;
          transform-style: preserve-3d;
          transform: rotateX(68deg) rotateZ(-28deg);
        }
        .${cls} .pm-ring {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 168%;
          height: 168%;
          border-radius: 50%;
          border: 3.5px solid rgba(244,246,249,0.92);
          box-shadow:
            0 0 0 2px rgba(22,24,30,0.55),
            0 0 14px rgba(255,255,255,0.35),
            inset 0 0 10px rgba(255,255,255,0.2);
          transform: translate(-50%, -50%) rotate(0deg);
          transform-style: preserve-3d;
          ${live ? `animation: pmSpin-${uid} 7s linear infinite;` : ""}
        }
        .${cls} .pm-ring::before {
          content: "";
          position: absolute;
          inset: -1px;
          border-radius: 50%;
          border: 1px solid rgba(22,24,30,0.35);
          pointer-events: none;
        }
        .${cls} .pm-orbit-path {
          position: absolute;
          left: 50%;
          top: 50%;
          border-radius: 50%;
          border: 1px solid rgba(22,24,30,0.1);
          transform: translate(-50%, -50%);
          pointer-events: none;
        }
        .${cls} .pm-planet-slot {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 58%;
          height: 58%;
          transform: translate(-50%, -50%) rotateX(-68deg) rotateZ(28deg);
          transform-style: preserve-3d;
        }
        .${cls} .pm-moon {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 30%, #FFFFFF 0%, #F4F6F9 40%, #A8B0BC 100%);
          box-shadow:
            inset -1px -1px 0 rgba(22,24,30,0.35),
            0 0 0 1px rgba(22,24,30,0.45),
            0 0 8px rgba(255,255,255,0.35);
          transform-style: preserve-3d;
        }
        /* Five decreasing moons on the ring — brand silhouette cue */
        .${cls} .pm-m1 { width: 9.5%; height: 9.5%; left: 2%; top: 46%; }
        .${cls} .pm-m2 { width: 7.2%; height: 7.2%; left: 10%; top: 58%; }
        .${cls} .pm-m3 { width: 5.4%; height: 5.4%; left: 17%; top: 66%; }
        .${cls} .pm-m4 { width: 3.8%; height: 3.8%; left: 23%; top: 71%; }
        .${cls} .pm-m5 { width: 2.6%; height: 2.6%; left: 28%; top: 74%; }
        /* Independent tiny orbiters — full-size rotors inside tilt space */
        .${cls} .pm-free-a,
        .${cls} .pm-free-b,
        .${cls} .pm-free-c {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 100%;
          height: 100%;
          transform: translate(-50%, -50%) rotate(0deg);
          transform-style: preserve-3d;
          pointer-events: none;
        }
        .${cls} .pm-free-a { ${live ? `animation: pmSpin-${uid} 5.2s linear infinite;` : ""} }
        .${cls} .pm-free-b { ${live ? `animation: pmSpin-${uid} 8.4s linear infinite reverse;` : ""} }
        .${cls} .pm-free-c { ${live ? `animation: pmSpin-${uid} 11.5s linear infinite;` : ""} }
        .${cls} .pm-free-a .pm-moon { width: 5.5%; height: 5.5%; left: 94%; top: 47%; }
        .${cls} .pm-free-b .pm-moon { width: 4.2%; height: 4.2%; left: 48%; top: 4%; }
        .${cls} .pm-free-c .pm-moon {
          width: 3.4%; height: 3.4%; left: 48%; top: 90%;
          background: radial-gradient(circle at 35% 30%, #FFFFFF 0%, #C8CED8 55%, #6A7280 100%);
        }
        .${cls} .pm-star {
          transform-origin: center;
          ${live ? `animation: pmTwinkle-${uid} 2.8s ease-in-out infinite;` : "opacity: 0.5;"}
        }
        .${cls} .pm-star-2 { animation-delay: 0.6s; }
        .${cls} .pm-star-3 { animation-delay: 1.3s; }
        .${cls} .pm-star-4 { animation-delay: 2s; }
        .${cls} .pm-shoot {
          ${live ? `animation: pmShoot-${uid} 7s linear infinite;` : "opacity: 0;"}
        }
        @keyframes pmBob-${uid} {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes pmGlow-${uid} {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        @keyframes pmSpin-${uid} {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes pmTwinkle-${uid} {
          0%, 100% { opacity: 0.2; }
          45% { opacity: 1; }
          70% { opacity: 0.4; }
        }
        @keyframes pmShoot-${uid} {
          0%, 76% { opacity: 0; transform: translate(0, 0); }
          80% { opacity: 0.95; transform: translate(8px, -4px); }
          92% { opacity: 0.2; transform: translate(78px, -40px); }
          100% { opacity: 0; transform: translate(96px, -52px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .${cls} .pm-bob,
          .${cls} .pm-glow,
          .${cls} .pm-ring,
          .${cls} .pm-free-a,
          .${cls} .pm-free-b,
          .${cls} .pm-free-c,
          .${cls} .pm-star,
          .${cls} .pm-shoot { animation: none !important; }
          .${cls} .pm-ring,
          .${cls} .pm-free-a,
          .${cls} .pm-free-b,
          .${cls} .pm-free-c { transform: translate(-50%, -50%) rotate(0deg) !important; }
        }
      `}</style>

      <div className="pm-bob">
        <div className="pm-glow" aria-hidden="true" />

        {/* Stars + shooting star in screen space (not tilted) */}
        <svg className="pm-space" viewBox="0 0 400 400" aria-hidden="true">
          <circle className="pm-star" cx="54" cy="68" r="1.7" fill="#16181E" />
          <circle className="pm-star pm-star-2" cx="342" cy="58" r="1.4" fill="#16181E" />
          <circle className="pm-star pm-star-3" cx="48" cy="318" r="1.5" fill="#16181E" />
          <circle className="pm-star pm-star-4" cx="350" cy="300" r="1.3" fill="#16181E" />
          <circle className="pm-star pm-star-2" cx="112" cy="42" r="1.1" fill="#5C6572" />
          <circle className="pm-star pm-star-3" cx="300" cy="348" r="1.1" fill="#5C6572" />
          <g className="pm-shoot" transform="translate(86 102)">
            <line x1="0" y1="0" x2="26" y2="-13" stroke="#16181E" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="26" cy="-13" r="1.6" fill="#16181E" />
          </g>
          {/* Quiet orbital path hints in flat space */}
          <ellipse
            cx="200" cy="208" rx="152" ry="48"
            transform="rotate(-28 200 208)"
            fill="none"
            stroke="#16181E"
            strokeWidth="0.8"
            opacity="0.1"
          />
        </svg>

        <div className="pm-system" aria-hidden="true">
          <div className="pm-tilt">
            <div className="pm-orbit-path" style={{ width: "148%", height: "148%" }} />
            <div className="pm-orbit-path" style={{ width: "176%", height: "176%", opacity: 0.7 }} />

            <div className="pm-ring">
              <span className="pm-moon pm-m1" />
              <span className="pm-moon pm-m2" />
              <span className="pm-moon pm-m3" />
              <span className="pm-moon pm-m4" />
              <span className="pm-moon pm-m5" />
            </div>

            <div className="pm-free-a"><span className="pm-moon" /></div>
            <div className="pm-free-b"><span className="pm-moon" /></div>
            <div className="pm-free-c"><span className="pm-moon" /></div>

            <div className="pm-planet-slot">
              <PlanetBody uid={uid} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Crisp cartoon planet disc — soft vector halftone, bright rim, no text. */
function PlanetBody({ uid }) {
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" overflow="visible">
      <defs>
        <radialGradient id={`fill-${uid}`} cx="68%" cy="36%" r="70%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="22%" stopColor="#F5F7FA" />
          <stop offset="48%" stopColor="#B0B7C4" />
          <stop offset="72%" stopColor="#3A404C" />
          <stop offset="100%" stopColor="#0E1014" />
        </radialGradient>
        <linearGradient id={`rim-${uid}`} x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="60%" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="85%" stopColor="#FFFFFF" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="1" />
        </linearGradient>
        <pattern id={`tone-${uid}`} width="5" height="5" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.75" fill="#0B0C10" opacity="0.5" />
        </pattern>
        <radialGradient id={`toneFade-${uid}`} cx="26%" cy="58%" r="60%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <mask id={`toneMask-${uid}`}>
          <rect width="200" height="200" fill={`url(#toneFade-${uid})`} />
        </mask>
      </defs>

      {/* Contact shadow in planet local space */}
      <ellipse cx="100" cy="178" rx="62" ry="8" fill="#16181E" opacity="0.14" />

      <circle cx="100" cy="100" r="86" fill={`url(#fill-${uid})`} />
      <circle
        cx="100" cy="100" r="86"
        fill={`url(#tone-${uid})`}
        mask={`url(#toneMask-${uid})`}
        opacity="0.6"
      />
      {/* Soft terminator — cartoon, not photoreal */}
      <path
        d="M58 52c18 32 22 74 6 112 24-6 52-30 70-68 14-30 16-58 4-84-24 6-52 14-80 40z"
        fill="#16181E"
        opacity="0.14"
      />
      {/* Specular */}
      <ellipse cx="132" cy="72" rx="26" ry="16" fill="#FFFFFF" opacity="0.55" />
      <ellipse cx="142" cy="64" rx="9" ry="5.5" fill="#FFFFFF" opacity="0.85" />
      {/* Rim light */}
      <circle cx="100" cy="100" r="86" fill="none" stroke={`url(#rim-${uid})`} strokeWidth="5" />
      {/* Crisp edge */}
      <circle cx="100" cy="100" r="86" fill="none" stroke="#16181E" strokeWidth="2.2" opacity="0.5" />
      {/* Playful cheek highlight */}
      <circle cx="146" cy="112" r="7" fill="#FFFFFF" opacity="0.16" />
    </svg>
  );
}
