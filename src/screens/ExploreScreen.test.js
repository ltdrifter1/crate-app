/**
 * @jest-environment jsdom
 */
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import ExploreScreen from "./ExploreScreen";

jest.mock("../usePlayerTransport", () => ({
  useCurrentTrack: () => null,
  useIsPlaying: () => false,
}));

const catalog = [
  {
    id: "t1",
    title: "Warehouse",
    artist: "Signal",
    album: "Night Shift",
    albumCover: "cover-a.jpg",
    genre: "Techno",
    energy: 8,
    duration: 200,
    playCount: 10,
    audioUrl: "https://cdn.example/a.mp3",
  },
  {
    id: "t2",
    title: "Soft Room",
    artist: "Lumen",
    album: "Night Shift",
    albumCover: "cover-a.jpg",
    genre: "House",
    energy: 5,
    duration: 210,
    playCount: 4,
    audioUrl: "https://cdn.example/b.mp3",
  },
  {
    id: "t3",
    title: "Porch Light",
    artist: "Willow",
    album: "Highways",
    albumCover: "cover-b.jpg",
    genre: "Country & Folk",
    energy: 3,
    duration: 180,
    playCount: 2,
    audioUrl: "https://cdn.example/c.mp3",
  },
  {
    id: "t4",
    title: "Chrome",
    artist: "Willow",
    album: "Highways",
    albumCover: "cover-b.jpg",
    genre: "Pop",
    energy: 6,
    duration: 190,
    playCount: 3,
    audioUrl: "https://cdn.example/d.mp3",
  },
  {
    id: "t5",
    title: "Riff",
    artist: "Ash",
    album: "Gain",
    albumCover: "cover-c.jpg",
    genre: "Metal",
    energy: 9,
    duration: 200,
    playCount: 6,
    audioUrl: "https://cdn.example/e.mp3",
  },
  {
    id: "t6",
    title: "Riff Two",
    artist: "Ash",
    album: "Gain",
    albumCover: "cover-c.jpg",
    genre: "Metal",
    energy: 8,
    duration: 200,
    playCount: 2,
    audioUrl: "https://cdn.example/f.mp3",
  },
];

