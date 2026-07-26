import {
  saveListeningState,
  loadListeningState,
  clearListeningState,
} from "./continuity";

const PREFIX = "testapp";

describe("continuity", () => {
  beforeEach(() => localStorage.clear());

  test("round-trips a listening snapshot", () => {
    saveListeningState(PREFIX, {
      trackId: "t1",
      position: 93.7,
      queueIds: ["t2", "t3"],
      isRadioMode: true,
      mixLane: "global",
    });
    const loaded = loadListeningState(PREFIX);
    expect(loaded.trackId).toBe("t1");
    expect(loaded.position).toBe(93);
    expect(loaded.queueIds).toEqual(["t2", "t3"]);
    expect(loaded.isRadioMode).toBe(true);
    expect(loaded.mixLane).toBe("global");
  });

  test("ignores snapshots without a track", () => {
    saveListeningState(PREFIX, { trackId: null, position: 10 });
    expect(loadListeningState(PREFIX)).toBeNull();
  });

  test("expires stale snapshots", () => {
    localStorage.setItem(
      `${PREFIX}.listening`,
      JSON.stringify({ trackId: "t1", position: 5, ts: Date.now() - 1000 * 60 * 60 * 24 * 40 })
    );
    expect(loadListeningState(PREFIX)).toBeNull();
    expect(localStorage.getItem(`${PREFIX}.listening`)).toBeNull();
  });

  test("clearListeningState removes the snapshot", () => {
    saveListeningState(PREFIX, { trackId: "t1", position: 5 });
    clearListeningState(PREFIX);
    expect(loadListeningState(PREFIX)).toBeNull();
  });

  test("survives corrupt storage", () => {
    localStorage.setItem(`${PREFIX}.listening`, "{not json");
    expect(loadListeningState(PREFIX)).toBeNull();
  });
});
