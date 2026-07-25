/**
 * Phone helpers for Firebase Auth (E.164).
 * Users rarely type +1 — we normalize common US/CA inputs.
 */

/** Strip to digits and an optional leading +. */
export function digitsOnly(raw = "") {
  return String(raw).replace(/[^\d+]/g, "");
}

/**
 * Normalize a user-entered phone number to E.164.
 * Returns null if we can't produce a valid number.
 *
 * Rules:
 * - Already +… with 8–15 digits → keep
 * - 10 digits → assume +1 (US/CA)
 * - 11 digits starting with 1 → +1…
 * - Other bare digit strings of 8–15 → prefix +
 */
export function normalizePhoneE164(raw) {
  if (raw == null) return null;
  const cleaned = String(raw).trim();
  if (!cleaned) return null;

  // Keep leading +, drop other punctuation/spaces
  let s = cleaned.replace(/[^\d+]/g, "");
  if (s.startsWith("00")) s = `+${s.slice(2)}`;

  if (s.startsWith("+")) {
    const digits = s.slice(1).replace(/\D/g, "");
    if (digits.length >= 8 && digits.length <= 15) return `+${digits}`;
    return null;
  }

  const digits = s.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (digits.length >= 8 && digits.length <= 15) return `+${digits}`;
  return null;
}

/** Soft display hint while typing (not a full formatter). */
export function phoneHint(raw) {
  const e164 = normalizePhoneE164(raw);
  if (!e164) return "";
  if (e164.startsWith("+1") && e164.length === 12) {
    const d = e164.slice(2);
    return `+1 (${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  }
  return e164;
}

/** Map Firebase Auth error codes → inhabit voice. */
export function authErrorMessage(err, fallback = "Something went wrong — please try again.") {
  const code = err?.code || "";
  const map = {
    "auth/invalid-email": "That doesn’t look like a valid email address.",
    "auth/user-not-found": "No account found with that email.",
    "auth/wrong-password": "Wrong password — try again.",
    "auth/invalid-credential": "Wrong email or password.",
    "auth/email-already-in-use": "An account with that email already exists. Try logging in.",
    "auth/weak-password": "Password must be at least 6 characters.",
    "auth/too-many-requests": "Too many attempts. Wait a moment and try again.",
    "auth/network-request-failed": "Network error. Check your connection.",
    "auth/invalid-phone-number": "Enter a valid mobile number (include country code, e.g. +1…).",
    "auth/missing-phone-number": "Enter a mobile number to continue.",
    "auth/quota-exceeded": "SMS quota reached for today. Try email or Google instead.",
    "auth/captcha-check-failed": "Security check failed. Refresh and try again.",
    "auth/invalid-app-credential": "Phone sign-in isn’t configured for this app yet. Try email or Google.",
    "auth/operation-not-allowed": "That sign-in method isn’t enabled yet. Try email or Google.",
    "auth/billing-not-enabled": "Phone codes need billing on the project. Try email or Google for now.",
    "auth/code-expired": "That code expired. Request a new one.",
    "auth/invalid-verification-code": "That code doesn’t match — try again.",
    "auth/missing-verification-code": "Enter the 6-digit code we texted you.",
    "auth/session-expired": "Session expired. Request a new code.",
    "auth/popup-closed-by-user": "Sign-in window closed before finishing.",
    "auth/cancelled-popup-request": "Sign-in was interrupted — try again.",
    "auth/popup-blocked": "Popup blocked — retrying with a full-page Google sign-in…",
    "auth/operation-not-supported-in-this-environment": "This browser blocks popups. Continuing with Google redirect…",
    "auth/unauthorized-domain": "This site isn’t on Firebase’s authorized domains yet. Add this hostname in Firebase Console → Authentication → Settings → Authorized domains.",
    "auth/account-exists-with-different-credential": "An account already exists with this email using a different sign-in method. Try email login.",
    "auth/internal-error": "Google sign-in hit a browser block (often third-party cookies). Try again, or use email.",
    "auth/argument-error": "Couldn’t start verification. Refresh and try again.",
  };
  // Prefer our copy; fall back to Firebase message only when useful
  if (map[code]) return map[code];
  if (err?.message && !/^Firebase:/i.test(err.message)) return err.message;
  if (err?.message) {
    const cleaned = err.message.replace(/^Firebase:\s*/i, "").replace(/\s*\([^)]*\)\.?\s*$/, "").trim();
    if (cleaned) return cleaned;
  }
  return fallback;
}
