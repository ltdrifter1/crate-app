/**
 * First-login feature tour + Profile guide.
 * Taste onboarding (TasteTuner) owns the mix. This is a short map of the crate —
 * not another survey. Auto-shows once per featureGuideVersion after taste is done/skipped.
 */

export const FEATURE_GUIDE_VERSION = 1;

export const FEATURE_GUIDE_STEPS = [
  {
    id: "home",
    kicker: "Home",
    title: "Channel Surfing",
    body: "Home is live radio. Tap a station photo to tune in.",
  },
  {
    id: "explore",
    kicker: "Explore",
    title: "Find a crate",
    body: "Genres, moods, and scenes — pick a room, then play.",
  },
  {
    id: "library",
    kicker: "Library",
    title: "Your shelf",
    body: "Likes, mixes, and recents live here.",
  },
  {
    id: "set",
    kicker: "Build a set",
    title: "The booth",
    body: "Sculpt length, vibe, and genre — then hit Play set.",
  },
  {
    id: "charts",
    kicker: "Charts",
    title: "What’s climbing",
    body: "The daily board. Play the chart or add a cut to your queue.",
  },
  {
    id: "player",
    kicker: "Player",
    title: "Energy + dislike",
    body: "The beaker shifts the next cut. Dislike trains the mix away from that neighborhood.",
  },
    {
    id: "club",
    kicker: "Club",
    title: "Your profile",
    body: "Beta launch free trial. Membership, pricing, and Club Copy checkout are coming soon.",
  },
  {
    id: "chat",
    kicker: "Live chat",
    title: "Who’s listening",
    body: "The messenger on Home. Optional. Say hi while the station plays.",
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
