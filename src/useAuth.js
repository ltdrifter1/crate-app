// src/useAuth.js
import { useState, useEffect, useCallback } from "react";
import { loadFirebaseSdk } from "./lib/firebaseSdk";
import { normalizePhoneE164 } from "./lib/phone";
import { migratePreferredGenres } from "./lib/genres";
import { buildFreePlanFields, needsPlanBackfill } from "./lib/entitlements";
import {
  assignMemberNumber,
  provisionalMemberNumber,
} from "./lib/memberNumber";
import { hasPendingAuthRedirect } from "./lib/authBoot";

const REDIRECT_ERROR_KEY = "rooms.auth.redirectError";

async function resolveMemberNumber(uid, preferred = null) {
  if (preferred != null && Number(preferred) > 0) return Number(preferred);
  try {
    const { db, fsMod } = await loadFirebaseSdk();
    return await assignMemberNumber(db, { doc: fsMod.doc, runTransaction: fsMod.runTransaction });
  } catch (e) {
    console.warn("Member number counter failed; using provisional", e);
    return provisionalMemberNumber(uid);
  }
}

async function createProfile(uid, fields = {}) {
  const { db, fsMod } = await loadFirebaseSdk();
  const displayName = fields.displayName || fields.username || "Listener";
  const trial = buildFreePlanFields();
  const memberNumber = await resolveMemberNumber(uid, fields.memberNumber);
  const profile = {
    uid,
    username:     fields.username     || displayName,
    email:        fields.email        || "",
    phone:        fields.phone        || "",
    displayName,
    profileImage: fields.profileImage || "",
    createdAt:    fsMod.serverTimestamp(),
    genres:       fields.genres       || [],
    adventurous:  fields.adventurous  ?? 50,
    depth:        fields.depth        ?? 50,
    channelIds:   fields.channelIds   || [],
    artistNames:  fields.artistNames  || [],
    energyBand:   fields.energyBand   || null,
    vibe:         fields.vibe         || null,
    seedChannelId: fields.seedChannelId || null,
    likedTracks:  [],
    dislikedTracks: [],
    dislikeTaste: { neighborhoods: {}, events: [] },
    recentTracks: [],
    onboarded:    false,
    settings:     { repeat: false },
    memberNumber,
    collection:   {},
    monthlyChoices: {},
    ...trial,
  };
  await fsMod.setDoc(fsMod.doc(db, "users", uid), profile);
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
    adventurous: 50,
    depth: 50,
    channelIds: [],
    artistNames: [],
    energyBand: null,
    vibe: null,
    seedChannelId: null,
    likedTracks: [],
    dislikedTracks: [],
    dislikeTaste: { neighborhoods: {}, events: [] },
    recentTracks: [],
    onboarded: true,
    settings: { repeat: false },
    memberNumber: provisionalMemberNumber(fbUser.uid),
    collection: {},
    monthlyChoices: {},
    ...buildFreePlanFields(),
  };
}

/** One-time backfill so existing accounts get a Free plan if missing. */
async function backfillTrialIfNeeded(uid, data) {
  if (!needsPlanBackfill(data)) return data;
  const trial = buildFreePlanFields();
  try {
    const { db, fsMod } = await loadFirebaseSdk();
    await fsMod.updateDoc(fsMod.doc(db, "users", uid), trial);
  } catch (e) {
    console.warn("Plan backfill failed; using local free fields", e);
  }
  return { ...data, ...trial };
}

/** Assign a Planet Club member number if the profile is missing one. */
async function backfillMemberNumberIfNeeded(uid, data) {
  if (data?.memberNumber != null && Number(data.memberNumber) > 0) return data;
  const memberNumber = await resolveMemberNumber(uid);
  try {
    const { db, fsMod } = await loadFirebaseSdk();
    await fsMod.updateDoc(fsMod.doc(db, "users", uid), { memberNumber });
  } catch (e) {
    console.warn("Member number backfill failed; using local", e);
  }
  return { ...data, memberNumber };
}

function shouldFallbackToRedirect(err) {
  const code = err?.code || "";
  return [
    "auth/popup-blocked",
    "auth/operation-not-supported-in-this-environment",
  ].includes(code)
    || (code === "auth/internal-error" && /popup|storage|cookie|third.?party/i.test(err?.message || ""));
}

