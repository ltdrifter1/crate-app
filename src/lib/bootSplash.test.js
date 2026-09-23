import { BOOT_SPLASH_ID, dismissBootSplash, isBootSplashVisible } from "./bootSplash";

describe("bootSplash", () => {
  test("dismissBootSplash hides the HTML planet", () => {
    const el = {
      style: { display: "flex" },
      hasAttribute: () => false,
      setAttribute: jest.fn(),
    };
    const doc = {
      getElementById: (id) => (id === BOOT_SPLASH_ID ? el : null),
    };
    expect(isBootSplashVisible(doc)).toBe(true);
    expect(dismissBootSplash(doc)).toBe(true);
    expect(el.setAttribute).toHaveBeenCalledWith("hidden", "");
    expect(el.style.display).toBe("none");
    el.hasAttribute = (name) => name === "hidden";
    expect(isBootSplashVisible(doc)).toBe(false);
  });

  test("dismissBootSplash is a no-op without the node", () => {
    expect(dismissBootSplash({ getElementById: () => null })).toBe(false);
  });
});
