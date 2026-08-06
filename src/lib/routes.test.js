import { parsePath, buildPath, documentTitleFor } from "./routes";

describe("routes", () => {
  test("parsePath maps screens; Home is the start page", () => {
    expect(parsePath("/")).toEqual(expect.objectContaining({ screen: "home", roomId: null }));
    expect(parsePath("/home")).toEqual(expect.objectContaining({ screen: "home", roomId: null }));
    expect(parsePath("/charts")).toEqual(expect.objectContaining({ screen: "charts", roomId: null }));
    expect(parsePath("/discover")).toEqual(expect.objectContaining({ screen: "favorites", roomId: null }));
    expect(parsePath("/you")).toEqual(expect.objectContaining({ screen: "profile", roomId: null }));
  });

  test("legacy room and path URLs redirect to Home", () => {
    expect(parsePath("/rooms")).toEqual(expect.objectContaining({ screen: "home" }));
    expect(parsePath("/rooms/jazz-cafe")).toEqual(expect.objectContaining({ screen: "home", roomId: null }));
    expect(parsePath("/paths")).toEqual(expect.objectContaining({ screen: "home" }));
    expect(parsePath("/paths/night")).toEqual(expect.objectContaining({ screen: "home" }));
    expect(parsePath("/map")).toEqual(expect.objectContaining({ screen: "home" }));
  });

  test("buildPath round-trips and retires rooms/paths/map", () => {
    expect(buildPath("home")).toBe("/home");
    expect(buildPath("charts")).toBe("/charts");
    expect(buildPath("rooms", "detroit")).toBe("/home");
    expect(buildPath("paths")).toBe("/home");
    expect(buildPath("map")).toBe("/home");
    expect(parsePath(buildPath("favorites")).screen).toBe("favorites");
    expect(parsePath(buildPath("charts")).screen).toBe("charts");
  });

  test("mix deep links", () => {
    expect(parsePath("/mix/community-2026-09")).toEqual(
      expect.objectContaining({ screen: "mix", mixId: "community-2026-09" })
    );
    expect(buildPath("mix", { mixId: "pl_1" })).toBe("/mix/pl_1");
    expect(documentTitleFor("mix", "Late Drive")).toContain("Late Drive");
  });

  test("documentTitleFor", () => {
    expect(documentTitleFor("home")).toContain("Home");
    expect(documentTitleFor("charts")).toContain("Charts");
    expect(documentTitleFor("favorites")).toContain("Library");
    expect(documentTitleFor("profile")).toContain("You");
    expect(documentTitleFor("search")).toContain("Search");
    expect(documentTitleFor("artist", "Nina")).toContain("Nina");
  });
});
