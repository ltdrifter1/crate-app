import CoverImage, { coverSizeAttrs } from "./CoverImage";
import VirtualList from "./VirtualList";
import Icon, { TimedMixMark } from "./Icon";

describe("coverSizeAttrs", () => {
  it("returns square intrinsic dimensions", () => {
    expect(coverSizeAttrs(48)).toEqual({ width: 48, height: 48, sizes: "48px" });
  });
});

describe("ui modules", () => {
  it("exports CoverImage, VirtualList, Icon, TimedMixMark", () => {
    expect(typeof CoverImage).toBe("function");
    expect(typeof VirtualList).toBe("function");
    expect(typeof Icon).toBe("function");
    expect(typeof TimedMixMark).toBe("function");
  });
});
