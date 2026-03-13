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
} from "firebase/auth";
import {
  doc, setDoc, getDoc, serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "./firebase";

async function createProfile(uid, fields = {}) {
  const profile = {
    uid,
    username:     fields.username     || "Digger",
    email:        fields.email        || "",
    displayName:  fields.displayName  || fields.username || "Digger",
    profileImage: fields.profileImage || "🎧",
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
    const cred    = await createUserWithEmailAndPassword(auth, email, password);
    const profile = await createProfile(cred.user.uid, { email, username });
    setProfile(profile);
    return cred.user;
  }

  async function logIn(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
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
        displayName:  cred.user.displayName,
        profileImage: cred.user.photoURL || "🎧",
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
        displayName: cred.user.displayName,
      });
      setProfile(profile);
    }
    return cred.user;
  }

  async function sendPhoneOTP(phoneNumber, recaptchaContainerId) {
    clearRecaptcha();
    window.recaptchaVerifier = new RecaptchaVerifier(
      auth,
      recaptchaContainerId,
      {
        size: "invisible",
        callback: () => {},
        "expired-callback": () => { clearRecaptcha(); },
      }
    );
    try {
      const confirmation = await signInWithPhoneNumber(
        auth, phoneNumber, window.recaptchaVerifier
      );
      return confirmation;
    } catch (e) {
      clearRecaptcha();
      throw e;
    }
  }

  async function verifyPhoneOTP(confirmationResult, code) {
    const cred = await confirmationResult.confirm(code);
    clearRecaptcha();
    const snap = await getDoc(doc(db, "users", cred.user.uid));
    if (snap.exists()) {
      setProfile(snap.data());
    } else {
      const profile = await createProfile(cred.user.uid, {
        displayName: cred.user.phoneNumber,
      });
      setProfile(profile);
    }
    return cred.user;
  }


  async function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
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
