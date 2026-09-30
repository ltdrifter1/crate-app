/**
 * Planet Club member numbers — stamped like a collectible membership card.
 */

export const CLUB_NAME = "PLANET CLUB";
/** Short line under the club wordmark — digital record club identity. */
export const CLUB_TAGLINE = "Digital Record Club";
export const MEMBER_NUMBER_DIGITS = 6;

/** Pad an integer member number: 4231 → "004231" */
export function formatMemberNumber(n, digits = MEMBER_NUMBER_DIGITS) {
  const num = Math.max(0, Math.floor(Number(n) || 0));
  return String(num).padStart(digits, "0");
}

/** Display line: Member #004231 */
export function memberNumberLabel(n, digits = MEMBER_NUMBER_DIGITS) {
  return `Member #${formatMemberNumber(n, digits)}`;
}

/**
 * Stable provisional number from uid when the counter isn't available yet.
 * Not globally unique — replaced by assignMemberNumber when Firestore works.
 */
export function provisionalMemberNumber(uid = "") {
  const s = String(uid || "member");
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash) + s.charCodeAt(i);
    hash |= 0;
  }
  const n = (Math.abs(hash) % 900000) + 100000; // 6 digits, avoid leading zeros weirdness in raw int
  return n;
}

/**
 * Format a join date for the membership card.
 * Accepts Date, ISO string, or Firestore Timestamp-like.
 */
export function formatJoinedMonth(value, now = new Date()) {
  let d = null;
  if (!value) d = now instanceof Date ? now : new Date(now);
  else if (value instanceof Date) d = value;
  else if (typeof value?.toDate === "function") {
    try { d = value.toDate(); } catch { d = null; }
  } else if (typeof value?.seconds === "number") {
    d = new Date(value.seconds * 1000);
  } else {
    d = new Date(value);
  }
  if (!d || Number.isNaN(d.getTime())) d = now instanceof Date ? now : new Date(now);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}

/**
 * Assign the next global member number via counters/members.
 * @param {import('firebase/firestore').Firestore} db
 * @param {object} firestoreFns — { doc, runTransaction }
 */
export async function assignMemberNumber(db, { doc, runTransaction }) {
  const ref = doc(db, "counters", "members");
  const next = await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    let n = 1;
    if (snap.exists()) {
      n = Math.max(1, Number(snap.data()?.next) || 1);
      tx.update(ref, { next: n + 1 });
    } else {
      tx.set(ref, { next: 2 });
    }
    return n;
  });
  return next;
}
