/**
 * @jest-environment jsdom
 */
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import CrateSpread from "./CrateSpread";

const tracks = [
  {
    id: "t1",
    title: "Warehouse",
    artist: "Signal",
    albumCover: "cover-a.jpg",
    bpm: 124,
    camelot: "8A",
    energy: 7,
  },
  {
    id: "t2",
    title: "Soft Room",
    artist: "Lumen",
    albumCover: "cover-b.jpg",
    bpm: 118,
    camelot: "7A",
  },
  {
    id: "t3",
    title: "Porch Light",
    artist: "Willow",
    albumCover: "cover-c.jpg",
  },
];

test("CrateSpread plays the lead sleeve and stacked cuts", async () => {
  const onPlayTrack = jest.fn();
  const div = document.createElement("div");
  document.body.appendChild(div);
  const root = createRoot(div);
  await act(async () => {
    root.render(
      React.createElement(CrateSpread, {
        title: "Selected for you",
        subtitle: "Chosen for you",
        tracks,
        onPlayTrack,
      })
    );
  });
  expect(div.querySelector(".pmp-crate-spread")).toBeTruthy();
  expect(div.textContent).toMatch(/Selected for you/);
  expect(div.textContent).toMatch(/Warehouse/);
  expect(div.textContent).toMatch(/124 BPM/);
  expect(div.textContent).toMatch(/8A/);
  expect(div.textContent).toMatch(/Soft Room/);
  const lead = div.querySelector('button[aria-label="Play Warehouse by Signal"]');
  expect(lead).toBeTruthy();
  await act(async () => {
    lead.click();
  });
  expect(onPlayTrack).toHaveBeenCalledWith(tracks[0], tracks);
  await act(async () => root.unmount());
  document.body.removeChild(div);
});
