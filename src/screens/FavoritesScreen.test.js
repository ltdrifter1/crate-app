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

  test("is a playlists / liked / recents library without Charts or Build a set", async () => {
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
    expect(div.textContent).toMatch(/Recents/);
    expect(div.textContent).toMatch(/Night Drive/);
    expect(div.textContent).not.toMatch(/Length · Vibe · Preview/);
    expect(div.textContent).not.toMatch(/Custom mix/);
    expect(div.textContent).not.toMatch(/Stacks/);
    expect(div.querySelector(".custom-mix")).toBeNull();
  });

  test("does not bury Charts and Build a set on Library", async () => {
    const onOpenCharts = jest.fn();
    const onCustomMix = jest.fn();
    await act(async () => {
      root.render(
        React.createElement(FavoritesScreen, {
          tracks: [],
          userPlaylists: [],
          onOpenCharts,
          onCustomMix,
        })
      );
    });
    expect(div.querySelector('[aria-label="Library destinations"]')).toBeNull();
    expect(div.textContent).not.toMatch(/Build a set/);
    expect(div.textContent).not.toMatch(/Monthly countdown/);
  });

  test("recents tab lists profile history in play order", async () => {
    await act(async () => {
      root.render(
        React.createElement(FavoritesScreen, {
          tracks: [
            { id: "a", title: "Alpha", artist: "One", duration: 180, liked: false },
            { id: "b", title: "Beta", artist: "Two", duration: 180, liked: true },
          ],
          userPlaylists: [],
          recentTrackIds: ["b", "a"],
        })
      );
    });
    const recents = [...div.querySelectorAll('[role="tab"]')].find((el) => /Recents/.test(el.textContent));
    expect(recents).toBeTruthy();
    await act(async () => {
      recents.click();
    });
    expect(div.textContent).toMatch(/Recently played/);
    expect(div.textContent).toMatch(/Beta/);
    expect(div.textContent).toMatch(/Alpha/);
  });
});
