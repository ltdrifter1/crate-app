import { hasSeenDeckHint, markDeckHintSeen } from "./firstRunHint";

describe("first-run deck hint", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("unseen until marked", () => {
    expect(hasSeenDeckHint()).toBe(false);
    markDeckHintSeen();
    expect(hasSeenDeckHint()).toBe(true);
  });
});
