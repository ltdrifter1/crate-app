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

  test("opening an album shows a simple album page without badge copy", async () => {
    const div = document.createElement("div");
    document.body.appendChild(div);
    const root = createRoot(div);
    await act(async () => {
      root.render(React.createElement(ExplorePreview));
    });
    const lead = div.querySelector(".pmp-release--lead");
    expect(lead).toBeTruthy();
    await act(async () => {
      lead.click();
    });
    expect(div.textContent).toMatch(/Play/);
    expect(div.textContent).toMatch(/track/);
    expect(div.textContent).not.toMatch(/Featured releases/);
    expect(div.textContent).not.toMatch(/as an object/);
    expect(div.textContent).not.toMatch(/Drop the needle/);
    expect(div.querySelectorAll("img").length).toBe(1);
    const back = [...div.querySelectorAll("button")].find((b) => /Back/.test(b.textContent));
    await act(async () => {
      back.click();
    });
    expect(div.querySelector('section[aria-label="Albums"]')).toBeTruthy();
    await act(async () => {
      root.unmount();
    });
    document.body.removeChild(div);
  });
});
