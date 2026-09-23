import { getFirebase, resetFirebaseForTests } from "./firebase";

jest.mock("firebase/app", () => ({
  initializeApp: jest.fn(() => ({ name: "app" })),
}));
jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(() => ({ currentUser: null })),
}));
jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(() => ({ kind: "db" })),
}));

describe("getFirebase", () => {
  beforeEach(() => {
    resetFirebaseForTests();
  });

  test("loads the SDK once and reuses the same app", async () => {
    const a = await getFirebase();
    const b = await getFirebase();
    expect(a).toBe(b);
    expect(a.db).toEqual({ kind: "db" });
    expect(a.auth).toEqual({ currentUser: null });
  });
});
