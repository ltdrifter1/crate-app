import {
  createListenIntent,
  resolveListenPool,
  resolveMixLane,
  listenPoolLabel,
  listenFocusLabel,
} from "./listenPool";

const catalog = [
  { id: "1", title: "Day Rock", artist: "A", genre: "Rock", energy: 8, duration: 200, audioUrl: "https://x/1.mp3" },
  { id: "2", title: "Night Jazz", artist: "B", genre: "Jazz", energy: 3, duration: 210, audioUrl: "https://x/2.mp3" },
  { id: "3", title: "Both Electronic", artist: "C", genre: "Electronic", energy: 6, duration: 190, audioUrl: "https://x/3.mp3" },
  { id: "4", title: "Techno Cut", artist: "D", genre: "Electronic", energy: 8, duration: 200, audioUrl: "https://x/4.mp3", _scene: { id: "techno" } },
  { id: "5", title: "No Audio Jazz", artist: "E", genre: "Jazz", energy: 2, duration: 180 },
];

describe("listenPool", () => {
  test("resolveMixLane uses intent or clock", () => {
    expect(resolveMixLane({ mixLane: "nighttime" }, 10)).toBe("nighttime");
    expect(resolveMixLane({}, 10)).toBe("daytime");
    expect(resolveMixLane({}, 22)).toBe("nighttime");
  });

  test("scene focus filters before mix lane", () => {
    const { tracks } = resolveListenPool(catalog, {
      mixLane: "daytime",
      scene: "techno",
    });
    expect(tracks.map((t) => t.id)).toEqual(["4"]);
  });

  test("genre focus can skip mix lane when empty", () => {
    const { tracks } = resolveListenPool(catalog, {
      mixLane: "nighttime",
      genre: "Rock",
    }, { applyMixLane: false });
    expect(tracks.some((t) => t.id === "1")).toBe(true);
  });

  test("mix lane alone excludes opposite-leaning genres when energy disagrees", () => {
    const day = resolveListenPool(catalog, { mixLane: "daytime" }, { applyMixLane: true });
    expect(day.tracks.some((t) => t.genre === "Rock")).toBe(true);
    const night = resolveListenPool(catalog, { mixLane: "nighttime" }, { applyMixLane: true });
    expect(night.tracks.some((t) => t.genre === "Jazz" && t.energy <= 4)).toBe(true);
  });

  test("mix lane soft-skips when it would empty a focused pool", () => {
    // Jazz + daytime energy 3 may not fit daytime filter → soft skip keeps genre
    const { tracks, mixLaneSkipped, mixLaneApplied } = resolveListenPool(
      catalog,
      { mixLane: "daytime", genre: "Jazz" }
    );
    expect(tracks.some((t) => t.genre === "Jazz")).toBe(true);
    expect(mixLaneSkipped).toBe(true);
    expect(mixLaneApplied).toBe(false);
  });

  test("requireAudio drops silent tracks", () => {
    const { tracks } = resolveListenPool(catalog, { genre: "Jazz" }, {
      applyMixLane: false,
      requireAudio: true,
    });
    expect(tracks.every((t) => t.audioUrl)).toBe(true);
  });

  test("unfocused pool still returns playable singles", () => {
    const { tracks } = resolveListenPool(catalog, {}, { applyMixLane: false });
    expect(tracks.length).toBeGreaterThan(0);
  });

  test("listenPoolLabel uses focus only — never day/night lane names", () => {
    expect(listenPoolLabel({ mixLane: "daytime" })).toBe("What's in the mix?");
    expect(listenPoolLabel({ mixLane: "nighttime", scene: "techno" })).toBe("Techno");
  });

  test("listenFocusLabel is focus-only", () => {
    expect(listenFocusLabel({ genre: "Jazz" })).toBe("Jazz");
    expect(listenFocusLabel({})).toBeNull();
  });

  test("radio vs session options", () => {
    const radio = resolveListenPool(catalog, { scene: "techno", mixLane: "nighttime" }, { requireAudio: true });
    const session = resolveListenPool(catalog, { scene: "techno", vibe: "party" }, { applyMixLane: false });
    expect(radio.tracks.length).toBeGreaterThan(0);
    expect(session.tracks.length).toBeGreaterThan(0);
  });
});
