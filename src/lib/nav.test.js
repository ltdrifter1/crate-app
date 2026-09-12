import { PRIMARY_TABS, dockActiveTab, primaryNavItems } from "./nav";

describe("product nav IA", () => {
  test("dock has four primary tabs: Home, Explore, Library, Club", () => {
    expect(PRIMARY_TABS.map((t) => t.id)).toEqual([
      "home",
      "explore",
      "favorites",
      "profile",
    ]);
    expect(PRIMARY_TABS.map((t) => t.label)).toEqual([
      "Home",
      "Explore",
      "Library",
      "Club",
    ]);
    expect(PRIMARY_TABS).toHaveLength(4);
  });

  test("Charts and Search are not dock destinations", () => {
    const ids = PRIMARY_TABS.map((t) => t.id);
    expect(ids).not.toContain("charts");
    expect(ids).not.toContain("search");
  });

  test("dockActiveTab maps secondary screens onto the four tabs", () => {
    expect(dockActiveTab("home")).toBe("home");
    expect(dockActiveTab("charts")).toBe("home");
    expect(dockActiveTab("explore")).toBe("explore");
    expect(dockActiveTab("search")).toBe("explore");
    expect(dockActiveTab("artist")).toBe("explore");
    expect(dockActiveTab("album")).toBe("explore");
    expect(dockActiveTab("favorites")).toBe("favorites");
    expect(dockActiveTab("mix")).toBe("favorites");
    expect(dockActiveTab("profile")).toBe("profile");
    expect(dockActiveTab("admin")).toBe("home");
    expect(dockActiveTab("admin", { hasAdmin: true })).toBe("admin");
  });

  test("primaryNavItems optionally appends Admin", () => {
    expect(primaryNavItems()).toHaveLength(4);
    expect(primaryNavItems({ showAdmin: true }).map((t) => t.id)).toEqual([
      "home",
      "explore",
      "favorites",
      "profile",
      "admin",
    ]);
  });
});
