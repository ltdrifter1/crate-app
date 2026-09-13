/**
 * @jest-environment jsdom
 */
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import FavoritesScreen from "./FavoritesScreen";

jest.mock("../usePlayerTransport", () => ({
  useCurrentTrack: () => null,
}));

describe("Library screen", () => {
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

  test("is a clean playlists/liked library without the buried Build a set card", async () => {
    await act(async () => {
      root.render(
        React.createElement(FavoritesScreen, {
          tracks: [],
          userPlaylists: [{ id: "pl_1", name: "Night Drive", trackIds: [] }],
        })
      );
    });
    expect(div.textContent).toMatch(/Library/);
    expect(div.textContent).toMatch(/Playlists/);
    expect(div.textContent).toMatch(/Night Drive/);
    expect(div.textContent).not.toMatch(/Length · Vibe · Preview/);
    expect(div.textContent).not.toMatch(/Custom mix/);
    expect(div.querySelector(".custom-mix")).toBeNull();
  });

  test("mobile destinations expose Charts and Build a set", async () => {
    const onOpenCharts = jest.fn();
    const onCustomMix = jest.fn();
    await act(async () => {
      root.render(
        React.createElement(FavoritesScreen, {
          tracks: [],
          userPlaylists: [],
          showLibraryDestinations: true,
          onOpenCharts,
          onCustomMix,
        })
      );
    });
    expect(div.textContent).toMatch(/Charts/);
    expect(div.textContent).toMatch(/Build a set/);
    const dests = [...div.querySelectorAll('[aria-label="Library destinations"] button')];
    expect(dests.map((el) => el.textContent)).toEqual(
      expect.arrayContaining([expect.stringMatching(/Charts/), expect.stringMatching(/Build a set/)])
    );
    await act(async () => {
      dests[0].click();
      dests[1].click();
    });
    expect(onOpenCharts).toHaveBeenCalled();
    expect(onCustomMix).toHaveBeenCalled();
  });
});
