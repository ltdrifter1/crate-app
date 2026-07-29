// src/useAuth.js
import { useState, useEffect } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";
import {
  doc, setDoc, getDoc, updateDoc, serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import { normalizePhoneE164 } from "./lib/phone";
import { migratePreferredGenres } from "./lib/genres";
import { buildTrialFields, needsTrialBackfill } from "./lib/entitlements";

const REDIRECT_ERROR_KEY = "rooms.auth.redirectError";

async function createProfile(uid, fields = {}) {
  const displayName = fields.displayName || fields.username || "Listener";
  const trial = buildTrialFields();
  const profile = {
    uid,
    username:     fields.username     || displayName,
    email:        fields.email        || "",
    phone:        fields.phone        || "",
    displayName,
    profileImage: fields.profileImage || "",
    createdAt:    serverTimestamp(),
    genres:       fields.genres       || [],
    likedTracks:  [],
    recentTracks: [],
    onboarded:    false,
    settings:     { repeat: false },
    ...trial,
  };
  await setDoc(doc(db, "users", uid), profile);
  return profile;
}

function ephemeralProfile(fbUser) {
  return {
    uid: fbUser.uid,
    username: fbUser.displayName || "Listener",
    email: fbUser.email || "",
    phone: fbUser.phoneNumber || "",
    displayName: fbUser.displayName || "Listener",
    profileImage: fbUser.photoURL || "",
    genres: [],
    likedTracks: [],
    recentTracks: [],
    onboarded: true,
    settings: { repeat: false },
    ...buildTrialFields(),
  };
}

/** One-time backfill so existing accounts get a fresh 30-day trial. */
async function backfillTrialIfNeeded(uid, data) {
  if (!needsTrialBackfill(data)) return data;
  const trial = buildTrialFields();
  try {
    await updateDoc(doc(db, "users", uid), trial);
  } catch (e) {
    console.warn("Trial backfill failed; using local trial fields", e);
  }
  return { ...data, ...trial };
}

function shouldFallbackToRedirect(err) {
  const code = err?.code || "";
  return [
    "auth/popup-blocked",
    "auth/operation-not-supported-in-this-environment",
  ].includes(code)
    || (code === "auth/internal-error" && /popup|storage|cookie|third.?party/i.test(err?.message || ""));
}

function googleProvider() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  provider.addScope("profile");
  provider.addScope("email");
  return provider;
}

function clearRecaptcha() {
  try {
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = null;
    }
  } catch (e) {
    window.recaptchaVerifier = null;
  }
  const el = document.getElementById("recaptcha-container");
  if (el) el.innerHTML = "";
}

async function buildRecaptcha(containerId, size = "invisible") {
  clearRecaptcha();
  const el = document.getElementById(containerId);
  if (!el) {
    const err = new Error("Security check isn’t ready. Refresh and try again.");
    err.code = "auth/argument-error";
    throw err;
  }
  const verifier = new RecaptchaVerifier(auth, containerId, {
    size,
    callback: () => {},
    "expired-callback": () => {
      clearRecaptcha();
    },
  });
  window.recaptchaVerifier = verifier;
  try {
    await verifier.render();
  } catch (e) {
    // Already rendered or invisible stub — continue
  }
  return verifier;
}

