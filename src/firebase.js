// src/firebase.js
// ─────────────────────────────────────────────────────────────────────────────
// STEP 7: Replace every value below with your real keys from Firebase Console.
// (Project Settings → Your Apps → Web app → firebaseConfig)
// ─────────────────────────────────────────────────────────────────────────────

import { initializeApp } from "firebase/app";
import { getAuth }       from "firebase/auth";
import { getFirestore }  from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD39HO66pip_1Q1RBy6fJFb9hhbLJmlFyU",
  authDomain: "crate-app-58494.firebaseapp.com",
  projectId: "crate-app-58494",
  storageBucket: "crate-app-58494.firebasestorage.app",
  messagingSenderId: "812555574231",
  appId: "1:812555574231:web:2a442966c4e3a6c5658992",
  measurementId: "G-YMXZY8EF9P"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db   = getFirestore(app);
