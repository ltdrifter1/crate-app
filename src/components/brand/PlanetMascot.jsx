/**
 * PlanetMascot — hard-drawn Y2K ink planet for the Cover Stage hero.
 * Bold outline, flat fills, crisp stipple — drawn, not rendered.
 * Faithful mark: sphere, tapered swoosh, decreasing dot trail.
 * No wordmark. Pure SVG + CSS; respects prefers-reduced-motion.
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

/** Hand-placed stipple dots — denser toward lower-left shade. */
function StippleDots() {
  const dots = [];
  // denser shade band (lower-left / terminator)
  for (let row = 0; row < 18; row += 1) {
    for (let col = 0; col < 16; col += 1) {
      const x = 128 + col * 7.2 + (row % 2) * 3.4;
      const y = 168 + row * 6.6;
      const dx = x - 200;
      const dy = y - 204;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 88) continue;
      // Prefer lower-left quadrant for shade
      const shade = (200 - x) * 0.4 + (y - 160) * 0.55;
      if (shade < 18 && dist < 70) continue;
      const r = shade > 70 ? 1.15 : shade > 40 ? 0.9 : 0.65;
      const op = shade > 70 ? 0.85 : shade > 40 ? 0.55 : 0.28;
      dots.push(
        <circle key={`${row}-${col}`} cx={x} cy={y} r={r} fill="#16181E" opacity={op} />
      );
    }
  }
  return <g aria-hidden="true">{dots}</g>;
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
          ${live ? `animation: pmBob-${uid} 3.8s ease-in-out infinite;` : ""}
        }
        .${cls} .pm-svg { position: relative; z-index: 1; overflow: visible; }
        .${cls} .pm-swoosh-front {
          transform-origin: 200px 204px;
          ${live ? `animation: pmSway-${uid} 7.5s ease-in-out infinite;` : ""}
        }
        .${cls} .pm-swoosh-back {
          transform-origin: 200px 204px;
          ${live ? `animation: pmSwayBack-${uid} 7.5s ease-in-out infinite;` : ""}
        }
        .${cls} .pm-star { ${live ? `animation: pmTwinkle-${uid} 3s steps(2, end) infinite;` : "opacity: 0.55;"} }
        .${cls} .pm-star-2 { animation-delay: 0.7s; }
        .${cls} .pm-star-3 { animation-delay: 1.4s; }
        .${cls} .pm-star-4 { animation-delay: 2.1s; }
        .${cls} .pm-dot { ${live ? `animation: pmDotPulse-${uid} 3.5s steps(2, end) infinite;` : ""} }
        @keyframes pmBob-${uid} {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes pmSway-${uid} {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(1.6deg); }
        }
        @keyframes pmSwayBack-${uid} {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-1.6deg); }
        }
        @keyframes pmTwinkle-${uid} {
          0%, 100% { opacity: 0.25; }
          50% { opacity: 1; }
        }
        @keyframes pmDotPulse-${uid} {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .${cls} .pm-bob,
          .${cls} .pm-swoosh-front, .${cls} .pm-swoosh-back,
          .${cls} .pm-star, .${cls} .pm-dot { animation: none !important; }
        }
      `}</style>

      <div className="pm-bob">
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
            <path id={`pmOrbit-${uid}`} d={orbitPath} transform={orbitTransform} />
            <clipPath id={`pmClip-${uid}`}>
              <circle cx="200" cy="204" r="94" />
            </clipPath>
          </defs>

          {/* Hard ink stars */}
          <circle className="pm-star" cx="52" cy="66" r="1.8" fill="#16181E" />
          <circle className="pm-star pm-star-2" cx="344" cy="56" r="1.5" fill="#16181E" />
          <circle className="pm-star pm-star-3" cx="46" cy="322" r="1.6" fill="#16181E" />
          <circle className="pm-star pm-star-4" cx="352" cy="302" r="1.4" fill="#16181E" />
          <circle className="pm-star pm-star-2" cx="112" cy="40" r="1.2" fill="#16181E" />
          <circle className="pm-star pm-star-3" cx="302" cy="350" r="1.2" fill="#16181E" />

          {/* Thin orbit guide — hard hairline */}
          <use
            href={`#pmOrbit-${uid}`}
            stroke="#16181E"
            strokeWidth="1.2"
            opacity="0.18"
          />

          {/* BACK swoosh — flat ink, hard edge */}
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
            {/* Single hard highlight tick — drawn, not soft glow */}
            <path
              d="M 252 150 C 292 120, 330 100, 360 94"
              stroke="#EEF1F5"
              strokeWidth="1.8"
              strokeLinecap="round"
              opacity="0.35"
            />
          </g>

          {/* Far moon */}
          <g opacity="0.7" transform={live ? undefined : "translate(200 96)"}>
            <circle r="4.8" fill="#EEF1F5" stroke="#16181E" strokeWidth="1.6">
              {live && (
                <animateMotion dur="8.4s" repeatCount="indefinite" rotate="0" keyPoints="0.5;1;0.5" keyTimes="0;0.5;1" calcMode="linear">
                  <mpath href={`#pmOrbit-${uid}`} />
                </animateMotion>
              )}
            </circle>
          </g>

          {/* PLANET — flat plate + ink stipple + hard outline */}
          <g>
            <circle cx="200" cy="204" r="94" fill="#E8ECF2" />
            {/* Flat shade wedge (hard-drawn terminator, no blur) */}
            <g clipPath={`url(#pmClip-${uid})`}>
              <path
                d="M 110 150
                   C 150 130, 190 128, 230 148
                   C 210 190, 200 230, 208 278
                   C 170 290, 130 270, 112 230
                   C 102 200, 104 170, 110 150 Z"
                fill="#C5CCD6"
              />
              <path
                d="M 118 200
                   C 150 188, 175 200, 188 240
                   C 170 268, 140 272, 122 248
                   C 112 228, 112 212, 118 200 Z"
                fill="#9AA3B0"
              />
              <StippleDots />
            </g>
            {/* Hard specular — flat white oval, ink edge */}
            <ellipse
              cx="236"
              cy="148"
              rx="22"
              ry="12"
              fill="#FFFFFF"
              stroke="#16181E"
              strokeWidth="1.2"
              transform="rotate(-18 236 148)"
            />
            {/* Bold ink outline */}
            <circle cx="200" cy="204" r="94" stroke="#16181E" strokeWidth="3.2" fill="none" />
          </g>

          {/* Mid moon */}
          <g transform={live ? undefined : "translate(316 262)"}>
            <circle r="3.5" fill="#D5DBE4" stroke="#16181E" strokeWidth="1.4">
              {live && (
                <>
                  <animateMotion dur="11.5s" repeatCount="indefinite" rotate="0">
                    <mpath href={`#pmOrbit-${uid}`} />
                  </animateMotion>
                  <animate
                    attributeName="opacity"
                    values="1;0.35;0.35;1;1"
                    keyTimes="0;0.08;0.42;0.5;1"
                    dur="11.5s"
                    repeatCount="indefinite"
                  />
                </>
              )}
            </circle>
          </g>

          {/* FRONT swoosh — flat ink */}
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
            <path
              d="M 154 262 C 114 290, 72 312, 42 318"
              stroke="#EEF1F5"
              strokeWidth="1.8"
              strokeLinecap="round"
              opacity="0.4"
            />
          </g>

          {/* Decreasing ink dot trail */}
          <g fill="#16181E">
            <circle className="pm-dot" cx="42" cy="238" r="6.2" />
            <circle className="pm-dot" cx="62" cy="239" r="5" style={{ animationDelay: "0.25s" }} />
            <circle className="pm-dot" cx="79" cy="240" r="3.9" style={{ animationDelay: "0.5s" }} />
            <circle className="pm-dot" cx="93" cy="240.5" r="3.1" style={{ animationDelay: "0.75s" }} />
            <circle className="pm-dot" cx="104" cy="241" r="2.4" style={{ animationDelay: "1s" }} />
            <circle className="pm-dot" cx="113" cy="241.4" r="1.8" style={{ animationDelay: "1.25s" }} />
            <circle className="pm-dot" cx="120" cy="241.7" r="1.25" style={{ animationDelay: "1.5s" }} />
          </g>

          {/* Lead moon */}
          <g transform={live ? undefined : "translate(86 300)"}>
            <circle r="6.2" fill="#F4F6F9" stroke="#16181E" strokeWidth="1.7">
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