function googleProvider(GoogleAuthProvider) {
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
  const { auth, authMod } = await loadFirebaseSdk();
  clearRecaptcha();
  const el = document.getElementById(containerId);
  if (!el) {
    const err = new Error("Security check isn’t ready. Refresh and try again.");
    err.code = "auth/argument-error";
    throw err;
  }
  const verifier = new authMod.RecaptchaVerifier(auth, containerId, {
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
      const { db, fsMod } = await loadFirebaseSdk();
      const snap = await fsMod.getDoc(fsMod.doc(db, "users", fbUser.uid));
      if (snap.exists()) {
        let data = await backfillTrialIfNeeded(fbUser.uid, snap.data());
        data = await backfillMemberNumberIfNeeded(fbUser.uid, data);
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
  const refreshProfile = useCallback(async () => {
    const { auth } = await loadFirebaseSdk();
    const fbUser = auth.currentUser;
    if (!fbUser) return null;
    return ensureProfile(fbUser);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let unsub = () => {};

    (async () => {
      try {
        const { auth, authMod } = await loadFirebaseSdk();
        if (cancelled) return;
        if (hasPendingAuthRedirect()) {
          authMod.getRedirectResult(auth)
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
        }
        unsub = authMod.onAuthStateChanged(auth, (fbUser) => {
          if (cancelled) return;
          if (fbUser) {
            setFirebaseUser(fbUser);
            setLoading(false);
            ensureProfile(fbUser);
          } else {
            setFirebaseUser(null);
            setProfile(null);
            setLoading(false);
          }
        });
      } catch (e) {
        if (!cancelled) {
          console.warn("Auth SDK failed to load; continuing as guest", e);
          setLoading(false);
        }
      }
    })();

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
    const { auth, authMod } = await loadFirebaseSdk();
    const cred = await authMod.createUserWithEmailAndPassword(auth, cleanEmail, password);
    try {
      await authMod.updateProfile(cred.user, { displayName: cleanName });
    } catch {
      /* non-fatal */
    }
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
    const { auth, authMod } = await loadFirebaseSdk();
    const cred = await authMod.signInWithEmailAndPassword(auth, cleanEmail, password);
    await ensureProfile(cred.user);
    return cred.user;
  }

  async function signInWithGoogle() {
    setAuthError(null);
    const { auth, authMod } = await loadFirebaseSdk();
    const provider = googleProvider(authMod.GoogleAuthProvider);

    try {
      const cred = await authMod.signInWithPopup(auth, provider);
      await ensureProfile(cred.user);
      return cred.user;
    } catch (e) {
      if (e?.code === "auth/popup-closed-by-user") throw e;
      if (!shouldFallbackToRedirect(e)) throw e;
      await authMod.signInWithRedirect(auth, provider);
      return null;
    }
  }

  async function signInWithApple() {
    setAuthError(null);
    const { auth, authMod } = await loadFirebaseSdk();
    const provider = new authMod.OAuthProvider("apple.com");
    provider.addScope("email");
    provider.addScope("name");
    try {
      const cred = await authMod.signInWithPopup(auth, provider);
      await ensureProfile(cred.user);
      return cred.user;
    } catch (e) {
      if (e?.code === "auth/popup-closed-by-user") throw e;
      if (!shouldFallbackToRedirect(e)) throw e;
      await authMod.signInWithRedirect(auth, provider);
      return null;
    }
  }

  async function sendPhoneOTP(phoneNumber, recaptchaContainerId = "recaptcha-container") {
    setAuthError(null);
    const e164 = normalizePhoneE164(phoneNumber);
    if (!e164) {
      const err = new Error("Enter a valid mobile number.");
      err.code = "auth/invalid-phone-number";
      throw err;
    }

    const { auth, authMod } = await loadFirebaseSdk();
    async function attempt(size) {
      const verifier = await buildRecaptcha(recaptchaContainerId, size);
      return authMod.signInWithPhoneNumber(auth, e164, verifier);
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
    const { auth, authMod } = await loadFirebaseSdk();
    return authMod.sendPasswordResetEmail(auth, cleanEmail);
  }

  async function logOut() {
    clearRecaptcha();
    setAuthError(null);
    const { auth, authMod } = await loadFirebaseSdk();
    await authMod.signOut(auth);
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
