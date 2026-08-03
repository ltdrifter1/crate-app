/**
 * PlanetMascot — clean Y2K vector brand planet for the Cover Stage hero.
 * Faithful to the Planet MP3 mark: stippled sphere, bold tapered swoosh ring
 * (behind top-right, in front bottom-left), and the decreasing dot trail.
 * No wordmark/text. Pure SVG + CSS; seamless ~7s loop.
 * Respects prefers-reduced-motion.
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

  // Orbit ellipse the moons ride — matches the swoosh axis (tilt ≈ -22°).
  const orbitTransform = "translate(200 204) rotate(-22)";
  const orbitPath = "M -152 0 A 152 46 0 1 1 152 0 A 152 46 0 1 1 -152 0";

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
        .${cls} .pm-bob {
          width: 100%; height: 100%;
          transform-origin: 50% 52%;
          ${live ? `animation: pmBob-${uid} 3.5s ease-in-out infinite;` : ""}
        }
        .${cls} .pm-glow {
          position: absolute; inset: 15%;
          border-radius: 50%;
          background: radial-gradient(circle at 55% 40%,
            rgba(255,255,255,0.65) 0%,
            rgba(200,206,216,0.3) 34%,
            rgba(22,24,30,0.08) 60%,
            transparent 78%);
          filter: blur(12px);
          pointer-events: none;
          ${live ? `animation: pmGlow-${uid} 3.8s ease-in-out infinite;` : "opacity: 0.85;"}
        }
        .${cls} .pm-svg { position: relative; z-index: 1; overflow: visible; }
        .${cls} .pm-swoosh-front {
          transform-origin: 200px 204px;
          ${live ? `animation: pmSway-${uid} 7s ease-in-out infinite;` : ""}
        }
        .${cls} .pm-swoosh-back {
          transform-origin: 200px 204px;
          ${live ? `animation: pmSwayBack-${uid} 7s ease-in-out infinite;` : ""}
        }
        .${cls} .pm-ring-flow {
          ${live ? `animation: pmRingFlow-${uid} 7s linear infinite;` : ""}
        }
        .${cls} .pm-star { ${live ? `animation: pmTwinkle-${uid} 2.8s ease-in-out infinite;` : "opacity: 0.5;"} }
        .${cls} .pm-star-2 { animation-delay: 0.6s; }
        .${cls} .pm-star-3 { animation-delay: 1.3s; }
        .${cls} .pm-star-4 { animation-delay: 2s; }
        .${cls} .pm-shoot { ${live ? `animation: pmShoot-${uid} 7s linear infinite;` : "opacity: 0;"} }
        .${cls} .pm-dot { ${live ? `animation: pmDotPulse-${uid} 3.5s ease-in-out infinite;` : ""} }
        @keyframes pmBob-${uid} {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes pmGlow-${uid} {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        /* Swoosh parallax sway — ring leans as it sweeps, front and back offset */
        @keyframes pmSway-${uid} {
          0%, 100% { transform: rotate(0deg) translateY(0); }
          50% { transform: rotate(2.2deg) translateY(2px); }
        }
        @keyframes pmSwayBack-${uid} {
          0%, 100% { transform: rotate(0deg) translateY(0); }
          50% { transform: rotate(-2.2deg) translateY(-2px); }
        }
        @keyframes pmRingFlow-${uid} {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: -640; }
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
        @keyframes pmDotPulse-${uid} {
          0%, 100% { opacity: 0.75; }
          50% { opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .${cls} .pm-bob, .${cls} .pm-glow,
          .${cls} .pm-swoosh-front, .${cls} .pm-swoosh-back,
          .${cls} .pm-ring-flow, .${cls} .pm-star,
          .${cls} .pm-shoot, .${cls} .pm-dot { animation: none !important; }
        }
      `}</style>

      <div className="pm-bob">
        <div className="pm-glow" aria-hidden="true" />
        <svg
          className="pm-svg"
          viewBox="0 0 400 400"
          width="100%"
          height="100%"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            {/* Cartoon sphere — bright top, deep charcoal toward lower left */}
            <radialGradient id={`pmFill-${uid}`} cx="56%" cy="26%" r="78%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="26%" stopColor="#F4F6F9" />
              <stop offset="52%" stopColor="#AEB6C2" />
              <stop offset="76%" stopColor="#454C59" />
              <stop offset="100%" stopColor="#101218" />
            </radialGradient>
            <linearGradient id={`pmRim-${uid}`} x1="20%" y1="0%" x2="80%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
              <stop offset="35%" stopColor="#FFFFFF" stopOpacity="0.25" />
              <stop offset="70%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>
            {/* Soft vector halftone — crisp dots, no painterly noise */}
            <pattern id={`pmTone-${uid}`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(18)">
              <circle cx="1.4" cy="1.4" r="0.95" fill="#0B0C10" opacity="0.5" />
            </pattern>
            <radialGradient id={`pmToneFade-${uid}`} cx="30%" cy="72%" r="66%">
              <stop offset="0%" stopColor="#fff" stopOpacity="0.9" />
              <stop offset="52%" stopColor="#fff" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#fff" stopOpacity="0" />
            </radialGradient>
            <mask id={`pmToneMask-${uid}`}>
              <rect width="400" height="400" fill={`url(#pmToneFade-${uid})`} />
            </mask>
            <filter id={`pmSoft-${uid}`} x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="2.6" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Moon orbit — hidden ellipse the moons follow */}
            <path id={`pmOrbit-${uid}`} d={orbitPath} transform={orbitTransform} />
          </defs>

          {/* Twinkling stars — negative space */}
          <circle className="pm-star" cx="52" cy="66" r="1.7" fill="#16181E" />
          <circle className="pm-star pm-star-2" cx="344" cy="56" r="1.4" fill="#16181E" />
          <circle className="pm-star pm-star-3" cx="46" cy="322" r="1.5" fill="#16181E" />
          <circle className="pm-star pm-star-4" cx="352" cy="302" r="1.3" fill="#16181E" />
          <circle className="pm-star pm-star-2" cx="112" cy="40" r="1.1" fill="#5C6572" />
          <circle className="pm-star pm-star-3" cx="302" cy="350" r="1.1" fill="#5C6572" />

          {/* Occasional shooting star */}
          <g className="pm-shoot" transform="translate(84 100)">
            <line x1="0" y1="0" x2="26" y2="-13" stroke="#16181E" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="26" cy="-13" r="1.6" fill="#16181E" />
          </g>

          {/* Thin orbital path hints */}
          <use
            href={`#pmOrbit-${uid}`}
            stroke="#16181E"
            strokeWidth="0.8"
            opacity="0.1"
          />
          <ellipse
            cx="200" cy="204" rx="172" ry="56"
            transform="rotate(-22 200 204)"
            stroke="#FFFFFF"
            strokeWidth="1"
            opacity="0.5"
          />

          {/* Subtle flowing ring current on the orbit — motion cue */}
          <use
            className="pm-ring-flow"
            href={`#pmOrbit-${uid}`}
            stroke="#16181E"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeDasharray="10 150"
            opacity="0.28"
          />

          {/* ── BACK swoosh arm — sweeps behind the planet, top-right ── */}
          <g className="pm-swoosh-back">
            <path
              d="M 236 148
                 C 282 112, 336 88, 372 84
                 C 378 83.4, 381 86, 379 91
                 C 370 112, 330 146, 282 168
                 C 268 174, 254 178, 244 179
                 C 238 170, 236 158, 236 148 Z"
              fill="#16181E"
            />
            {/* Silver inner sheen on the back arm */}
            <path
              d="M 250 148 C 290 118, 334 98, 364 92"
              stroke="#C8CED8"
              strokeWidth="2.4"
              strokeLinecap="round"
              opacity="0.55"
            />
          </g>

          {/* ── Moon B — behind the planet on the far orbit ── */}
          <g opacity="0.55" transform={live ? undefined : "translate(200 96)"}>
            <circle r="4.6" fill="#E8ECF2" stroke="#16181E" strokeWidth="1.1">
              {live && (
                <animateMotion dur="8.4s" repeatCount="indefinite" rotate="0" keyPoints="0.5;1;0.5" keyTimes="0;0.5;1" calcMode="linear">
                  <mpath href={`#pmOrbit-${uid}`} />
                </animateMotion>
              )}
            </circle>
          </g>

          {/* ── PLANET ── */}
          <g>
            <circle cx="200" cy="204" r="94" fill={`url(#pmFill-${uid})`} />
            {/* Halftone shading — heavier toward lower left like the stipple */}
            <circle
              cx="200" cy="204" r="94"
              fill={`url(#pmTone-${uid})`}
              mask={`url(#pmToneMask-${uid})`}
              opacity="0.62"
            />
            {/* Soft cartoon terminator */}
            <path
              d="M 132 148 c 16 40 18 92 2 128 26 -4 60 -30 82 -74 16 -32 20 -66 10 -96 -30 6 -66 16 -94 42 z"
              fill="#16181E"
              opacity="0.1"
            />
            {/* Specular highlight */}
            <ellipse cx="228" cy="146" rx="30" ry="18" fill="#FFFFFF" opacity="0.5" transform="rotate(-18 228 146)" />
            <ellipse cx="240" cy="136" rx="11" ry="6" fill="#FFFFFF" opacity="0.85" transform="rotate(-18 240 136)" />
            {/* Bright rim light — upper edge */}
            <path
              d="M 118 156 A 94 94 0 0 1 288 162"
              stroke={`url(#pmRim-${uid})`}
              strokeWidth="5"
              strokeLinecap="round"
              filter={`url(#pmSoft-${uid})`}
            />
            {/* Crisp outline */}
            <circle cx="200" cy="204" r="94" stroke="#16181E" strokeWidth="2.4" opacity="0.5" />
          </g>

          {/* ── Moon C — small, mid orbit, dims on the far side ── */}
          <g transform={live ? undefined : "translate(316 262)"}>
            <circle r="3.4" fill="#C8CED8" stroke="#16181E" strokeWidth="1">
              {live && (
                <>
                  <animateMotion dur="11.5s" repeatCount="indefinite" rotate="0">
                    <mpath href={`#pmOrbit-${uid}`} />
                  </animateMotion>
                  <animate
                    attributeName="opacity"
                    values="1;0.3;0.3;1;1"
                    keyTimes="0;0.08;0.42;0.5;1"
                    dur="11.5s"
                    repeatCount="indefinite"
                  />
                </>
              )}
            </circle>
          </g>

          {/* ── FRONT swoosh arm — passes in front, bottom-left ── */}
          <g className="pm-swoosh-front">
            <path
              d="M 168 262
                 C 122 296, 66 322, 30 328
                 C 23.5 329, 20.5 326, 22.5 321
                 C 32 299, 74 264, 122 241
                 C 136 234.5, 150 230, 160 229
                 C 166 238, 168 250, 168 262 Z"
              fill="#16181E"
            />
            {/* White glow edge on the front arm */}
            <path
              d="M 152 262 C 112 292, 68 314, 38 320"
              stroke="#F4F6F9"
              strokeWidth="2.6"
              strokeLinecap="round"
              opacity="0.8"
              filter={`url(#pmSoft-${uid})`}
            />
          </g>

          {/* ── Decreasing dot trail — the brand's little moons ── */}
          <g fill="#16181E">
            <circle className="pm-dot" cx="42" cy="238" r="6" />
            <circle className="pm-dot" cx="62" cy="239" r="4.8" style={{ animationDelay: "0.25s" }} />
            <circle className="pm-dot" cx="79" cy="240" r="3.8" style={{ animationDelay: "0.5s" }} />
            <circle className="pm-dot" cx="93" cy="240.5" r="3" style={{ animationDelay: "0.75s" }} />
            <circle className="pm-dot" cx="104" cy="241" r="2.3" style={{ animationDelay: "1s" }} />
            <circle className="pm-dot" cx="113" cy="241.4" r="1.7" style={{ animationDelay: "1.25s" }} />
            <circle className="pm-dot" cx="120" cy="241.7" r="1.2" style={{ animationDelay: "1.5s" }} />
          </g>

          {/* ── Moon A — lead cartoon moon, dims on the far side ── */}
          <g transform={live ? undefined : "translate(86 300)"}>
            <circle r="6" fill="#F4F6F9" stroke="#16181E" strokeWidth="1.3">
              {live && (
                <>
                  <animateMotion dur="5.2s" repeatCount="indefinite" rotate="0">
                    <mpath href={`#pmOrbit-${uid}`} />
                  </animateMotion>
                  <animate
                    attributeName="opacity"
                    values="1;0.35;0.35;1;1"
                    keyTimes="0;0.08;0.42;0.5;1"
                    dur="5.2s"
                    repeatCount="indefinite"
                  />
                </>
              )}
            </circle>
          </g>
        </svg>
      </div>
    </div>
  );
}
