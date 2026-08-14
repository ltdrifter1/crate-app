/**
 * Monthly picks choice — positive option: choose 1 of 3, or skip the month.
 * No auto-ship / negative option.
 */
import { tasteMonthKey, pickMonthlyTracks, normalizeTasteProfile } from "./tasteProfile";

export const MONTHLY_CHOICE = {
  PENDING: "pending",
  CHOSEN: "chosen",
  SKIPPED: "skipped",
};

export function monthChoiceKey(date = new Date()) {
  return tasteMonthKey(date);
}

/**
 * Read the member's choice for a month from profile.monthlyChoices[YYYY-MM].
 */
export function getMonthChoice(profile, monthKey = monthChoiceKey()) {
  const map = profile?.monthlyChoices && typeof profile.monthlyChoices === "object"
    ? profile.monthlyChoices
    : {};
  const row = map[monthKey];
  if (!row || typeof row !== "object") {
    return { monthKey, status: MONTHLY_CHOICE.PENDING, trackId: null, chosenAt: null };
  }
  return {
    monthKey,
    status: row.status || MONTHLY_CHOICE.PENDING,
    trackId: row.trackId || null,
    chosenAt: row.chosenAt || null,
  };
}

export function buildChoosePayload(trackId, now = new Date()) {
  return {
    status: MONTHLY_CHOICE.CHOSEN,
    trackId: String(trackId || ""),
    chosenAt: (now instanceof Date ? now : new Date(now)).toISOString(),
  };
}

export function buildSkipPayload(now = new Date()) {
  return {
    status: MONTHLY_CHOICE.SKIPPED,
    trackId: null,
    chosenAt: (now instanceof Date ? now : new Date(now)).toISOString(),
  };
}

/**
 * Merge a choice into profile.monthlyChoices for Firestore update.
 */
export function mergeMonthChoice(profile, monthKey, choice) {
  const prev =
    profile?.monthlyChoices && typeof profile.monthlyChoices === "object"
      ? { ...profile.monthlyChoices }
      : {};
  return {
    ...prev,
    [monthKey]: choice,
  };
}

/**
 * Build the monthly choose slate + current decision.
 */
export function buildMonthlyChoiceState(
  tracks,
  profile,
  {
    userKey = "",
    monthKey = monthChoiceKey(),
    limit = 3,
  } = {}
) {
  const taste = normalizeTasteProfile({
    genres: profile?.genres,
    adventurous: profile?.adventurous,
    depth: profile?.depth,
  });
  const slate = pickMonthlyTracks(tracks, taste, { userKey, monthKey, limit });
  const choice = getMonthChoice(profile, monthKey);
  return {
    ...slate,
    choice,
    canChoose: choice.status === MONTHLY_CHOICE.PENDING,
  };
}
