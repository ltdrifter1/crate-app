/**
 * @jest-environment node
 */
import {
  lookFromPointer,
  worldLayerTransform,
  hotspotLayout,
  worldEnteredStorageKey,
  WORLD_LOOK_MAX_YAW,
  WORLD_LOOK_MAX_PITCH,
} from "./worldLook";

describe("worldLook", () => {
  test("center pointer is a still room", () => {
    expect(lookFromPointer({ x: 200, y: 100, width: 400, height: 200 })).toEqual({
      yaw: 0,
      pitch: 0,
    });
  });

  test("right edge yaws to the max", () => {
    const look = lookFromPointer({ x: 400, y: 100, width: 400, height: 200 });
    expect(look.yaw).toBe(WORLD_LOOK_MAX_YAW);
    expect(look.pitch).toBe(0);
  });

  test("bottom edge pitches to the max", () => {
    const look = lookFromPointer({ x: 200, y: 200, width: 400, height: 200 });
    expect(look.pitch).toBe(WORLD_LOOK_MAX_PITCH);
  });

  test("zero size stays still", () => {
    expect(lookFromPointer({ x: 10, y: 10, width: 0, height: 0 })).toEqual({
      yaw: 0,
      pitch: 0,
    });
  });

  test("layer transform includes translate and rotate", () => {
    const css = worldLayerTransform({ yaw: 8, pitch: -4 }, 1.2);
    expect(css).toMatch(/translate3d\(/);
    expect(css).toMatch(/rotateY\(/);
    expect(css).toMatch(/rotateX\(/);
  });

  test("hotspots sit on an ellipse and shift with look", () => {
    const still = hotspotLayout(4, { yaw: 0, pitch: 0 });
    const looked = hotspotLayout(4, { yaw: 10, pitch: 4 });
    expect(still).toHaveLength(4);
    expect(looked[0].x).toBeGreaterThan(still[0].x);
    expect(looked[0].y).toBeGreaterThan(still[0].y);
  });

  test("storage key is namespaced", () => {
    expect(worldEnteredStorageKey("planetmp3")).toBe("planetmp3.worldEntered");
  });
});
