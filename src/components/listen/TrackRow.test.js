/**
 * @jest-environment jsdom
 */
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { TrackRow } from "./TrackRow";

test("list rows print BPM and Camelot", async () => {
  const div = document.createElement("div");
  document.body.appendChild(div);
  const root = createRoot(div);
  await act(async () => {
    root.render(
      React.createElement(TrackRow, {
        track: {
          id: "t1",
          title: "Night Drive",
          artist: "Signal",
          bpm: 124,
          camelot: "8A",
          energy: 6,
        },
        onPlay: () => {},
      })
    );
  });
  expect(div.textContent).toMatch(/Night Drive/);
  expect(div.textContent).toMatch(/124 BPM/);
  expect(div.textContent).toMatch(/8A/);
  expect(div.textContent).not.toMatch(/E6/);
  await act(async () => root.unmount());
  document.body.removeChild(div);
});
