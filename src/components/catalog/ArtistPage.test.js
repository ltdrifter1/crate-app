/**
 * @jest-environment jsdom
 */
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { AlbumPage } from "./ArtistPage";

jest.mock("../../usePlayerTransport", () => ({
  useIsPlaying: () => false,
}));

const album = {
  slug: "signal__night-shift",
  title: "Night Shift",
  artist: "Signal",
  artistSlug: "signal",
  count: 2,
  avgBpm: 120,
  coverTrack: {
    id: "t1",
    title: "Warehouse",
    artist: "Signal",
    albumCover: "cover-a.jpg",
    duration: 200,
  },
  tracks: [
    {
      id: "t1",
      title: "Warehouse",
      artist: "Signal",
      albumCover: "cover-a.jpg",
      duration: 200,
      camelot: "8A",
      bpm: 120,
    },
    {
      id: "t2",
      title: "Guest Cut",
      artist: "Lumen",
      albumCover: "cover-a.jpg",
      duration: 185,
    },
  ],
};

describe("AlbumPage", () => {
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

  test("renders a light album header and compact tracklist", async () => {
    const onPlay = jest.fn();
    const onOpenArtist = jest.fn();
    await act(async () => {
      root.render(
        React.createElement(AlbumPage, {
          album,
          onBack: jest.fn(),
          onPlay,
          onOpenArtist,
        })
      );
    });

    expect(div.textContent).toMatch(/Night Shift/);
    expect(div.textContent).toMatch(/Signal/);
    expect(div.textContent).toMatch(/2 tracks/);
    expect(div.textContent).toMatch(/8A/);
    expect(div.textContent).toMatch(/Warehouse/);
    expect(div.textContent).toMatch(/Guest Cut/);
    expect(div.textContent).toMatch(/Lumen/);
    expect(div.textContent).toMatch(/^[\s\S]*Play[\s\S]*$/);

    expect(div.textContent).not.toMatch(/Featured/);
    expect(div.textContent).not.toMatch(/as an object/);
    expect(div.textContent).not.toMatch(/Drop the needle/);
    expect(div.textContent).not.toMatch(/Play the record/);
    expect(div.textContent).not.toMatch(/worth the needle/);

    const imgs = div.querySelectorAll("img");
    expect(imgs.length).toBe(1);

    const play = [...div.querySelectorAll("button")].find((b) => b.textContent.trim() === "Play");
    expect(play).toBeTruthy();
    await act(async () => {
      play.click();
    });
    expect(onPlay).toHaveBeenCalled();
  });

  test("empty album is a short not-found state", async () => {
    await act(async () => {
      root.render(React.createElement(AlbumPage, { album: null, onBack: jest.fn() }));
    });
    expect(div.textContent).toMatch(/Album not found/);
    expect(div.textContent).not.toMatch(/as an object/);
  });
});
