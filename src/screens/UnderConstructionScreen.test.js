/**
 * @jest-environment jsdom
 */
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

import React, { act } from "react";
import { createRoot } from "react-dom/client";
import UnderConstructionScreen, {
  BETA_SIGNUP_STORAGE_KEY,
} from "./UnderConstructionScreen";
import { joinBetaWaitlist } from "../lib/betaWaitlist";

jest.mock("../lib/betaWaitlist", () => {
  const actual = jest.requireActual("../lib/betaWaitlist");
  return {
    ...actual,
    joinBetaWaitlist: jest.fn(),
  };
});

function setNativeValue(input, value) {
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value"
  ).set;
  setter.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

describe("UnderConstructionScreen", () => {
  let container;
  let root;

  beforeEach(() => {
    window.localStorage.clear();
    joinBetaWaitlist.mockReset();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  async function render() {
    await act(async () => {
      root.render(<UnderConstructionScreen />);
    });
  }

  test("says the station is under construction and asks for the beta", async () => {
    await render();
    expect(container.textContent).toMatch(/Under\s*construction/i);
    expect(container.textContent).toMatch(/Beta launching soon/i);
    expect(container.querySelector("#beta-email")).toBeTruthy();
    expect(container.querySelector("button[type='submit']").textContent).toMatch(/Sign up/);
    expect(document.title).toMatch(/Under construction/);
  });

  test("keeps an invalid address off the list", async () => {
    await render();
    const input = container.querySelector("#beta-email");
    await act(async () => {
      setNativeValue(input, "not-an-email");
    });
    await act(async () => {
      container.querySelector("form").dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true })
      );
    });
    expect(joinBetaWaitlist).not.toHaveBeenCalled();
    expect(container.textContent).toMatch(/valid email/i);
  });

  test("saves a valid address and confirms the signup", async () => {
    joinBetaWaitlist.mockResolvedValue({ email: "ada@example.com" });
    await render();
    const input = container.querySelector("#beta-email");
    await act(async () => {
      setNativeValue(input, "Ada@Example.COM");
    });
    await act(async () => {
      container.querySelector("form").dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true })
      );
    });
    expect(joinBetaWaitlist).toHaveBeenCalledWith("Ada@Example.COM");
    expect(container.textContent).toMatch(/You're on the list/);
    expect(container.textContent).toMatch(/ada@example.com/);
    expect(window.localStorage.getItem(BETA_SIGNUP_STORAGE_KEY)).toBe(
      "ada@example.com"
    );
  });
});
