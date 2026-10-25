/**
 * @jest-environment jsdom
 */
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import ArtistPage, { AlbumPage } from "./ArtistPage";

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

describe("ArtistPage", () => {
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

  const techno = (id, title, artist) => ({
    id, title, artist, genre: "Techno", albumCover: `${id}.jpg`, duration: 200, bpm: 130, camelot: "8A",
  });

  test("Same shelf lists other artists filed on the same channel and opens them", async () => {
    const catalog = [
      techno("s1", "Modular", "Signal"),
      techno("s2", "Concrete", "Signal"),
      techno("g1", "Iron Lung", "Gridlock"),
      techno("f1", "Slag", "Foundry"),
      { id: "w1", title: "Porch Light", artist: "Willow", genre: "Country & Folk", albumCover: "w1.jpg", duration: 180 },
    ];
    const artist = {
      slug: "signal", name: "Signal", count: 2, tracks: catalog.slice(0, 2), coverTrack: catalog[0], albums: [], topGenre: "Techno",
    };
    const onOpenArtist = jest.fn();
    await act(async () => {
      root.render(
        React.createElement(ArtistPage, {
          artist,
          tracks: catalog,
          onBack: jest.fn(),
          onPlay: jest.fn(),
          onOpenAlbum: jest.fn(),
          onOpenArtist,
        })
      );
    });
    const shelf = div.querySelector('section[aria-label="Same shelf"]');
    expect(shelf).toBeTruthy();
    expect(shelf.textContent).toMatch(/Same shelf/);
    expect(shelf.textContent).toMatch(/Gridlock/);
    expect(shelf.textContent).toMatch(/Foundry/);
    // Not itself, and not an artist from another channel.
    expect(shelf.textContent).not.toMatch(/Signal/);
    expect(shelf.textContent).not.toMatch(/Willow/);
    expect(shelf.textContent).toMatch(/CH-\d\d/);
    await act(async () => {
      shelf.querySelector('button[aria-label="Open Gridlock"]').click();
    });
    expect(onOpenArtist).toHaveBeenCalledWith("Gridlock");
  });

  test("no shelf when the catalog holds nobody else on the channel", async () => {
    const artist = {
      slug: "signal", name: "Signal", count: 1, tracks: [techno("s1", "Modular", "Signal")], coverTrack: null, albums: [], topGenre: "Techno",
    };
    await act(async () => {
      root.render(
        React.createElement(ArtistPage, {
          artist,
          tracks: artist.tracks,
          onBack: jest.fn(),
          onPlay: jest.fn(),
        })
      );
    });
    expect(div.querySelector('section[aria-label="Same shelf"]')).toBeNull();
  });
});
