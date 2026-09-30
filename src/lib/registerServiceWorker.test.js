import { registerServiceWorker, shouldRegisterServiceWorker, SW_PATH } from "./registerServiceWorker";

describe("registerServiceWorker", () => {
  test("only production browsers with the API register", () => {
    expect(shouldRegisterServiceWorker({ nodeEnv: "development", locator: { serviceWorker: { register: () => {} } } })).toBe(false);
    expect(shouldRegisterServiceWorker({ nodeEnv: "production", locator: {} })).toBe(false);
    expect(shouldRegisterServiceWorker({
      nodeEnv: "production",
      locator: { serviceWorker: { register: () => {} } },
    })).toBe(true);
  });

  test("registerServiceWorker hooks window load", () => {
    const register = jest.fn(() => Promise.resolve());
    const listeners = {};
    const win = {
      addEventListener: (type, fn) => { listeners[type] = fn; },
    };
    expect(registerServiceWorker({
      nodeEnv: "production",
      locator: { serviceWorker: { register } },
      win,
    })).toBe(true);
    expect(register).not.toHaveBeenCalled();
    listeners.load();
    expect(register).toHaveBeenCalledWith(SW_PATH);
  });
});
