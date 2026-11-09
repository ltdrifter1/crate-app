/**
 * Public beta waitlist. One document per email in `betaWaitlist`.
 * Reads stay admin-only; the splash may create or refresh its own row.
 */
import { getFirebase } from "../firebase";

export const BETA_WAITLIST_COLLECTION = "betaWaitlist";
const SAVE_TIMEOUT_MS = 12000;

/** Reject if a write never settles, so the button cannot spin forever. */
export function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const error = new Error("The signup took too long.");
      error.code = "deadline-exceeded";
      reject(error);
    }, ms);
    Promise.resolve(promise).then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

/** Lowercase, trimmed. Document id and stored address. */
const EMAIL_RE = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

export function normalizeBetaEmail(value) {
  return String(value || "").trim().toLowerCase();
}

export function isValidBetaEmail(value) {
  const email = normalizeBetaEmail(value);
  return email.length >= 6 && email.length <= 120 && EMAIL_RE.test(email);
}

/**
 * Save an address for the beta launch.
 * Repeating the same address refreshes the row instead of failing.
 * @param {string} rawEmail
 * @returns {Promise<{ email: string }>}
 */
export async function joinBetaWaitlist(rawEmail) {
  const email = normalizeBetaEmail(rawEmail);
  if (!isValidBetaEmail(email)) {
    const error = new Error("Enter a valid email address.");
    error.code = "invalid-email";
    throw error;
  }

  const { db } = await getFirebase();
  const { doc, serverTimestamp, setDoc } = await import("firebase/firestore");
  try {
    await withTimeout(
      setDoc(
        doc(db, BETA_WAITLIST_COLLECTION, email),
        {
          email,
          source: "splash",
          createdAt: serverTimestamp(),
        },
        { merge: true }
      ),
      SAVE_TIMEOUT_MS
    );
  } catch (error) {
    const wrapped = new Error("Couldn't save that email.");
    wrapped.code = error?.code || "unknown";
    throw wrapped;
  }
  return { email };
}
