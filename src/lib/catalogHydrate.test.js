import { adoptCatalogTracks, patchTrackById } from "./catalogHydrate";

describe("adoptCatalogTracks", () => {
  test("reuses the same objects when only enrichment lands", () => {
    const a = { id: "a", title: "Hi", artist: "X", albumCover: "c.jpg", audioUrl: "u", liked: false };
    const b = { id: "b", title: "Lo", artist: "Y", albumCover: "d.jpg", audioUrl: "v", liked: false };
    const prev = [a, b];
    const next = [
      { ...a, _scene: { id: "house" }, _signal: { pull: 4 } },
      { ...b, _scene: null, _signal: { pull: 1 } },
    ];
    const adopted = adoptCatalogTracks(prev, next);
    expect(adopted[0]).toBe(a);
    expect(adopted[1]).toBe(b);
    expect(a._scene).toEqual({ id: "house" });
    expect(a._signal).toEqual({ pull: 4 });
  });

  test("new object when a display field changes", () => {
    const a = { id: "a", title: "Hi", liked: false };
    const adopted = adoptCatalogTracks([a], [{ ...a, liked: true }]);
    expect(adopted[0]).not.toBe(a);
    expect(adopted[0].liked).toBe(true);
  });

  test("returns next when there is no previous shelf", () => {
    const next = [{ id: "a", title: "Hi" }];
    expect(adoptCatalogTracks([], next)).toBe(next);
  });
});

describe("patchTrackById", () => {
  test("clones only the matched row", () => {
    const a = { id: "a", liked: false, likeCount: 1 };
    const b = { id: "b", liked: false };
    const next = patchTrackById([a, b], "a", (t) => ({ ...t, liked: true, likeCount: 2 }));
    expect(next[0]).not.toBe(a);
    expect(next[1]).toBe(b);
    expect(next[0].liked).toBe(true);
    expect(next[0].likeCount).toBe(2);
  });

  test("no-op when id is missing", () => {
    const list = [{ id: "a" }];
    expect(patchTrackById(list, "z", { liked: true })).toBe(list);
  });
});
