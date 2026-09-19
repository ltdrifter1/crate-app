import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { LcdMetaLine, LcdTitle, LcdTimeline, formatBitrate, trackLcdBits } from "./DeviceChrome";
import { PaceSlider } from "../listen/EnergyShiftButton";
import { playerEnergyStore } from "../../lib/playerEnergyStore";

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
  playerEnergyStore._resetForTests();
  const div = document.createElement("div");
  document.body.appendChild(div);
  const root = createRoot(div);
  await act(async () => {
    root.render(React.createElement(LcdMetaLine, { bits: ["124 BPM", "8A"] }));
  });
  expect(div.textContent).toMatch(/124 BPM/);
  expect(div.textContent).toMatch(/8A/);
  expect(div.textContent).not.toMatch(/LIFT|EASE|FAST|SLOW/);
  await act(async () => root.unmount());
  document.body.removeChild(div);
});

test("LcdMetaLine shows FAST when pace is steering upcoming picks", async () => {
  playerEnergyStore._resetForTests();
  playerEnergyStore.shiftEnergy(1, 10);
  const div = document.createElement("div");
  document.body.appendChild(div);
  const root = createRoot(div);
  await act(async () => {
    root.render(React.createElement(LcdMetaLine, { bits: ["124 BPM"] }));
  });
  expect(div.textContent).toMatch(/124 BPM/);
  expect(div.textContent).toMatch(/FAST/);
  expect(div.textContent).not.toMatch(/LIFT|EASE/);
  await act(async () => root.unmount());
  playerEnergyStore._resetForTests();
  document.body.removeChild(div);
});

test("LcdTimeline flanks seek with elapsed and remaining", async () => {
  const div = document.createElement("div");
  document.body.appendChild(div);
  const root = createRoot(div);
  await act(async () => {
    root.render(React.createElement(LcdTimeline, { progress: 48, duration: 214 }));
  });
  expect(div.querySelector('[aria-label="Seek"]')).toBeTruthy();
  expect(div.querySelector(".pmp-timeline")).toBeTruthy();
  expect(div.textContent).toMatch(/0:48/);
  expect(div.textContent).toMatch(/3:34/);
  await act(async () => root.unmount());
  document.body.removeChild(div);
});

test("PaceSlider is Slow / Fast on a glass range, not Ease / Lift", async () => {
  const div = document.createElement("div");
  document.body.appendChild(div);
  const root = createRoot(div);
  await act(async () => {
    root.render(React.createElement(PaceSlider, { compact: true }));
  });
  const slider = div.querySelector('input[aria-label="Pace"]');
  expect(slider).toBeTruthy();
  expect(slider.className).toMatch(/pace-range/);
  expect(div.textContent).toMatch(/Slow/);
  expect(div.textContent).toMatch(/Fast/);
  expect(div.textContent).not.toMatch(/Ease|Lift|Middle|Pace\b/i);
  expect(div.textContent).not.toMatch(/Turtle|Bunny/i);
  await act(async () => {
    slider.value = "10";
    slider.dispatchEvent(new Event("input", { bubbles: true }));
    slider.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await act(async () => root.unmount());
  document.body.removeChild(div);
});
