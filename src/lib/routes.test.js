import { parsePath, buildPath, documentTitleFor } from "./routes";

describe("routes", () => {
  test("parsePath maps screens and room ids", () => {
    expect(parsePath("/")).toEqual(expect.objectContaining({ screen: "rooms", roomId: null }));
    expect(parsePath("/home")).toEqual(expect.objectContaining({ screen: "home", roomId: null }));
    expect(parsePath("/discover")).toEqual(expect.objectContaining({ screen: "favorites", roomId: null }));
    expect(parsePath("/rooms/jazz-cafe")).toEqual(
      expect.objectContaining({ screen: "rooms", roomId: "jazz-cafe" })
    );
    expect(parsePath("/you")).toEqual(expect.objectContaining({ screen: "profile", roomId: null }));
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
