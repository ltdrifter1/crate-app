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
  RecaptchaVerifier,
  signInWithPhoneNumber,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";
import {
  doc, setDoc, getDoc, serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import { normalizePhoneE164 } from "./lib/phone";

async function createProfile(uid, fields = {}) {
  const displayName = fields.displayName || fields.username || "Listener";
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
  };
  await setDoc(doc(db, "users", uid), profile);
  return profile;
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
  // render() ensures the widget is ready before signInWithPhoneNumber
  try {
    await verifier.render();
  } catch (e) {
    // Already rendered or invisible stub — continue
  }
  return verifier;
}

export function useAuth() {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile,      setProfile]      = useState(null);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        const snap = await getDoc(doc(db, "users", fbUser.uid));
        setProfile(snap.exists() ? snap.data() : null);
      } else {
        setFirebaseUser(null);
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  async function signUp(email, password, username) {
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
    const profile = await createProfile(cred.user.uid, {
      email: cleanEmail,
      username: cleanName,
      displayName: cleanName,
    });
    setProfile(profile);
    return cred.user;
  }

  async function logIn(email, password) {
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
    const snap = await getDoc(doc(db, "users", cred.user.uid));
    if (snap.exists()) setProfile(snap.data());
    return cred.user;
  }

  async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    const cred     = await signInWithPopup(auth, provider);
    const snap     = await getDoc(doc(db, "users", cred.user.uid));
    if (snap.exists()) {
      setProfile(snap.data());
    } else {
      const profile = await createProfile(cred.user.uid, {
        email:        cred.user.email,
        displayName:  cred.user.displayName || "Listener",
        username:     cred.user.displayName || "Listener",
        profileImage: cred.user.photoURL || "",
      });
      setProfile(profile);
    }
    return cred.user;
  }

  async function signInWithApple() {
    const provider = new OAuthProvider("apple.com");
    provider.addScope("email");
    provider.addScope("name");
    const cred = await signInWithPopup(auth, provider);
    const snap = await getDoc(doc(db, "users", cred.user.uid));
    if (snap.exists()) {
      setProfile(snap.data());
    } else {
      const profile = await createProfile(cred.user.uid, {
        email:       cred.user.email,
        displayName: cred.user.displayName || "Listener",
        username:    cred.user.displayName || "Listener",
      });
      setProfile(profile);
    }
    return cred.user;
  }

  /**
   * Send SMS OTP. Accepts messy human phone input; normalizes to E.164.
   * Tries invisible reCAPTCHA, then falls back to a visible widget once.
   */
  async function sendPhoneOTP(phoneNumber, recaptchaContainerId = "recaptcha-container") {
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
      // Visible widget — more reliable when invisible fails (ad blockers, domain config)
      try {
        return await attempt("normal");
      } catch (e2) {
        clearRecaptcha();
        throw e2;
      }
    }
  }

  async function verifyPhoneOTP(confirmationResult, code) {
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
    const snap = await getDoc(doc(db, "users", cred.user.uid));
    if (snap.exists()) {
      setProfile(snap.data());
    } else {
      const phone = cred.user.phoneNumber || "";
      const profile = await createProfile(cred.user.uid, {
        displayName: "Listener",
        username: "Listener",
        phone,
      });
      setProfile(profile);
    }
    return cred.user;
  }

  async function resetPassword(email) {
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
    await signOut(auth);
    setFirebaseUser(null);
    setProfile(null);
  }

  return {
    firebaseUser, profile, setProfile, loading,
    signUp, logIn, logOut,
    signInWithGoogle, signInWithApple,
    sendPhoneOTP, verifyPhoneOTP, resetPassword,
  };
}
