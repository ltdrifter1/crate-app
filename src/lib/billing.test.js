import {
  readBillingQuery,
  settleBillingReturn,
  stripBillingQuery,
} from "./billing";
import { PLAN_IDS } from "./entitlements";

jest.mock("../firebase", () => ({
  getFirebase: async () => ({ app: {} }),
  app: {},
}));
jest.mock("firebase/functions", () => ({
  getFunctions: () => ({}),
  httpsCallable: () => async () => ({ data: {} }),
}));

describe("readBillingQuery", () => {
  test("parses success + session id", () => {
    expect(readBillingQuery("?billing=success&plan=premium&session_id=cs_test_1")).toEqual({
      billing: "success",
      plan: "premium",
      sessionId: "cs_test_1",
    });
  });

  test("handles missing params", () => {
    expect(readBillingQuery("")).toEqual({
      billing: null,
      plan: null,
      sessionId: null,
    });
  });
});

describe("stripBillingQuery", () => {
  test("removes billing params", () => {
    expect(stripBillingQuery("https://planet.example/club?billing=success&plan=club&session_id=cs_1&x=1"))
      .toBe("/club?x=1");
  });
});

describe("settleBillingReturn", () => {
  test("ignores non-success", async () => {
    const result = await settleBillingReturn({ search: "?billing=cancel" });
    expect(result.applied).toBe(false);
    expect(result.pending).toBe(false);
  });

  test("confirms session then reports paid access", async () => {
    const confirmSession = jest.fn(async () => ({ ok: true, plan: "club" }));
    const refreshProfile = jest.fn(async () => ({
      plan: "club",
      subscriptionStatus: "active",
    }));
    const result = await settleBillingReturn({
      search: "?billing=success&plan=club&session_id=cs_test_1",
      confirmSession,
      refreshProfile,
      delayMs: 0,
      attempts: 2,
    });
    expect(confirmSession).toHaveBeenCalledWith("cs_test_1");
    expect(result.applied).toBe(true);
    expect(result.plan).toBe(PLAN_IDS.CLUB);
  });

  test("stays pending when profile is still free", async () => {
    const result = await settleBillingReturn({
      search: "?billing=success&plan=club",
      confirmSession: jest.fn(),
      refreshProfile: jest.fn(async () => ({
        plan: "free",
        subscriptionStatus: "free",
      })),
      delayMs: 0,
      attempts: 2,
    });
    expect(result.applied).toBe(false);
    expect(result.pending).toBe(true);
  });
});
