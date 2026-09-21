/**
 * @jest-environment jsdom
 */
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import AppSidebar from "./AppSidebar";
import { SIDEBAR_TOOLS } from "../../lib/nav";

jest.mock("../brand/BrandMark", () => ({
  BrandLockup: function BrandLockupStub() {
    return null;
  },
}));

describe("AppSidebar source list", () => {
  let div;
  let root;

  beforeEach(() => {
    div = document.createElement("div");
    document.body.appendChild(div);
    root = createRoot(div);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    document.body.removeChild(div);
  });

  test("renders Charts and Build a set as first-class items", async () => {
    const onNavigate = jest.fn();
    const onBuildSet = jest.fn();
    await act(async () => {
      root.render(
        React.createElement(AppSidebar, {
          screen: "home",
          onNavigate,
          onBuildSet,
          user: { name: "Luke" },
        })
      );
    });
    const labels = [...div.querySelectorAll(".nav-rail-btn")].map((el) => el.getAttribute("aria-label"));
    expect(labels).toEqual(expect.arrayContaining(["Home", "Explore", "Library", "Charts", "Build a set", "Club"]));
    expect(SIDEBAR_TOOLS.map((t) => t.label).every((label) => labels.includes(label))).toBe(true);

    await act(async () => {
      div.querySelector('button[aria-label="Charts"]').click();
      div.querySelector('button[aria-label="Build a set"]').click();
    });
    expect(onNavigate).toHaveBeenCalledWith("charts");
    expect(onBuildSet).toHaveBeenCalled();
  });

  test("mobile More drawer lists Charts and Build a set, not the dock tabs", async () => {
    await act(async () => {
      root.render(
        React.createElement(AppSidebar, {
          variant: "drawer",
          screen: "home",
          onNavigate: () => {},
          onBuildSet: () => {},
          user: { name: "Luke" },
        })
      );
    });
    const labels = [...div.querySelectorAll(".nav-rail-btn")].map((el) => el.getAttribute("aria-label"));
    expect(labels).toEqual(["Charts", "Build a set"]);
    expect(div.textContent).toMatch(/More/);
    expect(div.textContent).not.toMatch(/Faceplate/);
    expect(div.querySelector('button[aria-label="Home"]')).toBeNull();
    expect(div.querySelector('button[aria-label="Club"]')).toBeNull();
  });

  test("marks Charts selected when that screen is open", async () => {
    await act(async () => {
      root.render(
        React.createElement(AppSidebar, {
          screen: "charts",
          onNavigate: () => {},
          user: { name: "Luke" },
        })
      );
    });
    const charts = div.querySelector('button[aria-label="Charts"]');
    expect(charts.getAttribute("aria-current")).toBe("page");
    expect(div.querySelector('button[aria-label="Home"]').getAttribute("aria-current")).toBeNull();
  });
});
