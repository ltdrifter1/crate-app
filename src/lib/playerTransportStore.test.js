import { playerTransportStore } from "./playerTransportStore";
import { transportFlags, useCurrentTrack, useIsPlaying } from "../usePlayerTransport";

describe("playerTransportStore", () => {
  beforeEach(() => {
    playerTransportStore._resetForTests();
  });

  test("setPlaying does not change track identity", () => {
    const track = { id: "a", title: "Cut" };
    transportFlags.setTrack(track);
    const before = playerTransportStore.getState().track;
    transportFlags.setPlaying(true);
    expect(playerTransportStore.getState().isPlaying).toBe(true);
    expect(playerTransportStore.getState().track).toBe(before);
  });

  test("setTrack updates trackId", () => {
    transportFlags.setTrack({ id: "x", title: "X" });
    expect(playerTransportStore.getState().trackId).toBe("x");
    transportFlags.setTrack(null);
    expect(playerTransportStore.getState().trackId).toBeNull();
  });

  test("hooks export selectors", () => {
    expect(typeof useCurrentTrack).toBe("function");
    expect(typeof useIsPlaying).toBe("function");
  });
});
