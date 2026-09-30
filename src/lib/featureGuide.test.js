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
    expect(ids).toEqual(["home", "explore", "library"]);
    expect(FEATURE_GUIDE_STEPS).toHaveLength(3);
    expect(FEATURE_GUIDE_VERSION).toBe(3);
    const blob = FEATURE_GUIDE_STEPS.map((s) => `${s.title} ${s.body}`).join(" ");
    expect(blob).not.toMatch(/favourite genres|Enter the club|How adventurous/i);
    expect(blob).toMatch(/Slow/);
    expect(blob).toMatch(/Fast/);
    expect(blob).toMatch(/playlists/i);
    expect(blob).not.toMatch(/Channel Surfing/);
    expect(blob).not.toMatch(/beaker/i);
    expect(blob).not.toMatch(/Pace/);
    expect(blob).not.toMatch(/messenger/i);
  });
});
