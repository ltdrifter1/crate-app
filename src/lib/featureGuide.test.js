import {
  FEATURE_GUIDE_VERSION,
  FEATURE_GUIDE_STEPS,
  shouldAutoShowFeatureTour,
  featureGuideSeenPayload,
} from "./featureGuide";

describe("featureGuide gate", () => {
  test("does not auto-show before taste onboarding is done", () => {
    expect(shouldAutoShowFeatureTour(null)).toBe(false);
    expect(shouldAutoShowFeatureTour({ onboarded: false })).toBe(false);
    expect(
      shouldAutoShowFeatureTour({
        onboarded: false,
        tutorialSeen: false,
        featureGuideVersion: 0,
      })
    ).toBe(false);
  });

  test("auto-shows once after taste is done or skipped", () => {
    expect(shouldAutoShowFeatureTour({ onboarded: true })).toBe(true);
    expect(
      shouldAutoShowFeatureTour({ onboarded: true, tutorialSeen: false })
    ).toBe(true);
    expect(
      shouldAutoShowFeatureTour({
        onboarded: true,
        tutorialSeen: true,
        featureGuideVersion: 0,
      })
    ).toBe(true);
  });

  test("does not auto-show again at the current version", () => {
    expect(
      shouldAutoShowFeatureTour({
        onboarded: true,
        tutorialSeen: true,
        featureGuideVersion: FEATURE_GUIDE_VERSION,
      })
    ).toBe(false);
    expect(
      shouldAutoShowFeatureTour({
        onboarded: true,
        tutorialSeen: true,
        featureGuideVersion: FEATURE_GUIDE_VERSION + 1,
      })
    ).toBe(false);
  });

  test("seen payload stamps tutorialSeen and the current version", () => {
    expect(featureGuideSeenPayload()).toEqual({
      tutorialSeen: true,
      featureGuideVersion: FEATURE_GUIDE_VERSION,
    });
  });

  test("teaches the core crate without survey copy", () => {
    const ids = FEATURE_GUIDE_STEPS.map((s) => s.id);
    expect(ids).toEqual([
      "home",
      "explore",
      "library",
      "set",
      "charts",
      "player",
      "club",
      "chat",
    ]);
    const blob = FEATURE_GUIDE_STEPS.map((s) => `${s.title} ${s.body}`).join(" ");
    expect(blob).not.toMatch(/favourite genres|Enter the club|How adventurous/i);
    expect(blob).toMatch(/Channel Surfing/);
    expect(blob).toMatch(/Pace/);
    expect(blob).not.toMatch(/beaker/i);
    expect(blob).toMatch(/Dislike/);
    expect(blob).toMatch(/messenger/i);
  });
});
