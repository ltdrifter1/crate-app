// src/firebase.js
// Lazy SDK load so the first JS chunk can paint Home from IDB/CDN
// without waiting on firebase/app + auth + firestore.

const firebaseConfig = {
  apiKey: "AIzaSyD39HO66pip_1Q1RBy6fJFb9hhbLJmlFyU",
  authDomain: "crate-app-58494.firebaseapp.com",
  projectId: "crate-app-58494",
  storageBucket: "crate-app-58494.firebasestorage.app",
  messagingSenderId: "812555574231",
  appId: "1:812555574231:web:2a442966c4e3a6c5658992",
  measurementId: "G-YMXZY8EF9P",
};

let _ready = null;

export function getFirebase() {
  if (_ready) return _ready;
  _ready = Promise.all([
    import("firebase/app"),
    import("firebase/auth"),
    import("firebase/firestore"),
  ]).then(([appMod, authMod, fsMod]) => {
    const app = appMod.initializeApp(firebaseConfig);
    return {
      app,
      auth: authMod.getAuth(app),
      db: fsMod.getFirestore(app),
    };
  });
  return _ready;
}

/** Test helper — next getFirebase() starts a fresh SDK import. */
export function resetFirebaseForTests() {
  _ready = null;
}

export { firebaseConfig };
