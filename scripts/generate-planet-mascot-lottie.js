#!/usr/bin/env node
/**
 * Generates Planet MP3 Cover Stage mascot as pure-vector Lottie JSON + static SVG.
 * Style: hard-drawn Y2K ink — flat fills, bold outlines, crisp stipple.
 * Palette: cool platinum + charcoal only. No text. Transparent bg.
 * 6s seamless loop @ 30fps.
 */
const fs = require("fs");
const path = require("path");

const W = 400;
const H = 400;
const FR = 30;
const DUR = 6;
const OP = FR * DUR; // 180

const CX = 200;
const CY = 200;
const R = 86;

const C = {
  ink: [0.086, 0.094, 0.118, 1],
  plate: [0.91, 0.925, 0.949, 1],
  shade: [0.604, 0.639, 0.69, 1],
  platinum: [0.82, 0.843, 0.878, 1],
  white: [1, 1, 1, 1],
  soft: [0.933, 0.945, 0.961, 1],
};

function hex(c) {
  const to = (n) =>
    Math.round(n * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${to(c[0])}${to(c[1])}${to(c[2])}`;
}

/** Temporal ease-in-out for multi-dim props (array form). */
function kfEase() {
  return {
    i: { x: [0.42], y: [1] },
    o: { x: [0.58], y: [0] },
  };
}

function bobPos(frames = OP, amp = 5) {
  const e = kfEase();
  return {
    a: 1,
    k: [
      { t: 0, s: [CX, CY, 0], e: [CX, CY - amp, 0], ...e },
      { t: frames / 2, s: [CX, CY - amp, 0], e: [CX, CY, 0], ...e },
      { t: frames, s: [CX, CY, 0] },
    ],
  };
}

function rotAnim(amp, frames = OP) {
  const e = kfEase();
  return {
    a: 1,
    k: [
      { t: 0, s: [0], e: [amp], ...e },
      { t: frames / 2, s: [amp], e: [0], ...e },
      { t: frames, s: [0] },
    ],
  };
}

function opacityTwinkle(lo, hi, phase = 0) {
  const keys = [];
  const cycles = 2;
  const seg = OP / (cycles * 2);
  for (let i = 0; i <= cycles * 2; i += 1) {
    const raw = Math.round(i * seg + phase) % OP;
    const on = i % 2 === 1;
    const s = on ? hi : lo;
    if (i < cycles * 2) {
      keys.push({
        t: raw,
        s: [s],
        e: [on ? lo : hi],
        i: { x: [0.5], y: [1] },
        o: { x: [0.5], y: [0] },
      });
    }
  }
  keys.sort((a, b) => a.t - b.t);
  // normalize unique increasing t
  const seen = new Set();
  const out = [];
  for (const k of keys) {
    if (seen.has(k.t)) continue;
    seen.add(k.t);
    out.push(k);
  }
  if (!out.length || out[0].t !== 0) {
    out.unshift({ t: 0, s: [lo], e: [hi], i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] } });
  }
  out.push({ t: OP, s: out[0].s });
  return { a: 1, k: out };
}

function ks(opts = {}) {
  return {
    o: opts.o || { a: 0, k: 100 },
    r: opts.r || { a: 0, k: 0 },
    p: opts.p || bobPos(),
    a: { a: 0, k: [0, 0, 0] },
    s: { a: 0, k: [100, 100, 100] },
  };
}

function tr(tx = 0, ty = 0, rot = 0) {
  return {
    ty: "tr",
    p: { a: 0, k: [tx, ty] },
    a: { a: 0, k: [0, 0] },
    s: { a: 0, k: [100, 100] },
    r: { a: 0, k: rot },
    o: { a: 0, k: 100 },
  };
}

function ellipseGroup(sx, sy, fill, stroke, strokeW, opts = {}) {
  const it = [
    {
      ty: "el",
      d: 1,
      p: { a: 0, k: [0, 0] },
      s: { a: 0, k: [sx, sy] },
      nm: "Ellipse Path 1",
    },
  ];
  if (fill) {
    it.push({
      ty: "fl",
      c: { a: 0, k: fill },
      o: { a: 0, k: opts.fillO ?? 100 },
      r: 1,
      nm: "Fill 1",
    });
  }
  if (stroke) {
    it.push({
      ty: "st",
      c: { a: 0, k: stroke },
      o: { a: 0, k: opts.strokeO ?? 100 },
      w: { a: 0, k: strokeW },
      lc: 2,
      lj: 2,
      ml: 4,
      bm: 0,
      nm: "Stroke 1",
    });
  }
  it.push(tr(opts.tx ?? 0, opts.ty ?? 0, opts.rot ?? 0));
  return { ty: "gr", nm: opts.nm || "Ellipse", it, np: it.length, cix: 2 };
}

function pathGroup(verts, fill, opts = {}) {
  const it = [
    {
      ty: "sh",
      nm: "Path 1",
      d: 1,
      ks: {
        a: 0,
        k: {
          i: verts.map((v) => v.i),
          o: verts.map((v) => v.o),
          v: verts.map((v) => v.v),
          c: true,
        },
      },
    },
    {
      ty: "fl",
      c: { a: 0, k: fill },
      o: { a: 0, k: opts.fillO ?? 100 },
      r: 1,
      nm: "Fill 1",
    },
    tr(),
  ];
  return { ty: "gr", nm: opts.nm || "Path", it, np: it.length, cix: 2 };
}

function strokePathGroup(verts, stroke, w, opts = {}) {
  const it = [
    {
      ty: "sh",
      nm: "Path 1",
      d: 1,
      ks: {
        a: 0,
        k: {
          i: verts.map(() => [0, 0]),
          o: verts.map(() => [0, 0]),
          v: verts.map((v) => (Array.isArray(v) ? v : v.v)),
          c: false,
        },
      },
    },
    {
      ty: "st",
      c: { a: 0, k: stroke },
      o: { a: 0, k: opts.strokeO ?? 100 },
      w: { a: 0, k: w },
      lc: 2,
      lj: 2,
      ml: 4,
      bm: 0,
      nm: "Stroke 1",
    },
    tr(),
  ];
  return { ty: "gr", nm: opts.nm || "StrokePath", it, np: it.length, cix: 2 };
}

function shapeLayer(nm, shapes, layerKs, ind) {
  return {
    ddd: 0,
    ind,
    ty: 4,
    nm,
    sr: 1,
    ks: layerKs,
    ao: 0,
    shapes,
    ip: 0,
    op: OP,
    st: 0,
    bm: 0,
  };
}

function closed(points) {
  const pts = [...points];
  const a = pts[0].v;
  const b = pts[pts.length - 1].v;
  if (Math.hypot(a[0] - b[0], a[1] - b[1]) < 0.01) pts.pop();
  return pts;
}

// Swoosh paths in planet-local coords (origin at CX,CY)
const BACK_SWOOSH = closed([
  { v: [36, -52], i: [0, 10], o: [46, -36] },
  { v: [172, -116], i: [-36, 4], o: [6, -0.6] },
  { v: [179, -109], i: [2, -5], o: [-9, 21] },
  { v: [82, -32], i: [48, -22], o: [-14, 6] },
  { v: [44, -21], i: [10, -1], o: [-6, -9] },
]);

const FRONT_SWOOSH = closed([
  { v: [-32, 62], i: [0, -12], o: [-46, 34] },
  { v: [-170, 128], i: [36, -6], o: [-6.5, 1] },
  { v: [-177.5, 121], i: [-2, 5], o: [9.5, -22] },
  { v: [-78, 41], i: [-48, 23], o: [14, -6.5] },
  { v: [-40, 29], i: [-10, 1], o: [6, 9] },
]);

const CRESCENT = [
  { v: [-62, -20], i: [8, -28], o: [-12, 18] },
  { v: [-48, 48], i: [-18, -22], o: [14, 16] },
  { v: [8, 68], i: [-28, 4], o: [22, -2] },
  { v: [18, 20], i: [6, 24], o: [-4, -18] },
  { v: [-10, -28], i: [22, 8], o: [-18, -6] },
];

function buildStipples() {
  const dots = [];
  for (let row = 0; row < 26; row += 1) {
    for (let col = 0; col < 24; col += 1) {
      const x = 108 + col * 5.5 + (row % 2) * 2.75;
      const y = 128 + row * 5.2;
      const dx = x - CX;
      const dy = y - CY;
      const dist = Math.hypot(dx, dy);
      if (dist > R - 3.5) continue;
      const shade = (CX - x) * 0.55 + (y - 120) * 0.62;
      if (x > CX + 8 && y < CY - 8 && shade < 48) {
        if ((row * 17 + col * 13) % 9 !== 0) continue;
      }
      if (shade < 8) continue;
      const r = shade > 90 ? 1.25 : shade > 60 ? 1.0 : shade > 35 ? 0.75 : 0.5;
      const op = shade > 90 ? 92 : shade > 60 ? 72 : shade > 35 ? 48 : 28;
      dots.push({ x: dx, y: dy, r, op });
    }
  }
  return dots;
}

const stipples = buildStipples();

const DOT_TRAIL = [
  { x: -152, y: 36, r: 7.2 },
  { x: -130, y: 38, r: 5.6 },
  { x: -112, y: 39.5, r: 4.2 },
  { x: -97, y: 40.5, r: 3.1 },
  { x: -85, y: 41.2, r: 2.2 },
  { x: -76, y: 41.6, r: 1.5 },
];

const STARS = [
  { x: 52, y: 58, r: 1.8 },
  { x: 348, y: 48, r: 1.5 },
  { x: 44, y: 330, r: 1.6 },
  { x: 356, y: 308, r: 1.4 },
  { x: 110, y: 36, r: 1.2 },
  { x: 308, y: 352, r: 1.2 },
];

function ellipsePoint(t, rx, ry, rotDeg) {
  const rad = (rotDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const x0 = rx * Math.cos(t);
  const y0 = ry * Math.sin(t);
  return [CX + x0 * cos - y0 * sin, CY + x0 * sin + y0 * cos];
}

function orbitPos(phase = 0, rx = 148, ry = 44, rot = -28, bobAmp = 5) {
  const keys = [];
  const steps = 24;
  const e = { i: { x: 0.5, y: 0.5 }, o: { x: 0.5, y: 0.5 } };
  for (let i = 0; i <= steps; i += 1) {
    const u = i / steps;
    const t = phase + u * Math.PI * 2;
    const [x, y0] = ellipsePoint(t, rx, ry, rot);
    // bake gentle bob into orbit so moons stay locked to mark
    const bob = -bobAmp * Math.sin(u * Math.PI * 2);
    const y = y0 + bob;
    const frame = Math.round(u * OP);
    if (i < steps) {
      const [nx, ny0] = ellipsePoint(t + (Math.PI * 2) / steps, rx, ry, rot);
      const nbob = -bobAmp * Math.sin((u + 1 / steps) * Math.PI * 2);
      keys.push({
        t: frame,
        s: [x, y, 0],
        e: [nx, ny0 + nbob, 0],
        ...e,
      });
    } else {
      keys.push({ t: OP, s: [x, y, 0] });
    }
  }
  return { a: 1, k: keys };
}

// --- Layers (first = top) ---
let ind = 1;
const layers = [];

// Twinkle stars (absolute; no bob — sits in field)
STARS.forEach((s, i) => {
  layers.push(
    shapeLayer(
      `Star ${i + 1}`,
      [ellipseGroup(s.r * 2, s.r * 2, C.ink, null, 0)],
      {
        o: opacityTwinkle(22, 100, Math.round((i * OP) / STARS.length / 2)),
        r: { a: 0, k: 0 },
        p: { a: 0, k: [s.x, s.y, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      ind++
    )
  );
});

// Lead moon
layers.push(
  shapeLayer(
    "Moon Lead",
    [ellipseGroup(12.4, 12.4, C.soft, C.ink, 1.7)],
    ks({ p: orbitPos(0.15) }),
    ind++
  )
);

// Dot trail
layers.push(
  shapeLayer(
    "Dot Trail",
    DOT_TRAIL.map((d, i) =>
      ellipseGroup(d.r * 2, d.r * 2, C.ink, null, 0, {
        tx: d.x,
        ty: d.y,
        nm: `Dot ${i + 1}`,
      })
    ),
    ks(),
    ind++
  )
);

// Front swoosh
layers.push(
  shapeLayer(
    "Swoosh Front",
    [
      pathGroup(FRONT_SWOOSH, C.ink, { nm: "Front Fill" }),
      strokePathGroup(
        [
          [-46, 62],
          [-158, 118],
        ],
        C.soft,
        1.8,
        { strokeO: 40, nm: "Front Tick" }
      ),
    ],
    ks({ r: rotAnim(1.6) }),
    ind++
  )
);

// Mid moon
layers.push(
  shapeLayer(
    "Moon Mid",
    [ellipseGroup(7, 7, C.platinum, C.ink, 1.4)],
    ks({ p: orbitPos(Math.PI * 0.85) }),
    ind++
  )
);

// Planet outline (top of planet stack)
layers.push(
  shapeLayer(
    "Planet Outline",
    [ellipseGroup(R * 2, R * 2, null, C.ink, 3.4, { nm: "Outline" })],
    ks(),
    ind++
  )
);

layers.push(
  shapeLayer(
    "Planet Specular",
    [
      ellipseGroup(40, 22, C.white, C.ink, 1.2, {
        tx: 28,
        ty: -42,
        rot: -18,
        nm: "Specular",
      }),
    ],
    ks(),
    ind++
  )
);

// Shade + stipple — dots already clipped to sphere radius (no track matte)
{
  const shapes = [pathGroup(CRESCENT, C.shade, { fillO: 42, nm: "Crescent" })];
  for (const d of stipples) {
    shapes.push(
      ellipseGroup(d.r * 2, d.r * 2, C.ink, null, 0, {
        tx: d.x,
        ty: d.y,
        fillO: d.op,
        nm: "Stipple",
      })
    );
  }
  layers.push(shapeLayer("Planet Shade", shapes, ks(), ind++));
}

layers.push(
  shapeLayer(
    "Planet Plate",
    [ellipseGroup(R * 2, R * 2, C.plate, null, 0, { nm: "Plate" })],
    ks(),
    ind++
  )
);

// Far moon
layers.push(
  shapeLayer(
    "Moon Far",
    [ellipseGroup(9.6, 9.6, C.soft, C.ink, 1.6, { fillO: 85 })],
    ks({ p: orbitPos(Math.PI * 1.45) }),
    ind++
  )
);

// Back swoosh
layers.push(
  shapeLayer(
    "Swoosh Back",
    [
      pathGroup(BACK_SWOOSH, C.ink, { nm: "Back Fill" }),
      strokePathGroup(
        [
          [52, -50],
          [160, -106],
        ],
        C.soft,
        1.8,
        { strokeO: 35, nm: "Back Tick" }
      ),
    ],
    ks({ r: rotAnim(-1.6) }),
    ind++
  )
);

// Orbit guide
layers.push(
  shapeLayer(
    "Orbit Guide",
    [
      ellipseGroup(296, 88, null, C.ink, 1.2, {
        rot: -28,
        strokeO: 18,
        nm: "Orbit",
      }),
    ],
    ks(),
    ind++
  )
);

const lottie = {
  v: "5.7.4",
  fr: FR,
  ip: 0,
  op: OP,
  w: W,
  h: H,
  nm: "Planet MP3 Mascot",
  ddd: 0,
  assets: [],
  layers,
  markers: [],
};

// --- Static SVG (absolute coords) ---
function svgStipple() {
  return stipples
    .map(
      (d) =>
        `<circle cx="${(d.x + CX).toFixed(1)}" cy="${(d.y + CY).toFixed(1)}" r="${d.r}" fill="${hex(C.ink)}" opacity="${(d.op / 100).toFixed(2)}"/>`
    )
    .join("\n      ");
}

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" fill="none" role="img" aria-label="Planet MP3">
  <title>Planet MP3</title>
  <!-- Static hero frame — hard-drawn Y2K ink mark, no wordmark -->
${STARS.map((s) => `  <circle cx="${s.x}" cy="${s.y}" r="${s.r}" fill="${hex(C.ink)}" opacity="0.55"/>`).join("\n")}
  <ellipse cx="${CX}" cy="${CY}" rx="148" ry="44" transform="rotate(-28 ${CX} ${CY})" stroke="${hex(C.ink)}" stroke-width="1.2" opacity="0.18"/>
  <path d="M 236 148 C 282 112, 336 88, 372 84 C 378 83.4, 381 86, 379 91 C 370 112, 330 146, 282 168 C 268 174, 254 178, 244 179 C 238 170, 236 158, 236 148 Z" fill="${hex(C.ink)}"/>
  <path d="M 252 150 C 292 120, 330 100, 360 94" stroke="${hex(C.soft)}" stroke-width="1.8" stroke-linecap="round" opacity="0.35"/>
  <circle cx="118" cy="118" r="4.8" fill="${hex(C.soft)}" stroke="${hex(C.ink)}" stroke-width="1.6" opacity="0.85"/>
  <defs>
    <clipPath id="planetClip"><circle cx="${CX}" cy="${CY}" r="${R}"/></clipPath>
  </defs>
  <circle cx="${CX}" cy="${CY}" r="${R}" fill="${hex(C.plate)}"/>
  <g clip-path="url(#planetClip)">
    <path d="M 138 180 C 146 152, 168 142, 190 152 C 172 160, 158 178, 154 204 C 150 232, 162 258, 188 268 C 160 272, 132 248, 128 216 C 124 192, 128 168, 138 180 Z" fill="${hex(C.shade)}" opacity="0.42"/>
    ${svgStipple()}
  </g>
  <ellipse cx="${CX + 28}" cy="${CY - 42}" rx="20" ry="11" fill="${hex(C.white)}" stroke="${hex(C.ink)}" stroke-width="1.2" transform="rotate(-18 ${CX + 28} ${CY - 42})"/>
  <circle cx="${CX}" cy="${CY}" r="${R}" stroke="${hex(C.ink)}" stroke-width="3.4" fill="none"/>
  <circle cx="318" cy="258" r="3.5" fill="${hex(C.platinum)}" stroke="${hex(C.ink)}" stroke-width="1.4"/>
  <path d="M 168 262 C 122 296, 66 322, 30 328 C 23.5 329, 20.5 326, 22.5 321 C 32 299, 74 264, 122 241 C 136 234.5, 150 230, 160 229 C 166 238, 168 250, 168 262 Z" fill="${hex(C.ink)}"/>
  <path d="M 154 262 C 114 290, 72 312, 42 318" stroke="${hex(C.soft)}" stroke-width="1.8" stroke-linecap="round" opacity="0.4"/>
${DOT_TRAIL.map((d) => `  <circle cx="${d.x + CX}" cy="${d.y + CY}" r="${d.r}" fill="${hex(C.ink)}"/>`).join("\n")}
  <circle cx="278" cy="128" r="6.2" fill="${hex(C.soft)}" stroke="${hex(C.ink)}" stroke-width="1.7"/>
</svg>
`;

const outJsonSrc = path.join(__dirname, "../src/components/brand/planet-mascot.json");
const outJsonPublic = path.join(__dirname, "../public/brand/planet-mascot.json");
const outSvg = path.join(__dirname, "../public/brand/planet-mascot.svg");

fs.mkdirSync(path.dirname(outJsonSrc), { recursive: true });
fs.writeFileSync(outJsonSrc, JSON.stringify(lottie));
fs.writeFileSync(outJsonPublic, JSON.stringify(lottie));
fs.writeFileSync(outSvg, svg);

const json = JSON.stringify(lottie);
console.log(`Wrote ${outJsonSrc}`);
console.log(`Wrote ${outJsonPublic}`);
console.log(`Wrote ${outSvg}`);
console.log(
  `Lottie: ${OP}f @ ${FR}fps = ${DUR}s, ${layers.length} layers, ${stipples.length} stipples, ${(json.length / 1024).toFixed(1)} KB`
);
