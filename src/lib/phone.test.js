import { normalizePhoneE164, phoneHint, authErrorMessage } from "./phone";

describe("normalizePhoneE164", () => {
  test("formats US 10-digit numbers", () => {
    expect(normalizePhoneE164("4155552671")).toBe("+14155552671");
    expect(normalizePhoneE164("(415) 555-2671")).toBe("+14155552671");
    expect(normalizePhoneE164("415-555-2671")).toBe("+14155552671");
  });

  test("keeps explicit country codes", () => {
    expect(normalizePhoneE164("+14155552671")).toBe("+14155552671");
    expect(normalizePhoneE164("+44 7700 900123")).toBe("+447700900123");
    expect(normalizePhoneE164("00 44 7700 900123")).toBe("+447700900123");
  });

  test("handles 11-digit US with leading 1", () => {
    expect(normalizePhoneE164("14155552671")).toBe("+14155552671");
  });

  test("rejects empty / too short", () => {
    expect(normalizePhoneE164("")).toBeNull();
    expect(normalizePhoneE164("123")).toBeNull();
    expect(normalizePhoneE164(null)).toBeNull();
  });
});

describe("phoneHint", () => {
  test("pretty-prints US numbers", () => {
    expect(phoneHint("4155552671")).toBe("+1 (415) 555-2671");
  });
});

describe("authErrorMessage", () => {
  test("maps known codes", () => {
    expect(authErrorMessage({ code: "auth/invalid-phone-number" })).toMatch(/mobile/i);
    expect(authErrorMessage({ code: "auth/email-already-in-use" })).toMatch(/logging in/i);
  });

  test("falls back gracefully", () => {
    expect(authErrorMessage({ message: "boom" })).toBe("boom");
    expect(authErrorMessage({})).toMatch(/try again/i);
  });
});
