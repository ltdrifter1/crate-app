/**
 * @jest-environment jsdom
 */
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import BottomNavigation from "./BottomNavigation";
import HomeHeader from "./HomeHeader";
import HeroPlayerCard from "./HeroPlayerCard";
import { PRIMARY_TABS, primaryNavItems } from "../../lib/nav";

jest.mock("../../usePlayerPlayback", () => ({
  usePlayerPlayback: () => ({ progress: 12, duration: 180 }),
}));

jest.mock("../../usePlayerTransport", () => ({
  useIsPlaying: () => true,
  useCurrentTrack: () => ({
    id: "t1",
    title: "Night Drive",
    artist: "Signal",
    albumCover: "/brand/planet-mp3-lockup-on-black.png",
    videoUrl: "https://cdn.example/night-drive.mp4",
  }),
}));

describe("Home broadcast + four-tab IA", () => {
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

  test("dock renders four primary tabs and not Charts or Search", async () => {
    await act(async () => {
      root.render(
        React.createElement(BottomNavigation, {
          items: primaryNavItems(),
          activeId: "home",
        })
      );
    });
    const labels = [...div.querySelectorAll(".pill-tab")].map((el) => el.getAttribute("aria-label"));
    expect(labels).toEqual(PRIMARY_TABS.map((t) => t.label));
    expect(labels).toHaveLength(4);
    expect(labels).not.toContain("Charts");
    expect(labels).not.toContain("Search");
  });

  test("Home header exposes Charts and Search once they leave the dock", async () => {
    const onOpenCharts = jest.fn();
    const onOpenSearch = jest.fn();
    await act(async () => {
      root.render(
        React.createElement(HomeHeader, { onOpenCharts, onOpenSearch })
      );
    });
    const charts = div.querySelector('button[aria-label="Charts"]');
    const search = div.querySelector('button[aria-label="Search"]');
    expect(charts).toBeTruthy();
    expect(search).toBeTruthy();
    await act(async () => {
      charts.click();
      search.click();
    });
    expect(onOpenCharts).toHaveBeenCalled();
    expect(onOpenSearch).toHaveBeenCalled();
  });

  test("hero stage mounts a synced video plane when the cut has videoUrl", async () => {
    const track = {
      id: "t1",
      title: "Night Drive",
      artist: "Signal",
      albumCover: "/brand/planet-mp3-lockup-on-black.png",
      videoUrl: "https://cdn.example/night-drive.mp4",
    };
    await act(async () => {
      root.render(
        React.createElement(HeroPlayerCard, {
          track,
          isRadioMode: true,
          sceneChannel: { id: "rap", num: 3, shortTitle: "Rap City", title: "Rap City" },
        })
      );
    });
    const video = div.querySelector("video");
    expect(video).toBeTruthy();
    expect(video.getAttribute("src")).toBe(track.videoUrl);
    expect(div.textContent).toMatch(/CH-03/i);
    expect(div.textContent).toMatch(/Video/i);
    expect(div.textContent).toMatch(/Night Drive/);
  });
});
