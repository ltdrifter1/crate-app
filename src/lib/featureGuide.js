/**
 * First-login feature tour + Profile guide.
 * Taste onboarding (TasteTuner) owns the mix. This is a short map of the app.
 */

export const FEATURE_GUIDE_VERSION = 1;

export const FEATURE_GUIDE_STEPS = [
  {
    id: "home",
    kicker: "Home",
    title: "Channel Surfing",
    body: "Live radio. Tap a station to tune in.",
  },
  {
    id: "explore",
    kicker: "Explore",
    title: "Browse",
    body: "Genres, moods, and scenes. Pick one, then play.",
  },
  {
    id: "library",
    kicker: "Library",
    title: "Your library",
    body: "Likes, mixes, and recents.",
  },
  {
    id: "set",
    kicker: "Set",
    title: "The booth",
    body: "Shape length, vibe, and genre — then play.",
  },
  {
    id: "charts",
    kicker: "Charts",
    title: "Most requested",
    body: "Today’s board. Play a track or add it to your queue.",
  },
  {
    id: "player",
    kicker: "Player",
    title: "Pace + dislike",
    body: "Pace eases or lifts what plays next. Dislike steers the mix away.",
  },
  {
    id: "club",
    kicker: "Club",
    title: "Your profile",
    body: "Your card, your tastes, and this guide.",
  },
  {
    id: "chat",
    kicker: "Chat",
    title: "Listening together",
    body: "The messenger on Home. Optional. Say hello while you listen.",
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
