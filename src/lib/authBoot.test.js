import {
  AUTH_SESSION_KEY,
  clearAuthSession,
  hasPendingAuthRedirect,
  markAuthSession,
  peekAuthSession,
} from "./authBoot";

describe("hasPendingAuthRedirect", () => {
  test("false when window is missing", () => {
    expect(hasPendingAuthRedirect(null)).toBe(false);
  });

  test("true for email-link query params", () => {
    expect(hasPendingAuthRedirect({
      location: { search: "?apiKey=x&oobCode=y", hash: "" },
      sessionStorage: { length: 0, key: () => null },
    })).toBe(true);
  });

  test("true for stored Firebase redirect keys", () => {
    const keys = ["firebase:pendingRedirect:crate-app"];
    expect(hasPendingAuthRedirect({
      location: { search: "", hash: "" },
      sessionStorage: {
        length: keys.length,
        key: (i) => keys[i],
      },
    })).toBe(true);
  });

  test("false on a normal Home boot", () => {
    expect(hasPendingAuthRedirect({
      location: { search: "", hash: "" },
      sessionStorage: { length: 0, key: () => null },
    })).toBe(false);
  });
});

describe("peekAuthSession", () => {
  test("true when our returning-member flag is set", () => {
    const mem = new Map();
    const store = {
      getItem: (k) => (mem.has(k) ? mem.get(k) : null),
      setItem: (k, v) => mem.set(k, String(v)),
      removeItem: (k) => mem.delete(k),
      key: (i) => [...mem.keys()][i] || null,
      get length() { return mem.size; },
    };
    expect(peekAuthSession(store)).toBe(false);
    expect(markAuthSession(store)).toBe(true);
    expect(peekAuthSession(store)).toBe(true);
    expect(mem.get(AUTH_SESSION_KEY)).toBe("1");
    expect(clearAuthSession(store)).toBe(true);
    expect(peekAuthSession(store)).toBe(false);
  });

  test("true when Firebase left an authUser key", () => {
    const keys = ["firebase:authUser:AIzaSy:app"];
    const store = {
      getItem: () => null,
      key: (i) => keys[i] || null,
      length: keys.length,
    };
    expect(peekAuthSession(store)).toBe(true);
  });

  test("false without storage", () => {
    expect(peekAuthSession(null)).toBe(false);
  });
});
