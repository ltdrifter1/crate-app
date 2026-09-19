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

  test("is a simple playlists and saved library", async () => {
    await act(async () => {
      root.render(
        React.createElement(FavoritesScreen, {
          tracks: [],
          userPlaylists: [{ id: "pl_1", name: "Night Drive", trackIds: [] }],
        })
      );
    });
    expect(div.textContent).toMatch(/Library/);
    expect(div.textContent).toMatch(/Saved tracks and playlists/);
    expect(div.textContent).toMatch(/Playlists/);
    expect(div.textContent).toMatch(/Saved/);
    expect(div.textContent).toMatch(/Night Drive/);
    expect(div.textContent).not.toMatch(/No stacks yet/);
    expect(div.textContent).not.toMatch(/Planet Club/);
    expect(div.textContent).not.toMatch(/Length · Vibe · Preview/);
    expect(div.textContent).not.toMatch(/Custom mix/);
    expect(div.querySelector(".custom-mix")).toBeNull();
  });

  test("empty playlists show a new playlist tile instead of Club copy", async () => {
    await act(async () => {
      root.render(
        React.createElement(FavoritesScreen, {
          tracks: [],
          userPlaylists: [],
        })
      );
    });
    expect(div.textContent).toMatch(/New playlist/);
    expect(div.textContent).not.toMatch(/No stacks yet/);
    expect(div.textContent).not.toMatch(/share it with Planet Club/i);
    expect(div.textContent).not.toMatch(/Charts/);
    expect(div.textContent).not.toMatch(/Build a set/);
    expect(div.querySelector('[aria-label="Library destinations"]')).toBeNull();
  });

  test("saved tab is quiet when empty", async () => {
    await act(async () => {
      root.render(
        React.createElement(FavoritesScreen, {
          tracks: [],
          userPlaylists: [],
        })
      );
    });
    const saved = [...div.querySelectorAll('[role="tablist"] button')].find((b) =>
      /Saved/.test(b.textContent)
    );
    expect(saved).toBeTruthy();
    await act(async () => {
      saved.click();
    });
    expect(div.textContent).toMatch(/No saved tracks/);
    expect(div.textContent).not.toMatch(/Songs you love live here/);
  });
});
