jest.mock("lottie-react", () => {
  return function MockLottie() {
    return null;
  };
});

import PlanetMascot from "./PlanetMascot";
import animation from "./planet-mascot.json";

describe("PlanetMascot", () => {
  test("exports an animated brand mascot component", () => {
    expect(typeof PlanetMascot).toBe("function");
  });

  test("ships a pure-vector Lottie planet-mascot animation", () => {
    expect(animation).toBeTruthy();
    expect(animation.nm).toBe("Planet MP3 Mascot");
    expect(animation.w).toBe(400);
    expect(animation.h).toBe(400);
    expect(animation.fr).toBe(30);
    expect(animation.op).toBe(180); // 6s @ 30fps
    expect(animation.assets).toEqual([]);
    expect(Array.isArray(animation.layers)).toBe(true);
    expect(animation.layers.length).toBeGreaterThan(5);
    // No raster/image layers
    expect(animation.layers.every((l) => l.ty !== 2)).toBe(true);
  });
});
