/**
 * @jest-environment jsdom
 */
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { ScreenPane } from "./AppChrome";

describe("ScreenPane", () => {
  test("keep-alive hides without unmounting children", async () => {
    const div = document.createElement("div");
    document.body.appendChild(div);
    const root = createRoot(div);
    await act(async () => {
      root.render(
        React.createElement(
          ScreenPane,
          { keepAlive: true, active: false },
          React.createElement("div", { "data-testid": "home-hero" }, "hero")
        )
      );
    });
    const pane = div.querySelector("[aria-hidden='true']");
    expect(pane).toBeTruthy();
    expect(pane.hidden).toBe(true);
    expect(div.querySelector("[data-testid='home-hero']")).toBeTruthy();
    await act(async () => {
      root.unmount();
    });
    document.body.removeChild(div);
  });

  test("transient panes mount without hidden", async () => {
    const div = document.createElement("div");
    document.body.appendChild(div);
    const root = createRoot(div);
    await act(async () => {
      root.render(
        React.createElement(ScreenPane, null, React.createElement("span", null, "search"))
      );
    });
    expect(div.querySelector("[hidden]")).toBeNull();
    expect(div.textContent).toContain("search");
    await act(async () => {
      root.unmount();
    });
    document.body.removeChild(div);
  });
});
