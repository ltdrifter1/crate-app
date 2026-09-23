/**
 * @jest-environment jsdom
 */
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import CoverImage from "./CoverImage";
import { resetCloudflareResizeForTests } from "../../lib/coverUrl";

const STORAGE = "https://storage.googleapis.com/b/covers/art.jpg";

describe("CoverImage", () => {
  let div;
  let root;

  beforeEach(() => {
    resetCloudflareResizeForTests();
    div = document.createElement("div");
    document.body.appendChild(div);
    root = createRoot(div);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    document.body.removeChild(div);
  });

  test("missing src shows the disc fallback instead of a blank tile", async () => {
    await act(async () => {
      root.render(React.createElement(CoverImage, { src: "", width: 80, height: 80 }));
    });
    expect(div.querySelector("img")).toBeNull();
    expect(div.querySelector("[data-testid='cover-fallback']")).toBeTruthy();
  });

  test("a broken photo falls back to the disc after retries", async () => {
    await act(async () => {
      root.render(React.createElement(CoverImage, { src: STORAGE, width: 80, height: 80 }));
    });
    const img = div.querySelector("img");
    expect(img).toBeTruthy();
    await act(async () => {
      img.dispatchEvent(new Event("error"));
    });
    const retried = div.querySelector("img");
    expect(retried).toBeTruthy();
    expect(retried.getAttribute("src")).toContain("_200x200");
    await act(async () => {
      retried.dispatchEvent(new Event("error"));
    });
    const original = div.querySelector("img");
    expect(original).toBeTruthy();
    expect(original.getAttribute("src")).toBe(STORAGE);
    await act(async () => {
      original.dispatchEvent(new Event("error"));
    });
    expect(div.querySelector("img")).toBeNull();
    expect(div.querySelector("[data-testid='cover-fallback']")).toBeTruthy();
  });

  test("color well paints behind the photo while it loads", async () => {
    await act(async () => {
      root.render(React.createElement(CoverImage, {
        src: STORAGE, width: 80, height: 80, wellColor: "#5AA8B8",
      }));
    });
    const wrap = div.querySelector("span");
    expect(wrap).toBeTruthy();
    expect(String(wrap.getAttribute("style") || wrap.style.background)).toMatch(/#5AA8B8|90,\s*168,\s*184/i);
  });
});
