import { ON_AIR_SLOT_MS, buildOnAirRotations, msUntilNextSlot, onAirNow, onAirSlot } from "./onAir";
import { getSceneChannel } from "./sceneChannels";

function cut(id, partial = {}) {
  return { id, title: id, artist: "A", duration: 200, audioUrl: "u", albumCover: `${id}.jpg`, genre: "Metal", ...partial };
}

describe("onAir", () => {
  const metal = getSceneChannel("metal");
  const tracks = [cut("m1"), cut("m2"), cut("m3"), cut("silent", { audioUrl: "" }), cut("nah", { disliked: true })];

  test("same slot, same pick — independent of catalog order", () => {
    const slot = onAirSlot(Date.UTC(2026, 9, 25, 12, 0));
    const a = onAirNow(buildOnAirRotations(tracks, [metal]), slot);
    const b = onAirNow(buildOnAirRotations(tracks.slice().reverse(), [metal]), slot);
    expect(a.metal).toBeTruthy();
    expect(a.metal.id).toBe(b.metal.id);
  });

  test("never picks a cut without audio or one the listener disliked", () => {
    const rotations = buildOnAirRotations(tracks, [metal]);
    for (let slot = 0; slot < 50; slot += 1) {
      expect(["m1", "m2", "m3"]).toContain(onAirNow(rotations, slot).metal.id);
    }
  });

  test("slot clock", () => {
    expect(onAirSlot(ON_AIR_SLOT_MS * 3 + 5)).toBe(3);
    expect(msUntilNextSlot(ON_AIR_SLOT_MS * 3 + 1000)).toBe(ON_AIR_SLOT_MS - 1000);
  });
});