function readStoredAuthError() {
  try {
    const raw = sessionStorage.getItem(REDIRECT_ERROR_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(REDIRECT_ERROR_KEY);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function storeAuthError(err) {
  try {
    sessionStorage.setItem(
      REDIRECT_ERROR_KEY,
      JSON.stringify({ code: err?.code || "", message: err?.message || "Sign-in failed" })
    );
  } catch {
    /* ignore quota / private mode */
  }
}

export function useAuth() {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile,      setProfile]      = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [authError,    setAuthError]    = useState(() => readStoredAuthError());

  async function ensureProfile(fbUser) {
    if (!fbUser) return null;
    try {
      const snap = await getDoc(doc(db, "users", fbUser.uid));
      if (snap.exists()) {
        const data = await backfillTrialIfNeeded(fbUser.uid, snap.data());
        const genres = migratePreferredGenres(data.genres);
        const next = { ...data, genres };
        setProfile(next);
        return next;
      }
      const created = await createProfile(fbUser.uid, {
        email: fbUser.email || "",
        displayName: fbUser.displayName || "Listener",
        username: fbUser.displayName || "Listener",
        profileImage: fbUser.photoURL || "",
        phone: fbUser.phoneNumber || "",
      });
      setProfile(created);
      return created;
    } catch (e) {
      // Auth succeeded — never strand the user because Firestore write failed
      console.warn("Profile sync failed; continuing with local profile", e);
      const local = ephemeralProfile(fbUser);
      setProfile(local);
      return local;
    }
  }

  /** Re-read profile from Firestore (e.g. after Stripe checkout). */
  async function refreshProfile() {
    const fbUser = auth.currentUser;
    if (!fbUser) return null;
    return ensureProfile(fbUser);
  }

  useEffect(() => {
    let cancelled = false;

    // Finish Google/Apple redirect sign-in before trusting auth state alone
    getRedirectResult(auth)
      .then(async (result) => {
        if (cancelled || !result?.user) return;
        await ensureProfile(result.user);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("OAuth redirect failed", err);
        storeAuthError(err);
        setAuthError({ code: err?.code || "", message: err?.message || "Sign-in failed" });
      });

    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        await ensureProfile(fbUser);
      } else {
        setFirebaseUser(null);
        setProfile(null);
      }
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  async function signUp(email, password, username) {
    setAuthError(null);
    const cleanEmail = String(email || "").trim();
    const cleanName = String(username || "").trim();
    if (!cleanEmail) {
      const err = new Error("Enter an email address.");
      err.code = "auth/invalid-email";
      throw err;
    }
    if (!cleanName) {
      const err = new Error("Choose a display name.");
      err.code = "auth/argument-error";
      throw err;
    }
    if (String(password || "").length < 6) {
      const err = new Error("Password must be at least 6 characters.");
      err.code = "auth/weak-password";
      throw err;
    }
    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    try {
      await updateProfile(cred.user, { displayName: cleanName });
    } catch {
      /* non-fatal */
    }
    // Fresh email signup — write profile with the chosen name (don’t race getDoc)
    try {
      const created = await createProfile(cred.user.uid, {
        email: cleanEmail,
        username: cleanName,
        displayName: cleanName,
      });
      setProfile(created);
    } catch (e) {
      console.warn("Profile create failed after signup", e);
      await ensureProfile(cred.user);
      setProfile((p) => ({ ...(p || {}), displayName: cleanName, username: cleanName }));
    }
    return cred.user;
  }

  async function logIn(email, password) {
    setAuthError(null);
    const cleanEmail = String(email || "").trim();
    if (!cleanEmail) {
      const err = new Error("Enter an email address.");
      err.code = "auth/invalid-email";
      throw err;
    }
    if (!password) {
      const err = new Error("Enter your password.");
      err.code = "auth/wrong-password";
      throw err;
    }
    const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
    await ensureProfile(cred.user);
    return cred.user;
  }

  /**
   * Google sign-in: popup first (desktop), redirect fallback when popups are blocked
   * or unsupported (mobile Safari, in-app browsers, strict COOP).
   */
  async function signInWithGoogle() {
    setAuthError(null);
    const provider = googleProvider();

    try {
      const cred = await signInWithPopup(auth, provider);
      await ensureProfile(cred.user);
      return cred.user;
    } catch (e) {
      if (e?.code === "auth/popup-closed-by-user") throw e;
      if (!shouldFallbackToRedirect(e)) throw e;

      // Full-page redirect — more reliable on Pages / mobile
      await signInWithRedirect(auth, provider);
      return null;
    }
  }

  async function signInWithApple() {
    setAuthError(null);
    const provider = new OAuthProvider("apple.com");
    provider.addScope("email");
    provider.addScope("name");
    try {
      const cred = await signInWithPopup(auth, provider);
      await ensureProfile(cred.user);
      return cred.user;
    } catch (e) {
      if (e?.code === "auth/popup-closed-by-user") throw e;
      if (!shouldFallbackToRedirect(e)) throw e;
      await signInWithRedirect(auth, provider);
      return null;
    }
  }

  /**
   * Send SMS OTP. Accepts messy human phone input; normalizes to E.164.
   * Tries invisible reCAPTCHA, then falls back to a visible widget once.
   */
  async function sendPhoneOTP(phoneNumber, recaptchaContainerId = "recaptcha-container") {
    setAuthError(null);
    const e164 = normalizePhoneE164(phoneNumber);
    if (!e164) {
      const err = new Error("Enter a valid mobile number.");
      err.code = "auth/invalid-phone-number";
      throw err;
    }

    async function attempt(size) {
      const verifier = await buildRecaptcha(recaptchaContainerId, size);
      return signInWithPhoneNumber(auth, e164, verifier);
    }

    try {
      return await attempt("invisible");
    } catch (e) {
      const retryable = [
        "auth/argument-error",
        "auth/captcha-check-failed",
        "auth/invalid-app-credential",
      ].includes(e?.code) || /recaptcha/i.test(e?.message || "");
      if (!retryable) {
        clearRecaptcha();
        throw e;
      }
      try {
        return await attempt("normal");
      } catch (e2) {
        clearRecaptcha();
        throw e2;
      }
    }
  }

  async function verifyPhoneOTP(confirmationResult, code) {
    setAuthError(null);
    const clean = String(code || "").replace(/\s/g, "");
    if (!/^\d{6}$/.test(clean)) {
      const err = new Error("Enter the 6-digit code.");
      err.code = "auth/invalid-verification-code";
      throw err;
    }
    if (!confirmationResult?.confirm) {
      const err = new Error("Request a new code first.");
      err.code = "auth/session-expired";
      throw err;
    }
    const cred = await confirmationResult.confirm(clean);
    clearRecaptcha();
    await ensureProfile(cred.user);
    return cred.user;
  }

  async function resetPassword(email) {
    setAuthError(null);
    const cleanEmail = String(email || "").trim();
    if (!cleanEmail) {
      const err = new Error("Enter your email first.");
      err.code = "auth/invalid-email";
      throw err;
    }
    return sendPasswordResetEmail(auth, cleanEmail);
  }

  async function logOut() {
    clearRecaptcha();
    setAuthError(null);
    await signOut(auth);
    setFirebaseUser(null);
    setProfile(null);
  }

  function clearAuthError() {
    setAuthError(null);
    try { sessionStorage.removeItem(REDIRECT_ERROR_KEY); } catch { /* ignore */ }
  }

  return {
    firebaseUser, profile, setProfile, loading, authError, clearAuthError,
    signUp, logIn, logOut, refreshProfile,
    signInWithGoogle, signInWithApple,
    sendPhoneOTP, verifyPhoneOTP, resetPassword,
  };
}
