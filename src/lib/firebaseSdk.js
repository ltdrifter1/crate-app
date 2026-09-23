import { getFirebase } from "../firebase";

let boot = null;

/** Auth + Firestore SDK, loaded after first paint. */
export function loadFirebaseSdk() {
  if (!boot) {
    boot = Promise.all([
      getFirebase(),
      import("firebase/auth"),
      import("firebase/firestore"),
    ]).then(([fb, authMod, fsMod]) => ({
      app: fb.app,
      auth: fb.auth,
      db: fb.db,
      authMod,
      fsMod,
    }));
  }
  return boot;
}

export function resetFirebaseSdkForTests() {
  boot = null;
}
