import {
  createListenIntent,
  resolveDaypart,
  resolveListenPool,
  listenPoolLabel,
  listenFocusLabel,
} from "./listenPool";

const catalog = [
  { id: "1", title: "UKG", genre: "UK Garage", energy: 6, bpm: 132, duration: 200, audioUrl: "a.mp3" },
  { id: "2", title: "Jazz Soft", genre: "Jazz", energy: 3, duration: 180, audioUrl: "b.mp3" },
  { id: "3", title: "Techno Night", genre: "Techno", energy: 9, bpm: 135, duration: 210, audioUrl: "c.mp3" },
  { id: "4", title: "Rock Day", genre: "Rock", energy: 7, duration: 190, audioUrl: "d.mp3" },
  { id: "5", title: "No Audio", genre: "House", energy: 5, duration: 200, audioUrl: "" },
  { id: "6", title: "Long Mix", genre: "House", energy: 6, duration: 1200, audioUrl: "e.mp3" },
];

describe("resolveListenPool", () => {
  test("createListenIntent normalizes genre", () => {
    expect(createListenIntent({ genre: "techno" }).genre).toBe("Electronic");
    expect(createListenIntent({ genre: "House" }).genre).toBe("Electronic");
    expect(createListenIntent({ scene: "uk-garage" }).scene).toBe("uk-garage");
  });

  test("resolveDaypart uses intent or clock", () => {
    expect(resolveDaypart({ daypart: "nighttime" }, 10)).toBe("nighttime");
    expect(resolveDaypart({}, 10)).toBe("daytime");
    expect(resolveDaypart({}, 22)).toBe("nighttime");
  });

  test("scene focus filters before daypart", () => {
    const { tracks, applied, label } = resolveListenPool(catalog, {
      daypart: "daytime",
      scene: "uk-garage",
    });
    expect(tracks.map((t) => t.id)).toEqual(["1"]);
    expect(applied).toContain("scene");
    expect(label).toMatch(/UK Garage/);
  });

  test("genre focus keeps Electronic lane including techno/house storage", () => {
    const { tracks } = resolveListenPool(catalog, {
      daypart: "nighttime",
      genre: "Electronic",
    }, { applyDaypart: false });
    expect(tracks.map((t) => t.id).sort()).toEqual(["1", "3", "5"]);
  });

  test("daypart alone excludes opposite-leaning genres when energy disagrees", () => {
    const day = resolveListenPool(catalog, { daypart: "daytime" }, { applyDaypart: true });
    expect(day.tracks.some((t) => t.id === "4")).toBe(true); // Rock day lean
    const night = resolveListenPool(catalog, { daypart: "nighttime" }, { applyDaypart: true });
    expect(night.tracks.some((t) => t.id === "2")).toBe(true); // Jazz night lean
  });

  test("daypart soft-skips when it would empty a focused pool", () => {
    // Jazz + daytime: Jazz is night-lean; energy 3 fails daytime (>=5) —
    // keep the focus pool instead of emptying.
    const { tracks, daypartSkipped, daypartApplied } = resolveListenPool(
      [{ id: "j", genre: "Jazz", energy: 2, duration: 180, audioUrl: "x" }],
      { daypart: "daytime", genre: "Jazz" }
    );
    expect(tracks).toHaveLength(1);
    expect(daypartSkipped).toBe(true);
    expect(daypartApplied).toBe(false);
  });

  test("requireAudio drops silent tracks", () => {
    const { tracks } = resolveListenPool(catalog, { genre: "Electronic" }, {
      requireAudio: true,
      applyDaypart: false,
    });
    expect(tracks.every((t) => t.audioUrl)).toBe(true);
    expect(tracks.map((t) => t.id)).not.toContain("5");
  });

  test("excludes long mixes (>900s)", () => {
    const { tracks } = resolveListenPool(catalog, {}, { applyDaypart: false });
    expect(tracks.map((t) => t.id)).not.toContain("6");
  });

  test("listenPoolLabel composes focus + daypart or vibe", () => {
    expect(listenPoolLabel({ daypart: "daytime" })).toBe("Daytime");
    expect(listenPoolLabel({ daypart: "nighttime", scene: "techno" })).toBe("Techno · Nighttime");
    expect(listenPoolLabel({ vibe: "drive", genre: "Soul" })).toBe("R&B & Soul · Drive");
    expect(listenFocusLabel({ scene: "ambient" })).toBe("Ambient");
    expect(listenFocusLabel({})).toBeNull();
  });

  test("radio and session share the same scene pool shape", () => {
    const radio = resolveListenPool(catalog, { scene: "techno", daypart: "nighttime" }, { requireAudio: true });
    const session = resolveListenPool(catalog, { scene: "techno", vibe: "party" }, { applyDaypart: false });
    expect(radio.tracks.every((t) => session.tracks.some((s) => s.id === t.id) || t.id === "3")).toBe(true);
    expect(session.tracks.map((t) => t.id)).toContain("3");
    expect(radio.label).toMatch(/Techno/);
    expect(listenPoolLabel({ ...session.intent, vibe: "party" })).toMatch(/Party/);
  });
});
