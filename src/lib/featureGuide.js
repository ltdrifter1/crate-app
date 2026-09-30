/**
 * First-login feature tour + Profile guide.
 * Taste onboarding (TasteTuner) owns the mix. This is a short map of the app.
 */

export const FEATURE_GUIDE_VERSION = 3;

export const FEATURE_GUIDE_STEPS = [
  {
    id: "home",
    kicker: "Home",
    title: "Your player",
    body: "Artwork, play, and Slow / Fast to change what plays next.",
  },
  {
    id: "explore",
    kicker: "Discover",
    title: "Find music",
    body: "New releases, keys, and crates around your listening.",
  },
  {
    id: "library",
    kicker: "Library",
    title: "Your collection",
    body: "Playlists, likes, and what you just played.",
  },
];

/**
 * Auto-show only after taste onboarding is done or skipped, and only once
 * per shipped guide version. Replay from Profile ignores this.
 */
export function shouldAutoShowFeatureTour(profile) {
  if (!profile) return false;
  if (profile.onboarded === false) return false;
  const seenVersion = Number(profile.featureGuideVersion) || 0;
  if (profile.tutorialSeen === true && seenVersion >= FEATURE_GUIDE_VERSION) {
    return false;
  }
  return true;
}

export function featureGuideSeenPayload(version = FEATURE_GUIDE_VERSION) {
  return {
    tutorialSeen: true,
    featureGuideVersion: version,
  };
}

export function featureGuideStepCount() {
  return FEATURE_GUIDE_STEPS.length;
}
