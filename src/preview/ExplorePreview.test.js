/**
 * @jest-environment jsdom
 */
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import ExplorePreview from "../preview/ExplorePreview";

jest.mock("../usePlayerTransport", () => ({
  useCurrentTrack: () => null,
  useIsPlaying: () => false,
}));

describe("Explore preview", () => {
  test("renders a filled Explore destination", async () => {
    const div = document.createElement("div");
    document.body.appendChild(div);
    const root = createRoot(div);
    await act(async () => {
      root.render(React.createElement(ExplorePreview));
    });
    expect(div.textContent).toMatch(/Explore/);
    expect(div.textContent).toMatch(/Genres/);
    expect(div.textContent).toMatch(/Moods & moments/);
    expect(div.textContent).toMatch(/Stations/);
    expect(div.textContent).toMatch(/On the board/);
    expect(div.textContent).toMatch(/Showcase/);
    await act(async () => {
      root.unmount();
    });
    document.body.removeChild(div);
  });
});
