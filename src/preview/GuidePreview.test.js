/**
 * @jest-environment jsdom
 */
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import GuidePreview from "./GuidePreview";

describe("Guide preview", () => {
  test("opens the tour overlay then lands on Club Guide", async () => {
    const div = document.createElement("div");
    document.body.appendChild(div);
    const root = createRoot(div);
    await act(async () => {
      root.render(React.createElement(GuidePreview));
    });
    expect(div.querySelector("[data-testid='feature-tour']")).toBeTruthy();
    expect(div.textContent).toMatch(/Channel Surfing/);

    const skip = [...div.querySelectorAll("button")].find((b) => b.textContent === "Skip");
    await act(async () => {
      skip.click();
    });
    expect(div.querySelector("[data-testid='feature-tour']")).toBeFalsy();
    expect(div.textContent).toMatch(/How it works/);
    expect(div.textContent).toMatch(/Replay the tour/);

    const replay = [...div.querySelectorAll("button")].find(
      (b) => b.textContent === "Replay the tour"
    );
    await act(async () => {
      replay.click();
    });
    expect(div.querySelector("[data-testid='feature-tour']")).toBeTruthy();
    expect(div.querySelector("[data-replay='true']")).toBeTruthy();

    await act(async () => {
      root.unmount();
    });
    document.body.removeChild(div);
  });
});
