import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";

import SplashScreen from "./SplashScreen";

describe("SplashScreen", () => {
  test("exports a splash loader", () => {
    expect(typeof SplashScreen).toBe("function");
  });

  test("renders a spinning planet with Loading copy", async () => {
    const div = document.createElement("div");
    document.body.appendChild(div);
    const root = createRoot(div);
    await act(async () => {
      root.render(<SplashScreen size={176} />);
    });
    const status = div.querySelector('[role="status"]');
    expect(status).toBeTruthy();
    expect(status.getAttribute("aria-busy")).toBe("true");
    expect(status.getAttribute("aria-label")).toBe("Loading");
    expect(div.querySelector(".pmp-splash-label").textContent).toBe("Loading");
    expect(div.textContent).not.toMatch(/On air/i);
    expect(div.querySelector(".pmp-spin-planet")).toBeTruthy();
    expect(div.querySelector(".pmp-spin-planet__map")).toBeTruthy();
    expect(div.querySelector("img")).toBeNull();
    await act(async () => {
      root.unmount();
    });
    document.body.removeChild(div);
  });
});
