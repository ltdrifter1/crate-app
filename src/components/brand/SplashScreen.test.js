import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";

jest.mock("lottie-react", () => {
  return function MockLottie() {
    return <div data-testid="splash-lottie" />;
  };
});

import SplashScreen from "./SplashScreen";
import placeholder from "./splash-loader.json";

describe("SplashScreen", () => {
  beforeEach(() => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(placeholder),
      })
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("exports a splash loader", () => {
    expect(typeof SplashScreen).toBe("function");
  });

  test("ships a replaceable splash-loader placeholder", () => {
    expect(placeholder.nm).toMatch(/^PLACEHOLDER/);
    expect(placeholder.w).toBe(512);
    expect(placeholder.h).toBe(512);
  });

  test("renders logo-only with transparent background", async () => {
    const div = document.createElement("div");
    document.body.appendChild(div);
    const root = createRoot(div);
    await act(async () => {
      root.render(<SplashScreen size={200} />);
    });
    await act(async () => {
      await Promise.resolve();
    });
    const status = div.querySelector('[role="status"]');
    expect(status).toBeTruthy();
    expect(status.style.background).toBe("transparent");
    expect(div.textContent).not.toMatch(/please wait/i);
    // Placeholder Lottie → static brand lockup
    const img = div.querySelector("img");
    expect(img).toBeTruthy();
    expect(img.getAttribute("alt")).toMatch(/Planet/i);
    await act(async () => {
      root.unmount();
    });
    document.body.removeChild(div);
  });
});
