/**
 * @jest-environment jsdom
 */
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import ReleaseCard, { ReleasesBand } from "./ReleaseCard";

const albums = [
  {
    slug: "a",
    title: "Night Shift",
    artist: "Signal",
    count: 8,
    coverTrack: { albumCover: "a.jpg" },
  },
  {
    slug: "b",
    title: "Highways",
    artist: "Willow",
    count: 4,
    coverTrack: { albumCover: "b.jpg" },
  },
  {
    slug: "c",
    title: "Gain",
    artist: "Ash",
    count: 6,
    coverTrack: { albumCover: "c.jpg" },
  },
];

describe("ReleaseCard", () => {
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

  test("does not stamp a Release or Featured badge on the sleeve", async () => {
    await act(async () => {
      root.render(React.createElement(ReleaseCard, { album: albums[0], variant: "lead" }));
    });
    expect(div.textContent).toMatch(/Night Shift/);
    expect(div.textContent).toMatch(/Signal/);
    expect(div.textContent).toMatch(/8 tracks/);
    expect(div.textContent).not.toMatch(/\bRelease\b/);
    expect(div.textContent).not.toMatch(/Featured/);
    expect(div.querySelector(".pmp-release--lead")).toBeTruthy();
  });

  test("ReleasesBand mixes lead and tile variants", async () => {
    const onOpenAlbum = jest.fn();
    await act(async () => {
      root.render(React.createElement(ReleasesBand, { albums, onOpenAlbum }));
    });
    expect(div.querySelector(".pmp-release--lead")).toBeTruthy();
    expect(div.querySelector(".pmp-release--tile")).toBeTruthy();
    expect(div.querySelector(".pmp-release--count")).toBeTruthy();
    expect(div.textContent).not.toMatch(/\bRelease\b/);
    const lead = div.querySelector(".pmp-release--lead");
    await act(async () => {
      lead.click();
    });
    expect(onOpenAlbum).toHaveBeenCalledWith("a");
  });
});
