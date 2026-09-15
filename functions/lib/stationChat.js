/**
 * Server-side station chat moderation — sanitize + flood control.
 * Client already rate-limits; this is the backstop after Firestore create.
 */

const MAX_TEXT = 200;
const MIN_INTERVAL_MS = 2500;

function sanitizeChatText(raw) {
  let s = String(raw ?? "");
  s = s.replace(/<[^>]*>/g, " ");
  s = s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
  s = s.replace(/\s+/g, " ").trim();
  if (s.length > MAX_TEXT) s = s.slice(0, MAX_TEXT);
  return s;
}

function toMillis(ts, fallback = 0) {
  if (ts == null) return fallback;
  if (typeof ts === "number") return ts;
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (typeof ts.toDate === "function") return ts.toDate().getTime();
  if (typeof ts.seconds === "number") return ts.seconds * 1000;
  return fallback;
}

/**
 * @param {FirebaseFirestore.Firestore} db
 * @param {{ roomId: string, messageId: string, data: object, now?: number }} opts
 */
async function moderateNewMessage(db, { roomId, messageId, data, now = Date.now() }) {
  const ref = db.doc(`stationChat/${roomId}/messages/${messageId}`);
  const uid = data?.uid;
  const text = sanitizeChatText(data?.text);
  if (!uid || !text) {
    await ref.delete();
    return { action: "delete", reason: "invalid" };
  }

  const rateRef = db.doc(`stationChat/${roomId}/presence/${uid}`);
  const snap = await rateRef.get();
  const lastChatAt = toMillis(snap.exists ? snap.data()?.lastChatAt : null, 0);
  if (lastChatAt && now - lastChatAt < MIN_INTERVAL_MS) {
    await ref.delete();
    return { action: "delete", reason: "flood" };
  }

  await rateRef.set({ lastChatAt: now, uid }, { merge: true });
  if (text !== data.text) {
    await ref.update({ text });
    return { action: "sanitize" };
  }
  return { action: "ok" };
}

module.exports = {
  MAX_TEXT,
  MIN_INTERVAL_MS,
  sanitizeChatText,
  moderateNewMessage,
};