describe("Explore screen", () => {
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

  test("empty catalog still routes as Explore with search and idle hero", async () => {
    const onOpenSearch = jest.fn();
    await act(async () => {
      root.render(
        React.createElement(ExploreScreen, {
          tracks: [],
          onOpenSearch,
        })
      );
    });
    expect(div.textContent).toMatch(/Explore/);
    expect(div.textContent).toMatch(/Start anywhere/);
    expect(div.textContent).toMatch(/Nothing to dig yet/);
    const search = div.querySelector('button[aria-label="Search"]');
    expect(search).toBeTruthy();
    expect(search.textContent).toMatch(/Search artists, albums, scenes/);
    await act(async () => {
      search.click();
    });
    expect(onOpenSearch).toHaveBeenCalled();
  });

  test("loaded catalog shows hero, genres, albums — not stations or cut counts", async () => {
    const onOpenCharts = jest.fn();
    const onTune = jest.fn();
    await act(async () => {
      root.render(
        React.createElement(ExploreScreen, {
          tracks: catalog,
          countdown: [
            { rank: 1, track: catalog[0] },
            { rank: 2, track: catalog[4] },
          ],
          onOpenSearch: jest.fn(),
          onOpenCharts,
          onTuneSceneChannel: onTune,
          onOpenMenu: jest.fn(),
        })
      );
    });
    expect(div.textContent).toMatch(/Explore/);
    expect(div.textContent).toMatch(/Genres/);
    expect(div.textContent).toMatch(/Electronic/);
    expect(div.textContent).toMatch(/Metal/);
    expect(div.textContent).toMatch(/Moods & moments/);
    expect(div.textContent).toMatch(/Peak time/);
    expect(div.textContent).not.toMatch(/Stations/);
    expect(div.textContent).not.toMatch(/\d+ cuts/);
    expect(div.textContent).toMatch(/Warehouse/);
    expect(div.textContent).not.toMatch(/Showcase station/i);
    expect(div.textContent).not.toMatch(/on the dial/i);
    expect(div.textContent).not.toMatch(/Most requested/i);
    expect(div.textContent).not.toMatch(/On the board/);
    expect(div.querySelector(".pmp-crate-spread")).toBeTruthy();
    expect(div.textContent).toMatch(/Fresh picks|Selected for you/);
    expect(div.querySelector('section[aria-label="Albums"]')).toBeTruthy();
    expect(div.querySelectorAll(".pmp-release--tile").length).toBeGreaterThan(0);
    expect(div.querySelector(".pmp-release--lead")).toBeNull();
    expect(div.querySelector(".pmp-release--count")).toBeNull();
    expect(div.textContent).not.toMatch(/Featured releases/);
    expect(div.textContent).not.toMatch(/Albums worth the needle/);
    expect(div.textContent).not.toMatch(/\bRelease\b/);
    expect(div.querySelector('button[aria-label="Browse"]')).toBeTruthy();
    const charts = [...div.querySelectorAll("button")].find((b) => b.textContent === "Charts");
    expect(charts).toBeFalsy();
    expect(onOpenCharts).not.toHaveBeenCalled();
  });

  test("opening a genre crate stays on Explore and can play the pool", async () => {
    const onPlayTrack = jest.fn();
    await act(async () => {
      root.render(
        React.createElement(ExploreScreen, {
          tracks: catalog,
          onPlayTrack,
        })
      );
    });
    const genre = div.querySelector('button[aria-label="Electronic"]');
    expect(genre).toBeTruthy();
    await act(async () => {
      genre.click();
    });
    expect(div.textContent).toMatch(/‹ Explore/);
    expect(div.textContent).toMatch(/Electronic/);
    expect(div.textContent).not.toMatch(/Moods & moments/);
    const play = [...div.querySelectorAll("button")].find((b) => b.textContent.trim() === "Play");
    expect(play).toBeTruthy();
    await act(async () => {
      play.click();
    });
    expect(onPlayTrack).toHaveBeenCalled();
    const back = div.querySelector('button[aria-label="Back to Explore"]');
    await act(async () => {
      back.click();
    });
    expect(div.textContent).toMatch(/Genres/);
  });

  test("hero Play hands off to a catalog sleeve", async () => {
    const onPlayTrack = jest.fn();
    await act(async () => {
      root.render(
        React.createElement(ExploreScreen, {
          tracks: catalog,
          countdown: [{ rank: 1, track: catalog[0] }],
          onPlayTrack,
        })
      );
    });
    const play = div.querySelector('button[aria-label="Play Warehouse"]');
    expect(play).toBeTruthy();
    expect(play.getAttribute("aria-label")).toMatch(/Warehouse/);
    await act(async () => {
      play.click();
    });
    expect(onPlayTrack).toHaveBeenCalled();
    expect(onPlayTrack.mock.calls[0][0].id).toBe("t1");
  });

  test("catalog loading shows a crate status instead of the empty hole", async () => {
    await act(async () => {
      root.render(
        React.createElement(ExploreScreen, {
          tracks: [],
          catalogLoading: true,
        })
      );
    });
    expect(div.textContent).toMatch(/Tuning the crate/);
    expect(div.textContent).not.toMatch(/Nothing to dig yet/);
  });

  test("does not render CoverFlow dump or leftover search icon chrome", async () => {
    await act(async () => {
      root.render(React.createElement(ExploreScreen, { tracks: catalog }));
    });
    expect(div.querySelector(".cover-tile")).toBeNull();
    expect(div.textContent).not.toMatch(/Picks for you, featured sleeves/);
  });

  test("genre plates load one sleeve each, not a 4-up mosaic", async () => {
    await act(async () => {
      root.render(React.createElement(ExploreScreen, { tracks: catalog }));
    });
    const mosaic = div.querySelector(".pmp-explore-mosaic");
    expect(mosaic).toBeTruthy();
    const plates = mosaic.querySelectorAll(".pmp-explore-genre");
    expect(plates.length).toBeGreaterThan(0);
    plates.forEach((plate) => {
      expect(plate.querySelector("[style*='grid-template-columns']")).toBeNull();
      expect(plate.querySelectorAll("img").length).toBeLessThanOrEqual(1);
    });
  });
});
