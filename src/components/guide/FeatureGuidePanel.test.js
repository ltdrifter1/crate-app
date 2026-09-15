/**
 * @jest-environment jsdom
 */
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import FeatureGuidePanel from "./FeatureGuidePanel";
import { FEATURE_GUIDE_STEPS } from "../../lib/featureGuide";

describe("FeatureGuidePanel", () => {
  test("lists every tour step and the replay CTA", async () => {
    const onReplayTour = jest.fn();
    const div = document.createElement("div");
    document.body.appendChild(div);
    const root = createRoot(div);
    await act(async () => {
      root.render(React.createElement(FeatureGuidePanel, { onReplayTour }));
    });
    expect(div.textContent).toMatch(/How it works/);
    FEATURE_GUIDE_STEPS.forEach((step) => {
      expect(div.textContent).toContain(step.title);
      expect(div.textContent).toContain(step.body);
    });
    const replay = [...div.querySelectorAll("button")].find(
      (b) => b.textContent === "Replay the tour"
    );
    expect(replay).toBeTruthy();
    await act(async () => {
      replay.click();
    });
    expect(onReplayTour).toHaveBeenCalledTimes(1);
    await act(async () => {
      root.unmount();
    });
    document.body.removeChild(div);
  });
});
