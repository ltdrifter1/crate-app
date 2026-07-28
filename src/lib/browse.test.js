import { CANONICAL_GENRES, normalizeGenre, GENRE_ALIASES } from "./genres";
import {
  genreBrowseRows,
  scenesForLane,
  tracksForGenreLane,
  tracksForScenePool,
  genreStory,
  GENRE_STORIES,
} from "./browse";
import { SCENES } from "./scenes";

describe("genre → scene browse", () => {
  test("GENRE_STORIES covers every canonical lane", () => {
    CANONICAL_GENRES.forEach((g) => {
      expect(GENRE_STORIES[g]).toBeTruthy();
      expect(genreStory(g).length).toBeGreaterThan(4);
    });
  });

  test("scenesForLane returns Electronic culture scenes", () => {
    const electronic = scenesForLane("Electronic");
    expect(electronic.length).toBeGreaterThan(5);
    expect(electronic.map((s) => s.id)).toEqual(
      expect.arrayContaining(["techno", "deep-house", "uk-garage"])
    );
    expect(electronic.every((s) => s.lane === "Electronic")).toBe(true);
  });

  test("tracksForGenreLane filters by normalized genre", () => {
    const tracks = [
      { id: "1", genre: "Techno", duration: 200 },
      { id: "2", genre: "Jazz", duration: 180 },
      { id: "3", genre: "House", duration: 190 },
      { id: "4", genre: "House", duration: 1200 },
    ];
    const pool = tracksForGenreLane(tracks, "Electronic");
    expect(pool.map((t) => t.id).sort()).toEqual(["1", "3"]);
  });

  test("tracksForScenePool uses scene matching", () => {
    const tracks = [
      { id: "1", genre: "UK Garage", energy: 6, bpm: 132, duration: 200 },
      { id: "2", genre: "Jazz", energy: 3, duration: 180 },
    ];
    const pool = tracksForScenePool(tracks, "uk-garage");
    expect(pool.map((t) => t.id)).toEqual(["1"]);
  });

  test("genreBrowseRows skips empty lanes when catalog present", () => {
    const tracks = [
      { id: "1", genre: "Jazz", duration: 200 },
      { id: "2", genre: "Soul", duration: 190 },
    ];
    const rows = genreBrowseRows(tracks);
    expect(rows.every((r) => r.trackCount > 0)).toBe(true);
    expect(rows.map((r) => r.lane)).toEqual(expect.arrayContaining(["Jazz", "R&B & Soul"]));
    expect(rows.find((r) => r.lane === "Metal")).toBeUndefined();
  });

  test("every scene lane is a canonical genre", () => {
    const set = new Set(CANONICAL_GENRES);
    SCENES.forEach((s) => {
      expect(set.has(s.lane)).toBe(true);
    });
  });

  test("normalize aliases still map into browseable lanes", () => {
    expect(normalizeGenre("techno")).toBe("Electronic");
    expect(GENRE_ALIASES.techno).toBe("Electronic");
    expect(scenesForLane(normalizeGenre("techno")).some((s) => s.id === "techno")).toBe(true);
  });
});
