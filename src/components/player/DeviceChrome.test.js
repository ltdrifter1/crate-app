import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { LcdMetaLine, LcdTitle, formatBitrate, trackLcdBits } from "./DeviceChrome";
import { EnergyShiftPaddles } from "../listen/EnergyShiftButton";

test("trackLcdBits prefers BPM, Camelot, energy", () => {
  expect(trackLcdBits({
    bpm: 123.6,
    camelot: "8A",
    energy: 7,
  })).toEqual(["124 BPM", "8A", "E7"]);
});

test("LcdTitle marquees long titles", async () => {
  const div = document.createElement("div");
  document.body.appendChild(div);
  const root = createRoot(div);
  await act(async () => {
    root.render(React.createElement(LcdTitle, null, "A Very Long Track Title For The LCD"));
  });
  expect(div.querySelector(".pmp-lcd-marquee")).toBeTruthy();
  expect(div.querySelectorAll("span").length).toBeGreaterThanOrEqual(2);
  await act(async () => root.unmount());
  document.body.removeChild(div);
});

test("formatBitrate prefers a real kbps readout", () => {
  expect(formatBitrate({})).toBe("MP3");
  expect(formatBitrate({ bitrate: 320 })).toBe("320 kbps");
  expect(formatBitrate({ bitrate: "192" })).toBe("192 kbps");
  expect(formatBitrate({ bitrate: "256 kbps" })).toBe("256 kbps");
});

test("LcdMetaLine joins bits", async () => {
  const div = document.createElement("div");
  document.body.appendChild(div);
  const root = createRoot(div);
  await act(async () => {
    root.render(React.createElement(LcdMetaLine, { bits: ["124 BPM", "8A"] }));
  });
  expect(div.textContent).toMatch(/124 BPM/);
  expect(div.textContent).toMatch(/8A/);
  await act(async () => root.unmount());
  document.body.removeChild(div);
});

test("EnergyShiftPaddles expose turtle and bunny controls", async () => {
  const div = document.createElement("div");
  document.body.appendChild(div);
  const root = createRoot(div);
  await act(async () => {
    root.render(React.createElement(EnergyShiftPaddles, { showLabel: true }));
  });
  const buttons = [...div.querySelectorAll("button")];
  expect(buttons.length).toBeGreaterThanOrEqual(2);
  expect(buttons.some((b) => /turtle/i.test(b.getAttribute("aria-label") || ""))).toBe(true);
  expect(buttons.some((b) => /bunny/i.test(b.getAttribute("aria-label") || ""))).toBe(true);
  expect(div.textContent).toMatch(/Turtle/i);
  expect(div.textContent).toMatch(/Bunny/i);
  await act(async () => root.unmount());
  document.body.removeChild(div);
});
