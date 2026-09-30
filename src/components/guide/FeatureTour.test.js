/**
 * @jest-environment jsdom
 */
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import FeatureTour from "./FeatureTour";
import { FEATURE_GUIDE_STEPS } from "../../lib/featureGuide";

describe("FeatureTour", () => {
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

  test("one idea per step, skip anytime, not a survey", async () => {
    const onComplete = jest.fn();
    const onSkip = jest.fn();
    await act(async () => {
      root.render(React.createElement(FeatureTour, { onComplete, onSkip }));
    });
    expect(div.textContent).toMatch(/Your player/);
    expect(div.textContent).toMatch(/Slow/);
    expect(div.textContent).not.toMatch(/Select your favourite genres/);
    expect(div.textContent).not.toMatch(/Enter the club/);
    expect(div.querySelector("[data-testid='feature-tour']")).toBeTruthy();

    const skip = [...div.querySelectorAll("button")].find((b) => b.textContent === "Skip");
    expect(skip).toBeTruthy();
    await act(async () => {
      skip.click();
    });
    expect(onSkip).toHaveBeenCalledTimes(1);
    expect(onComplete).not.toHaveBeenCalled();
  });

  test("next walks every step then Got it completes", async () => {
    const onComplete = jest.fn();
    await act(async () => {
      root.render(React.createElement(FeatureTour, { onComplete }));
    });
    for (let i = 0; i < FEATURE_GUIDE_STEPS.length - 1; i += 1) {
      expect(div.textContent).toContain(FEATURE_GUIDE_STEPS[i].title);
      const next = [...div.querySelectorAll("button")].find((b) => b.textContent === "Next");
      expect(next).toBeTruthy();
      await act(async () => {
        next.click();
      });
    }
    expect(div.textContent).toContain(FEATURE_GUIDE_STEPS[FEATURE_GUIDE_STEPS.length - 1].title);
    const done = [...div.querySelectorAll("button")].find((b) => b.textContent === "Got it");
    await act(async () => {
      done.click();
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  test("replay mode labels the chrome without changing the copy", async () => {
    await act(async () => {
      root.render(React.createElement(FeatureTour, { replay: true }));
    });
    expect(div.textContent).toMatch(/Replay/);
    expect(div.querySelector("[data-replay='true']")).toBeTruthy();
    expect(div.textContent).toMatch(/Your player/);
  });
});
