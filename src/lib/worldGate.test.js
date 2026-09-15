/**
 * @jest-environment jsdom
 */
import { hasEnteredWorld, markEnteredWorld, resetEnteredWorld, worldGateKey } from "./worldGate";

describe("worldGate", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  test("defaults to not entered", () => {
    expect(hasEnteredWorld()).toBe(false);
    expect(worldGateKey()).toBe("planetmp3.worldEntered");
  });

  test("mark persists for the session", () => {
    markEnteredWorld();
    expect(hasEnteredWorld()).toBe(true);
    expect(sessionStorage.getItem("planetmp3.worldEntered")).toBe("1");
  });

  test("reset clears the ritual", () => {
    markEnteredWorld();
    resetEnteredWorld();
    expect(hasEnteredWorld()).toBe(false);
  });
});
