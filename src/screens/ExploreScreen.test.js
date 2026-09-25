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
    camelot: "8A",
    audioUrl: "https://cdn.example/a.mp3",
    createdAt: { seconds: 50 },
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
    camelot: "5A",
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

function tab(div, name) {
  return div.querySelector(`button[role="tab"][aria-label="${name}"]`);
}

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

  test("empty catalog still routes as Explore with find and idle directory", async () => {
    const onOpenSearch = jest.fn();
    await act(async () => {
      root.render(
        React.createElement(ExploreScreen, {
          tracks: [],
          onOpenSearch,
        })
      );
    });
    expect(div.textContent).toMatch(/Discover/);
    expect(div.textContent).toMatch(/New music around what you play/);
    expect(div.textContent).toMatch(/Nothing to dig yet/);
    const search = div.querySelector('button[aria-label="Search"]');
    expect(search).toBeTruthy();
    expect(search.textContent).toMatch(/Find a city, scene, or sleeve/);
    await act(async () => {
      search.click();
    });
    expect(onOpenSearch).toHaveBeenCalled();
  });

  test("loaded catalog is a directory, not a second Home", async () => {
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
    expect(div.textContent).toMatch(/Discover/);
    expect(div.textContent).toMatch(/Directory/);
    expect(div.textContent).toMatch(/6 cuts in the crate/);
    expect(div.textContent).toMatch(/New Releases/);
    expect(div.textContent).toMatch(/Worlds/);
    expect(div.querySelector('button[role="tab"][aria-selected="true"]').textContent).toMatch(/New Releases/);
    expect(div.querySelector('section[aria-label="New Releases"]')).toBeTruthy();
    expect(div.textContent).toMatch(/Night Shift|Highways|Gain/);
    expect(div.textContent).not.toMatch(/Moods & moments/);
    expect(div.textContent).not.toMatch(/Stations/);
    expect(div.textContent).toMatch(/Channel Surfing/);
    expect(div.querySelector(".pmp-channel-surf")).toBeTruthy();
    expect(div.textContent).not.toMatch(/Recently played/);
    expect(div.querySelector(".pmp-crate-spread")).toBeFalsy();
    expect(div.querySelector('section[aria-label="Albums"]')).toBeFalsy();
    expect(div.querySelector('button[aria-label="More"]')).toBeTruthy();
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
    await act(async () => {
      tab(div, "Worlds").click();
    });
    const genre = div.querySelector('button[aria-label^="Electronic"]');
    expect(genre).toBeTruthy();
    await act(async () => {
      genre.click();
    });
    expect(div.textContent).toMatch(/‹ Discover/);
    expect(div.textContent).toMatch(/Electronic/);
    expect(div.textContent).toMatch(/8A/);
    expect(div.textContent).not.toMatch(/Lanes/);
    const play = [...div.querySelectorAll("button")].find((b) => b.textContent.trim() === "Play");
    expect(play).toBeTruthy();
    await act(async () => {
      play.click();
    });
    expect(onPlayTrack).toHaveBeenCalled();
    const back = div.querySelector('button[aria-label="Back to Discover"]');
    await act(async () => {
      back.click();
    });
    expect(div.textContent).toMatch(/Worlds/);
  });

  test("Mix pads hand off a Camelot crate", async () => {
    const onPlayTrack = jest.fn();
    await act(async () => {
      root.render(
        React.createElement(ExploreScreen, {
          tracks: catalog,
          onPlayTrack,
        })
      );
    });
    await act(async () => {
      tab(div, "Mix").click();
    });
    const play = div.querySelector('button[aria-label="Play Camelot 8A"]');
    expect(play).toBeTruthy();
    await act(async () => {
      play.click();
    });
    expect(onPlayTrack).toHaveBeenCalled();
    expect(onPlayTrack.mock.calls[0][0].id).toBe("t1");
  });

  test("New Releases is a channel-filtered sleeve grid", async () => {
    const onOpenAlbum = jest.fn();
    await act(async () => {
      root.render(React.createElement(ExploreScreen, { tracks: catalog, onOpenAlbum }));
    });
    expect(div.querySelector('section[aria-label="New Releases"]')).toBeTruthy();
    expect(div.querySelector(".pmp-new-releases-grid")).toBeTruthy();
    const metal = div.querySelector('button[aria-label="CH-11  Metal"]');
    expect(metal).toBeTruthy();
    await act(async () => {
      metal.click();
    });
    expect(div.textContent).toMatch(/Gain/);
    expect(div.textContent).not.toMatch(/Highways/);
    const sleeve = div.querySelector(".pmp-release");
    await act(async () => {
      sleeve.click();
    });
    expect(onOpenAlbum).toHaveBeenCalled();
  });

  test("Energy mode is rooms, not a poster rail", async () => {
    await act(async () => {
      root.render(React.createElement(ExploreScreen, { tracks: catalog }));
    });
    await act(async () => {
      tab(div, "Energy").click();
    });
    expect(div.textContent).toMatch(/Peak time/);
    expect(div.textContent).toMatch(/One strip/);
    expect(div.querySelector(".pmp-energy-strip")).toBeTruthy();
    expect(div.textContent).not.toMatch(/Moods & moments/);
    expect(div.querySelector(".pmp-energy-room")).toBeFalsy();
  });

  test("Energy zone plays the crate immediately", async () => {
    const onPlayTrack = jest.fn();
    await act(async () => {
      root.render(
        React.createElement(ExploreScreen, {
          tracks: catalog,
          onPlayTrack,
        })
      );
    });
    await act(async () => {
      tab(div, "Energy").click();
    });
    const peak = div.querySelector('button[aria-label="Play Peak time"]');
    expect(peak).toBeTruthy();
    await act(async () => {
      peak.click();
    });
    expect(onPlayTrack).toHaveBeenCalled();
    expect(div.textContent).toMatch(/Peak time/);
    expect(div.textContent).not.toMatch(/‹ Explore/);
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

  test("first paint is New Releases and does not build the world tray yet", async () => {
    await act(async () => {
      root.render(React.createElement(ExploreScreen, { tracks: catalog }));
    });
    expect(div.querySelector('section[aria-label="New Releases"]')).toBeTruthy();
    expect(div.querySelector(".pmp-world-tray")).toBeFalsy();
    expect(div.querySelector(".pmp-energy-strip")).toBeFalsy();
    expect(div.querySelector(".pmp-mix-wheel")).toBeFalsy();
  });

  test("does not render CoverFlow dump or leftover search icon chrome", async () => {
    await act(async () => {
      root.render(React.createElement(ExploreScreen, { tracks: catalog }));
    });
    expect(div.querySelector(".cover-tile")).toBeNull();
    expect(div.textContent).not.toMatch(/Picks for you, featured sleeves/);
  });

  test("world tiles are a disc tray, not a 4-up mosaic poster", async () => {
    await act(async () => {
      root.render(React.createElement(ExploreScreen, { tracks: catalog }));
    });
    await act(async () => {
      tab(div, "Worlds").click();
    });
    const tray = div.querySelector(".pmp-world-tray");
    expect(tray).toBeTruthy();
    const tiles = tray.querySelectorAll(".pmp-world-tile");
    expect(tiles.length).toBeGreaterThan(0);
    expect(tray.querySelector(".pmp-world-tile--lead")).toBeTruthy();
  });

  test("Discover hosts Channel Surfing after New Releases when the dial is wired", async () => {
    const onTune = jest.fn();
    await act(async () => {
      root.render(
        React.createElement(ExploreScreen, {
          tracks: catalog,
          onTuneSceneChannel: onTune,
        })
      );
    });
    const surf = div.querySelector(".pmp-channel-surf");
    expect(surf).toBeTruthy();
    expect(div.textContent).toMatch(/Channel Surfing/);
    expect(div.querySelector('section[aria-label="New Releases"]')).toBeTruthy();
    const src = require("fs").readFileSync(require("path").join(__dirname, "ExploreScreen.jsx"), "utf8");
    expect(src.indexOf("NewReleases")).toBeLessThan(src.indexOf("ChannelSurfingSection"));
    const local = [...surf.querySelectorAll(".pmp-channel-card")].find((el) =>
      el.textContent.includes("Local")
    );
    expect(local).toBeTruthy();
    await act(async () => {
      local.click();
    });
    expect(onTune).toHaveBeenCalled();
    expect(onTune.mock.calls[0][0].id).toBe("local-pnw");
  });
});
