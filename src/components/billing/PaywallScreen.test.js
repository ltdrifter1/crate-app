/**
 * @jest-environment jsdom
 */
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import PaywallScreen from "./PaywallScreen";

describe("PaywallScreen beta", () => {
  test("shows coming soon instead of prices or checkout", async () => {
    const div = document.createElement("div");
    document.body.appendChild(div);
    const root = createRoot(div);
    await act(async () => {
      root.render(
        React.createElement(PaywallScreen, {
          access: { tier: "free", reason: "free", streaming: "full" },
          onContinueFree: jest.fn(),
        })
      );
    });
    expect(div.textContent).toMatch(/Beta launch/i);
    expect(div.textContent).toMatch(/Free trial period/i);
    expect(div.textContent).toMatch(/Coming soon/);
    expect(div.textContent).not.toMatch(/\$0\.99/);
    expect(div.textContent).not.toMatch(/Opening Stripe/);
    expect(div.textContent).not.toMatch(/Manage billing in Stripe/);
    await act(async () => {
      root.unmount();
    });
    document.body.removeChild(div);
  });
});
