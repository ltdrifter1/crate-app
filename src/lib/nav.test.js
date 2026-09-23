import { PRIMARY_TABS, SIDEBAR_TOOLS, dockActiveTab, primaryNavItems, sidebarActiveId } from "./nav";

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
    expect(ids).not.toContain("set");
  });

  test("left sidebar tools are Charts and Build a set", () => {
    expect(SIDEBAR_TOOLS.map((t) => t.id)).toEqual(["charts", "set"]);
    expect(SIDEBAR_TOOLS.map((t) => t.label)).toEqual(["Charts", "Build a set"]);
  });

  test("sidebarActiveId highlights Charts and Build a set independently of the dock", () => {
    expect(sidebarActiveId("charts")).toBe("charts");
    expect(sidebarActiveId("home")).toBe("home");
    expect(sidebarActiveId("favorites", { buildingSet: true })).toBe("set");
    expect(dockActiveTab("charts")).toBe("home");
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

  test("primaryNavItems never puts Admin on the consumer dock", () => {
    expect(primaryNavItems()).toHaveLength(4);
    expect(primaryNavItems({ showAdmin: true }).map((t) => t.id)).toEqual([
      "home",
      "explore",
      "favorites",
      "profile",
    ]);
  });

  test("dock tabs are keep-alive screens", () => {
    const { KEEP_ALIVE_SCREENS, isKeepAliveScreen } = require("./nav");
    expect(KEEP_ALIVE_SCREENS).toEqual(["home", "explore", "favorites", "profile"]);
    expect(isKeepAliveScreen("home")).toBe(true);
    expect(isKeepAliveScreen("search")).toBe(false);
  });
});
