import {
  isRemoteCoverUrl,
  coverResizeWidth,
  firebaseThumbUrl,
  cloudflareImageUrl,
  coverDisplayUrl,
  coverSrcSet,
  nearestFirebaseThumbSize,
  markCloudflareResizeUnavailable,
  isCloudflareResizeAvailable,
  resetCloudflareResizeForTests,
} from "./coverUrl";

describe("coverUrl", () => {
  beforeEach(() => {
    resetCloudflareResizeForTests();
  });
  test("isRemoteCoverUrl only matches Firebase / GCS hosts", () => {
    expect(isRemoteCoverUrl("https://storage.googleapis.com/crate-app-58494.firebasestorage.app/covers/a.jpg")).toBe(true);
    expect(isRemoteCoverUrl("https://crate-app-58494.firebasestorage.app/covers/a.jpg")).toBe(true);
    expect(isRemoteCoverUrl("https://firebasestorage.googleapis.com/v0/b/crate.appspot.com/o/covers%2Fa.jpg?alt=media")).toBe(true);
    expect(isRemoteCoverUrl("/brand/logo-mark.svg")).toBe(false);
    expect(isRemoteCoverUrl("/static/media/electronic.hash.jpg")).toBe(false);
    expect(isRemoteCoverUrl("data:image/gif;base64,xx")).toBe(false);
  });

  test("coverResizeWidth buckets retina tiles", () => {
    expect(coverResizeWidth(40, 2)).toBe(80);
    expect(coverResizeWidth(168, 2)).toBe(336);
    expect(coverResizeWidth(960, 1)).toBe(960);
  });

  test("cloudflareImageUrl prefixes /cdn-cgi/image", () => {
    const src = "https://storage.googleapis.com/bucket/covers/a.jpg";
    expect(cloudflareImageUrl(src, { width: 336, quality: 72 })).toBe(
      "/cdn-cgi/image/width=336,height=336,fit=cover,quality=72,format=auto/https://storage.googleapis.com/bucket/covers/a.jpg"
    );
  });

  test("firebaseThumbUrl injects _WxW before extension", () => {
    expect(firebaseThumbUrl("https://storage.googleapis.com/b/covers/art.jpg", 300)).toBe(
      "https://storage.googleapis.com/b/covers/art_400x400.jpg"
    );
    expect(nearestFirebaseThumbSize(168)).toBe(200);
  });

  test("coverDisplayUrl default cf mode transforms storage URLs only", () => {
    const src = "https://storage.googleapis.com/b/covers/art.jpg";
    expect(coverDisplayUrl(src, { width: 168, dpr: 2, mode: "cf" })).toContain("/cdn-cgi/image/");
    expect(coverDisplayUrl("/brand/logo-mark.svg", { mode: "cf" })).toBe("/brand/logo-mark.svg");
    expect(coverDisplayUrl(src, { width: 168, mode: "off" })).toBe(src);
    expect(coverDisplayUrl(src, { width: 168, dpr: 2, mode: "firebase" })).toContain("_400x400.jpg");
  });

  test("coverSrcSet emits 1x and 2x buckets", () => {
    const src = "https://storage.googleapis.com/b/covers/art.jpg";
    const set = coverSrcSet(src, 168, { mode: "cf" });
    expect(set).toMatch(/ 1x/);
    expect(set).toMatch(/ 2x/);
    expect(coverSrcSet("/brand/logo-mark.svg", 168, { mode: "cf" })).toBe("");
  });

  test("one Cloudflare miss disables /cdn-cgi/image for the session", () => {
    const src = "https://storage.googleapis.com/b/covers/art.jpg";
    expect(isCloudflareResizeAvailable()).toBe(true);
    expect(coverDisplayUrl(src, { width: 168, mode: "cf" })).toContain("/cdn-cgi/image/");
    markCloudflareResizeUnavailable();
    expect(isCloudflareResizeAvailable()).toBe(false);
    expect(coverDisplayUrl(src, { width: 168, mode: "cf" })).toBe(src);
    expect(coverSrcSet(src, 168, { mode: "cf" })).toBe("");
  });
});
