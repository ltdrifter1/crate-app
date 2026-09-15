import { hasPendingAuthRedirect } from "./authBoot";

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
