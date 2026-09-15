/**
 * Spatial look-around for the Home World Stage.
 * Pointer → yaw/pitch, layered CSS transforms, hotspot ellipse.
 * Pure math so the 360-pano feeling is testable without a DOM.
 */

export const WORLD_LOOK_MAX_YAW = 10;
export const WORLD_LOOK_MAX_PITCH = 6;

/**
 * Normalize pointer position inside a stage into yaw/pitch degrees.
 * @param {{ x: number, y: number, width: number, height: number, maxYaw?: number, maxPitch?: number }} opts
 */
export function lookFromPointer({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  maxYaw = WORLD_LOOK_MAX_YAW,
  maxPitch = WORLD_LOOK_MAX_PITCH,
} = {}) {
  if (!(width > 0) || !(height > 0)) return { yaw: 0, pitch: 0 };
  const nx = Math.max(-1, Math.min(1, (x / width) * 2 - 1));
  const ny = Math.max(-1, Math.min(1, (y / height) * 2 - 1));
  return {
    yaw: nx * maxYaw,
    pitch: ny * maxPitch,
  };
}

/**
 * CSS 3d transform for a parallax layer. Higher depth = more travel.
 * @param {{ yaw?: number, pitch?: number }} look
 * @param {number} depth
 */
export function worldLayerTransform(look = {}, depth = 1) {
  const yaw = Number(look.yaw) || 0;
  const pitch = Number(look.pitch) || 0;
  const d = Number.isFinite(depth) ? depth : 1;
  const tx = (-yaw * d * 1.8).toFixed(2);
  const ty = (-pitch * d * 1.8).toFixed(2);
  const ry = (yaw * 0.42 * d).toFixed(3);
  const rx = (-pitch * 0.5 * d).toFixed(3);
  return `translate3d(${tx}px, ${ty}px, 0) rotateY(${ry}deg) rotateX(${rx}deg)`;
}

/**
 * Place n hotspots on an ellipse, offset by look so they drift with the room.
 * @param {number} count
 * @param {{ yaw?: number, pitch?: number }} look
 */
export function hotspotLayout(count = 0, look = {}) {
  const n = Math.max(0, Math.floor(Number(count) || 0));
  const yaw = Number(look.yaw) || 0;
  const pitch = Number(look.pitch) || 0;
  if (n === 0) return [];
  return Array.from({ length: n }, (_, i) => {
    const t = (i / n) * Math.PI * 2 - Math.PI / 2;
    const spread = n === 1 ? 0 : 36;
    return {
      i,
      x: 50 + Math.cos(t) * spread + yaw * 0.55,
      y: 44 + Math.sin(t) * 22 + pitch * 0.45,
    };
  });
}

export function worldEnteredStorageKey(prefix = "planetmp3") {
  return `${prefix}.worldEntered`;
}
