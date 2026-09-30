import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import CoverImage, { coverSizeAttrs } from "./CoverImage";
import VirtualList from "./VirtualList";
import Icon, { FeatureIcon } from "./Icon";

describe("coverSizeAttrs", () => {
  it("returns square intrinsic dimensions", () => {
    expect(coverSizeAttrs(48)).toEqual({ width: 48, height: 48, sizes: "48px" });
  });
});

describe("CoverImage loading", () => {
  it("marks priority covers as eager LCP candidates", async () => {
    const div = document.createElement("div");
    document.body.appendChild(div);
    const root = createRoot(div);
    await act(async () => {
      root.render(
        React.createElement(CoverImage, {
          src: "/brand/logo-mark.svg",
          width: 64,
          height: 64,
          priority: true,
        })
      );
    });
    const img = div.querySelector("img");
    expect(img.getAttribute("loading")).toBe("eager");
    expect(img.getAttribute("fetchpriority") || img.fetchPriority).toMatch(/high/i);
    expect(img.getAttribute("width")).toBe("64");
    await act(async () => root.unmount());
    document.body.removeChild(div);
  });

  it("loads Firebase Storage covers from the original file", async () => {
    const div = document.createElement("div");
    document.body.appendChild(div);
    const root = createRoot(div);
    const src = "https://storage.googleapis.com/bucket/covers/a.jpg";
    await act(async () => {
      root.render(
        React.createElement(CoverImage, {
          src,
          width: 168,
          height: 168,
        })
      );
    });
    const img = div.querySelector("img");
    expect(img.getAttribute("src")).toBe(src);
    expect(img.getAttribute("src")).not.toContain("/cdn-cgi/image/");
    await act(async () => root.unmount());
    document.body.removeChild(div);
  });

  it("eager without priority does not steal LCP", async () => {
    const div = document.createElement("div");
    document.body.appendChild(div);
    const root = createRoot(div);
    await act(async () => {
      root.render(
        React.createElement(CoverImage, {
          src: "/brand/logo-mark.svg",
          width: 64,
          height: 64,
          eager: true,
        })
      );
    });
    const img = div.querySelector("img");
    expect(img.getAttribute("loading")).toBe("eager");
    const pri = img.getAttribute("fetchpriority") || img.fetchPriority || "auto";
    expect(String(pri).toLowerCase()).not.toBe("high");
    await act(async () => root.unmount());
    document.body.removeChild(div);
  });
});

describe("ui modules", () => {
  it("exports CoverImage, VirtualList, Icon, FeatureIcon", () => {
    expect(typeof CoverImage).toBe("function");
    expect(typeof VirtualList).toBe("function");
    expect(typeof Icon).toBe("function");
    expect(typeof FeatureIcon).toBe("function");
  });
});
