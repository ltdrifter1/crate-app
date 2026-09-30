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
    expect(div.textContent).toMatch(/Discover/);
    expect(div.textContent).toMatch(/Just landed/);
    expect(div.textContent).toMatch(/Genres/);
    expect(div.textContent).not.toMatch(/Directory/);
    expect(div.textContent).not.toMatch(/Worlds/);
    expect(div.textContent).not.toMatch(/Moods & moments/);
    expect(div.textContent).not.toMatch(/Stations/);
    expect(div.textContent).not.toMatch(/On the board/);
    expect(div.textContent).not.toMatch(/Most requested/i);
    expect(div.textContent).not.toMatch(/Showcase station/i);
    expect(div.textContent).not.toMatch(/on the dial/i);
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
    const sleeves = div.querySelector('button[role="tab"][aria-label="New"]');
    expect(sleeves).toBeTruthy();
    await act(async () => {
      sleeves.click();
    });
    const lead = div.querySelector(".pmp-release");
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
    expect(div.textContent).toMatch(/Discover/);
    expect(div.querySelector('button[role="tab"][aria-label="New"]')).toBeTruthy();
    await act(async () => {
      root.unmount();
    });
    document.body.removeChild(div);
  });
});
