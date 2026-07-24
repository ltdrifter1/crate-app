import { parsePath, buildPath, documentTitleFor } from "./routes";
import { digLeadStory, explainPick, storyForRoomTrack } from "./explain";
import { buildHomeCollections, livedInRooms, rediscoveredTracks } from "./homeCollections";

describe("routes", () => {
  test("parsePath maps screens and room ids", () => {
    expect(parsePath("/")).toEqual({ screen: "rooms", roomId: null });
    expect(parsePath("/home")).toEqual({ screen: "home", roomId: null });
    expect(parsePath("/discover")).toEqual({ screen: "favorites", roomId: null });
    expect(parsePath("/rooms/jazz-cafe")).toEqual({ screen: "rooms", roomId: "jazz-cafe" });
    expect(parsePath("/you")).toEqual({ screen: "profile", roomId: null });
  });

  test("buildPath round-trips", () => {
    expect(buildPath("home")).toBe("/home");
    expect(buildPath("rooms", "detroit")).toBe("/rooms/detroit");
    expect(parsePath(buildPath("favorites")).screen).toBe("favorites");
  });

  test("documentTitleFor", () => {
    expect(documentTitleFor("rooms", "London")).toContain("London");
    expect(documentTitleFor("search")).toContain("Search");
  });
});

describe("explain", () => {
  test("digLeadStory returns eyebrow and body", () => {
    const s = digLeadStory("Peak", { blurb: "Hands up." }, { liked: true });
    expect(s.eyebrow).toContain("Peak");
    expect(s.body).toBe("Hands up.");
  });

  test("explainPick cites room and key", () => {
    const line = explainPick(
      { title: "A", camelot: "8A", energy: 7, genre: "House" },
      { room: { label: "Warehouse" }, preferredGenres: ["House"] }
    );
    expect(line).toContain("Warehouse");
  });

  test("storyForRoomTrack", () => {
    expect(storyForRoomTrack({ liked: true, genre: "Jazz" }, { label: "Jazz Cafe" })).toContain(
      "Jazz Cafe"
    );
  });
});

describe("homeCollections", () => {
  const tracks = [
    { id: "1", title: "A", genre: "Jazz", energy: 2, duration: 180, liked: true, playCount: 2, _signal: { pull: 6 } },
    { id: "2", title: "B", genre: "House", energy: 9, duration: 200, liked: false, playCount: 8 },
    { id: "3", title: "C", genre: "Soul", energy: 3, duration: 190, liked: true, playCount: 0 },
  ];

  test("buildHomeCollections returns non-empty shelves", () => {
    const cols = buildHomeCollections(tracks);
    expect(cols.length).toBeGreaterThan(0);
    expect(cols.every((c) => c.tracks.length > 0)).toBe(true);
  });

  test("rediscoveredTracks finds mid-play favourites", () => {
    expect(rediscoveredTracks(tracks).some((t) => t.id === "1")).toBe(true);
  });

  test("livedInRooms prefers homeRoomIds", () => {
    const rooms = livedInRooms(tracks, ["jazz-cafe"], 3);
    expect(rooms[0]?.id).toBe("jazz-cafe");
  });
});
