import fs from "fs";
import path from "path";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { getFirebase } from "../firebase";
import {
  BETA_WAITLIST_COLLECTION,
  isValidBetaEmail,
  joinBetaWaitlist,
  normalizeBetaEmail,
  withTimeout,
} from "./betaWaitlist";

jest.mock("../firebase", () => ({
  getFirebase: jest.fn(),
}));

jest.mock("firebase/firestore", () => ({
  doc: jest.fn((db, col, id) => ({ db, col, id })),
  setDoc: jest.fn(async () => {}),
  serverTimestamp: jest.fn(() => ({ __serverTime: true })),
}));

describe("beta waitlist", () => {
  beforeEach(() => {
    getFirebase.mockResolvedValue({ db: { kind: "db" } });
    doc.mockReset();
    doc.mockImplementation((db, col, id) => ({ db, col, id }));
    setDoc.mockReset();
    setDoc.mockImplementation(async () => {});
    serverTimestamp.mockReset();
    serverTimestamp.mockImplementation(() => ({ __serverTime: true }));
  });

  test("accepts a normal address and rejects junk", () => {
    expect(normalizeBetaEmail("  Ada@Example.COM ")).toBe("ada@example.com");
    expect(isValidBetaEmail("ada@example.com")).toBe(true);
    expect(isValidBetaEmail("not-an-email")).toBe(false);
    expect(isValidBetaEmail("a@b.c")).toBe(false);
    expect(isValidBetaEmail("")).toBe(false);
  });

  test("writes one splash row per lowercase email", async () => {
    await expect(joinBetaWaitlist("Ada@Example.COM")).resolves.toEqual({
      email: "ada@example.com",
    });
    expect(getFirebase).toHaveBeenCalled();
    expect(doc).toHaveBeenCalledWith(
      { kind: "db" },
      BETA_WAITLIST_COLLECTION,
      "ada@example.com"
    );
    expect(setDoc).toHaveBeenCalledWith(
      { db: { kind: "db" }, col: BETA_WAITLIST_COLLECTION, id: "ada@example.com" },
      {
        email: "ada@example.com",
        source: "splash",
        createdAt: { __serverTime: true },
      },
      { merge: true }
    );
    expect(serverTimestamp).toHaveBeenCalled();
  });

  test("preserves a rules denial so the splash can say the list is closed", async () => {
    setDoc.mockImplementation(async () => {
      const error = new Error("Missing or insufficient permissions.");
      error.code = "permission-denied";
      throw error;
    });
    await expect(joinBetaWaitlist("ada@example.com")).rejects.toMatchObject({
      code: "permission-denied",
    });
  });

  test("stops waiting when a write never settles", async () => {
    await expect(withTimeout(new Promise(() => {}), 20)).rejects.toMatchObject({
      code: "deadline-exceeded",
    });
  });

  test("refuses to write an invalid address", async () => {
    await expect(joinBetaWaitlist("nope")).rejects.toMatchObject({
      code: "invalid-email",
    });
    expect(setDoc).not.toHaveBeenCalled();
  });

  test("firestore lets the splash create a waitlist row and keeps reads private", () => {
    const rules = fs.readFileSync(
      path.join(__dirname, "../../firestore.rules"),
      "utf8"
    );
    expect(rules).toMatch(/match \/betaWaitlist\/\{emailId\}/);
    expect(rules).toMatch(/source == 'splash'/);
    expect(rules).toMatch(/allow read, delete: if isAdmin\(\)/);
  });
});
